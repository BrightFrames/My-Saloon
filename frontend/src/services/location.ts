/* eslint-disable @typescript-eslint/no-explicit-any */
const LOCATION_CACHE_KEY = "last-known-location";
const LOCATION_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type LocationPermission = "unknown" | "granted" | "denied";

export type LocationPopupTone = "success" | "error" | "info" | "warning";

export type LocationPopupState = {
  open: boolean;
  title: string;
  message: string;
  tone: LocationPopupTone;
};

export type CachedLocation = {
  lat: number;
  lon: number;
  displayLocation: string;
  updatedAt: number;
};

export type ResolvedLocation = {
  lat: number;
  lon: number;
  displayLocation: string;
};

export function saveCachedLocation(
  lat: number,
  lon: number,
  displayLocation: string,
): void {
  try {
    const payload: CachedLocation = {
      lat,
      lon,
      displayLocation,
      updatedAt: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache failures to keep the main UX intact.
  }
}

export function getCachedLocation(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedLocation>;
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lon !== "number" ||
      typeof parsed.displayLocation !== "string" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }

    if (Date.now() - parsed.updatedAt > LOCATION_CACHE_MAX_AGE_MS) {
      return null;
    }

    return {
      lat: parsed.lat,
      lon: parsed.lon,
      displayLocation: parsed.displayLocation,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

function parseDisplayLocation(payload: any): string {
  const address = payload?.address || payload?.localityInfo?.administrative || null;

  if (address) {
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.locality ||
      payload?.city ||
      "";

    const state =
      address.state ||
      address.principalSubdivision ||
      payload?.principalSubdivision ||
      address.countryName ||
      payload?.countryName ||
      "";

    const display = [city, state].filter(Boolean).join(", ");
    if (display) return display;
  }

  const fallbackCity = payload?.city || payload?.locality || "";
  const fallbackState = payload?.principalSubdivision || payload?.countryName || "";
  return [fallbackCity, fallbackState].filter(Boolean).join(", ");
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  const providers = [
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      if (!response.ok) continue;

      const data = await response.json();
      const displayLocation = parseDisplayLocation(data);
      if (displayLocation) return displayLocation;
    } catch {
      // Fall through to next provider.
    }
  }

  return null;
}

function parseGeocodedLocation(payload: any): ResolvedLocation | null {
  const lat = Number(payload?.lat);
  const lon = Number(payload?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const address = payload?.address || {};
  const displayLocation =
    payload?.display_name ||
    [address.city || address.town || address.village || address.county || "", address.state || address.country || ""]
      .filter(Boolean)
      .join(", ") ||
    "";

  return {
    lat,
    lon,
    displayLocation,
  };
}

export async function geocodeLocation(
  location: string,
): Promise<ResolvedLocation | null> {
  const query = location.trim();
  if (!query) return null;

  const providers = [
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    `https://api.bigdatacloud.net/data/geocode-by-text?text=${encodeURIComponent(query)}&localityLanguage=en`,
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      if (!response.ok) continue;

      const data = await response.json();
      const raw = Array.isArray(data) ? data[0] : data?.results?.[0] || data;
      const resolved = parseGeocodedLocation(raw);
      if (resolved) return resolved;
    } catch {
      // Try the next provider.
    }
  }

  return null;
}
