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
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface LandingPageProps {
  location: string;
  setLocation: (loc: string) => void;
  isLoadingLocation: boolean;
  onUseMyLocation: () => void;
  onSelectSalon?: (salon: string) => void;
  latitude?: number | null;
  longitude?: number | null;
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
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Gorgeous Custom Luxury DivIcon Generator
const createCustomMarker = (isActive: boolean) => L.divIcon({
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-10 h-10 rounded-full bg-[#6B554D] ${isActive ? "scale-125 bg-[#C49B89] ring-4 ring-[#C49B89]/20" : "scale-100"} transition-all duration-300 animate-ping opacity-15"></div>
    <div class="w-8 h-8 rounded-full bg-gradient-to-br ${isActive ? "from-[#C49B89] to-[#6B554D] scale-110 shadow-xl ring-2 ring-white" : "from-[#6B554D] to-[#5C4841]"} flex items-center justify-center text-white font-bold transition-all duration-300">
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
  onSelectSalon,
  latitude,
  longitude,
}: LandingPageProps) {
  const isVerified = sessionStorage.getItem("isVerified") === "true";
  const userName = sessionStorage.getItem("userName");
  const [salons, setSalons] = useState<any[]>([]);
  const hasAreaSearch = typeof latitude === "number" && typeof longitude === "number";

  // Search & Filter States
  const [searchName, setSearchName] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [filterRating, setFilterRating] = useState<number | "">("");
  const [filterService, setFilterService] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | "">("");

  // Map States
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NY
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
      try {
        const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api/v1";
        const params = new URLSearchParams();

        if (typeof latitude === "number" && typeof longitude === "number") {
          params.append("lat", String(latitude));
          params.append("lon", String(longitude));
          params.append("radius", "15");
        }

        if (searchCity || location) {
          const cityQuery = searchCity || (location ? location.split(",")[0] : "");
          if (cityQuery) params.append("city", cityQuery);
        }

        if (searchName) params.append("name", searchName);
        if (filterRating) params.append("rating", String(filterRating));
        if (filterService) params.append("service", filterService);
        if (filterMaxPrice) params.append("maxPrice", String(filterMaxPrice));

        const res = await fetch(`${base}/salons?${params.toString()}`);
        const body = await res.json();
        if (body && body.success) {
          const fetchedSalons = body.data || [];
          setSalons(fetchedSalons);
          
          if (fetchedSalons.length > 0 && !latitude && !longitude) {
            // Update map center to the first salon's location if user location is not strictly tracking
            setMapCenter([Number(fetchedSalons[0].latitude), Number(fetchedSalons[0].longitude)]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch salons:", err);
      }
    };

    fetchSalons();
  }, [location, latitude, longitude, searchName, searchCity, filterRating, filterService, filterMaxPrice]);

  const handleSalonSelect = (id: string, lat: number, lon: number) => {
    setSelectedSalonId(id);
    setMapCenter([lat, lon]);
    setMapZoom(14);
    
    // Smooth scroll salon card into view
    const cardEl = document.getElementById(`salon-card-${id}`);
    cardEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const getGoogleMapsDirections = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans text-stone-800">
      {/* Hero Section */}
      <main className="relative max-w-7xl mx-auto px-8 pt-16 pb-24 flex h-[620px] items-center">
        {/* Background Image/Overlay */}
        <div className="absolute top-0 right-0 w-[55%] h-full -z-10 rounded-[40px] overflow-hidden opacity-90 blur-[0.5px]">
          <img
            src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2938&auto=format&fit=crop"
            alt="Salon background"
            className="w-full h-full object-cover object-center opacity-40 mix-blend-multiply filter blur-[2.5px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF9] via-[#FDFBF9]/80 to-transparent"></div>
        </div>

        <div className="max-w-2xl">
          {isVerified ? (
            <>
              <div className="inline-flex items-center gap-2 bg-[#F4E9E5] text-[#6B554D] text-sm font-medium px-4 py-1.5 rounded-full mb-5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                You're all set
              </div>
              <h1 className="text-[3.2rem] leading-[1.1] font-serif mb-4 text-stone-900">
                Welcome, {userName}! 🎉
              </h1>
              <p className="text-stone-500 text-lg mb-10 max-w-[420px] leading-relaxed">
                Great to see you again! Explore top-rated salons near you and
                book your next pampering session instantly.
              </p>
              <button
                onClick={() => {
                  const section = document.querySelector("#results-section");
                  section?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center mb-4 gap-2 bg-[#6B554D] hover:bg-[#5C4841] text-white px-8 py-4 rounded-xl font-medium transition-all hover:shadow-xl hover:shadow-[#6B554D]/20 text-base cursor-pointer"
              >
                <Calendar size={18} />
                Book Your Next Session
              </button>
            </>
          ) : (
            <>
              <h1 className="text-[3.5rem] leading-[1.1] font-serif mb-6 text-stone-900">
                Find & Book Top Salons Near
                <br />
                You Instantly
              </h1>
              <p className="text-stone-500 text-lg mb-10 max-w-[420px] leading-relaxed">
                Real-time availability. Verified salons. Instant booking.
                Elevate your self-care routine with curated professionals.
              </p>
            </>
          )}

          {/* Search/Location Form */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button
              onClick={onUseMyLocation}
              disabled={isLoadingLocation}
              className="flex items-center justify-center gap-2 bg-[#6B554D] hover:bg-[#5C4841] text-white px-6 py-3.5 rounded-lg font-medium transition-colors w-full sm:w-auto shrink-0 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoadingLocation ? (
                <Loader2 size={18} className="text-white animate-spin" />
              ) : (
                <MapPin size={18} fill="currentColor" className="text-white" />
              )}
              {isLoadingLocation ? "Locating..." : "Use My Location"}
            </button>
            <div className="relative w-full max-w-[320px]">
              {location && !isLoadingLocation && (
                <div className="mb-2 flex items-center gap-2 text-sm text-stone-500">
                  <MapPin size={14} className="text-stone-400" />
                  <span className="truncate">Detected: {location}</span>
                  <button
                    onClick={() => setLocation("")}
                    className="ml-2 text-xs text-stone-400 hover:text-stone-600"
                    aria-label="Edit detected location"
                  >
                    Edit
                  </button>
                </div>
              )}
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Or enter city manually..."
                className="w-full pl-5 pr-12 py-3.5 rounded-lg border border-stone-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89] focus:border-transparent text-stone-600"
              />
              <MapPin
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
              />
            </div>
          </div>

          {/* Stats/Badges */}
          <div className="flex items-center gap-8 text-sm font-medium text-stone-500 uppercase tracking-wide">
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
      <section id="results-section" className="max-w-7xl mx-auto px-8 pb-32">
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-stone-100 mb-8">
          <h2 className="text-xl font-serif mb-4 flex items-center gap-2 text-stone-800">
            <Filter size={18} className="text-[#C49B89]" />
            Find Your Perfect Experience
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Salon Name search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search salon name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89] bg-stone-50/50"
              />
            </div>

            {/* City search */}
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89] bg-stone-50/50"
              />
            </div>

            {/* Service Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Service (e.g. Haircut)"
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89] bg-stone-50/50"
              />
            </div>

            {/* Rating Filter */}
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89] bg-stone-50/50"
            >
              <option value="">Any Rating</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Stars</option>
            </select>

            {/* Price Filter */}
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-stone-400 shrink-0" />
              <input
                type="number"
                placeholder="Max Price ($)"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C49B89] bg-stone-50/50"
              />
            </div>
          </div>
        </div>

        {/* Live Map Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
          
          {/* Left Column: Salon List */}
          <div className="flex flex-col gap-5 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
            {salons.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-stone-100 text-center text-stone-500 shadow-sm">
                <Loader2 size={32} className="mx-auto text-[#C49B89] animate-spin mb-3" />
                <h3 className="font-serif text-lg font-medium text-stone-700 mb-1">
                  {hasAreaSearch ? "No salons in your area affiliated with us" : "No matching salons found"}
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
                    onClick={() => handleSalonSelect(s.id, Number(s.latitude), Number(s.longitude))}
                    className={`bg-white rounded-2xl p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] border transition-all duration-300 flex gap-5 hover:shadow-md cursor-pointer group ${
                      isActive
                        ? "border-[#C49B89] bg-[#FDFBF9] shadow-lg ring-2 ring-[#C49B89]/10 scale-[1.01]"
                        : "border-stone-100"
                    }`}
                  >
                    {/* Salon Image */}
                    <div className="w-[110px] h-[110px] shrink-0 rounded-xl overflow-hidden bg-stone-100 relative">
                      <img
                        src={s.image || "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=800&auto=format&fit=crop"}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {s.rating >= 4.8 && (
                        <span className="absolute top-2 left-2 bg-[#6B554D] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                          Elite
                        </span>
                      )}
                    </div>

                    {/* Salon Details */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-serif text-lg font-medium text-stone-800 mb-0.5 group-hover:text-[#C49B89] transition-colors">
                              {s.name}
                            </h3>
                            <p className="text-xs text-stone-400 mb-1 flex items-center gap-1">
                              <MapPin size={12} className="text-stone-300" />
                              {s.city || "New York"}
                            </p>
                          </div>
                          <button className="text-stone-300 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-stone-50">
                            <Heart size={18} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-xs mt-1">
                          <span className="flex items-center gap-1 font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                            <Star size={12} fill="#C49B89" className="text-[#C49B89]" />
                            {s.rating || "5.0"}
                          </span>
                          {s.distance_km && (
                            <span className="text-stone-400 font-medium">
                              {parseFloat(s.distance_km).toFixed(1)} km away
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Booking CTA */}
                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-stone-50">
                        <div>
                          <p className="text-[9px] text-stone-400 uppercase tracking-wider mb-0.5">Starts From</p>
                          <p className="font-bold text-stone-800 text-base">${s.starting_price || "—"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              getGoogleMapsDirections(Number(s.latitude), Number(s.longitude));
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-600 p-2.5 rounded-xl transition-colors cursor-pointer"
                            title="Get Directions"
                          >
                            <Navigation size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectSalon) onSelectSalon(s.id);
                            }}
                            className="bg-[#6B554D] hover:bg-[#5C4841] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#6B554D]/10 hover:shadow-lg cursor-pointer"
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
          <div className="rounded-[2.5rem] w-full h-[620px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-stone-100 overflow-hidden sticky top-6 bg-stone-100 relative z-10">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="w-full h-full"
              zoomControl={true}
            >
              {/* Premium Subtle Tile Layer */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />

              <MapController center={mapCenter} zoom={mapZoom} />

              {/* User location pin if latitude/longitude are set */}
              {typeof latitude === "number" && typeof longitude === "number" && (
                <Marker
                  position={[latitude, longitude]}
                  icon={L.divIcon({
                    html: `<div class="relative w-8 h-8 flex items-center justify-center">
                      <div class="absolute w-full h-full rounded-full bg-blue-500 animate-ping opacity-30"></div>
                      <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
                    </div>`,
                    className: "user-location-marker",
                    iconSize: [24, 24],
                  })}
                >
                  <Popup>
                    <div className="p-1 font-medium text-xs">Your Current Location</div>
                  </Popup>
                </Marker>
              )}

              {/* Salon Markers */}
              {salons.map((s) => {
                const lat = Number(s.latitude);
                const lon = Number(s.longitude);
                if (isNaN(lat) || isNaN(lon)) return null;

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
                        
                        // Scroll salon card into view
                        const cardEl = document.getElementById(`salon-card-${s.id}`);
                        cardEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      },
                    }}
                  >
                    <Popup maxWidth={280}>
                      <div className="p-1.5 flex flex-col gap-2 font-sans text-stone-800">
                        <img
                          src={s.image || "https://images.unsplash.com/photo-1595476108010-b4d1f10d5e43?q=80&w=800&auto=format&fit=crop"}
                          alt={s.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <div>
                          <h4 className="font-serif text-sm font-semibold mb-0.5 text-stone-900">{s.name}</h4>
                          <p className="text-[10px] text-stone-500 mb-1">{s.city || "New York"}</p>
                          
                          <div className="flex items-center gap-2 text-xs font-semibold mb-2">
                            <span className="flex items-center gap-0.5 text-[#C49B89]">
                              <Star size={10} fill="#C49B89" /> {s.rating || "5.0"}
                            </span>
                            <span className="text-stone-400 font-normal">•</span>
                            <span className="text-stone-700">Starts from ${s.starting_price}</span>
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => getGoogleMapsDirections(lat, lon)}
                              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Navigation size={10} /> Directions
                            </button>
                            <button
                              onClick={() => {
                                if (onSelectSalon) onSelectSalon(s.id);
                              }}
                              className="flex-1 bg-[#6B554D] hover:bg-[#5C4841] text-white py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all shadow-sm shadow-[#6B554D]/10 cursor-pointer"
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
          </div>

        </div>
      </section>
    </div>
  );
}
