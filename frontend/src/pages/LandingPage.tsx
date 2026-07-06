import { useEffect, useState } from "react";
import {
  MapPin,
  CheckCircle2,
  Star,
  Calendar,
  Heart,
  Loader2,
  Navigation,
  ExternalLink,
  Search,
  Filter,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { formatINR } from "../utils/currency";
import { API_BASE_URL } from "../services/apiBase";
import heroImage from "../assets/sign.jpg";

interface LandingPageProps {
  location: string;
  setLocation: (loc: string) => void;
  isLoadingLocation: boolean;
  onUseMyLocation: () => void;
  onSearch?: () => void;
  onSelectSalon?: (salon: string) => void;
  latitude?: number | null;
  longitude?: number | null;
  locationPermission?: "unknown" | "granted" | "denied";
}

export function LandingPageWrapper(
  props: Omit<LandingPageProps, "onSelectSalon">,
) {
  const navigate = useNavigate();
  return (
    <LandingPage
      {...props}
      onSelectSalon={(id: string) => navigate(`/salon/${id}`)}
    />
  );
}

// Custom MapController to programmatically move Leaflet view
function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Gorgeous Custom Luxury DivIcon Generator
const createCustomMarker = (isActive: boolean) =>
  L.divIcon({
    html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-10 h-10 rounded-full bg-[#6B554D] ${isActive ? "scale-125 bg-[#C49B89] ring-4 ring-[#C49B89]/20" : "scale-100"} transition-all duration-300 animate-ping opacity-15"></div>
    <div class="w-8 h-8 rounded-full bg-linear-to-br ${isActive ? "from-[#C49B89] to-[#6B554D] scale-110 shadow-xl ring-2 ring-white" : "from-[#6B554D] to-[#5C4841]"} flex items-center justify-center text-white font-bold transition-all duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
  </div>`,
    className: "custom-marker-wrapper",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

export function LandingPage({
  location,
  setLocation,
  isLoadingLocation,
  onUseMyLocation,
  onSearch,
  onSelectSalon,
  latitude,
  longitude,
  locationPermission = "unknown",
}: LandingPageProps) {
  const isVerified = sessionStorage.getItem("isVerified") === "true";
  const userName = sessionStorage.getItem("userName");
  const [salons, setSalons] = useState<any[]>([]);
  const hasAreaSearch =
    typeof latitude === "number" && typeof longitude === "number";
  const userCoordinates = hasAreaSearch
    ? ([latitude, longitude] as [number, number])
    : null;
  const showMapPermissionPrompt = locationPermission === "denied";

  const [isFetching, setIsFetching] = useState(false);

  // Search & Filter States
  const [searchName, setSearchName] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [filterRating, setFilterRating] = useState<number | "">("");
  const [filterService, setFilterService] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | "">("");

  // Map States
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    40.7128, -74.006,
  ]); // Default to NY
  const [mapZoom, setMapZoom] = useState(12);

  // Sync center when user location is detected
  useEffect(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      setMapCenter([latitude, longitude]);
      setMapZoom(13);
    }
  }, [latitude, longitude]);

  // Fetch salons dynamically with applied filters
  useEffect(() => {
    const fetchSalons = async () => {
      setIsFetching(true);
      try {
        const params = new URLSearchParams();

        if (typeof latitude === "number" && typeof longitude === "number") {
          params.append("lat", String(latitude));
          params.append("lon", String(longitude));
          params.append("radius", "15");
        }

        if (searchCity || location) {
          const cityQuery =
            searchCity || (location ? location.split(",")[0] : "");
          if (cityQuery) params.append("city", cityQuery);
        }

        if (searchName) params.append("name", searchName);
        if (filterRating) params.append("rating", String(filterRating));
        if (filterService) params.append("service", filterService);
        if (filterMaxPrice) params.append("maxPrice", String(filterMaxPrice));

        const res = await fetch(`${API_BASE_URL}/salons?${params.toString()}`);
        if (!res.ok) {
          setSalons([]);
          return;
        }
        const body = await res.json();
        if (body && body.success) {
          const fetchedSalons = body.data || [];
          setSalons(fetchedSalons);

          if (fetchedSalons.length > 0 && !latitude && !longitude) {
            // Update map center to the first salon's location if user location is not strictly tracking
            setMapCenter([
              Number(fetchedSalons[0].latitude),
              Number(fetchedSalons[0].longitude),
            ]);
          }
        } else {
          setSalons([]);
        }
      } catch (err) {
        console.error("Failed to fetch salons:", err);
        setSalons([]);
      } finally {
        setIsFetching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSalons();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [
    location,
    latitude,
    longitude,
    searchName,
    searchCity,
    filterRating,
    filterService,
    filterMaxPrice,
  ]);

  const handleSalonSelect = (id: string, lat: number, lon: number) => {
    setSelectedSalonId(id);
    setMapCenter([lat, lon]);
    setMapZoom(14);

    // Smooth scroll salon card into view
    const cardEl = document.getElementById(`salon-card-${id}`);
    cardEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const getGoogleMapsDirections = (lat: number, lon: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
      "_blank",
    );
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch?.();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FDFBF9] font-sans text-stone-800">
      {/* Hero Section */}
      <main className="relative mx-auto flex h-155 max-w-7xl items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        {/* Background Image/Overlay */}
        <div className="absolute right-0 top-0 -z-10 hidden h-full w-[48%] overflow-hidden rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] lg:block">
          <img
            src={heroImage}
            alt="Salon background"
            className="w-full h-full object-cover object-center opacity-85 blur-[1px]"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#FDFBF9]/20 via-[#FDFBF9]/10 to-transparent"></div>
        </div>

        <div className="w-full max-w-2xl">
          {isVerified ? (
            <>
              <div className="inline-flex items-center gap-2 bg-[#F4E9E5] text-[#6B554D] text-sm font-medium px-4 py-1.5 rounded-full mb-5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                You're all set
              </div>
              <h1 className="max-w-xl text-[clamp(2.25rem,7vw,3.75rem)] leading-[1.05] font-serif mb-4 text-stone-900">
                Welcome, {userName}!
              </h1>
              <p className="max-w-[42ch] text-base sm:text-lg mb-10 leading-relaxed text-stone-500">
                Great to see you again! Explore top-rated salons near you and
                book your next pampering session instantly.
              </p>
            </>
          ) : (
            <>
              <h1 className="max-w-2xl text-[clamp(2.5rem,8vw,4.5rem)] leading-[1.05] font-serif mb-6 text-stone-900">
                Find & Book Top Salons Near
                <br />
                You Instantly
              </h1>
              <p className="max-w-[42ch] text-base sm:text-lg mb-10 leading-relaxed text-stone-500">
                Real-time availability. Verified salons. Instant booking.
                Elevate your self-care routine with curated professionals.
              </p>
            </>
          )}

          {/* Search/Location Form */}
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => onUseMyLocation()}
              disabled={isLoadingLocation}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6B554D] px-6 py-3.5 font-medium text-white shadow-sm transition-colors hover:bg-[#5C4841] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-45 cursor-pointer"
            >
              {isLoadingLocation ? (
                <Loader2 size={18} className="text-white animate-spin" />
              ) : (
                <MapPin size={18} fill="currentColor" className="text-white" />
              )}
              {isLoadingLocation ? "Locating..." : "Use My Location"}
            </button>
            <form
              onSubmit={handleSearchSubmit}
              className="w-full max-w-none sm:max-w-105"
            >
              <div className="h-2.5">
                {location && !isLoadingLocation && (
                  <div className="mb-2 flex items-center gap-2 text-sm text-stone-500 animate-in fade-in duration-300"></div>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter city manually..."
                    className="w-full rounded-lg border border-stone-200 bg-white py-3.5 pl-5 pr-12 text-stone-600 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#C49B89]"
                  />
                  <MapPin
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                </div>
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C49B89] px-6 py-3.5 font-medium text-white shadow-sm transition-colors hover:bg-[#b78675] sm:w-auto sm:min-w-40 cursor-pointer"
                >
                  <Search size={18} />
                  Search Salons
                </button>
              </div>
            </form>
          </div>

          {/* Stats/Badges */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium uppercase tracking-wide text-stone-500">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={18}
                className="text-[#C49B89]"
                fill="#F4E9E5"
              />
              <span>Verified Salons</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={18} className="text-[#C49B89]" fill="#C49B89" />
              <span>4.5+ Ratings</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#C49B89]" />
              <span>10,000+ Bookings</span>
            </div>
          </div>
        </div>
      </main>

      {/* Advanced Search & Filtering Section */}
      <section
        id="results-section"
        className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8"
      >
        <div className="mb-8 rounded-3xl border border-stone-100 bg-white p-4 shadow-[0_4px_30px_rgba(0,0,0,0.03)] sm:p-6">
          <h2 className="text-xl font-serif mb-4 flex items-center gap-2 text-stone-800">
            <Filter size={18} className="text-[#C49B89]" />
            Find Your Perfect Experience
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {/* Salon Name search */}
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search salon name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89]"
              />
            </div>

            {/* City search */}
            <div className="relative">
              <MapPin
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89]"
              />
            </div>

            {/* Service Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Service (e.g. Haircut)"
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89]"
              />
            </div>

            {/* Rating Filter */}
            <select
              value={filterRating}
              onChange={(e) =>
                setFilterRating(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89]"
            >
              <option value="">Any Rating</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Stars</option>
            </select>

            {/* Price Filter */}
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-stone-400 shrink-0" />
              <input
                type="number"
                placeholder="Max Price (₹)"
                value={filterMaxPrice}
                onChange={(e) =>
                  setFilterMaxPrice(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89]"
              />
            </div>
          </div>
        </div>

        {/* Live Map Split View */}
        <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Left Column: Salon List */}
          <div className="flex flex-col gap-5 xl:max-h-200 xl:overflow-y-auto xl:pr-2 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
            {isFetching ? (
              <div className="bg-white rounded-2xl p-12 border border-stone-100 text-center text-stone-500 shadow-sm">
                <Loader2
                  size={32}
                  className="mx-auto text-[#C49B89] animate-spin mb-3"
                />
                <h3 className="font-serif text-lg font-medium text-stone-700 mb-1">
                  Loading Salons...
                </h3>
              </div>
            ) : salons.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-stone-100 text-center text-stone-500 shadow-sm">
                <h3 className="font-serif text-lg font-medium text-stone-700 mb-1">
                  {hasAreaSearch
                    ? "No salons in your area affiliated with us"
                    : "No matching salons found"}
                </h3>
                <p className="text-stone-400 text-sm">
                  {hasAreaSearch
                    ? "Try expanding your search radius or switching to a nearby city."
                    : "Try relaxing your search terms or filters."}
                </p>
              </div>
            ) : (
              salons.map((s) => {
                const isActive = selectedSalonId === s.id;
                return (
                  <div
                    key={s.id}
                    id={`salon-card-${s.id}`}
                    onClick={() =>
                      handleSalonSelect(
                        s.id,
                        Number(s.latitude),
                        Number(s.longitude),
                      )
                    }
                    className={`group flex cursor-pointer flex-col gap-4 rounded-2xl border bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-md sm:flex-row sm:gap-5 ${
                      isActive
                        ? "border-[#C49B89] bg-[#FDFBF9] shadow-lg ring-2 ring-[#C49B89]/10 scale-[1.01]"
                        : "border-stone-100"
                    }`}
                  >
                    {/* Salon Image */}
                    <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-27.5 sm:w-27.5">
                      <img
                        src={
                          s.image ||
                          "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=800&auto=format&fit=crop"
                        }
                        alt={s.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {s.rating >= 4.8 && (
                        <span className="absolute top-2 left-2 bg-[#6B554D] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                          Elite
                        </span>
                      )}
                    </div>

                    {/* Salon Details */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="mb-0.5 truncate font-serif text-lg font-medium text-stone-800 transition-colors group-hover:text-[#C49B89]">
                              {s.name}
                            </h3>
                            <p className="mb-1 flex items-center gap-1 text-xs text-stone-400">
                              <MapPin size={12} className="text-stone-300" />
                              <span aria-hidden="true">📍</span>
                              {s.city || "New York"}
                            </p>
                          </div>
                          <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-stone-300 transition-colors hover:bg-stone-50 hover:text-red-400">
                            <Heart size={18} />
                          </button>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 font-semibold text-stone-600">
                            <Star
                              size={12}
                              fill="#C49B89"
                              className="text-[#C49B89]"
                            />
                            {s.rating || "5.0"}
                          </span>
                          {s.distance_km && (
                            <span className="font-medium text-stone-400">
                              {parseFloat(s.distance_km).toFixed(1)} km away
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Booking CTA */}
                      <div className="mt-3 flex flex-col gap-3 border-t border-stone-50 pt-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[9px] text-stone-400 uppercase tracking-wider mb-0.5">
                            Starts From
                          </p>
                          <p className="font-bold text-stone-800 text-base">
                            {s.starting_price
                              ? formatINR(s.starting_price)
                              : "—"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              getGoogleMapsDirections(
                                Number(s.latitude),
                                Number(s.longitude),
                              );
                            }}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-stone-100 p-3 text-stone-600 transition-colors hover:bg-stone-200 cursor-pointer"
                            title="Get Directions"
                          >
                            <Navigation size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectSalon) onSelectSalon(s.id);
                            }}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#6B554D] px-5 py-3 text-xs font-semibold tracking-wide text-white shadow-md shadow-[#6B554D]/10 transition-all hover:bg-[#5C4841] hover:shadow-lg cursor-pointer"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Live Map Container */}
          <div className="relative z-10 h-80 w-full overflow-hidden rounded-4xl border border-stone-100 bg-stone-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:h-105 lg:sticky lg:top-6 lg:h-155">
            {!showMapPermissionPrompt ? (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="h-full w-full"
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapController center={mapCenter} zoom={mapZoom} />

                {userCoordinates && (
                  <Marker
                    position={userCoordinates}
                    icon={L.divIcon({
                      html: `<div class="relative flex h-8 w-8 items-center justify-center">
                        <div class="absolute h-full w-full rounded-full bg-blue-500 animate-ping opacity-30"></div>
                        <div class="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
                      </div>`,
                      className: "user-location-marker",
                      iconSize: [24, 24],
                    })}
                  >
                    <Popup>
                      <div className="p-1 text-xs font-medium">
                        Your Current Location
                      </div>
                    </Popup>
                  </Marker>
                )}

                {salons.map((s) => {
                  const lat = Number(s.latitude);
                  const lon = Number(s.longitude);
                  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

                  const isActive = selectedSalonId === s.id;

                  return (
                    <Marker
                      key={s.id}
                      position={[lat, lon]}
                      icon={createCustomMarker(isActive)}
                      eventHandlers={{
                        click: () => {
                          setSelectedSalonId(s.id);
                          setMapCenter([lat, lon]);
                          setMapZoom(14);

                          const cardEl = document.getElementById(
                            `salon-card-${s.id}`,
                          );
                          cardEl?.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                          });
                        },
                      }}
                    >
                      <Popup maxWidth={280}>
                        <div className="flex flex-col gap-2 p-1.5 font-sans text-stone-800">
                          <img
                            src={
                              s.image ||
                              "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=800&auto=format&fit=crop"
                            }
                            alt={s.name}
                            className="h-24 w-full rounded-lg object-cover"
                          />
                          <div>
                            <h4 className="mb-0.5 font-serif text-sm font-semibold text-stone-900">
                              {s.name}
                            </h4>
                            <p className="mb-1 flex items-center gap-1 text-[10px] text-stone-500">
                              <span aria-hidden="true">📍</span>
                              {s.city || "New York"}
                            </p>

                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                              <span className="flex items-center gap-0.5 text-[#C49B89]">
                                <Star size={10} fill="#C49B89" />{" "}
                                {s.rating || "5.0"}
                              </span>
                              <span className="text-stone-400 font-normal">
                                •
                              </span>
                              <span className="text-stone-700">
                                Starts from {formatINR(s.starting_price)}
                              </span>
                            </div>

                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() =>
                                  getGoogleMapsDirections(lat, lon)
                                }
                                className="flex-1 rounded-lg bg-stone-100 py-1.5 text-[10px] font-semibold text-stone-600 transition-colors hover:bg-stone-200"
                              >
                                <Navigation size={10} /> Directions
                              </button>
                              <button
                                onClick={() => {
                                  if (onSelectSalon) onSelectSalon(s.id);
                                }}
                                className="flex-1 rounded-lg bg-[#6B554D] py-1.5 text-[10px] font-semibold text-white shadow-sm shadow-[#6B554D]/10 transition-all hover:bg-[#5C4841]"
                              >
                                Book Now <ExternalLink size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="relative flex h-full min-h-155 items-center justify-center overflow-hidden bg-[#F8F2EE] px-8 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(196,155,137,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(107,85,77,0.14),transparent_35%)]" />
                <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-white/60 blur-3xl" />
                <div className="absolute right-10 bottom-10 h-32 w-32 rounded-full bg-[#C49B89]/20 blur-3xl" />

                <div className="relative z-10 max-w-md rounded-4xl border border-white/70 bg-white/75 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F4E9E5] text-[#6B554D]">
                    <MapPin size={26} />
                  </div>
                  <h3 className="mb-3 font-serif text-2xl text-stone-900">
                    Allow location to see the map
                  </h3>
                  <p className="mb-6 leading-relaxed text-stone-600">
                    We need your location permission to show nearby salons and
                    the map view. If you deny access, this panel will stay here
                    until you choose to allow it.
                  </p>
                  <button
                    type="button"
                    onClick={onUseMyLocation}
                    disabled={isLoadingLocation}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B554D] px-5 py-3 font-medium text-white shadow-sm transition-colors hover:bg-[#5C4841] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoadingLocation ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <MapPin size={18} fill="currentColor" />
                    )}
                    {isLoadingLocation
                      ? "Checking permission..."
                      : "Allow location access"}
                  </button>
                  <p className="mt-4 text-xs text-stone-400">
                    You can still type a city above, but nearby results and the
                    live map require location access.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
