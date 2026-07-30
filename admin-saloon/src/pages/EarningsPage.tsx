import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import { motion, type Variants } from "framer-motion";
import {
  IndianRupee,
  Clock,
  CreditCard,
  BarChart3,
  FileText,
  RefreshCw,
  Percent,
  CheckCircle2
} from "lucide-react";
import RevenueAnalyticsChart from "../components/RevenueAnalyticsChart";
import "./pages.css";

type Props = { user: any; onLogout: () => void };

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

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
      <motion.div
        className="page-root"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">
              <IndianRupee size={26} style={{ color: "#10B981" }} />
              Revenue & Payouts
            </h1>
            <p className="page-sub">Track total salon revenue, platform commission, and withdrawal requests.</p>
          </div>
          <button onClick={fetch} className="btn-outline">
            <RefreshCw size={15} /> Refresh
          </button>
        </motion.div>

        {/* Summary Stat Cards */}
        <motion.div className="earnings-cards-grid" variants={containerVariants}>
          {[
            { label: "Total Lifetime Revenue", val: `₹${Number(earnings.total_revenue || 0).toLocaleString()}`, color: "#7C5CFC", icon: IndianRupee },
            { label: "Platform Commission (10%)", val: `₹${(Number(earnings.total_revenue || 0) * COMMISSION_RATE).toLocaleString()}`, color: "#EF4444", icon: Percent },
            { label: "Net Lifetime Earnings", val: `₹${(Number(earnings.total_revenue || 0) * (1 - COMMISSION_RATE)).toLocaleString()}`, color: "#10B981", icon: CheckCircle2 },
            { label: "Pending Payments", val: `₹${Number(earnings.pending_amount || 0).toLocaleString()}`, color: "#F59E0B", icon: Clock },
          ].map(c => {
            const Icon = c.icon;
            return (
              <motion.div key={c.label} className="earnings-card" variants={itemVariants} style={{ borderTop: `3px solid ${c.color}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="label">{c.label}</span>
                  <div style={{ padding: 8, borderRadius: 10, background: `${c.color}15`, color: c.color }}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="value" style={{ color: c.color }}>{c.val}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tabs */}
        <motion.div className="tab-bar" variants={itemVariants}>
          {[
            ["overview", "Overview & Trend", BarChart3],
            ["transactions", "Transaction History", FileText],
            ["withdraw", "Withdraw Funds", CreditCard]
          ].map(([t, label, Icon]: any) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`tab-btn ${activeTab === t ? "active" : ""}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </motion.div>

        {activeTab === "overview" && (
          <motion.div variants={itemVariants}>
            <RevenueAnalyticsChart
              data={earnings.monthly_trend}
              title="Revenue Analytics"
              subtitle="Monthly revenue aggregated across all bookings for selected period."
              height={300}
            />
          </motion.div>
        )}

        {activeTab === "transactions" && (
          <motion.div className="customers-list-panel" variants={itemVariants}>
            <div className="panel-header">
              <FileText size={18} style={{ color: "#7C5CFC" }} />
              Recent Transactions
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>Loading transactions...</div>
            ) : earnings.transactions?.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>No transactions recorded.</div>
            ) : (
              <div className="dash-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Total Amount</th>
                      <th>Commission (10%)</th>
                      <th>Net Payout</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.transactions.map((t: any) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{t.booking_date || t.appointment_date || "—"}</td>
                        <td style={{ fontWeight: 700, color: "var(--text-h)" }}>{t.customer_name}</td>
                        <td>{t.hairstyle || "Hair Service"}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(t.total_price || 0).toFixed(0)}</td>
                        <td style={{ color: "#EF4444", fontWeight: 600 }}>-₹{(Number(t.total_price || 0) * 0.10).toFixed(0)}</td>
                        <td style={{ color: "#10B981", fontWeight: 800 }}>₹{(Number(t.total_price || 0) * 0.90).toFixed(0)}</td>
                        <td><span className={`badge ${t.booking_status}`}>{t.booking_status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "withdraw" && (
          <motion.div className="profile-card" variants={itemVariants} style={{ maxWidth: 520 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px 0", color: "var(--text-h)", display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={20} style={{ color: "#10B981" }} /> Request Withdrawal
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
              Available Net Balance: <strong style={{ color: "#10B981", fontSize: 16 }}>
                ₹{(Number(earnings.total_revenue || 0) * 0.90).toLocaleString()}
              </strong>
            </p>
            <div className="form-group">
              <label>Withdrawal Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter amount to withdraw"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                min="1"
              />
            </div>
            {withdrawMsg && (
              <div style={{
                padding: "12px 16px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                background: withdrawMsg.startsWith("✅") ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: withdrawMsg.startsWith("✅") ? "#10B981" : "#EF4444"
              }}>
                {withdrawMsg}
              </div>
            )}
            <button className="btn-add" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? "Submitting..." : "Submit Withdrawal Request"}
            </button>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 }}>
              Withdrawal requests are processed directly into your registered bank account within 3–5 business days.
            </p>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
