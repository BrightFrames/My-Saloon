import React from "react";
import { Popup } from "react-leaflet";
import { Star, ExternalLink } from "lucide-react";
import { GetDirectionsButton } from "./GetDirectionsButton";

export interface SalonMapPopupProps {
  salon: {
    id?: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    image?: string;
    rating?: number | string;
    starting_price?: number | string;
  };
  onBookNow?: (salonId?: string) => void;
  showBookNow?: boolean;
}

export const SalonMapPopup: React.FC<SalonMapPopupProps> = ({
  salon,
  onBookNow,
  showBookNow = true,
}) => {
  const fullAddress = [salon.address, salon.city, salon.state]
    .filter(Boolean)
    .join(", ");

  const displayAddress = fullAddress || salon.address || salon.city || "Location details not available";

  return (
    <Popup maxWidth={280} className="glowup-salon-popup">
      <div className="flex flex-col gap-2.5 p-1 font-sans text-stone-800 w-60 sm:w-64">
        {salon.image && (
          <div className="relative h-28 w-full overflow-hidden rounded-xl bg-stone-100">
            <img
              src={salon.image}
              alt={salon.name}
              className="h-full w-full object-cover"
            />
            {salon.rating && Number(salon.rating) > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-white">
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <span>{Number(salon.rating).toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base" role="img" aria-label="salon">💈</span>
            <h4 className="font-serif text-base font-semibold text-[#0A2640] leading-tight truncate">
              {salon.name}
            </h4>
          </div>

          <div className="flex items-start gap-1.5 text-xs text-stone-600">
            <span className="shrink-0 mt-0.5 text-[#CA9A86]">📍</span>
            <span className="leading-snug line-clamp-2">{displayAddress}</span>
          </div>

          {salon.starting_price && (
            <div className="text-[11px] font-medium text-stone-500 mt-0.5">
              Starts from <span className="font-semibold text-stone-800">₹{salon.starting_price}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-2.5 flex flex-col gap-2">
            <GetDirectionsButton
              latitude={salon.latitude}
              longitude={salon.longitude}
              variant="primary"
              size="sm"
              label="Get Directions"
              className="w-full justify-center"
            />

            {showBookNow && onBookNow && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookNow(salon.id);
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#FAF6F3] border border-[#DEB5A4]/50 py-1.5 px-3 text-xs font-semibold text-[#6B554D] hover:bg-[#F2E8E2] transition-colors cursor-pointer"
              >
                <span>Book Now</span>
                <ExternalLink size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
};
