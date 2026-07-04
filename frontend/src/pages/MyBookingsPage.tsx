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
} from "lucide-react";
import { PopupDialog } from "../components/PopupDialog";
import { formatINR } from "../utils/currency";
import { API_BASE_URL } from "../services/apiBase";

export function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
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
    "Service";

  const fetchBookings = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/user/${userEmail}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Error fetching user bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isVerified) {
      navigate("/signin");
      return;
    }
    fetchBookings();
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF9] gap-4">
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
      {/* Header View */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center border border-stone-200 text-stone-500 rounded-lg hover:border-stone-400 hover:text-stone-800 transition-colors bg-white shadow-sm"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-semibold font-serif italic text-[#313131] hover:text-[#C49B89] transition-colors"
          >
            Glowup
          </button>
        </div>

        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </nav>

      <main className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-stone-900">
            My Appointments
          </h1>
          <p className="text-stone-500 text-sm">
            View and manage your schedules, styles, and treatments.
          </p>
        </div>

        {bookings.length > 0 ? (
          <div className="flex flex-col gap-6">
            {bookings.map((booking) => {
              const isCancelled = booking.booking_status === "cancelled";
              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] border transition-all ${isCancelled ? "opacity-70 border-stone-100 bg-[#FAF9F7]" : "border-stone-100 hover:shadow-md hover:border-stone-200"}`}
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    {/* Left: Info details */}
                    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Stylist & Style */}
                      <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-[#F9F4F2] flex items-center justify-center text-[#CA9A86] shrink-0 shadow-inner">
                          <Scissors size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                            SERVICE & STYLIST
                          </p>
                          <h3 className="font-serif text-lg font-medium text-stone-800">
                            {getServiceLabel(booking)}
                          </h3>
                          <p className="text-sm text-stone-500 mt-0.5 flex items-center gap-1.5">
                            <User size={12} /> with {booking.stylist}
                          </p>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-[#F9F4F2] flex items-center justify-center text-[#CA9A86] shrink-0 shadow-inner">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                            DATE & TIME
                          </p>
                          <h4 className="font-semibold text-stone-800">
                            {new Date(booking.booking_date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </h4>
                          <p className="text-sm text-stone-500 mt-0.5">
                            {booking.booking_time}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Payment details, Status Badge, Cancel option */}
                    <div className="flex shrink-0 flex-col gap-4 md:justify-between md:border-l md:border-stone-100 md:pl-8 md:items-end">
                      <div className="flex flex-wrap items-center gap-3 md:justify-end">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isCancelled ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
                        >
                          {booking.booking_status}
                        </span>

                        <span className="font-bold text-lg text-stone-800">
                          {formatINR(Number(booking.total_price) || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-stone-500 md:justify-end">
                        <CreditCard size={14} />
                        <span className="capitalize">
                          {booking.payment_method?.replace("_", " ") || "cash"}
                        </span>
                      </div>

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-500 transition-colors hover:text-red-700 md:justify-end disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <XCircle size={14} />
                          )}{" "}
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  </div>
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
    </div>
  );
}
