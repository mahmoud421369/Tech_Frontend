import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiRefreshCw, FiDollarSign,
  FiCheckCircle, FiClock, FiAlertTriangle, FiShield, FiMinus, FiPlus, FiKey, FiX,
} from 'react-icons/fi';
import api from '../common/api/api';
import queryClient from '../common/utils/queryClient';
import logo from '../common/images/tech-restore-logo.webp';
import useAuthStore from '../common/store/Auth';
import { redirectFor, canAccessArea, SHOP_ROLES } from '../common/utils/authSession';
import {
  markGoogleSignIn, recoverGoogleSession, hasGoogleMark, clearGoogleMark, applySession,
} from '../common/utils/googleSession';
import { useModalLock } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const AUTH_CSS = `
.au-root{font-family:'Poppins','Cairo',ui-sans-serif,system-ui,sans-serif;--dx:1;-webkit-text-size-adjust:100%}
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
@keyframes auFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
.au-float{animation:auFloat 5s ease-in-out infinite;will-change:transform}
@media (prefers-reduced-motion:reduce){.au-in,.au-pop,.au-fade,.au-sheet,.au-shake,.au-err,.au-float{animation:none}}
`;

const injectOnce = (key, css) => {
  if (typeof document === 'undefined' || document.querySelector(`style[data-${key}]`)) return;
  const tag = document.createElement('style');
  tag.setAttribute(`data-${key}`, '');
  tag.textContent = css;
  document.head.appendChild(tag);
};
injectOnce('auth-styles', `${EXTRAS_CSS}\n${AUTH_CSS}`);

if (typeof document !== 'undefined' && !document.querySelector('link[data-poppins]')) {
  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect';
  pre1.href = 'https://fonts.googleapis.com';
  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = 'anonymous';
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap';
  font.referrerPolicy = 'no-referrer';
  font.setAttribute('data-poppins', '');
  document.head.append(pre1, pre2, font);
}

const THEME = {
  light: '[--ink:#022c22] [--sh:#022c22] [--acc:#34d399] [--icon:#059669] [--card:#ffffff] [--field:#ffffff] [--txt:#022c22] [--mut:#4b5563] [--soft:#f3f4f6] [--page:#f9fafb] [--err:#e11d48]',
  dark: '[--ink:#000000] [--sh:#000000] [--acc:#39ff88] [--icon:#39ff88] [--card:#2a2a2a] [--field:#1e1e1e] [--txt:#ffffff] [--mut:#a3a3a3] [--soft:#1e1e1e] [--page:#141414] [--err:#fb7185]',
};

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const CARD = 'rounded-2xl border-[3px] border-[color:var(--ink)] bg-[color:var(--card)] text-[color:var(--txt)] [box-shadow:calc(var(--dx)*5px)_5px_0_0_var(--sh)] sm:[box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]';
const BTN = `inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] font-extrabold [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow,opacity] duration-150 motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*5px)_6px_0_0_var(--sh)] active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 ${FOCUS}`;
const PRIMARY = `${BTN} bg-[color:var(--acc)] text-emerald-950`;
const SECONDARY = `${BTN} bg-[color:var(--card)] text-[color:var(--txt)]`;
const ICON_BTN = `inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--card)] text-[color:var(--txt)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ${FOCUS}`;
const ICON_TILE = 'inline-flex flex-shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]';
const FIELD = 'flex h-12 items-center gap-2 rounded-lg border-2 bg-[color:var(--field)] text-[color:var(--txt)] ps-3 transition-[box-shadow,border-color,opacity] duration-150 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)]';
const OTP_BOX = `h-11 min-w-0 max-w-[2.75rem] flex-1 rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--field)] px-0 text-center text-lg font-extrabold text-[color:var(--txt)] outline-none [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[box-shadow] duration-150 sm:h-12 ${FOCUS}`;
const LINK = `inline-flex min-h-9 cursor-pointer items-center gap-1 font-bold text-[color:var(--txt)] underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 disabled:no-underline disabled:opacity-50 ${FOCUS}`;
const PANEL = 'rounded-xl border-2 border-dotted border-[color:var(--ink)] bg-[color:var(--soft)]';

