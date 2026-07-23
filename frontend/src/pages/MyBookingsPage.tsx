import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Calendar,
  Scissors,
  User,
  CreditCard,
  ChevronRight,
  XCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  MapPin,
  Phone,
  Home,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building2,
  X,
  RotateCcw
} from "lucide-react";
import { PopupDialog } from "../components/PopupDialog";
import { formatINR } from "../utils/currency";
import { API_BASE_URL } from "../services/apiBase";

export function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [popup, setPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone: "success" | "error" | "info" | "warning";
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const isVerified = sessionStorage.getItem("isVerified") === "true";
  const userEmail = sessionStorage.getItem("userEmail") || "";

  const getServiceLabel = (booking: any) =>
    booking?.service_name ||
    booking?.serviceName ||
    booking?.hairstyle ||
    "Salon Service";

  const handleRebook = (booking: any) => {
    const salonId = booking?.salon_id || booking?.salonId;
    if (salonId) {
      navigate(`/salon/${salonId}`);
    } else {
      navigate("/treatments");
    }
  };

  const fetchBookings = async (background = false) => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    if (!background) setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/user/${userEmail}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching user bookings", error);
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isVerified) {
      navigate("/signin");
      return;
    }
    fetchBookings();

    const intervalId = setInterval(() => {
      fetchBookings(true);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isVerified, userEmail]);

  const handleCancelBooking = async (id: string) => {
    setPopup({
      open: true,
      title: "Cancel appointment?",
      message: "This booking will be cancelled and the slot will be released.",
      tone: "warning",
      confirmLabel: "Yes, cancel",
      cancelLabel: "Keep booking",
      onCancel: () => setPopup((prev) => ({ ...prev, open: false })),
      onConfirm: async () => {
        setPopup((prev) => ({ ...prev, open: false }));
        setCancellingId(id);
        try {
          const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
            method: "PATCH",
          });
          const data = await res.json();
          if (data.success) {
            await fetchBookings();
            setPopup({
              open: true,
              title: "Booking cancelled",
              message: "Your appointment has been cancelled successfully.",
              tone: "success",
            });
          } else {
            setPopup({
              open: true,
              title: "Cancellation failed",
              message:
                data.message || "We could not cancel this booking right now.",
              tone: "error",
            });
          }
        } catch (error) {
          console.error("Error cancelling booking", error);
          setPopup({
            open: true,
            title: "Network error",
            message: "We could not reach the server to cancel your booking.",
            tone: "error",
          });
        } finally {
          setCancellingId(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#ffffff] gap-4">
        <Loader2 className="animate-spin text-[#CA9A86]" size={36} />
        <span className="text-stone-500 font-medium">
          Fetching your appointments...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans text-stone-800 pb-20">
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel={popup.confirmLabel || "OK"}
        cancelLabel={popup.cancelLabel || "Cancel"}
        onConfirm={() => {
          const action = popup.onConfirm;
          setPopup((prev) => ({ ...prev, open: false }));
          action?.();
        }}
        onCancel={popup.onCancel}
      />

      {/* Navigation */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center border border-stone-200 text-stone-500 rounded-xl hover:border-stone-400 hover:text-stone-800 transition-colors bg-white shadow-sm"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-semibold font-serif italic text-[#313131] hover:text-[#C49B89] transition-colors"
          >
            Bookings
          </button>
        </div>

        <button
          onClick={() => fetchBookings()}
          className="flex items-center gap-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-stone-900">
            My Appointments
          </h1>
          <p className="text-stone-500 text-sm">
            View complete details, locations, pricing, and status for all your salon & home service bookings.
          </p>
        </div>

        {bookings.length > 0 ? (
          <div className="flex flex-col gap-6">
            {bookings.map((booking) => {
              const isCancelled = booking.booking_status === "cancelled";
              const isCompleted = booking.booking_status === "completed";
              const isRejected = booking.booking_status === "rejected";
              const isHomeService = booking.booking_type === "home";
              const serviceCharge = Number(booking.service_charge || 0);
              const totalPrice = Number(booking.total_price || 0);

              // Home Address formatting
              const homeAddressStr = [
                booking.address,
                booking.landmark && `Near ${booking.landmark}`,
                booking.city,
                booking.pincode && `Pincode: ${booking.pincode}`,
              ]
                .filter(Boolean)
                .join(", ");

              // Salon Address formatting
              const salonAddressStr = [
                booking.salon_address,
                booking.salon_city,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] border transition-all ${
                    isCancelled || isRejected
                      ? "opacity-80 border-stone-100 bg-[#FAF9F7]"
                      : "border-stone-100 hover:shadow-lg hover:border-stone-200"
                  }`}
                >
                  {/* Top Salon & Status Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      {booking.salon_image ? (
                        <img
                          src={booking.salon_image}
                          alt="Salon"
                          className="w-10 h-10 rounded-full object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#F9F4F2] flex items-center justify-center text-[#CA9A86]">
                          <Building2 size={18} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-stone-900 text-base leading-tight">
                          {booking.salon_name || booking.salonName || "Salon"}
                        </h4>
                        {booking.salon_phone && (
                          <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                            <Phone size={12} className="text-[#CA9A86]" />
                            <span>{booking.salon_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Booking Type Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          isHomeService
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-[#F9F4F2] text-[#8C6454] border border-[#E8DCD7]"
                        }`}
                      >
                        {isHomeService ? <Home size={13} /> : <Scissors size={13} />}
                        {isHomeService ? "Home Service" : "Salon Visit"}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          booking.booking_status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : booking.booking_status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isCompleted
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {booking.booking_status === "confirmed" && (
                          <CheckCircle2 size={13} />
                        )}
                        {booking.booking_status}
                      </span>
                    </div>
                  </div>

                  {/* Main Grid: Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Services & Stylist */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-10 h-10 rounded-xl bg-[#F9F4F2] flex items-center justify-center text-[#CA9A86] shrink-0">
                        <Scissors size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                          SERVICE & STYLIST
                        </p>
                        <h3 className="font-serif text-lg font-medium text-stone-800 leading-snug">
                          {getServiceLabel(booking)}
                        </h3>
                        <p className="text-xs font-medium text-stone-600 mt-1 flex items-center gap-1.5">
                          <User size={13} className="text-[#CA9A86]" />
                          Stylist: <span className="text-stone-900 font-semibold">{booking.stylist || "Assigned Specialist"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Column 2: Date, Time & Location */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-10 h-10 rounded-xl bg-[#F9F4F2] flex items-center justify-center text-[#CA9A86] shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">
                          SCHEDULE & LOCATION
                        </p>
                        <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-1">
                          <Clock size={13} className="text-[#CA9A86]" />
                          {new Date(booking.booking_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
                          at {booking.booking_time}
                        </h4>
                        <div className="mt-1.5 text-xs text-stone-600 flex items-start gap-1">
                          <MapPin size={13} className="text-[#CA9A86] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {isHomeService
                              ? homeAddressStr || "Customer Provided Home Address"
                              : salonAddressStr || "At Salon Premises"}
                          </span>
                        </div>
                        {booking.salon_google_maps_link && (
                          <a
                            href={booking.salon_google_maps_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#CA9A86] hover:underline font-semibold mt-1"
                          >
                            <ExternalLink size={11} /> Open in Google Maps
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Pricing & Actions */}
                    <div className="flex flex-col justify-between md:items-end md:border-l md:border-stone-100 md:pl-6">
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5 md:text-right">
                          TOTAL AMOUNT
                        </p>
                        <div className="flex items-baseline gap-2 md:justify-end">
                          <span className="font-bold text-2xl text-stone-900">
                            {formatINR(totalPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1 md:justify-end">
                          <CreditCard size={13} className="text-[#CA9A86]" />
                          <span className="capitalize">
                            {booking.payment_method?.replace("_", " ") || "cash"}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="font-semibold text-emerald-600">
                            {booking.payment_status === "paid" ? "Paid" : "Pay at venue"}
                          </span>
                        </div>
                        {serviceCharge > 0 && (
                          <div className="text-[11px] text-stone-500 mt-0.5 md:text-right">
                            Includes Home Service Charge: {formatINR(serviceCharge)}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-3 mt-4 md:justify-end">
                        <button
                          onClick={() => setSelectedReceipt(booking)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6454] bg-[#F9F4F2] hover:bg-[#F2E8E4] px-3.5 py-1.5 rounded-lg transition-colors border border-[#E5D7D1]"
                        >
                          <FileText size={14} /> Full Details & Receipt
                        </button>

                        {isCompleted && (
                          <button
                            onClick={() => handleRebook(booking)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C49B89] hover:bg-[#B38775] px-3.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
                          >
                            <RotateCcw size={14} /> Rebook Services
                          </button>
                        )}

                        {booking.booking_status !== "cancelled" &&
                          booking.booking_status !== "rejected" &&
                          booking.booking_status !== "completed" && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            >
                              {cancellingId === booking.id ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <XCircle size={14} />
                              )}{" "}
                              Cancel
                            </button>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Rejection Note */}
                  {isRejected && booking.rejection_reason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <XCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <strong className="font-semibold">Cancellation / Rejection Note:</strong>{" "}
                        {booking.rejection_reason}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#FAF9F7] flex items-center justify-center text-stone-300">
              <Calendar size={36} />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-2">
                No Bookings Yet
              </h3>
              <p className="text-stone-500 text-sm max-w-sm">
                You haven't scheduled any pampering sessions yet. Explore top
                salons and treat yourself today!
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-[#CA9A86] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#B38775]"
            >
              Explore Salons <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Comprehensive Receipt & Booking Details Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F9F4F2] flex items-center justify-center text-[#CA9A86]">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-stone-900">
                    Booking Receipt
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    ID: {selectedReceipt.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-stone-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Info */}
            <div className="flex flex-col gap-5 text-sm">
              {/* Salon Details */}
              <div className="bg-[#FAF9F7] p-4 rounded-2xl border border-stone-100 flex items-center gap-4">
                {selectedReceipt.salon_image && (
                  <img
                    src={selectedReceipt.salon_image}
                    alt="Salon"
                    className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                )}
                <div>
                  <h4 className="font-serif text-base font-semibold text-stone-900">
                    {selectedReceipt.salon_name || selectedReceipt.salonName || "Salon"}
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} className="text-[#CA9A86] shrink-0" />
                    {selectedReceipt.salon_address || selectedReceipt.salon_city || "Salon Premises"}
                  </p>
                  {selectedReceipt.salon_phone && (
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                      <Phone size={12} className="text-[#CA9A86] shrink-0" />
                      {selectedReceipt.salon_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Service & Stylist Info */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Service Summary
                </h5>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <div>
                    <span className="font-semibold text-stone-900 block">
                      {getServiceLabel(selectedReceipt)}
                    </span>
                    <span className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <User size={12} /> Stylist: {selectedReceipt.stylist || "Assigned Specialist"}
                    </span>
                  </div>
                  <span className="font-bold text-stone-900">
                    {formatINR(Number(selectedReceipt.total_price) || 0)}
                  </span>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Date
                  </span>
                  <span className="font-semibold text-stone-800 text-xs">
                    {new Date(selectedReceipt.booking_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Time Slot
                  </span>
                  <span className="font-semibold text-stone-800 text-xs">
                    {selectedReceipt.booking_time}
                  </span>
                </div>
              </div>

              {/* Location & Appointment Type */}
              <div className="p-4 bg-stone-50 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Location & Type
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white border border-stone-200 text-stone-700">
                    {selectedReceipt.booking_type === "home" ? "🏠 Home Service" : "💈 Salon Visit"}
                  </span>
                  <span className="text-xs text-stone-600">
                    {selectedReceipt.booking_type === "home"
                      ? "Service rendered at customer home address"
                      : "Service at salon location"}
                  </span>
                </div>
                {selectedReceipt.booking_type === "home" ? (
                  <p className="text-xs text-stone-700 font-medium pt-1">
                    <strong>Address:</strong> {[selectedReceipt.address, selectedReceipt.landmark, selectedReceipt.city, selectedReceipt.pincode].filter(Boolean).join(", ")}
                  </p>
                ) : (
                  <p className="text-xs text-stone-700 font-medium pt-1">
                    <strong>Salon Address:</strong> {selectedReceipt.salon_address || "At Salon Premises"}
                  </p>
                )}
              </div>

              {/* Customer Contact */}
              <div className="p-4 bg-stone-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Customer Details
                </span>
                <p className="text-xs text-stone-800 font-semibold">
                  {selectedReceipt.customer_name}
                </p>
                <p className="text-xs text-stone-600">
                  {selectedReceipt.customer_email} {selectedReceipt.customer_phone ? `• ${selectedReceipt.customer_phone}` : ""}
                </p>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-4 bg-[#F9F4F2] rounded-xl border border-[#E8DCD7] space-y-2">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Subtotal Services</span>
                  <span>{formatINR(Number(selectedReceipt.total_price) - Number(selectedReceipt.service_charge || 0))}</span>
                </div>
                {Number(selectedReceipt.service_charge) > 0 && (
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Home Service Fee</span>
                    <span>{formatINR(Number(selectedReceipt.service_charge))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200/80 pt-2 mt-1">
                  <span>Total Amount</span>
                  <span className="text-base text-[#8C6454]">
                    {formatINR(Number(selectedReceipt.total_price))}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-stone-500 pt-1">
                  <span>Payment Method</span>
                  <span className="font-medium capitalize text-stone-800">
                    {selectedReceipt.payment_method?.replace("_", " ") || "cash"} ({selectedReceipt.payment_status || "pay at venue"})
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              {selectedReceipt?.booking_status === "completed" ? (
                <button
                  onClick={() => {
                    handleRebook(selectedReceipt);
                    setSelectedReceipt(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C49B89] hover:bg-[#B38775] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <RotateCcw size={14} /> Rebook from Same Salon
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
