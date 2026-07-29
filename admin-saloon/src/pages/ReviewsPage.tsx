import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";

type Props = { user: any; onLogout: () => void };

export default function ReviewsPage({ user, onLogout }: Props) {
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

  const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="page-root">
        <div className="page-header">
          <div>
            <h1 className="page-title">⭐ Reviews</h1>
            <p className="page-sub">Manage and respond to customer reviews.</p>
          </div>
          <button onClick={fetchReviews} className="btn-outline">🔄 Refresh</button>
        </div>

        {/* Rating Summary */}
        <div className="reviews-summary-card">
          <div className="reviews-avg-block">
            <div className="reviews-avg-number">{summary.avg || "—"}</div>
            <div className="reviews-avg-stars" style={{ color: "#EAB308", fontSize: 22 }}>
              {summary.avg ? stars(Math.round(summary.avg)) : "☆☆☆☆☆"}
            </div>
            <div className="reviews-avg-label">{summary.count} Reviews</div>
          </div>
          <div className="reviews-bar-list">
            {[5, 4, 3, 2, 1].map(star => {
              const cnt = summary[["one","two","three","four","five"][star - 1] as keyof typeof summary] as number;
              const pct = summary.count > 0 ? (cnt / summary.count) * 100 : 0;
              return (
                <div key={star} className="rating-bar-row">
                  <span className="rating-bar-label">{star}★</span>
                  <div className="rating-bar-track">
                    <div className="rating-bar-fill" style={{ width: `${pct}%`, background: star >= 4 ? "#10B981" : star === 3 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                  <span className="rating-bar-count">{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="panel-empty">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="panel-empty">No reviews yet. Reviews from customers will appear here.</div>
        ) : (
          <div className="reviews-list">
            {reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-card-top">
                  <div className="review-avatar">{(r.user_name || "C").charAt(0).toUpperCase()}</div>
                  <div className="review-meta">
                    <div className="review-author">{r.user_name || "Customer"}</div>
                    <div className="review-stars" style={{ color: "#EAB308" }}>{stars(r.rating)}</div>
                    <div className="review-date">{r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}</div>
                  </div>
                </div>
                {r.comment && <p className="review-comment">"{r.comment}"</p>}

                {/* Sub-ratings */}
                {(r.overall_experience || r.stylist_skill) && (
                  <div className="review-sub-ratings">
                    {[
                      ["Overall", r.overall_experience],
                      ["Stylist", r.stylist_skill],
                      ["Staff", r.staff_behaviour],
                      ["Hygiene", r.cleanliness_hygiene],
                      ["Value", r.value_for_money],
                    ].filter(([_, v]) => v).map(([label, val]) => (
                      <div key={label as string} className="sub-rating-chip">
                        {label}: <strong>{val}/5</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing reply */}
                {r.reply && (
                  <div className="review-reply">
                    <span className="reply-label">Your Reply:</span> {r.reply}
                  </div>
                )}

                {/* Reply form */}
                {!r.reply && (
                  <div className="review-reply-form">
                    <textarea
                      placeholder="Write a reply to this review..."
                      value={replyText[r.id] || ""}
                      onChange={e => setReplyText(p => ({ ...p, [r.id]: e.target.value }))}
                      rows={2}
                      className="reply-textarea"
                    />
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => submitReply(r.id)}
                      disabled={submitting[r.id]}
                    >
                      {submitting[r.id] ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