const NS = { en: enTranslations.login, ar: arTranslations.login, fr: frTranslations.login };
const NS_SIGNUP = { en: enTranslations.signup, ar: arTranslations.signup, fr: frTranslations.signup };
const makeT = (ns) => {
  const cache = {};
  return (language) => (cache[language] ||= (key, vars) => {
    let s = ns[language]?.[key] || ns.en?.[key] || key;
    if (vars) for (const k in vars) s = s.split(`{{${k}}}`).join(String(vars[k]));
    return s;
  });
};
const getT = makeT(NS);
const getSignupT = makeT(NS_SIGNUP);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_RESET_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const MAX_SERVER_MSG = 200;
const MAX_EMAIL_LENGTH = 254;
const REQUEST_TIMEOUT_MS = 30_000;
const encoder = new TextEncoder();
const byteLength = (s) => encoder.encode(s || '').length;
const PRICE_PER_MONTH = 1000;
const MIN_MONTHS = 1;
const MAX_MONTHS = 12;
const API_BASE = process.env.REACT_APP_API_URL || 'https://api.tech-restore.tech';
const GOOGLE_AUTH_URL = `${API_BASE}/oauth2/authorization/google`;
const SUCCESS_DELAY_MS = 1500;

const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';
const normalizeEmail = (v) => String(v || '').trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
const clampMonths = (m) => Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, Math.trunc(Number(m)) || MIN_MONTHS));

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

const sanitize = (s) => String(s ?? '').replace(/[<>"'`]/g, '').slice(0, MAX_SERVER_MSG);

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
  const lower = String(raw || '').toLowerCase().trim();
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
  if (/duplicate|unprocessable/i.test(raw) || status === 422) return t('rnInProgress');
  if (status === 401) return t('errInvalidToken');
  if (status === 403) return t('rnForbidden');
  if (status >= 500 || /RUNTIME_ERROR|RT_001/i.test(`${raw} ${code}`) || !raw) return fallback;
  return sanitize(raw) || fallback;
};

const resetPasswordError = (v, st) => {
  if (v.length < MIN_RESET_PASSWORD_LENGTH) return st('errPasswordMin', { min: MIN_RESET_PASSWORD_LENGTH });
  if (byteLength(v) > MAX_PASSWORD_BYTES) return st('errPasswordMax', { max: MAX_PASSWORD_BYTES });
  if (/\s/.test(v)) return st('errNoSpaces');
  if (!/[a-z]/.test(v)) return st('errLower');
  if (!/[A-Z]/.test(v)) return st('errUpper');
  if (!/\d/.test(v)) return st('errNumber');
  if (!/[^A-Za-z0-9]/.test(v)) return st('errSymbol');
  return '';
};

const PAID = new Set(['PAID', 'ACTIVE', 'SETTLED', 'COMPLETED', 'SUCCESS', 'APPROVED', 'CONFIRMED', 'SUCCESSFUL']);

function checkLatestSubscription(subs) {
  if (!Array.isArray(subs) || subs.length === 0) return { expired: true, isPending: false };
  const now = Date.now();
  const status = (s) => String(s.status || '').toUpperCase();
  const pay = (s) => String(s.paymentStatus || s.payment_status || '').toUpperCase();

  const active = subs.some((s) => {
    const rawEnd = s.endDate || s.end_date || s.expiryDate;
    const end = rawEnd ? new Date(rawEnd) : null;
    return end && end.getTime() > now - 86400000 && (PAID.has(status(s)) || PAID.has(pay(s)));
  });
  if (active) return { expired: false, isPending: false };

  const pending = subs.some((s) => {
    const method = String(s.paymentMethod || s.payment_method || s.payment?.method || '').toUpperCase();
    return (status(s) === 'PENDING' || pay(s) === 'PENDING') && method === 'CASH';
  });
  return { expired: !pending, isPending: pending };
}

const readGoogleError = () => {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams(window.location.search);
  return String(p.get('error_description') || p.get('error') || '').slice(0, MAX_SERVER_MSG);
};

const useMinWidth = (px) => {
  const query = `(min-width:${px}px)`;
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

const Spinner = () => <span aria-hidden="true" className="inline-block h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />;

const GoogleIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="flex-shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
));

