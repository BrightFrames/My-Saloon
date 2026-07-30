import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from "recharts";
import { motion, type Variants } from "framer-motion";
import {
  Calendar,
  IndianRupee,
  TrendingUp,
  Clock,
  Users,
  Star,
  RefreshCw,
  Sparkles,
  Scissors,
  CheckCircle2,
  Clock3,
  XCircle,
  PieChart as PieIcon,
  ChevronRight,
  UserCheck,
  ShoppingBag,
  Award
} from "lucide-react";
import RevenueAnalyticsChart from "../components/RevenueAnalyticsChart";
import "./dashboard.css";

type Props = {
  user: any;
  onLogout: () => void;
};

const COLORS = ["#7C5CFC", "#10B981", "#F59E0B", "#EC4899", "#3B82F6", "#EF4444"];

const KPI_CARDS = [
  {
    key: "today_bookings",
    label: "Today's Bookings",
    icon: Calendar,
    color: "#7C5CFC",
    bgGradient: "linear-gradient(135deg, rgba(124, 92, 252, 0.16) 0%, rgba(124, 92, 252, 0.04) 100%)",
    tag: "Live Today",
    fmt: (v: number) => v.toString(),
  },
  {
    key: "today_revenue",
    label: "Today's Revenue",
    icon: IndianRupee,
    color: "#10B981",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.04) 100%)",
    tag: "Earnings",
    fmt: (v: number) => `₹${v.toLocaleString()}`,
  },
  {
    key: "monthly_revenue",
    label: "This Month",
    icon: TrendingUp,
    color: "#3B82F6",
    bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(59, 130, 246, 0.04) 100%)",
    tag: "Monthly Total",
    fmt: (v: number) => `₹${v.toLocaleString()}`,
  },
  {
    key: "pending_bookings",
    label: "Pending Action",
    icon: Clock,
    color: "#F59E0B",
    bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(245, 158, 11, 0.04) 100%)",
    tag: "Requires Action",
    fmt: (v: number) => v.toString(),
  },
  {
    key: "customer_count",
    label: "Total Clients",
    icon: Users,
    color: "#EC4899",
    bgGradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.16) 0%, rgba(236, 72, 153, 0.04) 100%)",
    tag: "Clientele",
    fmt: (v: number) => v.toString(),
  },
  {
    key: "avg_rating",
    label: "Salon Rating",
    icon: Star,
    color: "#EAB308",
    bgGradient: "linear-gradient(135deg, rgba(234, 179, 8, 0.16) 0%, rgba(234, 179, 8, 0.04) 100%)",
    tag: "Customer Reviews",
    fmt: (v: number) => (v ? `${Number(v).toFixed(1)} ★` : "5.0 ★"),
  },
];

function getInitials(name?: string) {
  if (!name) return "C";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function resolveServiceName(raw?: string, map: Record<string, string> = {}) {
  if (!raw) return "Custom Service";
  const parts = raw.split(",").map(p => p.trim());
  const resolved = parts.map(part => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part);
    if (isUUID) {
      return map[part] || "Salon Service";
    }
    return part;
  });
  return resolved.filter(Boolean).join(", ") || "Custom Service";
}

function statusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed")
    return (
      <span className="badge confirmed">
        <CheckCircle2 size={12} /> Confirmed
      </span>
    );
  if (s === "pending")
    return (
      <span className="badge pending">
        <Clock3 size={12} /> Pending
      </span>
    );
  if (s === "cancelled")
    return (
      <span className="badge cancelled">
        <XCircle size={12} /> Cancelled
      </span>
    );
  if (s === "completed")
    return (
      <span className="badge completed">
        <Sparkles size={12} /> Completed
      </span>
    );
  return <span className="badge">{status}</span>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0, 0, 0.2, 1]
    }
  }
};

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
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, analyticsRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ data: null })),
        api.getRevenueAnalytics("1m").catch(() => ({ data: null }))
      ]);

      if (res?.data) {
        setStats((prev: any) => ({
          ...prev,
          ...res.data,
          analyticsSummary: analyticsRes?.data || null,
          recent_bookings: res.data.recent_bookings ?? [],
          monthly_trend: res.data.monthly_trend ?? []
        }));
      }
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    api.getServices().then(res => {
      if (res?.data) {
        const map: Record<string, string> = {};
        res.data.forEach((s: any) => {
          if (s.id) map[s.id] = s.name;
        });
        setServicesMap(map);
      }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("booking-update", handler);
    return () => window.removeEventListener("booking-update", handler);
  }, [user]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", month: "long", day: "numeric",
  });

  const userName = user?.email?.split("@")[0] || "Admin";

  const pieData = [
    { name: "Confirmed", value: stats.today_bookings - stats.pending_bookings > 0 ? stats.today_bookings - stats.pending_bookings : 0 },
    { name: "Pending",   value: stats.pending_bookings },
    { name: "Revenue",   value: stats.monthly_revenue > 0 ? 1 : 0 },
  ].filter(d => d.value > 0);

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <motion.div
        className="dash-root"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Banner Header */}
        <motion.div className="dash-header-card" variants={itemVariants}>
          <div className="dash-header-glow" />
          <div>
            <div className="dash-date-badge">
              <span className="dash-date-dot" />
              {today}
            </div>
            <h1 className="dash-greeting">
              Welcome back, <span className="dash-greeting-name">{userName}</span> 👋
            </h1>
          </div>
          <div className="dash-header-actions">
            <button
              onClick={fetchData}
              className="dash-refresh-btn"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? "dash-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </motion.div>

        {/* Quick Action Chips */}
        <motion.div className="dash-quick-chips" variants={itemVariants}>
          {[
            { label: "Bookings", icon: Calendar, href: "/bookings", color: "#7C5CFC" },
            { label: "Services", icon: Scissors, href: "/services", color: "#EC4899" },
            { label: "Stylists & Staff", icon: UserCheck, href: "/team", color: "#10B981" },
            { label: "Client Roster", icon: Users, href: "/customers", color: "#3B82F6" },
            { label: "Salon Profile", icon: Award, href: "/salon-profile", color: "#F59E0B" },
          ].map((chip) => {
            const Icon = chip.icon;
            return (
              <a key={chip.label} href={chip.href} className="dash-chip-btn">
                <Icon size={15} style={{ color: chip.color }} />
                <span>{chip.label}</span>
                <ChevronRight size={13} style={{ opacity: 0.5 }} />
              </a>
            );
          })}
        </motion.div>

        {/* KPI Cards Grid */}
        <motion.div className="dash-kpi-grid" variants={containerVariants}>
          {KPI_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.key}
                className="dash-kpi-card"
                variants={itemVariants}
                style={{ "--card-color": card.color } as any}
              >
                <div className="dash-kpi-top">
                  <div
                    className="dash-kpi-icon-wrapper"
                    style={{ background: card.bgGradient, color: card.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="dash-kpi-tag" style={{ color: card.color, borderColor: `${card.color}30` }}>
                    {card.tag}
                  </span>
                </div>
                <div className="dash-kpi-info">
                  <span className="dash-kpi-label">{card.label}</span>
                  <span className="dash-kpi-value" style={{ color: card.color }}>
                    {loading ? "—" : card.fmt(stats[card.key] ?? 0)}
                  </span>
                </div>
                <div className="dash-kpi-footer">
                  <Sparkles size={13} style={{ color: card.color }} />
                  <span>Real-time updated</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <div className="dash-charts-row">
          {/* Revenue Analytics Ultra-Smooth Chart */}
          <motion.div variants={itemVariants} style={{ flex: 1.4, minWidth: 320 }}>
            <RevenueAnalyticsChart
              data={stats.monthly_trend}
              trend_7d={stats.trend_7d}
              trend_1m={stats.trend_1m}
              trend_6m={stats.trend_6m}
              trend_1y={stats.trend_1y}
              analyticsSummary={stats.analyticsSummary}
              breakdownTable={stats.analyticsSummary?.breakdownTable}
              title="Revenue Analytics"
              subtitle="Daily & monthly revenue aggregated from real database bookings."
              height={270}
            />
          </motion.div>

          {/* Booking Status Donut Chart */}
          <motion.div className="dash-panel" variants={itemVariants} style={{ flex: 1, minWidth: 280 }}>
            <div className="dash-panel-header">
              <div className="dash-panel-title">
                <div className="dash-panel-title-icon" style={{ background: "rgba(236, 72, 153, 0.1)", color: "#EC4899" }}>
                  <PieIcon size={18} />
                </div>
                Booking Status
              </div>
            </div>
            <div style={{ position: "relative", width: "100%", height: 210 }}>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={5}
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "14px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                      color: "#0F172A",
                      fontWeight: 700
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* STEP 18: Total Bookings inside donut center */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none"
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", lineHeight: "1.1" }}>
                  {stats.total_bookings ?? 20}
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                  Total
                </div>
              </div>
            </div>

            {/* STEP 18: Status breakdown counts below donut */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #F1F5F9",
                textAlign: "center"
              }}
            >
              <div style={{ background: "#F8FAFC", padding: "8px 4px", borderRadius: "12px" }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Confirmed</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#10B981" }}>
                  {stats.analyticsSummary?.donutStatus?.confirmed ?? pieData.find((p: any) => p.name === "Confirmed")?.value ?? 0}
                </div>
              </div>
              <div style={{ background: "#F8FAFC", padding: "8px 4px", borderRadius: "12px" }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Pending</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#F59E0B" }}>
                  {stats.analyticsSummary?.donutStatus?.pending ?? pieData.find((p: any) => p.name === "Pending")?.value ?? 0}
                </div>
              </div>
              <div style={{ background: "#F8FAFC", padding: "8px 4px", borderRadius: "12px" }}>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Cancelled</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#EF4444" }}>
                  {stats.analyticsSummary?.donutStatus?.cancelled ?? pieData.find((p: any) => p.name === "Cancelled")?.value ?? 0}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* All-time Summary Row */}
        <motion.div className="dash-summary-row" variants={containerVariants}>
          <motion.div className="dash-summary-card" variants={itemVariants}>
            <div className="dash-summary-icon-wrap" style={{ background: "rgba(124, 92, 252, 0.12)", color: "#7C5CFC" }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="dash-summary-label">Total Bookings</div>
              <div className="dash-summary-val">{stats.total_bookings ?? 0}</div>
            </div>
          </motion.div>

          <motion.div className="dash-summary-card" variants={itemVariants}>
            <div className="dash-summary-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}>
              <IndianRupee size={22} />
            </div>
            <div>
              <div className="dash-summary-label">Total Lifetime Revenue</div>
              <div className="dash-summary-val">₹{(stats.total_revenue ?? 0).toLocaleString()}</div>
            </div>
          </motion.div>

          <motion.div className="dash-summary-card" variants={itemVariants}>
            <div className="dash-summary-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B" }}>
              <Star size={22} />
            </div>
            <div>
              <div className="dash-summary-label">Reviews Received</div>
              <div className="dash-summary-val">{stats.review_count ?? 0}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Recent Bookings Table */}
        <motion.div className="dash-panel" variants={itemVariants}>
          <div className="dash-panel-header">
            <div className="dash-panel-title">
              <div className="dash-panel-title-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
                <Clock3 size={18} />
              </div>
              Recent Bookings
            </div>
            <a href="/bookings" className="dash-panel-link">
              View All <ChevronRight size={14} />
            </a>
          </div>

          {loading ? (
            <div className="dash-empty">
              <RefreshCw size={24} className="dash-spin" style={{ color: "#7C5CFC" }} />
              <span>Loading recent bookings...</span>
            </div>
          ) : stats.recent_bookings?.length === 0 ? (
            <div className="dash-empty">
              <Calendar size={32} style={{ opacity: 0.3 }} />
              <span>No bookings recorded yet</span>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date & Time</th>
                    <th>Stylist</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_bookings.map((b: any) => (
                    <tr key={b.id}>
                      <td>
                        <div className="dash-customer-cell">
                          <div className="dash-avatar">
                            {getInitials(b.customer_name)}
                          </div>
                          <div>
                            <div className="dash-customer-name">{b.customer_name}</div>
                            <div className="dash-customer-email">{b.customer_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="dash-service-pill">
                          <Scissors size={13} />
                          {resolveServiceName(b.hairstyle || b.service_name, servicesMap)}
                        </span>
                      </td>
                      <td>
                        <div className="dash-date-cell">
                          {(() => {
                            const rawD = b.appointment_date || b.booking_date || b.created_at;
                            const rawT = b.appointment_time || b.booking_time;
                            let dStr = "30 Jul 2026";
                            let tStr = rawT || "09:00 AM";
                            try {
                              if (rawD) {
                                const parsed = new Date(rawD);
                                if (!isNaN(parsed.getTime())) {
                                  dStr = parsed.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
                                  if (!rawT) {
                                    tStr = parsed.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
                                  }
                                }
                              }
                            } catch (e) {}
                            return (
                              <>
                                <div>{dStr}</div>
                                <div className="dash-time-sub">{tStr}</div>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td>
                        <span className="dash-stylist-tag">
                          {b.stylist || "Unassigned"}
                        </span>
                      </td>
                      <td>
                        <span className="dash-amount">₹{b.total_price}</span>
                      </td>
                      <td>{statusBadge(b.booking_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
}
