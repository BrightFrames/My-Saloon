import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import signImage from "../assets/admin.png";
import { PopupDialog } from "../components/PopupDialog";
import { API_BASE_URL } from "../services/apiBase";
import { validateFullName, validatePhoneNumber } from "../utils/validation";

const SignInPage: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [mobileTouched, setMobileTouched] = useState(false);

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

  // Countdown timer for Resend OTP button
  useEffect(() => {
    let interval: any = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, name: value }));
    if (nameTouched || value.length > 0) {
      setNameError(validateFullName(value));
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, mobile: value }));
    if (mobileTouched || value.length > 0) {
      setMobileError(validatePhoneNumber(value));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setNameTouched(true);
      const err = validateFullName(form.name);
      setNameError(err);
      if (err) return;
      setStep(2);
    } else if (step === 2) {
      setMobileTouched(true);
      const err = validatePhoneNumber(form.mobile);
      setMobileError(err);
      if (err) return;
      setStep(3);
    }
  };

  // SEND OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateFullName(form.name);
    const mobileErr = validatePhoneNumber(form.mobile);
    if (nameErr || mobileErr) {
      setNameError(nameErr);
      setMobileError(mobileErr);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          mobile: form.mobile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setResendTimer(30);
        setPopup({
          open: true,
          title: "OTP sent successfully",
          message: `We sent a verification code to ${form.email}.`,
          tone: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "Failed to send OTP",
          message: data.message || "Please try again later.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network error",
        message: "Please check your connection and try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          message: `A new verification code has been sent to ${form.email}.`,
          tone: "success",
        });
      } else {
        setPopup({
          open: true,
          title: "Failed to resend OTP",
          message: data.message || "Please try again later.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network error",
        message: "Please check your connection and try again.",
        tone: "error",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          otp,
          name: form.name,
          mobile: form.mobile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store user data in sessionStorage
        sessionStorage.setItem("isVerified", "true");
        sessionStorage.setItem("userName", form.name);
        sessionStorage.setItem("userEmail", form.email);
        if (data?.user?.user?.email) {
          sessionStorage.setItem("userEmail", data.user.user.email);
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
          title: "Welcome aboard",
          message: `${form.name}, your email was verified successfully.`,
          tone: "success",
          onConfirm: () => navigate(finalPath),
        });
      } else {
        setPopup({
          open: true,
          title: "Invalid OTP",
          message:
            data.message ||
            "The code you entered is incorrect. Please try again.",
          tone: "error",
        });
      }
    } catch (err) {
      setPopup({
        open: true,
        title: "Network error",
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
        <h2 className="text-2xl font-serif mb-6 text-[#6B554D]">Sign In</h2>

        <form
          className="w-full flex flex-col gap-5"
          onSubmit={
            step === 3
              ? otpSent
                ? handleVerifyOtp
                : handleSendOtp
              : handleNext
          }
        >
          {/* STEP 1: Full Name */}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-1 w-full">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleNameChange}
                  onBlur={() => {
                    setNameTouched(true);
                    setNameError(validateFullName(form.name));
                  }}
                  className={`w-full rounded-lg border px-4 py-3 outline-none transition-all ${
                    nameError
                      ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20"
                      : "border-[#c9ada7] focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                  }`}
                  required
                />
                {nameError && (
                  <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 shrink-0 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span>{nameError}</span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-[#c9ada7] py-3 text-white transition-colors hover:bg-[#b89a94]"
              >
                Next
              </button>
            </>
          )}

          {/* STEP 2: Mobile Number */}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-1 w-full">
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number (10 digits)"
                  value={form.mobile}
                  maxLength={10}
                  onChange={handleMobileChange}
                  onBlur={() => {
                    setMobileTouched(true);
                    setMobileError(validatePhoneNumber(form.mobile));
                  }}
                  className={`w-full rounded-lg border px-4 py-3 outline-none transition-all ${
                    mobileError
                      ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20"
                      : "border-[#c9ada7] focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                  }`}
                  required
                />
                {mobileError && (
                  <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 shrink-0 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span>{mobileError}</span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-[#c9ada7] py-3 text-white transition-colors hover:bg-[#b89a94]"
              >
                Next
              </button>
            </>
          )}

          {/* STEP 3 SEND OTP */}
          {step === 3 && !otpSent && (
            <>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3"
                required
              />
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-[#c9ada7] py-3 text-white disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {/* VERIFY OTP */}
          {step === 3 && otpSent && (
            <>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 text-center tracking-widest outline-none focus:border-[#6B554D] focus:ring-1 focus:ring-[#6B554D]"
                required
                maxLength={6}
              />
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-[#c9ada7] py-3 text-white transition-colors hover:bg-[#b89a94] disabled:opacity-50 font-medium"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              {/* Resend OTP Section */}
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
                    : "Resend OTP"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
