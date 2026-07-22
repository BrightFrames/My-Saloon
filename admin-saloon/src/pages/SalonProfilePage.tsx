import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import "./pages.css";
import CircularProgress from '@mui/material/CircularProgress';

type Props = {
  user: any;
  onLogout: () => void;
};

export default function SalonProfilePage({ user, onLogout }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const submitLockRef = useRef(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    starting_price: "",
    latitude: "",
    longitude: "",
    image: "",
    video: "",
    home_service_charge: "",
    about: "",
    gallery: [] as string[],
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getSalonProfile();
      if (res.data) {
        setProfile(res.data);
        setForm({
          name: res.data.name || "",
          city: res.data.city || "",
          starting_price: String(res.data.starting_price || 0),
          latitude: String(res.data.latitude || ""),
          longitude: String(res.data.longitude || ""),
          image: res.data.image || "",
          video: res.data.video || "",
          home_service_charge: String(res.data.home_service_charge || 0),
          about: res.data.about || "",
          gallery: res.data.gallery || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setIsUploadingImage(true);
      const res = await api.uploadFile(e.target.files[0]);
      if (res.success && res.data.url) {
        setForm({ ...form, image: res.data.url });
      }
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const MAX_SIZE = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("Selected video is too large. Maximum allowed size is 200MB.");
      return;
    }

    try {
      setIsUploadingVideo(true);
      setVideoUploadProgress(0);
      setVideoUploadError(null);

      const res = await api.uploadFile(file, (percent) => {
        setVideoUploadProgress(percent);
      });

      if (res.success && res.data.url) {
        setForm((prev) => ({ ...prev, video: res.data.url }));
        setVideoUploadProgress(100);
      }
    } catch (err: any) {
      console.error("Failed to upload video:", err);
      const msg = err.message || "Video upload failed";
      setVideoUploadError(msg);
      alert("Failed to upload video: " + msg);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const removeVideo = () => {
    setForm((prev) => ({ ...prev, video: "" }));
    setVideoUploadProgress(0);
    setVideoUploadError(null);
    try {
      localStorage.removeItem("salon_local_video");
    } catch (e) {}
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setIsUploadingImage(true);
      const res = await api.uploadFile(e.target.files[0]);
      if (res.success && res.data.url) {
        setForm({ ...form, gallery: [...form.gallery, res.data.url] });
      }
    } catch (err: any) {
      alert("Failed to upload gallery image: " + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...form.gallery];
    newGallery.splice(index, 1);
    setForm({ ...form, gallery: newGallery });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.starting_price)
      return alert("Name, city, and starting price are required.");
    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSavingProfile(true);

    try {
      await api.updateSalonProfile({
        name: form.name,
        city: form.city,
        starting_price: parseFloat(form.starting_price),
        rating: profile?.rating
          ? parseFloat(String(profile.rating))
          : undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        image: form.image || undefined,
        video: form.video || undefined,
        home_service_charge: parseFloat(form.home_service_charge) || 0,
        about: form.about || undefined,
        gallery: form.gallery,
      });
      setIsEditing(false);
      fetchProfile();
      alert("Salon profile updated successfully!");
    } catch (err: any) {
      if (
        err.message?.includes("413") ||
        err.message?.toLowerCase().includes("payload too large") ||
        err.message?.toLowerCase().includes("file too large")
      ) {
        try {
          // Retry profile save excluding excessive base64 video string so name, city, price, about & gallery save cleanly
          await api.updateSalonProfile({
            name: form.name,
            city: form.city,
            starting_price: parseFloat(form.starting_price),
            rating: profile?.rating
              ? parseFloat(String(profile.rating))
              : undefined,
            latitude: form.latitude ? parseFloat(form.latitude) : undefined,
            longitude: form.longitude ? parseFloat(form.longitude) : undefined,
            image: form.image || undefined,
            video: undefined,
            home_service_charge: parseFloat(form.home_service_charge) || 0,
            about: form.about || undefined,
            gallery: form.gallery,
          });
          setIsEditing(false);
          alert(
            "Salon profile updated successfully! (Video URL kept in session preview due to host payload limits)",
          );
          return;
        } catch (retryErr: any) {
          alert(retryErr.message || "Failed to update profile.");
          return;
        }
      }
      alert(err.message || "Failed to update profile.");
    } finally {
      submitLockRef.current = false;
      setIsSavingProfile(false);
    }
  };



  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="page-root container">
        <div className="page-header">
          <div>
            <h1>Salon Profile</h1>
            <div className="subtitle">
              Manage your salon's public information
            </div>
          </div>
          {!isEditing && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-add" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CircularProgress sx={{ color: '#CA9A86' }} size={40} />
            <p style={{ color: '#7f6f69', fontWeight: 500 }}>Loading profile...</p>
          </div>
        ) : !profile ? (
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <h3>No Profile Found</h3>
            <p>Could not load salon profile data.</p>
          </div>
        ) : (
          <div className="profile-card">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Salon Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Starting Price (₹)</label>
                  <input
                    type="number"
                    value={form.starting_price}
                    onChange={(e) =>
                      setForm({ ...form, starting_price: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Home Service Charge Starting From (₹)</label>
                  <input
                    type="number"
                    value={form.home_service_charge}
                    onChange={(e) =>
                      setForm({ ...form, home_service_charge: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Background Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage && <p style={{fontSize: 12, color: '#CA9A86', marginTop: 4}}>Uploading...</p>}
                  {form.image && (
                    <img src={form.image} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px', borderRadius: '8px' }} />
                  )}
                </div>
                <div className="form-group">
                  <label>Salon Video (MP4/WebM, max 200MB)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={isUploadingVideo}
                  />
                  {isUploadingVideo && (
                    <div style={{ marginTop: "8px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#6B554D",
                          marginBottom: "4px",
                          fontWeight: 600,
                        }}
                      >
                        <span>Uploading video...</span>
                        <span>{videoUploadProgress}%</span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "#f0e6e2",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${videoUploadProgress}%`,
                            height: "100%",
                            backgroundColor: "#CA9A86",
                            transition: "width 0.2s ease-in-out",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {videoUploadError && (
                    <p style={{ fontSize: "12px", color: "#d9534f", marginTop: "4px" }}>
                      ❌ {videoUploadError}
                    </p>
                  )}

                  {form.video && (
                    <div style={{ marginTop: "10px" }}>
                      <video
                        src={form.video}
                        controls
                        style={{
                          maxWidth: "240px",
                          maxHeight: "150px",
                          borderRadius: "8px",
                          display: "block",
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeVideo}
                        style={{
                          marginTop: "6px",
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fca5a5",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        Remove Video
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Gallery Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    disabled={isUploadingImage}
                  />
                  {form.gallery && form.gallery.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                      {form.gallery.map((url, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <img src={url} alt={`Gallery ${idx}`} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer" }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Latitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm({ ...form, latitude: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Longitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) =>
                      setForm({ ...form, longitude: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>About Salon</label>
                  <textarea
                    value={form.about}
                    onChange={(e) => setForm({ ...form, about: e.target.value })}
                    placeholder="Tell customers about your salon..."
                    rows={4}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e5e5e5" }}
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: "32px", gridColumn: "1 / -1" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-add" disabled={isSavingProfile}>
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="profile-field">
                  <div className="field-label">Salon Name</div>
                  <div className="field-value">{profile.name}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">City</div>
                  <div className="field-value">{profile.city}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Starting Price</div>
                  <div className="field-value">₹{profile.starting_price}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Home Service Charge Starting From</div>
                  <div className="field-value">₹{profile.home_service_charge || 0}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">About Salon</div>
                  <div className="field-value" style={{ whiteSpace: "pre-line" }}>{profile.about || "Not set"}</div>
                </div>
                <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                  <div className="field-label">Gallery</div>
                  <div className="field-value">
                    {profile.gallery && profile.gallery.length > 0 ? (
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                        {profile.gallery.map((url: string, idx: number) => (
                          <img key={idx} src={url} alt={`Gallery ${idx}`} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                        ))}
                      </div>
                    ) : (
                      "No gallery images uploaded"
                    )}
                  </div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Rating</div>
                  <div className="field-value">{profile.rating} ⭐</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Location Coordinates</div>
                  <div className="field-value">
                    {profile.latitude && profile.longitude
                      ? `${profile.latitude}, ${profile.longitude}`
                      : "Not set"}
                  </div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Salon Image</div>
                  <div className="field-value">
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt="Salon"
                        style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", marginTop: "8px" }}
                      />
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Salon Video</div>
                  <div className="field-value">
                    {profile.video ? (
                      <video
                        src={profile.video}
                        controls
                        style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", marginTop: "8px" }}
                      />
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


      </div>
    </Layout>
  );
}
