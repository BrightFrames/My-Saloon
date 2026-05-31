import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

export default function Dashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [salons, setSalons] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, salonsRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/bookings/all'),
          fetch('http://localhost:3000/api/v1/salons')
        ]);
        
        const bData = await bookingsRes.json();
        const sData = await salonsRes.json();

        if (bData.success) setBookings(bData.data || []);
        if (sData.success) setSalons(sData.data || []);
      } catch (err) {
        console.error("Failed to fetch global stats", err);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  return (
    <Layout>
      <h1 style={{ color: '#111' }}>Platform Overview</h1>
      <p style={{ color: '#555' }}>Welcome to the Global Administration Portal.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px', marginBottom: '40px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3 style={{ margin: 0, color: '#555', fontSize: '14px', textTransform: 'uppercase' }}>Total Salons</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#111' }}>{salons.length}</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3 style={{ margin: 0, color: '#555', fontSize: '14px', textTransform: 'uppercase' }}>Total Bookings</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#111' }}>{bookings.length}</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3 style={{ margin: 0, color: '#555', fontSize: '14px', textTransform: 'uppercase' }}>Global Revenue</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#CA9A86' }}>${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <h2 style={{ margin: 0, fontSize: '16px', color: '#111' }}>Global Booking Logs</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '15px 20px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '15px 20px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Salon ID</th>
                <th style={{ padding: '15px 20px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '15px 20px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Service</th>
                <th style={{ padding: '15px 20px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? bookings.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '15px 20px', fontSize: '13px', color: '#111', fontFamily: 'monospace' }}>{b.id.substring(0, 8)}...</td>
                  <td style={{ padding: '15px 20px', fontSize: '13px', color: '#555' }}>
                    {b.salon_id ? salons.find(s => s.id === b.salon_id)?.name || b.salon_id.substring(0, 8) : 'Direct'}
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: '14px', color: '#111', fontWeight: 500 }}>
                    {b.customer_name} <br/>
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: 400 }}>{b.customer_email}</span>
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: '13px', color: '#111' }}>
                    {b.hairstyle} <br/>
                    <span style={{ fontSize: '12px', color: '#888' }}>on {new Date(b.booking_date).toLocaleDateString()}</span>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '4px 10px', 
                      borderRadius: '50px', 
                      background: b.booking_status === 'confirmed' ? '#e6f4ea' : '#fff3e0',
                      color: b.booking_status === 'confirmed' ? '#1e8e3e' : '#e65100',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {b.booking_status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No global bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
