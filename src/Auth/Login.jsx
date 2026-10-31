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
import {
  markGoogleSignIn, recoverGoogleSession, hasGoogleMark, clearGoogleMark, applySession,
} from '../common/utils/googleSession';
import { useModalLock } from '../components/user/ListingKit';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const AUTH_CSS = `
.au-root{--dx:1}
.au-root[dir=rtl]{--dx:-1}
.au-root select option{background:var(--card);color:var(--txt)}
.au-pattern{--p1:rgba(4,38,26,.1);--p2:rgba(16,185,129,.1);background-image:radial-gradient(circle at 2px 2px,var(--p1) 1.6px,transparent 1.8px),repeating-linear-gradient(135deg,var(--p2) 0 2px,transparent 2px 18px);background-size:22px 22px,auto}
.au-pattern-dark{--p1:rgba(57,255,136,.12);--p2:rgba(57,255,136,.05)}
.au-hl,.au-hl-dark{padding-bottom:.2em;background-position:left bottom;background-repeat:no-repeat;background-size:100% .3em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.au-hl{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")}
.au-hl-dark{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")}
@keyframes auIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.au-in{animation:auIn .28s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*50ms)}
@keyframes auPop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.au-pop{animation:auPop .16s ease-out both}
@keyframes auFade{from{opacity:0}to{opacity:1}}
.au-fade{animation:auFade .15s ease-out both}
@keyframes auSheet{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
.au-sheet{animation:auSheet .2s cubic-bezier(.2,.8,.2,1) both}
@keyframes auShake{0%,100%{transform:none}25%{transform:translateX(-5px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}
.au-shake{animation:auShake .28s ease-in-out}
@keyframes auErr{0%{opacity:0;transform:translateX(-6px)}30%{opacity:1;transform:translateX(5px)}55%{transform:translateX(-3px)}80%{transform:translateX(2px)}100%{opacity:1;transform:none}}
.au-err{animation:auErr .3s ease-out both}
@media (prefers-reduced-motion:reduce){.au-in,.au-pop,.au-fade,.au-sheet,.au-shake,.au-err{animation:none}}
`;

const injectOnce = (key, css) => {
  if (typeof document === 'undefined' || document.querySelector(`style[data-${key}]`)) return;
  const tag = document.createElement('style');
  tag.setAttribute(`data-${key}`, '');
  tag.textContent = css;
  document.head.appendChild(tag);
};
injectOnce('auth-styles', `${EXTRAS_CSS}\n${AUTH_CSS}`);

const THEME = {
  light: '[--ink:#022c22] [--sh:#022c22] [--acc:#34d399] [--icon:#059669] [--card:#ffffff] [--field:#ffffff] [--txt:#022c22] [--mut:#4b5563] [--soft:#f3f4f6] [--page:#f9fafb] [--err:#e11d48]',
  dark: '[--ink:#000000] [--sh:#000000] [--acc:#39ff88] [--icon:#39ff88] [--card:#2a2a2a] [--field:#1e1e1e] [--txt:#ffffff] [--mut:#a3a3a3] [--soft:#1e1e1e] [--page:#141414] [--err:#fb7185]',
};

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const CARD = 'rounded-2xl border-[3px] border-[color:var(--ink)] bg-[color:var(--card)] text-[color:var(--txt)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]';
const BTN = `inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] font-extrabold [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow,opacity] duration-150 motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*5px)_6px_0_0_var(--sh)] active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 ${FOCUS}`;
const PRIMARY = `${BTN} bg-[color:var(--acc)] text-emerald-950`;
const SECONDARY = `${BTN} bg-[color:var(--card)] text-[color:var(--txt)]`;
const ICON_BTN = `inline-flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--card)] text-[color:var(--txt)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ${FOCUS}`;
const ICON_TILE = 'inline-flex flex-shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]';
const FIELD = `flex h-12 items-center gap-2 rounded-lg border-2 bg-[color:var(--field)] text-[color:var(--txt)] ps-3 transition-[box-shadow,border-color,opacity] duration-150 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)]`;
const OTP_BOX = `h-12 w-10 rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--field)] px-0 text-center text-lg font-extrabold text-[color:var(--txt)] outline-none [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[box-shadow] duration-150 sm:w-11 ${FOCUS}`;
const LINK = `inline-flex min-h-9 cursor-pointer items-center gap-1 font-bold text-[color:var(--txt)] underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 disabled:no-underline disabled:opacity-50 ${FOCUS}`;
const PANEL = 'rounded-xl border-2 border-dotted border-[color:var(--ink)] bg-[color:var(--soft)]';

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
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.tech-restore.tech';
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

const readGoogleError = () => {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams(window.location.search);
  return p.get('error_description') || p.get('error') || '';
};

