import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PopupDialog } from "../components/PopupDialog";
import heroImage from "../assets/sign.jpg";

const ConciergePage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [popup, setPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone: "success" | "error" | "info" | "warning";
    onConfirm?: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPopup({
      open: true,
      title: "Request received",
      message: `Thanks ${name || "there"}! Your concierge request has been received. We'll contact you at ${contact || "your contact"}.`,
      tone: "success",
      onConfirm: () => navigate("/memberships"),
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] px-8 py-20">
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel="Done"
        onConfirm={() => {
          const action = popup.onConfirm;
          setPopup((prev) => ({ ...prev, open: false }));
          action?.();
        }}
      />
      <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_0.95fr] items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F4E9E5] px-4 py-2 text-sm font-medium text-[#6B554D] mb-5">
            Personal concierge
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-3 text-stone-900 leading-tight">
            Concierge support for more complex bookings.
          </h1>
          <p className="text-stone-600 mb-8 leading-relaxed text-lg">
            Need personalized help booking services, curated packages, or
            priority scheduling? Submit a concierge request and our team will
            respond within 24 hours.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full p-3 rounded-xl border border-stone-200 bg-white"
              />
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email or phone"
                className="w-full p-3 rounded-xl border border-stone-200 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full p-3 rounded-xl border border-stone-200 bg-white"
              />
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-200 bg-white"
              >
                <option value="">Service Type (optional)</option>
                <option value="facial">Facial</option>
                <option value="massage">Massage</option>
                <option value="bride">Bridal / Events</option>
                <option value="wellness">Wellness</option>
              </select>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any preferences, dates, or notes"
              className="w-full p-3 rounded-xl border border-stone-200 h-32 bg-white"
            />

            <div className="flex items-center gap-4">
              <button className="px-5 py-3 bg-[#6B554D] text-white rounded-xl shadow-sm">
                Send Request
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-3 bg-stone-200 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="relative overflow-hidden rounded-4xl border border-stone-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] min-h-130">
          <img
            src={heroImage}
            alt="Salon interior"
            className="absolute inset-0 h-full w-full object-cover scale-105 blur-[2px]"
          />
          <div className="absolute inset-0 bg-linear-to-br from-black/45 via-black/10 to-[#FDFBF9]/20" />
          <div className="absolute inset-0 bg-linear-to-t from-[#FDFBF9]/10 via-transparent to-white/10 mix-blend-screen" />
          <div className="absolute -left-8 top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute right-6 bottom-12 h-56 w-56 rounded-full bg-[#C49B89]/25 blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-2">
              Priority support
            </p>
            <p className="max-w-md text-sm leading-6 text-white/90">
              Tell us what you need and we’ll help shape a smoother booking
              experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConciergePage;
