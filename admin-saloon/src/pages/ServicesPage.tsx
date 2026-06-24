import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import './pages.css'
import CircularProgress from '@mui/material/CircularProgress';

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
    setForm({
      name: isKnownService ? s.name : CUSTOM_SERVICE_VALUE,
      originalPrice: s.originalPrice !== undefined ? String(s.originalPrice) : String(s.price),
      discountedPrice: s.discountedPrice !== undefined ? String(s.discountedPrice) : String(s.price),
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
      <div className="page-root container">
        <div className="page-header">
          <div>
            <h1>Services</h1>
            <div className="subtitle">{services.length} services offered</div>
          </div>
          <button className="btn-add" onClick={openCreate}>+ Add Service</button>
        </div>

        {loading ? (
          <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CircularProgress sx={{ color: '#CA9A86' }} size={40} />
            <p style={{ color: '#7f6f69', fontWeight: 500 }}>Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✂️</div>
            <h3>No services yet</h3>
            <p>Add your salon services to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Price</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>
                    {s.name}
                    {s.homeServiceAvailable && (
                      <span title="Home Service Available" style={{ marginLeft: 8, fontSize: '1.1em' }}>🏠</span>
                    )}
                  </td>
                  <td>
                    {s.originalPrice && s.discountedPrice && s.originalPrice > s.discountedPrice ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: '#888', marginRight: '8px', fontSize: '0.9em' }}>₹{s.originalPrice}</span>
                        <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>₹{s.discountedPrice}</span>
                      </div>
                    ) : (
                      <span>₹{s.discountedPrice ?? s.price}</span>
                    )}
                    {s.homeServiceAvailable && s.homeServicePrice && (
                      <div style={{ marginTop: '4px', fontSize: '0.85em', color: '#555' }}>
                        <span style={{ fontWeight: '600' }}>Home:</span> ₹{s.homeServicePrice}
                      </div>
                    )}
                  </td>
                  <td>{s.duration}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn-sm danger" onClick={() => handleDelete(s.id)}>Delete</button>
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
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      placeholder="Enter custom service name"
                    />
                  )}
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '16px' }}>
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Discounted Price (₹)
                      {parseFloat(form.originalPrice) > 0 && parseFloat(form.discountedPrice) < parseFloat(form.originalPrice) && (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {Math.round(((parseFloat(form.originalPrice) - parseFloat(form.discountedPrice)) / parseFloat(form.originalPrice)) * 100)}% OFF
                        </span>
                      )}
                    </label>
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
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'row' }}>
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
                  <button type="submit" className="btn-add" disabled={isSubmitting}>{isSubmitting ? (editingService ? 'Saving...' : 'Adding...') : editingService ? 'Save Changes' : 'Add Service'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
