import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiRefreshCw, FiCreditCard, FiDollarSign,
  FiCheckCircle, FiClock, FiAlertTriangle, FiShield, FiMinus, FiPlus, FiKey, FiX,
} from 'react-icons/fi';
import api from '../common/api/api';
import queryClient from '../common/utils/queryClient';
import logo from '../common/images/tech-restore-logo.webp';
import useAuthStore from '../common/store/Auth';
import { redirectFor, SHOP_ROLES } from '../common/utils/authSession';
import { UI3D_CSS } from '../components/user/Ui3D';
import {
  markGoogleSignIn, recoverGoogleSession, hasGoogleMark, clearGoogleMark, applySession,
} from '../common/utils/googleSession';
import { useModalLock, useLangFont } from '../components/user/ListingKit';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };
const ensureNbFont = () => {
  if (typeof document === 'undefined' || document.getElementById('nb-font')) return;
  [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
    const l = document.createElement('link');
    l.rel = 'preconnect'; l.href = href; if (cors) l.crossOrigin = '';
    document.head.appendChild(l);
  });
  const link = document.createElement('link');
  link.id = 'nb-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
};

const NB_CSS = `
.nb{--nb-bg:#f3f4f6;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b5563;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e5e7eb;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-dark .border-dotted{border-color:#3f3f3f}
.nb-bg{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled):not([aria-disabled=true]){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled):not([aria-disabled=true]){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled,.nb-btn[aria-disabled=true]{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-field-err{border-color:#e11d48;box-shadow:3px 3px 0 #e11d48}
.nb-field:has(:disabled){opacity:.6}
.nb-alert{background:var(--nb-card);color:var(--nb-ink);border:2px solid #e11d48;box-shadow:3px 3px 0 #e11d48}
.nb-link{font-weight:700;text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:2px;text-underline-offset:4px}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
@media (prefers-reduced-motion:reduce){.nb-btn,.anim-float,.anim-fade-up{transition:none;animation:none!important}}
`;
const PAGE_CSS = `${UI3D_CSS}\n${EXTRAS_CSS}\n${NB_CSS}`;

