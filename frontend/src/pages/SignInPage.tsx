import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import signImage from "../assets/admin.png";
import { PopupDialog } from "../components/PopupDialog";
import { API_BASE_URL } from "../services/apiBase";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep((prev) => prev + 1);
  };

  // SEND OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
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
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store user data in sessionStorage
        sessionStorage.setItem("isVerified", "true");
        sessionStorage.setItem("userName", form.name);
        sessionStorage.setItem("userEmail", form.email);
        setPopup({
          open: true,
          title: "Welcome aboard",
          message: `${form.name}, your email was verified successfully.`,
          tone: "success",
          onConfirm: () => navigate("/"),
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
          className="w-full h-full object-cover object-center scale-105 opacity-75 blur-[2px]"
        />
        <div className="absolute inset-0 bg-linear-to-br from-white/20 via-white/10 to-[#f5e9e2]/35" />
      </div>

      {/* Card */}
      <div className="relative z-10 flex w-full max-w-[28rem] flex-col items-center rounded-2xl bg-white/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
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
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3"
                required
              />
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-[#c9ada7] py-3 text-white transition-colors hover:bg-[#b89a94]"
              >
                Next
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <input
                type="tel"
                name="mobile"
                placeholder="Mobile Number"
                value={form.mobile}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3"
                required
              />
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
                className="w-full rounded-lg border border-[#c9ada7] px-4 py-3 text-center tracking-widest"
                required
                maxLength={6}
              />
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-[#c9ada7] py-3 text-white disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
