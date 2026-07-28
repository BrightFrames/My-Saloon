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
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Change Password state
  const [pwdForm, setPwdForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdErrors, setPwdErrors] = useState<{ old?: string; new?: string; confirm?: string; general?: string }>({});
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErrors({});
    setPwdSuccess(null);

    const errors: typeof pwdErrors = {};
    if (!pwdForm.oldPassword) errors.old = "Old Password is required";
    if (!pwdForm.newPassword) {
      errors.new = "New Password is required";
    } else if (pwdForm.newPassword.length < 8) {
      errors.new = "Password must be at least 8 characters long";
    } else if (pwdForm.newPassword === pwdForm.oldPassword) {
      errors.new = "New password must be different from old password";
    }

    if (!pwdForm.confirmPassword) {
      errors.confirm = "Confirm Password is required";
    } else if (pwdForm.confirmPassword !== pwdForm.newPassword) {
      errors.confirm = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPwdErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.changePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword,
      });

      if (res.success) {
        setPwdSuccess("Password updated successfully! Logging out...");
        setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          onLogout();
        }, 2000);
      } else {
        setPwdErrors({ general: res.message || "Failed to update password" });
      }
    } catch (err: any) {
      setPwdErrors({ general: err.message || "Something went wrong while changing password" });
    } finally {
      setIsChangingPassword(false);
    }
  };
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    starting_price: "",
    latitude: "",
    longitude: "",
    google_maps_link: "",
    image: "",
    video: "",
    home_service_charge: "",
    about: "",
    opening_time: "09:00 AM",
    closing_time: "08:00 PM",
    slot_interval: "30",
    gallery: [] as string[],
  });

  const extractCoordsFromUrl = (url: string) => {
    if (!url) return null;
    const match =
      url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/destination=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/loc:(-?\d+\.\d+)\+(-?\d+\.\d+)/);
    if (match && match[1] && match[2]) {
      return { lat: match[1], lon: match[2] };
    }
    return null;
  };

  const handleGoogleMapsUrlChange = (urlVal: string) => {
    setForm((prev) => {
      const updated = { ...prev, google_maps_link: urlVal };
      const coords = extractCoordsFromUrl(urlVal);
      if (coords) {
        updated.latitude = coords.lat;
        updated.longitude = coords.lon;
      }
      return updated;
    });
  };

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setDetectingLocation(false);
        alert("Location coordinates auto-detected successfully!");
      },
      (error) => {
        setDetectingLocation(false);
        alert("Failed to detect location: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getSalonProfile();
      if (res.data) {
        setProfile(res.data);
        const hours = res.data.working_hours || {};
        const intervalVal = String(
          res.data.slot_interval || hours.slot_interval || 30
        );
        setForm({
          name: res.data.name || "",
          city: res.data.city || "",
          starting_price: String(res.data.starting_price || 0),
          latitude: String(res.data.latitude || ""),
          longitude: String(res.data.longitude || ""),
          google_maps_link: res.data.google_maps_link || "",
          image: res.data.image || "",
          video: res.data.video || "",
          home_service_charge: String(res.data.home_service_charge || 0),
          about: res.data.about || "",
          opening_time: hours.open || "09:00 AM",
          closing_time: hours.close || "08:00 PM",
          slot_interval: intervalVal,
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
        setForm((prev) => ({ ...prev, image: res.data.url }));
      }
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
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
        google_maps_link: form.google_maps_link || undefined,
        image: form.image || undefined,
        video: form.video || undefined,
        home_service_charge: parseFloat(form.home_service_charge) || 0,
        about: form.about || undefined,
        gallery: form.gallery,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        slot_interval: parseInt(form.slot_interval, 10) || 30,
        working_hours: {
          open: form.opening_time || "09:00 AM",
          close: form.closing_time || "08:00 PM",
          slot_interval: parseInt(form.slot_interval, 10) || 30,
        },
      });
      setIsEditing(false);
      fetchProfile();
      alert("Salon profile updated successfully!");
    } catch (err: any) {
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
                  <label>Salon Opening Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM"
                    value={form.opening_time}
                    onChange={(e) =>
                      setForm({ ...form, opening_time: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Salon Closing Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 PM"
                    value={form.closing_time}
                    onChange={(e) =>
                      setForm({ ...form, closing_time: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Slot Duration / Interval (Minutes)</label>
                  <select
                    value={form.slot_interval}
                    onChange={(e) =>
                      setForm({ ...form, slot_interval: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      outline: "none",
                      fontSize: "14px",
                      background: "#fff",
                    }}
                  >
                    <option value="15">15 Minutes</option>
                    <option value="20">20 Minutes</option>
                    <option value="30">30 Minutes (Default)</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes (1 Hour)</option>
                  </select>
                </div>

                {/* Salon Location Section */}
                <div style={{ background: "#fdfbf9", padding: "16px", borderRadius: "12px", border: "1px solid #e8dcc9", marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#6B554D", fontSize: "15px" }}>📍 Salon Location & Coordinates</h4>
                  
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label>Google Maps Link / Location URL</label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=28.6139,77.2090"
                      value={form.google_maps_link}
                      onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                    />
                    <small style={{ color: "#718096", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Paste your salon's Google Maps link here (coordinates will auto-extract if present).
                    </small>
                  </div>

                  <div className="form-group" style={{ marginBottom: "0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label style={{ margin: 0 }}>Location Coordinates (Latitude & Longitude)</label>
                      <button
                        type="button"
                        onClick={handleAutoDetectLocation}
                        disabled={detectingLocation}
                        style={{
                          background: "#6B554D",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        📍 {detectingLocation ? "Detecting Location..." : "Auto Detect My Location"}
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <input
                          type="text"
                          placeholder="Latitude e.g. 28.6139"
                          value={form.latitude}
                          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Longitude e.g. 77.2090"
                          value={form.longitude}
                          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Background Image</label>
                  {form.image && (
                    <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                      <img
                        src={form.image}
                        alt="Preview"
                        style={{ maxWidth: "200px", maxHeight: "120px", borderRadius: "8px", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        style={{ fontSize: 12, color: "#e74c3c", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
                      >
                        ❌ Remove Image
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage && <p style={{ fontSize: 12, color: "#CA9A86", marginTop: 4 }}>Uploading image...</p>}
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
                  <div className="field-label">Rating</div>
                  <div className="field-value">⭐ {profile.rating ? Number(profile.rating).toFixed(1) : "5.0"}</div>
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
                  <div className="field-label">Salon Opening Time</div>
                  <div className="field-value">⏰ {profile.working_hours?.open || form.opening_time || "09:00 AM"}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Salon Closing Time</div>
                  <div className="field-value">🌙 {profile.working_hours?.close || form.closing_time || "08:00 PM"}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Slot Duration / Interval</div>
                  <div className="field-value">⏱️ {profile.slot_interval || profile.working_hours?.slot_interval || form.slot_interval || 30} minutes</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Location Coordinates</div>
                  <div className="field-value">
                    📍 {profile.latitude && profile.longitude ? `${profile.latitude}, ${profile.longitude}` : "Not set"}
                  </div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Google Maps Link</div>
                  <div className="field-value">
                    {profile.google_maps_link ? (
                      <a href={profile.google_maps_link} target="_blank" rel="noreferrer" style={{ color: "#6B554D", fontWeight: 600, textDecoration: "underline" }}>
                        🔗 Open Google Maps Link
                      </a>
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>

                {/* About Salon Block */}
                <div className="profile-field block-field">
                  <div className="field-label">About Salon</div>
                  <div className="field-value" style={{ whiteSpace: "pre-line" }}>
                    {profile.about || "No description set yet."}
                  </div>
                </div>

                {/* Gallery Block */}
                <div className="profile-field block-field">
                  <div className="field-label">Gallery ({profile.gallery?.length || 0})</div>
                  <div className="field-value" style={{ background: "transparent", border: "none", padding: 0 }}>
                    {profile.gallery && profile.gallery.length > 0 ? (
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
                        {profile.gallery.map((url: string, idx: number) => (
                          <img key={idx} src={url} alt={`Gallery ${idx}`} style={{ width: "110px", height: "100px", objectFit: "cover", borderRadius: "10px", border: "1px solid #e8dcc9" }} />
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#888", fontStyle: "italic" }}>No gallery images uploaded</span>
                    )}
                  </div>
                </div>

                {/* Background Image & Video Block */}
                {profile.image && (
                  <div className="profile-field block-field">
                    <div className="field-label">Salon Background Image</div>
                    <div className="field-value" style={{ background: "transparent", border: "none", padding: 0 }}>
                      <img
                        src={profile.image}
                        alt="Salon"
                        style={{ maxWidth: "100%", maxHeight: "240px", borderRadius: "12px", objectFit: "cover" }}
                      />
                    </div>
                  </div>
                )}
                {profile.video && (
                  <div className="profile-field block-field">
                    <div className="field-label">Salon Video</div>
                    <div className="field-value" style={{ background: "transparent", border: "none", padding: 0 }}>
                      <video
                        src={profile.video}
                        controls
                        style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "12px" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Change Password Section ─── */}
        <div className="profile-card" style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "var(--heading)" }}>
            Change Password
          </h2>

          {pwdSuccess && (
            <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#ecfdf5", color: "#047857", marginBottom: "16px", fontSize: "14px", border: "1px solid #a7f3d0" }}>
              {pwdSuccess}
            </div>
          )}

          {pwdErrors.general && (
            <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#fef2f2", color: "#b91c1c", marginBottom: "16px", fontSize: "14px", border: "1px solid #fecaca" }}>
              {pwdErrors.general}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "var(--muted)" }}>
                Old Password *
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showOldPwd ? "text" : "password"}
                  value={pwdForm.oldPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                  placeholder="Enter old password"
                  style={{ width: "100%", paddingRight: "40px", padding: "10px 40px 10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--panel-bg)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPwd(!showOldPwd)}
                  style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}
                >
                  {showOldPwd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {pwdErrors.old && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{pwdErrors.old}</span>}
            </div>

            <div className="form-group">
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "var(--muted)" }}>
                New Password *
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showNewPwd ? "text" : "password"}
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  placeholder="Min 8 characters"
                  style={{ width: "100%", paddingRight: "40px", padding: "10px 40px 10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--panel-bg)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}
                >
                  {showNewPwd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {pwdErrors.new && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{pwdErrors.new}</span>}
            </div>

            <div className="form-group">
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "var(--muted)" }}>
                Confirm New Password *
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showConfirmPwd ? "text" : "password"}
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  style={{ width: "100%", paddingRight: "40px", padding: "10px 40px 10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--panel-bg)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}
                >
                  {showConfirmPwd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {pwdErrors.confirm && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>{pwdErrors.confirm}</span>}
            </div>

            <div style={{ marginTop: "12px" }}>
              <button
                type="submit"
                className="btn-add"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>


      </div>
    </Layout>
  );
}
