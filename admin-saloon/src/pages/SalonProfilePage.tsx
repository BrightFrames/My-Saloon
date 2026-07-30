import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import "./pages.css";
import CircularProgress from '@mui/material/CircularProgress';
import { motion, type Variants } from 'framer-motion';
import {
  Award,
  MapPin,
  Clock,
  RefreshCw,
  Edit2,
  ExternalLink,
  Building2
} from 'lucide-react';

type Props = {
  user: any;
  onLogout: () => void;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function SalonProfilePage({ user, onLogout }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const submitLockRef = useRef(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setIsUploadingImage(true);
      const res = await api.uploadFile(e.target.files[0]);
      if (res.success && res.data.url) {
        setForm((prev) => ({ ...prev, gallery: [...prev.gallery, res.data.url] }));
      }
    } catch (err: any) {
      alert("Failed to upload gallery image: " + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm((prev) => {
      const newGallery = [...prev.gallery];
      newGallery.splice(index, 1);
      return { ...prev, gallery: newGallery };
    });
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
      <motion.div
        className="page-root"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">
              <Award size={26} style={{ color: "#F59E0B" }} />
              Salon Profile
            </h1>
            <p className="page-sub">Manage public business details, location, hours, & media.</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={fetchProfile}>
              <RefreshCw size={15} /> Refresh
            </button>
            {!isEditing && (
              <button className="btn-add" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit Profile
              </button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <CircularProgress sx={{ color: '#F59E0B' }} size={36} />
            <p style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 600 }}>Loading profile...</p>
          </div>
        ) : !profile ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <Building2 size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <h3 style={{ color: 'var(--text-h)', margin: '0 0 4px 0' }}>No profile data found</h3>
            <p style={{ color: 'var(--muted)' }}>Could not load salon profile details.</p>
          </div>
        ) : (
          <motion.div className="profile-card" variants={itemVariants}>
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="form-group">
                    <label>Salon Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      required
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
                      required
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
                    <label>Opening Time</label>
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
                    <label>Closing Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 08:00 PM"
                      value={form.closing_time}
                      onChange={(e) =>
                        setForm({ ...form, closing_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Slot Interval (Minutes)</label>
                    <select
                      value={form.slot_interval}
                      onChange={(e) =>
                        setForm({ ...form, slot_interval: e.target.value })
                      }
                    >
                      <option value="15">15 Minutes</option>
                      <option value="20">20 Minutes</option>
                      <option value="30">30 Minutes (Default)</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes (1 Hour)</option>
                    </select>
                  </div>
                </div>

                {/* Location Section */}
                <div style={{ background: "rgba(124, 92, 252, 0.05)", padding: 18, borderRadius: 16, border: "1px solid var(--border)", margin: "20px 0" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--text-h)", fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={16} style={{ color: "#7C5CFC" }} /> Location & Coordinates
                  </h4>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>Google Maps Link</label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=28.6139,77.2090"
                      value={form.google_maps_link}
                      onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ margin: 0, fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Coordinates (Lat, Lon)</label>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={handleAutoDetectLocation}
                      disabled={detectingLocation}
                      style={{ fontSize: 12 }}
                    >
                      <MapPin size={13} /> {detectingLocation ? "Detecting..." : "Auto Detect Location"}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Latitude e.g. 28.6139"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Longitude e.g. 77.2090"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    />
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="form-group">
                  <label>Background Cover Image</label>
                  {form.image && (
                    <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                      <img
                        src={form.image}
                        alt="Cover"
                        style={{ maxWidth: 200, maxHeight: 100, borderRadius: 12, objectFit: "cover" }}
                      />
                      <button type="button" onClick={removeImage} className="btn-sm danger">
                        Remove
                      </button>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                </div>

                {/* Video Upload */}
                <div className="form-group">
                  <label>Salon Video (MP4, max 200MB)</label>
                  {form.video && (
                    <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                      <video src={form.video} controls style={{ maxWidth: 240, maxHeight: 120, borderRadius: 12 }} />
                      <button type="button" onClick={removeVideo} className="btn-sm danger">
                        Remove Video
                      </button>
                    </div>
                  )}
                  <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={isUploadingVideo} />
                  {isUploadingVideo && <p style={{ fontSize: 12, color: "#7C5CFC", marginTop: 4 }}>Uploading video ({videoUploadProgress}%)...</p>}
                  {videoUploadError && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{videoUploadError}</p>}
                </div>

                {/* Gallery Images Upload */}
                <div className="form-group">
                  <label>Gallery Images</label>
                  <input type="file" accept="image/*" onChange={handleGalleryUpload} disabled={isUploadingImage} />
                  {form.gallery && form.gallery.length > 0 && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      {form.gallery.map((url, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <img src={url} alt={`Gallery ${idx}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10 }} />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            style={{ position: "absolute", top: -6, right: -6, background: "#EF4444", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>About Salon</label>
                  <textarea
                    value={form.about}
                    onChange={(e) => setForm({ ...form, about: e.target.value })}
                    placeholder="Describe your salon, specialty services, ambiance..."
                    rows={4}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: 24 }}>
                  <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
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
                  <div className="field-value" style={{ color: "#EAB308" }}>⭐ {profile.rating ? Number(profile.rating).toFixed(1) : "5.0"}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Starting Price</div>
                  <div className="field-value" style={{ color: "#10B981" }}>₹{profile.starting_price}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Home Service Charge</div>
                  <div className="field-value">₹{profile.home_service_charge || 0}</div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Working Hours</div>
                  <div className="field-value">
                    <Clock size={14} style={{ display: "inline", marginRight: 6 }} />
                    {profile.working_hours?.open || form.opening_time || "09:00 AM"} – {profile.working_hours?.close || form.closing_time || "08:00 PM"} ({profile.slot_interval || 30} min slots)
                  </div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Coordinates</div>
                  <div className="field-value">
                    <MapPin size={14} style={{ display: "inline", marginRight: 6 }} />
                    {profile.latitude && profile.longitude ? `${profile.latitude}, ${profile.longitude}` : "Not set"}
                  </div>
                </div>
                <div className="profile-field">
                  <div className="field-label">Google Maps Link</div>
                  <div className="field-value">
                    {profile.google_maps_link ? (
                      <a href={profile.google_maps_link} target="_blank" rel="noreferrer" style={{ color: "#7C5CFC", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        View on Google Maps <ExternalLink size={13} />
                      </a>
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>About Salon</div>
                  <div style={{ fontSize: 14, color: "var(--text-h)", background: "var(--bg)", padding: 16, borderRadius: 14, border: "1px solid var(--border)", lineHeight: 1.6 }}>
                    {profile.about || "No description written yet."}
                  </div>
                </div>

                {profile.image && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Cover Background Image</div>
                    <img
                      src={profile.image}
                      alt="Salon Cover"
                      style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 16, objectFit: "cover", border: "1px solid var(--border)" }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

      </motion.div>
    </Layout>
  );
}
