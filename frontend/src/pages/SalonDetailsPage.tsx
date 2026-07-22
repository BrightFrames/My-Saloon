import { Star, Clock, Plus, ArrowRight, Loader2, UserCircle2, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PopupDialog } from "../components/PopupDialog";
import { API_BASE_URL } from "../services/apiBase";

import { formatINR } from "../utils/currency";

export function SalonDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Services");

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("favorites");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const isFavorite = id ? favorites.includes(id) : false;

  const toggleFavorite = () => {
    if (!id) return;
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id];
      try {
        localStorage.setItem("favorites", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save favorites", e);
      }
      return updated;
    });
  };
  
  const [reviewForm, setReviewForm] = useState({
    user_name: "",
    customer_email: "",
    rating: 5,
    comment: "",
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [popup, setPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  // Fetch real salon details and services from backend
  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/salons/${id}`);
        const body = await res.json();
        if (body && body.success) {
          const fetchedSalon = body.data;
          // Keep services list in sync with latest admin updates.
          fetchedSalon.services = Array.isArray(fetchedSalon.services)
            ? fetchedSalon.services
            : [];

          if (id) {
            const servicesRes = await fetch(
              `${API_BASE_URL}/services?salon_id=${id}`,
            );
            if (servicesRes.ok) {
              const servicesBody = await servicesRes.json();
              if (servicesBody && servicesBody.success) {
                fetchedSalon.services = Array.isArray(servicesBody.data)
                  ? servicesBody.data
                  : [];
              }
            }
          }

          setSalon(fetchedSalon);
          // Start with no preselected services; user chooses services to book
          setSelectedServices([]);
        } else {
          setSalon(null);
          setSelectedServices([]);
        }
      } catch (err) {
        console.error("Failed to fetch salon details:", err);
        setSalon(null);
        setSelectedServices([]);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSalonDetails();
  }, [id]);

  const toggleService = (service: any) => {
    const isAlreadySelected = selectedServices.some((s) => s.id === service.id);
    if (isAlreadySelected) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleContinueToBook = () => {
    if (selectedServices.length === 0) {
      setPopup({
        open: true,
        title: "Select a service",
        message:
          "Please select at least one service before continuing to book.",
        tone: "warning",
      });
      return;
    }

    // Check if user is signed in
    const isVerified = sessionStorage.getItem("isVerified") === "true";
    if (!isVerified) {
      // Save selections so they persist after sign-in
      sessionStorage.setItem("selectedSalon", JSON.stringify(salon));
      sessionStorage.setItem(
        "selectedServices",
        JSON.stringify(selectedServices),
      );
      sessionStorage.setItem(
        "selectedSalonServices",
        JSON.stringify(salon?.services || []),
      );
      sessionStorage.setItem("redirectAfterSignIn", "/checkout");
      setPopup({
        open: true,
        title: "Sign in required",
        message:
          "Please sign in to continue with your booking.",
        tone: "warning",
      });
      navigate("/signin");
      return;
    }

    // Save selections in sessionStorage for dynamic Checkout consumption
    sessionStorage.setItem("selectedSalon", JSON.stringify(salon));
    sessionStorage.setItem(
      "selectedServices",
      JSON.stringify(selectedServices),
    );
    sessionStorage.setItem(
      "selectedSalonServices",
      JSON.stringify(salon?.services || []),
    );
    navigate("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.user_name || !reviewForm.customer_email || !reviewForm.rating) {
      setPopup({
        open: true,
        title: "Incomplete Review",
        message: "Please provide your name, email, and a rating.",
        tone: "warning",
      });
      return;
    }
    try {
      setIsSubmittingReview(true);
      const res = await fetch(`${API_BASE_URL}/salons/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.success) {
        setPopup({
          open: true,
          title: "Review Submitted",
          message: "Thank you for your review!",
          tone: "success",
        });
        setReviewForm({ user_name: "", customer_email: "", rating: 5, comment: "" });
        // Refresh salon details to get the new review
        const updatedRes = await fetch(`${API_BASE_URL}/salons/${id}`);
        const updatedBody = await updatedRes.json();
        if (updatedBody && updatedBody.success) {
          setSalon((prev: any) => ({ ...prev, reviews: updatedBody.data.reviews }));
        }
      } else {
        throw new Error(data.message || "Failed to submit review");
      }
    } catch (err: any) {
      setPopup({
        open: true,
        title: "Error",
        message: err.message,
        tone: "error",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Calculations
  const subtotal = selectedServices.reduce(
    (sum, s) => sum + Number(s.discounted_price ?? s.price),
    0,
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-[#C49B89] animate-spin" />
        <p className="text-stone-500 font-medium font-serif text-lg">
          Curating luxury experience...
        </p>
      </div>
    );
  }

  const salonServices =
    salon?.services && salon.services.length > 0 ? salon.services : [];

  return (
    <div className="min-h-screen bg-[#ffffff] font-sans text-stone-800">
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel="OK"
        onConfirm={() => setPopup((prev) => ({ ...prev, open: false }))}
      />


      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        {/* Header Hero Image */}
        <div className="relative mb-10 h-64 w-full overflow-hidden rounded-4xl shadow-md sm:h-80 lg:h-95">
          <img
            src={
              salon?.image ||
              "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2874&auto=format&fit=crop"
            }
            alt={salon?.name || "Salon background"}
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent"></div>

          {/* Content on Image */}
          <div className="absolute bottom-6 left-6 right-6 z-10 text-white sm:bottom-8 sm:left-8 sm:right-8 flex items-end justify-between">
            <div>
              <h1 className="mb-3 text-2xl font-serif font-medium sm:text-3xl">
                {salon?.name || "Salon Details"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90 sm:gap-4">
                <span className="flex items-center py-1 px-3 bg-black/20 backdrop-blur-md rounded-full gap-1.5">
                  <Star size={14} className="text-[#DEB5A4]" fill="#DEB5A4" />{" "}
                  {salon?.rating || "4.9"}{" "}
                  <span className="font-normal opacity-80">(120 reviews)</span>
                </span>
                <span className="opacity-60">•</span>
                <span className="flex items-center py-1 px-3 bg-black/20 backdrop-blur-md rounded-full gap-1.5">
                  <Clock size={14} /> Open until 9 PM
                </span>
              </div>
            </div>

            <button
              onClick={toggleFavorite}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-white/20 p-2.5 text-white hover:bg-black/50 hover:text-red-400 transition-all cursor-pointer shadow-lg"
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart
                size={22}
                className={
                  isFavorite
                    ? "text-red-500 fill-red-500 transition-all scale-110"
                    : "text-white transition-all"
                }
              />
            </button>
          </div>
        </div>

        {/* Main Detail Grid Layout */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          {/* Left Content Column */}
          <div className="flex flex-col">
            {/* Tabs */}
            <div className="mb-8 flex gap-6 overflow-x-auto border-b border-stone-200 pb-px sm:gap-8">
              {["Services", "Gallery", "Reviews", "About"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "border-stone-800 text-stone-800"
                      : "border-transparent text-stone-400 hover:text-stone-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Services" && (
              <div className="mb-10">
                <h3 className="font-serif text-lg font-medium text-stone-800 mb-6">
                Available Treatments
              </h3>
              <div className="flex flex-col gap-4">
                {salonServices.length === 0 ? (
                  <div className="text-stone-500 py-4 italic">
                    No services listed for this salon.
                  </div>
                ) : (
                  salonServices.map((service: any) => {
                    const isSelected = selectedServices.some(
                      (s) => s.id === service.id,
                    );
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={`group flex cursor-pointer flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6 ${
                          isSelected
                            ? "border-[#C49B89] bg-[#FDFBF9] shadow-[0_4px_20px_-4px_rgba(196,155,137,0.15)] scale-[1.01]"
                            : "border-stone-100 hover:border-stone-200"
                        }`}
                      >
                        <div>
                          <h4 className="text-stone-800 font-medium mb-1 font-serif text-lg group-hover:text-[#C49B89] transition-colors flex items-center gap-2">
                            {service.name}
                            {service.home_service_available && (
                              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 border border-blue-100 flex items-center gap-1 font-sans">
                                🏠 Home
                              </span>
                            )}
                          </h4>
                          <p className="text-stone-500 text-sm mb-4">
                            {service.duration || "60 min"} • Professional
                            pampering session.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {service.original_price && service.discounted_price && service.original_price > service.discounted_price ? (
                              <>
                                <span className="text-sm text-stone-400 line-through">
                                  {formatINR(service.original_price)}
                                </span>
                                <span className="text-[#C49B89] font-semibold text-lg">
                                  {formatINR(service.discounted_price)}
                                </span>
                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600">
                                  {Math.round(((service.original_price - service.discounted_price) / service.original_price) * 100)}% OFF
                                </span>
                              </>
                            ) : (
                              <span className="text-[#C49B89] font-semibold text-lg">
                                {formatINR(service.discounted_price ?? service.price)}
                              </span>
                            )}
                          </div>
                          {service.home_service_available && service.home_service_price && (
                            <div className="mt-1 text-xs font-medium text-stone-500">
                              🏠 Home Service Price: <span className="text-[#C49B89]">{formatINR(service.home_service_price)}</span>
                            </div>
                          )}
                        </div>
                        <button
                          className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#C49B89] border-[#C49B89] text-white rotate-45"
                              : "border-stone-200 text-[#C49B89] group-hover:bg-[#C49B89] group-hover:text-white"
                          }`}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

            {activeTab === "Gallery" && (
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-serif text-lg font-medium text-stone-800 mb-6">Gallery</h3>
                {salon?.video && (
                  <div className="mb-6">
                    <video src={salon.video} controls className="w-full rounded-2xl shadow-sm" />
                  </div>
                )}
                {salon?.gallery && salon.gallery.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {salon.gallery.map((url: string, idx: number) => (
                      <img key={idx} src={url} alt={`Gallery ${idx}`} className="w-full h-40 object-cover rounded-xl shadow-sm hover:opacity-90 transition-opacity" />
                    ))}
                  </div>
                ) : (
                  <div className="text-stone-500 py-4 italic">No gallery images available.</div>
                )}
              </div>
            )}

            {activeTab === "Reviews" && (
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-serif text-lg font-medium text-stone-800 mb-6">Customer Reviews</h3>
                
                {/* Write Review Form */}
                <div className="bg-[#FDFBF9] rounded-2xl p-6 border border-[#E8DCC9] mb-8">
                  <h4 className="text-stone-800 font-medium mb-4">Write a Review</h4>
                  <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-stone-600">Your Name</label>
                      <input type="text" value={reviewForm.user_name} onChange={e => setReviewForm({...reviewForm, user_name: e.target.value})} className="border border-stone-200 rounded-lg px-3 py-2 text-sm" placeholder="John Doe" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-stone-600">Email</label>
                      <input type="email" value={reviewForm.customer_email} onChange={e => setReviewForm({...reviewForm, customer_email: e.target.value})} className="border border-stone-200 rounded-lg px-3 py-2 text-sm" placeholder="you@example.com" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-stone-600">Rating (1-5)</label>
                      <select value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})} className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-stone-600">Comment (Optional)</label>
                      <textarea value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} className="border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none h-20" placeholder="Share your experience..."></textarea>
                    </div>
                    <button type="submit" disabled={isSubmittingReview} className="mt-2 bg-[#C49B89] hover:bg-[#B38775] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-max disabled:opacity-70">
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                </div>

                <div className="flex flex-col gap-4">
                  {salon?.reviews && salon.reviews.length > 0 ? (
                    salon.reviews.map((r: any) => (
                      <div key={r.id} className="border border-stone-100 rounded-xl p-5 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5E8E0] text-[#B67B63]">
                              <UserCircle2 size={22} />
                            </div>
                            <div>
                              <span className="font-medium text-stone-800 block">{r.user_name}</span>
                              <span className="text-xs text-stone-400">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className="text-xs text-stone-400">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < r.rating ? "text-[#DEB5A4] fill-[#DEB5A4]" : "text-stone-200"} />
                          ))}
                        </div>
                        {r.comment && <p className="text-stone-600 text-sm leading-relaxed">{r.comment}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="text-stone-500 py-4 italic">No reviews yet. Be the first to leave one!</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "About" && (
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-serif text-lg font-medium text-stone-800 mb-6">About {salon?.name}</h3>
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                  {salon?.about ? (
                    <p className="text-stone-600 leading-relaxed whitespace-pre-line">{salon.about}</p>
                  ) : (
                    <p className="text-stone-500 italic">No description provided by the salon.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sticky Booking Panel */}
          <div className="bg-white border border-stone-100 shadow-xl shadow-stone-200/40 rounded-3xl p-5 lg:sticky lg:top-8 sm:p-7">
            <h2 className="font-serif text-lg font-medium text-stone-800 mb-6">
              Booking Summary
            </h2>

            {/* Selected Services Rows */}
            <div className="flex flex-col gap-4 mb-6">
              {selectedServices.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 border-b border-stone-50 pb-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <h4 className="text-stone-800 font-medium text-[15px]">
                      {s.name}
                    </h4>
                    <p className="text-stone-400 text-[13px] mt-1">
                      {s.duration || "60 min"}
                    </p>
                  </div>
                  <span className="text-stone-600 font-semibold text-sm">
                    {formatINR(s.discounted_price ?? s.price)}
                  </span>
                </div>
              ))}
            </div>

            {selectedServices.length === 0 && (
              <p className="text-stone-400 text-sm italic mb-8 pb-6 border-b border-stone-100 border-dashed">
                No services selected. Click '+' to add services.
              </p>
            )}

            {/* Price Breakdown */}
            <div className="mb-6 flex flex-col gap-3 border-t border-stone-100 pt-3">
              <div className="flex justify-between items-center text-[15px] text-stone-500">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-[15px] text-stone-500">
                <span>GST (8%)</span>
                <span>{formatINR(tax)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="mb-8 flex items-center justify-between border-t border-stone-100 pt-4 text-lg font-medium text-stone-800">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>

            <button
              onClick={handleContinueToBook}
              disabled={selectedServices.length === 0}
              className="w-full bg-[#6B554D] hover:bg-[#5C4841] disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 shadow-md relative overflow-hidden cursor-pointer"
            >
              Continue to Book
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
