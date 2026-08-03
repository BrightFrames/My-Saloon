import React, { useState } from "react";
import { Star, X, Send, Image as ImageIcon, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../services/apiBase";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    salon_id?: string;
    salon_name?: string;
    hairstyle?: string;
    appointment_date?: string;
  };
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Sub-ratings
  const [overallExp, setOverallExp] = useState<number>(0);
  const [stylistSkill, setStylistSkill] = useState<number>(0);
  const [staffBeh, setStaffBeh] = useState<number>(0);
  const [cleanliness, setCleanliness] = useState<number>(0);
  const [valueMoney, setValueMoney] = useState<number>(0);

  const [review, setReview] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rating === 0) {
      setErrorMsg("Please select a star rating (1 to 5 stars).");
      return;
    }

    if (!review.trim()) {
      setErrorMsg("Please enter your review details.");
      return;
    }

    setSubmitting(true);

    try {
      const token = sessionStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = {
        bookingId: booking.id,
        salonId: booking.salon_id,
        rating,
        review: review.trim(),
        comment: review.trim(),
        feedback: feedback.trim() || undefined,
        query: query.trim() || undefined,
        is_anonymous: isAnonymous,
        image_url: imageUrl.trim() || undefined,
        overall_experience: overallExp || rating,
        stylist_skill: stylistSkill || rating,
        staff_behaviour: staffBeh || rating,
        cleanliness_hygiene: cleanliness || rating,
        value_for_money: valueMoney || rating,
      };

      let res = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 404) {
        const fallbackUrl = booking.salon_id
          ? `${API_BASE_URL}/salons/${booking.salon_id}/reviews`
          : `${API_BASE_URL}/salons/reviews`;

        res = await fetch(fallbackUrl, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Thank you for your feedback!");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.message || "Failed to submit review. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarInput = (
    value: number,
    onChange: (val: number) => void,
    size = 22
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
          >
            <Star
              size={size}
              className={`${
                star <= value ? "fill-amber-400 text-amber-400" : "text-stone-300"
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl transition-all font-sans text-stone-800 scrollbar-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-4 ring-amber-500/10">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-[#6B554D]">Rate Your Experience</h3>
            <p className="text-xs text-stone-500">
              {booking.salon_name || "Salon Appointment"} • {booking.hairstyle || "Service"}
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="my-8 flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
              <ShieldCheck size={36} />
            </div>
            <h4 className="text-lg font-bold text-stone-800 mb-1">Review Submitted!</h4>
            <p className="text-sm text-stone-600">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 font-medium border border-red-200/80">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Overall Rating (1-5 Stars) */}
            <div className="flex flex-col items-center justify-center rounded-2xl bg-amber-50/60 p-5 border border-amber-200/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">
                Overall Experience Rating
              </span>
              <div className="flex items-center gap-1.5 my-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                          : "text-stone-300"
                      } transition-all duration-150`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-amber-700 mt-1">
                {rating === 0 && "Tap stars to rate your experience"}
                {rating === 5 && "⭐ Excellent - Absolutely loved it!"}
                {rating === 4 && "⭐ Good - Very satisfied!"}
                {rating === 3 && "⭐ Average - Met expectations"}
                {rating === 2 && "⭐ Poor - Could be better"}
                {rating === 1 && "⭐ Terrible - Disappointed"}
              </span>
            </div>

            {/* Sub-Ratings Category Breakdown */}
            <div className="flex flex-col gap-3 rounded-2xl bg-stone-50 p-4 border border-stone-200/70">
              <span className="text-xs font-bold text-stone-700 tracking-wide uppercase">
                Detailed Ratings Breakdown
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200/60">
                  <span className="font-medium text-stone-700">Overall Experience</span>
                  {renderStarInput(overallExp, setOverallExp, 16)}
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200/60">
                  <span className="font-medium text-stone-700">Stylist Skill</span>
                  {renderStarInput(stylistSkill, setStylistSkill, 16)}
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200/60">
                  <span className="font-medium text-stone-700">Staff Behaviour</span>
                  {renderStarInput(staffBeh, setStaffBeh, 16)}
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200/60">
                  <span className="font-medium text-stone-700">Cleanliness & Hygiene</span>
                  {renderStarInput(cleanliness, setCleanliness, 16)}
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200/60 sm:col-span-2">
                  <span className="font-medium text-stone-700">Value for Money</span>
                  {renderStarInput(valueMoney, setValueMoney, 16)}
                </div>
              </div>
            </div>

            {/* Review Comment (Required) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                <span>
                  📝 Write your Review <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-stone-400">Required</span>
              </label>
              <textarea
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Describe your appointment, stylist service, or salon ambiance..."
                className="w-full rounded-xl border border-stone-300 p-3 text-xs outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D] transition-colors"
                required
              />
            </div>

            {/* Feedback / Suggestions (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-700">
                💬 Feedback or Suggestions <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Any suggestions for improvement or appreciation for staff?"
                className="w-full rounded-xl border border-stone-300 p-3 text-xs outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D] transition-colors"
              />
            </div>

            {/* Query / Complaint / Question (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-700">
                ❓ Query, Question or Complaint <span className="text-stone-400 font-normal">(Optional - Salon Admin will reply)</span>
              </label>
              <textarea
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question or report an issue. The salon admin will answer you directly."
                className="w-full rounded-xl border border-stone-300 p-3 text-xs outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D] transition-colors"
              />
            </div>

            {/* Image URL (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-stone-500" />
                <span>Photo URL <span className="text-stone-400 font-normal">(Optional)</span></span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
              />
            </div>

            {/* Options: Anonymous Checkbox */}
            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3 border border-stone-200/60">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[#6B554D] focus:ring-[#6B554D] cursor-pointer"
                />
                <label htmlFor="anonymousCheck" className="text-xs font-medium text-stone-700 cursor-pointer select-none">
                  Submit Review Anonymously
                </label>
              </div>
              <span className="text-[10px] text-stone-500 font-medium">Hides your name publicly</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl px-5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-[#6B554D] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#5C4841] disabled:opacity-50 transition-colors shadow-md shadow-[#6B554D]/20 cursor-pointer"
              >
                <Send size={14} />
                {submitting ? "Submitting Review..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
