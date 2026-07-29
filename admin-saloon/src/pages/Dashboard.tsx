import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

type Props = {
  user: any;
  onLogout: () => void;
};

const COLORS = ["#7C5CFC", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

const KPI_CARDS = [
  { key: "today_bookings",   label: "Today's Bookings",   icon: "📅", color: "#7C5CFC", fmt: (v: number) => String(v) },
  { key: "today_revenue",    label: "Today's Revenue",    icon: "💰", color: "#10B981", fmt: (v: number) => `₹${v.toLocaleString()}` },
  { key: "monthly_revenue",  label: "Monthly Revenue",    icon: "📈", color: "#3B82F6", fmt: (v: number) => `₹${v.toLocaleString()}` },
  { key: "pending_bookings", label: "Pending Appointments",icon: "⏳", color: "#F59E0B", fmt: (v: number) => String(v) },
  { key: "customer_count",   label: "Customer Count",     icon: "👥", color: "#EC4899", fmt: (v: number) => String(v) },
  { key: "avg_rating",       label: "Average Rating",     icon: "⭐", color: "#EAB308", fmt: (v: number) => `${v} / 5` },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    confirmed: "status-badge confirmed",
    pending: "status-badge pending",
    cancelled: "status-badge cancelled",
    completed: "status-badge completed",
  };
  return <span className={map[status] || "status-badge"}>{status}</span>;
}

export default function Dashboard({ user, onLogout }: Props) {
  const [stats, setStats] = useState<any>({
    today_bookings: 0,
    today_revenue: 0,
    monthly_revenue: 0,
    pending_bookings: 0,
    customer_count: 0,
    avg_rating: 0,
    review_count: 0,
    monthly_trend: [],
    recent_bookings: [],
    total_bookings: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.getDashboardStats().catch(() => ({ data: null }));
      if (res?.data) setStats((prev: any) => ({ ...prev, ...res.data, recent_bookings: res.data.recent_bookings ?? [], monthly_trend: res.data.monthly_trend ?? [] }));
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("booking-update", handler);
    return () => window.removeEventListener("booking-update", handler);
  }, [user]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", month: "long", day: "numeric",
  });

  const pieData = [
    { name: "Confirmed", value: stats.today_bookings - stats.pending_bookings > 0 ? stats.today_bookings - stats.pending_bookings : 0 },
    { name: "Pending",   value: stats.pending_bookings },
    { name: "Revenue",   value: stats.monthly_revenue > 0 ? 1 : 0 },
  ].filter(d => d.value > 0);

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="dash-root">
        {/* Header */}
        <div className="dash-header">
          <div>
            <div className="dash-date">{today}</div>
            <h1 className="dash-greeting">
              Welcome back, <span style={{ color: "var(--accent)" }}>
                {user?.email?.split("@")[0] || "Admin"}
              </span> 👋
            </h1>
          </div>
          <button
            onClick={fetchData}
            className="dash-refresh-btn"
            title="Refresh Data"
          >
            🔄 Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="dash-kpi-grid">
          {KPI_CARDS.map(card => (
            <div
              key={card.key}
              className="dash-kpi-card"
              style={{ borderTop: `3px solid ${card.color}` }}
            >
              <div className="dash-kpi-icon" style={{ background: `${card.color}18` }}>
                {card.icon}
              </div>
              <div className="dash-kpi-info">
                <div className="dash-kpi-label">{card.label}</div>
                <div className="dash-kpi-value" style={{ color: card.color }}>
                  {loading ? "—" : card.fmt(stats[card.key] ?? 0)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="dash-charts-row">
          {/* Revenue trend chart */}
          <div className="dash-panel dash-panel-lg">
            <div className="dash-panel-title">📊 Monthly Revenue Trend</div>
            {stats.monthly_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats.monthly_trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7C5CFC" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 10 }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7C5CFC" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dash-empty">No revenue data yet</div>
            )}
          </div>

          {/* Booking distribution pie */}
          <div className="dash-panel dash-panel-sm">
            <div className="dash-panel-title">🎯 Booking Status</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                    dataKey="value" paddingAngle={4} stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 10 }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => (
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>{v}</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="dash-empty">No bookings today</div>
            )}
          </div>
        </div>

        {/* Summary Row */}
        <div className="dash-summary-row">
          <div className="dash-summary-card">
            <span className="dash-summary-icon">📋</span>
            <div>
              <div className="dash-summary-label">Total Bookings (All Time)</div>
              <div className="dash-summary-val">{stats.total_bookings}</div>
            </div>
          </div>
          <div className="dash-summary-card">
            <span className="dash-summary-icon">💵</span>
            <div>
              <div className="dash-summary-label">Total Revenue (All Time)</div>
              <div className="dash-summary-val">₹{stats.total_revenue?.toLocaleString()}</div>
            </div>
          </div>
          <div className="dash-summary-card">
            <span className="dash-summary-icon">⭐</span>
            <div>
              <div className="dash-summary-label">Reviews Received</div>
              <div className="dash-summary-val">{stats.review_count}</div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="dash-panel" style={{ marginTop: 0 }}>
          <div className="dash-panel-title" style={{ marginBottom: 12 }}>
            🗓️ Recent Bookings
            <a href="/bookings" className="dash-viewall">View All →</a>
          </div>
          <div className="dash-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Staff</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Loading...</td></tr>
                ) : stats.recent_bookings?.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No recent bookings found.</td></tr>
                ) : (
                  (stats.recent_bookings ?? []).map((b: any) => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{b.customer_email}</div>
                      </td>
                      <td>{b.hairstyle || "—"}</td>
                      <td>{b.booking_date || b.appointment_date || "—"}</td>
                      <td>{b.booking_time || b.appointment_time || "—"}</td>
                      <td>{b.stylist || "—"}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(b.total_price || 0).toFixed(0)}</td>
                      <td>{statusBadge(b.booking_status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
