import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import './pages.css'

type Props = {
  user: any
  onLogout: () => void
}

type Service = {
  id: string
  name: string
  price: number
  duration: string
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
  const [form, setForm] = useState({ name: '', price: '', duration: '' });
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
    setForm({ name: '', price: '', duration: '' });
    setCustomServiceName('');
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    const isKnownService = SERVICE_OPTIONS.includes(s.name);
    setForm({
      name: isKnownService ? s.name : CUSTOM_SERVICE_VALUE,
      price: String(s.price),
      duration: s.duration,
    });
    setCustomServiceName(isKnownService ? '' : s.name);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceName = form.name === CUSTOM_SERVICE_VALUE ? customServiceName.trim() : form.name;
    if (!serviceName || !form.price || !form.duration) return alert('All fields are required.');
    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = { name: serviceName, price: parseFloat(form.price), duration: form.duration };
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
          <div className="empty-state"><p>Loading services...</p></div>
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
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>₹{s.price}</td>
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
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 45 min"
                  />
                </div>
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
