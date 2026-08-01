import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import './pages.css'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import CircularProgress from '@mui/material/CircularProgress'
import { motion, type Variants } from 'framer-motion'
import {
  Calendar,
  Plus,
  Search,
  Scissors,
  Home,
  Building2,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock3,
  Sparkles,
  RefreshCw,
  MapPin
} from 'lucide-react'

type Props = {
  user: any
  onLogout: () => void
}

function getInitials(name?: string) {
  if (!name) return "C";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function statusPill(status: string) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "confirmed") {
    return (
      <span className="badge confirmed">
        <CheckCircle2 size={13} />
        Confirmed
      </span>
    );
  }
  if (normalized === "completed") {
    return (
      <span className="badge completed">
        <Sparkles size={13} />
        Completed
      </span>
    );
  }
  if (normalized === "pending") {
    return (
      <span className="badge pending">
        <Clock3 size={13} />
        Pending
      </span>
    );
  }
  if (normalized === "cancelled") {
    return (
      <span className="badge cancelled">
        <XCircle size={13} />
        Cancelled
      </span>
    );
  }
  return <span className="badge">{status}</span>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function BookingsPage({ user, onLogout }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState<dayjs.Dayjs>(dayjs());
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocationStylist, setAllocationStylist] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [slotOptions, setSlotOptions] = useState<string[]>([]);
  const submittingBookingRef = useRef(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
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

  const fetchServices = async () => {
    try {
      const res = await api.getServices();
      setServices(res.data || []);
    } catch (err) {
      console.error('Failed to fetch services', err);
    }
  };

  const fetchSalonProfileSlots = async () => {
    try {
      const res = await api.getSalonProfile();
      const profile = res?.data;
      const hours = profile?.working_hours || {};
      const openTime = String(hours.open || profile?.opening_time || '09:00 AM');
      const closeTime = String(hours.close || profile?.closing_time || '08:00 PM');
      const interval = Number(hours.slot_interval || profile?.slot_interval || 30);

      const parseTime = (value: string): number => {
        const m = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!m) return NaN;
        let h = Number(m[1]);
        const min = Number(m[2]);
        const ampm = m[3].toUpperCase();
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      };

      const formatTime = (mins: number): string => {
        const h24 = Math.floor(mins / 60);
        const min = mins % 60;
        const ampm = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
      };

      const start = parseTime(openTime);
      const end = parseTime(closeTime);
      const step = Number.isFinite(interval) && interval > 0 ? interval : 30;

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return;
      }

      const slots: string[] = [];
      for (let t = start; t <= end; t += step) {
        slots.push(formatTime(t));
      }
      setSlotOptions(slots);
    } catch {
      // Keep default options if profile cannot be loaded.
    }
  };

  useEffect(() => {
    fetchBookings(statusFilter, searchQuery);
    fetchServices();
    fetchSalonProfileSlots();
    if (window.location.search.includes('new=true')) {
      setShowNewModal(true);
      window.history.replaceState({}, '', '/bookings');
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    const handleBookingUpdate = () => {
      fetchBookings();
    };
    window.addEventListener('booking-update', handleBookingUpdate);
    return () => window.removeEventListener('booking-update', handleBookingUpdate);
  }, [statusFilter, searchQuery]);

  const handleConfirm = async (id: string) => {
    try {
      const res = await api.confirmBooking(id);
      if (res.success) fetchBookings();
      else alert(res.message || "Failed to confirm booking.");
    } catch (err: any) {
      alert(err.message || "Error confirming booking.");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await api.cancelBooking(id);
      if (res.success) fetchBookings();
      else alert(res.message || "Failed to cancel booking.");
    } catch (err: any) {
      alert(err.message || "Error cancelling booking.");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await api.completeBooking(id);
      if (res.success) fetchBookings();
      else alert(res.message || "Failed to mark booking as completed.");
    } catch (err: any) {
      alert(err.message || "Error completing booking.");
    }
  };

  const handleDeclineTable = async (id: string) => {
    const reason = prompt("Please enter a rejection reason:");
    if (!reason) return;
    try {
      const res = await api.rejectBooking(id, reason);
      if (res.success) fetchBookings();
      else alert(res.message || "Failed to decline booking.");
    } catch (err: any) {
      alert(err.message || "Error declining booking.");
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

    if (submittingBookingRef.current) return;
    submittingBookingRef.current = true;
    setIsSubmittingBooking(true);

    try {
      const payload = {
        ...newForm,
        total_price: parseFloat(newForm.total_price) || 0,
        salon_id: user?.salon_id || null
      };

      const res = await api.createBooking(payload);

      if (res.success) {
        setShowNewModal(false);
        setNewForm({
          customer_name: '', customer_email: '', mobile: '', country_code: '+91',
          hairstyle: 'Custom Service', stylist: '', booking_date: '', booking_time: '',
          payment_method: 'cash', total_price: '0'
        });
        alert('Booking created successfully!');
        fetchBookings();
      } else {
        alert(res.message || 'Failed to create booking.');
      }
    } catch (err: any) {
      alert(err.message || "Error creating booking.");
    } finally {
      submittingBookingRef.current = false;
      setIsSubmittingBooking(false);
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
              <Calendar size={26} style={{ color: "#7C5CFC" }} />
              Appointments & Bookings
            </h1>
            <p className="page-sub">{bookings.length} total appointments recorded</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => fetchBookings()}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              className={`btn-outline ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode(v => v === 'list' ? 'calendar' : 'list')}
              style={{ fontWeight: 700 }}
            >
              <Calendar size={15} /> {viewMode === 'list' ? 'Calendar View' : 'List View'}
            </button>
            <button className="btn-add" onClick={() => setShowNewModal(true)}>
              <Plus size={16} /> New Booking
            </button>
          </div>
        </motion.div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <motion.div variants={itemVariants}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button className="btn-outline" onClick={() => setCalendarDate(d => d.subtract(1, 'month'))}>&lt; Prev</button>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-h)' }}>{calendarDate.format('MMMM YYYY')}</span>
              <button className="btn-outline" onClick={() => setCalendarDate(d => d.add(1, 'month'))}>Next &gt;</button>
            </div>
            {(() => {
              const startOfMonth = calendarDate.startOf('month');
              const daysInMonth = calendarDate.daysInMonth();
              const firstDayOfWeek = startOfMonth.day(); // 0=Sun
              const cells: (number | null)[] = Array(firstDayOfWeek).fill(null);
              for (let i = 1; i <= daysInMonth; i++) cells.push(i);
              while (cells.length % 7 !== 0) cells.push(null);
              const weeks = [];
              for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
              const statusColor: Record<string, string> = { confirmed: '#3B82F6', completed: '#10B981', pending: '#F59E0B', cancelled: '#EF4444' };
              return (
                <div style={{ background: 'var(--panel-bg)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg)' }}>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{d}</div>
                    ))}
                  </div>
                  {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid var(--border)' }}>
                      {week.map((day, di) => {
                        if (!day) return <div key={di} style={{ minHeight: 90, background: 'var(--bg)', opacity: 0.3 }} />;
                        const dateStr = calendarDate.date(day).format('YYYY-MM-DD');
                        const dayBookings = bookings.filter(b => {
                          const bd = b.booking_date || b.appointment_date || '';
                          return bd.startsWith(dateStr);
                        });
                        const isToday = dayjs().format('YYYY-MM-DD') === dateStr;
                        return (
                          <div key={di} style={{ minHeight: 90, padding: '8px 6px', borderLeft: di > 0 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
                            <div style={{ fontSize: 13, fontWeight: isToday ? 900 : 600, color: isToday ? '#7C5CFC' : 'var(--text-h)',
                              width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isToday ? 'rgba(124,92,252,0.12)' : 'transparent' }}>{day}</div>
                            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {dayBookings.slice(0, 3).map((b: any, bi: number) => (
                                <div key={bi} style={{ fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
                                  background: `${statusColor[b.booking_status?.toLowerCase()] || '#7C5CFC'}20`,
                                  color: statusColor[b.booking_status?.toLowerCase()] || '#7C5CFC',
                                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                  {b.booking_time || ''} {b.customer_name || 'Customer'}
                                </div>
                              ))}
                              {dayBookings.length > 3 && (
                                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>+{dayBookings.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
        <motion.div className="page-toolbar" variants={itemVariants}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>

          <div className="search-box">
            <Search size={16} style={{ color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search customer, email, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <CircularProgress sx={{ color: '#7C5CFC' }} size={36} />
            <p style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 600 }}>Loading appointments...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <Calendar size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <h3 style={{ color: 'var(--text-h)', margin: '0 0 4px 0' }}>No bookings found</h3>
            <p style={{ color: 'var(--muted)' }}>New appointments will appear here.</p>
          </div>
        ) : (
          <motion.div className="dash-table-wrap" variants={itemVariants}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Stylist</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar-circle" style={{ width: 34, height: 34, fontSize: 13 }}>
                          {getInitials(b.customer_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-h)' }}>{b.customer_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{b.customer_email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Scissors size={14} style={{ color: '#7C5CFC' }} />
                        {b.service_name || b.hairstyle}
                      </div>
                      {b.booking_type === 'home' && b.address && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {b.address}, {b.city}
                        </div>
                      )}
                    </td>
                    <td>
                      {b.booking_type === 'home' ? (
                        <span className="badge pending" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
                          <Home size={12} /> Home
                        </span>
                      ) : (
                        <span className="badge confirmed" style={{ background: 'rgba(124, 92, 252, 0.12)', color: '#7C5CFC' }}>
                          <Building2 size={12} /> Salon
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {new Date(b.appointment_date || b.booking_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.appointment_time || b.booking_time}</td>
                    <td>
                      {b.stylist ? (
                        <span className="badge confirmed">
                          <UserCheck size={12} /> {b.stylist}
                        </span>
                      ) : (
                        <span className="badge pending">Unassigned</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 800, color: '#10B981' }}>₹{b.total_price}</td>
                    <td>{statusPill(b.booking_status)}</td>
                    <td>
                      <span className={`badge ${b.payment_status === 'paid' ? 'confirmed' : 'pending'}`}>
                        {b.payment_status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                        {b.booking_status === 'confirmed' && (
                          <>
                            <button className="btn-sm save" onClick={() => handleComplete(b.id)}>
                              Complete
                            </button>
                            <button className="btn-sm danger" onClick={() => handleCancel(b.id)}>
                              Cancel
                            </button>
                          </>
                        )}
                        
                        {b.booking_status === 'pending' && (
                          <>
                            <button className="btn-sm save" onClick={() => handleConfirm(b.id)}>
                              Accept
                            </button>
                            <button className="btn-sm danger" onClick={() => handleDeclineTable(b.id)}>
                              Decline
                            </button>
                          </>
                        )}

                        {b.booking_status === 'cancelled' && (
                          <button className="btn-sm" onClick={() => handleConfirm(b.id)}>
                            Re-confirm
                          </button>
                        )}

                        {!b.stylist && b.booking_status === 'confirmed' && (
                          <div className="allocate-group" style={{ display: 'flex', gap: 4 }}>
                            <input
                              type="text"
                              placeholder="Assign Barber"
                              value={allocationStylist[b.id] || ''}
                              onChange={(e) => setAllocationStylist({ ...allocationStylist, [b.id]: e.target.value })}
                            />
                            <button onClick={() => handleAllocate(b.id)}>Go</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
          </>
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
                    <label>Service</label>
                    <select
                      value={newForm.hairstyle}
                      onChange={e => setNewForm({...newForm, hairstyle: e.target.value})}
                      required
                    >
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                    </select>
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
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={newForm.booking_date ? dayjs(newForm.booking_date) : null}
                        onChange={(date) =>
                          setNewForm({
                            ...newForm,
                            booking_date: date ? date.format('YYYY-MM-DD') : '',
                          })
                        }
                        label="Select Date"
                        format="DD-MM-YYYY"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            sx: {
                              '& .MuiInputBase-root': {
                                height: 44,
                                borderRadius: '10px',
                              },
                              '& .MuiInputBase-input': {
                                padding: '10px 14px',
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <select value={newForm.booking_time} onChange={e => setNewForm({...newForm, booking_time: e.target.value})} required>
                      <option value="">Select Time</option>
                      {(slotOptions.length > 0 ? slotOptions : ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowNewModal(false)}>Cancel</button>
                  <button type="submit" className="btn-add" disabled={isSubmittingBooking}>
                    {isSubmittingBooking ? 'Creating...' : 'Create Booking'}
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
