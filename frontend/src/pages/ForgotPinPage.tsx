import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import signImage from "../assets/admin.png";
import { PopupDialog } from "../components/PopupDialog";
import { API_BASE_URL } from "../services/apiBase";

const ForgotPinPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "pin">("email");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

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

  // Resend timer countdown
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

  // STEP 1: Send OTP to registered Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
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
      const res = await fetch(`${API_BASE_URL}/auth/send-forgot-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setStep("otp");
        setResendTimer(30);
        setPopup({
          open: true,
          title: "OTP Sent",
          message: `A 6-digit verification code has been sent to ${email}.`,
          tone: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "Request Failed",
          message: data.message || "Could not send OTP. Please check your email.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network Error",
        message: "Could not reach authentication server.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-forgot-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        setResendTimer(30);
        setPopup({
          open: true,
          title: "OTP Resent",
          message: `A new code has been sent to ${email}.`,
          tone: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "Resend Failed",
          message: data.message || "Failed to resend OTP.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network Error",
        message: "Could not resend OTP.",
        tone: "error",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.trim().length < 4) {
      setPopup({
        open: true,
        title: "OTP Required",
        message: "Please enter the 6-digit OTP code.",
        tone: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        setStep("pin");
        setPopup({
          open: true,
          title: "Email Verified",
          message: "OTP verified successfully. Now set your new PIN.",
          tone: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "Verification Failed",
          message: data.message || "Invalid or expired OTP. Please try again.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network Error",
        message: "Could not verify OTP.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset PIN
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      setPinError("PIN must be a 4–6 digit numeric code.");
      return;
    }

    if (pin !== confirmPin) {
      setPinError("PINs do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          pin,
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userObj = data.user || {};
        sessionStorage.setItem("isVerified", "true");
        sessionStorage.setItem("userName", userObj.name || userObj.email || "User");
        sessionStorage.setItem("userEmail", userObj.email || "");
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
          title: "PIN Reset Successful!",
          message: "Your new PIN has been set. You are now logged in.",
          tone: "success",
          onConfirm: () => navigate(finalPath),
        });
      } else {
        setPopup({
          open: true,
          title: "PIN Reset Failed",
          message: data.message || "Could not set new PIN. Please try again.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network Error",
        message: "Failed to reset PIN.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 font-sans text-stone-800 sm:px-6 py-12">
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
      <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-2xl bg-white/85 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <h2 className="text-2xl font-serif mb-1 text-[#6B554D]">Forgot PIN</h2>
        <p className="text-xs text-stone-500 mb-6 text-center">
          {step === "email" && "Enter your registered Email to receive an OTP code"}
          {step === "otp" && `Enter the 6-digit OTP code sent to ${email}`}
          {step === "pin" && "Create your new 4–6 digit security PIN"}
        </p>

        {/* STEP 1: Email Form */}
        {step === "email" && (
          <form className="w-full flex flex-col gap-4" onSubmit={handleSendOtp}>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-medium text-stone-600">Registered Email Address</label>
              <input
                type="email"
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 min-h-11 rounded-lg bg-[#6B554D] py-3 text-white transition-colors hover:bg-[#5C4841] disabled:opacity-50 font-medium cursor-pointer"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === "otp" && (
          <form className="w-full flex flex-col gap-4" onSubmit={handleVerifyOtp}>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-medium text-stone-600">6-Digit OTP Code</label>
              <input
                type="text"
                placeholder="Enter OTP (e.g. 123456)"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center text-lg font-mono tracking-widest rounded-lg border border-[#c9ada7] px-4 py-3 outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-stone-500 hover:text-stone-700 underline"
              >
                ← Change Email
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || resendLoading}
                className="text-[#6B554D] font-medium hover:underline disabled:opacity-40 cursor-pointer"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 min-h-11 rounded-lg bg-[#6B554D] py-3 text-white transition-colors hover:bg-[#5C4841] disabled:opacity-50 font-medium cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* STEP 3: Create New PIN Form */}
        {step === "pin" && (
          <form className="w-full flex flex-col gap-4" onSubmit={handleResetPin}>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-medium text-stone-600">New 4–6 Digit PIN</label>
              <input
                type="password"
                placeholder="Enter new PIN"
                value={pin}
                maxLength={6}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(null);
                }}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 tracking-widest outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
              />
            </div>

            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-medium text-stone-600">Confirm New PIN</label>
              <input
                type="password"
                placeholder="Re-enter new PIN"
                value={confirmPin}
                maxLength={6}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  setPinError(null);
                }}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 tracking-widest outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
              />
            </div>

            {pinError && (
              <p className="text-xs text-red-500 font-medium">{pinError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 min-h-11 rounded-lg bg-[#6B554D] py-3 text-white transition-colors hover:bg-[#5C4841] disabled:opacity-50 font-medium cursor-pointer"
            >
              {loading ? "Saving New PIN..." : "Reset PIN & Sign In"}
            </button>
          </form>
        )}

        {/* Footer Link back to Sign In */}
        <div className="mt-6 pt-4 border-t border-stone-200/60 w-full text-center text-xs text-stone-600">
          Remembered your PIN?{" "}
          <Link to="/signin" className="font-semibold text-[#6B554D] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPinPage;
