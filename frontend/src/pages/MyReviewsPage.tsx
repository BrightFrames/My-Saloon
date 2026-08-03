import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Star,
  MessageSquare,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { API_BASE_URL } from "../services/apiBase";

export const MyReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/reviews/my`, {
        headers,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data || []);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Error loading my reviews:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAuth = sessionStorage.getItem("isVerified") === "true";
    if (!isAuth) {
      navigate("/signin");
      return;
    }
    fetchMyReviews();
  }, [navigate]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < rating ? "fill-amber-400 text-amber-400" : "text-stone-300"
        } inline-block mr-0.5`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-stone-800 font-sans pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-4 py-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-[#6B554D] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-lg font-serif font-bold text-[#6B554D] flex items-center gap-2">
            <MessageSquare size={20} className="text-amber-500" /> My Reviews & Feedback
          </h1>
          <Link
            to="/my-bookings"
            className="text-xs font-semibold text-[#6B554D] hover:underline"
          >
            My Bookings
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-8 sm:px-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#6B554D]">Review History</h2>
            <p className="text-xs text-stone-500 mt-1">
              View your ratings, feedback, queries, and official replies from salon management.
            </p>
          </div>
          <button
            onClick={fetchMyReviews}
            className="self-start sm:self-auto text-xs font-medium text-stone-600 hover:text-[#6B554D] bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-xs cursor-pointer"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-500">
            <Loader2 size={36} className="animate-spin text-amber-500" />
            <span className="text-xs font-medium">Loading your submitted reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-stone-200/80 shadow-xs flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center ring-4 ring-amber-500/10">
              <Sparkles size={32} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-800">No Reviews Submitted Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Once you complete a salon booking, you can rate your experience and submit feedback or questions.
              </p>
            </div>
            <Link
              to="/my-bookings"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#6B554D] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#5C4841] transition-colors shadow-md shadow-[#6B554D]/20"
            >
              View Completed Bookings
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {reviews.map((r) => {
              const hasReply = Boolean(r.admin_reply || r.reply);
              const isReplied = r.status === "Replied" || hasReply;

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-stone-100 text-[#6B554D] flex items-center justify-center font-bold">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-800">
                          {r.salon_name || "Salon Service"}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {renderStars(Number(r.rating) || 5)}
                          <span className="text-xs font-bold text-amber-600">
                            {r.rating}.0 / 5.0
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isReplied ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} /> Replied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={13} /> Pending Reply
                        </span>
                      )}

                      <span className="text-xs text-stone-400 font-medium">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""}
                      </span>
                    </div>
                  </div>

                  {/* Review Text */}
                  {r.review && (
                    <div className="mb-3">
                      <p className="text-xs text-stone-700 font-normal leading-relaxed italic">
                        "{r.review}"
                      </p>
                    </div>
                  )}

                  {/* Category Breakdown Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      ["Overall", r.overall_experience],
                      ["Stylist Skill", r.stylist_skill],
                      ["Staff Behaviour", r.staff_behaviour],
                      ["Hygiene", r.cleanliness_hygiene],
                      ["Value", r.value_for_money],
                    ]
                      .filter(([_, val]) => val)
                      .map(([label, val]) => (
                        <span
                          key={label as string}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-medium"
                        >
                          {label}: <strong className="text-amber-600 font-semibold">{val}/5</strong>
                        </span>
                      ))}
                  </div>

                  {/* Feedback Section */}
                  {r.feedback && (
                    <div className="mt-2 rounded-xl bg-amber-50/50 p-3 border border-amber-200/50 text-xs text-amber-900 flex items-start gap-2">
                      <MessageCircle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-amber-800">Your Feedback:</strong>{" "}
                        {r.feedback}
                      </div>
                    </div>
                  )}

                  {/* Query Section */}
                  {r.query && (
                    <div className="mt-2 rounded-xl bg-blue-50/60 p-3 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2">
                      <HelpCircle size={15} className="shrink-0 text-blue-600 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-blue-800">Your Question / Query:</strong>{" "}
                        {r.query}
                      </div>
                    </div>
                  )}

                  {/* Salon Admin Reply Section */}
                  {hasReply && (
                    <div className="mt-4 rounded-2xl bg-emerald-50/70 p-4 border-l-4 border-emerald-500 text-xs text-emerald-950 shadow-xs">
                      <div className="flex items-center gap-2 font-bold text-emerald-700 mb-1">
                        <CheckCircle2 size={15} /> Official Salon Response:
                      </div>
                      <p className="text-emerald-900 leading-relaxed font-normal">
                        {r.admin_reply || r.reply}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
