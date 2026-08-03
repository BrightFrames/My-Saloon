import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { LandingPageWrapper } from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import MembershipsPage from "./pages/MembershipsPage";
import ConciergePage from "./pages/ConciergePage";
import Navbar from "./components/Navbar";
import { SalonDetailsPage } from "./pages/SalonDetailsPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import SignInPage from "./pages/SignInPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPinPage from "./pages/ForgotPinPage";
import { BookingConfirmationPage } from "./pages/BookingConfirmationPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { PopupDialog } from "./components/PopupDialog";
import { useUserLocation } from "./hooks/useUserLocation";

function AppRoutes() {
  const routeLocation = useLocation();
  const {
    location,
    isLoadingLocation,
    latitude,
    longitude,
    locationPermission,
    popup,
    setLocationManual,
    closePopup,
    useMyLocation,
  } = useUserLocation();

  const handleSearchSalons = () => {
    const resultsSection = document.querySelector("#results-section");
    resultsSection?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (routeLocation.pathname !== "/") return;
    if (locationPermission !== "unknown") return;
    if (sessionStorage.getItem("location-prompted") === "true") return;

    sessionStorage.setItem("location-prompted", "true");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMyLocation(true);
  }, [useMyLocation, locationPermission, routeLocation.pathname]);

  return (
    <>
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel="Got it"
        onConfirm={closePopup}
      />
      <Routes>
        <Route
          path="/"
          element={
            <LandingPageWrapper
              location={location}
              setLocation={setLocationManual}
              isLoadingLocation={isLoadingLocation}
              // eslint-disable-next-line react-hooks/rules-of-hooks
              onUseMyLocation={() => useMyLocation(false)}
              onSearch={handleSearchSalons}
              latitude={latitude}
              longitude={longitude}
              locationPermission={locationPermission}
            />
          }
        />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-pin" element={<ForgotPinPage />} />
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
    <ThemeProvider>
      <BrowserRouter>
        <InnerApp />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
