import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import { API_BASE_URL } from "../services/apiBase";
import "./pages.css";
import CircularProgress from '@mui/material/CircularProgress';

type Props = {
  user: any;
  onLogout: () => void;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  experience?: string;
  image_url?: string;
  service_ids?: string[];
};

export default function TeamPage({ user, onLogout }: Props) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const submitLockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    experience: "",
    image_url: "",
    service_ids: [] as string[],
  });

  const [services, setServices] = useState<any[]>([]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.getTeam();
      setTeam(res.data || []);
    } catch (err) {
      console.error("Failed to fetch team", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    const fetchServices = async () => {
      try {
        const res = await api.getServices();
        setServices(res.data || []);
      } catch (err) {
        console.error("Failed to fetch services", err);
      }
    };
    fetchServices();
  }, []);

  const openCreate = () => {
    setEditingMember(null);
    setForm({ name: "", role: "", experience: "", image_url: "", service_ids: [] });
    setShowModal(true);
  };

  const openEdit = (t: TeamMember) => {
    setEditingMember(t);
    setForm({
      name: t.name,
      role: t.role,
      experience: t.experience || "",
      image_url: t.image_url || "",
      service_ids: t.service_ids || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role) return alert("Name and role are required.");
    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = { ...form };
      if (editingMember) {
        await api.updateTeamMember(editingMember.id, payload);
      } else {
        await api.createTeamMember(payload);
      }
      setShowModal(false);
      fetchTeam();
    } catch (err: any) {
      alert(err.message || "Failed to save team member.");
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setForm((f) => ({ ...f, image_url: data.data.url }));
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (err) {
      alert("Upload error. Check your connection.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this team member?"))
      return;
    try {
      await api.deleteTeamMember(id);
      fetchTeam();
    } catch (err: any) {
      alert(err.message || "Failed to delete team member.");
    }
  };

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="page-root container">
        <div className="page-header">
          <div>
            <h1>Team Members</h1>
            <div className="subtitle">
              {team.length} staff members in your salon
            </div>
          </div>
          <button className="btn-add" onClick={openCreate}>
            + Add Team Member
          </button>
        </div>

        {loading ? (
          <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CircularProgress sx={{ color: '#CA9A86' }} size={40} />
            <p style={{ color: '#7f6f69', fontWeight: 500 }}>Loading team members...</p>
          </div>
        ) : team.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No team members yet</h3>
            <p>Your team members will appear here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Experience</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td>
                    <span className={`badge ${t.role}`}>{t.role}</span>
                  </td>
                  <td>{t.experience || "-"}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-sm" onClick={() => openEdit(t)}>
                        Edit
                      </button>
                      <button
                        className="btn-sm danger"
                        onClick={() => handleDelete(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>{editingMember ? "Edit Team Member" : "Add Team Member"}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Senior Stylist"
                  />
                </div>
                <div className="form-group">
                  <label>Experience</label>
                  <input
                    value={form.experience}
                    onChange={(e) =>
                      setForm({ ...form, experience: e.target.value })
                    }
                    placeholder="e.g. 5 Years"
                  />
                </div>
                <div className="form-group">
                  <label>Photo (Optional)</label>
                  {/* Photo preview */}
                  {form.image_url && (
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={form.image_url}
                        alt="Preview"
                        style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '2px solid #e7dbd7' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image_url: '' })}
                        style={{ fontSize: 12, color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                  {/* Upload button */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {isUploading ? 'Uploading...' : '📷 Upload Photo'}
                    </button>
                    <span style={{ fontSize: 12, color: '#999' }}>or paste URL below</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>Services (select multiple)</label>
                  <select
                    multiple
                    value={form.service_ids}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      );
                      setForm({ ...form, service_ids: opts });
                    }}
                    style={{ minHeight: 120 }}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-add" disabled={isSubmitting}>
                    {isSubmitting ? (editingMember ? "Saving..." : "Adding...") : editingMember ? "Save Changes" : "Add Member"}
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