const NS = { en: enTranslations.login, ar: arTranslations.login, fr: frTranslations.login };
const T_CACHE = {};
const getT = (language) => (T_CACHE[language] ||= (key, vars) => {
  let s = NS[language]?.[key] || NS.en?.[key] || key;
  if (vars) for (const k in vars) s = s.split(`{{${k}}}`).join(vars[k]);
  return s;
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_BYTES = 72;
const encoder = new TextEncoder();
const byteLength = (s) => encoder.encode(s || '').length;
const PRICE_PER_MONTH = 1000;
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const GOOGLE_AUTH_URL = `${API_BASE}/oauth2/authorization/google`;
const SUCCESS_DELAY_MS = 1500;

const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_SECONDS = 30;
const THROTTLE_KEY = 'loginThrottle';
const readThrottle = () => {
  try {
    const v = JSON.parse(localStorage.getItem(THROTTLE_KEY));
    return v && typeof v === 'object' ? { count: Number(v.count) || 0, until: Number(v.until) || 0 } : { count: 0, until: 0 };
  } catch { return { count: 0, until: 0 }; }
};
const writeThrottle = (v) => { try { localStorage.setItem(THROTTLE_KEY, JSON.stringify(v)); } catch { } };
const clearThrottle = () => { try { localStorage.removeItem(THROTTLE_KEY); } catch { } };

const sanitize = (s) => String(s ?? '').replace(/[<>"'`]/g, '');

const FRIENDLY_ENTRIES = [
  ['bad credentials', 'errBadCredentials'],
  ['user not found', 'errUserNotFound'],
  ['account is disabled', 'errAccountDisabled'],
  ['account is locked', 'errAccountLocked'],
  ['too many requests', 'errTooManyRequests'],
  ['invalid token', 'errInvalidToken'],
  ['email not verified', 'errEmailNotVerified'],
  ['missing access token', 'errMissingToken'],
  ['network error', 'errNetwork'],
];
const WRONG_CREDS_KEYS = new Set(['errBadCredentials', 'errUserNotFound']);
const EXPIRED_KEYS = ['subscription is expired', 'subscription expired', 'subscription has expired', 'your subscription'];

function parseError(raw, t) {
  const lower = (raw || '').toLowerCase().trim();
  if (EXPIRED_KEYS.some((k) => lower.includes(k))) {
    return { key: 'errSubscriptionExpired', message: t('errSubscriptionExpired'), isExpired: true };
  }
  for (const [frag, key] of FRIENDLY_ENTRIES) {
    if (lower.includes(frag)) return { key, message: t(key), isExpired: false };
  }
  const cleaned = sanitize(raw);
  return { key: '', message: cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : t('errGeneric'), isExpired: false };
}

const renewalError = (err, fallback, t) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const raw = String(data.message || '');
  const code = String(data.error_code || data.code || '');
  if (/amount_cents|amount must|price must/i.test(raw)) return t('rnAmountInvalid');
  if (/not found/i.test(raw) || status === 404) return t('rnNotFound');
  if (/already completed/i.test(raw)) return t('rnPaymentNotStarted');
  if (/duplicate|paymob|unprocessable/i.test(raw) || status === 422) return t('rnInProgress');
  if (status === 401) return t('errInvalidToken');
  if (status === 403) return t('rnForbidden');
  if (status >= 500 || /RUNTIME_ERROR|RT_001/i.test(`${raw} ${code}`) || !raw) return fallback;
  return sanitize(raw) || fallback;
};

const safeHttpsUrl = (raw) => {
  try { const u = new URL(String(raw)); return u.protocol === 'https:' ? u.href : null; } catch { return null; }
};

const PAID = ['PAID', 'ACTIVE', 'SETTLED', 'COMPLETED', 'SUCCESS', 'APPROVED', 'CONFIRMED', 'SUCCESSFUL'];

function checkLatestSubscription(subs) {
  if (!Array.isArray(subs) || subs.length === 0) return { expired: true, shopId: null, isPending: false, noSubs: true };
  const now = Date.now();
  const status = (s) => (s.status || '').toUpperCase();
  const pay = (s) => (s.paymentStatus || s.payment_status || '').toUpperCase();

  const active = subs.find((s) => {
    const rawEnd = s.endDate || s.end_date || s.expiryDate;
    const end = rawEnd ? new Date(rawEnd) : null;
    return end && end.getTime() > now - 86400000 && PAID.some((term) => status(s) === term || pay(s) === term);
  });
  if (active) return { expired: false, shopId: active.shopId || active.shop?.id || null, isPending: false };

  const pending = subs.find((s) => {
    const method = (s.paymentMethod || s.payment_method || s.payment?.method || '').toUpperCase();
    return (status(s) === 'PENDING' || pay(s) === 'PENDING') && method === 'CASH';
  });
  const endOf = (s) => new Date(s.endDate || s.end_date || 0).getTime();
  const latest = [...subs].sort((a, b) => endOf(b) - endOf(a))[0];
  return { expired: !pending, shopId: latest.shopId || latest.shop?.id || null, isPending: !!pending };
}

/* The backend only adds a query string when Google sign-in FAILED (e.g. /login?error=...). Read it once, without touching the URL. */
const readGoogleError = () => {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams(window.location.search);
  return p.get('error_description') || p.get('error') || '';
};

const Spinner = () => <span aria-hidden="true" className="inline-block h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />;

const ErrorBanner = memo(({ message, hint }) => (
  <div role="alert" className="nb-alert anim-fade-up flex items-start gap-2.5 p-3">
    <FiAlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
    <div className="min-w-0">
      <p className="text-sm font-bold leading-snug">{message}</p>
      {hint && <p className="nb-muted mt-0.5 text-xs leading-snug">{hint}</p>}
    </div>
  </div>
));

const AuthInput = memo(({ id, label, icon: Icon, error, trailing, ...rest }) => (
  <div className="space-y-1.5">
    {label && <label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-wide">{label}</label>}
    <div className={`nb-field flex h-12 items-center gap-2 ps-3 ${trailing ? 'pe-2' : 'pe-3'} ${error ? 'nb-field-err' : ''}`}>
      {Icon && <Icon aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />}
      <input
        id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
        {...rest}
      />
      {trailing}
    </div>
    {error && <p id={`${id}-err`} className="flex items-center gap-1 text-xs font-bold text-rose-500"><FiAlertTriangle aria-hidden="true" className="h-3 w-3 flex-shrink-0" />{error}</p>}
  </div>
));

const EyeToggle = memo(({ shown, onToggle, t }) => (
  <button type="button" onClick={onToggle} aria-label={shown ? t('hidePassword') : t('showPassword')} aria-pressed={shown}
    className="nb-ic flex h-8 w-8 flex-shrink-0 items-center justify-center focus-visible:outline focus-visible:outline-2">
    {shown ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
  </button>
));

const NbModal = memo(({ onClose, icon: Icon, title, size = 'sm:max-w-md', children }) => {
  useModalLock(true, onClose);
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`nb-card anim-fade-up relative max-h-[92vh] w-full overflow-y-auto overscroll-contain ${size}`}>
        <div className="nb-gray nb-line flex items-center gap-3 border-b-2 p-4 pe-14">
          <span className="nb-chip nb-chip-a !p-2"><Icon aria-hidden="true" className="h-4 w-4" /></span>
          <h2 className="min-w-0 truncate text-base font-extrabold uppercase"><span className="nb-ul">{title}</span></h2>
          <button type="button" onClick={onClose} aria-label="×" className="nb-btn absolute end-3 top-3 h-8 w-8"><FiX className="h-4 w-4" /></button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
});

const OTP_LEN = 6;
const EMPTY_OTP = Array(OTP_LEN).fill('');

const ForgotPasswordModal = memo(({ onClose, t }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef([]);
  const busyRef = useRef(false);
  const abortRef = useRef(null);

  const otpCode = useMemo(() => otp.join(''), [otp]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const nextSignal = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  }, []);

  const fail = useCallback((err) => {
    if (isCanceled(err)) return;
    setError(parseError(err.response?.data?.message || err.message, t).message);
  }, [t]);

  const sendCode = useCallback(async () => {
    if (busyRef.current) return;
    if (!EMAIL_REGEX.test(email)) { setError(t('errEmailInvalid')); return; }
    busyRef.current = true;
    setLoading(true); setError('');
    try { await api.post('/api/auth/forgot-password', { email }, { signal: nextSignal() }); setStep('otp'); setCountdown(60); }
    catch (err) { fail(err); } finally { busyRef.current = false; setLoading(false); }
  }, [email, fail, nextSignal, t]);

  const changeOtp = useCallback((i, v) => {
    if (!/^\d*$/.test(v)) return;
    setOtp((prev) => { const n = [...prev]; n[i] = v.slice(-1); return n; });
    setError('');
    if (v && i < OTP_LEN - 1) inputsRef.current[i + 1]?.focus();
  }, []);

  const otpKeyDown = useCallback((i, e) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && i > 0) inputsRef.current[i - 1]?.focus();
  }, []);

  const otpPaste = useCallback((e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!digits) return;
    e.preventDefault();
    const n = [...EMPTY_OTP]; digits.split('').forEach((c, i) => { n[i] = c; });
    setOtp(n); setError('');
    inputsRef.current[Math.min(digits.length, OTP_LEN - 1)]?.focus();
  }, []);

  const nextFromOtp = useCallback(() => {
    if (otpCode.length !== OTP_LEN) { setError(t('errOtpIncomplete')); return; }
    setError(''); setStep('reset');
  }, [otpCode, t]);

  const resend = useCallback(async () => {
    if (countdown > 0 || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      await api.get('/api/auth/get-code', { params: { email }, signal: nextSignal() });
      setCountdown(60); setOtp(EMPTY_OTP); setError('');
      inputsRef.current[0]?.focus();
    } catch (err) { fail(err); } finally { busyRef.current = false; setLoading(false); }
  }, [email, countdown, fail, nextSignal]);

  const resetPassword = useCallback(async () => {
    if (busyRef.current) return;
    if (newPassword.length < MIN_PASSWORD_LENGTH) { setError(t('errPasswordMin', { min: MIN_PASSWORD_LENGTH })); return; }
    if (byteLength(newPassword) > MAX_PASSWORD_BYTES) { setError(t('errPasswordMax', { max: MAX_PASSWORD_BYTES })); return; }
    if (newPassword !== confirmPw) { setError(t('errPasswordMismatch')); return; }
    busyRef.current = true;
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { email, otp: otpCode, newPassword, confirmPassword: confirmPw }, { signal: nextSignal() });
      setStep('done');
    } catch (err) { fail(err); } finally { busyRef.current = false; setLoading(false); }
  }, [email, otpCode, newPassword, confirmPw, fail, nextSignal, t]);

  const onEmailChange = useCallback((e) => { setEmail(e.target.value); setError(''); }, []);
  const onEmailKeyDown = useCallback((e) => { if (e.key === 'Enter') sendCode(); }, [sendCode]);
  const onNewPwChange = useCallback((e) => { setNewPassword(e.target.value); setError(''); }, []);
  const onConfirmChange = useCallback((e) => { setConfirmPw(e.target.value); setError(''); }, []);
  const togglePw = useCallback(() => setShowPw((p) => !p), []);
  const pwToggle = useMemo(() => <EyeToggle shown={showPw} onToggle={togglePw} t={t} />, [showPw, togglePw, t]);
  const back = useCallback(() => { setError(''); setStep((s) => (s === 'reset' ? 'otp' : 'email')); }, []);

  const titles = { email: t('fpTitleEmail'), otp: t('fpTitleOtp'), reset: t('fpTitleReset'), done: t('fpTitleDone') };

  return (
    <NbModal onClose={onClose} icon={FiKey} title={titles[step]} size="sm:max-w-sm">
      <div className="space-y-4">
        {step !== 'email' && step !== 'done' && (
          <button type="button" onClick={back} className="nb-link flex items-center gap-1 text-xs"><FiArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {t('back')}</button>
        )}
        {error && <ErrorBanner message={error} />}

        {step === 'email' && (
          <>
            <p className="nb-muted text-sm">{t('fpEmailHelp')}</p>
            <AuthInput id="fp-email" type="email" icon={FiMail} value={email} placeholder="you@example.com" autoComplete="email"
              autoCapitalize="none" spellCheck={false} dir="ltr" onChange={onEmailChange} onKeyDown={onEmailKeyDown} />
            <button type="button" onClick={sendCode} disabled={loading} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">
              {loading ? <><Spinner /> {t('sending')}</> : t('sendCode')}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="nb-muted text-center text-sm">{t('codeSentTo')} <b className="nb-ic break-all" dir="ltr">{email}</b></p>
            <div className="flex justify-center gap-1.5 sm:gap-2" dir="ltr" onPaste={otpPaste}>
              {otp.map((d, i) => (
                <input key={i} ref={(el) => { inputsRef.current[i] = el; }} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1} value={d}
                  aria-label={t('digit', { n: i + 1 })} autoFocus={i === 0}
                  onChange={(e) => changeOtp(i, e.target.value)} onKeyDown={(e) => otpKeyDown(i, e)}
                  className="nb-field h-12 w-10 bg-transparent px-0 text-center text-lg font-extrabold outline-none sm:w-11" />
              ))}
            </div>
            <button type="button" onClick={nextFromOtp} disabled={otpCode.length !== OTP_LEN} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">{t('next')}</button>
            <button type="button" onClick={resend} disabled={countdown > 0 || loading}
              className="nb-link flex w-full items-center justify-center gap-1.5 text-sm disabled:opacity-50 disabled:no-underline">
              <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              {countdown > 0 ? t('resendIn', { s: countdown }) : t('resendCode')}
            </button>
          </>
        )}

        {step === 'reset' && (
          <>
            <p className="nb-muted text-sm">{t('fpNewHelp')}</p>
            <AuthInput id="fp-new" type={showPw ? 'text' : 'password'} icon={FiLock} value={newPassword} placeholder={t('newPasswordPlaceholder')} autoComplete="new-password"
              onChange={onNewPwChange} trailing={pwToggle} />
            <AuthInput id="fp-confirm" type={showPw ? 'text' : 'password'} icon={FiLock} value={confirmPw} placeholder={t('confirmPasswordPlaceholder')} autoComplete="new-password"
              onChange={onConfirmChange} />
            <button type="button" onClick={resetPassword} disabled={loading} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">
              {loading ? <><Spinner /> {t('resetting')}</> : t('resetPassword')}
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="space-y-4 py-2 text-center">
            <span className="nb-chip nb-chip-a mx-auto !p-3"><FiCheckCircle className="h-7 w-7" /></span>
            <div>
              <p className="font-extrabold uppercase">{t('fpDoneTitle')}</p>
              <p className="nb-muted mt-1 text-sm">{t('fpDoneText')}</p>
            </div>
            <button type="button" onClick={onClose} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">{t('backToSignIn')}</button>
          </div>
        )}
      </div>
    </NbModal>
  );
});

