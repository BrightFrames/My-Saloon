import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";

type Props = { user: any; onLogout: () => void };

export default function CustomersPage({ user, onLogout }: Props) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers();
      setCustomers(res?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [user]);

  const openCustomer = async (c: any) => {
    setSelectedCustomer(c);
    setNote(c.notes || "");
    try {
      const res = await api.getCustomerBookings(c.customer_email);
      setCustomerBookings(res?.data || []);
    } catch { setCustomerBookings([]); }
  };

  const saveNote = async () => {
    if (!selectedCustomer) return;
    setSavingNote(true);
    try {
      await api.updateCustomerNote(selectedCustomer.customer_email, note);
      setCustomers(prev => prev.map(c =>
        c.customer_email === selectedCustomer.customer_email ? { ...c, notes: note } : c
      ));
    } catch (e) { console.error(e); }
    setSavingNote(false);
  };

  const toggleLoyalty = async (c: any) => {
    try {
      await api.toggleLoyalCustomer(c.customer_email, !c.is_loyal);
      setCustomers(prev => prev.map(x =>
        x.customer_email === c.customer_email ? { ...x, is_loyal: !x.is_loyal } : x
      ));
    } catch (e) { console.error(e); }
  };

  const filtered = customers.filter(c =>
    c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="page-root">
        <div className="page-header">
          <div>
            <h1 className="page-title">👥 Customer Management</h1>
            <p className="page-sub">View and manage your salon's customer base.</p>
          </div>
          <button onClick={fetchCustomers} className="btn-outline">🔄 Refresh</button>
        </div>

        <div className="page-toolbar">
          <div className="search-box">
            <span>🔍</span>
            <input
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="customers-layout">
          {/* List */}
          <div className="customers-list-panel">
            <div className="panel-header">
              All Customers <span className="badge-count">{filtered.length}</span>
            </div>
            {loading ? (
              <div className="panel-empty">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="panel-empty">No customers found.</div>
            ) : (
              <div className="customer-items">
                {filtered.map(c => (
                  <div
                    key={c.customer_email}
                    className={`customer-item ${selectedCustomer?.customer_email === c.customer_email ? "active" : ""}`}
                    onClick={() => openCustomer(c)}
                  >
                    <div className="customer-avatar">
                      {(c.customer_name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="customer-item-info">
                      <div className="customer-name">
                        {c.customer_name}
                        {c.is_loyal && <span className="loyalty-badge">⭐ Loyal</span>}
                      </div>
                      <div className="customer-email">{c.customer_email}</div>
                      <div className="customer-meta">{c.booking_count} bookings · ₹{Number(c.total_spent || 0).toLocaleString()} spent</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedCustomer ? (
            <div className="customer-detail-panel">
              <div className="panel-header">
                Customer Profile
                <button
                  className={`loyalty-toggle-btn ${selectedCustomer.is_loyal ? "active" : ""}`}
                  onClick={() => toggleLoyalty(selectedCustomer)}
                >
                  {selectedCustomer.is_loyal ? "⭐ Loyal Customer" : "☆ Mark as Loyal"}
                </button>
              </div>

              <div className="customer-profile-card">
                <div className="customer-avatar-lg">
                  {(selectedCustomer.customer_name || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="customer-profile-name">{selectedCustomer.customer_name}</h2>
                  <div className="customer-profile-email">{selectedCustomer.customer_email}</div>
                  <div className="customer-stats-row">
                    <div className="cstat"><div className="cstat-val">{selectedCustomer.booking_count}</div><div className="cstat-label">Bookings</div></div>
                    <div className="cstat"><div className="cstat-val">₹{Number(selectedCustomer.total_spent || 0).toLocaleString()}</div><div className="cstat-label">Total Spent</div></div>
                    <div className="cstat"><div className="cstat-val">{selectedCustomer.last_visit ? new Date(selectedCustomer.last_visit).toLocaleDateString("en-IN") : "—"}</div><div className="cstat-label">Last Visit</div></div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="detail-section">
                <div className="detail-section-title">📝 Notes</div>
                <textarea
                  className="notes-textarea"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add internal notes about this customer..."
                  rows={3}
                />
                <button className="btn-primary" onClick={saveNote} disabled={savingNote}>
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>

              {/* Booking History */}
              <div className="detail-section">
                <div className="detail-section-title">📅 Booking History</div>
                {customerBookings.length === 0 ? (
                  <div className="panel-empty">No bookings found for this customer.</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Service</th>
                        <th>Staff</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerBookings.map(b => (
                        <tr key={b.id}>
                          <td>{b.booking_date || b.appointment_date || "—"}</td>
                          <td>{b.hairstyle || b.service_name || "—"}</td>
                          <td>{b.stylist || "—"}</td>
                          <td>₹{Number(b.total_price || 0).toFixed(0)}</td>
                          <td><span className={`status-badge ${b.booking_status}`}>{b.booking_status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="customer-detail-panel customer-detail-empty">
              <div>👤</div>
              <div>Select a customer to view details</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
