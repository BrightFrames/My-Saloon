/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import signImage from "../assets/admin.png";
import { PopupDialog } from "../components/PopupDialog";
import { API_BASE_URL } from "../services/apiBase";
import { Eye, EyeOff } from "lucide-react";

const SignInPage: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone: "success" | "error" | "info" | "warning";
    onConfirm?: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !pin) {
      setPopup({
        open: true,
        title: "Input Required",
        message: "Please enter your Email or Mobile Number and your PIN.",
        tone: "warning",
      });
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      setPopup({
        open: true,
        title: "Invalid PIN",
        message: "PIN must be a 4–6 digit numeric code.",
        tone: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          identifier: identifier.trim(),
          pin,
        }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        const userObj = data.user || {};
        sessionStorage.setItem("isVerified", "true");
        sessionStorage.setItem("userName", userObj.name || userObj.email || "User");
        sessionStorage.setItem("userEmail", userObj.email || "");
        sessionStorage.setItem("userMobile", userObj.mobile || userObj.phone || "");
        if (data.token) {
          sessionStorage.setItem("authToken", data.token);
        }

        const redirectPath = sessionStorage.getItem("redirectAfterSignIn");
        const hasBookingContext = Boolean(sessionStorage.getItem("selectedSalon"));
        sessionStorage.removeItem("redirectAfterSignIn");

        let finalPath = "/";
        if (redirectPath) {
          finalPath = redirectPath;
        } else if (hasBookingContext) {
          finalPath = "/checkout";
        }

        setPopup({
          open: true,
          title: "Welcome Back!",
          message: `Signed in successfully.`,
          tone: "success",
          onConfirm: () => navigate(finalPath),
        });
      } else {
        setPopup({
          open: true,
          title: "Sign In Failed",
          message: data.message || "Invalid Email/Mobile number or PIN.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network Error",
        message: "Please check your connection and try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 font-sans text-stone-800 sm:px-6">
      <PopupDialog
        open={popup.open}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        confirmLabel="Continue"
        onConfirm={() => {
          const action = popup.onConfirm;
          setPopup((prev) => ({ ...prev, open: false }));
          action?.();
        }}
      />

      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[#f5e9e2]">
        <img
          src={signImage}
          alt="Salon background"
          className="w-full h-full object-cover object-center scale-105 opacity-75 blur-[0.8px]"
        />
        <div className="absolute inset-0 bg-linear-to-br from-white/20 via-white/10 to-[#f5e9e2]/35" />
      </div>

      {/* Card */}
      <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-2xl bg-white/80 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <h2 className="text-2xl font-serif mb-1 text-[#6B554D]">Sign In</h2>
        <p className="text-xs text-stone-500 mb-6 text-center">
          Enter your Email or Mobile Number and PIN to continue
        </p>

        <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
          <div className="flex flex-col gap-1 w-full">
            <input
              type="text"
              placeholder="Email OR Mobile Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
              required
            />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <div className="relative w-full">
              <input
                type={showPin ? "text" : "password"}
                placeholder="4–6 Digit PIN"
                value={pin}
                maxLength={6}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 pr-11 tracking-widest outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#6B554D] p-1 transition-colors cursor-pointer"
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end mt-0.5">
              <Link
                to="/forgot-pin"
                className="text-xs text-[#6B554D] hover:underline font-medium cursor-pointer"
              >
                Forgot PIN?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 min-h-11 rounded-lg bg-[#6B554D] py-3 text-white transition-colors hover:bg-[#5C4841] disabled:opacity-50 font-medium cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer Link to Register */}
        <div className="mt-6 pt-4 border-t border-stone-200/60 w-full text-center text-xs text-stone-600">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[#6B554D] hover:underline">
            Register (Sign Up)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
