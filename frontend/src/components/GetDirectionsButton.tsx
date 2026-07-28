import React from "react";
import { MapPin, Navigation } from "lucide-react";
import { openGoogleMapsDirections, isValidLocation } from "../utils/navigation";

export interface GetDirectionsButtonProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "compact" | "dark";
  icon?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export const GetDirectionsButton: React.FC<GetDirectionsButtonProps> = ({
  latitude,
  longitude,
  className = "",
  variant = "primary",
  icon = true,
  label = "Get Directions",
  size = "md",
}) => {
  const hasValidLocation = isValidLocation(latitude, longitude);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (hasValidLocation) {
      openGoogleMapsDirections(latitude, longitude);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-[#6B554D] hover:bg-[#59463F] text-white shadow-sm shadow-[#6B554D]/15 active:scale-[0.98]";
      case "secondary":
        return "bg-[#F5E8E0] hover:bg-[#EBD6C9] text-[#6B554D] font-medium border border-[#DEB5A4]/40";
      case "outline":
        return "border border-[#DEB5A4] text-[#6B554D] bg-white hover:bg-[#FAF6F3]";
      case "compact":
        return "bg-[#6B554D] hover:bg-[#59463F] text-white py-1.5 px-3 text-xs rounded-lg";
      case "dark":
        return "bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50";
      default:
        return "bg-[#6B554D] text-white";
    }
  };

  const getSizeStyles = () => {
    if (variant === "compact") return "";
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-xs rounded-lg gap-1.5";
      case "lg":
        return "px-6 py-3.5 text-base rounded-2xl gap-2.5 font-medium";
      case "md":
      default:
        return "px-4 py-2.5 text-sm rounded-xl gap-2 font-medium";
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!hasValidLocation}
      title={
        !hasValidLocation
          ? "Location is not available for this salon."
          : "Open directions in Google Maps"
      }
      className={`relative group inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:bg-stone-200 disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed disabled:shadow-none ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      {icon && (
        <MapPin
          size={size === "sm" || variant === "compact" ? 13 : size === "lg" ? 18 : 15}
          className={hasValidLocation ? (variant === "secondary" || variant === "outline" ? "text-[#6B554D]" : "text-[#DEB5A4]") : "text-stone-400"}
        />
      )}
      <span>{label}</span>

      {!hasValidLocation && (
        <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl z-50 animate-in fade-in zoom-in-95">
          Location is not available for this salon.
        </span>
      )}
    </button>
  );
};
