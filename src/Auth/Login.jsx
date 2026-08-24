import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/Auth";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { Award, Wrench, KeyRound, Sparkles } from "lucide-react";
import {
  FiMail, FiArrowLeft, FiRefreshCw, FiCreditCard,
  FiDollarSign, FiCheckCircle, FiClock, FiAlertTriangle, FiLock
  , FiX, FiShield
} from "react-icons/fi";
import api from "../api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const CURRENCY = "EGP";
const PRICE_PER_MONTH = 1000;

const sanitize = (s) => String(s ?? "").replace(/[<>"'`]/g, "");

const FRIENDLY_ERRORS = {
  "bad credentials": "The email or password you entered is incorrect.",
  "user not found": "No account found with this email address.",
  "account is disabled": "Your account has been disabled. Please contact support.",
  "account is locked": "Your account is temporarily locked. Try again later.",
  "too many requests": "Too many login attempts. Please wait a moment and try again.",
  "invalid token": "Your session has expired. Please log in again.",
  "email not verified": "Please verify your email address before signing in.",
  "missing access token": "Authentication failed. Please try again.",
  "network error": "Unable to connect. Please check your internet connection.",
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

const GlobalAnimations = () => (
  <style>{`
    @keyframes floatY { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
    @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes wrenchTurn { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
    @keyframes sparkPulse { 0%, 100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.15); } }
    @keyframes popIn { from { opacity: 0; transform: translateY(14px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes keyJiggle { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
    @keyframes tilt3d { 0%, 100% { transform: rotateX(10deg) rotateY(-18deg) rotateZ(0deg); } 50% { transform: rotateX(4deg) rotateY(-8deg) rotateZ(1deg); } }
    @keyframes floatZ { 0%, 100% { transform: translateZ(var(--tz, 60px)) translateY(0px); } 50% { transform: translateZ(var(--tz, 60px)) translateY(-10px); } }
    @keyframes ringSpin { from { transform: translateZ(-10px) rotate(0deg); } to { transform: translateZ(-10px) rotate(360deg); } }
    .anim-float { animation: floatY 5s ease-in-out infinite; }
    .anim-spin-slow { animation: spinSlow 9s linear infinite; transform-origin: center; }
    .anim-wrench { animation: wrenchTurn 3.4s ease-in-out infinite; transform-origin: 70% 30%; }
    .anim-spark { animation: sparkPulse 2.2s ease-in-out infinite; }
    .anim-pop-in { animation: popIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-key { animation: keyJiggle 3.2s ease-in-out infinite; transform-origin: 50% 20%; }
    .anim-tilt3d { animation: tilt3d 7s ease-in-out infinite; }
    .anim-float-z { animation: floatZ 4.2s ease-in-out infinite; }
    .anim-ring-spin { animation: ringSpin 12s linear infinite; }
  `}</style>
);

const DotsBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none z-0"
    aria-hidden="true"
    style={{
      backgroundImage: `radial-gradient(circle, rgba(16,185,129,0.13) 1.5px, transparent 1.5px)`,
      backgroundSize: "28px 28px",
    }}
  />
);

function Illustration3D() {
  return (
    <div className="anim-float w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[440px] mx-auto" style={{ perspective: "1600px" }}>
      <div className="anim-tilt3d relative aspect-square" style={{ transformStyle: "preserve-3d" }}>

        <div
          className="absolute inset-[14%] rounded-[999px] border-[10px] border-emerald-200/70 dark:border-emerald-800/40 anim-ring-spin"
          style={{ transformStyle: "preserve-3d" }}
        />

        <div
          className="absolute inset-[10%] rounded-[2.75rem] bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600"
          style={{ transform: "translateZ(-50px)", boxShadow: "0 55px 90px -30px rgba(5,150,105,0.55)" }}
        />

        <div
          className="absolute inset-[16%] rounded-[2.25rem] bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 overflow-hidden"
          style={{ transform: "translateZ(20px)", boxShadow: "0 30px 60px -20px rgba(6,95,70,0.35)" }}
        >
          <div className="h-9 bg-emerald-500 flex items-center gap-1.5 px-4">
            <span className="w-2 h-2 rounded-full bg-white/70" />
            <span className="w-2 h-2 rounded-full bg-white/50" />
            <span className="w-2 h-2 rounded-full bg-white/30" />
          </div>
          <div className="p-5 space-y-3">
            <div className="h-3 w-2/3 rounded-full bg-emerald-100 dark:bg-emerald-900/50" />
            <div className="h-3 w-1/2 rounded-full bg-emerald-100 dark:bg-emerald-900/50" />
            <div className="mt-4 h-16 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <FiCheckCircle size={18} />
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-16 rounded-full bg-emerald-200 dark:bg-emerald-800" />
                <div className="h-2 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900" />
              </div>
            </div>
          </div>
        </div>

        <div
          className="anim-float-z absolute top-[2%] right-[2%] w-[22%] aspect-square"
          style={{ "--tz": "95px", transform: "translateZ(95px)" }}
        >
          <div className="anim-wrench w-full h-full rounded-2xl bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center" style={{ boxShadow: "0 20px 35px -12px rgba(6,95,70,0.4)" }}>
            <Wrench className="w-1/2 h-1/2 text-emerald-500" />
          </div>
        </div>

        <div
          className="anim-float-z absolute bottom-[6%] left-[0%] w-[20%] aspect-square rounded-full"
          style={{ "--tz": "110px", transform: "translateZ(110px)", animationDelay: "0.5s" }}
        >
          <div className="anim-key w-full h-full rounded-full bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center" style={{ boxShadow: "0 20px 35px -12px rgba(6,95,70,0.4)" }}>
            <KeyRound className="w-1/2 h-1/2 text-emerald-500" />
          </div>
        </div>

        <div
          className="anim-float-z absolute bottom-[-4%] right-[10%] w-[16%] aspect-square"
          style={{ "--tz": "75px", transform: "translateZ(75px)", animationDelay: "1s" }}
        >
          <div className="w-full h-full rounded-2xl bg-emerald-500 flex items-center justify-center" style={{ boxShadow: "0 20px 35px -12px rgba(5,150,105,0.5)" }}>
            <Award className="w-1/2 h-1/2 text-white" />
          </div>
        </div>

        <div
          className="anim-spark absolute top-[6%] left-[8%] w-3 h-3 rounded-full bg-emerald-300"
          style={{ transform: "translateZ(130px)" }}
        />
        <div
          className="anim-spark absolute bottom-[18%] right-[4%] w-2 h-2 rounded-full bg-teal-400"
          style={{ transform: "translateZ(140px)", animationDelay: "0.7s" }}
        />
      </div>
    </div>
  );
}

const SubscriptionRenewIllustration = memo(() => (
  <svg viewBox="0 0 160 116" className="w-36 h-24 mx-auto">
    <ellipse cx="80" cy="102" rx="58" ry="7" fill="#ecfdf5" className="dark:fill-emerald-950/20" />
    <rect x="34" y="22" width="82" height="68" rx="13" fill="#ffffff" stroke="#a7f3d0" strokeWidth="3" className="dark:fill-gray-900 dark:stroke-emerald-800" />
    <path d="M34 34 a13 13 0 0 1 13 -13 h56 a13 13 0 0 1 13 13 v6 H34 Z" fill="#a7f3d0" className="dark:fill-emerald-800" />
    <circle cx="54" cy="18" r="4" fill="#059669" />
    <circle cx="96" cy="18" r="4" fill="#059669" />
    <rect x="46" y="52" width="13" height="13" rx="3" fill="#d1fae5" className="dark:fill-emerald-900/40" />
    <rect x="65" y="52" width="13" height="13" rx="3" fill="#d1fae5" className="dark:fill-emerald-900/40" />
    <rect x="84" y="52" width="13" height="13" rx="3" fill="#34d399" />
    <rect x="46" y="69" width="13" height="13" rx="3" fill="#d1fae5" className="dark:fill-emerald-900/40" />
    <rect x="65" y="69" width="13" height="13" rx="3" fill="#34d399" />
    <g className="anim-spin-slow" style={{ transformOrigin: "122px 68px" }}>
      <circle cx="122" cy="68" r="20" fill="#ecfdf5" stroke="#34d399" strokeWidth="3" className="dark:fill-gray-900" />
      <path d="M114 61 a10 10 0 1 1 -2 11.5" fill="none" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M112 57 l2 6.5 l-6.5 -1 z" fill="#059669" />
    </g>
  </svg>
));

const PendingApprovalIllustration = memo(() => (
  <svg viewBox="0 0 160 116" className="w-36 h-24 mx-auto">
    <ellipse cx="80" cy="102" rx="56" ry="7" fill="#fffbeb" className="dark:fill-amber-950/10" />
    <rect x="40" y="30" width="72" height="52" rx="11" fill="#ffffff" stroke="#fde68a" strokeWidth="3" className="dark:fill-gray-900 dark:stroke-amber-800" />
    <path d="M40 35 L76 60 L112 35" fill="none" stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <g className="anim-float" style={{ animationDuration: "3.6s" }}>
      <circle cx="116" cy="42" r="21" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" className="dark:fill-amber-950/30" />
      <path d="M116 31 V42 L124 48" fill="none" stroke="#d97706" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <circle cx="26" cy="30" r="4" fill="#fde68a" className="anim-spark" />
    <circle cx="20" cy="70" r="3" fill="#fcd34d" className="anim-spark" style={{ animationDelay: "0.8s" }} />
  </svg>
));

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ErrorBanner = ({ message, hint }) => (
  <div
    role="alert"
    className="anim-pop-in flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3.5"
  >
    <FiAlertTriangle className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={15} />
    <div className="min-w-0">
      <p className="text-sm font-semibold text-red-700 dark:text-red-300 leading-snug">{message}</p>
      {hint && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 leading-snug">{hint}</p>}
    </div>
  </div>
);

const ForgotPasswordModal = memo(({ onClose }) => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNew] = useState("");
  const [confirmPw, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const inCls = "w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm outline-none focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-500 transition-all";
  const otpCls = "w-10 h-11 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-500 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="anim-pop-in w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
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
              {step === "otp" && "Enter Reset Code"}
              {step === "reset" && "Set New Password"}
              {step === "done" && "Password Reset!"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-500 text-sm">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <p className="anim-pop-in text-xs text-red-600 dark:text-red-400 text-center font-medium bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5">{error}</p>
          )}

          {step === "email" && (
            <div className="anim-fade-up space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email and we'll send you a reset code.</p>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className={`${inCls} pl-10`}
                  onKeyDown={e => e.key === "Enter" && handleSendCode()}
                />
              </div>
              <button onClick={handleSendCode} disabled={loading} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Sending...</> : "Send Reset Code"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="anim-fade-up space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Code sent to <span className="font-semibold text-emerald-600 dark:text-emerald-400 break-all">{email}</span>
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
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                Next
              </button>
              <button
                onClick={handleResend} disabled={countdown > 0 || loading}
                className="w-full text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </button>
            </div>
          )}

          {step === "reset" && (
            <div className="anim-fade-up space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a new secure password.</p>
              <div className="space-y-2.5">
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} value={newPassword}
                    onChange={e => { setNew(e.target.value); setError(""); }}
                    placeholder="New password (min 6 chars)" className={`${inCls} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-500">
                    {showPw ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
                <input
                  type={showPw ? "text" : "password"} value={confirmPw}
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Confirm new password" className={inCls}
                />
              </div>
              <button onClick={handleResetPassword} disabled={loading} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Resetting...</> : "Reset Password"}
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="anim-pop-in text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <FiCheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Password Reset Successfully!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">You can now sign in with your new password.</p>
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition">
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const RenewalModal = memo(({ shopEmail, accessToken, onSuccess, isPending, onClose }) => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [view, setView] = useState(isPending ? "pending" : "form");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("card");
  const [months, setMonths] = useState(1);
  const [error, setError] = useState("");
  const totalPrice = months * PRICE_PER_MONTH;

  const handleLogout = useCallback(() => {
    clearAuth();
    onClose();
    navigate("/login");
  }, [clearAuth, onClose, navigate]);

  const renewCard = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post(
        `/api/subscriptions/renew/card/${shopEmail}`,
        { months, type: "COMMISSION" },
      );
      if (res.data.paymentURL) {
        setView("redirect");
        window.location.href = res.data.paymentURL;
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Card renewal failed. Please try again.");
    } finally { setLoading(false); }
  }, [shopEmail, months, accessToken, onSuccess]);

  const renewCash = useCallback(async () => {
    setLoading(true); setError("");
    try {
      await api.post(
        `/api/subscriptions/renew/cash/${shopEmail}`,
        { months, type: "COMMISSION" },
      );
      setView("pending");
    } catch (err) {
      setError(err.response?.data?.message || "Cash renewal failed. Please try again.");
    } finally { setLoading(false); }
  }, [shopEmail, months, accessToken]);

  return (
    <div className="fixed  inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute  inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={handleLogout} />

      <div className="anim-pop-in relative w-full max-w-md mt-5 h-auto bg-white dark:bg-gray-950 rounded-md shadow-2xl overflow-hidden">

        <div className={`px-6 py-6 border-b flex items-center justify-between ${view === 'pending'
          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-900/30'
          : 'bg-gray-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/30'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-gray-900   ${view === 'pending' ? 'border-amber-100 dark:border-amber-900/40' : 'border-emerald-100 dark:border-emerald-900/40'
              }`}>
              {view === 'pending' ? (
                <FiClock size={22} className="text-amber-500 animate-pulse" />
              ) : (
                <FiRefreshCw size={22} className="text-emerald-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                {view === "form" && "Renewal Needed"}
                {view === "pending" && "Pending Approval"}
                {view === "redirect" && "Connecting..."}
              </h3>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${view === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {view === "form" && "Action Required"}
                {view === "pending" && "Request Sent"}
                {view === "redirect" && "Secure Link"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`p-2 rounded-full bg-white dark:bg-gray-900 shadow-sm border transition-colors ${view === 'pending' ? 'border-amber-100 dark:border-amber-900/40 text-amber-500 hover:text-amber-600' : 'border-emerald-100 dark:border-emerald-900/40 text-emerald-500 hover:text-emerald-600'}`}
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {view === "pending" && (
            <div className="anim-fade-up text-center space-y-6">
              <PendingApprovalIllustration />
              <div className="space-y-2">
                <h4 className="text-xl font-black text-gray-900 dark:text-white">Request Received</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  Your cash renewal is being verified. This usually takes a few hours.
                </p>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-500/5 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/30 text-left">
                <h5 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <FiClock className="text-amber-500" /> Next Steps
                </h5>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                  <li>• We'll notify you via email when activated.</li>
                  <li>• Keep your receipt for support if needed.</li>
                </ul>
              </div>

              <button
                onClick={handleLogout}
                className="w-full h-12 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg"
              >
                Back to Login
              </button>
            </div>
          )}

          {view === "form" && (
            <div className="anim-fade-up space-y-6">
              <SubscriptionRenewIllustration />

              {error && <ErrorBanner message={error} />}

              <div className="bg-gray-100 dark:bg-gray-500/5 rounded-md p-6  dark:border-gray-900/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Subscription Fee
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                    <FiShield size={12} /> SECURE
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                      {totalPrice.toLocaleString()} <span className="text-sm font-medium text-gray-400">{CURRENCY}</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm ">
                    <button
                      onClick={() => setMonths(m => Math.max(1, m - 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-white/5 transition text-lg font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      −
                    </button>
                    <div className="px-2 text-center">
                      <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{months}</p>
                      <p className="text-[8px] uppercase font-bold text-gray-400 mt-0.5">Mo</p>
                    </div>
                    <button
                      onClick={() => setMonths(m => Math.min(12, m + 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-white/5 transition text-lg font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: "card", l: "Credit Card", icon: <FiCreditCard size={18} /> },
                  { k: "cash", l: "Cash", icon: <FiDollarSign size={18} /> },
                ].map(({ k, l, icon }) => (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-md border-2 transition-all duration-300 ${activeTab === k
                      ? "border-green-400 bg-green-400 dark:bg-green-500/10"
                      : "border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900/50 hover:border-emerald-200"
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === k ? "text-white" : "bg-gray-100 dark:bg-white/5 text-gray-400"
                      }`}>
                      {icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === k ? "text-white dark:text-emerald-400" : "text-gray-500"}`}>
                      {l}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={activeTab === "card" ? renewCard : renewCash}
                disabled={loading}
                className="w-full h-12 rounded-md border-2 border-emerald-500 text-emerald-600 bg-transparent hover:bg-emerald-500 hover:text-white text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : activeTab === "card" ? "Pay with card" : "Send Cash Request"}
              </button>
            </div>
          )}

          {view === "redirect" && (
            <div className="anim-fade-up text-center space-y-6">
              <SubscriptionRenewIllustration />
              <div className="space-y-2">
                <h4 className="text-xl font-black text-gray-900 dark:text-white">Redirecting to Payment</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  Hold on while we connect you to a secure payment page.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <Spinner /> <span className="text-xs font-bold uppercase tracking-widest">Please wait</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function checkLatestSubscription(subs) {
  if (!Array.isArray(subs) || subs.length === 0) {
    return { expired: true, shopId: null, isPending: false, noSubs: true };
  }

  const now = new Date();

  const activeSub = subs.find(s => {
    const rawEnd = s.endDate || s.end_date || s.expiryDate;
    const end = rawEnd ? new Date(rawEnd) : null;

    const isNotExpired = end && end.getTime() > (now.getTime() - 86400000);

    const sStatus = (s.status || '').toUpperCase();
    const pStatus = (s.paymentStatus || s.payment_status || '').toUpperCase();

    const isPaid = ['PAID', 'ACTIVE', 'SETTLED', 'COMPLETED', 'SUCCESS', 'APPROVED', 'CONFIRMED', 'SUCCESSFUL'].some(
      term => sStatus === term || pStatus === term
    );

    return isNotExpired && isPaid;
  });

  if (activeSub) {
    return {
      expired: false,
      shopId: activeSub.shopId || activeSub.shop?.id || null,
      isPending: false,
    };
  }

  const pendingSub = subs.find(s => {
    const sStatus = (s.status || '').toUpperCase();
    const pStatus = (s.paymentStatus || s.payment_status || '').toUpperCase();
    const pMethod = (s.paymentMethod || s.payment_method || s.payment?.method || '').toUpperCase();

    return (sStatus === 'PENDING' || pStatus === 'PENDING') && pMethod === 'CASH';
  });

  const sorted = [...subs].sort(
    (a, b) => {
      const dateA = new Date(a.endDate || a.end_date || 0).getTime();
      const dateB = new Date(b.endDate || b.end_date || 0).getTime();
      return dateB - dateA;
    }
  );
  const latest = sorted[0];

  return {
    expired: !pendingSub,
    shopId: latest.shopId || latest.shop?.id || null,
    isPending: !!pendingSub,
  };
}

const Login = ({ darkMode }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [renewalData, setRenewalData] = useState(null);

  const navigate = useNavigate();
  const { setUserData } = useAuthStore();

  useEffect(() => { document.title = "Sign In | Tech-Restore"; }, []);

  const redirectMap = useMemo(() => ({
    ROLE_ADMIN: "/admin/dashboard",
    ROLE_REPAIRER: "/shop/dashboard",
    ROLE_SELLER: "/shop/dashboard",
    ROLE_SHOP_OWNER: "/shop/dashboard",
    ROLE_ASSIGNER: "/assigner/dashboard",
    ROLE_DELIVERY: "/delivery/dashboard",
    ROLE_GUEST: "/",
  }), []);

  const SHOP_ROLES = useMemo(() => new Set(["ROLE_SHOP_OWNER", "ROLE_REPAIRER", "ROLE_SELLER"]), []);

  const validateEmail = useCallback((v) => !v.trim() ? "Email address is required." : !EMAIL_REGEX.test(v) ? "Please enter a valid email address." : "", []);
  const validatePassword = useCallback((v) => !v ? "Password is required." : v.length < MIN_PASSWORD_LENGTH ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` : "", []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "", general: "" }));
    if (name === "email") setErrors(p => ({ ...p, email: validateEmail(value) }));
    if (name === "password") setErrors(p => ({ ...p, password: validatePassword(value) }));
  }, [validateEmail, validatePassword]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    if (name === "email") setErrors(p => ({ ...p, email: validateEmail(value) }));
    if (name === "password") setErrors(p => ({ ...p, password: validatePassword(value) }));
  }, [validateEmail, validatePassword]);

  const checkSubscription = useCallback(async (email) => {
    try {
      const { data } = await api.get(`/api/subscriptions/renew/status/${email}`);
      return checkLatestSubscription(data ? [data] : []);
    } catch (err) {
      console.warn("Subscription check failed:", err?.response?.status, err?.response?.data);
      return { expired: true, shopId: null };
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
        email: formData.email.trim(),
        password: formData.password,
      });

      const { access_token: accessToken, role, id: backendId, email: backendEmail, shopId: loginShopId } = res.data;
      if (!accessToken) throw new Error("Missing access token");

      let decoded;
      try { decoded = jwtDecode(accessToken); } catch { }

      const roles = Array.isArray(role) ? role : role ? [role] : [];
      const finalId = backendId ?? decoded?.sub ?? null;
      const finalEmail = backendEmail ?? formData.email;

      localStorage.setItem("id", finalId);
      setUserData(accessToken, roles, finalId, finalEmail);

      let redirectPath = "/dashboard";
      for (const r of roles) { if (redirectMap[r]) { redirectPath = redirectMap[r]; break; } }

      if (roles.some(r => SHOP_ROLES.has(r))) {
        const { expired, shopId: subShopId, isPending } = await checkSubscription(finalEmail);
        const finalShopId = subShopId || loginShopId || res.data.shop?.id;
        if (expired || isPending) {
          needsRenewal = true;
          setRenewalData({ shopId: finalShopId, shopEmail: finalEmail, accessToken, redirectPath, isPending });
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
          err.response?.data?.id ||
          null;

        const accessToken = err.response?.data?.access_token || null;

        let isPending = false;
        const checkEmail = formData.email?.trim();
        if (checkEmail) {
          const subCheck = await checkSubscription(checkEmail);
          isPending = subCheck.isPending;
        }

        needsRenewal = true;
        setRenewalData({ shopId, shopEmail: formData.email.trim(), accessToken, redirectPath: "/shop/dashboard", isPending });
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

  const eErr = touched.email && errors.email;
  const pErr = touched.password && errors.password;

  const ib = "w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm sm:text-base outline-none focus:ring-4 focus:ring-emerald-300/50 dark:focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900";
  const in_ = "border-gray-200 dark:border-gray-700";
  const ie = "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-300/50";

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <GlobalAnimations />
      <DotsBackground />

      <nav className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-end gap-3 sm:gap-5">
          <Link to="/signup" className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition hidden sm:block">
            Don't have an account?
          </Link>
          <Link to="/signup">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 sm:px-5 py-2 rounded-3xl transition text-xs sm:text-sm shadow-sm">
              Sign Up
            </button>
          </Link>
        </div>
      </nav>

      <section className="relative z-10 pt-16 sm:pt-20 pb-8 sm:pb-16 px-4 sm:px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center w-full py-4 sm:py-0">

          <div className="relative flex justify-center order-2 md:order-1">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-none">
              <Illustration3D />
              <div className="anim-fade-up absolute -top-3 sm:-top-4 -left-2 sm:-left-4 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ animationDelay: "0.15s" }}>
                <Award className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">98% Success Rate</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">with our platform</p>
                </div>
              </div>
              <div className="anim-fade-up absolute -bottom-4 sm:-bottom-6 right-2 sm:right-4 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2.5 sm:p-4 text-center" style={{ animationDelay: "0.3s" }}>
                <Wrench className="w-5 h-5 sm:w-7 sm:h-7 mx-auto text-emerald-500 mb-0.5 sm:mb-1" />
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">10,000+</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">repairs managed</p>
              </div>
              <div className="anim-fade-up absolute top-1/2 -right-3 sm:-right-6 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 sm:p-3 items-center gap-2 hidden sm:flex" style={{ animationDelay: "0.45s" }}>
                <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
                <p className="font-semibold text-[10px] sm:text-xs text-gray-900 dark:text-gray-100">Secure sign-in</p>
              </div>
            </div>
          </div>

          <div className="anim-fade-up space-y-5 sm:space-y-7 order-1 md:order-2">
            <div>
              <h1 className="text-4xl mt-4 sm:text-5xl md:text-6xl font-bold leading-none tracking-tighter text-gray-900 dark:text-gray-50">
                Sign in to<br /><span className="text-emerald-500">your account</span>
              </h1>
              <p className="mt-3 sm:mt-4 text-base sm:text-xl text-gray-500 dark:text-gray-400">Manage your shop, repairs and deliveries.</p>
            </div>

            <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-900/5 dark:shadow-black/40 p-5 sm:p-8 space-y-5 sm:space-y-6 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Welcome back</p>
              </div>

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
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                    <input
                      id="login-email" type="email" name="email" autoComplete="email" required
                      value={formData.email} onChange={handleChange} onBlur={handleBlur}
                      placeholder="you@example.com" disabled={loading}
                      className={`${ib} ${eErr ? ie : in_}`}
                    />
                  </div>
                  {eErr && (
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                      <FiAlertTriangle size={11} className="flex-shrink-0" />{errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                    <input
                      id="login-password" type={showPassword ? "text" : "password"} name="password"
                      autoComplete="current-password" required value={formData.password}
                      onChange={handleChange} onBlur={handleBlur} placeholder="Enter your password"
                      disabled={loading} className={`${ib} pr-12 ${pErr ? ie : in_}`}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1} className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-600 dark:text-emerald-400">
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
                  <button type="button" onClick={() => setShowForgot(true)} className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium hover:underline">
                    Forgot your password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="w-full h-11 sm:h-12 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]">
                  {loading ? <><Spinner /> Signing in...</> : "Log In"}
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
                className="w-full flex items-center justify-center gap-2.5 sm:gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2.5 sm:py-3 px-4 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-all text-xs sm:text-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
                Continue with Google
              </button>

              <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                New here?{" "}
                <Link to="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Create an account</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {renewalData && (
        <RenewalModal
          shopEmail={renewalData.shopEmail}
          accessToken={renewalData.accessToken}
          isPending={renewalData.isPending}
          onSuccess={handleRenewalSuccess}
          onClose={() => setRenewalData(null)}
        />
      )}
    </div>
  );
};

export default memo(Login);