import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import { LandingPageWrapper } from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import MembershipsPage from "./pages/MembershipsPage";
import ConciergePage from "./pages/ConciergePage";
import Navbar from "./components/Navbar";
import { SalonDetailsPage } from "./pages/SalonDetailsPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import SignInPage from "./pages/SignInPage";
import { BookingConfirmationPage } from "./pages/BookingConfirmationPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { PopupDialog } from "./components/PopupDialog";

function AppRoutes() {
  const [location, setLocation] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info" as "success" | "error" | "info" | "warning",
  });

  const handleUseMyLocation = (autoDetect = false) => {
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

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLocationPermission("granted");
          setLatitude(latitude);
          setLongitude(longitude);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&email=admin@glowup.com`,
          );
          const data = await response.json();

          if (data && data.address) {
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county ||
              "";
            const state = data.address.state || data.address.country || "";
            const displayLoc = [city, state].filter(Boolean).join(", ");
            setLocation(
              displayLoc || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            );
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }

          if (autoDetect) {
            sessionStorage.setItem("glowup-location-auto-detected", "true");
          }
        } catch (error) {
          console.error("Error fetching location details:", error);
          setLocation(
            `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          );
          if (autoDetect) {
            sessionStorage.setItem("glowup-location-auto-detected", "true");
          }
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission("denied");
        }
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
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
    );
  };

  const handleSearchSalons = () => {
    const resultsSection = document.querySelector("#results-section");
    resultsSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel="Got it"
        onConfirm={() => setPopup((prev) => ({ ...prev, open: false }))}
      />
      <Routes>
        <Route
          path="/"
          element={
            <LandingPageWrapper
              location={location}
              setLocation={(loc) => {
                setLocation(loc);
                setLatitude(null);
                setLongitude(null);
              }}
              isLoadingLocation={isLoadingLocation}
              onUseMyLocation={() => handleUseMyLocation(false)}
              onSearch={handleSearchSalons}
              latitude={latitude}
              longitude={longitude}
              locationPermission={locationPermission}
            />
          }
        />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/memberships" element={<MembershipsPage />} />
        <Route path="/concierge" element={<ConciergePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/treatments" element={<Navigate to="/about" replace />} />
        <Route path="/salon/:id" element={<SalonDetailsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route
          path="/booking-confirmation/:id"
          element={<BookingConfirmationPage />}
        />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
      </Routes>
    </>
  );
}

function InnerApp() {
  return (
    <>
      <Navbar />
      <AppRoutes />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  );
}

export default App;
