import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/Auth";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { Award, BookOpen } from "lucide-react";
import {
  FiMail, FiArrowLeft, FiRefreshCw, FiCreditCard,
  FiDollarSign, FiCheckCircle, FiClock, FiAlertTriangle,
} from "react-icons/fi";
import api from "../api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const CURRENCY = "EGP";
const PRICE_PER_MONTH = 1000;

const sanitize = (s) => String(s ?? "").replace(/[<>"'`]/g, "");




const FRIENDLY_ERRORS = {
  "bad credentials":            "The email or password you entered is incorrect.",
  "user not found":             "No account found with this email address.",
  "account is disabled":        "Your account has been disabled. Please contact support.",
  "account is locked":          "Your account is temporarily locked. Try again later.",
  "too many requests":          "Too many login attempts. Please wait a moment and try again.",
  "invalid token":              "Your session has expired. Please log in again.",
  "email not verified":         "Please verify your email address before signing in.",
  "missing access token":       "Authentication failed. Please try again.",
  "network error":              "Unable to connect. Please check your internet connection.",
};




function parseError(raw) {
  const lower = (raw || "").toLowerCase().trim();

  
  
  if (
    lower.includes("subscription is expired") ||
    lower.includes("subscription expired") ||
    lower.includes("subscription has expired") ||
    lower.includes("your subscription")
  ) {
    return { message: "Your subscription has expired. Please renew to access your shop.", isExpired: true };
  }

  for (const [key, friendly] of Object.entries(FRIENDLY_ERRORS)) {
    if (lower.includes(key)) return { message: friendly, isExpired: false };
  }

 
  
  const cleaned = sanitize(raw);
  return {
    message: cleaned
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      : "Something went wrong. Please try again.",
    isExpired: false,
  };
}




const DotsBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none z-0"
    aria-hidden="true"
    style={{
      backgroundImage: `radial-gradient(circle, rgba(101,163,13,0.13) 1.5px, transparent 1.5px)`,
      backgroundSize: "28px 28px",
    }}
  />
);




function CartoonIllustration() {
  return (
    <svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[460px]">
      <ellipse cx="240" cy="260" rx="210" ry="190" fill="#f0fdf4" className="dark:fill-lime-950/30" />
      <rect x="60" y="330" width="360" height="24" rx="12" fill="#bbf7d0" />
      <rect x="100" y="354" width="20" height="60" rx="6" fill="#bbf7d0" />
      <rect x="360" y="354" width="20" height="60" rx="6" fill="#bbf7d0" />
      <rect x="130" y="240" width="220" height="140" rx="14" fill="#16a34a" />
      <rect x="142" y="252" width="196" height="116" rx="8" fill="#f0fdf4" />
      <rect x="158" y="270" width="80" height="8" rx="4" fill="#4ade80" opacity="0.8" />
      <rect x="158" y="286" width="120" height="8" rx="4" fill="#86efac" opacity="0.8" />
      <rect x="172" y="302" width="90" height="8" rx="4" fill="#4ade80" opacity="0.6" />
      <rect x="172" y="318" width="60" height="8" rx="4" fill="#86efac" opacity="0.6" />
      <rect x="158" y="334" width="100" height="8" rx="4" fill="#4ade80" opacity="0.7" />
      <rect x="100" y="378" width="280" height="18" rx="9" fill="#15803d" />
      <rect x="195" y="378" width="90" height="10" rx="5" fill="#16a34a" />
      <rect x="288" y="210" width="96" height="110" rx="20" fill="#22c55e" />
      <rect x="296" y="148" width="80" height="76" rx="20" fill="#4ade80" />
      <circle cx="316" cy="176" r="12" fill="white" />
      <circle cx="356" cy="176" r="12" fill="white" />
      <circle cx="319" cy="178" r="6" fill="#15803d" />
      <circle cx="359" cy="178" r="6" fill="#15803d" />
      <circle cx="321" cy="175" r="2" fill="white" />
      <circle cx="361" cy="175" r="2" fill="white" />
      <path d="M318 198 Q336 210 354 198" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      <line x1="336" y1="148" x2="336" y2="128" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
      <circle cx="336" cy="122" r="8" fill="#a3e635" />
      <rect x="248" y="218" width="44" height="18" rx="9" fill="#22c55e" />
      <rect x="380" y="218" width="44" height="18" rx="9" fill="#22c55e" />
      <rect x="228" y="210" width="32" height="40" rx="6" fill="#a3e635" />
      <rect x="232" y="214" width="24" height="32" rx="4" fill="white" />
      <rect x="235" y="219" width="18" height="3" rx="2" fill="#86efac" />
      <rect x="235" y="226" width="14" height="3" rx="2" fill="#86efac" />
      <rect x="235" y="233" width="16" height="3" rx="2" fill="#86efac" />
      <rect x="302" y="316" width="28" height="44" rx="10" fill="#16a34a" />
      <rect x="342" y="316" width="28" height="44" rx="10" fill="#16a34a" />
      <ellipse cx="316" cy="360" rx="18" ry="10" fill="#15803d" />
      <ellipse cx="356" cy="360" rx="18" ry="10" fill="#15803d" />
    </svg>
  );
}




const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);




