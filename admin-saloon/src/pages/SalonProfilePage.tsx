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
  const [showAddSalonModal, setShowAddSalonModal] = useState(false);
  const submitLockRef = useRef(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCreatingSalon, setIsCreatingSalon] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    starting_price: "",
    latitude: "",
    longitude: "",
  });
  const [addSalonForm, setAddSalonForm] = useState({
    name: "",
    city: "",
    starting_price: "",
    rating: "",
    latitude: "",
    longitude: "",
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

  const handleAddSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !addSalonForm.name ||
      !addSalonForm.city ||
      !addSalonForm.starting_price
    ) {
      alert("Salon Name, City, and Starting Price are required.");
      return;
    }
    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setIsCreatingSalon(true);

    try {
      await api.createSalonProfile({
        name: addSalonForm.name,
        city: addSalonForm.city,
        starting_price: parseFloat(addSalonForm.starting_price),
        rating: addSalonForm.rating
          ? parseFloat(addSalonForm.rating)
          : undefined,
        latitude: addSalonForm.latitude
          ? parseFloat(addSalonForm.latitude)
          : undefined,
        longitude: addSalonForm.longitude
          ? parseFloat(addSalonForm.longitude)
          : undefined,
      });

      setShowAddSalonModal(false);
      setAddSalonForm({
        name: "",
        city: "",
        starting_price: "",
        rating: "",
        latitude: "",
        longitude: "",
      });
      alert("Salon created successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create salon.");
    } finally {
      submitLockRef.current = false;
      setIsCreatingSalon(false);
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
              <button
                className="btn-sm"
                onClick={() => setShowAddSalonModal(true)}
              >
                + Add Salon
              </button>
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
              </div>
            )}
          </div>
        )}

        {showAddSalonModal && (
          <div
            className="modal-backdrop"
            onClick={() => setShowAddSalonModal(false)}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>Add Salon</h2>
              <form onSubmit={handleAddSalon}>
                <div className="form-group">
                  <label>Salon Name</label>
                  <input
                    value={addSalonForm.name}
                    onChange={(e) =>
                      setAddSalonForm({ ...addSalonForm, name: e.target.value })
                    }
                    placeholder="The Aura Collective"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    value={addSalonForm.city}
                    onChange={(e) =>
                      setAddSalonForm({ ...addSalonForm, city: e.target.value })
                    }
                    placeholder="New York"
                  />
                </div>
                <div className="form-group">
                  <label>Starting Price (₹)</label>
                  <input
                    type="number"
                    value={addSalonForm.starting_price}
                    onChange={(e) =>
                      setAddSalonForm({
                        ...addSalonForm,
                        starting_price: e.target.value,
                      })
                    }
                    placeholder="85"
                  />
                </div>
                <div className="form-group">
                  <label>Rating (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={addSalonForm.rating}
                    onChange={(e) =>
                      setAddSalonForm({
                        ...addSalonForm,
                        rating: e.target.value,
                      })
                    }
                    placeholder="4.9"
                  />
                </div>
                <div className="form-group">
                  <label>Location Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={addSalonForm.latitude}
                    onChange={(e) =>
                      setAddSalonForm({
                        ...addSalonForm,
                        latitude: e.target.value,
                      })
                    }
                    placeholder="40.7128"
                  />
                </div>
                <div className="form-group">
                  <label>Location Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={addSalonForm.longitude}
                    onChange={(e) =>
                      setAddSalonForm({
                        ...addSalonForm,
                        longitude: e.target.value,
                      })
                    }
                    placeholder="-74.0060"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowAddSalonModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-add" disabled={isCreatingSalon}>
                    {isCreatingSalon ? "Creating..." : "Save Salon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
