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
        review: "",
        comment: "",
        overall_experience: rating,
        stylist_skill: rating,
        staff_behaviour: rating,
        cleanliness_hygiene: rating,
        value_for_money: rating,
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