const Spinner = () => <span aria-hidden="true" className="inline-block h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />;

const InlineError = memo(({ message, hint }) => (
  <div role="alert" className="au-err flex items-start gap-2 text-[color:var(--err)]">
    <FiAlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-sm font-bold leading-snug">{message}</p>
      {hint && <p className="mt-0.5 text-xs font-medium leading-snug text-[color:var(--mut)]">{hint}</p>}
    </div>
  </div>
));

const LockMeter = memo(({ seconds, text }) => (
  <div role="status" aria-live="polite" className="au-pop space-y-2">
    <p className="flex items-center gap-2 text-sm font-bold text-[color:var(--err)]">
      <FiClock aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
      <span className="min-w-0">{text}</span>
    </p>
    <div aria-hidden="true" className="h-2.5 w-full overflow-hidden rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--soft)]">
      <div
        className="h-full origin-left bg-[color:var(--err)] transition-transform duration-1000 ease-linear rtl:origin-right motion-reduce:transition-none"
        style={{ transform: `scaleX(${Math.min(1, seconds / LOCK_SECONDS)})` }}
      />
    </div>
  </div>
));

const AuthInput = memo(({ id, label, icon: Icon, error, trailing, ...rest }) => (
  <div className="space-y-1.5">
    {label && <label htmlFor={id} className="block text-xs font-extrabold uppercase tracking-wide">{label}</label>}
    <div
      className={`${FIELD} ${trailing ? 'pe-2' : 'pe-3'} ${rest.disabled ? 'opacity-60' : ''} ${
        error
          ? 'au-shake border-[color:var(--err)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--err)]'
          : 'border-[color:var(--ink)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]'
      }`}
    >
      {Icon && <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--icon)]" />}
      <input
        id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
        {...rest}
      />
      {trailing}
    </div>
    {error && (
      <p id={`${id}-err`} className="au-err flex items-center gap-1 text-xs font-bold text-[color:var(--err)]">
        <FiAlertTriangle aria-hidden="true" className="h-3 w-3 flex-shrink-0" />{error}
      </p>
    )}
  </div>
));

