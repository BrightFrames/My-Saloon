import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import "./dashboard.css";
import "./pages.css";
import Charts from "../components/Charts";

type Props = {
  user: any;
  onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total_bookings: 0,
    total_revenue: 0,
    today_appointments: 0,
    pending_bookings: 0,
  });

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
  }, [user]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="dashboard-root container">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="date">{today}</div>
            <h1 className="greeting">
              Good morning, {user?.email ? user.email.split("@")[0] : "Admin"}
            </h1>
          </div>
          <div className="header-right">
            <div className="small-stats">
              <div className="stat">
                Total Bookings
                <br />
                <strong>{stats.total_bookings}</strong>
              </div>
            </div>
          </div>
        </header>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">
              ₹{stats.total_revenue.toLocaleString()}
            </div>
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
          <div className="card charts-full">
            <div className="card-title">
              <span>Insights</span>
            </div>
            <Charts stats={stats} bookings={bookings} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
