import React, { useState } from "react";
import { Star, CheckCircle, Sparkles } from "lucide-react";
import { API_BASE_URL } from "../services/apiBase";

interface ServiceRatingCardProps {
  salonId: string;
  bookingId?: string;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: () => void;
}

interface RatingCriterion {
  id: "overall_experience" | "stylist_skill" | "staff_behaviour" | "cleanliness_hygiene" | "value_for_money";
  title: string;
  question: string;
}

const CRITERIA: RatingCriterion[] = [
  {
    id: "overall_experience",
    title: "Overall Experience",
    question: "How was your overall experience?",
  },
  {
    id: "stylist_skill",
    title: "Stylist Skill",
    question: "How satisfied are you with your stylist's skill and service quality?",
  },
  {
    id: "staff_behaviour",
    title: "Staff Behaviour",
    question: "How would you rate the professionalism and friendliness of the staff?",
  },
  {
    id: "cleanliness_hygiene",
    title: "Cleanliness & Hygiene",
    question: "How clean and hygienic was the salon?",
  },
  {
    id: "value_for_money",
    title: "Value for Money",
    question: "Was the service worth the price you paid?",
  },
];

export const ServiceRatingCard: React.FC<ServiceRatingCardProps> = ({
  salonId,
  bookingId,
  customerName,
  customerEmail,
  onSuccess,
}) => {
  const [ratings, setRatings] = useState<Record<string, number>>({
    overall_experience: 0,
    stylist_skill: 0,
    staff_behaviour: 0,
    cleanliness_hygiene: 0,
    value_for_money: 0,
  });

  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStarClick = (criterionId: string, ratingValue: number) => {
    setRatings((prev) => ({ ...prev, [criterionId]: ratingValue }));
    setErrorMsg(null);
  };

  const handleStarMouseEnter = (criterionId: string, ratingValue: number) => {
    setHoveredRatings((prev) => ({ ...prev, [criterionId]: ratingValue }));
  };

  const handleStarMouseLeave = (criterionId: string) => {
    setHoveredRatings((prev) => {
      const copy = { ...prev };
      delete copy[criterionId];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const unrated = CRITERIA.find((c) => !ratings[c.id] || ratings[c.id] === 0);
    if (unrated) {
      setErrorMsg(`Please select a star rating for '${unrated.title}'.`);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        salon_id: salonId,
        booking_id: bookingId,
        user_name: customerName || sessionStorage.getItem("userName") || "Valued Customer",
        customer_email: customerEmail || sessionStorage.getItem("userEmail") || "",
        overall_experience: ratings.overall_experience,
        stylist_skill: ratings.stylist_skill,
        staff_behaviour: ratings.staff_behaviour,
        cleanliness_hygiene: ratings.cleanliness_hygiene,
        value_for_money: ratings.value_for_money,
        comment: comment.trim(),
      };

      const res = await fetch(`${API_BASE_URL}/salons/${salonId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        onSuccess?.();
      } else {
        setErrorMsg(data.message || "Failed to submit rating. Please try again.");
      }
    } catch (err) {
      console.error("Failed to submit review", err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full bg-[#FAF6F3] border border-[#DEB5A4]/40 rounded-3xl p-8 text-center flex flex-col items-center gap-3 animate-in fade-in">
        <div className="w-14 h-14 rounded-full bg-[#CA9A86]/20 text-[#CA9A86] flex items-center justify-center mb-1">
          <Sparkles size={28} />
        </div>
        <h3 className="font-serif text-2xl text-stone-800 font-medium">
          Thank You For Your Feedback!
        </h3>
        <p className="text-sm text-stone-600 max-w-md">
          Your ratings help us maintain top service quality and help other customers choose the best experience.
        </p>
        <div className="flex gap-1 text-amber-400 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={20} fill="currentColor" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl p-6 md:p-8 border border-stone-200/70 shadow-lg shadow-stone-100 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h3 className="font-serif text-xl font-medium text-stone-900 flex items-center gap-2">
            ⭐ Rate Your Service Experience
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Please select your star ratings across our 5 quality metrics:
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {CRITERIA.map((criterion) => {
          const currentRating = hoveredRatings[criterion.id] ?? ratings[criterion.id] ?? 0;
          return (
            <div
              key={criterion.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F6] p-4 rounded-2xl border border-stone-100/80 transition-all hover:border-[#CA9A86]/40"
            >
              <div>
                <h4 className="font-medium text-sm text-stone-800">
                  {criterion.title}
                </h4>
                <p className="text-xs text-stone-500 italic mt-0.5">
                  "{criterion.question}"
                </p>
              </div>

              {/* Star Selector */}
              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const active = currentRating > 0 && starVal <= currentRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => handleStarClick(criterion.id, starVal)}
                      onMouseEnter={() => handleStarMouseEnter(criterion.id, starVal)}
                      onMouseLeave={() => handleStarMouseLeave(criterion.id)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={22}
                        className={active ? "text-amber-400 fill-amber-400" : "text-stone-300"}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-bold text-stone-600 ml-1.5 w-4 text-center">
                  {currentRating > 0 ? currentRating : "-"}
                </span>
              </div>
            </div>
          );
        })}

        {/* Optional Comment */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-stone-700">
            Write your comments or suggestions (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Share details about your appointment, stylist, or salon atmosphere..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-[#FAF8F6] border border-stone-200 focus:border-[#CA9A86] focus:ring-1 focus:ring-[#CA9A86] focus:bg-white rounded-2xl p-4 text-sm outline-none transition-all text-stone-800"
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#6B554D] hover:bg-[#5C4841] text-white py-4 rounded-xl font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? "Submitting Rating..." : "Submit Rating & Review ⭐"}
        </button>
      </form>
    </div>
  );
};
