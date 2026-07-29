import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

type Props = { user: any; onLogout: () => void };
type ReportType = "daily" | "monthly" | "services" | "staff" | "retention";

const COLORS = ["#7C5CFC", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

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
      <div className="page-root">
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 Reports</h1>
            <p className="page-sub">Detailed analytics and performance insights.</p>
          </div>
          <div className="header-actions">
            <button onClick={exportCSV} className="btn-outline" disabled={!reportData?.rows?.length}>
              📥 Export CSV
            </button>
            <button onClick={fetchReport} className="btn-outline">🔄 Refresh</button>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="tab-bar" style={{ flexWrap: "wrap" }}>
          {([
            ["daily",     "📅 Daily"],
            ["monthly",   "📆 Monthly"],
            ["services",  "✂️ Best Services"],
            ["staff",     "👤 Staff Performance"],
            ["retention", "🔄 Customer Retention"],
          ] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`tab-btn ${reportType === t ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date selector for daily */}
        {reportType === "daily" && (
          <div className="report-date-row">
            <label className="form-label">Select Date</label>
            <input
              type="date"
              className="form-input"
              style={{ width: "auto" }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button className="btn-primary" onClick={fetchReport}>Load Report</button>
          </div>
        )}

        {loading ? (
          <div className="panel-empty">Loading report...</div>
        ) : !reportData ? (
          <div className="panel-empty">No data available for this report.</div>
        ) : (
          <>
            {/* Summary KPIs */}
            {reportData.summary && (
              <div className="report-kpi-row">
                {Object.entries(reportData.summary).map(([k, v]) => (
                  <div key={k} className="report-kpi-card">
                    <div className="report-kpi-label">{k.replace(/_/g, " ").toUpperCase()}</div>
                    <div className="report-kpi-val">{typeof v === "number" && k.includes("revenue") ? `₹${Number(v).toLocaleString()}` : String(v)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Chart */}
            {reportData.chart_data && reportData.chart_data.length > 0 && (
              <div className="panel">
                <div className="panel-title">
                  {reportType === "services" ? "Top Services by Bookings" :
                   reportType === "staff"    ? "Staff Bookings" :
                   "Revenue Trend"}
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
                      <Tooltip contentStyle={{ background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 10 }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={reportData.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                      <Tooltip contentStyle={{ background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 10 }} />
                      <Bar dataKey="value" fill="#7C5CFC" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Data Table */}
            {reportData.rows && reportData.rows.length > 0 && (
              <div className="panel">
                <div className="panel-title">Detailed Data</div>
                <div style={{ overflowX: "auto" }}>
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
                            <td key={j}>{typeof v === "number" ? v.toLocaleString() : String(v ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
