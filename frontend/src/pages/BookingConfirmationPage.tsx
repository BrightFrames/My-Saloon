import { CheckCircle, ArrowRight, Calendar, Scissors } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatINR } from "../utils/currency";
import { API_BASE_URL } from "../services/apiBase";

export function BookingConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const serviceLabel =
    booking?.service_name ||
    booking?.serviceName ||
    booking?.hairstyle ||
    "Service";

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/${id}`);
        const data = await res.json();
        if (data.success) {
          setBooking(data.data);
        }
      } catch (error) {
        console.error("Error fetching booking", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9]">
        <span className="animate-pulse text-[#CA9A86]">Loading...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF9] gap-4">
        <p className="text-xl text-stone-600">Booking not found.</p>
        <button
          onClick={() => navigate("/")}
          className="text-[#CA9A86] font-medium underline"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans text-stone-800 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-stone-200/50 border border-stone-100 flex flex-col items-center relative overflow-hidden">
        {/* Success Animation Container */}
        <div className="mb-6 animate-[bounce_1s_ease-in-out]">
          <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle size={48} className="text-green-500" />
          </div>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-medium text-stone-900 mb-2 text-center">
          Booking Confirmed!
        </h1>
        <p className="text-stone-500 text-center mb-10 max-w-md">
          Thank you, {booking.customer_name}. Your appointment has been
          successfully scheduled. We've sent a confirmation email to{" "}
          {booking.customer_email}.
        </p>

        {/* Booking Card Details */}
        <div className="w-full bg-[#F6F5F2] rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-stone-200 pb-4">
            <span className="text-sm text-stone-500 font-medium">
              Booking ID
            </span>
            <span className="font-mono text-sm font-semibold text-stone-800">
              {booking.id.split("-")[0].toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Scissors size={18} className="text-[#CA9A86]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Service
                </p>
                <p className="font-medium text-stone-800">{serviceLabel}</p>
                <p className="text-sm text-stone-500 mt-0.5">
                  with {booking.stylist}
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Calendar size={18} className="text-[#CA9A86]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Date & Time
                </p>
                <p className="font-medium text-stone-800">
                  {new Date(booking.booking_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-stone-500 mt-0.5">
                  {booking.booking_time}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 mt-2 flex justify-between items-center shadow-sm border border-stone-100">
            <div>
              <p className="text-xs text-stone-500 font-medium">
                Payment Method
              </p>
              <p className="text-sm font-semibold text-stone-800 capitalize mt-0.5">
                {booking.payment_method.replace("_", " ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500 font-medium">Total Paid</p>
              <p className="text-lg font-bold text-[#CA9A86]">
                {formatINR(booking.total_price)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-10 bg-stone-900 hover:bg-stone-800 text-white px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          Back to Home <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
