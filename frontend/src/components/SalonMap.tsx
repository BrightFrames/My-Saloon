/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { SalonMapPopup } from "./SalonMapPopup";
import { GetDirectionsButton } from "./GetDirectionsButton";
import { isValidLocation } from "../utils/navigation";

// Fix Leaflet marker icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function createCustomMarker(isActive = false) {
  const bg = isActive ? "bg-[#CA9A86] border-white scale-110 z-50" : "bg-[#0A2640] border-white/90";
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center">
      <div class="h-9 w-9 rounded-full ${bg} border-2 shadow-lg flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>`,
    className: "custom-salon-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
  });
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export interface SalonMapProps {
  salons: Array<{
    id?: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    google_maps_link?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    image?: string;
    rating?: number | string;
    starting_price?: number | string;
  }>;
  selectedSalonId?: string;
  onSelectSalon?: (salonId?: string) => void;
  onBookNow?: (salonId?: string) => void;
  height?: string;
  className?: string;
  zoom?: number;
}

export const SalonMap: React.FC<SalonMapProps> = ({
  salons,
  selectedSalonId,
  onSelectSalon,
  onBookNow,
  height = "h-80 lg:h-96",
  className = "",
  zoom = 13,
}) => {
  const validSalons = salons.filter((s) => isValidLocation(s.latitude, s.longitude));

  if (validSalons.length === 0) {
    const singleSalon = salons[0];
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#F8F2EE] border border-[#DEB5A4]/30 p-8 text-center shadow-inner ${height} ${className}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md text-[#6B554D] mb-4">
          <MapPin size={26} />
        </div>
        <h4 className="font-serif text-base font-semibold text-[#0A2640] mb-1">
          {singleSalon?.name || "Salon Location"}
        </h4>
        <p className="text-xs text-stone-500 max-w-xs mb-4">
          {singleSalon?.address || singleSalon?.city || "Coordinates are currently not set for this salon."}
        </p>

        <GetDirectionsButton
          latitude={singleSalon?.latitude}
          longitude={singleSalon?.longitude}
          mapsLink={singleSalon?.google_maps_link}
          destinationAddress={[singleSalon?.address, singleSalon?.city, singleSalon?.state].filter(Boolean).join(", ")}
          placeName={singleSalon?.name}
          variant="secondary"
          size="md"
        />
      </div>
    );
  }

  const selectedSalon = validSalons.find((s) => s.id === selectedSalonId) || validSalons[0];
  const centerLat = parseFloat(String(selectedSalon.latitude));
  const centerLon = parseFloat(String(selectedSalon.longitude));
  const center: [number, number] = [centerLat, centerLon];

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl border border-stone-200 shadow-sm ${height} ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController center={center} zoom={zoom} />

        {validSalons.map((s) => {
          const lat = parseFloat(String(s.latitude));
          const lon = parseFloat(String(s.longitude));
          const isActive = s.id === selectedSalonId || s.id === selectedSalon.id;

          return (
            <Marker
              key={s.id || `${lat}-${lon}`}
              position={[lat, lon]}
              icon={createCustomMarker(isActive)}
              eventHandlers={{
                click: () => {
                  if (onSelectSalon && s.id) onSelectSalon(s.id);
                },
              }}
            >
              <SalonMapPopup salon={s} onBookNow={onBookNow} />
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
