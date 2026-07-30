import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { motion, type Variants } from "framer-motion";
import {
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  Scissors,
  Users,
  TrendingUp,
  UserCheck
} from "lucide-react";
import "./pages.css";

type Props = { user: any; onLogout: () => void };
type ReportType = "daily" | "monthly" | "services" | "staff" | "retention";

const COLORS = ["#7C5CFC", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function ReportsPage({ user, onLogout }: Props) {
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReport(reportType, selectedDate);
      setReportData(res?.data || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [reportType, user]);

  const exportCSV = () => {
    if (!reportData?.rows) return;
    const headers = Object.keys(reportData.rows[0] || {}).join(",");
    const rows = reportData.rows.map((r: any) => Object.values(r).join(",")).join("\n");
    const csv = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `${reportType}_report.csv`;
    a.click();
  };

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <motion.div
        className="page-root"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">
              <BarChart3 size={26} style={{ color: "#3B82F6" }} />
              Analytics & Performance Reports
            </h1>
            <p className="page-sub">Comprehensive metrics on revenue, service popularity, & staff efficiency.</p>
          </div>
          <div className="header-actions">
            <button onClick={exportCSV} className="btn-outline" disabled={!reportData?.rows?.length}>
              <Download size={15} /> Export CSV
            </button>
            <button onClick={fetchReport} className="btn-outline">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* Report Type Tabs */}
        <motion.div className="tab-bar" variants={itemVariants}>
          {[
            ["daily", "Daily Report", Calendar],
            ["monthly", "Monthly Performance", TrendingUp],
            ["services", "Top Services", Scissors],
            ["staff", "Staff Performance", UserCheck],
            ["retention", "Client Retention", Users],
          ].map(([t, label, Icon]: any) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`tab-btn ${reportType === t ? "active" : ""}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </motion.div>

        {/* Date selector for daily */}
        {reportType === "daily" && (
          <motion.div className="page-toolbar" variants={itemVariants}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Select Date:</label>
            <input
              type="date"
              style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--panel-bg)", color: "var(--text-h)" }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button className="btn-add" onClick={fetchReport} style={{ padding: "8px 16px", fontSize: 13 }}>
              Load Daily Report
            </button>
          </motion.div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>Loading analytics...</div>
        ) : !reportData ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <h3>No data available</h3>
            <p>Select a different date or report category.</p>
          </div>
        ) : (
          <>
            {/* Summary KPIs */}
            {reportData.summary && (
              <motion.div className="stats-row" variants={containerVariants}>
                {Object.entries(reportData.summary).map(([k, v]) => (
                  <motion.div key={k} className="stat-card" variants={itemVariants}>
                    <div className="stat-label">{k.replace(/_/g, " ").toUpperCase()}</div>
                    <div className="stat-value">
                      {typeof v === "number" && k.includes("revenue") ? `₹${Number(v).toLocaleString()}` : String(v)}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Chart */}
            {reportData.chart_data && reportData.chart_data.length > 0 && (
              <motion.div className="customers-list-panel" variants={itemVariants}>
                <div className="panel-header">
                  <BarChart3 size={18} style={{ color: "#7C5CFC" }} />
                  {reportType === "services" ? "Top Performing Services" :
                   reportType === "staff"    ? "Staff Booking Distribution" :
                   "Revenue Trend Analytics"}
                </div>
                {reportType === "services" ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={reportData.chart_data} cx="50%" cy="50%" outerRadius={100}
                        dataKey="value" nameKey="name" label paddingAngle={3} stroke="none">
                        {reportData.chart_data.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-h)" }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={reportData.chart_data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                      <Tooltip contentStyle={{ background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-h)" }} />
                      <Bar dataKey="value" fill="#7C5CFC" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            )}

            {/* Detailed Data Table */}
            {reportData.rows && reportData.rows.length > 0 && (
              <motion.div className="customers-list-panel" variants={itemVariants}>
                <div className="panel-header">Detailed Breakdown Data</div>
                <div className="dash-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {Object.keys(reportData.rows[0]).map((k: string) => (
                          <th key={k}>{k.replace(/_/g, " ").toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.map((row: any, i: number) => (
                        <tr key={i}>
                          {Object.values(row).map((v: any, j: number) => (
                            <td key={j} style={{ fontWeight: typeof v === "number" ? 700 : 500 }}>
                              {typeof v === "number" ? v.toLocaleString() : String(v ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  );
}
