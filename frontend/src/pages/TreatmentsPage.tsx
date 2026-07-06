import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { formatINR } from "../utils/currency";
import { API_BASE_URL } from "../services/apiBase";

type Service = {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  discounted_price?: number;
  home_service_available?: boolean;
  home_service_price?: number;
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

const TreatmentsPage: React.FC<{
  latitude?: number | null;
  longitude?: number | null;
}> = ({ latitude, longitude }) => {
  const navigate = useNavigate();
  const [salons, setSalons] = useState<Salon[]>([]);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const base = API_BASE_URL;
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
    <div className="min-h-screen bg-[#ffffff] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-3xl font-serif">Treatments</h2>
        <p className="mb-8 text-stone-600">
          Browse salons and the treatments they offer. Click a service to
          continue booking.
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {salons.map((salon) => (
            <div
              key={salon.id}
              className="flex flex-col gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:p-6 lg:flex-row lg:gap-6"
            >
              <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-100 lg:aspect-[16/13] lg:w-40">
                <img
                  src={salon.image}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(salon.services || []).map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col gap-3 rounded-lg border border-stone-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {s.name}
                            {s.home_service_available && (
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-100 flex items-center gap-1">
                                🏠 Home
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-400">
                            {s.duration}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:justify-end">
                          <div className="flex flex-col items-end">
                            {s.original_price && s.discounted_price && s.original_price > s.discounted_price ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-stone-400 line-through">
                                    {formatINR(s.original_price)}
                                  </span>
                                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                                    {Math.round(((s.original_price - s.discounted_price) / s.original_price) * 100)}% OFF
                                  </span>
                                </div>
                                <div className="font-semibold text-green-700">
                                  {formatINR(s.discounted_price)}
                                </div>
                              </>
                            ) : (
                              <div className="font-semibold">
                                {formatINR(s.discounted_price ?? s.price)}
                              </div>
                            )}
                            {s.home_service_available && s.home_service_price && (
                              <div className="text-[10px] text-stone-500 mt-0.5">
                                Home: {formatINR(s.home_service_price)}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              sessionStorage.setItem("selectedSalon", JSON.stringify(salon));
                              sessionStorage.setItem("selectedServices", JSON.stringify([s]));
                              sessionStorage.setItem("selectedSalonServices", JSON.stringify(salon.services || []));
                              navigate(`/checkout`);
                            }}
                            className="min-h-11 rounded-md bg-[#6B554D] px-3 py-2 text-sm text-white transition-colors hover:bg-[#5C4841]"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => navigate(`/salon/${salon.id}`)}
                    className="text-sm text-[#6B554D] hover:underline"
                  >
                    View Salon
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("selectedSalon", JSON.stringify(salon));
                      sessionStorage.setItem("selectedServices", JSON.stringify([]));
                      sessionStorage.setItem("selectedSalonServices", JSON.stringify(salon.services || []));
                      navigate(`/checkout`);
                    }}
                    className="min-h-11 rounded-md bg-[#C49B89] px-4 py-2 text-sm text-white transition-colors hover:bg-[#b89b8a]"
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
