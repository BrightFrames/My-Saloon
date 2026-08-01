/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import { motion, type Variants } from "framer-motion";
import {
  Star,
  RefreshCw,
  Search,
  Send,
  CheckCircle2,
  HelpCircle,
  Clock3,
  Scissors,
  UserCheck,
  Users,
  Crown
} from "lucide-react";
import "./pages.css";

type Props = { user: any; onLogout: () => void };

function getInitials(name?: string) {
  if (!name) return "C";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function CustomersPage({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<"feedback" | "queries" | "customers" | "loyalty">("feedback");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [queryStatusFilter, setQueryStatusFilter] = useState("all");

  // Reply states
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, qRes, custRes] = await Promise.all([
        api.getReviews().catch(() => ({ data: [] })),
        api.getQueries().catch(() => ({ data: [] })),
        api.getCustomers().catch(() => ({ data: [] })),
      ]);
      setFeedbacks(revRes?.data || []);
      setQueries(qRes?.data || []);
      setCustomers(custRes?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Reply handler for Feedback
  const handleReplyFeedback = async (id: string) => {
    const text = replyText[id];
    if (!text?.trim()) return;
    setSubmitting(prev => ({ ...prev, [id]: true }));
    try {
      await api.replyToReview(id, text);
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, reply: text } : f));
      setReplyText(prev => ({ ...prev, [id]: "" }));
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  // Reply handler for Queries
  const handleReplyQuery = async (id: string) => {
    const text = replyText[id];
    if (!text?.trim()) return;
    setSubmitting(prev => ({ ...prev, [id]: true }));
    try {
      await api.replyToQuery(id, text);
      setQueries(prev => prev.map(q => q.id === id ? { ...q, reply: text, status: "Answered" } : q));
      setReplyText(prev => ({ ...prev, [id]: "" }));
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  // Filtered Feedbacks
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch =
      f.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      f.comment?.toLowerCase().includes(search.toLowerCase());
    if (ratingFilter === "5") return matchesSearch && f.rating === 5;
    if (ratingFilter === "4") return matchesSearch && f.rating === 4;
    if (ratingFilter === "3below") return matchesSearch && f.rating <= 3;
    return matchesSearch;
  });

  // Filtered Queries
  const filteredQueries = queries.filter(q => {
    const matchesSearch =
      q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      q.query_text?.toLowerCase().includes(search.toLowerCase()) ||
      q.topic?.toLowerCase().includes(search.toLowerCase());
    if (queryStatusFilter === "pending") return matchesSearch && (q.status === "Pending" || !q.reply);
    if (queryStatusFilter === "answered") return matchesSearch && (q.status === "Answered" || !!q.reply);
    return matchesSearch;
  });

  const pendingQueryCount = queries.filter(q => q.status === "Pending" || !q.reply).length;

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <motion.div
        className="page-root"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Customer Feedback & Queries</h1>
            <p className="page-subtitle">
              Separate view for client ratings & feedback, and direct customer support inquiries.
            </p>
          </div>
          <button onClick={fetchData} className="dash-refresh-btn">
            <RefreshCw size={15} className={loading ? "dash-spin" : ""} />
            Refresh
          </button>
        </div>

          {/* Tab Selection */}
          <div className="tab-bar" style={{ marginBottom: 0 }}>
            <button onClick={() => setActiveTab("customers")} className={`tab-btn ${activeTab === "customers" ? "active" : ""}`}>
              <Users size={15} /> Customers ({customers.length})
            </button>
            <button onClick={() => setActiveTab("loyalty")} className={`tab-btn ${activeTab === "loyalty" ? "active" : ""}`}>
              <Crown size={15} /> Loyal Customers ({customers.filter(c => c.is_loyal).length})
            </button>
            <button onClick={() => setActiveTab("feedback")} className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}>
              <Star size={15} /> Feedback ({feedbacks.length})
            </button>
            <button onClick={() => setActiveTab("queries")} className={`tab-btn ${activeTab === "queries" ? "active" : ""}`}>
              <HelpCircle size={15} /> Queries ({queries.length})
              {pendingQueryCount > 0 && <span className="tab-badge">{pendingQueryCount}</span>}
            </button>
          </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search size={16} style={{ position: "absolute", left: 16, top: 14, color: "var(--muted)" }} />
          <input
            type="text"
            placeholder={
              activeTab === "feedback"
                ? "Search feedback by customer name, email, or comment..."
                : "Search queries by customer name, topic, or question..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              background: "var(--panel-bg)",
              color: "var(--text-h)",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* TAB 1: CUSTOMER FEEDBACK (REVIEWS) */}
        {activeTab === "feedback" && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Filter Pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { id: "all", label: "All Feedback" },
                { id: "5", label: "5 Stars ★" },
                { id: "4", label: "4 Stars ★" },
                { id: "3below", label: "3 Stars & Below" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setRatingFilter(f.id)}
                  style={{
                    background: ratingFilter === f.id ? "#7C5CFC" : "var(--panel-bg)",
                    color: ratingFilter === f.id ? "#FFFFFF" : "var(--muted)",
                    border: "1px solid",
                    borderColor: ratingFilter === f.id ? "#7C5CFC" : "var(--border)",
                    borderRadius: "12px",
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="dash-empty">
                <RefreshCw size={24} className="dash-spin" style={{ color: "#7C5CFC" }} />
                <span>Loading customer feedback...</span>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="dash-empty">
                <Star size={36} style={{ opacity: 0.3 }} />
                <span>No customer feedback records found</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredFeedbacks.map((f: any) => (
                  <motion.div
                    key={f.id}
                    variants={itemVariants}
                    style={{
                      background: "var(--panel-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      padding: 24,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                    }}
                  >
                    {/* Top Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="dash-avatar" style={{ width: 42, height: 42, fontSize: 16 }}>
                          {getInitials(f.customer_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-h)" }}>{f.customer_name}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{f.customer_email}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                            color: "#FFFFFF",
                            fontSize: 13,
                            fontWeight: 800,
                            padding: "4px 12px",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <Star size={13} fill="#FFFFFF" /> {f.rating}.0
                        </span>
                      </div>
                    </div>

                    {/* Service Pill */}
                    {f.service_name && (
                      <div style={{ marginBottom: 12 }}>
                        <span className="dash-service-pill">
                          <Scissors size={12} /> {f.service_name}
                        </span>
                      </div>
                    )}

                    {/* Feedback Comment */}
                    <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "var(--text-h)", lineHeight: "1.5" }}>
                      "{f.comment}"
                    </p>

                    {/* Owner Reply Block */}
                    {f.reply ? (
                      <div
                        style={{
                          background: "rgba(124, 92, 252, 0.06)",
                          borderLeft: "3px solid #7C5CFC",
                          padding: "12px 16px",
                          borderRadius: "0 12px 12px 0",
                          marginTop: 12
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#7C5CFC", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          <UserCheck size={14} /> Salon Response:
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-h)" }}>{f.reply}</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <input
                          type="text"
                          placeholder="Write a response to this feedback..."
                          value={replyText[f.id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [f.id]: e.target.value })}
                          style={{
                            flex: 1,
                            padding: "8px 14px",
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            background: "var(--bg)",
                            color: "var(--text-h)",
                            fontSize: 13
                          }}
                        />
                        <button
                          onClick={() => handleReplyFeedback(f.id)}
                          disabled={submitting[f.id]}
                          style={{
                            background: "#7C5CFC",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 12,
                            padding: "8px 16px",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <Send size={13} /> {submitting[f.id] ? "Publishing..." : "Reply"}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: CUSTOMER QUERIES */}
        {activeTab === "queries" && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Status Filter Pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { id: "all", label: "All Queries" },
                { id: "pending", label: "Pending Response 🟡" },
                { id: "answered", label: "Answered 🟢" },
              ].map(q => (
                <button
                  key={q.id}
                  onClick={() => setQueryStatusFilter(q.id)}
                  style={{
                    background: queryStatusFilter === q.id ? "#3B82F6" : "var(--panel-bg)",
                    color: queryStatusFilter === q.id ? "#FFFFFF" : "var(--muted)",
                    border: "1px solid",
                    borderColor: queryStatusFilter === q.id ? "#3B82F6" : "var(--border)",
                    borderRadius: "12px",
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="dash-empty">
                <RefreshCw size={24} className="dash-spin" style={{ color: "#3B82F6" }} />
                <span>Loading customer queries...</span>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="dash-empty">
                <HelpCircle size={36} style={{ opacity: 0.3 }} />
                <span>No customer query records found</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredQueries.map((q: any) => (
                  <motion.div
                    key={q.id}
                    variants={itemVariants}
                    style={{
                      background: "var(--panel-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      padding: 24,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                    }}
                  >
                    {/* Top Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="dash-avatar" style={{ width: 42, height: 42, fontSize: 16, background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
                          {getInitials(q.customer_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-h)" }}>{q.customer_name}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{q.customer_email}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            background: q.status === "Answered" || q.reply ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                            color: q.status === "Answered" || q.reply ? "#10B981" : "#F59E0B",
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "4px 12px",
                            borderRadius: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          {q.status === "Answered" || q.reply ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                          {q.status === "Answered" || q.reply ? "Answered" : "Pending Response"}
                        </span>
                      </div>
                    </div>

                    {/* Topic Badge */}
                    <div style={{ marginBottom: 10 }}>
                      <span
                        style={{
                          background: "rgba(59, 130, 246, 0.08)",
                          color: "#3B82F6",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "10px"
                        }}
                      >
                        📌 {q.topic || "General"}
                      </span>
                    </div>

                    {/* Question Box */}
                    <div
                      style={{
                        background: "var(--bg)",
                        padding: "14px 16px",
                        borderRadius: 14,
                        fontSize: 14,
                        color: "var(--text-h)",
                        lineHeight: "1.5",
                        marginBottom: 14
                      }}
                    >
                      <strong style={{ color: "#3B82F6" }}>Q: </strong> "{q.query_text}"
                    </div>

                    {/* Response Area */}
                    {q.reply ? (
                      <div
                        style={{
                          background: "rgba(16, 185, 129, 0.06)",
                          borderLeft: "3px solid #10B981",
                          padding: "12px 16px",
                          borderRadius: "0 12px 12px 0"
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={14} /> Salon Answer Sent:
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-h)" }}>{q.reply}</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <input
                            type="text"
                            placeholder="Type an answer to send to customer..."
                            value={replyText[q.id] || ""}
                            onChange={(e) => setReplyText({ ...replyText, [q.id]: e.target.value })}
                            style={{
                              flex: 1,
                              padding: "10px 14px",
                              borderRadius: 12,
                              border: "1px solid var(--border)",
                              background: "var(--bg)",
                              color: "var(--text-h)",
                              fontSize: 13
                            }}
                          />
                          <button
                            onClick={() => handleReplyQuery(q.id)}
                            disabled={submitting[q.id]}
                            style={{
                              background: "#3B82F6",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 12,
                              padding: "10px 18px",
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6
                            }}
                          >
                            <Send size={13} /> {submitting[q.id] ? "Sending..." : "Send Response"}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {/* Customer List Tab */}
        {activeTab === "customers" && (
          <motion.div variants={itemVariants}>
            {loading ? (
              <div className="empty-state" style={{ padding: 48, color: 'var(--muted)' }}>Loading customers...</div>
            ) : customers.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <Users size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>No customers yet</h3>
                <p>Customers who book appointments will appear here.</p>
              </div>
            ) : (
              <div className="dash-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Total Bookings</th>
                      <th>Loyalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c: any) => (
                      <tr key={c.email || c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar-circle" style={{ width: 36, height: 36, fontSize: 12, background: 'linear-gradient(135deg, #7C5CFC 0%, #EC4899 100%)' }}>
                              {getInitials(c.name || c.customer_name)}
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-h)' }}>{c.name || c.customer_name || '—'}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{c.email || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{c.total_bookings ?? c.booking_count ?? '—'}</td>
                        <td>
                          {c.is_loyal ? (
                            <span className="badge confirmed" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                              <Crown size={12} /> Loyal
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Regular</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Loyalty Tab */}
        {activeTab === "loyalty" && (
          <motion.div variants={itemVariants}>
            {(() => {
              const loyal = customers.filter(c => c.is_loyal);
              return loyal.length === 0 ? (
                <div className="empty-state" style={{ padding: 48 }}>
                  <Crown size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <h3>No loyal customers yet</h3>
                  <p>Mark customers as loyal from the Customer List tab.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
                  {loyal.map((c: any) => (
                    <div key={c.email || c.id} className="stat-card" style={{ borderTop: '3px solid #F59E0B', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar-circle" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)' }}>
                          {getInitials(c.name || c.customer_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: 15 }}>{c.name || c.customer_name || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className="badge confirmed" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Crown size={11} /> Loyal Customer</span>
                        {c.total_bookings && <span className="badge" style={{ background: 'rgba(124,92,252,0.1)', color: '#7C5CFC' }}>{c.total_bookings} Bookings</span>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}

      </motion.div>
    </Layout>
  );
}
