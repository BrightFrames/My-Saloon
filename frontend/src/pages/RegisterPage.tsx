/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import signImage from "../assets/admin.png";
import { PopupDialog } from "../components/PopupDialog";
import { API_BASE_URL } from "../services/apiBase";
import { validateFullName, validatePhoneNumber } from "../utils/validation";

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    pin: "",
    confirmPin: "",
  });

  const [step, setStep] = useState<"details" | "otp" | "pin">("details");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

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

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: any = null;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "name" && value) {
      setNameError(validateFullName(value));
    } else if (name === "mobile" && value) {
      setMobileError(validatePhoneNumber(value));
    } else if (name === "pin" || name === "confirmPin") {
      setPinError(null);
    }
  };

  // STEP 1: Send OTP for registration
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateFullName(form.name);
    const mobileErr = validatePhoneNumber(form.mobile);

    if (nameErr || mobileErr) {
      setNameError(nameErr);
      setMobileError(mobileErr);
      return;
    }

    if (!form.email || !form.email.includes("@")) {
      setPopup({
        open: true,
        title: "Invalid Email",
        message: "Please enter a valid email address.",
        tone: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          mobile: form.mobile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setResendTimer(30);
        setPopup({
          open: true,
          title: "Verification Code Sent",
          message: `We sent a code to ${form.email}. Please check your inbox.`,
          tone: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "Registration Failed",
          message: data.message || "Could not send OTP. Please try again.",
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

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          mobile: form.mobile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResendTimer(30);
        setPopup({
          open: true,
          title: "OTP Resent",
          message: `A new code has been sent to ${form.email}.`,
          tone: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "Resend Failed",
          message: data.message || "Could not resend OTP.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network Error",
        message: "Please check your connection.",
        tone: "error",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          otp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        setStep("pin");
        setPopup({
          open: true,
          title: "OTP Verified!",
          message: "Email verified successfully. Now please create your 4–6 digit PIN.",
          tone: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "Invalid OTP",
          message: data.message || "The verification code is incorrect.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network Error",
        message: "Please check your connection.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Create PIN and Complete Registration
  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{4,6}$/.test(form.pin)) {
      setPinError("PIN must be a 4–6 digit numeric code");
      return;
    }

    if (form.pin !== form.confirmPin) {
      setPinError("PINs do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/create-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          mobile: form.mobile,
          pin: form.pin,
          otp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userObj = data.user?.user || {};
        sessionStorage.setItem("isVerified", "true");
        sessionStorage.setItem("userName", userObj.name || form.name);
        sessionStorage.setItem("userEmail", userObj.email || form.email);
        sessionStorage.setItem("userMobile", userObj.mobile || form.mobile || "");
        if (data.user?.token) {
          sessionStorage.setItem("authToken", data.user.token);
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
          title: "Registration Successful!",
          message: `Welcome to Glowup, ${form.name}! Your account has been created.`,
          tone: "success",
          onConfirm: () => navigate(finalPath),
        });
      } else {
        setPopup({
          open: true,
          title: "PIN Setup Failed",
          message: data.message || "Could not set PIN. Please try again.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network Error",
        message: "Please check your connection.",
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
        <h2 className="text-2xl font-serif mb-1 text-[#6B554D]">Create Account</h2>
        <p className="text-xs text-stone-500 mb-6 text-center">
          {step === "details" && "Enter your details to get started"}
          {step === "otp" && `Verification code sent to ${form.email}`}
          {step === "pin" && "Set a 4–6 digit numeric PIN for fast sign in"}
        </p>

        {/* STEP 1: Details */}
        {step === "details" && (
          <form className="w-full flex flex-col gap-4" onSubmit={handleSendOtp}>
            <div className="flex flex-col gap-1 w-full">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 outline-none transition-all ${
                  nameError
                    ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20"
                    : "border-[#c9ada7] focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                }`}
                required
              />
              {nameError && <span className="text-xs text-red-600 font-medium">{nameError}</span>}
            </div>

            <div className="flex flex-col gap-1 w-full">
              <input
                type="tel"
                name="mobile"
                placeholder="Mobile Number (10 digits)"
                value={form.mobile}
                maxLength={10}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-3 outline-none transition-all ${
                  mobileError
                    ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20"
                    : "border-[#c9ada7] focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                }`}
                required
              />
              {mobileError && <span className="text-xs text-red-600 font-medium">{mobileError}</span>}
            </div>

            <div className="flex flex-col gap-1 w-full">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 min-h-11 rounded-lg bg-[#6B554D] py-3 text-white transition-colors hover:bg-[#5C4841] disabled:opacity-50 font-medium cursor-pointer"
            >
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <form className="w-full flex flex-col gap-4" onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 text-center tracking-widest text-lg font-bold outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
              required
            />

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="min-h-11 rounded-lg bg-[#6B554D] py-3 text-white transition-colors hover:bg-[#5C4841] disabled:opacity-50 font-medium cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || resendLoading}
                className={`font-semibold transition-colors cursor-pointer ${
                  resendTimer > 0 || resendLoading
                    ? "text-stone-400 cursor-not-allowed no-underline"
                    : "text-[#6B554D] hover:text-[#4A3831] underline"
                }`}
              >
                {resendLoading
                  ? "Sending..."
                  : resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : "Resend Code"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep("details")}
              className="text-xs text-stone-500 hover:text-stone-800 text-center mt-2 underline cursor-pointer"
            >
              ← Back to Details
            </button>
          </form>
        )}

        {/* STEP 3: Create PIN */}
        {step === "pin" && (
          <form className="w-full flex flex-col gap-4" onSubmit={handleCreatePin}>
            <div className="flex flex-col gap-1 w-full">
              <input
                type="password"
                name="pin"
                placeholder="Set 4–6 Digit PIN"
                value={form.pin}
                maxLength={6}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 tracking-widest outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
              />
            </div>

            <div className="flex flex-col gap-1 w-full">
              <input
                type="password"
                name="confirmPin"
                placeholder="Confirm PIN"
                value={form.confirmPin}
                maxLength={6}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 tracking-widest outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
              />
            </div>

            {pinError && <span className="text-xs text-red-600 font-medium">{pinError}</span>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 min-h-11 rounded-lg bg-[#6B554D] py-3 text-white transition-colors hover:bg-[#5C4841] disabled:opacity-50 font-medium cursor-pointer"
            >
              {loading ? "Saving PIN..." : "Complete Registration"}
            </button>
          </form>
        )}

        {/* Footer Link to Sign In */}
        <div className="mt-6 pt-4 border-t border-stone-200/60 w-full text-center text-xs text-stone-600">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-[#6B554D] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
