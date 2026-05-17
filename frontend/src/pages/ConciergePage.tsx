import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ConciergePage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now show a simple confirmation; backend integration can be added later.
    alert(
      `Thanks ${name || "there"}! Your concierge request has been received. We'll contact you at ${contact || "your contact"}.`,
    );
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] px-8 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif mb-3">Concierge</h1>
        <p className="text-stone-600 mb-8">
          Need personalized help booking services, curated packages, or
          priority scheduling? Submit a concierge request and our team will
          respond within 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full p-3 rounded-lg border border-stone-200"
            />
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or phone"
              className="w-full p-3 rounded-lg border border-stone-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full p-3 rounded-lg border border-stone-200"
            />
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full p-3 rounded-lg border border-stone-200 bg-white"
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
            className="w-full p-3 rounded-lg border border-stone-200 h-32"
          />

          <div className="flex items-center gap-4">
            <button className="px-5 py-3 bg-[#6B554D] text-white rounded-md">Send Request</button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-3 bg-stone-200 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConciergePage;
