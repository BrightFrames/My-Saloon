import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";

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
