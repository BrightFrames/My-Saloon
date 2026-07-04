import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Read user data from sessionStorage
  const isVerified = sessionStorage.getItem("isVerified") === "true";
  const userName = sessionStorage.getItem("userName");
  const userEmail = sessionStorage.getItem("userEmail");

  // Get the first letter of the email for the avatar
  const avatarLetter = userEmail?.charAt(0)?.toUpperCase() || "U";

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logout: clear sessionStorage and redirect to homepage
  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const handleGlowupReload = () => {
    if (isHome) {
      window.location.reload();
      return;
    }

    navigate("/");
  };

  const isHome = location.pathname === "/";

  const navLinks = [
    { label: "DISCOVER", path: "/" },
    { label: "ABOUT", path: "/about" },
    { label: "MEMBERSHIPS", path: "/memberships" },
    { label: "CONCIERGE", path: "/concierge" },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-[0_1px_20px_-6px_rgba(0,0,0,0.1)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={handleGlowupReload}
          className="text-xl font-semibold font-serif text-[#C49B89] transition-colors hover:text-[#b08774] sm:text-2xl cursor-pointer"
          title="Reload Glowup"
        >
          Glowup
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-8 text-sm tracking-wide font-medium text-stone-500">
          {navLinks.map((link, i) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={i}
                onClick={() => navigate(link.path)}
                className={`relative py-1 transition-colors hover:text-stone-900 cursor-pointer ${
                  isActive
                    ? "text-stone-900 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-stone-900 font-semibold"
                    : ""
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Conditional rendering: logged in vs logged out */}
          {!isVerified ? (
            // NOT LOGGED IN: Show "Sign In" on home, "Home" on other pages
            isHome ? (
              <button
                className="hidden min-h-11 items-center justify-center rounded-lg bg-[#6B554D] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#5C4841] hover:shadow-lg hover:shadow-[#6B554D]/20 md:inline-flex md:px-6"
                onClick={() => navigate("/signin")}
              >
                Sign In
              </button>
            ) : (
              <button
                className="hidden min-h-11 items-center justify-center rounded-lg bg-[#6B554D] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#5C4841] hover:shadow-lg hover:shadow-[#6B554D]/20 md:inline-flex md:px-6"
                onClick={() => navigate("/")}
              >
                Home
              </button>
            )
          ) : (
            // LOGGED IN: Show avatar (email first letter) + name + logout
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/my-bookings")}
                className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-all hover:text-[#C49B89] cursor-pointer"
              >
                My Bookings
              </button>
              {/* Circular avatar with first letter of email */}
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#C49B89] to-[#6B554D] text-sm font-bold text-white shadow-md ring-2 ring-white">
                  {avatarLetter}
                </div>
                <span className="font-medium text-sm text-[#6B554D]">
                  {userName}
                </span>
              </div>
              {/* Logout button */}
              <button
                className="flex items-center gap-1.5 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-stone-100 shadow-lg">
          <div className="flex flex-col gap-2 px-4 py-4 sm:px-6">
            {navLinks.map((link, i) => (
              <button
                key={i}
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 text-left cursor-pointer"
              >
                {link.label}
              </button>
            ))}

            {!isVerified ? (
              <button
                className="mt-2 flex min-h-11 w-full items-center justify-center rounded-lg bg-[#6B554D] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5C4841]"
                onClick={() => {
                  navigate(isHome ? "/signin" : "/");
                  setMobileMenuOpen(false);
                }}
              >
                {isHome ? "Sign In" : "Home"}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate("/my-bookings");
                    setMobileMenuOpen(false);
                  }}
                  className="flex min-h-11 items-center rounded-lg px-3 text-left text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-[#C49B89] cursor-pointer"
                >
                  My Bookings
                </button>
                <div className="flex items-center justify-between py-2 border-t border-stone-100 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#C49B89] to-[#6B554D] text-sm font-bold text-white shadow-md ring-2 ring-white">
                      {avatarLetter}
                    </div>
                    <span className="font-medium text-sm text-[#6B554D]">
                      {userName}
                    </span>
                  </div>
                  <button
                    className="flex min-h-11 items-center gap-1.5 rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600 transition-all hover:bg-red-50 hover:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
