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
  Percent
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
}

const SERVICE_OPTIONS = [
  'Signature Haircut',
  'Premium Balayage',
  'Signature Silk Facial',
  'Keratin Treatment',
  'Haircut',
  'Beard Trim',
  'Hair Color',
  'Hair Spa',
  'Facial',
  'Threading',
  'Waxing',
  'Manicure',
  'Pedicure',
  'Massage',
  'Bridal Package',
  'Kids Haircut',
];

const CUSTOM_SERVICE_VALUE = '__custom__';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function ServicesPage({ user, onLogout }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', originalPrice: '', discountedPrice: '', duration: '', homeServiceAvailable: false, homeServicePrice: '' });
  const [customServiceName, setCustomServiceName] = useState('');
  const submitLockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.getServices();
      setServices(res.data || []);
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
    setCustomServiceName('');
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    const isKnownService = SERVICE_OPTIONS.includes(s.name);
    const orig = s.originalPrice !== undefined ? s.originalPrice : ((s as any).original_price !== undefined ? (s as any).original_price : s.price);
    const disc = s.discountedPrice !== undefined ? s.discountedPrice : ((s as any).discounted_price !== undefined ? (s as any).discounted_price : s.price);
    setForm({
      name: isKnownService ? s.name : CUSTOM_SERVICE_VALUE,
      originalPrice: orig !== undefined && orig !== null ? String(orig) : '',
      discountedPrice: disc !== undefined && disc !== null ? String(disc) : '',
      duration: s.duration,
      homeServiceAvailable: !!s.homeServiceAvailable,
      homeServicePrice: s.homeServicePrice !== undefined && s.homeServicePrice !== null ? String(s.homeServicePrice) : '',
    });
    setCustomServiceName(isKnownService ? '' : s.name);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceName = form.name === CUSTOM_SERVICE_VALUE ? customServiceName.trim() : form.name;
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
      setCustomServiceName('');
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
            <button className="btn-add" onClick={openCreate}>
              <Plus size={16} /> Add Service
            </button>
          </div>
        </motion.div>

        {loading ? (
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
                          <div style={{ marginTop: 2, fontSize: 12, color: 'var(--muted)' }}>
                            Home: ₹{s.homeServicePrice}
                          </div>
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
                          <button className="btn-sm" onClick={() => openEdit(s)}>
                            <Edit2 size={13} /> Edit
                          </button>
                          <button className="btn-sm danger" onClick={() => handleDelete(s.id)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  <select
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  >
                    <option value="">Select a salon service</option>
                    {SERVICE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    <option value={CUSTOM_SERVICE_VALUE}>Other / Custom</option>
                  </select>
                  {form.name === CUSTOM_SERVICE_VALUE && (
                    <input
                      style={{ marginTop: 8 }}
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      placeholder="Enter custom service name"
                    />
                  )}
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
