import React from "react";
import { useNavigate } from "react-router-dom";
import { PopupDialog } from "../components/PopupDialog";

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
    <div className="min-h-screen bg-[#ffffff] px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel="OK"
        onConfirm={() => setPopup((prev) => ({ ...prev, open: false }))}
      />
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-serif mb-4">Memberships</h1>
        <p className="text-stone-600 mb-8 text-lg">
          Coming soon — stay tuned! We're working on memberships to provide
          exclusive perks, discounts, and priority bookings.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-md bg-[#6B554D] text-white"
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
            className="px-5 py-2 rounded-md bg-[#C49B89] text-white"
          >
            Notify Me
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipsPage;
