/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
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
  Camera,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle2,
  Minus
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
  is_active?: boolean;
};

function getInitials(name?: string) {
  if (!name) return "T";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function formatLeaveTime(value?: string) {
  if (!value) return "—";
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return trimmed;

  let hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function TeamPage({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'staff' | 'schedule' | 'performance' | 'leave'>('staff');
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
  const [bookingStatsByStylist, setBookingStatsByStylist] = useState<Record<string, {
    bookings: number;
    revenue: number;
  }>>({});

  // Schedule state
  const [schedule, setSchedule] = useState<Record<string, Record<string, boolean>>>(() => ({}));

  // Leave state
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveForm, setLeaveForm] = useState({
    staffId: '',
    staffName: '',
    leaveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '',
    endTime: '',
    isFullDay: true,
    leaveType: 'full_day',
    reason: '',
  });
  const [showLeaveForm, setShowLeaveForm] = useState(false);

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

  const fetchLeaves = async () => {
    try {
      const res = await api.getStaffLeaves();
      setLeaves(res.data || []);
    } catch (err) {
      console.error("Failed to fetch staff leaves", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeam();
    fetchLeaves();
    const fetchServices = async () => {
      try {
        const res = await api.getServices();
        setServices(res.data || []);
      } catch (err) {
        console.error("Failed to fetch services", err);
      }
    };
    fetchServices();
    const fetchPerformance = async () => {
      try {
        const res = await api.getBookings({ limit: 500 });
        const rows = Array.isArray(res?.data) ? res.data : [];
        const aggregate: Record<string, { bookings: number; revenue: number }> = {};

        rows.forEach((b: any) => {
          const key = String(b.stylist || "").trim().toLowerCase();
          if (!key) return;
          if (!aggregate[key]) {
            aggregate[key] = { bookings: 0, revenue: 0 };
          }
          aggregate[key].bookings += 1;
          aggregate[key].revenue += Number(b.total_price || 0);
        });
        setBookingStatsByStylist(aggregate);
      } catch (err) {
        console.error("Failed to fetch performance data", err);
      }
    };
    fetchPerformance();
  }, []);

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

  const openCreate = () => {
    setEditingMember(null);
    setForm({
      name: "",
      role: "",
      experience: "",
      image_url: "",
      service_ids: [],
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

  const toggleStaffActive = async (t: TeamMember) => {
    try {
      const currentActive = t.is_active ?? true;
      await api.updateTeamMember(t.id, { is_active: !currentActive });
      fetchTeam();
    } catch (err: any) {
      alert(err.message || "Failed to update staff status.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadFile(file);
      if (res.success && res.data?.url) {
        setForm((f) => ({ ...f, image_url: res.data.url }));
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

  const toggleSchedule = (memberId: string, day: string) => {
    setSchedule(prev => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || {}),
        [day]: !(prev[memberId]?.[day])
      }
    }));
  };

  const handleAddLeave = async () => {
    if (!leaveForm.leaveDate) return alert("Please select a leave date.");
    try {
      const member = team.find(t => t.id === leaveForm.staffId);
      await api.createStaffLeave({
        team_member_id: leaveForm.staffId || undefined,
        staff_name: member?.name || leaveForm.staffName || undefined,
        leave_date: leaveForm.leaveDate,
        end_date: leaveForm.endDate || leaveForm.leaveDate,
        start_time: leaveForm.isFullDay ? undefined : leaveForm.startTime,
        end_time: leaveForm.isFullDay ? undefined : leaveForm.endTime,
        is_full_day: leaveForm.isFullDay,
        leave_type: leaveForm.leaveType,
        reason: leaveForm.reason || "Leave",
      });
      fetchLeaves();
      setShowLeaveForm(false);
      setLeaveForm({
        staffId: '',
        staffName: '',
        leaveDate: new Date().toISOString().split('T')[0],
        endDate: '',
        startTime: '',
        endTime: '',
        isFullDay: true,
        leaveType: 'full_day',
        reason: '',
      });
    } catch (err: any) {
      alert(err.message || "Failed to create staff leave.");
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (!window.confirm("Delete this leave record?")) return;
    try {
      await api.deleteStaffLeave(id);
      fetchLeaves();
    } catch (err: any) {
      alert(err.message || "Failed to delete leave.");
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
            {activeTab === 'staff' && (
              <button className="btn-add" onClick={openCreate}>
                <Plus size={16} /> Add Team Member
              </button>
            )}
            {activeTab === 'leave' && (
              <button className="btn-add" onClick={() => setShowLeaveForm(!showLeaveForm)}>
                <Plus size={16} /> {showLeaveForm ? "Cancel" : "Apply Staff Leave"}
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div className="tab-bar" variants={itemVariants}>
          {([
            ['staff',       'Staff List',    UserCheck],
            ['schedule',    'Schedule',      Calendar],
            ['performance', 'Performance',   BarChart3],
            ['leave',       'Leave & Availability', Clock],
          ] as const).map(([t, label, Icon]) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? 'active' : ''}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </motion.div>

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          loading ? (
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
                            <img src={t.image_url} alt={t.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} />
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
                      <td><span className="badge admin" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}><Award size={12} /> {t.role}</span></td>
                      <td style={{ fontWeight: 600 }}>{t.experience || "Entry Level"}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn-sm" onClick={() => openEdit(t)}><Edit2 size={13} /> Edit</button>
                          <button className="btn-sm danger" onClick={() => handleDelete(t.id)}><Trash2 size={13} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <motion.div variants={itemVariants}>
            {team.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <Calendar size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>No staff to schedule</h3>
                <p>Add staff members first from the Staff List tab.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 160 }}>Staff Member</th>
                      {DAYS.map(d => <th key={d} style={{ textAlign: 'center', minWidth: 70 }}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(member => (
                      <tr key={member.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar-circle" style={{ width: 32, height: 32, fontSize: 12, background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)' }}>
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)' }}>{member.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{member.role}</div>
                            </div>
                          </div>
                        </td>
                        {DAYS.map(day => {
                          const active = schedule[member.id]?.[day] ?? false;
                          return (
                            <td key={day} style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => toggleSchedule(member.id, day)}
                                style={{
                                  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                                  background: active ? 'rgba(16, 185, 129, 0.15)' : 'var(--border)',
                                  color: active ? '#10B981' : 'var(--muted)',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.18s'
                                }}
                                title={active ? 'Working' : 'Off'}
                              >
                                {active ? <CheckCircle2 size={16} /> : <Minus size={16} />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>Click a cell to toggle working day. Changes are saved locally per session.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <motion.div variants={itemVariants}>
            {team.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>No staff to evaluate</h3>
                <p>Add staff members first.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {team.map((member) => {
                  const perf = bookingStatsByStylist[String(member.name || '').trim().toLowerCase()] || {
                    bookings: 0,
                    revenue: 0,
                  };
                  return (
                    <motion.div key={member.id} className="stat-card" variants={itemVariants}
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar-circle" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)' }}>
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: 15 }}>{member.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{member.role}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Bookings', val: perf.bookings, color: '#7C5CFC' },
                          { label: 'Revenue', val: `₹${perf.revenue.toLocaleString()}`, color: '#10B981' },
                          { label: 'Avg Rating', val: 'N/A', color: '#EAB308' },
                          { label: 'Attendance', val: 'N/A', color: '#3B82F6' },
                        ].map(m => (
                          <div key={m.label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{m.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Leave / Availability Tab */}
        {activeTab === 'leave' && (
          <motion.div variants={itemVariants}>
            {showLeaveForm && (
              <div className="profile-card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} style={{ color: '#7C5CFC' }} /> Schedule / Apply Staff Leave
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Select Staff Member</label>
                    <select className="form-input" value={leaveForm.staffId} onChange={e => setLeaveForm(p => ({ ...p, staffId: e.target.value }))}>
                      <option value="">All Staff / Select Stylist</option>
                      {team.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Leave Type</label>
                    <select className="form-input" value={leaveForm.leaveType} onChange={e => {
                      const val = e.target.value;
                      setLeaveForm(p => ({
                        ...p,
                        leaveType: val,
                        isFullDay: val === 'full_day' || val === 'emergency'
                      }));
                    }}>
                      <option value="full_day">Full Day Leave</option>
                      <option value="hours">Partial Hours (Half Day)</option>
                      <option value="emergency">Emergency Leave</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Leave Date</label>
                    <input className="form-input" type="date" value={leaveForm.leaveDate} onChange={e => setLeaveForm(p => ({ ...p, leaveDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date (optional for multi-day)</label>
                    <input className="form-input" type="date" value={leaveForm.endDate} onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                  {!leaveForm.isFullDay && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Start Time</label>
                        <input
                          className="form-input"
                          type="time"
                          step={900}
                          value={leaveForm.startTime}
                          onChange={e => setLeaveForm(p => ({ ...p, startTime: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Time</label>
                        <input
                          className="form-input"
                          type="time"
                          step={900}
                          value={leaveForm.endTime}
                          onChange={e => setLeaveForm(p => ({ ...p, endTime: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Reason / Notes</label>
                    <input className="form-input" placeholder="e.g. Personal emergency, doctor appointment, annual leave" value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn-add" onClick={handleAddLeave}>Save Leave</button>
                  <button className="btn-outline" onClick={() => setShowLeaveForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Quick System Active Toggles */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-h)' }}>
                System Active/Inactive Toggle
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {team.map(member => {
                  const isActive = member.is_active ?? true;
                  return (
                    <div key={member.id} className="stat-card" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '12px 16px',
                      borderTop: `3px solid ${isActive ? '#10B981' : '#EF4444'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar-circle" style={{ width: 36, height: 36, fontSize: 12, background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)' }}>
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: 13 }}>{member.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{member.role}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleStaffActive(member)}
                        style={{
                          padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: isActive ? '#10B981' : '#EF4444',
                        }}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scheduled Staff Leaves List */}
            <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-h)' }}>
              Scheduled Staff Leaves ({leaves.length})
            </h4>
            {leaves.length === 0 ? (
              <div className="empty-state" style={{ padding: 36 }}>
                <Clock size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                <h3>No scheduled leaves</h3>
                <p style={{ fontSize: 13 }}>Use the "Apply Staff Leave" button above to add staff leave hours.</p>
              </div>
            ) : (
              <div className="dash-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Date</th>
                      <th>Timing / Duration</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-h)' }}>{l.staff_name || 'Staff'}</td>
                        <td style={{ fontWeight: 600 }}>{l.leave_date} {l.end_date && l.end_date !== l.leave_date ? `→ ${l.end_date}` : ''}</td>
                        <td>
                          {l.is_full_day ? (
                            <span className="badge pending">Full Day</span>
                          ) : (
                            <span style={{ fontWeight: 600, color: '#3B82F6' }}>
                              {formatLeaveTime(l.start_time)} - {formatLeaveTime(l.end_time)}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(124,92,252,0.1)', color: '#7C5CFC', textTransform: 'capitalize' }}>
                            {l.leave_type ? l.leave_type.replace('_', ' ') : 'Leave'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>{l.reason || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-sm danger" onClick={() => handleDeleteLeave(l.id)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
