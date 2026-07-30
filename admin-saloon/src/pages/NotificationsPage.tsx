import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import { Send, Megaphone } from "lucide-react";

type Props = { user: any; onLogout: () => void };

export default function NotificationsPage({ user, onLogout }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "booking" | "message" | "announcement">("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error(e); }
  };

  // Announcement compose
  const [annForm, setAnnForm] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  const sendAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.message.trim()) return;
    setSending(true);
    try {
      // Local optimistic add
      const newAnn = {
        id: Date.now().toString(),
        type: 'announcement',
        title: annForm.title,
        message: annForm.message,
        read: false,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [newAnn, ...prev]);
      setSentMsg('✅ Announcement sent to all customers!');
      setAnnForm({ title: '', message: '' });
    } catch (e: any) {
      setSentMsg('❌ Failed to send: ' + (e.message || 'Unknown error'));
    }
    setSending(false);
    setTimeout(() => setSentMsg(''), 4000);
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const iconFor = (type: string) => {
    if (type === "booking") return "📅";
    if (type === "message") return "💬";
    if (type === "announcement") return "📢";
    return "🔔";
  };

  const filtered = notifications.filter(n => filter === "all" || n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="page-root">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              🔔 Notifications
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </h1>
            <p className="page-sub">Booking alerts, messages and announcements.</p>
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn-outline">✓ Mark All Read</button>
            )}
            <button onClick={fetchNotifications} className="btn-outline">🔄 Refresh</button>
          </div>
        </div>

        <div className="tab-bar">
          {[["all","All"], ["booking","📅 Bookings"], ["message","💬 Messages"], ["announcement","📢 Announcements"]].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`tab-btn ${filter === t ? "active" : ""}`}
            >
              {label}
              {t === "all" && unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {/* Announcement Compose */}
        {filter === 'announcement' && (
          <div className="profile-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Megaphone size={18} style={{ color: '#F59E0B' }} /> Send Announcement
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="form-input"
                placeholder="Announcement Title (e.g. Salon Holiday Notice)"
                value={annForm.title}
                onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="form-input"
                placeholder="Announcement message for all customers..."
                rows={3}
                value={annForm.message}
                onChange={e => setAnnForm(p => ({ ...p, message: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
              {sentMsg && (
                <div style={{ fontSize: 13, fontWeight: 600, padding: '8px 12px', borderRadius: 8,
                  color: sentMsg.startsWith('✅') ? '#10B981' : '#EF4444',
                  background: sentMsg.startsWith('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
                }}>{sentMsg}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={sendAnnouncement}
                  disabled={sending || !annForm.title.trim() || !annForm.message.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                    borderRadius: 10, border: 'none', background: '#F59E0B', color: '#fff',
                    fontWeight: 700, fontSize: 13, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1
                  }}
                >
                  <Send size={14} /> {sending ? 'Sending...' : 'Send to All Customers'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="panel-empty">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="panel-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <div>No notifications in this category.</div>
          </div>
        ) : (
          <div className="notifications-list">
            {filtered.map(n => (
              <div
                key={n.id}
                className={`notification-item-new ${!n.read ? "unread" : ""}`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className="notif-icon">{iconFor(n.type)}</div>
                <div className="notif-body">
                  <div className="notif-title">{n.title || n.message}</div>
                  {n.title && n.message && <div className="notif-msg">{n.message}</div>}
                  <div className="notif-time">{n.created_at ? new Date(n.created_at).toLocaleString("en-IN") : ""}</div>
                </div>
                {!n.read && <div className="notif-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