const ErrorBanner = ({ message, hint }) => (
  <div
    role="alert"
    className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3.5"
  >
    <FiAlertTriangle className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={15} />
    <div className="min-w-0">
      <p className="text-sm font-semibold text-red-700 dark:text-red-300 leading-snug">{message}</p>
      {hint && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 leading-snug">{hint}</p>}
    </div>
  </div>
);




const ForgotPasswordModal = memo(({ onClose }) => {
  const [step, setStep]         = useState("email");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [newPassword, setNew]   = useState("");
  const [confirmPw, setConfirm] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputsRef = React.useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendCode = useCallback(async () => {
    if (!EMAIL_REGEX.test(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/auth/forgot-password", { email });
      setStep("otp");
      setCountdown(60);
    } catch (err) {
      const raw = err.response?.data?.message || err.message;
      setError(parseError(raw).message);
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleOtpChange = useCallback((i, v) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n); setError("");
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  }, [otp]);

  const handleOtpKeyDown = useCallback((i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus();
  }, [otp]);

  const handleOtpNext = useCallback(() => {
    if (otp.join("").length !== 6) { setError("Please enter all 6 digits of the reset code."); return; }
    setError("");
    setStep("reset");
  }, [otp]);

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await api.get("/api/auth/get-code", { params: { email } });
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      inputsRef.current[0]?.focus();
    } catch (err) {
      const raw = err.response?.data?.message || err.message;
      setError(parseError(raw).message);
    } finally {
      setLoading(false);
    }
  }, [email, countdown]);

  const handleResetPassword = useCallback(async () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`); return;
    }
    if (newPassword !== confirmPw) { setError("Passwords do not match. Please re-enter them."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/api/auth/reset-password", {
        email,
        otp: otp.join(""),
        newPassword,
        confirmPassword: confirmPw,
      });
      setStep("done");
    } catch (err) {
      const raw = err.response?.data?.message || err.message;
      setError(parseError(raw).message);
    } finally {
      setLoading(false);
    }
  }, [email, otp, newPassword, confirmPw]);

  const inCls  = "w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm outline-none focus:ring-4 focus:ring-lime-300/50 focus:border-lime-500 transition-all";
  const otpCls = "w-10 h-11 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-4 focus:ring-lime-300/50 focus:border-lime-500 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
          <div className="flex items-center gap-2">
            {step !== "email" && step !== "done" && (
              <button
                onClick={() => { setError(""); setStep(step === "reset" ? "otp" : "email"); }}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <FiArrowLeft size={14} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {step === "email" && "Forgot Password"}
              {step === "otp"   && "Enter Reset Code"}
              {step === "reset" && "Set New Password"}
              {step === "done"  && "Password Reset!"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-500 text-sm">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5">{error}</p>
          )}

          {step === "email" && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and we'll send you a reset code.</p>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lime-500" size={14} />
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className={`${inCls} pl-10`}
                  onKeyDown={e => e.key === "Enter" && handleSendCode()}
                />
              </div>
              <button onClick={handleSendCode} disabled={loading} className="w-full py-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm transition disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Sending...</> : "Send Reset Code"}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Code sent to <span className="font-semibold text-lime-600 dark:text-lime-400 break-all">{email}</span>
              </p>
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i} ref={el => inputsRef.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0} className={otpCls}
                  />
                ))}
              </div>
              <button
                onClick={handleOtpNext}
                disabled={otp.join("").length !== 6}
                className="w-full py-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                Next
              </button>
              <button
                onClick={handleResend} disabled={countdown > 0 || loading}
                className="w-full text-center text-sm text-lime-600 dark:text-lime-400 font-semibold hover:underline disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a new secure password.</p>
              <div className="space-y-2.5">
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} value={newPassword}
                    onChange={e => { setNew(e.target.value); setError(""); }}
                    placeholder="New password (min 6 chars)" className={`${inCls} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-lime-500">
                    {showPw ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
                <input
                  type={showPw ? "text" : "password"} value={confirmPw}
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Confirm new password" className={inCls}
                />
              </div>
              <button onClick={handleResetPassword} disabled={loading} className="w-full py-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm transition disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Resetting...</> : "Reset Password"}
              </button>
            </>
          )}

          {step === "done" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <FiCheckCircle size={28} className="text-lime-600 dark:text-lime-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Password Reset Successfully!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">You can now sign in with your new password.</p>
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm transition">
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});




const RenewalModal = memo(({ shopId, accessToken, onSuccess }) => {
  const navigate = useNavigate();
  const [view, setView]           = useState("form");
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState("card");
  const [months, setMonths]       = useState(1);
  const [error, setError]         = useState("");
  const totalPrice = months * PRICE_PER_MONTH;

  const renewCard = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post(
        `/api/subscriptions/renew/card/${shopId}`,
        { months, type: "COMMISSION" },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const paymentUrl = res.data?.paymentUrl || res.data?.paymentURL;
      if (paymentUrl) {
        try {
          const parsed = new URL(paymentUrl);
          if (parsed.protocol === "https:") {
            setView("redirect");
            setTimeout(() => { window.location.href = paymentUrl; }, 1500);
          } else {
            setError("The payment URL received is not secure. Please contact support.");
          }
        } catch {
          setError("An invalid payment URL was received. Please try again or contact support.");
        }
      } else {
        Swal.fire({ icon: "success", title: "Payment Confirmed!", toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
        onSuccess();
      }
    } catch (err) {
      const raw = err.response?.data?.message || err.message;
      setError(parseError(raw).message);
    } finally {
      setLoading(false);
    }
  }, [shopId, months, accessToken, onSuccess]);

  const renewCash = useCallback(async () => {
    setLoading(true); setError("");
    try {
      await api.post(
        `/api/subscriptions/cash`,
        { months, type: "COMMISSION" },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setView("pending");
    } catch (err) {
      const raw = err.response?.data?.message || err.message;
      setError(parseError(raw).message);
    } finally {
      setLoading(false);
    }
  }, [months, accessToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        
        
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-red-50 dark:bg-red-900/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <FiClock size={18} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {view === "form"     && "Subscription Expired"}
              {view === "pending"  && "Awaiting Admin Approval"}
              {view === "redirect" && "Redirecting to Payment"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {view === "form"     && "You must renew to access your shop."}
              {view === "pending"  && "Your cash request is under review."}
              {view === "redirect" && "Please wait — do not close this tab."}
            </p>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-5 max-h-[80vh] overflow-y-auto">

          {view === "pending" && (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <FiClock size={30} className="text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">Cash Request Submitted</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                  An admin must confirm your payment before you can access your shop.
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">What happens next?</p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5 list-disc list-inside">
                  <li>An admin will review and confirm your cash payment.</li>
                  <li>You will receive an email notification once confirmed.</li>
                  <li><strong>You cannot access your shop until approved.</strong></li>
                  <li>After confirmation, simply log in again.</li>
                </ul>
              </div>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="w-full py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Back to Login
              </button>
            </div>
          )}

          {view === "redirect" && (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <Spinner />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">Redirecting to Payment Gateway</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                  Please wait — <span className="font-semibold text-blue-600 dark:text-blue-400">do not close this window.</span>
                </p>
              </div>
            </div>
          )}

          {view === "form" && (
            <div className="space-y-5">
              {error && <ErrorBanner message={error} />}

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3.5">
                <p className="text-xs text-red-700 dark:text-red-400 font-medium text-center">
                  ⚠️ Your subscription has expired. Renew now to regain access to your shop.
                </p>
              </div>

              
              

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Duration</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMonths(m => Math.max(1, m - 1))} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition font-bold">−</button>
                    <span className="text-lg font-bold text-gray-900 dark:text-white w-8 text-center">{months}</span>
                    <button onClick={() => setMonths(m => Math.min(12, m + 1))} className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition font-bold">+</button>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">month{months > 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{PRICE_PER_MONTH.toLocaleString()} {CURRENCY} × {months}</span>
                  <span className="text-xl font-extrabold text-lime-600 dark:text-lime-400">{totalPrice.toLocaleString()} {CURRENCY}</span>
                </div>
              </div>

              
              

              <div className="flex gap-2">
                {[
                  { k: "card", l: "Pay by Card", icon: <FiCreditCard size={13} /> },
                  { k: "cash", l: "Pay Cash",    icon: <FiDollarSign size={13} /> },
                ].map(({ k, l, icon }) => (
                  <button key={k} onClick={() => setActiveTab(k)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      activeTab === k
                        ? "bg-lime-500 border-lime-500 text-white"
                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-lime-400"
                    }`}>
                    {icon}{l}
                  </button>
                ))}
              </div>

              {activeTab === "card" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                    You'll be redirected to a secure payment gateway. Your subscription activates automatically after payment.
                  </p>
                </div>
              )}
              {activeTab === "cash" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    After submitting, an admin must confirm your payment. <strong>You cannot access your shop until confirmed.</strong>
                  </p>
                </div>
              )}

              <button
                onClick={activeTab === "card" ? renewCard : renewCash}
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white text-sm font-bold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm ${
                  activeTab === "card" ? "bg-blue-600 hover:bg-blue-700" : "bg-lime-500 hover:bg-lime-600"
                }`}
              >
                {loading
                  ? <><Spinner /> Processing...</>
                  : activeTab === "card"
                    ? <><FiCreditCard size={13} /> Pay Now</>
                    : <><FiDollarSign size={13} /> Submit Cash Request</>
                }
              </button>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                You cannot access your shop until your subscription is active.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});




function checkLatestSubscription(subs) {
  if (!Array.isArray(subs) || subs.length === 0) return { expired: false, shopId: null };
  const sorted = [...subs].sort(
    (a, b) => (b.endDate ? new Date(b.endDate).getTime() : 0) - (a.endDate ? new Date(a.endDate).getTime() : 0)
  );
  const latest  = sorted[0];
  const endDate = latest.endDate ? new Date(latest.endDate) : null;
  return {
    expired: endDate !== null && endDate < new Date(),
    shopId:  latest.shopId || latest.shop?.id || null,
  };
}





const Login = ({ darkMode }) => {
  const [formData, setFormData]         = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]             = useState({ email: "", password: "", general: "" });
  const [touched, setTouched]           = useState({ email: false, password: false });
  const [loading, setLoading]           = useState(false);
  const [showForgot, setShowForgot]     = useState(false);
  const [renewalData, setRenewalData]   = useState(null);

  const navigate        = useNavigate();
  const { setUserData } = useAuthStore();

  useEffect(() => { document.title = "Sign In | Tech-Restore"; }, []);

  const redirectMap = useMemo(() => ({
    ROLE_ADMIN:      "/admin/dashboard",
    ROLE_REPAIRER:   "/shop/dashboard",
    ROLE_SELLER:     "/shop/dashboard",
    ROLE_SHOP_OWNER: "/shop/dashboard",
    ROLE_ASSIGNER:   "/assigner/dashboard",
    ROLE_DELIVERY:   "/delivery/dashboard",
    ROLE_GUEST:      "/",
  }), []);

  const SHOP_ROLES = useMemo(() => new Set(["ROLE_SHOP_OWNER", "ROLE_REPAIRER", "ROLE_SELLER"]), []);

  const validateEmail    = useCallback((v) => !v.trim() ? "Email address is required." : !EMAIL_REGEX.test(v) ? "Please enter a valid email address." : "", []);
  const validatePassword = useCallback((v) => !v ? "Password is required." : v.length < MIN_PASSWORD_LENGTH ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` : "", []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "", general: "" }));
    if (name === "email")    setErrors(p => ({ ...p, email:    validateEmail(value) }));
    if (name === "password") setErrors(p => ({ ...p, password: validatePassword(value) }));
  }, [validateEmail, validatePassword]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    if (name === "email")    setErrors(p => ({ ...p, email:    validateEmail(value) }));
    if (name === "password") setErrors(p => ({ ...p, password: validatePassword(value) }));
  }, [validateEmail, validatePassword]);

  const checkSubscription = useCallback(async (token) => {
    try {
      const { data } = await api.get("/api/subscriptions/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return checkLatestSubscription(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.warn("Subscription check failed:", err?.response?.status, err?.response?.data);
      return { expired: false, shopId: null };
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const ee = validateEmail(formData.email);
    const pe = validatePassword(formData.password);
    if (ee || pe) { setErrors({ email: ee, password: pe, general: "" }); return; }

    setLoading(true);
    setErrors({ email: "", password: "", general: "" });

    let needsRenewal = false;

    try {
      const res = await api.post("/api/auth/login", {
        email:    formData.email.trim(),
        password: formData.password,
      });

      const { access_token: accessToken, role, id: backendId, email: backendEmail } = res.data;
      if (!accessToken) throw new Error("Missing access token");

      let decoded;
      try { decoded = jwtDecode(accessToken); } catch {  }

      const roles      = Array.isArray(role) ? role : role ? [role] : [];
      const finalId    = backendId ?? decoded?.sub ?? null;
      const finalEmail = backendEmail ?? formData.email;

      localStorage.setItem("id", finalId);
      setUserData(accessToken, roles, finalId, finalEmail);

      let redirectPath = "/dashboard";
      for (const r of roles) { if (redirectMap[r]) { redirectPath = redirectMap[r]; break; } }


      

      if (roles.some(r => SHOP_ROLES.has(r))) {
        const { expired, shopId } = await checkSubscription(accessToken);
        if (expired) {
          needsRenewal = true;
          setRenewalData({ shopId, accessToken, redirectPath });
          return;
        }
      }
   
      


      await Swal.fire({
        icon: "success", title: "Welcome back!", toast: true,
        position: "top-end", timer: 2000, showConfirmButton: false, timerProgressBar: true,
      });
      navigate(redirectPath);

    } catch (err) {
      if (needsRenewal) return;

      const rawMessage = err.response?.data?.message || err.message || "";
      const { message: friendlyMessage, isExpired } = parseError(rawMessage);

   
      

      if (isExpired) {
  
        
        const shopId =
          err.response?.data?.shopId ||
          err.response?.data?.shop?.id ||
          null;

      
          
        const accessToken = err.response?.data?.access_token || null;

        needsRenewal = true;
        setRenewalData({ shopId, accessToken, redirectPath: "/shop/dashboard" });
        return;
      }

      setErrors(p => ({ ...p, general: friendlyMessage }));
      Swal.fire({
        icon: "error",
        title: "Sign In Failed",
        text: friendlyMessage,
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  }, [formData, navigate, redirectMap, SHOP_ROLES, setUserData, validateEmail, validatePassword, checkSubscription]);

  const handleRenewalSuccess = useCallback(() => {
    navigate(renewalData?.redirectPath || "/shop/dashboard");
    setRenewalData(null);
  }, [navigate, renewalData]);

  const eErr = touched.email    && errors.email;
  const pErr = touched.password && errors.password;

  const ib  = "w-full px-4 py-3 sm:py-3.5 rounded-xl bg-white dark:bg-gray-900 border-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm sm:text-base outline-none focus:ring-4 focus:ring-lime-300/50 dark:focus:ring-lime-500/30 focus:border-lime-500 dark:focus:border-lime-500";
  const in_ = "border-gray-200 dark:border-gray-700";
  const ie  = "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-300/50";

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <DotsBackground />

     
     
      <nav className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl">
        <div className="h-0.5 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-end gap-3 sm:gap-5">
          <Link to="/signup" className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 transition hidden sm:block">
            Don't have an account?
          </Link>
          <Link to="/signup">
            <button className="bg-lime-500 hover:bg-lime-600 text-white font-bold px-3.5 sm:px-5 py-2 rounded-3xl transition text-xs sm:text-sm shadow-sm">
              Sign Up
            </button>
          </Link>
        </div>
      </nav>

     
     
      <section className="relative z-10 pt-16 sm:pt-20 pb-8 sm:pb-16 px-4 sm:px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center w-full py-4 sm:py-0">

          
          
          <div className="relative flex justify-center order-2 md:order-1">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-none">
              <CartoonIllustration />
              <div className="absolute -top-3 sm:-top-4 -left-2 sm:-left-4 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                <Award className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">98% Success Rate</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">with our platform</p>
                </div>
              </div>
              <div className="absolute -bottom-4 sm:-bottom-6 right-2 sm:right-4 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2.5 sm:p-4 text-center">
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 mx-auto text-lime-500 mb-0.5 sm:mb-1" />
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">10,000+</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">repairs managed</p>
              </div>
            </div>
          </div>

          
          <div className="space-y-5 sm:space-y-7 order-1 md:order-2">
            <div>
              <div className="inline-flex items-center gap-2 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-5">
                Welcome back
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-none tracking-tighter text-gray-900 dark:text-gray-50">
                Sign in to<br /><span className="text-lime-500">your account</span>
              </h1>
              <p className="mt-3 sm:mt-4 text-base sm:text-xl text-gray-500 dark:text-gray-400">Manage your shop, repairs and deliveries.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-7 space-y-4 sm:space-y-5">

             
             
              {errors.general && (
                <ErrorBanner
                  message={errors.general}
                  hint={
                    errors.general.toLowerCase().includes("incorrect") ||
                    errors.general.toLowerCase().includes("not found")
                      ? "Double-check your email and password, or use 'Forgot your password?' below."
                      : undefined
                  }
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
                
                
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Email address</label>
                  <input
                    id="login-email" type="email" name="email" autoComplete="email" required
                    value={formData.email} onChange={handleChange} onBlur={handleBlur}
                    placeholder="you@example.com" disabled={loading}
                    className={`${ib} ${eErr ? ie : in_}`}
                  />
                  {eErr && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                      <FiAlertTriangle size={11} className="flex-shrink-0" />{errors.email}
                    </p>
                  )}
                </div>

              

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                  <div className="relative">
                    <input
                      id="login-password" type={showPassword ? "text" : "password"} name="password"
                      autoComplete="current-password" required value={formData.password}
                      onChange={handleChange} onBlur={handleBlur} placeholder="Enter your password"
                      disabled={loading} className={`${ib} pr-12 ${pErr ? ie : in_}`}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1} className="absolute inset-y-0 right-0 pr-4 flex items-center text-lime-600 dark:text-lime-400">
                      {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                  {pErr && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                      <FiAlertTriangle size={11} className="flex-shrink-0" />{errors.password}
                    </p>
                  )}
                </div>

               
               

                <div className="text-right">
                  <button type="button" onClick={() => setShowForgot(true)} className="text-xs sm:text-sm text-lime-600 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-200 font-medium hover:underline">
                    Forgot your password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="w-full h-11 sm:h-12 rounded-xl font-bold text-sm sm:text-base bg-lime-500 hover:bg-lime-600 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm">
                  {loading ? <><Spinner /> Signing in...</> : "Sign In"}
                </button>
              </form>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              <button
                type="button"
                onClick={() => { window.location.href = "http://localhost:8080/oauth2/authorization/google"; }}
                className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2.5 sm:py-3 px-4 rounded-xl hover:border-lime-400 dark:hover:border-lime-600 transition-all text-xs sm:text-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
                Continue with Google
              </button>

              <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                New here?{" "}
                <Link to="/signup" className="font-semibold text-lime-600 dark:text-lime-400 hover:underline">Create an account</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

    
    
    
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {renewalData && (
        <RenewalModal
          shopId={renewalData.shopId}
          accessToken={renewalData.accessToken}
          onSuccess={handleRenewalSuccess}
        />
      )}
    </div>
  );
};

export default Login;