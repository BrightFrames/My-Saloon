import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import './pages.css'
import CircularProgress from '@mui/material/CircularProgress'
import { motion, type Variants } from 'framer-motion'
import {
  Scissors,
  Plus,
  Clock,
  Home,
  RefreshCw,
  Edit2,
  Trash2,
  Percent,
  Tag,
  ToggleLeft,
  ToggleRight,
  CheckCircle2
} from 'lucide-react'

type Props = {
  user: any
  onLogout: () => void
}

type Service = {
  id: string
  name: string
  price: number
  originalPrice?: number
  discountedPrice?: number
  duration: string
  homeServiceAvailable?: boolean
  homeServicePrice?: number
  is_active?: boolean
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function ServicesPage({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'availability'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', originalPrice: '', discountedPrice: '', duration: '', homeServiceAvailable: false, homeServicePrice: '' });
  const submitLockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories are derived from live service data.

  // Availability state: serviceId -> enabled (true by default)
  const [availability, setAvailability] = useState<Record<string,boolean>>({});

  const toggleAvailability = async (s: Service) => {
    const currentStatus = availability[s.id] ?? (s.is_active ?? true);
    const newStatus = !currentStatus;

    // Optimistic UI update
    setAvailability(prev => ({ ...prev, [s.id]: newStatus }));
    setServices(prev => prev.map(item => item.id === s.id ? { ...item, is_active: newStatus } : item));

    try {
      const disc = Number(s.discountedPrice ?? (s as any).discounted_price ?? s.price ?? 0);
      const orig = Number(s.originalPrice ?? (s as any).original_price ?? s.price ?? disc);

      await api.updateService(s.id, {
        name: s.name,
        price: disc,
        originalPrice: orig,
        discountedPrice: disc,
        duration: s.duration || "30 min",
        is_active: newStatus,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update service availability.');
      setAvailability(prev => ({ ...prev, [s.id]: currentStatus }));
      setServices(prev => prev.map(item => item.id === s.id ? { ...item, is_active: currentStatus } : item));
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.getServices();
      const fetchedServices = res.data || [];
      setServices(fetchedServices);
      const availMap: Record<string, boolean> = {};
      fetchedServices.forEach((s: any) => {
        availMap[s.id] = s.is_active ?? true;
      });
      setAvailability(availMap);
    } catch (err) {
      console.error("Failed to fetch services", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreate = () => {
    setEditingService(null);
    setForm({ name: '', originalPrice: '', discountedPrice: '', duration: '', homeServiceAvailable: false, homeServicePrice: '' });
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    const orig = s.originalPrice !== undefined ? s.originalPrice : ((s as any).original_price !== undefined ? (s as any).original_price : s.price);
    const disc = s.discountedPrice !== undefined ? s.discountedPrice : ((s as any).discounted_price !== undefined ? (s as any).discounted_price : s.price);
    setForm({
      name: s.name,
      originalPrice: orig !== undefined && orig !== null ? String(orig) : '',
      discountedPrice: disc !== undefined && disc !== null ? String(disc) : '',
      duration: s.duration,
      homeServiceAvailable: !!s.homeServiceAvailable,
      homeServicePrice: s.homeServicePrice !== undefined && s.homeServicePrice !== null ? String(s.homeServicePrice) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceName = form.name.trim();
    if (!serviceName || !form.originalPrice || !form.discountedPrice || !form.duration) return alert('All fields are required.');
    
    const orig = parseFloat(form.originalPrice);
    const disc = parseFloat(form.discountedPrice);
    if (disc > orig) return alert('Discounted price cannot be greater than original price.');
    
    if (form.homeServiceAvailable) {
      if (!form.homeServicePrice) return alert('Home Service Price is required when Home Service is available.');
      if (parseFloat(form.homeServicePrice) < disc) return alert('Home Service Price must be at least equal to the discounted price.');
    }

    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = { 
        name: serviceName, 
        originalPrice: orig, 
        discountedPrice: disc, 
        price: disc, 
        duration: form.duration,
        homeServiceAvailable: form.homeServiceAvailable,
        homeServicePrice: form.homeServiceAvailable && form.homeServicePrice ? parseFloat(form.homeServicePrice) : undefined,
      };
      if (editingService) {
        await api.updateService(editingService.id, payload);
      } else {
        await api.createService(payload);
      }
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to save service.');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.deleteService(id);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to delete service.');
    }
  };

  return (
    <Layout user={user?.email || 'Admin'} onLogout={onLogout}>
      <motion.div
        className="page-root"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">
              <Scissors size={26} style={{ color: "#7C5CFC" }} />
              Salon Services
            </h1>
            <p className="page-sub">{services.length} services configured</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={fetchServices}>
              <RefreshCw size={15} /> Refresh
            </button>
            {activeTab === 'services' && (
              <button className="btn-add" onClick={openCreate}>
                <Plus size={16} /> Add Service
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div className="tab-bar" variants={itemVariants}>
          {([
            ['services',     'Services',    Scissors],
            ['categories',   'Categories',  Tag],
            ['availability', 'Availability',ToggleRight],
          ] as const).map(([t, label, Icon]) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? 'active' : ''}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </motion.div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          loading ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <CircularProgress sx={{ color: '#7C5CFC' }} size={36} />
              <p style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 600 }}>Loading services catalog...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <Scissors size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h3 style={{ color: 'var(--text-h)', margin: '0 0 4px 0' }}>No services configured yet</h3>
              <p style={{ color: 'var(--muted)' }}>Add your salon services to offer them to clients.</p>
            </div>
          ) : (
            <motion.div className="dash-table-wrap" variants={itemVariants}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Price Details</th>
                    <th>Discount Badge</th>
                    <th>Duration</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => {
                    const orig = Number(s.originalPrice ?? (s as any).original_price ?? s.price ?? 0);
                    const disc = Number(s.discountedPrice ?? (s as any).discounted_price ?? s.price ?? 0);
                    const hasDiscount = orig > disc;
                    const discountPercent = hasDiscount ? Math.round(((orig - disc) / orig) * 100) : 0;
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Scissors size={15} style={{ color: '#7C5CFC' }} />
                            {s.name}
                            {s.homeServiceAvailable && (
                              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', fontSize: 11 }}>
                                <Home size={11} /> Home Service
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {hasDiscount ? (
                            <div>
                              <span style={{ textDecoration: 'line-through', color: 'var(--muted)', marginRight: 8, fontSize: 12 }}>₹{orig}</span>
                              <span style={{ fontWeight: 800, color: '#10B981', fontSize: 15 }}>₹{disc}</span>
                            </div>
                          ) : (
                            <span style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: 15 }}>₹{disc || s.price}</span>
                          )}
                          {s.homeServiceAvailable && s.homeServicePrice && (
                            <div style={{ marginTop: 2, fontSize: 12, color: 'var(--muted)' }}>Home: ₹{s.homeServicePrice}</div>
                          )}
                        </td>
                        <td>
                          {hasDiscount ? (
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
                              <Percent size={12} /> {discountPercent}% OFF (₹{orig - disc} OFF)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Standard Price</span>
                          )}
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-h)' }}>
                            <Clock size={13} style={{ color: 'var(--muted)' }} />
                            {s.duration}
                          </span>
                        </td>
                        <td>
                          <div className="td-actions">
                            <button className="btn-sm" onClick={() => openEdit(s)}><Edit2 size={13} /> Edit</button>
                            <button className="btn-sm danger" onClick={() => handleDelete(s.id)}><Trash2 size={13} /> Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <motion.div variants={itemVariants}>
            {(() => {
              const palette = ['#7C5CFC', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
              const counts: Record<string, number> = {};
              services.forEach((s) => {
                const key = (s.name || 'Other').trim().charAt(0).toUpperCase() || 'O';
                counts[key] = (counts[key] || 0) + 1;
              });
              const categories = Object.entries(counts).map(([name, count], idx) => ({
                id: name,
                name,
                count,
                color: palette[idx % palette.length],
              }));

              if (categories.length === 0) {
                return (
                  <div className="empty-state" style={{ padding: 48 }}>
                    <Tag size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <h3>No service categories available</h3>
                    <p>Categories appear automatically from saved services.</p>
                  </div>
                );
              }

              return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {categories.map(cat => (
                <div key={cat.id} className="stat-card" style={{ borderTop: `3px solid ${cat.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: 15 }}>{cat.name}</span>
                  </div>
                  <span className="badge" style={{ background: 'rgba(124,92,252,0.1)', color: '#7C5CFC' }}>
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
              );
            })()}
          </motion.div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <motion.div variants={itemVariants}>
            {services.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <ToggleLeft size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>No services to manage</h3>
                <p>Add services first from the Services tab.</p>
              </div>
            ) : (
              <div className="dash-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Price</th>
                      <th>Duration</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(s => {
                      const enabled = availability[s.id] ?? true;
                      return (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-h)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Scissors size={14} style={{ color: '#7C5CFC' }} /> {s.name}
                            </div>
                          </td>
                          <td>₹{Number(s.discountedPrice ?? (s as any).discounted_price ?? s.price ?? 0)}</td>
                          <td>{s.duration}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${enabled ? 'confirmed' : 'cancelled'}`}>
                              {enabled ? <CheckCircle2 size={12} /> : null} {enabled ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => toggleAvailability(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: enabled ? '#10B981' : 'var(--muted)' }}>
                              {enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Service Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter service name"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label>Original Price (₹)</label>
                    <input
                      type="number"
                      value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                      placeholder="e.g. 600"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Discounted Price (₹)</label>
                    <input
                      type="number"
                      value={form.discountedPrice}
                      onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 45 min"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row' }}>
                  <input
                    type="checkbox"
                    id="homeService"
                    checked={form.homeServiceAvailable}
                    onChange={(e) => setForm({ ...form, homeServiceAvailable: e.target.checked })}
                    style={{ width: 'auto', marginBottom: 0 }}
                  />
                  <label htmlFor="homeService" style={{ marginBottom: 0 }}>Home Service Available</label>
                </div>
                {form.homeServiceAvailable && (
                  <div className="form-group">
                    <label>Home Service Price (₹)</label>
                    <input
                      type="number"
                      value={form.homeServicePrice}
                      onChange={(e) => setForm({ ...form, homeServicePrice: e.target.value })}
                      placeholder="e.g. 700"
                    />
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-add" disabled={isSubmitting}>
                    {isSubmitting ? (editingService ? 'Saving...' : 'Adding...') : editingService ? 'Save Changes' : 'Add Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}
