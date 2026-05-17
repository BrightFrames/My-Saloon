import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Heart } from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  duration: string;
};

type Salon = {
  id: string;
  name: string;
  image: string;
  rating: number;
  distance?: string;
  services: Service[];
};

const TreatmentsPage: React.FC<{ latitude?: number | null; longitude?: number | null }> = ({ latitude, longitude }) => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState<Salon[]>([]);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api/v1";
        let url = `${base}/salons`;
        if (typeof latitude === "number" && typeof longitude === "number") {
          url = `${base}/salons?lat=${latitude}&lon=${longitude}&radius=10`;
        }

        const r = await fetch(url);
        const body = await r.json();
        if (body && body.success) setSalons(body.data || []);
      } catch (err) {
        console.error("Failed to fetch salons:", err);
      }
    };

    fetchSalons();
  }, [latitude, longitude]);

  return (
    <div className="min-h-screen bg-[#FDFBF9] px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif mb-6">Treatments</h2>
        <p className="text-stone-600 mb-8">
          Browse salons and the treatments they offer. Click a service to
          continue booking.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {salons.map((salon) => (
            <div
              key={salon.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex gap-6"
            >
              <div className="w-[160px] h-[130px] rounded-xl overflow-hidden bg-stone-100">
                <img
                  src={salon.image}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-medium text-stone-800">
                      {salon.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Star size={14} className="text-[#C49B89]" />
                      <span>{salon.rating}</span>
                    </div>
                  </div>

                  <p className="text-sm text-stone-400 mb-3">
                    {salon.distance} away
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(salon.services || []).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg border border-stone-100"
                      >
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-stone-400">{s.duration}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">${s.price}</div>
                          <button
                            onClick={() => navigate(`/salon/${salon.id}`)}
                            className="bg-[#6B554D] hover:bg-[#5C4841] text-white px-3 py-1 rounded-md text-sm"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/salon/${salon.id}`)}
                    className="text-sm text-[#6B554D] hover:underline"
                  >
                    View Salon
                  </button>
                  <button
                    onClick={() => navigate(`/checkout`)}
                    className="bg-[#C49B89] hover:bg-[#b89b8a] text-white px-4 py-2 rounded-md text-sm"
                  >
                    Continue to Checkout
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TreatmentsPage;