const LoginIllustration = memo(() => (
  <svg viewBox="0 0 480 480" aria-hidden="true" focusable="false" className="aspect-square w-full">
    <circle cx="240" cy="250" r="205" className="fill-[color:var(--acc)] opacity-15" />
    <circle cx="240" cy="250" r="160" className="fill-none stroke-[color:var(--ink)] opacity-25" strokeWidth="2" strokeDasharray="3 11" strokeLinecap="round" />

    <g className="au-float">
      <rect x="100" y="86" width="290" height="330" rx="28" className="fill-[color:var(--ink)]" />
      <rect x="90" y="76" width="290" height="330" rx="28" className="fill-[color:var(--card)] stroke-[color:var(--ink)]" strokeWidth="4" />

      <circle cx="122" cy="106" r="6" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="2" />
      <circle cx="142" cy="106" r="6" className="fill-[color:var(--soft)] stroke-[color:var(--ink)]" strokeWidth="2" />
      <circle cx="162" cy="106" r="6" className="fill-[color:var(--soft)] stroke-[color:var(--ink)]" strokeWidth="2" />
      <path d="M90 128H380" className="stroke-[color:var(--ink)]" strokeWidth="3" />

      <circle cx="235" cy="186" r="36" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="3" />
      <circle cx="235" cy="177" r="11" className="fill-[color:var(--card)] stroke-[color:var(--ink)]" strokeWidth="3" />
      <path d="M213 210C217 191 253 191 257 210" className="fill-[color:var(--card)] stroke-[color:var(--ink)]" strokeWidth="3" strokeLinecap="round" />

      <rect x="118" y="240" width="234" height="40" rx="12" className="fill-[color:var(--field)] stroke-[color:var(--ink)]" strokeWidth="3" />
      <rect x="132" y="252" width="20" height="16" rx="3" className="fill-none stroke-[color:var(--ink)]" strokeWidth="2.5" />
      <path d="M133 254L142 262L151 254" className="fill-none stroke-[color:var(--ink)]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="166" y="257" width="100" height="6" rx="3" className="fill-[color:var(--ink)] opacity-25" />

      <rect x="118" y="292" width="234" height="40" rx="12" className="fill-[color:var(--field)] stroke-[color:var(--ink)]" strokeWidth="3" />
      <rect x="133" y="309" width="18" height="13" rx="3" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="2.5" />
      <path d="M137 309V305a5 5 0 0 1 10 0V309" className="fill-none stroke-[color:var(--ink)]" strokeWidth="2.5" strokeLinecap="round" />
      {[172, 188, 204, 220, 236].map((cx) => <circle key={cx} cx={cx} cy="312" r="3.5" className="fill-[color:var(--ink)]" />)}

      <rect x="118" y="348" width="234" height="44" rx="14" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="3" />
      <rect x="193" y="366" width="84" height="8" rx="4" className="fill-[color:var(--ink)] opacity-80" />
    </g>

    <g transform="translate(396 112)">
      <g className="au-float" style={{ animationDelay: '-1.4s' }}>
        <path d="M0 -40L34 -26V6C34 27 17 40 0 47C-17 40 -34 27 -34 6V-26Z" transform="translate(6 6)" className="fill-[color:var(--ink)]" />
        <path d="M0 -40L34 -26V6C34 27 17 40 0 47C-17 40 -34 27 -34 6V-26Z" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="4" strokeLinejoin="round" />
        <path d="M-13 4L-4 14L14 -9" className="fill-none stroke-[color:var(--ink)]" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>

    <g transform="translate(78 378)">
      <g className="au-float" style={{ animationDelay: '-2.6s' }}>
        <circle cx="5" cy="5" r="36" className="fill-[color:var(--ink)]" />
        <circle r="36" className="fill-[color:var(--card)] stroke-[color:var(--ink)]" strokeWidth="4" />
        <circle r="15" className="fill-none stroke-[color:var(--ink)]" strokeWidth="8" strokeDasharray="7.85 7.85" />
        <circle r="10" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="3" />
      </g>
    </g>

    <g transform="translate(412 340)">
      <g className="au-float" style={{ animationDelay: '-3.6s' }}>
        <rect x="-23" y="-43" width="56" height="96" rx="13" className="fill-[color:var(--ink)]" />
        <rect x="-28" y="-48" width="56" height="96" rx="13" className="fill-[color:var(--card)] stroke-[color:var(--ink)]" strokeWidth="4" />
        <rect x="-20" y="-36" width="40" height="62" rx="7" className="fill-[color:var(--soft)]" />
        <circle cx="0" cy="-8" r="13" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="3" />
        <path d="M-6 -8L-2 -4L6 -13" className="fill-none stroke-[color:var(--ink)]" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="-8" y="35" width="16" height="4" rx="2" className="fill-[color:var(--ink)]" />
      </g>
    </g>

    {[[58, 150], [432, 232], [140, 452]].map(([x, y]) => (
      <path key={`${x}-${y}`} d={`M${x} ${y - 9}V${y + 9}M${x - 9} ${y}H${x + 9}`} className="fill-none stroke-[color:var(--ink)]" strokeWidth="3" strokeLinecap="round" />
    ))}
    <circle cx="70" cy="300" r="6" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="2.5" />
    <circle cx="438" cy="440" r="5" className="fill-[color:var(--acc)] stroke-[color:var(--ink)]" strokeWidth="2.5" />
  </svg>
));