const PAYMENT_METHODS = [['card', 'payCard', FiCreditCard], ['cash', 'payCash', FiDollarSign]];

const RenewalModal = memo(({ shopEmail, isPending, onClose, t }) => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [view, setView] = useState(isPending ? 'pending' : 'form');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('card');
  const [months, setMonths] = useState(1);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);
  const abortRef = useRef(null);
  const total = months * PRICE_PER_MONTH;

  useEffect(() => () => abortRef.current?.abort(), []);

  const leave = useCallback(() => { clearAuth(); onClose(); navigate('/login'); }, [clearAuth, onClose, navigate]);

  const renewCard = useCallback(async () => {
    if (submittingRef.current) return;
    if (!shopEmail) { setError(t('rnUnidentified')); return; }
    submittingRef.current = true;
    setLoading(true); setError('');
    let leaving = false;
    try {
      abortRef.current = new AbortController();
      const res = await api.post(`/api/subscriptions/renew/card/${encodeURIComponent(shopEmail)}`, { months, type: 'COMMISSION' }, { signal: abortRef.current.signal });
      const payUrl = safeHttpsUrl(res.data?.paymentURL);
      if (payUrl) { leaving = true; setView('redirect'); window.location.href = payUrl; }
      else if (res.data?.paymentURL) setError(t('rnInsecureLink'));
      else setError(t('rnCardNotStarted'));
    } catch (err) { if (!isCanceled(err)) setError(renewalError(err, t('rnCardFailed'), t)); }
    finally { if (!leaving) { submittingRef.current = false; setLoading(false); } }
  }, [shopEmail, months, t]);

  const renewCash = useCallback(async () => {
    if (submittingRef.current) return;
    if (!shopEmail) { setError(t('rnUnidentified')); return; }
    submittingRef.current = true;
    setLoading(true); setError('');
    try {
      abortRef.current = new AbortController();
      await api.post(`/api/subscriptions/renew/cash/${encodeURIComponent(shopEmail)}`, { months, type: 'COMMISSION' }, { signal: abortRef.current.signal });
      setView('pending');
    } catch (err) { if (!isCanceled(err)) setError(renewalError(err, t('rnCashFailed'), t)); }
    finally { submittingRef.current = false; setLoading(false); }
  }, [shopEmail, months, t]);

  const decMonths = useCallback(() => setMonths((m) => Math.max(1, m - 1)), []);
  const incMonths = useCallback(() => setMonths((m) => Math.min(12, m + 1)), []);

  const titles = { form: t('rnTitleForm'), pending: t('rnTitlePending'), redirect: t('rnTitleRedirect') };

  return (
    <NbModal onClose={leave} icon={view === 'pending' ? FiClock : FiRefreshCw} title={titles[view]}>
      {view === 'pending' && (
        <div className="space-y-4 text-center">
          <span className="nb-chip nb-chip-a mx-auto !p-4"><FiClock className="h-8 w-8" /></span>
          <div>
            <h4 className="text-lg font-extrabold uppercase">{t('rnRequestReceived')}</h4>
            <p className="nb-muted mt-1 text-sm">{t('rnPendingText')}</p>
          </div>
          <ul className="nb-gray nb-line space-y-1.5 border-2 border-dotted p-3.5 text-start text-xs font-semibold">
            <li className="flex items-center gap-2"><FiCheckCircle className="nb-ic h-3.5 w-3.5 flex-shrink-0" /> {t('rnPendingNote1')}</li>
            <li className="flex items-center gap-2"><FiCheckCircle className="nb-ic h-3.5 w-3.5 flex-shrink-0" /> {t('rnPendingNote2')}</li>
          </ul>
          <button type="button" onClick={leave} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">{t('backToLogin')}</button>
        </div>
      )}

      {view === 'form' && (
        <div className="space-y-4">
          {error && <ErrorBanner message={error} />}

          <div className="nb-gray nb-line border-2 border-dotted p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="nb-muted text-[10px] font-extrabold uppercase tracking-widest">{t('rnFee')}</span>
              <span className="nb-chip nb-chip-a"><FiShield aria-hidden="true" className="h-3 w-3" /> {t('rnSecure')}</span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-extrabold tabular-nums tracking-tight"><span dir="ltr">{total.toLocaleString()}</span> <span className="nb-muted text-sm font-semibold">{t('currency')}</span></p>
              <div className="nb-field inline-flex items-center">
                <button type="button" aria-label={t('rnFewer')} onClick={decMonths} disabled={months <= 1} className="flex h-9 w-9 items-center justify-center disabled:opacity-40"><FiMinus className="h-4 w-4" /></button>
                <div className="min-w-[2.5rem] px-1 text-center" aria-live="polite">
                  <p className="text-sm font-extrabold leading-none">{months}</p>
                  <p className="nb-muted text-[8px] font-extrabold uppercase">{t('rnMonthShort')}</p>
                </div>
                <button type="button" aria-label={t('rnMore')} onClick={incMonths} disabled={months >= 12} className="flex h-9 w-9 items-center justify-center disabled:opacity-40"><FiPlus className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('rnPaymentMethod')}>
            {PAYMENT_METHODS.map(([k, labelKey, Icon]) => (
              <button key={k} type="button" role="radio" aria-checked={method === k} onClick={() => setMethod(k)}
                className={`nb-btn flex-col gap-1.5 p-3 text-xs uppercase ${method === k ? 'nb-btn-on' : ''}`}>
                <Icon aria-hidden="true" className="h-5 w-5" /> {t(labelKey)}
              </button>
            ))}
          </div>

          <button type="button" onClick={method === 'card' ? renewCard : renewCash} disabled={loading} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">
            {loading ? <Spinner /> : method === 'card' ? t('rnPayCard') : t('rnSendCash')}
          </button>
        </div>
      )}

      {view === 'redirect' && (
        <div className="space-y-4 py-4 text-center">
          <span className="nb-chip nb-chip-a mx-auto !p-4"><FiRefreshCw className="h-8 w-8" /></span>
          <div>
            <h4 className="text-lg font-extrabold uppercase">{t('rnRedirecting')}</h4>
            <p className="nb-muted mt-1 text-sm">{t('rnHold')}</p>
          </div>
          <p className="nb-ic flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest"><Spinner /> {t('rnWait')}</p>
        </div>
      )}
    </NbModal>
  );
});

