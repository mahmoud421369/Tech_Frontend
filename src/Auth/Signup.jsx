import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api";
import { Users, Wrench } from "lucide-react";
import {
  RiUserLine, RiLockPasswordLine, RiMailLine, RiPhoneLine,
  RiHome4Line, RiMapPinLine, RiStore2Line,
  RiFileListLine, RiTruckLine, RiUserSettingsLine,
  RiEyeLine, RiEyeOffLine, RiArrowDownSLine, RiShieldCheckLine,
} from "react-icons/ri";
import { FiArrowLeft, FiCheck } from "react-icons/fi";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,15}$/;
const MIN_PASSWORD_LENGTH = 6;

const SHOP_TYPE_OPTIONS = [
  { value: "REPAIRER", label: "Repairer" },
  { value: "SELLER", label: "Seller" },
  { value: "BOTH", label: "Both" },
];

const TAB_CONFIG = [
  { key: "user", label: "User", icon: <RiUserLine size={16} /> },
  { key: "shop", label: "Shop Owner", icon: <RiStore2Line size={16} /> },
  { key: "delivery", label: "Delivery", icon: <RiTruckLine size={16} /> },
  { key: "assigner", label: "Assigner", icon: <RiUserSettingsLine size={16} /> },
];

const INPUT_BASE = "w-full px-3 sm:px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm outline-none focus:ring-4 focus:ring-emerald-300/50 dark:focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-500";
const INPUT_NORMAL = "border-gray-200 dark:border-gray-700";
const INPUT_ERR = "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-300/50";
const OTP_INPUT = "w-10 h-11 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-500 transition-all";

const toast = (icon, title, text) =>
  Swal.fire({ icon, title, text, toast: true, position: "top-end", timer: 2500, showConfirmButton: false, timerProgressBar: true });

const validateEmail = (v) => !v.trim() ? "Email is required" : !EMAIL_REGEX.test(v) ? "Valid email required" : "";
const validatePhone = (v) => { if (!v.trim()) return "Phone is required"; const c = v.replace(/\D/g, ""); return PHONE_REGEX.test(c) ? "" : "Valid phone required (10-15 digits)"; };
const validatePassword = (v) => !v ? "Password is required" : v.length < MIN_PASSWORD_LENGTH ? `Min ${MIN_PASSWORD_LENGTH} characters` : "";

const GlobalAnimations = () => (
  <style>{`
    @keyframes floatY { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
    @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes wrenchTurn { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
    @keyframes sparkPulse { 0%, 100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.15); } }
    @keyframes popIn { from { opacity: 0; transform: translateY(14px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes badgePop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
    .anim-float { animation: floatY 5s ease-in-out infinite; }
    .anim-spin-slow { animation: spinSlow 9s linear infinite; transform-origin: center; }
    .anim-wrench { animation: wrenchTurn 3.4s ease-in-out infinite; transform-origin: 70% 30%; }
    .anim-spark { animation: sparkPulse 2.2s ease-in-out infinite; }
    .anim-pop-in { animation: popIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .anim-badge { animation: badgePop 2.6s ease-in-out infinite; transform-origin: center; }
  `}</style>
);

const DotsBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true"
    style={{ backgroundImage: `radial-gradient(circle, rgba(16,185,129,0.13) 1.5px, transparent 1.5px)`, backgroundSize: "28px 28px" }} />
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CartoonIllustration = memo(() => (
  <svg viewBox="0 0 480 520" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[420px] anim-float">
    <ellipse cx="240" cy="290" rx="205" ry="200" fill="#ecfdf5" className="dark:fill-emerald-950/30" />

    <circle cx="390" cy="140" r="14" fill="#a7f3d0" className="anim-spark" />
    <circle cx="80" cy="180" r="9" fill="#6ee7b7" className="anim-spark" style={{ animationDelay: "0.5s" }} />
    <circle cx="110" cy="420" r="8" fill="#34d399" className="anim-spark" style={{ animationDelay: "1s" }} />

    <rect x="104" y="332" width="272" height="22" rx="11" fill="#047857" />
    <rect x="122" y="354" width="20" height="42" rx="5" fill="#a7f3d0" />
    <rect x="338" y="354" width="20" height="42" rx="5" fill="#a7f3d0" />

    <rect x="140" y="228" width="132" height="88" rx="12" fill="#10b981" />
    <rect x="152" y="240" width="108" height="60" rx="6" fill="#ecfdf5" className="dark:fill-gray-900" />
    <rect x="128" y="316" width="156" height="14" rx="7" fill="#059669" />

    <g transform="translate(268,222) rotate(16)" className="anim-badge">
      <path d="M0 10 L20 0 L38 18 L18 36 Z" fill="#f59e0b" />
      <circle cx="9" cy="13" r="3.4" fill="#ffffff" />
    </g>

    <rect x="300" y="252" width="48" height="82" rx="11" fill="#059669" />
    <rect x="307" y="261" width="34" height="56" rx="4" fill="#a7f3d0" />
    <circle cx="324" cy="325" r="3.6" fill="#ecfdf5" />

    <g transform="translate(296,236) rotate(-12)" className="anim-badge" style={{ animationDelay: "0.4s" }}>
      <path d="M0 8 L15 0 L28 13 L13 26 Z" fill="#f59e0b" />
      <circle cx="6.5" cy="10.5" r="2.6" fill="#ffffff" />
    </g>

    <g className="anim-wrench" transform="translate(96,268)">
      <rect x="-10" y="-6" width="96" height="20" rx="10" fill="#34d399" transform="rotate(-28 -10 -6)" />
      <circle cx="-6" cy="-44" r="17" fill="none" stroke="#34d399" strokeWidth="13" strokeDasharray="54 320" strokeLinecap="round" transform="rotate(140 -6 -44)" />
    </g>

    <g transform="translate(206,110)">
      <circle cx="0" cy="-6" r="21" fill="#059669" />
      <path d="M-32 42 C-32 10 32 10 32 42 Z" fill="#059669" />
      <circle cx="36" cy="10" r="18" fill="#ffffff" className="dark:fill-gray-900" stroke="#10b981" strokeWidth="3" />
      <path d="M36 1 v18 M27 10 h18" stroke="#059669" strokeWidth="3.6" strokeLinecap="round" />
    </g>

    <g transform="translate(316,84)">
      <rect x="-26" y="-32" width="64" height="80" rx="9" fill="#ffffff" className="dark:fill-gray-900" stroke="#a7f3d0" strokeWidth="3" />
      <rect x="-13" y="-41" width="38" height="13" rx="4" fill="#059669" />
      <rect x="-15" y="-6" width="52" height="7.5" rx="3.75" fill="#6ee7b7" />
      <rect x="-15" y="9" width="52" height="7.5" rx="3.75" fill="#6ee7b7" />
      <rect x="-15" y="24" width="34" height="7.5" rx="3.75" fill="#6ee7b7" />
    </g>
  </svg>
));

