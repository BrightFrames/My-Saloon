import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

type Props = { user: any; onLogout: () => void };

export default function EarningsPage({ user, onLogout }: Props) {
  const [earnings, setEarnings] = useState<any>({
    total_revenue: 0, pending_amount: 0, commission_deducted: 0,
    net_earnings: 0, monthly_trend: [], transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "withdraw">("overview");

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.getEarnings();
      if (res?.data) setEarnings(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [user]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;
    setWithdrawing(true);
    try {
      await api.requestWithdrawal(Number(withdrawAmount));
      setWithdrawMsg("✅ Withdrawal request submitted successfully.");
      setWithdrawAmount("");
    } catch (e: any) {
      setWithdrawMsg("❌ " + (e.message || "Failed to submit request."));
    }
    setWithdrawing(false);
  };

  const COMMISSION_RATE = 0.10;

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="page-root">
        <div className="page-header">
          <div>
            <h1 className="page-title">💰 Earnings</h1>
            <p className="page-sub">Track your revenue, commission, and payouts.</p>
          </div>
          <button onClick={fetch} className="btn-outline">🔄 Refresh</button>
        </div>

        {/* Summary Cards */}
        <div className="earnings-cards-grid">
          {[
            { label: "Total Revenue", val: `₹${Number(earnings.total_revenue || 0).toLocaleString()}`, color: "#7C5CFC", icon: "💵" },
            { label: "Platform Commission (10%)", val: `₹${(Number(earnings.total_revenue || 0) * COMMISSION_RATE).toLocaleString()}`, color: "#EF4444", icon: "🏷️" },
            { label: "Net Earnings", val: `₹${(Number(earnings.total_revenue || 0) * (1 - COMMISSION_RATE)).toLocaleString()}`, color: "#10B981", icon: "✅" },
            { label: "Pending Payments", val: `₹${Number(earnings.pending_amount || 0).toLocaleString()}`, color: "#F59E0B", icon: "⏳" },
          ].map(c => (
            <div key={c.label} className="earnings-card" style={{ borderTop: `3px solid ${c.color}` }}>
              <span style={{ fontSize: 24 }}>{c.icon}</span>
              <div>
                <div className="earnings-card-label">{c.label}</div>
                <div className="earnings-card-val" style={{ color: c.color }}>{c.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {(["overview", "transactions", "withdraw"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`tab-btn ${activeTab === t ? "active" : ""}`}
            >
              {t === "overview" ? "📊 Overview" : t === "transactions" ? "📋 Transactions" : "💳 Withdraw"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="panel">
            <div className="panel-title">Monthly Revenue Trend</div>
            {earnings.monthly_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={earnings.monthly_trend}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: "var(--panel-bg)", border: "1px solid var(--border)", borderRadius: 10 }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#earnGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="panel-empty">No trend data available yet.</div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="panel">
            <div className="panel-title">Transaction History</div>
            {loading ? (
              <div className="panel-empty">Loading...</div>
            ) : earnings.transactions?.length === 0 ? (
              <div className="panel-empty">No transactions found.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Net</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.transactions.map((t: any) => (
                    <tr key={t.id}>
                      <td>{t.booking_date || t.appointment_date || "—"}</td>
                      <td>{t.customer_name}</td>
                      <td>{t.hairstyle || "—"}</td>
                      <td>₹{Number(t.total_price || 0).toFixed(0)}</td>
                      <td style={{ color: "#EF4444" }}>-₹{(Number(t.total_price || 0) * 0.10).toFixed(0)}</td>
                      <td style={{ color: "#10B981", fontWeight: 600 }}>₹{(Number(t.total_price || 0) * 0.90).toFixed(0)}</td>
                      <td><span className={`status-badge ${t.booking_status}`}>{t.booking_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "withdraw" && (
          <div className="panel" style={{ maxWidth: 480 }}>
            <div className="panel-title">💳 Request Withdrawal</div>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
              Available balance: <strong style={{ color: "var(--text-h)" }}>
                ₹{(Number(earnings.total_revenue || 0) * 0.90).toLocaleString()}
              </strong>
            </p>
            <div className="form-group">
              <label className="form-label">Withdrawal Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                min="1"
              />
            </div>
            {withdrawMsg && (
              <div className={`alert-msg ${withdrawMsg.startsWith("✅") ? "success" : "error"}`}>
                {withdrawMsg}
              </div>
            )}
            <button className="btn-primary" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? "Submitting..." : "Request Withdrawal"}
            </button>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
              Withdrawals are processed within 3–5 business days. A 10% platform commission has already been deducted.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
