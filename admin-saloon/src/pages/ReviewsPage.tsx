/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import { motion, type Variants } from "framer-motion";
import {
  Star,
  MessageSquare,
  RefreshCw,
  Send,
  CheckCircle2,
  BarChart3,
  Clock,
  HelpCircle,
  MessageCircle,
  Search,
  Filter,
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
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function ReviewsPage({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'summary'>('reviews');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  // Filters state
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [stats, setStats] = useState({
    avg: 0,
    count: 0,
    pendingQueries: 0,
    repliedQueries: 0,
    five: 0,
    four: 0,
    three: 0,
    two: 0,
    one: 0,
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const salonId = user?.salon_id || user?.id;
      const res = await api.getReviews(salonId);
      const data: any[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReviews(data);

      const serverStats = res?.stats || {};
      const pendingCount = serverStats.pendingQueries ?? data.filter(r => r.query && (!r.reply || r.status === 'Pending')).length;
      const repliedCount = serverStats.repliedQueries ?? data.filter(r => r.reply || r.status === 'Replied').length;

      if (data.length > 0) {
        const avg = data.reduce((s, r) => s + (Number(r.rating) || 5), 0) / data.length;
        setStats({
          avg: Math.round(avg * 10) / 10,
          count: data.length,
          pendingQueries: pendingCount,
          repliedQueries: repliedCount,
          five:  data.filter(r => Math.round(Number(r.rating) || 5) === 5).length,
          four:  data.filter(r => Math.round(Number(r.rating) || 5) === 4).length,
          three: data.filter(r => Math.round(Number(r.rating) || 5) === 3).length,
          two:   data.filter(r => Math.round(Number(r.rating) || 5) === 2).length,
          one:   data.filter(r => Math.round(Number(r.rating) || 5) === 1).length,
        });
      } else {
        setStats({ avg: 0, count: 0, pendingQueries: 0, repliedQueries: 0, five: 0, four: 0, three: 0, two: 0, one: 0 });
      }
    } catch (e) { console.error("Error loading reviews", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [user]);

  const submitReply = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;
    setSubmitting(p => ({ ...p, [reviewId]: true }));
    try {
      await api.replyToReview(reviewId, text);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: text, admin_reply: text, status: 'Replied' } : r));
      setReplyText(p => ({ ...p, [reviewId]: "" }));
      fetchReviews();
    } catch (e) { console.error(e); }
    setSubmitting(p => ({ ...p, [reviewId]: false }));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? "#EAB308" : "none"}
        color={i < rating ? "#EAB308" : "var(--muted)"}
        style={{ display: "inline-block", marginRight: 2 }}
      />
    ));
  };

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    // Rating Filter
    if (ratingFilter > 0 && Math.round(Number(r.rating)) !== ratingFilter) return false;

    // Status Filter
    const isReplied = r.status === "Replied" || Boolean(r.reply || r.admin_reply);
    if (statusFilter === "pending" && isReplied) return false;
    if (statusFilter === "replied" && !isReplied) return false;
    if (statusFilter === "pendingQueries" && (!r.query || isReplied)) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (r.user_name || r.customer_name || "").toLowerCase();
      const revText = (r.review || r.comment || "").toLowerCase();
      const qText = (r.query || "").toLowerCase();
      if (!name.includes(q) && !revText.includes(q) && !qText.includes(q)) return false;
    }

    return true;
  });

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
              <Star size={26} style={{ color: "#EAB308" }} />
              Customer Reviews & Feedback Management
            </h1>
            <p className="page-sub">Monitor customer ratings, feedback, queries, and publish salon replies.</p>
          </div>
          <button onClick={fetchReviews} className="btn-outline">
            <RefreshCw size={15} /> Refresh
          </button>
        </motion.div>

        {/* Four Key Dashboard Metric Cards */}
        <motion.div className="stats-grid" variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
          <div className="stat-card" style={{ background: 'var(--panel-bg)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)', borderLeft: '4px solid #EAB308' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Average Rating</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#EAB308', marginTop: 4 }}>{stats.avg || '0.0'} ★</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--panel-bg)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)', borderLeft: '4px solid #7C5CFC' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Total Reviews</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#7C5CFC', marginTop: 4 }}>{stats.count}</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--panel-bg)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Pending Queries</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>{stats.pendingQueries}</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--panel-bg)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)', borderLeft: '4px solid #10B981' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Replied Queries</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginTop: 4 }}>{stats.repliedQueries}</div>
          </div>
        </motion.div>

        {/* Filter Controls Bar */}
        <motion.div variants={itemVariants} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, background: 'var(--panel-bg)', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={14} /> Filter:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: 12, fontWeight: 600, outline: 'none' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Reply</option>
              <option value="replied">Replied</option>
              <option value="pendingQueries">Pending Customer Queries</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: 12, fontWeight: 600, outline: 'none' }}
            >
              <option value={0}>All Star Ratings</option>
              <option value={5}>5 Stars ★★★★★</option>
              <option value={4}>4 Stars ★★★★</option>
              <option value={3}>3 Stars ★★★</option>
              <option value={2}>2 Stars ★★</option>
              <option value={1}>1 Star ★</option>
            </select>
          </div>

          <div style={{ position: 'relative', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 10px 6px 32px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: 12, outline: 'none' }}
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div className="tab-bar" variants={itemVariants}>
          <button onClick={() => setActiveTab('reviews')} className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}>
            <MessageSquare size={15} /> Customer Reviews ({filteredReviews.length})
          </button>
          <button onClick={() => setActiveTab('summary')} className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}>
            <BarChart3 size={15} /> Rating Summary & Analytics
          </button>
        </motion.div>

        {/* Reviews List */}
        {activeTab === 'reviews' && (loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>Loading customer reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <h3>No reviews match your filters</h3>
            <p>Try resetting filters or searching for another keyword.</p>
          </div>
        ) : (
          <motion.div style={{ display: "flex", flexDirection: "column", gap: 16 }} variants={containerVariants}>
            {filteredReviews.map(r => {
              const hasReply = Boolean(r.reply || r.admin_reply);
              const isReplied = r.status === "Replied" || hasReply;

              return (
                <motion.div key={r.id} className="review-card" variants={itemVariants} style={{ background: "var(--panel-bg)", borderRadius: 16, padding: 20, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="avatar-circle" style={{ width: 42, height: 42, background: "linear-gradient(135deg, #EAB308 0%, #7C5CFC 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                        {getInitials(r.user_name || r.customer_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: "var(--text-h)", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{r.user_name || r.customer_name || "Customer"}</span>
                          {r.is_anonymous && (
                            <span style={{ fontSize: 10, background: "rgba(124, 92, 252, 0.1)", color: "#7C5CFC", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                              Anonymous
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          {renderStars(Number(r.rating) || 5)}
                          <span style={{ fontSize: 13, fontWeight: 900, color: "#EAB308", background: "rgba(234, 179, 8, 0.15)", padding: "2px 8px", borderRadius: 6 }}>
                            {r.rating ? `${Number(r.rating).toFixed(1)} ★` : "5.0 ★"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {isReplied ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "rgba(16, 185, 129, 0.1)", padding: "3px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={12} /> Replied
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", background: "rgba(245, 158, 11, 0.1)", padding: "3px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> Pending Reply
                        </span>
                      )}

                      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  {(r.review || r.comment) && (
                    <p style={{ fontSize: 14, color: "var(--text-h)", margin: "10px 0 0 0", lineHeight: 1.5, fontStyle: "italic" }}>
                      "{r.review || r.comment}"
                    </p>
                  )}

                  {/* Customer Feedback */}
                  {r.feedback && (
                    <div style={{ background: "rgba(234, 179, 8, 0.08)", borderLeft: "3px solid #EAB308", borderRadius: 10, padding: "10px 12px", marginTop: 10, fontSize: 13, color: "var(--text-h)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#D97706", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <MessageCircle size={13} /> Customer Feedback / Suggestion:
                      </div>
                      <div>{r.feedback}</div>
                    </div>
                  )}

                  {/* Customer Query */}
                  {r.query && (
                    <div style={{ background: "rgba(59, 130, 246, 0.08)", borderLeft: "3px solid #3B82F6", borderRadius: 10, padding: "10px 12px", marginTop: 10, fontSize: 13, color: "var(--text-h)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <HelpCircle size={13} /> Customer Question / Query:
                      </div>
                      <div>{r.query}</div>
                    </div>
                  )}

                  {/* Sub-ratings Detailed Category Breakdown */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 8,
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 12,
                    background: "var(--bg)",
                    border: "1px solid var(--border)"
                  }}>
                    {[
                      { label: "Overall Experience", val: r.overall_experience || r.rating || 5 },
                      { label: "Stylist Skill", val: r.stylist_skill || r.rating || 5 },
                      { label: "Staff Behaviour", val: r.staff_behaviour || r.rating || 5 },
                      { label: "Cleanliness & Hygiene", val: r.cleanliness_hygiene || r.rating || 5 },
                      { label: "Value for Money", val: r.value_for_money || r.rating || 5 },
                    ].map(cat => (
                      <div key={cat.label} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 8px", background: "var(--panel-bg)", borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-h)" }}>{cat.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#EAB308" }}>
                            {cat.val}/5
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {renderStars(Number(cat.val))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Existing reply */}
                  {hasReply && (
                    <div style={{ background: "rgba(16, 185, 129, 0.08)", borderLeft: "3px solid #10B981", borderRadius: 10, padding: 12, marginTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={13} /> Your Official Salon Response:
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-h)" }}>{r.admin_reply || r.reply}</div>
                    </div>
                  )}

                  {/* Reply form */}
                  {!hasReply && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, background: "var(--bg)", padding: 12, borderRadius: 12, border: "1px solid var(--border)" }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-h)" }}>
                        Reply to Customer Query / Review:
                      </label>
                      <textarea
                        placeholder="Type an official response to answer customer question..."
                        value={replyText[r.id] || ""}
                        onChange={e => setReplyText(p => ({ ...p, [r.id]: e.target.value }))}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--panel-bg)",
                          color: "var(--text-h)",
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          className="btn-add"
                          onClick={() => submitReply(r.id)}
                          disabled={submitting[r.id]}
                          style={{ padding: "6px 14px", fontSize: 12 }}
                        >
                          <Send size={13} /> {submitting[r.id] ? "Publishing..." : "Publish Official Reply"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ))}

        {/* Rating Summary Tab */}
        {activeTab === 'summary' && (
          <motion.div variants={itemVariants}>
            <div className="reviews-summary-card" style={{ flexDirection: 'column', gap: 24, padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 72, fontWeight: 900, color: '#EAB308', lineHeight: 1 }}>{stats.avg || '0.0'}</div>
                  <div style={{ marginTop: 6 }}>{renderStars(Math.round(stats.avg || 0))}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Average Rating</div>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const cnt = stats[["one","two","three","four","five"][star - 1] as keyof typeof stats] as number;
                    const pct = stats.count > 0 ? (cnt / stats.count) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, width: 36, color: 'var(--text-h)', fontSize: 14 }}>{star} ★</span>
                        <div style={{ flex: 1, height: 12, borderRadius: 6, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: star >= 4 ? '#10B981' : star === 3 ? '#F59E0B' : '#EF4444', borderRadius: 6, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ width: 80, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{cnt} ({Math.round(pct)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Breakdown Averages */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-h)", marginBottom: 12 }}>
                  Category Rating Breakdown
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Overall Experience", key: "overall_experience" },
                    { label: "Stylist Skill", key: "stylist_skill" },
                    { label: "Staff Behaviour", key: "staff_behaviour" },
                    { label: "Cleanliness & Hygiene", key: "cleanliness_hygiene" },
                    { label: "Value for Money", key: "value_for_money" },
                  ].map(cat => {
                    const valid = reviews.filter(r => r[cat.key] && Number(r[cat.key]) > 0);
                    const avgVal = valid.length > 0
                      ? Math.round((valid.reduce((acc, r) => acc + Number(r[cat.key]), 0) / valid.length) * 10) / 10
                      : (stats.avg || 5.0);
                    return (
                      <div key={cat.label} style={{ background: "var(--bg)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-h)" }}>{cat.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 900, color: "#EAB308" }}>{avgVal} ★</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                          <div style={{ width: `${(avgVal / 5) * 100}%`, height: "100%", background: "#EAB308", borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginTop: 8 }}>
                {[
                  { label: 'Total Reviews', val: stats.count, color: '#7C5CFC' },
                  { label: '5 Star Reviews', val: stats.five, color: '#10B981' },
                  { label: '4 Star Reviews', val: stats.four, color: '#3B82F6' },
                  { label: 'Below 3 Stars', val: (stats.one + stats.two + stats.three), color: '#EF4444' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', borderLeft: `3px solid ${m.color}` }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