const validateEmail = (v, t) => (!v.trim() ? t('errEmailRequired') : !EMAIL_REGEX.test(v) ? t('errEmailInvalid') : '');
const validatePassword = (v, t) => (!v ? t('errPasswordRequired') : v.length < MIN_PASSWORD_LENGTH ? t('errPasswordMin', { min: MIN_PASSWORD_LENGTH }) : '');
const VALIDATORS = { email: validateEmail, password: validatePassword };
const NO_ERRORS = { email: '', password: '', general: '', generalKey: '' };

function Login({ darkMode = false }) {
  const language = useAppLanguage();
  const t = getT(language);
  const font = useLangFont(language);
  const isAr = language === 'ar';
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState(NO_ERRORS);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [renewalData, setRenewalData] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(() => readThrottle().until);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((readThrottle().until - Date.now()) / 1000)));
  const [googleError] = useState(readGoogleError);
  const googleErrorShown = useRef(false);
  const submittingRef = useRef(false);
  const abortRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => { ensureNbFont(); }, []);
  useEffect(() => { document.title = t('pageTitle'); }, [t]);
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (lockedUntil <= Date.now()) { setSecondsLeft(0); return undefined; }
    let id;
    const tick = () => {
      const s = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s === 0) { clearInterval(id); clearThrottle(); }
    };
    id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [lockedUntil]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: VALIDATORS[name](value, t), general: '', generalKey: '' }));
  }, [t]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: VALIDATORS[name](value, t) }));
  }, [t]);

  const checkSubscription = useCallback(async (email, signal) => {
    try {
      const { data } = await api.get(`/api/subscriptions/renew/status/${encodeURIComponent(email)}`, { signal });
      return checkLatestSubscription(data ? [data] : []);
    } catch (err) {
      if (!isCanceled(err)) console.warn('Subscription check failed:', err?.response?.status, err?.response?.data);
      return { expired: true, shopId: null };
    }
  }, []);

  const registerFailedAttempt = useCallback(() => {
    const count = readThrottle().count + 1;
    if (count >= MAX_FAILED_ATTEMPTS) {
      const until = Date.now() + LOCK_SECONDS * 1000;
      writeThrottle({ count: 0, until });
      setLockedUntil(until);
    } else {
      writeThrottle({ count, until: 0 });
    }
  }, []);

  /* Shared by the password login and the Google return: the session is already stored (applySession),
     so this only decides where the person goes next. */
  const afterLogin = useCallback(async (session, shopId, signal) => {
    const redirectPath = redirectFor(session.roles, '/dashboard');

    if (session.email && session.roles.some((r) => SHOP_ROLES.has(r))) {
      const sub = await checkSubscription(session.email, signal);
      if (signal.aborted) return;
      if (sub.expired || sub.isPending) {
        setRenewalData({ shopId: sub.shopId || shopId || null, shopEmail: session.email, accessToken: session.token, redirectPath, isPending: sub.isPending });
        return;
      }
    }

    toast({ icon: 'success', title: t('welcomeBack'), timer: 2000 });
    await new Promise((resolve) => setTimeout(resolve, SUCCESS_DELAY_MS));
    if (signal.aborted) return;
    navigate(redirectPath);
  }, [navigate, checkSubscription, t]);

  const showGeneralError = useCallback((raw) => {
    const { key, message } = parseError(raw, t);
    setErrors((p) => ({ ...p, general: message, generalKey: key }));
    toast({ icon: 'error', title: t('signInFailed'), text: message, timer: 3000 });
  }, [t]);

  /* Google failed on the backend: it sent us back here with ?error=... */
  useEffect(() => {
    if (!googleError || googleErrorShown.current) return;
    googleErrorShown.current = true;
    clearGoogleMark();
    try { window.history.replaceState(null, '', window.location.pathname); } catch { }
    showGeneralError(googleError);
  }, [googleError, showGeneralError]);

  /* Google succeeded: the backend set its cookies and sent us back. Trade them for the access token.
     recoverGoogleSession() does nothing (no request) unless this tab really just came from the Google button. */
  useEffect(() => {
    if (googleError || !hasGoogleMark()) return undefined;
    const controller = new AbortController();
    setLoading(true);
    recoverGoogleSession()
      .then((session) => (session && !controller.signal.aborted ? afterLogin(session, null, controller.signal) : undefined))
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [googleError, afterLogin]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (readThrottle().until > Date.now()) return;
    setTouched({ email: true, password: true });
    const ee = validateEmail(formData.email, t);
    const pe = validatePassword(formData.password, t);
    if (ee || pe) { setErrors({ ...NO_ERRORS, email: ee, password: pe }); return; }

    submittingRef.current = true;
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    setLoading(true);
    setErrors(NO_ERRORS);

    try {
      const res = await api.post('/api/auth/login', { email: formData.email.trim(), password: formData.password }, { signal });
      if (!res.data?.access_token) throw new Error('Missing access token');

      const session = applySession({ ...res.data, email: res.data.email ?? formData.email.trim() });
      if (!session) throw new Error('Invalid token');

      clearThrottle();
      await afterLogin(session, res.data.shopId || res.data.shop?.id, signal);
    } catch (err) {
      if (isCanceled(err)) return;
      const raw = err.response?.data?.message || err.message || '';
      const { key, message, isExpired } = parseError(raw, t);

      if (isExpired) {
        const shopId = err.response?.data?.shopId || err.response?.data?.shop?.id || err.response?.data?.id || null;
        const accessToken = err.response?.data?.access_token || null;
        const checkEmail = formData.email?.trim();
        const isPending = checkEmail ? (await checkSubscription(checkEmail, signal)).isPending : false;
        setRenewalData({ shopId, shopEmail: checkEmail, accessToken, redirectPath: '/shop/dashboard', isPending });
        return;
      }

      if (err.response) registerFailedAttempt();

      setErrors((p) => ({ ...p, general: message, generalKey: key }));
      toast({ icon: 'error', title: t('signInFailed'), text: message, timer: 3000 });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }, [formData, afterLogin, checkSubscription, registerFailedAttempt, t]);

  const closeForgot = useCallback(() => setShowForgot(false), []);
  const openForgot = useCallback(() => setShowForgot(true), []);
  const closeRenewal = useCallback(() => setRenewalData(null), []);
  const togglePassword = useCallback(() => setShowPassword((p) => !p), []);

  /* Google is a plain link to the backend. We only remember that this tab left for Google. */
  const handleGoogle = useCallback((e) => {
    if (submittingRef.current || loading) { e.preventDefault(); return; }
    markGoogleSignIn();
  }, [loading]);

  const passwordToggle = useMemo(() => <EyeToggle shown={showPassword} onToggle={togglePassword} t={t} />, [showPassword, togglePassword, t]);

  const wrongCreds = WRONG_CREDS_KEYS.has(errors.generalKey);
  const locked = secondsLeft > 0;

  return (
    <div
      dir={languageDirection(language)} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} relative min-h-screen overflow-x-hidden ${isAr ? font.className : ''}`}
    >
      <style>{PAGE_CSS}</style>
      <Toaster darkMode={darkMode} />

      <header className="nb-bg fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Tech Restore" className="flex-shrink-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[color:var(--nb-accent)]">
            <img src={logo} alt="Tech Restore" className="h-9 w-auto" width={120} height={36} decoding="async" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="nb-muted hidden text-sm font-semibold sm:block">{t('noAccount')}</span>
            <Link to="/signup" className="nb-btn nb-btn-a px-4 py-2 text-xs uppercase sm:text-sm">{t('signUp')}</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 pb-10 pt-24 sm:px-6 md:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="hidden md:block">
          <div className="mx-auto max-w-lg p-6">
            <IsoIllustration type="account" tone="emerald" onGreen={false} darkMode={darkMode} className="aspect-square w-full" />
          </div>
        </div>

        <div className="anim-fade-up mx-auto w-full max-w-md space-y-6 md:mx-0">
          <div>
            <span className="nb-bar" aria-hidden="true" />
            <h1 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl">
              {t('titleBefore')}{' '}<span className="nb-ul">{t('titleAccent')}</span>
            </h1>
            <p className="mt-3 text-sm opacity-80 sm:text-base">{t('subtitle')}</p>
          </div>

          <div className="nb-card space-y-5 p-4 sm:p-6">
            {locked && <ErrorBanner message={t('lockedBanner', { s: secondsLeft })} />}
            {errors.general && !locked && <ErrorBanner message={errors.general} hint={wrongCreds ? t('wrongCredsHint') : undefined} />}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={loading}>
              <AuthInput id="login-email" label={t('emailLabel')} type="email" name="email" icon={FiMail}
                autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" disabled={loading} dir="ltr"
                value={formData.email} onChange={handleChange} onBlur={handleBlur}
                error={touched.email ? errors.email : ''} />

              <AuthInput id="login-password" label={t('passwordLabel')} type={showPassword ? 'text' : 'password'} name="password" icon={FiLock}
                autoComplete="current-password" required placeholder={t('passwordPlaceholder')} disabled={loading}
                value={formData.password} onChange={handleChange} onBlur={handleBlur}
                error={touched.password ? errors.password : ''} trailing={passwordToggle} />

              <div className="text-end">
                <button type="button" onClick={openForgot} className="nb-link text-xs sm:text-sm">{t('forgotLink')}</button>
              </div>

              <button type="submit" disabled={loading || locked} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase sm:text-base">
                {loading ? <><Spinner /> {t('signingIn')}</> : locked ? t('tryAgainIn', { s: secondsLeft }) : t('logIn')}
              </button>
            </form>

            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="nb-line h-0 flex-1 border-t-2 border-dotted" />
              <span className="nb-muted text-xs font-extrabold uppercase">{t('or')}</span>
              <span className="nb-line h-0 flex-1 border-t-2 border-dotted" />
            </div>

            <a href={GOOGLE_AUTH_URL} onClick={handleGoogle} aria-disabled={loading} className="nb-btn w-full py-3 text-sm">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={18} height={18} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              {t('google')}
            </a>

            <p className="nb-muted text-center text-sm font-semibold">
              {t('newHere')} <Link to="/signup" className="nb-link text-[color:var(--nb-ink)]">{t('createAccount')}</Link>
            </p>
          </div>
        </div>
      </main>

      {showForgot && <ForgotPasswordModal onClose={closeForgot} t={t} />}
      {renewalData && <RenewalModal shopEmail={renewalData.shopEmail} isPending={renewalData.isPending} onClose={closeRenewal} t={t} />}
    </div>
  );
}


export { queryClient };
export default memo(Login);