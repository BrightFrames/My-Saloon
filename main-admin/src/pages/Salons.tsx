import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";

export default function Salons() {
  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [salons, setSalons] = useState<any[]>([]);
  const [editingSalonId, setEditingSalonId] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const submittingSalonRef = useRef(false);
  const [isSubmittingSalon, setIsSubmittingSalon] = useState(false);

  const submittingAdminRef = useRef(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // Salon state
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    starting_price: 50,
    latitude: "",
    longitude: "",
    google_maps_link: "",
    phone: "",
    email: "",
    image: "",
    description: "",
  });

  // Admin state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSalonId, setAdminSalonId] = useState("");

  const VITE_BACKEND_URL = "http://localhost:3000/api/v1";

  const fetchSalons = async () => {
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/salons`);
      const json = await res.json();
      if (json.success) {
        setSalons(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  const openCreate = () => {
    setEditingSalonId(null);
    setForm({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      starting_price: 50,
      latitude: "",
      longitude: "",
      google_maps_link: "",
      phone: "",
      email: "",
      image: "",
      description: "",
    });
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditingSalonId(s.id);
    setForm({
      name: s.name || "",
      address: s.address || "",
      city: s.city || "",
      state: s.state || "",
      country: s.country || "",
      starting_price: s.starting_price || 50,
      latitude: s.latitude || "",
      longitude: s.longitude || "",
      google_maps_link: s.google_maps_link || "",
      phone: s.phone || "",
      email: s.email || "",
      image: s.image || "",
      description: s.description || "",
    });
    setShowModal(true);
  };

  const handleCreateOrUpdate = async () => {
    if (submittingSalonRef.current) return;
    submittingSalonRef.current = true;
    setIsSubmittingSalon(true);
    try {
      const payload = {
        ...form,
        starting_price: Number(form.starting_price),
        latitude: form.latitude ? Number(form.latitude) : 0,
        longitude: form.longitude ? Number(form.longitude) : 0,
      };

      const method = editingSalonId ? "PUT" : "POST";
      const endpoint = editingSalonId
        ? `${VITE_BACKEND_URL}/admin/salons/${editingSalonId}`
        : `${VITE_BACKEND_URL}/admin/salons`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("superadmin_token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        fetchSalons();
      } else {
        const json = await res.json();
        alert("Failed to save salon: " + (json.message || "Error"));
      }
    } catch (e) {
      console.error(e);
    }
    finally {
      submittingSalonRef.current = false;
      setIsSubmittingSalon(false);
    }
  };

  const handleResolveLocation = async () => {
    const query = [form.address, form.city, form.state, form.country]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(", ");

    if (!query) {
      alert("Please enter at least an address or city first.");
      return;
    }

    try {
      setIsResolvingLocation(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to resolve location");
      }

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        alert("No matching location was found. Try a more specific address.");
        return;
      }

      const resolved = results[0];
      setForm({
        ...form,
        latitude: resolved.lat || "",
        longitude: resolved.lon || "",
      });
    } catch (error: any) {
      alert(error.message || "Failed to resolve location.");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this salon?")) return;
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/admin/salons/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superadmin_token")}`,
        },
      });
      if (res.ok) {
        fetchSalons();
      } else {
        const json = await res.json();
        alert("Failed to delete salon: " + (json.message || "Error"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAdmin = async () => {
    if (submittingAdminRef.current) return;
    submittingAdminRef.current = true;
    setIsSubmittingAdmin(true);
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/auth/create-salon-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("superadmin_token")}`,
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          salon_id: adminSalonId,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        alert("Admin created successfully!");
        setShowAdminModal(false);
        setAdminEmail("");
        setAdminPassword("");
        setAdminSalonId("");
      } else {
        alert("Failed to create admin: " + (json.message || "Error"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      submittingAdminRef.current = false;
      setIsSubmittingAdmin(false);
    }
  };

  return (
    <Layout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "#111" }}>Manage Salons</h1>
        <button
          onClick={openCreate}
          style={{
            background: "#000",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          + Add New Salon
        </button>
      </div>

      <div
        style={{
          marginTop: "30px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #eee",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            color: "#111",
          }}
        >
          <thead
            style={{ background: "#f5f5f5", borderBottom: "1px solid #eee" }}
          >
            <tr>
              <th style={{ padding: "15px 20px" }}>Name</th>
              <th style={{ padding: "15px 20px" }}>City/State</th>
              <th style={{ padding: "15px 20px" }}>Contact</th>
              <th style={{ padding: "15px 20px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salons.length > 0 ? (
              salons.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "15px 20px" }}>
                    <strong>{s.name}</strong>
                  </td>
                  <td style={{ padding: "15px 20px" }}>
                    {s.city}
                    {s.state ? `, ${s.state}` : ""}
                  </td>
                  <td style={{ padding: "15px 20px" }}>
                    {s.email && <div>{s.email}</div>}
                    {s.phone && <div>{s.phone}</div>}
                  </td>
                  <td style={{ padding: "15px 20px" }}>
                    <button
                      onClick={() => {
                        setAdminSalonId(s.id);
                        setShowAdminModal(true);
                      }}
                      style={{
                        background: "#CA9A86",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#fff",
                        marginRight: "5px",
                      }}
                    >
                      + Create Admin
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      style={{
                        background: "transparent",
                        border: "1px solid #ccc",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#111",
                        marginRight: "5px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{
                        background: "#a00",
                        color: "#fff",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  style={{ padding: "15px 20px", textAlign: "center" }}
                >
                  No salons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            overflowY: "auto",
            padding: "20px 0",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "12px",
              width: "500px",
              margin: "auto",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#111" }}>
              {editingSalonId ? "Edit Salon" : "Add New Salon"}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginTop: "20px",
              }}
            >
              <input
                placeholder="Salon Name*"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                  gridColumn: "span 2",
                }}
              />
              <input
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                  gridColumn: "span 2",
                }}
              />
              <input
                placeholder="City*"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <input
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <input
                placeholder="Country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <input
                placeholder="Starting Price*"
                type="number"
                value={form.starting_price}
                onChange={(e) =>
                  setForm({ ...form, starting_price: e.target.value as any })
                }
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <input
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <input
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) =>
                  setForm({ ...form, longitude: e.target.value })
                }
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <button
                type="button"
                onClick={handleResolveLocation}
                disabled={isResolvingLocation}
                style={{
                  gridColumn: "span 2",
                  background: "#f5f5f5",
                  border: "1px solid #ccc",
                  color: "#111",
                  padding: "10px",
                  borderRadius: "6px",
                  cursor: isResolvingLocation ? "not-allowed" : "pointer",
                }}
              >
                {isResolvingLocation ? "Resolving Location..." : "Auto-fill Coordinates from Address"}
              </button>
              <input
                placeholder="Google Maps Link"
                value={form.google_maps_link}
                onChange={(e) =>
                  setForm({ ...form, google_maps_link: e.target.value })
                }
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                  gridColumn: "span 2",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                  gridColumn: "span 2",
                }}
              >
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={isSubmittingSalon}
                  style={{
                    flex: 1,
                    background: isSubmittingSalon ? "#666" : "#000",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: isSubmittingSalon ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmittingSalon ? "Saving..." : "Save Salon"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    background: "#fff",
                    color: "#111",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "12px",
              width: "400px",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#111" }}>Create Salon Admin</h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginTop: "20px",
              }}
            >
              <input
                placeholder="Admin Email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <input
                placeholder="Password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                style={{
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  width: "100%",
                  boxSizing: "border-box",
                  color: "#111",
                }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  onClick={handleCreateAdmin}
                  disabled={isSubmittingAdmin}
                  style={{
                    flex: 1,
                    background: "#000",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: isSubmittingAdmin ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmittingAdmin ? "Creating..." : "Create Account"}
                </button>
                <button
                  onClick={() => setShowAdminModal(false)}
                  style={{
                    flex: 1,
                    background: "#fff",
                    color: "#111",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
