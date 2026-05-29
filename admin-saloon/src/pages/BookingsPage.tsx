import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import './pages.css'

type Props = {
  user: any
  onLogout: () => void
}

export default function BookingsPage({ user, onLogout }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocationStylist, setAllocationStylist] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    customer_name: '',
    customer_email: '',
    mobile: '',
    country_code: '+91',
    hairstyle: 'Custom Service',
    stylist: '',
    booking_date: '',
    booking_time: '',
    payment_method: 'cash',
    total_price: '0'
  });

  const fetchBookings = async (statusVal = statusFilter, searchVal = searchQuery) => {
    try {
      setLoading(true);
      const res = await api.getBookings({ status: statusVal, search: searchVal });
      setBookings(res.data || []);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(statusFilter, searchQuery);
    // Check if ?new=true in URL
    if (window.location.search.includes('new=true')) {
      setShowNewModal(true);
      // Clean up URL
      window.history.replaceState({}, '', '/bookings');
    }
  }, [statusFilter, searchQuery]);

  const handleConfirm = async (id: string) => {
    try {
      const res = await api.confirmBooking(id);
      if (res.success) {
        fetchBookings();
      } else {
        alert(res.message || "Failed to confirm booking.");
      }
    } catch (err: any) {
      alert(err.message || "Error confirming booking.");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await api.cancelBooking(id);
      if (res.success) {
        fetchBookings();
      } else {
        alert(res.message || "Failed to cancel booking.");
      }
    } catch (err: any) {
      alert(err.message || "Error cancelling booking.");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await api.completeBooking(id);
      if (res.success) {
        fetchBookings();
      } else {
        alert(res.message || "Failed to mark booking as completed.");
      }
    } catch (err: any) {
      alert(err.message || "Error completing booking.");
    }
  };

  const handleAllocate = async (bookingId: string) => {
    const stylist = allocationStylist[bookingId];
    if (!stylist) return alert("Please enter a barber's name.");

    try {
      const data = await api.allocateBarber(bookingId, stylist);
      if (data.success) {
        setAllocationStylist({ ...allocationStylist, [bookingId]: '' });
        fetchBookings();
      } else {
        alert(data.message || "Failed to allocate.");
      }
    } catch (err: any) {
      alert(err.message || "Error allocating barber.");
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.customer_name || !newForm.customer_email || !newForm.booking_date || !newForm.booking_time) {
      return alert("Please fill required fields.");
    }

    try {
      const payload = {
        ...newForm,
        total_price: parseFloat(newForm.total_price) || 0,
        salon_id: user?.salon_id || null
      };
      
      const res = await fetch('http://localhost:3000/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setShowNewModal(false);
        setNewForm({
          customer_name: '', customer_email: '', mobile: '', country_code: '+91',
          hairstyle: 'Custom Service', stylist: '', booking_date: '', booking_time: '',
          payment_method: 'cash', total_price: '0'
        });
        alert('Booking created successfully!');
        fetchBookings();
      } else {
        alert(data.message || 'Failed to create booking.');
      }
    } catch (err: any) {
      alert(err.message || "Error creating booking.");
    }
  };

  return (
    <Layout user={user?.email || 'Admin'} onLogout={onLogout}>
      <div className="page-root container">
        <div className="page-header">
          <div>
            <h1>Bookings</h1>
            <div className="subtitle">{bookings.length} total bookings</div>
          </div>
          <button className="btn-add" onClick={() => setShowNewModal(true)}>+ New Booking</button>
        </div>

        <div className="filter-bar" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e0d9d6', backgroundColor: '#fff', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="text"
            placeholder="Search by customer name, email, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e0d9d6',
              outline: 'none',
              flex: 1,
              minWidth: '240px',
              fontSize: '14px'
            }}
          />
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No bookings found</h3>
            <p>Bookings from your customers will appear here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Date</th>
                <th>Time</th>
                <th>Stylist</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                    <div style={{ fontSize: '12px', color: '#7f6f69' }}>{b.customer_email}</div>
                  </td>
                  <td>{b.service_name || b.hairstyle}</td>
                  <td>{new Date(b.appointment_date || b.booking_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>{b.appointment_time || b.booking_time}</td>
                  <td>
                    {b.stylist ? (
                      <span className="badge confirmed">{b.stylist}</span>
                    ) : (
                      <span className="badge pending">Unassigned</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{b.total_price}</td>
                  <td>
                    <span className={`badge ${b.booking_status}`}>{b.booking_status}</span>
                  </td>
                  <td>
                    <span className={`badge ${b.payment_status === 'paid' ? 'confirmed' : 'pending'}`}>{b.payment_status || 'pending'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                      {b.booking_status === 'confirmed' && (
                        <>
                          <button 
                            onClick={() => handleComplete(b.id)}
                            style={{ padding: '6px 12px', background: '#a07869', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                          >
                            Complete
                          </button>
                          <button 
                            onClick={() => handleCancel(b.id)}
                            style={{ padding: '6px 12px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      
                      {b.booking_status === 'cancelled' && (
                        <button 
                          onClick={() => handleConfirm(b.id)}
                          style={{ padding: '6px 12px', background: '#5cb85c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                        >
                          Confirm
                        </button>
                      )}

                      {!b.stylist && b.booking_status === 'confirmed' && (
                        <div className="allocate-group" style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="text"
                            placeholder="Assign Barber"
                            value={allocationStylist[b.id] || ''}
                            onChange={(e) => setAllocationStylist({ ...allocationStylist, [b.id]: e.target.value })}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', width: '90px' }}
                          />
                          <button 
                            onClick={() => handleAllocate(b.id)}
                            style={{ padding: '4px 8px', background: '#8c7870', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Go
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* New Booking Modal */}
        {showNewModal && (
          <div className="modal-backdrop" onClick={() => setShowNewModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2>Create New Booking</h2>
              <form onSubmit={handleCreateBooking}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input value={newForm.customer_name} onChange={e => setNewForm({...newForm, customer_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={newForm.customer_email} onChange={e => setNewForm({...newForm, customer_email: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input value={newForm.mobile} onChange={e => setNewForm({...newForm, mobile: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Service / Hairstyle</label>
                    <input value={newForm.hairstyle} onChange={e => setNewForm({...newForm, hairstyle: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Stylist</label>
                    <input value={newForm.stylist} onChange={e => setNewForm({...newForm, stylist: e.target.value})} placeholder="Optional" />
                  </div>
                  <div className="form-group">
                    <label>Total Price (₹)</label>
                    <input type="number" value={newForm.total_price} onChange={e => setNewForm({...newForm, total_price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={newForm.booking_date} onChange={e => setNewForm({...newForm, booking_date: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <select value={newForm.booking_time} onChange={e => setNewForm({...newForm, booking_time: e.target.value})} required>
                      <option value="">Select Time</option>
                      {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowNewModal(false)}>Cancel</button>
                  <button type="submit" className="btn-add">Create Booking</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