const Field = memo(({ label, icon, error, children }) => (
  <div className="space-y-1">
    <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
    <div className="relative">
      <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 pointer-events-none">{icon}</span>
      {children}
    </div>
    {error && <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium anim-pop-in" role="alert">{error}</p>}
  </div>
));

const PasswordInput = memo(({ formType, value, onChange, onBlur, showPassword, onToggle, error }) => (
  <Field label="Password (min 6 chars)" icon={<RiLockPasswordLine size={15} />} error={error}>
    <input
      type={showPassword ? "text" : "password"} name="password" value={value}
      onChange={onChange} onBlur={(e) => onBlur(e, formType)}
      placeholder="Enter password" autoComplete="new-password"
      className={`${INPUT_BASE} pl-9 sm:pl-10 pr-11 ${error ? INPUT_ERR : INPUT_NORMAL}`}
    />
    <button type="button" onClick={onToggle} tabIndex={-1}
      className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center text-emerald-600 dark:text-emerald-400">
      {showPassword ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
    </button>
  </Field>
));

const SubmitBtn = memo(({ label, loading }) => (
  <button type="submit" disabled={loading}
    className="w-full h-10 sm:h-11 rounded-md font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]">
    {loading ? <><Spinner /> Creating Account...</> : label}
  </button>
));

const ErrorBanner = memo(({ message }) =>
  message ? (
    <div className="anim-pop-in bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 p-2.5 sm:p-3 rounded-xl text-xs text-center font-medium" role="alert">
      {message}
    </div>
  ) : null
);

const RoleToggle = memo(({ tab, isOn, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={isOn}
    onClick={() => onToggle(tab.key)}
    className={`flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 font-semibold text-xs sm:text-sm transition-all duration-300 ${isOn
        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm"
        : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
      }`}
  >
    <span className={`flex-shrink-0 transition-transform duration-300 ${isOn ? "scale-110" : ""}`}>{tab.icon}</span>
    <span className="truncate">{tab.label}</span>
    <span
      className={`ml-auto flex-shrink-0 relative w-8 h-4.5 rounded-full transition-colors duration-300 ${isOn ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"}`}
      style={{ height: "18px" }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-300 ${isOn ? "translate-x-3.5" : "translate-x-0"}`}
      />
    </span>
  </button>
));

const Accordion = memo(({ isOpen, children }) => (
  <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
    <div className="overflow-hidden">{children}</div>
  </div>
));

const OTPStep = memo(({ email, onSuccess, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = React.useRef([]);

  const handleOtpChange = useCallback((i, v) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n); setError("");
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  }, [otp]);

  const handleKeyDown = useCallback((i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus();
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); inputsRef.current[5]?.focus(); }
  }, []);

  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/verify-email", { email, optCode: code });
      await toast("success", "Email Verified!", "Your account is ready. Redirecting to login...");
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [otp, email, onSuccess]);

  return (
    <div className="anim-fade-up space-y-4 sm:space-y-5">
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
          <RiShieldCheckLine size={24} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Verify Your Email</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 break-all">{email}</span>
          </p>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handlePaste}>
        {otp.map((d, i) => (
          <input key={i} ref={el => inputsRef.current[i] = el} type="text" inputMode="numeric" maxLength={1}
            value={d} onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)} autoFocus={i === 0}
            className={`${OTP_INPUT} ${error ? "border-red-300 dark:border-red-600" : ""}`} />
        ))}
      </div>
      {error && <p className="text-center text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
      <button onClick={handleVerify} disabled={loading || otp.join("").length !== 6}
        className="w-full h-10 sm:h-11 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70">
        {loading ? <><Spinner /> Verifying...</> : "Verify Email"}
      </button>
      <div className="flex items-center justify-start">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition font-medium">
          <FiArrowLeft size={13} /> Back
        </button>
      </div>
    </div>
  );
});

const mkErrors = () => ({ user: {}, shop: {}, delivery: {}, assigner: {} });
const mkTouched = () => ({ user: {}, shop: {}, delivery: {}, assigner: {} });

const Signup = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("user");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(mkErrors);
  const [touched, setTouched] = useState(mkTouched);
  const [showPasswords, setShowPasswords] = useState({ user: false, shop: false, delivery: false, assigner: false });
  const [shopTypeOpen, setShopTypeOpen] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const [userData, setUserData] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "" });
  const [shopData, setShopData] = useState({ name: "", email: "", password: "", description: "", phone: "", shopAddress: { state: "", city: "", street: "", building: "", isDefault: true }, shopType: "" });
  const [deliveryData, setDeliveryData] = useState({ name: "", email: "", phone: "", password: "", address: "" });
  const [assignerData, setAssignerData] = useState({ name: "", email: "", phone: "", password: "", department: "" });

  useEffect(() => { document.title = "Sign Up | Tech-Restore"; }, []);

  const getError = useCallback((t, f) => touched[t]?.[f] ? errors[t]?.[f] || "" : "", [touched, errors]);

  const handleToggleRole = useCallback((key) => {
    setActiveTab(prev => prev === key ? prev : key);
  }, []);

  const makeChangeHandler = useCallback((setter, formType, addrFields = []) => (e) => {
    const { name, value } = e.target;
    if (addrFields.includes(name)) setter(prev => ({ ...prev, shopAddress: { ...prev.shopAddress, [name]: value } }));
    else setter(prev => ({ ...prev, [name]: value }));
    let fe = "";
    if (name === "email") fe = validateEmail(value);
    if (name === "phone") fe = validatePhone(value);
    if (name === "password") fe = validatePassword(value);
    setErrors(prev => ({ ...prev, [formType]: { ...prev[formType], [name]: fe } }));
  }, []);

  const handleUserChange = useMemo(() => makeChangeHandler(setUserData, "user"), [makeChangeHandler]);
  const handleShopChange = useMemo(() => makeChangeHandler(setShopData, "shop", ["state", "city", "street", "building"]), [makeChangeHandler]);
  const handleDeliveryChange = useMemo(() => makeChangeHandler(setDeliveryData, "delivery"), [makeChangeHandler]);
  const handleAssignerChange = useMemo(() => makeChangeHandler(setAssignerData, "assigner"), [makeChangeHandler]);

  const handleBlur = useCallback((e, formType) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [formType]: { ...prev[formType], [name]: true } }));
    let fe = "";
    if (name === "email") fe = validateEmail(value);
    else if (name === "phone") fe = validatePhone(value);
    else if (name === "password") fe = validatePassword(value);
    else if (!value.trim()) fe = "Required";
    setErrors(prev => ({ ...prev, [formType]: { ...prev[formType], [name]: fe } }));
  }, []);

  const makeToggle = useCallback((t) => () => setShowPasswords(prev => ({ ...prev, [t]: !prev[t] })), []);
  const toggleUser = useMemo(() => makeToggle("user"), [makeToggle]);
  const toggleShop = useMemo(() => makeToggle("shop"), [makeToggle]);
  const toggleDelivery = useMemo(() => makeToggle("delivery"), [makeToggle]);
  const toggleAssigner = useMemo(() => makeToggle("assigner"), [makeToggle]);

  const handleShopTypeSelect = useCallback((value) => {
    setShopData(prev => ({ ...prev, shopType: value }));
    setErrors(prev => ({ ...prev, shop: { ...prev.shop, shopType: "" } }));
    setTouched(prev => ({ ...prev, shop: { ...prev.shop, shopType: true } }));
    setShopTypeOpen(false);
  }, []);

  const registerAndVerify = useCallback(async (endpoint, data, formType) => {
    setLoading(true);
    try {
      await api.post(endpoint, data);
      setPendingEmail(data.email);
      setOtpStep(true);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;

      let msg = "Registration failed. Please try again.";
      let emailErr = "";

      if (status === 409) {
        msg = serverMsg || "This email is already registered.";
        emailErr = msg;
        setErrors(prev => ({
          ...prev,
          [formType]: { ...prev[formType], email: emailErr, general: "" },
        }));
        setTouched(prev => ({
          ...prev,
          [formType]: { ...prev[formType], email: true },
        }));
        toast("error", "Email Already Exists", msg);
      } else {
        msg = serverMsg || msg;
        setErrors(prev => ({ ...prev, [formType]: { ...prev[formType], general: msg } }));
        toast("error", "Registration Failed", msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUserSignup = useCallback((e) => {
    e.preventDefault();
    setTouched(prev => ({ ...prev, user: { first_name: true, last_name: true, email: true, phone: true, password: true } }));
    const ne = {};
    if (!userData.first_name.trim()) ne.first_name = "Required";
    if (!userData.last_name.trim()) ne.last_name = "Required";
    const ee = validateEmail(userData.email); if (ee) ne.email = ee;
    const pe = validatePhone(userData.phone); if (pe) ne.phone = pe;
    const pw = validatePassword(userData.password); if (pw) ne.password = pw;
    if (Object.keys(ne).length) { setErrors(prev => ({ ...prev, user: ne })); return; }
    registerAndVerify("/api/auth/register/user", userData, "user");
  }, [userData, registerAndVerify]);

  const handleShopSignup = useCallback((e) => {
    e.preventDefault();
    setTouched(prev => ({ ...prev, shop: { name: true, email: true, phone: true, description: true, shopType: true, state: true, city: true, street: true, building: true, password: true } }));
    const ne = {};
    if (!shopData.name) ne.name = "Required";
    const ee = validateEmail(shopData.email); if (ee) ne.email = ee;
    const pe = validatePhone(shopData.phone); if (pe) ne.phone = pe;
    const pw = validatePassword(shopData.password); if (pw) ne.password = pw;
    if (!shopData.description) ne.description = "Required";
    if (!shopData.shopType) ne.shopType = "Required";
    if (!shopData.shopAddress.state) ne.state = "Required";
    if (!shopData.shopAddress.city) ne.city = "Required";
    if (!shopData.shopAddress.street) ne.street = "Required";
    if (!shopData.shopAddress.building) ne.building = "Required";
    if (Object.keys(ne).length) { setErrors(prev => ({ ...prev, shop: ne })); return; }
    registerAndVerify("/api/auth/register/shop", shopData, "shop");
  }, [shopData, registerAndVerify]);

  const handleDeliverySignup = useCallback((e) => {
    e.preventDefault();
    setTouched(prev => ({ ...prev, delivery: { name: true, email: true, phone: true, address: true, password: true } }));
    const ne = {};
    if (!deliveryData.name.trim()) ne.name = "Required";
    const ee = validateEmail(deliveryData.email); if (ee) ne.email = ee;
    const pe = validatePhone(deliveryData.phone); if (pe) ne.phone = pe;
    const pw = validatePassword(deliveryData.password); if (pw) ne.password = pw;
    if (!deliveryData.address.trim()) ne.address = "Required";
    if (Object.keys(ne).length) { setErrors(prev => ({ ...prev, delivery: ne })); return; }
    registerAndVerify("/api/auth/register/delivery", deliveryData, "delivery");
  }, [deliveryData, registerAndVerify]);

  const handleAssignerSignup = useCallback((e) => {
    e.preventDefault();
    setTouched(prev => ({ ...prev, assigner: { name: true, email: true, phone: true, department: true, password: true } }));
    const ne = {};
    if (!assignerData.name.trim()) ne.name = "Required";
    const ee = validateEmail(assignerData.email); if (ee) ne.email = ee;
    const pe = validatePhone(assignerData.phone); if (pe) ne.phone = pe;
    const pw = validatePassword(assignerData.password); if (pw) ne.password = pw;
    if (!assignerData.department.trim()) ne.department = "Required";
    if (Object.keys(ne).length) { setErrors(prev => ({ ...prev, assigner: ne })); return; }
    registerAndVerify("/api/auth/register/assigner", assignerData, "assigner");
  }, [assignerData, registerAndVerify]);

  const handleOtpSuccess = useCallback(() => navigate("/login"), [navigate]);
  const handleOtpBack = useCallback(() => { setOtpStep(false); setPendingEmail(""); }, []);

  const inp = (formType, name, type, value, onChange, onBlur, placeholder, autoComplete) => {
    const err = getError(formType, name);
    return (
      <input type={type} name={name} value={value} onChange={onChange}
        onBlur={(e) => onBlur(e, formType)} placeholder={placeholder}
        disabled={loading} autoComplete={autoComplete}
        className={`${INPUT_BASE} pl-9 sm:pl-10 ${err ? INPUT_ERR : INPUT_NORMAL}`} />
    );
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <GlobalAnimations />
      <DotsBackground />

      <nav className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-end">
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/login" className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition hidden sm:block">
              Already have an account?
            </Link>
            <Link to="/login">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 sm:px-5 py-2 rounded-3xl transition text-xs sm:text-sm shadow-sm">Sign In</button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 pt-16 pb-8 sm:pt-20 sm:pb-16 px-4 sm:px-6 min-h-screen flex items-start">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-start w-full pt-4 sm:pt-6">

          <div className="relative md:sticky md:top-24 flex justify-center order-2 md:order-1">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-none">
              <CartoonIllustration />
              <div className="anim-fade-up absolute -top-2 sm:-top-3 -right-2 sm:-right-3 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-2.5" style={{ animationDelay: "0.15s" }}>
                <Users className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">4 Role Types</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">choose yours</p>
                </div>
              </div>
              <div className="anim-fade-up absolute -bottom-3 sm:-bottom-5 left-2 sm:left-3 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2.5 sm:p-3.5 text-center" style={{ animationDelay: "0.3s" }}>
                <Wrench className="w-5 h-5 sm:w-7 sm:h-7 mx-auto text-emerald-500 mb-0.5 sm:mb-1" />
                <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">Free</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">to start</p>
              </div>
            </div>
          </div>

          <div className="anim-fade-up space-y-4 sm:space-y-6 order-1 md:order-2">
            <div>
              <h1 className="text-3xl mt-4 sm:text-4xl md:text-5xl font-bold leading-none tracking-tighter text-gray-900 dark:text-gray-50">
                Create your<br /><span className="text-emerald-500">account</span>
              </h1>
              <p className="mt-2 sm:mt-3 text-base sm:text-lg text-gray-500 dark:text-gray-400">Choose your role and get started today.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
              {otpStep ? (
                <OTPStep email={pendingEmail} onSuccess={handleOtpSuccess} onBack={handleOtpBack} />
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Choose your role</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group">
                      {TAB_CONFIG.map((tab) => (
                        <RoleToggle key={tab.key} tab={tab} isOn={activeTab === tab.key} onToggle={handleToggleRole} />
                      ))}
                    </div>
                  </div>

                  <Accordion isOpen={activeTab === "user"}>
                    <form onSubmit={handleUserSignup} className="space-y-3 sm:space-y-4" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="First Name" icon={<RiUserLine className="text-emerald-400" size={15} />} error={getError("user", "first_name")}>
                          {inp("user", "first_name", "text", userData.first_name, handleUserChange, handleBlur, "First name", "given-name")}
                        </Field>
                        <Field label="Last Name" icon={<RiUserLine size={15} />} error={getError("user", "last_name")}>
                          {inp("user", "last_name", "text", userData.last_name, handleUserChange, handleBlur, "Last name", "family-name")}
                        </Field>
                        <Field label="Email Address" icon={<RiMailLine size={15} />} error={getError("user", "email")}>
                          {inp("user", "email", "email", userData.email, handleUserChange, handleBlur, "you@example.com", "email")}
                        </Field>
                        <Field label="Phone Number" icon={<RiPhoneLine size={15} />} error={getError("user", "phone")}>
                          {inp("user", "phone", "tel", userData.phone, handleUserChange, handleBlur, "Phone number", "tel")}
                        </Field>
                      </div>
                      <PasswordInput formType="user" value={userData.password} onChange={handleUserChange} onBlur={handleBlur} showPassword={showPasswords.user} onToggle={toggleUser} error={getError("user", "password")} />
                      <ErrorBanner message={errors.user.general} />
                      <SubmitBtn label="Sign Up as User" loading={loading} />
                    </form>
                  </Accordion>

                  <Accordion isOpen={activeTab === "shop"}>
                    <form onSubmit={handleShopSignup} className="space-y-3 sm:space-y-4" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Shop Name" icon={<RiStore2Line size={15} />} error={getError("shop", "name")}>
                          {inp("shop", "name", "text", shopData.name, handleShopChange, handleBlur, "Shop name", undefined)}
                        </Field>
                        <Field label="Email" icon={<RiMailLine size={15} />} error={getError("shop", "email")}>
                          {inp("shop", "email", "email", shopData.email, handleShopChange, handleBlur, "you@example.com", "email")}
                        </Field>
                        <Field label="Phone" icon={<RiPhoneLine size={15} />} error={getError("shop", "phone")}>
                          {inp("shop", "phone", "tel", shopData.phone, handleShopChange, handleBlur, "Phone", "tel")}
                        </Field>
                        <Field label="Description" icon={<RiFileListLine size={15} />} error={getError("shop", "description")}>
                          {inp("shop", "description", "text", shopData.description, handleShopChange, handleBlur, "Brief description", undefined)}
                        </Field>

                        <div className="space-y-1">
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Shop Type</label>
                          <div className="relative">
                            <div role="combobox" tabIndex={0}
                              className={`${INPUT_BASE} pl-9 sm:pl-10 cursor-pointer flex items-center justify-between ${getError("shop", "shopType") ? INPUT_ERR : INPUT_NORMAL}`}
                              onClick={() => setShopTypeOpen(o => !o)}
                              onBlur={() => { setTouched(prev => ({ ...prev, shop: { ...prev.shop, shopType: true } })); setShopTypeOpen(false); }}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShopTypeOpen(o => !o); } }}>
                              <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 pointer-events-none"><RiStore2Line size={15} /></span>
                              <span className={shopData.shopType ? "text-gray-900 dark:text-gray-100 text-sm" : "text-gray-400 text-sm"}>
                                {shopData.shopType ? SHOP_TYPE_OPTIONS.find(o => o.value === shopData.shopType)?.label : "Select type"}
                              </span>
                              <RiArrowDownSLine size={15} className={`text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${shopTypeOpen ? "rotate-180" : ""}`} />
                            </div>
                            {shopTypeOpen && (
                              <ul role="listbox" className="anim-pop-in absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                                {SHOP_TYPE_OPTIONS.map(opt => (
                                  <li key={opt.value} role="option" aria-selected={shopData.shopType === opt.value}
                                    onMouseDown={(e) => { e.preventDefault(); handleShopTypeSelect(opt.value); }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${shopData.shopType === opt.value ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold" : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                                    {opt.label}
                                    {shopData.shopType === opt.value && <FiCheck size={13} className="text-emerald-600" />}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          {getError("shop", "shopType") && <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium">{errors.shop.shopType}</p>}
                        </div>

                        <Field label="State" icon={<RiMapPinLine size={15} />} error={getError("shop", "state")}>
                          {inp("shop", "state", "text", shopData.shopAddress.state, handleShopChange, handleBlur, "e.g. Cairo", undefined)}
                        </Field>
                        <Field label="City" icon={<RiMapPinLine size={15} />} error={getError("shop", "city")}>
                          {inp("shop", "city", "text", shopData.shopAddress.city, handleShopChange, handleBlur, "e.g. Giza", undefined)}
                        </Field>
                        <Field label="Street" icon={<RiMapPinLine size={15} />} error={getError("shop", "street")}>
                          {inp("shop", "street", "text", shopData.shopAddress.street, handleShopChange, handleBlur, "Street name", undefined)}
                        </Field>
                        <Field label="Building" icon={<RiMapPinLine size={15} />} error={getError("shop", "building")}>
                          {inp("shop", "building", "text", shopData.shopAddress.building, handleShopChange, handleBlur, "Building no.", undefined)}
                        </Field>
                      </div>
                      <PasswordInput formType="shop" value={shopData.password} onChange={handleShopChange} onBlur={handleBlur} showPassword={showPasswords.shop} onToggle={toggleShop} error={getError("shop", "password")} />
                      <ErrorBanner message={errors.shop.general} />
                      <SubmitBtn label="Sign Up as Shop Owner" loading={loading} />
                    </form>
                  </Accordion>

                  <Accordion isOpen={activeTab === "delivery"}>
                    <form onSubmit={handleDeliverySignup} className="space-y-3 sm:space-y-4" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Full Name" icon={<RiUserLine size={15} />} error={getError("delivery", "name")}>
                          {inp("delivery", "name", "text", deliveryData.name, handleDeliveryChange, handleBlur, "Full name", undefined)}
                        </Field>
                        <Field label="Email" icon={<RiMailLine size={15} />} error={getError("delivery", "email")}>
                          {inp("delivery", "email", "email", deliveryData.email, handleDeliveryChange, handleBlur, "you@example.com", "email")}
                        </Field>
                        <Field label="Phone" icon={<RiPhoneLine size={15} />} error={getError("delivery", "phone")}>
                          {inp("delivery", "phone", "tel", deliveryData.phone, handleDeliveryChange, handleBlur, "Phone", "tel")}
                        </Field>
                        <Field label="Address" icon={<RiHome4Line size={15} />} error={getError("delivery", "address")}>
                          {inp("delivery", "address", "text", deliveryData.address, handleDeliveryChange, handleBlur, "Address", undefined)}
                        </Field>
                      </div>
                      <PasswordInput formType="delivery" value={deliveryData.password} onChange={handleDeliveryChange} onBlur={handleBlur} showPassword={showPasswords.delivery} onToggle={toggleDelivery} error={getError("delivery", "password")} />
                      <ErrorBanner message={errors.delivery.general} />
                      <SubmitBtn label="Sign Up as Delivery" loading={loading} />
                    </form>
                  </Accordion>

                  <Accordion isOpen={activeTab === "assigner"}>
                    <form onSubmit={handleAssignerSignup} className="space-y-3 sm:space-y-4" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Full Name" icon={<RiUserLine size={15} />} error={getError("assigner", "name")}>
                          {inp("assigner", "name", "text", assignerData.name, handleAssignerChange, handleBlur, "Full name", "name")}
                        </Field>
                        <Field label="Department" icon={<RiUserSettingsLine size={15} />} error={getError("assigner", "department")}>
                          {inp("assigner", "department", "text", assignerData.department, handleAssignerChange, handleBlur, "Department", undefined)}
                        </Field>
                        <Field label="Email" icon={<RiMailLine size={15} />} error={getError("assigner", "email")}>
                          {inp("assigner", "email", "email", assignerData.email, handleAssignerChange, handleBlur, "you@example.com", "email")}
                        </Field>
                        <Field label="Phone" icon={<RiPhoneLine size={15} />} error={getError("assigner", "phone")}>
                          {inp("assigner", "phone", "tel", assignerData.phone, handleAssignerChange, handleBlur, "Phone", "tel")}
                        </Field>
                      </div>
                      <PasswordInput formType="assigner" value={assignerData.password} onChange={handleAssignerChange} onBlur={handleBlur} showPassword={showPasswords.assigner} onToggle={toggleAssigner} error={getError("assigner", "password")} />
                      <ErrorBanner message={errors.assigner.general} />
                      <SubmitBtn label="Sign Up as Assigner" loading={loading} />
                    </form>
                  </Accordion>

                  <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Log in here</Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default memo(Signup);