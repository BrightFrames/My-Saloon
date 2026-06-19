import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import "./pages.css";

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
  });


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
          <div className="empty-state">
            <p>Loading profile...</p>
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
                  <label>Image URL (Optional)</label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="https://..."
                  />
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
                <div className="modal-actions" style={{ marginTop: "32px" }}>
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
              </div>
            )}
          </div>
        )}


      </div>
    </Layout>
  );
}
