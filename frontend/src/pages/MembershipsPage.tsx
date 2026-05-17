import React from "react";
import { useNavigate } from "react-router-dom";

const MembershipsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF9] px-8 py-20">
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
            onClick={() => alert("We'll notify you when memberships launch!")}
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
