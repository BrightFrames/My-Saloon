import React from "react";
import { useNavigate } from "react-router-dom";
import { PopupDialog } from "../components/PopupDialog";
import heroImage from "../assets/sign.jpg";

const MembershipsPage: React.FC = () => {
  const navigate = useNavigate();
  const [popup, setPopup] = React.useState<{
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

  return (
    <div className="min-h-screen bg-[#FDFBF9] px-8 py-20">
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel="OK"
        onConfirm={() => setPopup((prev) => ({ ...prev, open: false }))}
      />
      <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_0.95fr] items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F4E9E5] px-4 py-2 text-sm font-medium text-[#6B554D] mb-5">
            Glowup Memberships
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4 text-stone-900 leading-tight">
            Memberships are on the way.
          </h1>
          <p className="text-stone-600 mb-8 text-lg leading-relaxed">
            Expect exclusive perks, priority booking, and curated offers for
            returning guests. We’re shaping a tiered experience that feels
            polished instead of promotional.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-3 rounded-xl bg-[#6B554D] text-white shadow-sm"
            >
              Go Back
            </button>
            <button
              onClick={() =>
                setPopup({
                  open: true,
                  title: "Notification saved",
                  message: "We'll notify you when memberships launch!",
                  tone: "success",
                })
              }
              className="px-5 py-3 rounded-xl bg-[#C49B89] text-white shadow-sm"
            >
              Notify Me
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-stone-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] min-h-[420px]">
          <img
            src={heroImage}
            alt="Salon lounge"
            className="absolute inset-0 h-full w-full object-cover scale-105 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-black/10 to-[#FDFBF9]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF9]/5 via-transparent to-white/10 mix-blend-screen" />
          <div className="absolute -left-10 top-8 h-44 w-44 rounded-full bg-white/25 blur-3xl" />
          <div className="absolute right-6 bottom-10 h-52 w-52 rounded-full bg-[#C49B89]/25 blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-2">
              Exclusive access
            </p>
            <p className="max-w-md text-sm leading-6 text-white/90">
              A premium layer for repeat guests, with cleaner discovery and
              more rewarding booking moments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipsPage;