const InlineError = memo(({ message, hint }) => (
  <div role="alert" className="au-err flex items-start gap-2 text-[color:var(--err)]">
    <FiAlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0" />
    <div className="min-w-0">
      <p className="break-words text-sm font-bold leading-snug">{message}</p>
      {hint && <p className="mt-0.5 break-words text-xs font-medium leading-snug text-[color:var(--mut)]">{hint}</p>}
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
        className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-medium placeholder:opacity-60 sm:text-sm"
        {...rest}
      />
      {trailing}
    </div>
    {error && (
      <p id={`${id}-err`} className="au-err flex items-center gap-1 text-xs font-bold text-[color:var(--err)]">
        <FiAlertTriangle aria-hidden="true" className="h-3 w-3 flex-shrink-0" /><span className="min-w-0 break-words">{error}</span>
      </p>
    )}
  </div>
));

const EyeToggle = memo(({ shown, onToggle, t }) => (
  <button type="button" onClick={onToggle} aria-label={shown ? t('hidePassword') : t('showPassword')} aria-pressed={shown}
    className={`flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-[color:var(--icon)] transition-transform duration-150 active:scale-90 ${FOCUS}`}>
    {shown ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
  </button>
));

const NbModal = memo(({ onClose, icon: Icon, title, size = 'sm:max-w-md', children }) => {
  useModalLock(true, onClose);
  return (
    <div className="au-fade fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`au-sheet relative max-h-[92vh] max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-b-none pb-[env(safe-area-inset-bottom)] sm:rounded-b-2xl sm:pb-0 ${CARD} ${size}`}>
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b-[3px] border-[color:var(--ink)] bg-[color:var(--soft)] p-3 sm:p-4">
          <span className={`${ICON_TILE} h-10 w-10`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
          <h2 className="min-w-0 flex-1 truncate text-sm font-extrabold uppercase sm:text-base">{title}</h2>
          <button type="button" onClick={onClose} aria-label="×" className={ICON_BTN}><FiX className="h-4 w-4" /></button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
});

const OTP_LEN = 6;
const EMPTY_OTP = Array(OTP_LEN).fill('');

const ForgotPasswordModal = memo(({ onClose, t, st }) => {
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

  const otpCode = otp.join('');

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const nextConfig = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    return { signal: abortRef.current.signal, timeout: REQUEST_TIMEOUT_MS };
  }, []);

  const fail = useCallback((err) => {
    if (isCanceled(err)) return;
    setError(parseError(err.response?.data?.message || err.message, t).message);
  }, [t]);

  const sendCode = useCallback(async () => {
    if (busyRef.current) return;
    const clean = normalizeEmail(email);
    if (!EMAIL_REGEX.test(clean)) { setError(t('errEmailInvalid')); return; }
    busyRef.current = true;
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/forgot-password', { email: clean }, nextConfig());
      setEmail(clean); setStep('otp'); setCountdown(60);
    } catch (err) { fail(err); } finally { busyRef.current = false; setLoading(false); }
  }, [email, fail, nextConfig, t]);

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
    if (!/^\d{6}$/.test(otpCode)) { setError(t('errOtpIncomplete')); return; }
    setError(''); setStep('reset');
  }, [otpCode, t]);

  const resend = useCallback(async () => {
    if (countdown > 0 || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      await api.get('/api/auth/get-code', { params: { email }, ...nextConfig() });
      setCountdown(60); setOtp(EMPTY_OTP); setError('');
      inputsRef.current[0]?.focus();
    } catch (err) { fail(err); } finally { busyRef.current = false; setLoading(false); }
  }, [email, countdown, fail, nextConfig]);

  const resetPassword = useCallback(async () => {
    if (busyRef.current) return;
    const pwErr = resetPasswordError(newPassword, st);
    if (pwErr) { setError(pwErr); return; }
    if (newPassword !== confirmPw) { setError(t('errPasswordMismatch')); return; }
    busyRef.current = true;
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { email, otp: otpCode, newPassword, confirmPassword: confirmPw }, nextConfig());
      setNewPassword(''); setConfirmPw(''); setOtp(EMPTY_OTP);
      setStep('done');
    } catch (err) { fail(err); } finally { busyRef.current = false; setLoading(false); }
  }, [email, otpCode, newPassword, confirmPw, fail, nextConfig, t, st]);

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
              autoCapitalize="none" spellCheck={false} maxLength={MAX_EMAIL_LENGTH} dir="ltr" onChange={onEmailChange} onKeyDown={onEmailKeyDown} />
            <button type="button" onClick={sendCode} disabled={loading} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>
              {loading ? <><Spinner /> {t('sending')}</> : t('sendCode')}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="text-center text-sm font-medium text-[color:var(--mut)]">{t('codeSentTo')} <b className="break-all text-[color:var(--icon)]" dir="ltr">{email}</b></p>
            <div className="flex w-full justify-center gap-1.5 sm:gap-2" dir="ltr" onPaste={otpPaste}>
              {otp.map((d, i) => (
                <input key={i} ref={(el) => { inputsRef.current[i] = el; }} type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={1} value={d}
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
              maxLength={128} onChange={onNewPwChange} trailing={pwToggle} />
            <AuthInput id="fp-confirm" type={showPw ? 'text' : 'password'} icon={FiLock} value={confirmPw} placeholder={t('confirmPasswordPlaceholder')} autoComplete="new-password"
              maxLength={128} onChange={onConfirmChange} />
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

const RenewalModal = memo(({ shopEmail, isPending, onClose, t }) => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [view, setView] = useState(isPending ? 'pending' : 'form');
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState(MIN_MONTHS);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);
  const abortRef = useRef(null);
  const total = months * PRICE_PER_MONTH;

  useEffect(() => () => abortRef.current?.abort(), []);

  const leave = useCallback(() => { clearAuth(); onClose(); navigate('/login'); }, [clearAuth, onClose, navigate]);

  const renewCash = useCallback(async () => {
    if (submittingRef.current) return;
    if (!shopEmail) { setError(t('rnUnidentified')); return; }
    submittingRef.current = true;
    setLoading(true); setError('');
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      await api.post(
        `/api/subscriptions/renew/cash/${encodeURIComponent(shopEmail)}`,
        { months: clampMonths(months), type: 'COMMISSION' },
        { signal: abortRef.current.signal, timeout: REQUEST_TIMEOUT_MS },
      );
      setView('pending');
    } catch (err) { if (!isCanceled(err)) setError(renewalError(err, t('rnCashFailed'), t)); }
    finally { submittingRef.current = false; setLoading(false); }
  }, [shopEmail, months, t]);

  const decMonths = useCallback(() => setMonths((m) => Math.max(MIN_MONTHS, m - 1)), []);
  const incMonths = useCallback(() => setMonths((m) => Math.min(MAX_MONTHS, m + 1)), []);

  const titles = { form: t('rnTitleForm'), pending: t('rnTitlePending') };

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
              <li className="flex items-start gap-2"><FiCheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[color:var(--icon)]" /> <span className="min-w-0">{t('rnPendingNote1')}</span></li>
              <li className="flex items-start gap-2"><FiCheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[color:var(--icon)]" /> <span className="min-w-0">{t('rnPendingNote2')}</span></li>
            </ul>
            <button type="button" onClick={leave} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>{t('backToLogin')}</button>
          </div>
        )}

        {view === 'form' && (
          <div className="space-y-4">
            {error && <InlineError message={error} />}

            <div className={`${PANEL} p-3.5 sm:p-4`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--mut)]">{t('rnFee')}</span>
                <FiShield aria-hidden="true" className="h-4 w-4 text-[color:var(--icon)]" />
              </div>
              <div className="flex flex-col items-stretch gap-3 min-[400px]:flex-row min-[400px]:items-end min-[400px]:justify-between">
                <p className="min-w-0 text-3xl font-extrabold tabular-nums tracking-tight"><span dir="ltr">{total.toLocaleString()}</span> <span className="text-sm font-semibold text-[color:var(--mut)]">{t('currency')}</span></p>
                <div className="inline-flex items-center self-start rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--field)] text-[color:var(--txt)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] min-[400px]:self-auto">
                  <button type="button" aria-label={t('rnFewer')} onClick={decMonths} disabled={months <= MIN_MONTHS} className={`flex h-11 w-11 cursor-pointer items-center justify-center transition-transform duration-150 active:scale-90 disabled:opacity-40 sm:h-10 sm:w-10 ${FOCUS}`}><FiMinus className="h-4 w-4" /></button>
                  <div className="min-w-[2.5rem] px-1 text-center" aria-live="polite">
                    <p className="text-sm font-extrabold leading-none">{months}</p>
                    <p className="text-[8px] font-extrabold uppercase text-[color:var(--mut)]">{t('rnMonthShort')}</p>
                  </div>
                  <button type="button" aria-label={t('rnMore')} onClick={incMonths} disabled={months >= MAX_MONTHS} className={`flex h-11 w-11 cursor-pointer items-center justify-center transition-transform duration-150 active:scale-90 disabled:opacity-40 sm:h-10 sm:w-10 ${FOCUS}`}><FiPlus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <div className={`${PANEL} flex items-center gap-3 p-3`}>
              <span className={`${ICON_TILE} h-10 w-10`}><FiDollarSign aria-hidden="true" className="h-5 w-5" /></span>
              <span className="min-w-0 text-sm font-extrabold uppercase">{t('payCash')}</span>
            </div>

            <button type="button" onClick={renewCash} disabled={loading} className={`${PRIMARY} w-full justify-center px-4 py-3 text-sm uppercase`}>
              {loading ? <Spinner /> : t('rnSendCash')}
            </button>
          </div>
        )}
      </div>
    </NbModal>
  );
});

