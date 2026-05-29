import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../services/api'
import './dashboard.css'
import './pages.css'

type Props = {
  user: any
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_bookings: 0, total_revenue: 0, today_appointments: 0, pending_bookings: 0 });
  const [allocationStylist, setAllocationStylist] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        api.getBookings({ limit: 10 }).catch(() => ({ data: [] })),
        api.getDashboardStats().catch(() => ({ data: stats })),
      ]);
      setBookings(bookingsRes.data || []);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Enable background polling every 5 seconds for real-time sync
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [user]);

  const handleAllocate = async (bookingId: string) => {
    const stylist = allocationStylist[bookingId];
    if (!stylist) return alert("Please enter a barber's name.");

    try {
      const data = await api.allocateBarber(bookingId, stylist);
      if (data.success) {
        alert("Barber allocated successfully!");
        fetchData();
      } else {
        alert(data.message || "Failed to allocate.");
      }
    } catch (err: any) {
      alert(err.message || "Error allocating barber.");
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Layout user={user?.email || 'Admin'} onLogout={onLogout}>
      <div className="dashboard-root container">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="date">{today}</div>
            <h1 className="greeting">Good morning, {user?.email ? user.email.split('@')[0] : 'Admin'}</h1>
          </div>
          <div className="header-right">
            <div className="small-stats">
              <div className="stat">Total Bookings<br /><strong>{stats.total_bookings}</strong></div>
            </div>
          </div>
        </header>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{stats.total_revenue.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Appointments</div>
            <div className="stat-value">{stats.total_bookings}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today's Appointments</div>
            <div className="stat-value">{stats.today_appointments}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Upcoming Bookings</div>
            <div className="stat-value">{stats.pending_bookings}</div>
          </div>
        </div>

        <div className="main-grid">
          <section className="card appointments-card">
            <div className="card-title">
              <span>Recent Appointments</span>
            </div>

            <ul className="appointments">
              {bookings.length === 0 ? (
                <li style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  No appointments found.
                </li>
              ) : bookings.slice(0, 8).map((b) => (
                <li key={b.id}>
                  <div className="time">{b.appointment_time || b.booking_time}</div>
                  <div className="info">
                    <div className="client">{b.customer_name} ({b.customer_email})</div>
                    <div className="meta">{b.service_name || b.hairstyle} &bull; Date: {new Date(b.appointment_date || b.booking_date).toLocaleDateString()}</div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>Stylist:</strong>
                      {b.stylist ? (
                        <span className="badge confirmed">{b.stylist}</span>
                      ) : (
                        <span className="badge pending">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <div className={"badge " + (b.booking_status === 'confirmed' ? 'confirmed' : b.booking_status === 'cancelled' ? 'cancelled' : b.booking_status === 'completed' ? 'completed' : 'pending')}>
                      {b.booking_status}
                    </div>
                    {!b.stylist && (
                      <div className="allocate-group">
                        <input 
                          type="text" 
                          placeholder="Barber name" 
                          value={allocationStylist[b.id] || ''}
                          onChange={(e) => setAllocationStylist({...allocationStylist, [b.id]: e.target.value})}
                        />
                        <button onClick={() => handleAllocate(b.id)}>Allocate</button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  )
}