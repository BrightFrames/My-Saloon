/**
 * Utility functions for Google Maps Navigation and Location validation
 */

export function isValidLocation(
  lat?: number | string | null,
  lon?: number | string | null
): boolean {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return false;
  }
  const latitude = typeof lat === "string" ? parseFloat(lat) : lat;
  const longitude = typeof lon === "string" ? parseFloat(lon) : lon;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return false;
  }

  // Check valid geographic coordinate ranges and non-zero
  if (latitude === 0 && longitude === 0) {
    return false;
  }

  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function openGoogleMapsDirections(
  lat?: number | string | null,
  lon?: number | string | null
): boolean {
  if (!isValidLocation(lat, lon)) {
    return false;
  }

  const latitude = typeof lat === "string" ? parseFloat(lat) : lat;
  const longitude = typeof lon === "string" ? parseFloat(lon) : lon;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  return true;
}

export function openGoogleMapsLocation(
  options: {
    mapsLink?: string | null;
    destinationAddress?: string | null;
    placeName?: string | null;
    lat?: number | string | null;
    lon?: number | string | null;
  } = {},
): boolean {
  const mapsLink = options.mapsLink?.trim();
  if (mapsLink) {
    const normalizedLink = mapsLink.startsWith("http")
      ? mapsLink
      : `https://${mapsLink}`;
    window.open(normalizedLink, "_blank", "noopener,noreferrer");
    return true;
  }

  const address = options.destinationAddress?.trim();
  const placeName = options.placeName?.trim();
  const query = [placeName, address].filter(Boolean).join(", ");
  if (query) {
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(searchUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  return openGoogleMapsDirections(options.lat, options.lon);
}
