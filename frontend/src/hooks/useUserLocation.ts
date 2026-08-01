import { useCallback, useState } from "react";
import {
  getCachedLocation,
  reverseGeocode,
  saveCachedLocation,
} from "../services/location";
import type { LocationPermission, LocationPopupState } from "../services/location";

type UseUserLocationResult = {
  location: string;
  isLoadingLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  locationPermission: LocationPermission;
  popup: LocationPopupState;
  setLocationManual: (loc: string) => void;
  closePopup: () => void;
  useMyLocation: (autoDetect?: boolean) => void;
};

const DEFAULT_POPUP: LocationPopupState = {
  open: false,
  title: "",
  message: "",
  tone: "info",
};

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermission>("unknown");
  const [popup, setPopup] = useState<LocationPopupState>(DEFAULT_POPUP);

  const closePopup = useCallback(() => {
    setPopup((prev) => ({ ...prev, open: false }));
  }, []);

  const setLocationManual = useCallback((loc: string) => {
    setLocation(loc);
    setLatitude(null);
    setLongitude(null);
  }, []);

  const useMyLocation = useCallback((autoDetect = false) => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      setPopup({
        open: true,
        title: "Location unavailable",
        message: "Geolocation is not supported by your browser.",
        tone: "error",
      });
      return;
    }

    const resolveCurrentPosition = (
      options: PositionOptions,
    ): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    const geolocationOptions: PositionOptions[] = [
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 12_000 },
    ];

    const requestLocation = async () => {
      setIsLoadingLocation(true);

      let position: GeolocationPosition | null = null;
      let lastError: GeolocationPositionError | null = null;

      for (const options of geolocationOptions) {
        try {
          position = await resolveCurrentPosition(options);
          break;
        } catch (error) {
          lastError = error as GeolocationPositionError;
        }
      }

      if (!position) {
        const cachedLocation = getCachedLocation();
        if (cachedLocation) {
          setLocationPermission("granted");
          setLatitude(cachedLocation.lat);
          setLongitude(cachedLocation.lon);
          setLocation(cachedLocation.displayLocation);
          setIsLoadingLocation(false);
          return;
        }

        const isPermissionDenied = lastError?.code === 1;
        setLocationPermission(isPermissionDenied ? "denied" : "unknown");

        if (!autoDetect) {
          setPopup({
            open: true,
            title: "Could not detect location",
            message: isPermissionDenied
              ? "Please allow location permission in your browser settings and try again."
              : "Your GPS signal looks weak right now. Please try again in a moment or enter your city manually.",
            tone: isPermissionDenied ? "error" : "warning",
          });
        }

        setIsLoadingLocation(false);
        return;
      }

      try {
        const { latitude: lat, longitude: lon } = position.coords;
        setLocationPermission("granted");
        setLatitude(lat);
        setLongitude(lon);

        const reverseLocation = await reverseGeocode(lat, lon);
        const finalLocation = reverseLocation || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setLocation(finalLocation);
        saveCachedLocation(lat, lon, finalLocation);

        if (autoDetect) {
          sessionStorage.setItem("location-auto-detected", "true");
        }
      } catch (error) {
        console.error("Error fetching location details:", error);
        const fallbackLocation = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        setLocation(fallbackLocation);
        saveCachedLocation(
          position.coords.latitude,
          position.coords.longitude,
          fallbackLocation,
        );
      } finally {
        setIsLoadingLocation(false);
      }
    };

    requestLocation().catch((error) => {
      console.error("Error getting location:", error);
      if (!autoDetect) {
        setPopup({
          open: true,
          title: "Could not detect location",
          message:
            "We could not access your current location. You can still enter it manually.",
          tone: "error",
        });
      }
      setIsLoadingLocation(false);
    });
  }, []);

  return {
    location,
    isLoadingLocation,
    latitude,
    longitude,
    locationPermission,
    popup,
    setLocationManual,
    closePopup,
    useMyLocation,
  };
}