const EyeToggle = memo(({ shown, onToggle, t }) => (
  <button type="button" onClick={onToggle} aria-label={shown ? t('hidePassword') : t('showPassword')} aria-pressed={shown}
    className={`flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-[color:var(--icon)] transition-transform duration-150 active:scale-90 ${FOCUS}`}>
    {shown ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
  </button>
));

const NbModal = memo(({ onClose, icon: Icon, title, size = 'sm:max-w-md', children }) => {
  useModalLock(true, onClose);
  return (
    <div className="au-fade fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`au-sheet relative max-h-[92vh] w-full overflow-y-auto overscroll-contain ${CARD} ${size}`}>
        <div className="flex items-center gap-3 border-b-[3px] border-[color:var(--ink)] bg-[color:var(--soft)] p-4">
          <span className={`${ICON_TILE} h-10 w-10`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
          <h2 className="min-w-0 flex-1 truncate text-base font-extrabold uppercase">{title}</h2>
          <button type="button" onClick={onClose} aria-label="×" className={ICON_BTN}><FiX className="h-4 w-4" /></button>
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
      <div key={step} className="au-pop space-y-4">
        {step !== 'email' && step !== 'done' && (
          <button type="button" onClick={back} className={`${LINK} text-xs`}><FiArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {t('back')}</button>
        )}
        {error && <InlineError message={error} />}

        {step === 'email' && (
          <>
            <p className="text-sm font-medium text-[color:var(--mut)]">{t('fpEmailHelp')}</p>
            <AuthInput id="fp-email" type="email" icon={FiMail} value={email} placeholder="you@example.com" autoComplete="email"
              autoCapitalize="none" spellCheck={false} dir="ltr" onChange={onEmailChange} onKeyDown={onEmailKeyDown} />
            <button type="button" onClick={sendCode} disabled={loading} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>
              {loading ? <><Spinner /> {t('sending')}</> : t('sendCode')}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="text-center text-sm font-medium text-[color:var(--mut)]">{t('codeSentTo')} <b className="break-all text-[color:var(--icon)]" dir="ltr">{email}</b></p>
            <div className="flex justify-center gap-1.5 sm:gap-2" dir="ltr" onPaste={otpPaste}>
              {otp.map((d, i) => (
                <input key={i} ref={(el) => { inputsRef.current[i] = el; }} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={1} value={d}
                  aria-label={t('digit', { n: i + 1 })} autoFocus={i === 0}
                  onChange={(e) => changeOtp(i, e.target.value)} onKeyDown={(e) => otpKeyDown(i, e)}
                  className={OTP_BOX} />
              ))}
            </div>
            <button type="button" onClick={nextFromOtp} disabled={otpCode.length !== OTP_LEN} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>{t('next')}</button>
            <button type="button" onClick={resend} disabled={countdown > 0 || loading} className={`${LINK} w-full justify-center text-sm`}>
              <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              {countdown > 0 ? t('resendIn', { s: countdown }) : t('resendCode')}
            </button>
          </>
        )}

        {step === 'reset' && (
          <>
            <p className="text-sm font-medium text-[color:var(--mut)]">{t('fpNewHelp')}</p>
            <AuthInput id="fp-new" type={showPw ? 'text' : 'password'} icon={FiLock} value={newPassword} placeholder={t('newPasswordPlaceholder')} autoComplete="new-password"
              onChange={onNewPwChange} trailing={pwToggle} />
            <AuthInput id="fp-confirm" type={showPw ? 'text' : 'password'} icon={FiLock} value={confirmPw} placeholder={t('confirmPasswordPlaceholder')} autoComplete="new-password"
              onChange={onConfirmChange} />
            <button type="button" onClick={resetPassword} disabled={loading} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>
              {loading ? <><Spinner /> {t('resetting')}</> : t('resetPassword')}
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="space-y-4 py-2 text-center">
            <span className={`${ICON_TILE} mx-auto h-16 w-16`}><FiCheckCircle className="h-8 w-8" /></span>
            <div>
              <p className="font-extrabold uppercase">{t('fpDoneTitle')}</p>
              <p className="mt-1 text-sm font-medium text-[color:var(--mut)]">{t('fpDoneText')}</p>
            </div>
            <button type="button" onClick={onClose} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>{t('backToSignIn')}</button>
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
      <div key={view} className="au-pop">
        {view === 'pending' && (
          <div className="space-y-4 text-center">
            <span className={`${ICON_TILE} mx-auto h-16 w-16`}><FiClock className="h-8 w-8" /></span>
            <div>
              <h4 className="text-lg font-extrabold uppercase">{t('rnRequestReceived')}</h4>
              <p className="mt-1 text-sm font-medium text-[color:var(--mut)]">{t('rnPendingText')}</p>
            </div>
            <ul className={`${PANEL} space-y-1.5 p-3.5 text-start text-xs font-semibold`}>
              <li className="flex items-center gap-2"><FiCheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--icon)]" /> {t('rnPendingNote1')}</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--icon)]" /> {t('rnPendingNote2')}</li>
            </ul>
            <button type="button" onClick={leave} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>{t('backToLogin')}</button>
          </div>
        )}

        {view === 'form' && (
          <div className="space-y-4">
            {error && <InlineError message={error} />}

            <div className={`${PANEL} p-4`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--mut)]">{t('rnFee')}</span>
                <FiShield aria-hidden="true" className="h-4 w-4 text-[color:var(--icon)]" />
              </div>
              <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-extrabold tabular-nums tracking-tight"><span dir="ltr">{total.toLocaleString()}</span> <span className="text-sm font-semibold text-[color:var(--mut)]">{t('currency')}</span></p>
                <div className="inline-flex items-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--field)] text-[color:var(--txt)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]">
                  <button type="button" aria-label={t('rnFewer')} onClick={decMonths} disabled={months <= 1} className={`flex h-9 w-9 cursor-pointer items-center justify-center transition-transform duration-150 active:scale-90 disabled:opacity-40 ${FOCUS}`}><FiMinus className="h-4 w-4" /></button>
                  <div className="min-w-[2.5rem] px-1 text-center" aria-live="polite">
                    <p className="text-sm font-extrabold leading-none">{months}</p>
                    <p className="text-[8px] font-extrabold uppercase text-[color:var(--mut)]">{t('rnMonthShort')}</p>
                  </div>
                  <button type="button" aria-label={t('rnMore')} onClick={incMonths} disabled={months >= 12} className={`flex h-9 w-9 cursor-pointer items-center justify-center transition-transform duration-150 active:scale-90 disabled:opacity-40 ${FOCUS}`}><FiPlus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('rnPaymentMethod')}>
              {PAYMENT_METHODS.map(([k, labelKey, Icon]) => (
                <button key={k} type="button" role="radio" aria-checked={method === k} onClick={() => setMethod(k)}
                  className={`${method === k ? PRIMARY : SECONDARY} flex-col justify-center gap-1.5 p-3 text-xs uppercase`}>
                  <Icon aria-hidden="true" className="h-5 w-5" /> {t(labelKey)}
                </button>
              ))}
            </div>

            <button type="button" onClick={method === 'card' ? renewCard : renewCash} disabled={loading} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>
              {loading ? <Spinner /> : method === 'card' ? t('rnPayCard') : t('rnSendCash')}
            </button>
          </div>
        )}

        {view === 'redirect' && (
          <div className="space-y-4 py-4 text-center">
            <span className={`${ICON_TILE} mx-auto h-16 w-16`}><FiRefreshCw className="h-8 w-8 animate-spin motion-reduce:animate-none" /></span>
            <div>
              <h4 className="text-lg font-extrabold uppercase">{t('rnRedirecting')}</h4>
              <p className="mt-1 text-sm font-medium text-[color:var(--mut)]">{t('rnHold')}</p>
            </div>
            <p className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[color:var(--icon)]"><Spinner /> {t('rnWait')}</p>
          </div>
        )}
      </div>
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

  useEffect(() => {
    if (!googleError || googleErrorShown.current) return;
    googleErrorShown.current = true;
    clearGoogleMark();
    try { window.history.replaceState(null, '', window.location.pathname); } catch { }
    showGeneralError(googleError);
  }, [googleError, showGeneralError]);

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

  const handleGoogle = useCallback((e) => {
    if (submittingRef.current || loading) { e.preventDefault(); return; }
    markGoogleSignIn();
  }, [loading]);

  const passwordToggle = useMemo(() => <EyeToggle shown={showPassword} onToggle={togglePassword} t={t} />, [showPassword, togglePassword, t]);

  const wrongCreds = WRONG_CREDS_KEYS.has(errors.generalKey);
  const locked = secondsLeft > 0;

  return (
    <div
      dir={languageDirection(language)} lang={language}
      className={`au-root au-pattern ${darkMode ? 'au-pattern-dark' : ''} ${THEME[darkMode ? 'dark' : 'light']} relative min-h-screen overflow-x-hidden bg-[color:var(--page)] text-[color:var(--txt)] ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <Toaster darkMode={darkMode} />

      <header className="fixed inset-x-0 top-0 z-40 border-b-[3px] border-[color:var(--ink)] bg-[color:var(--page)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Tech Restore" className={`flex-shrink-0 rounded-md ${FOCUS}`}>
            <img src={logo} alt="Tech Restore" className="h-9 w-auto" width={120} height={36} decoding="async" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-[color:var(--mut)] sm:block">{t('noAccount')}</span>
            <Link to="/signup" className={`${PRIMARY} justify-center px-4 py-2 text-xs uppercase sm:text-sm`}>{t('signUp')}</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 pb-10 pt-24 sm:px-6 md:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="au-in hidden md:block">
          <div className="mx-auto max-w-lg p-6">
            <IsoIllustration type="account" tone="emerald" onGreen={false} darkMode={darkMode} className="aspect-square w-full" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md space-y-6 md:mx-0">
          <div className="au-in">
            <h1 className={`text-3xl font-extrabold [text-wrap:balance] sm:text-4xl lg:text-5xl ${isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.15] tracking-[-0.04em]'}`}>
              {t('titleBefore')}{' '}<span className={darkMode ? 'au-hl-dark' : 'au-hl'}>{t('titleAccent')}</span>
            </h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-[color:var(--mut)] sm:text-lg">{t('subtitle')}</p>
          </div>

          <div style={{ '--i': 1 }} className={`au-in space-y-5 p-4 sm:p-6 ${CARD}`}>
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
                <button type="button" onClick={openForgot} className={`${LINK} text-xs sm:text-sm`}>{t('forgotLink')}</button>
              </div>

              {errors.general && !locked && <InlineError message={errors.general} hint={wrongCreds ? t('wrongCredsHint') : undefined} />}

              <button type="submit" disabled={loading || locked} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase sm:text-base`}>
                {loading ? <><Spinner /> {t('signingIn')}</> : locked ? t('tryAgainIn', { s: secondsLeft }) : t('logIn')}
              </button>

              {locked && <LockMeter seconds={secondsLeft} text={t('lockedBanner', { s: secondsLeft })} />}
            </form>

            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-0 flex-1 border-t-2 border-dotted border-[color:var(--ink)] opacity-40" />
              <span className="text-xs font-extrabold uppercase text-[color:var(--mut)]">{t('or')}</span>
              <span className="h-0 flex-1 border-t-2 border-dotted border-[color:var(--ink)] opacity-40" />
            </div>

            <a href={GOOGLE_AUTH_URL} onClick={handleGoogle} aria-disabled={loading} className={`${SECONDARY} w-full justify-center px-4 py-3 text-sm`}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={18} height={18} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              {t('google')}
            </a>

            <p className="text-center text-sm font-semibold text-[color:var(--mut)]">
              {t('newHere')} <Link to="/signup" className={LINK}>{t('createAccount')}</Link>
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