const validateEmail = (v, t) => (!v.trim() ? t('errEmailRequired') : !EMAIL_REGEX.test(v.trim()) ? t('errEmailInvalid') : '');
const validatePassword = (v, t) => (!v ? t('errPasswordRequired') : '');
const VALIDATORS = { email: validateEmail, password: validatePassword };
const NO_ERRORS = { email: '', password: '', general: '', generalKey: '' };

function Login({ darkMode = false }) {
  const language = useAppLanguage();
  const t = getT(language);
  const st = getSignupT(language);
  const isAr = language === 'ar';
  const showArt = useMinWidth(768);
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
    if (!VALIDATORS[name]) return;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: VALIDATORS[name](value, t), general: '', generalKey: '' }));
  }, [t]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    if (!VALIDATORS[name]) return;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: VALIDATORS[name](value, t) }));
  }, [t]);

  const checkSubscription = useCallback(async (email, signal) => {
    try {
      const { data } = await api.get(`/api/subscriptions/renew/status/${encodeURIComponent(email)}`, { signal, timeout: REQUEST_TIMEOUT_MS });
      return checkLatestSubscription(data ? [data] : []);
    } catch {
      return { expired: true, isPending: false };
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

  const clearPassword = useCallback(() => setFormData((p) => (p.password ? { ...p, password: '' } : p)), []);

  const afterLogin = useCallback(async (session, signal) => {
    const redirectPath = canAccessArea(session.roles, 'admin') ? '/admin/dashboard' : redirectFor(session.roles, '/dashboard');

    if (session.email && session.roles.some((r) => SHOP_ROLES.has(r))) {
      const sub = await checkSubscription(session.email, signal);
      if (signal.aborted) return;
      if (sub.expired || sub.isPending) {
        setRenewalData({ shopEmail: session.email, isPending: sub.isPending });
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
    abortRef.current = controller;
    setLoading(true);
    recoverGoogleSession()
      .then((session) => (session && !controller.signal.aborted ? afterLogin(session, controller.signal) : undefined))
      .catch(() => { })
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

    const email = normalizeEmail(formData.email);

    submittingRef.current = true;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    setLoading(true);
    setErrors(NO_ERRORS);

    try {
      const res = await api.post('/api/auth/login', { email, password: formData.password }, { signal, timeout: REQUEST_TIMEOUT_MS });
      if (!res.data?.access_token) throw new Error('Missing access token');

      const session = applySession({ ...res.data, email: res.data.email ?? email });
      if (!session) throw new Error('Invalid token');

      clearThrottle();
      clearPassword();
      await afterLogin(session, signal);
    } catch (err) {
      if (isCanceled(err)) return;
      const raw = err.response?.data?.message || err.message || '';
      const { key, message, isExpired } = parseError(raw, t);

      if (isExpired) {
        const isPending = email ? (await checkSubscription(email, signal)).isPending : false;
        clearPassword();
        setRenewalData({ shopEmail: email, isPending });
        return;
      }

      if (err.response) registerFailedAttempt();

      setErrors((p) => ({ ...p, general: message, generalKey: key }));
      toast({ icon: 'error', title: t('signInFailed'), text: message, timer: 3000 });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }, [formData, afterLogin, checkSubscription, registerFailedAttempt, clearPassword, t]);

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
      className={`au-root au-pattern ${darkMode ? 'au-pattern-dark' : ''} ${THEME[darkMode ? 'dark' : 'light']} relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-[color:var(--page)] text-[color:var(--txt)]`}
    >
      <Toaster darkMode={darkMode} />

      <header className="fixed inset-x-0 top-0 z-40 bg-[color:var(--page)] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Tech Restore" className={`flex-shrink-0 rounded-md ${FOCUS}`}>
            <img src={logo} alt="Tech Restore" className="h-8 w-auto sm:h-9" width={120} height={36} decoding="async" fetchpriority="high" />
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm font-semibold text-[color:var(--mut)] sm:block">{t('noAccount')}</span>
            <Link to="/signup" className={`${PRIMARY} flex-shrink-0 justify-center px-3 py-2 text-xs uppercase sm:px-4 sm:text-sm`}>{t('signUp')}</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-screen min-h-[100dvh] max-w-6xl items-center gap-8 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-[calc(6rem+env(safe-area-inset-top))] md:grid-cols-2 lg:gap-14 lg:px-8">
        {showArt && (
          <div className="au-in">
            <div className="mx-auto max-w-sm p-2 lg:max-w-lg lg:p-6">
              <LoginIllustration />
            </div>
          </div>
        )}

        <div className="mx-auto w-full min-w-0 max-w-md space-y-5 sm:space-y-6 md:mx-0">
          <div className="au-in">
            <h1 className={`break-words text-[1.75rem] font-extrabold [text-wrap:balance] sm:text-4xl lg:text-5xl ${isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.15] tracking-[-0.04em]'}`}>
              {t('titleBefore')}{' '}<span className={darkMode ? 'au-hl-dark' : 'au-hl'}>{t('titleAccent')}</span>
            </h1>
            <p className="mt-3 text-sm font-medium leading-relaxed text-[color:var(--mut)] sm:mt-4 sm:text-lg">{t('subtitle')}</p>
          </div>

          <div style={{ '--i': 1 }} className={`au-in space-y-5 p-4 sm:p-6 ${CARD}`}>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={loading}>
              <AuthInput id="login-email" label={t('emailLabel')} type="email" name="email" icon={FiMail}
                autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" disabled={loading} dir="ltr"
                maxLength={MAX_EMAIL_LENGTH} value={formData.email} onChange={handleChange} onBlur={handleBlur}
                error={touched.email ? errors.email : ''} />

              <AuthInput id="login-password" label={t('passwordLabel')} type={showPassword ? 'text' : 'password'} name="password" icon={FiLock}
                autoComplete="current-password" required placeholder={t('passwordPlaceholder')} disabled={loading}
                maxLength={128} value={formData.password} onChange={handleChange} onBlur={handleBlur}
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

            <a href={GOOGLE_AUTH_URL} onClick={handleGoogle} rel="noopener noreferrer" aria-disabled={loading} className={`${SECONDARY} w-full justify-center px-4 py-3 text-sm`}>
              <GoogleIcon />
              {t('google')}
            </a>

            <p className="text-center text-sm font-semibold text-[color:var(--mut)]">
              {t('newHere')} <Link to="/signup" className={LINK}>{t('createAccount')}</Link>
            </p>
          </div>
        </div>
      </main>

      {showForgot && <ForgotPasswordModal onClose={closeForgot} t={t} st={st} />}
      {renewalData && <RenewalModal shopEmail={renewalData.shopEmail} isPending={renewalData.isPending} onClose={closeRenewal} t={t} />}
    </div>
  );
}

export { queryClient };
export default memo(Login);