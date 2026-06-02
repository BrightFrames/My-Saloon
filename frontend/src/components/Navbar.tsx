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
      <div className="flex items-center justify-between px-8 py-4 mx-auto max-w-7xl">
        {/* Logo */}
        <button
          onClick={handleGlowupReload}
          className="text-2xl font-semibold font-serif text-[#C49B89] hover:text-[#b08774] transition-colors cursor-pointer"
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
                    ? "text-stone-900 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-stone-900 font-semibold"
                    : ""
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Conditional rendering: logged in vs logged out */}
          {!isVerified ? (
            // NOT LOGGED IN: Show "Sign In" on home, "Home" on other pages
            isHome ? (
              <button
                className="hidden md:block bg-[#6B554D] hover:bg-[#5C4841] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-[#6B554D]/20"
                onClick={() => navigate("/signin")}
              >
                Sign In
              </button>
            ) : (
              <button
                className="hidden md:block bg-[#6B554D] hover:bg-[#5C4841] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-[#6B554D]/20"
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
                className="text-stone-600 hover:text-[#C49B89] font-medium text-sm px-3 py-2 transition-all mr-2 flex items-center gap-1.5 cursor-pointer"
              >
                My Bookings
              </button>
              {/* Circular avatar with first letter of email */}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C49B89] to-[#6B554D] flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white">
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
            className="md:hidden text-stone-600 hover:text-stone-900 p-2 rounded-lg hover:bg-stone-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-stone-100 shadow-lg">
          <div className="px-8 py-4 flex flex-col gap-3">
            {navLinks.map((link, i) => (
              <button
                key={i}
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 py-2 transition-colors text-left cursor-pointer"
              >
                {link.label}
              </button>
            ))}

            {!isVerified ? (
              <button
                className="bg-[#6B554D] hover:bg-[#5C4841] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors w-full mt-2"
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
                  className="text-stone-600 hover:text-[#C49B89] font-medium text-sm py-2 text-left cursor-pointer"
                >
                  My Bookings
                </button>
                <div className="flex items-center justify-between py-2 border-t border-stone-100 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C49B89] to-[#6B554D] flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white">
                      {avatarLetter}
                    </div>
                    <span className="font-medium text-sm text-[#6B554D]">
                      {userName}
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
