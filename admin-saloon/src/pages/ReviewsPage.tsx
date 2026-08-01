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
  BarChart3
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
  const [summary, setSummary] = useState({ avg: 0, count: 0, five: 0, four: 0, three: 0, two: 0, one: 0 });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.getReviews();
      const data: any[] = res?.data || [];
      setReviews(data);

      if (data.length > 0) {
        const avg = data.reduce((s, r) => s + (Number(r.rating) || 0), 0) / data.length;
        setSummary({
          avg: Math.round(avg * 10) / 10,
          count: data.length,
          five:  data.filter(r => r.rating === 5).length,
          four:  data.filter(r => r.rating === 4).length,
          three: data.filter(r => r.rating === 3).length,
          two:   data.filter(r => r.rating === 2).length,
          one:   data.filter(r => r.rating === 1).length,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReviews(); }, [user]);

  const submitReply = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;
    setSubmitting(p => ({ ...p, [reviewId]: true }));
    try {
      await api.replyToReview(reviewId, text);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: text } : r));
      setReplyText(p => ({ ...p, [reviewId]: "" }));
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
              Customer Reviews
            </h1>
            <p className="page-sub">Monitor feedback, ratings, and publish salon replies.</p>
          </div>
          <button onClick={fetchReviews} className="btn-outline">
            <RefreshCw size={15} /> Refresh
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div className="tab-bar" variants={itemVariants}>
          <button onClick={() => setActiveTab('reviews')} className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}>
            <MessageSquare size={15} /> Customer Reviews ({reviews.length})
          </button>
          <button onClick={() => setActiveTab('summary')} className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}>
            <BarChart3 size={15} /> Rating Summary
          </button>
        </motion.div>

        {/* Rating Summary Card - show on reviews tab */}
        {activeTab === 'reviews' && (
          <motion.div className="reviews-summary-card" variants={itemVariants}>
            <div className="reviews-avg-block">
              <div className="reviews-avg-number" style={{ color: "#EAB308" }}>{summary.avg || "0.0"}</div>
              <div style={{ marginTop: 4 }}>
                {renderStars(Math.round(summary.avg || 5))}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 4 }}>
                Based on {summary.count} reviews
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 8 }}>
              {[5, 4, 3, 2, 1].map(star => {
                const cnt = summary[["one","two","three","four","five"][star - 1] as keyof typeof summary] as number;
                const pct = summary.count > 0 ? (cnt / summary.count) * 100 : 0;
                return (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span style={{ fontWeight: 700, width: 30, color: "var(--text-h)" }}>{star} ★</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: star >= 4 ? "#10B981" : star === 3 ? "#F59E0B" : "#EF4444", borderRadius: 4 }} />
                    </div>
                    <span style={{ width: 24, textAlign: "right", color: "var(--muted)", fontWeight: 600 }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Reviews List */}
        {activeTab === 'reviews' && (loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>Loading customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <h3>No reviews received yet</h3>
            <p>Reviews submitted by customer bookings will appear here.</p>
          </div>
        ) : (
          <motion.div style={{ display: "flex", flexDirection: "column", gap: 16 }} variants={containerVariants}>
            {reviews.map(r => (
              <motion.div key={r.id} className="review-card" variants={itemVariants}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="avatar-circle" style={{ width: 42, height: 42, background: "linear-gradient(135deg, #EAB308 0%, #7C5CFC 100%)" }}>
                      {getInitials(r.user_name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: "var(--text-h)", fontSize: 15 }}>{r.user_name || "Customer"}</div>
                      <div style={{ marginTop: 2 }}>{renderStars(r.rating || 5)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}
                  </div>
                </div>

                {r.comment && (
                  <p style={{ fontSize: 14, color: "var(--text-h)", margin: "8px 0 0 0", lineHeight: 1.5, fontStyle: "italic" }}>
                    "{r.comment}"
                  </p>
                )}

                {/* Sub-ratings */}
                {(r.overall_experience || r.stylist_skill) && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    {[
                      ["Overall", r.overall_experience],
                      ["Stylist Skill", r.stylist_skill],
                      ["Staff Behaviour", r.staff_behaviour],
                      ["Hygiene", r.cleanliness_hygiene],
                      ["Value", r.value_for_money],
                    ].filter(([_, v]) => v).map(([label, val]) => (
                      <span key={label as string} className="badge" style={{ background: "rgba(124, 92, 252, 0.08)", color: "#7C5CFC", fontSize: 11 }}>
                        {label}: {val}/5
                      </span>
                    ))}
                  </div>
                )}

                {/* Existing reply */}
                {r.reply && (
                  <div style={{ background: "rgba(16, 185, 129, 0.08)", borderLeft: "3px solid #10B981", borderRadius: 10, padding: 12, marginTop: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={13} /> Your Salon Response:
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-h)" }}>{r.reply}</div>
                  </div>
                )}

                {/* Reply form */}
                {!r.reply && (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    <textarea
                      placeholder="Write an official salon response..."
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
                        <Send size={13} /> {submitting[r.id] ? "Sending..." : "Publish Reply"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ))}

        {/* Rating Summary Tab */}
        {activeTab === 'summary' && (
          <motion.div variants={itemVariants}>
            <div className="reviews-summary-card" style={{ flexDirection: 'column', gap: 24, padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 72, fontWeight: 900, color: '#EAB308', lineHeight: 1 }}>{summary.avg || '0.0'}</div>
                  <div style={{ marginTop: 6 }}>{renderStars(Math.round(summary.avg || 0))}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Average Rating</div>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const cnt = summary[['one','two','three','four','five'][star - 1] as keyof typeof summary] as number;
                    const pct = summary.count > 0 ? (cnt / summary.count) * 100 : 0;
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginTop: 8 }}>
                {[
                  { label: 'Total Reviews', val: summary.count, color: '#7C5CFC' },
                  { label: '5 Star Reviews', val: summary.five, color: '#10B981' },
                  { label: '4 Star Reviews', val: summary.four, color: '#3B82F6' },
                  { label: 'Below 3 Stars', val: (summary.one + summary.two + summary.three), color: '#EF4444' },
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
