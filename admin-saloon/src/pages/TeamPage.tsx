import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import { API_BASE_URL } from "../services/apiBase";
import "./pages.css";
import CircularProgress from '@mui/material/CircularProgress';
import { motion, type Variants } from 'framer-motion';
import {
  UserCheck,
  Plus,
  RefreshCw,
  Award,
  Edit2,
  Trash2,
  Camera
} from 'lucide-react';

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

function getInitials(name?: string) {
  if (!name) return "T";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
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
      <motion.div
        className="page-root"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">
              <UserCheck size={26} style={{ color: "#10B981" }} />
              Stylists & Staff
            </h1>
            <p className="page-sub">{team.length} staff members on team</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={fetchTeam}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="btn-add" onClick={openCreate}>
              <Plus size={16} /> Add Team Member
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <CircularProgress sx={{ color: '#10B981' }} size={36} />
            <p style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 600 }}>Loading team members...</p>
          </div>
        ) : team.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <UserCheck size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <h3 style={{ color: 'var(--text-h)', margin: '0 0 4px 0' }}>No team members added yet</h3>
            <p style={{ color: 'var(--muted)' }}>Add your hair stylists, barbers, and salon staff.</p>
          </div>
        ) : (
          <motion.div className="dash-table-wrap" variants={itemVariants}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Experience</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {t.image_url ? (
                          <img
                            src={t.image_url}
                            alt={t.name}
                            style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="avatar-circle" style={{ width: 40, height: 40, background: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)" }}>
                            {getInitials(t.name)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-h)' }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {t.service_ids?.length ? `${t.service_ids.length} assigned services` : 'All services'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge admin" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                        <Award size={12} /> {t.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{t.experience || "Entry Level"}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn-sm" onClick={() => openEdit(t)}>
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className="btn-sm danger"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
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
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Senior Stylist"
                    required
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
                  {form.image_url && (
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={form.image_url}
                        alt="Preview"
                        style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image_url: '' })}
                        style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Camera size={14} /> {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>or paste image URL</span>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ marginBottom: 0 }}>
                      Assignable Services {form.service_ids.length > 0 && `(${form.service_ids.length} selected)`}
                    </label>
                    {services.length > 0 && (
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#7C5CFC', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => {
                          if (form.service_ids.length === services.length) {
                            setForm({ ...form, service_ids: [] });
                          } else {
                            setForm({
                              ...form,
                              service_ids: services.map((s) => s.id),
                            });
                          }
                        }}
                      >
                        {form.service_ids.length === services.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    )}
                  </div>
                  <div className="services-checkbox-container">
                    {services.length === 0 ? (
                      <div style={{ padding: "12px", textAlign: "center", fontSize: "13px", color: "var(--muted)" }}>
                        No services available
                      </div>
                    ) : (
                      services.map((s) => {
                        const isChecked = form.service_ids.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            className={`service-checkbox-item ${isChecked ? "selected" : ""}`}
                            onClick={() => {
                              const updated = isChecked
                                ? form.service_ids.filter((id) => id !== s.id)
                                : [...form.service_ids, s.id];
                              setForm({ ...form, service_ids: updated });
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                            />
                            <span className="service-checkbox-name">{s.name}</span>
                            {s.price !== undefined && (
                              <span className="service-checkbox-price">₹{s.price}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
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
      </motion.div>
    </Layout>
  );
}
