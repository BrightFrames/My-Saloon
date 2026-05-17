import React from "react";
import { useNavigate, NavLink } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isVerified = sessionStorage.getItem("isVerified") === "true";
  const userName = sessionStorage.getItem("userName");

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="flex items-center justify-between px-8 py-5 mx-auto w-full max-w-7xl">
      <div className="text-2xl font-semibold font-serif text-[#C49B89]">
        Glowup
      </div>

      <div className="hidden md:flex items-center space-x-8 text-sm tracking-wide font-medium text-stone-600">
        <NavLink
          to="/treatments"
          className={({ isActive }) =>
            isActive
              ? "text-stone-900 border-b-2 border-stone-900 pb-1"
              : "hover:text-stone-900 transition-colors"
          }
        >
          DISCOVER
        </NavLink>

        <NavLink
          to="/treatments"
          className={({ isActive }) =>
            isActive ? "text-stone-900 border-b-2 border-stone-900 pb-1" : "hover:text-stone-900 transition-colors"
          }
        >
          TREATMENTS
        </NavLink>

        <NavLink
          to="/memberships"
          className={({ isActive }) =>
            isActive ? "text-stone-900 border-b-2 border-stone-900 pb-1" : "hover:text-stone-900 transition-colors"
          }
        >
          MEMBERSHIPS
        </NavLink>
        <NavLink
          to="/concierge"
          className={({ isActive }) =>
            isActive ? "text-stone-900 border-b-2 border-stone-900 pb-1" : "hover:text-stone-900 transition-colors"
          }
        >
          CONCIERGE
        </NavLink>
      </div>
      <div className="flex items-center space-x-6">
        {!isVerified ? (
          <button
            className="bg-[#6B554D] hover:bg-[#5C4841] text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>
        ) : (
          <>
            <span className="font-medium text-[#6B554D]">{userName}</span>
            <button
              className="bg-[#c9ada7] hover:bg-[#b89b8a] text-white px-4 py-2 rounded-md text-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
