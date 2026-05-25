import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import './dashboard.css'

type Props = {
  user: any
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        let url = 'http://localhost:3000/api/v1/bookings/all';
        if (user?.salon_id) {
          url += `?salon_id=${user.salon_id}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setBookings(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      }
    };
    fetchBookings();
  }, [user]);

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  
  // Format current date
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
              <div className="stat">Total Bookings<br /><strong>{bookings.length}</strong></div>
            </div>
          </div>
        </header>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="label">Total Revenue</div>
            <div className="value">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="metric-card">
            <div className="label">Total Appointments</div>
            <div className="value">{bookings.length}</div>
          </div>
        </div>

        <div className="main-grid">
          <section className="card appointments-card">
            <div className="card-title">
              <span>Appointment Log</span>
            </div>

            <ul className="appointments">
              {bookings.length === 0 ? (
                <li style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  No appointments found.
                </li>
              ) : bookings.map((b) => (
                <li key={b.id}>
                  <div className="time">{b.booking_time}</div>
                  <div className="info">
                    <div className="client">{b.customer_name} ({b.customer_email})</div>
                    <div className="meta">{b.hairstyle} • with {b.stylist} • Date: {new Date(b.booking_date).toLocaleDateString()}</div>
                  </div>
                  <div className={`status ${b.booking_status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                    {b.booking_status}
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