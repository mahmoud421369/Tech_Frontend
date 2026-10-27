import React, {
  useState, useRef, useEffect, useCallback, memo, useMemo, useDeferredValue, useId, Suspense, lazy,
} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiSearch, FiX, FiArrowRight, FiChevronLeft, FiChevronRight, FiMapPin, FiPhone,
  FiMonitor, FiShield, FiCheckCircle, FiDollarSign, FiShoppingCart, FiCheck, FiArrowUp,
} from 'react-icons/fi';
import { RiVerifiedBadgeLine, RiStarFill, RiStoreLine, RiCookieLine } from 'react-icons/ri';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import '../common/styles/style.css';
import api from '../common/api/api';
import queryClient from '../common/utils/queryClient';
import useAuthStore from '../common/store/Auth';
import { recoverGoogleSession } from '../common/utils/googleSession';
import { redirectFor } from '../common/utils/authSession';
import { Hero } from '../components';
import {
  Defs3D, Device3DStyles, DeviceScene, Btn3D, Chip3D, useOnScreen, money,
} from '../components/user/Device3D';
import { safeImageUrl, StorefrontIllustration, loadSwal, clean, useBackToTop } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const Service = lazy(() => import('./Service'));
const OffersSlider = lazy(() => import('../components').then((m) => ({ default: m.OffersSlider })));

const HOMEPAGE_TRANSLATIONS = {
  en: enTranslations.homepage,
  ar: arTranslations.homepage || arTranslations.hero?.homepage,
  fr: frTranslations.homepage || frTranslations.hero?.homepage,
};

const LOCAL_TEXT = {
  en: { noAddress: 'No address' },
  ar: { noAddress: 'لا يوجد عنوان' },
  fr: { noAddress: 'Aucune adresse' },
};

const tr = (language, key, vars) => {
  let s =
    HOMEPAGE_TRANSLATIONS[language]?.[key] ||
    LOCAL_TEXT[language]?.[key] ||
    HOMEPAGE_TRANSLATIONS.en?.[key] ||
    LOCAL_TEXT.en[key] ||
    key;
  if (vars) for (const k in vars) s = s.split(`{{${k}}}`).join(vars[k]);
  return s;
};

const COOKIE_TEXT = {
  en: {
    title: 'We value your privacy',
    text: 'We use cookies to keep the site working, remember your preferences and understand how it is used. You can accept all, reject the optional ones, or choose what to allow.',
    acceptAll: 'Accept all',
    rejectAll: 'Reject optional',
    customize: 'Customize',
    back: 'Back',
    save: 'Save choices',
    necessary: 'Necessary',
    necessaryDesc: 'Required for sign-in, your cart and security. Always on.',
    analytics: 'Analytics',
    analyticsDesc: 'Helps us understand how the site is used so we can improve it.',
    marketing: 'Marketing',
    marketingDesc: 'Used to show you offers and content that match your interests.',
  },
  ar: {
    title: 'خصوصيتك تهمنا',
    text: 'نستخدم ملفات تعريف الارتباط لتشغيل الموقع وتذكّر تفضيلاتك وفهم كيفية استخدامه. يمكنك قبول الكل أو رفض الاختيارية أو تحديد ما تسمح به.',
    acceptAll: 'قبول الكل',
    rejectAll: 'رفض الاختيارية',
    customize: 'تخصيص',
    back: 'رجوع',
    save: 'حفظ الاختيارات',
    necessary: 'الضرورية',
    necessaryDesc: 'مطلوبة لتسجيل الدخول والسلة والأمان. مفعّلة دائمًا.',
    analytics: 'التحليلات',
    analyticsDesc: 'تساعدنا على فهم استخدام الموقع لتحسينه.',
    marketing: 'التسويق',
    marketingDesc: 'تُستخدم لعرض عروض ومحتوى يناسب اهتماماتك.',
  },
  fr: {
    title: 'Votre vie privée compte',
    text: "Nous utilisons des cookies pour faire fonctionner le site, mémoriser vos préférences et comprendre son utilisation. Vous pouvez tout accepter, refuser les cookies facultatifs ou choisir.",
    acceptAll: 'Tout accepter',
    rejectAll: 'Refuser les facultatifs',
    customize: 'Personnaliser',
    back: 'Retour',
    save: 'Enregistrer mes choix',
    necessary: 'Nécessaires',
    necessaryDesc: 'Indispensables à la connexion, au panier et à la sécurité. Toujours actifs.',
    analytics: 'Statistiques',
    analyticsDesc: "Nous aident à comprendre l'utilisation du site pour l'améliorer.",
    marketing: 'Marketing',
    marketingDesc: 'Servent à vous proposer des offres et contenus adaptés à vos intérêts.',
  },
};

const ctr = (language, key) => COOKIE_TEXT[language]?.[key] || COOKIE_TEXT.en[key] || key;

const CONSENT_KEY = 'cookieConsent';
const CONSENT_VERSION = 1;
const CONSENT_DELAY_MS = 1200;
const CONSENT_MAX_AGE = 60 * 60 * 24 * 730;

const parseConsent = (raw) => {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && v.v === CONSENT_VERSION && v.prefs ? v : null;
  } catch {
    return null;
  }
};

const readConsentCookie = () => {
  try {
    const prefix = `${CONSENT_KEY}=`;
    const hit = document.cookie.split('; ').find((c) => c.startsWith(prefix));
    return hit ? parseConsent(decodeURIComponent(hit.slice(prefix.length))) : null;
  } catch {
    return null;
  }
};

const readConsentStore = (key) => {
  try { return parseConsent(window.localStorage.getItem(key)); } catch { return null; }
};

const persistConsent = (record) => {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CONSENT_KEY}=${encodeURIComponent(JSON.stringify(record))}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch { }
  try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record)); } catch { }
};

let consentCache = null;

const readConsent = (identity) => {
  if (consentCache) return consentCache;
  const found =
    readConsentCookie() ||
    readConsentStore(CONSENT_KEY) ||
    (identity ? readConsentStore(`${CONSENT_KEY}:${identity}`) : null);
  if (found) {
    consentCache = found;
    persistConsent(found);
  }
  return found;
};

const writeConsent = (prefs) => {
  const record = {
    v: CONSENT_VERSION,
    prefs: { necessary: true, analytics: !!prefs.analytics, marketing: !!prefs.marketing },
    at: Date.now(),
  };
  consentCache = record;
  persistConsent(record);
  try { window.dispatchEvent(new CustomEvent('cookie:consent', { detail: record })); } catch { }
  return record;
};

export const getCookieConsent = () => {
  if (typeof window === 'undefined') return null;
  const { accessToken, userId, email } = useAuthStore.getState();
  return accessToken ? readConsent(userId ?? email ?? 'user') : null;
};

const NUMBER_LOCALE = { en: 'en', fr: 'fr', ar: 'ar-EG' };
const padFormats = {};
const pad2 = (language, n) => {
  const locale = NUMBER_LOCALE[language] || 'en';
  const fmt = (padFormats[locale] ||= new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }));
  return fmt.format(n);
};

const pick = (obj, key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined);

const phoneHref = (phone) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  return digits ? `tel:${digits}` : undefined;
};

const SNIPPET_MAX = 90;
const snippet = (text, max = SNIPPET_MAX) => {
  const s = String(text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const i = cut.lastIndexOf(' ');
  return `${cut.slice(0, i > max * 0.6 ? i : max).trimEnd()}…`;
};

const fold = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, '')
    .toLowerCase();

const MAX_QUERY = 60;
const sanitizeQuery = (raw) =>
  String(raw ?? '')
    .replace(/[\p{Cc}\p{Cf}<>]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, MAX_QUERY);

const safeId = (id) => {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  const s = String(id);
  return s && s.length <= 128 ? encodeURIComponent(s) : null;
};

const RAIL_LIMIT = 8;

const normalizeProduct = (p) => {
  const price = Number(p.price) || 0;
  const discount = Math.min(Math.max(Number(p.discount) || 0, 0), 100);
  return {
    ...p,
    price,
    discount,
    imageUrl: safeImageUrl(p.imageUrl),
    finalPrice: discount ? Math.round(price * (1 - discount / 100) * 100) / 100 : price,
    _text: fold(`${p.name || ''} ${p.description || ''}`),
    _snippet: snippet(p.description),
  };
};
const normalizeShop = (s) => ({
  ...s,
  services: s.services || [],
  _text: fold(`${s.name || ''} ${s.description || ''} ${s.shopAddress?.city || ''}`),
  _snippet: snippet(s.description),
  _address: [s.shopAddress?.street, s.shopAddress?.city].filter((x) => typeof x === 'string' && x.trim()).join(', '),
});

const OFFERS = [
  { id: 'o1', key: 'offerScreenRepair', Icon: FiMonitor },
  { id: 'o2', key: 'offerBattery', Icon: FiShield },
  { id: 'o3', key: 'offerDiagnostics', Icon: FiCheckCircle },
  { id: 'o4', key: 'offerAccessories', Icon: FiDollarSign },
];

const CONDITION = {
  NEW: { badge: 'bg-emerald-500', labelKey: 'conditionNew' },
  USED: { badge: 'bg-amber-500', labelKey: 'conditionUsed' },
  REFURBISHED: { badge: 'bg-sky-500', labelKey: 'conditionRefurbished' },
};

const LAZY_SECTION = '[content-visibility:auto] [contain-intrinsic-size:auto_760px]';

const DARK_PAGE = 'bg-[#141414]';

const HP_CSS = `
  .hp-hl, .hp-hl-dark {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-size: 100% 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .hp-hl      { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  @keyframes hpConsentIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  .hp-consent-in { animation: hpConsentIn 0.22s cubic-bezier(.2,.8,.2,1) both; }
  .hp-search::-webkit-search-cancel-button, .hp-search::-webkit-search-decoration { display: none; -webkit-appearance: none; }
  html[data-hp-theme] { --sb-thumb: #34d399; --sb-thumb-hover: #6ee7b7; --sb-track: #e8ebe9; --sb-ink: #022c22; }
  html[data-hp-theme="dark"] { --sb-thumb: #39ff88; --sb-thumb-hover: #86ffb4; --sb-track: #1e1e1e; --sb-ink: #000000; }
  html[data-hp-theme], .hp-sb { scrollbar-width: thin; scrollbar-color: var(--sb-thumb) var(--sb-track); }
  @supports selector(::-webkit-scrollbar) {
    html[data-hp-theme], .hp-sb { scrollbar-width: auto; scrollbar-color: auto; }
    html[data-hp-theme]::-webkit-scrollbar { width: 14px; height: 14px; }
    .hp-sb::-webkit-scrollbar { width: 10px; height: 10px; }
    html[data-hp-theme]::-webkit-scrollbar-track, .hp-sb::-webkit-scrollbar-track { background: var(--sb-track); }
    html[data-hp-theme]::-webkit-scrollbar-track:vertical, .hp-sb::-webkit-scrollbar-track:vertical { border-left: 3px solid var(--sb-ink); }
    html[data-hp-theme]::-webkit-scrollbar-track:horizontal, .hp-sb::-webkit-scrollbar-track:horizontal { border-top: 3px solid var(--sb-ink); }
    html[data-hp-theme]::-webkit-scrollbar-thumb, .hp-sb::-webkit-scrollbar-thumb { background: var(--sb-thumb); border: 3px solid var(--sb-ink); }
    html[data-hp-theme]::-webkit-scrollbar-thumb:hover, .hp-sb::-webkit-scrollbar-thumb:hover { background: var(--sb-thumb-hover); }
    html[data-hp-theme]::-webkit-scrollbar-corner, .hp-sb::-webkit-scrollbar-corner { background: var(--sb-track); }
  }
  @media (prefers-reduced-motion: reduce) { .hp-consent-in { animation: none; } }
`;
let hpStylesInjected = false;
const injectHpStylesOnce = () => {
  if (hpStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-home-styles', 'true');
  tag.textContent = HP_CSS;
  document.head.appendChild(tag);
  hpStylesInjected = true;
};
injectHpStylesOnce();

const NEO_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#022c22] [--sh:#022c22] [--acc:#34d399]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#39ff88]',
};
const NEO_SURFACE = { light: 'bg-white', dark: 'bg-[#2a2a2a]' };
const NEO_BOX = {
  lg: 'flex flex-col border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]',
  sm: 'flex flex-col border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--sh)]',
};
const NEO_PRESS =
  'transition-[transform,box-shadow] duration-150 motion-reduce:transition-none hover:translate-y-[3px] hover:translate-x-[calc(var(--dx)*3px)] ' +
  'hover:[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[color:var(--acc)]';
const neoCard = (darkMode, size = 'lg', press = false) => {
  const k = darkMode ? 'dark' : 'light';
  return `${NEO_THEME[k]} ${NEO_BOX[size]} ${NEO_SURFACE[k]}${press ? ` ${NEO_PRESS}` : ''}`;
};

const NEO_ICON =
  'inline-flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoIcon = (darkMode) => `${NEO_THEME[darkMode ? 'dark' : 'light']} ${NEO_ICON}`;

const COOKIE_BTN =
  'inline-flex w-full items-center justify-center border-[3px] border-[color:var(--ink)] px-4 py-3 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';

const MEDIA_WRAP = 'p-2.5 pb-0';
const MEDIA_BOX = 'relative overflow-hidden rounded-2xl [contain:layout_paint]';
const PRODUCT_IMG_W = 600;
const PRODUCT_IMG_H = 400;
const mediaBg = (darkMode) => (darkMode ? 'bg-[#1e1e1e]' : 'bg-white');

const splitHeading = (text) => {
  const str = String(text ?? '');
  if (str.includes('**')) return str.split('**').map((part, i) => ({ part, hl: i % 2 === 1 }));
  const m = str.match(/^(.*[,،]\s*)([^,،]+)$/);
  if (m) return [{ part: m[1], hl: false }, { part: m[2], hl: true }];
  const words = str.split(' ');
  if (words.length < 2) return [{ part: str, hl: true }];
  const n = words.length <= 3 ? 1 : 2;
  return [{ part: `${words.slice(0, -n).join(' ')} `, hl: false }, { part: words.slice(-n).join(' '), hl: true }];
};

const SectionTitle = memo(({ label, title, subtitle, darkMode, isAr, children }) => {
  const hl = darkMode ? 'hp-hl-dark' : 'hp-hl';
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-14">
      <div className="min-w-0 max-w-3xl">
        {label && (
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden="true" className={`h-3.5 w-12 border-2 ${darkMode ? 'border-[#39ff88] bg-[#39ff88]' : 'border-emerald-950 bg-emerald-400'}`} />
            <span className={`text-sm font-bold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{label}</span>
          </div>
        )}
        <h2
          className={`text-3xl font-extrabold [text-wrap:balance] sm:text-5xl lg:text-6xl ${
            isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.18] tracking-[-0.04em]'
          } ${darkMode ? 'text-white' : 'text-emerald-950'}`}
        >
          {parts.map(({ part, hl: on }, i) => (on ? <span key={i} className={hl}>{part}</span> : part))}
        </h2>
        {subtitle && (
          <p className={`mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${darkMode ? 'text-neutral-300' : 'text-gray-800'}`}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
});

const NumBadge = memo(({ n, darkMode }) => (
  <span
    aria-hidden="true"
    className={`inline-flex h-9 min-w-9 flex-shrink-0 items-center justify-center border-2 px-1.5 text-sm font-extrabold tabular-nums text-emerald-950 ${
      darkMode
        ? 'border-black bg-[#39ff88] [box-shadow:calc(var(--dx)*3px)_3px_0_0_#000]'
        : 'border-emerald-950 bg-emerald-400 [box-shadow:calc(var(--dx)*3px)_3px_0_0_#022c22]'
    }`}
  >
    {n}
  </span>
));

const CardFooter = memo(({ label, darkMode, isAr }) => (
  <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-[color:var(--ink)] pt-4">
    <span className={`truncate text-sm font-extrabold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{label}</span>
    <span aria-hidden="true" className={NEO_ICON}><FiArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
  </div>
));

const useRail = (dep) => {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ back: false, forward: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const offset = Math.abs(el.scrollLeft);
        const back = offset > 2;
        const forward = offset + el.clientWidth < el.scrollWidth - 5;
        setEdge((s) => (s.back === back && s.forward === forward ? s : { back, forward }));
      });
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [dep]);
  const scroll = useCallback((dir) => {
    const el = ref.current;
    if (!el) return;
    const rtl = window.getComputedStyle(el).direction === 'rtl';
    const sign = (dir === 'forward' ? 1 : -1) * (rtl ? -1 : 1);
    el.scrollBy({ left: sign * el.clientWidth * 0.75, behavior: 'smooth' });
  }, []);
  return { ref, ...edge, scroll };
};

const ART_COLORS = {
  light: { bd: ['#FFFFFF', '#D1D5DB'], sd: ['#34D399', '#047857'], sc: ['#6EE7B7', '#059669'] },
  dark: { bd: ['#4B4B4B', '#2C2C2C'], sd: ['#39FF88', '#17C964'], sc: ['#1F1F1F', '#0F0F0F'] },
};

const ArtDefs = ({ p, darkMode }) => {
  const c = ART_COLORS[darkMode ? 'dark' : 'light'];
  return (
    <defs>
      <linearGradient id={`${p}bd`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.bd[0]} /><stop offset="1" stopColor={c.bd[1]} /></linearGradient>
      <linearGradient id={`${p}sd`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.sd[0]} /><stop offset="1" stopColor={c.sd[1]} /></linearGradient>
      <linearGradient id={`${p}sc`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.sc[0]} /><stop offset="1" stopColor={c.sc[1]} /></linearGradient>
      <linearGradient id={`${p}am`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FDE68A" /><stop offset="1" stopColor="#F59E0B" /></linearGradient>
    </defs>
  );
};

const DEVICE_KINDS = [
  ['laptop', /laptop|notebook|macbook|computer|pc\b/i],
  ['tablet', /tablet|ipad|tab\b/i],
  ['watch', /watch|band|wearable/i],
  ['audio', /head|ear|airpod|speaker|audio|buds/i],
];
const kindOf = (text) => (DEVICE_KINDS.find(([, re]) => re.test(text)) || ['phone'])[0];

const ProductFallbackArt = memo(({ name, categoryName, label, darkMode }) => {
  const p = useId().replace(/:/g, '');
  const kind = kindOf(`${name || ''} ${categoryName || ''}`);
  const body = `url(#${p}bd)`, side = `url(#${p}sd)`, screen = `url(#${p}sc)`;
  const neon = darkMode ? '#39FF88' : '#34D399';
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full p-3" role="img" aria-label={name || label} focusable="false">
      <ArtDefs p={p} darkMode={darkMode} />
      <ellipse cx="100" cy="132" rx="62" ry="8" fill={darkMode ? '#000' : '#064E3B'} opacity={darkMode ? 0.4 : 0.16} />
      <g>
        {kind === 'phone' && (
          <g transform="translate(70 14)">
            <rect x="6" y="7" width="60" height="108" rx="13" fill={side} />
            <rect width="60" height="108" rx="13" fill={body} />
            <rect x="4" y="4" width="52" height="100" rx="10" fill={screen} />
            <path d="M4 60V14a10 10 0 0110-10h26z" fill="#fff" opacity="0.28" />
            <rect x="22" y="8" width="16" height="4" rx="2" fill="#022C22" />
            <rect x="12" y="24" width="36" height="7" rx="3.5" fill={darkMode ? neon : '#fff'} opacity="0.9" />
            <rect x="12" y="36" width="22" height="5" rx="2.5" fill="#fff" opacity="0.55" />
            <rect x="12" y="62" width="36" height="28" rx="8" fill="#fff" opacity="0.25" />
          </g>
        )}
        {kind === 'laptop' && (
          <g transform="translate(34 24)">
            <rect x="5" y="6" width="126" height="78" rx="9" fill={side} />
            <rect width="126" height="78" rx="9" fill={body} />
            <rect x="5" y="5" width="116" height="68" rx="6" fill={screen} />
            <path d="M5 44V11a6 6 0 016-6h50z" fill="#fff" opacity="0.28" />
            <rect x="14" y="14" width="46" height="7" rx="3.5" fill={darkMode ? neon : '#fff'} opacity="0.9" />
            <rect x="14" y="48" width="30" height="18" rx="5" fill="#fff" opacity="0.25" />
            <rect x="48" y="48" width="30" height="18" rx="5" fill="#fff" opacity="0.25" />
            <rect x="-10" y="88" width="146" height="12" rx="6" fill={side} />
            <rect x="-10" y="84" width="146" height="12" rx="6" fill={body} />
            <rect x="52" y="84" width="22" height="4" rx="2" fill={darkMode ? neon : '#6EE7B7'} />
          </g>
        )}
        {kind === 'tablet' && (
          <g transform="translate(46 18)">
            <rect x="6" y="6" width="100" height="100" rx="14" fill={side} />
            <rect width="100" height="100" rx="14" fill={body} />
            <rect x="5" y="5" width="90" height="90" rx="10" fill={screen} />
            <path d="M5 55V15A10 10 0 0115 5h44z" fill="#fff" opacity="0.28" />
            <rect x="16" y="18" width="40" height="8" rx="4" fill={darkMode ? neon : '#fff'} opacity="0.9" />
            <rect x="16" y="56" width="26" height="24" rx="6" fill="#fff" opacity="0.25" />
            <rect x="48" y="56" width="26" height="24" rx="6" fill="#fff" opacity="0.25" />
          </g>
        )}
        {kind === 'watch' && (
          <g transform="translate(70 6)">
            <rect x="14" y="0" width="32" height="30" rx="6" fill={side} />
            <rect x="14" y="94" width="32" height="30" rx="6" fill={side} />
            <rect x="4" y="6" width="56" height="62" rx="18" fill={side} />
            <rect y="0" width="56" height="62" rx="18" fill={body} />
            <rect x="5" y="5" width="46" height="52" rx="13" fill={screen} />
            <circle cx="28" cy="31" r="13" fill="none" stroke={darkMode ? neon : '#fff'} strokeWidth="3" opacity="0.9" />
            <path d="M28 23v8l6 4" stroke={darkMode ? neon : '#fff'} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        )}
        {kind === 'audio' && (
          <g transform="translate(40 14)">
            <path d="M12 70V52a48 48 0 0196 0v18" fill="none" stroke={side} strokeWidth="11" strokeLinecap="round" />
            <path d="M12 66V50a48 48 0 0196 0v16" fill="none" stroke={body} strokeWidth="8" strokeLinecap="round" />
            <rect x="0" y="62" width="26" height="46" rx="12" fill={side} />
            <rect x="-3" y="58" width="26" height="46" rx="12" fill={body} />
            <rect x="3" y="70" width="14" height="30" rx="7" fill={screen} />
            <rect x="94" y="62" width="26" height="46" rx="12" fill={side} />
            <rect x="97" y="58" width="26" height="46" rx="12" fill={body} />
            <rect x="103" y="70" width="14" height="30" rx="7" fill={screen} />
          </g>
        )}
      </g>
      <path d="M30 28l2.4-6 2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4z" fill={neon} opacity="0.8" />
      <circle cx="170" cy="40" r="3" fill="#FBBF24" opacity="0.85" />
    </svg>
  );
});

const RailArrows = ({ rail, darkMode, language }) => {
  if (!rail.back && !rail.forward) return null;
  const rtl = languageDirection(language) === 'rtl';
  const cls = neoIcon(darkMode);
  const btn = (dir, disabled) => {
    const left = (dir === 'back') !== rtl;
    return (
      <button
        type="button"
        onClick={() => rail.scroll(dir)}
        disabled={disabled}
        aria-label={tr(language, left ? 'scrollLeft' : 'scrollRight')}
        className={`${cls} !h-11 !w-11`}
      >
        {left ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
      </button>
    );
  };
  return <div className="flex gap-3 pb-2 pe-2">{btn('back', !rail.back)}{btn('forward', !rail.forward)}</div>;
};

const EmptyRail = memo(({ label, darkMode }) => (
  <div className={`flex flex-col items-center gap-3 border-[3px] border-dashed py-12 text-center ${darkMode ? 'border-[#39ff88]/40 bg-[#1e1e1e]' : 'border-emerald-300 bg-white/60'}`}>
    <DeviceScene compact className="h-24 w-32" />
    <p className={`text-sm font-semibold sm:text-base ${darkMode ? 'text-neutral-300' : 'text-gray-600'}`}>{label}</p>
  </div>
));

const RailSkeleton = memo(({ w, h, darkMode }) => (
  <div className="flex gap-5 overflow-hidden pb-4">
    {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`flex-shrink-0 animate-pulse ${w} ${h} ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70'}`} />)}
  </div>
));

const CookieSwitch = memo(({ checked, onChange, disabled, label, darkMode }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative h-6 w-11 flex-shrink-0 border-2 border-[color:var(--ink)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)] ${
      checked ? 'bg-[color:var(--acc)]' : darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-200'
    }`}
  >
    <span
      aria-hidden="true"
      className={`absolute start-0.5 top-0.5 h-4 w-4 border-2 border-[color:var(--ink)] bg-white transition-transform duration-150 ${
        checked ? '[transform:translateX(calc(var(--dx)*20px))]' : ''
      }`}
    />
  </button>
));

const COOKIE_OPTIONS = [
  ['necessary', 'necessary', 'necessaryDesc', true],
  ['analytics', 'analytics', 'analyticsDesc', false],
  ['marketing', 'marketing', 'marketingDesc', false],
];

const INITIAL_PREFS = { analytics: false, marketing: false };

const CookieConsent = memo(({ darkMode, language }) => {
  const identity = useAuthStore((s) => (s.accessToken ? s.userId ?? s.email ?? 'user' : null));
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [prefs, setPrefs] = useState(INITIAL_PREFS);
  const dialogRef = useRef(null);
  const primaryRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const isAr = language === 'ar';

  useEffect(() => {
    if (!identity || readConsent(identity)) {
      setOpen(false);
      return undefined;
    }
    const id = setTimeout(() => {
      if (readConsent(identity)) return;
      setCustom(false);
      setPrefs(INITIAL_PREFS);
      setOpen(true);
    }, CONSENT_DELAY_MS);
    return () => clearTimeout(id);
  }, [identity]);

  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    primaryRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll('button:not([disabled])');
      if (!nodes || !nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    };
  }, [open]);

  const decide = useCallback((choice) => {
    writeConsent(choice);
    setOpen(false);
  }, []);

  const acceptAll = useCallback(() => decide({ analytics: true, marketing: true }), [decide]);
  const rejectAll = useCallback(() => decide({ analytics: false, marketing: false }), [decide]);
  const saveChoices = useCallback(() => decide(prefs), [decide, prefs]);
  const toggleCustom = useCallback(() => setCustom((c) => !c), []);
  const togglePref = useCallback((key) => setPrefs((p) => ({ ...p, [key]: !p[key] })), []);

  if (!open) return null;

  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-300' : 'text-gray-700';
  const surface = darkMode ? 'bg-[#2a2a2a] text-white' : 'bg-white text-emerald-950';
  const primary = `${COOKIE_BTN} bg-[color:var(--acc)] text-emerald-950`;
  const secondary = `${COOKIE_BTN} ${surface}`;
  const track = isAr ? 'tracking-normal' : 'tracking-wide';
  const linkBtn = `text-center text-sm font-extrabold underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)] ${ink}`;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`hp-consent-in hp-sb max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain p-5 sm:p-6 ${neoCard(darkMode, 'lg')}`}
      >
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]">
            <RiCookieLine className="h-6 w-6" />
          </span>
          <h2 id={titleId} className={`text-xl font-extrabold uppercase sm:text-2xl ${isAr ? 'tracking-normal' : 'tracking-[-0.02em]'} ${ink}`}>
            <span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{ctr(language, 'title')}</span>
          </h2>
        </div>

        <p id={descId} className={`mt-4 text-sm font-medium leading-relaxed sm:text-base ${muted}`}>{ctr(language, 'text')}</p>

        {custom && (
          <ul className="mt-5 space-y-3">
            {COOKIE_OPTIONS.map(([key, labelKey, descKey, locked]) => (
              <li key={key} className={`flex items-start justify-between gap-4 border-2 border-[color:var(--ink)] p-3 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
                <div className="min-w-0">
                  <p className={`text-sm font-extrabold uppercase ${track} ${ink}`}>{ctr(language, labelKey)}</p>
                  <p className={`mt-1 text-xs font-medium leading-relaxed ${muted}`}>{ctr(language, descKey)}</p>
                </div>
                <CookieSwitch
                  darkMode={darkMode}
                  label={ctr(language, labelKey)}
                  disabled={locked}
                  checked={locked ? true : prefs[key]}
                  onChange={() => togglePref(key)}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 grid gap-3 pe-1">
          {custom ? (
            <>
              <button ref={primaryRef} type="button" onClick={saveChoices} className={primary}>{ctr(language, 'save')}</button>
              <button type="button" onClick={rejectAll} className={secondary}>{ctr(language, 'rejectAll')}</button>
              <button type="button" onClick={toggleCustom} className={linkBtn}>{ctr(language, 'back')}</button>
            </>
          ) : (
            <>
              <button ref={primaryRef} type="button" onClick={acceptAll} className={primary}>{ctr(language, 'acceptAll')}</button>
              <button type="button" onClick={rejectAll} className={secondary}>{ctr(language, 'rejectAll')}</button>
              <button type="button" onClick={toggleCustom} className={linkBtn}>{ctr(language, 'customize')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const SearchBar = memo(({ darkMode, products, shops, language }) => {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const panelId = useId();

  const offerIndex = useMemo(
    () => OFFERS.map((o) => { const title = tr(language, o.key); return { ...o, title, _text: fold(title) }; }),
    [language],
  );

  const results = useMemo(() => {
    const q = fold(deferred).trim();
    if (!q) return { products: [], shops: [], offers: [] };
    const take = (list, max, base, row) => {
      const out = [];
      for (let i = 0; i < list.length && out.length < max; i++) {
        const it = list[i];
        if (!it._text.includes(q)) continue;
        const id = safeId(it.id);
        if (id) out.push({ ...row(it), key: id, href: `${base}${id}` });
      }
      return out;
    };
    return {
      products: take(products, 4, '/device/', (p) => ({ name: p.name, imageUrl: p.imageUrl, finalPrice: p.finalPrice })),
      shops: take(shops, 3, '/shops/', (s) => ({ name: s.name, city: s.shopAddress?.city })),
      offers: offerIndex.filter((o) => o._text.includes(q)).slice(0, 3),
    };
  }, [deferred, products, shops, offerIndex]);

  useEffect(() => {
    if (!focused) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    const onKey = (e) => { if (e.key === 'Escape') setFocused(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [focused]);

  const close = useCallback(() => setFocused(false), []);
  const onChange = useCallback((e) => setQuery(sanitizeQuery(e.target.value)), []);
  const onFocus = useCallback(() => setFocused(true), []);
  const clear = useCallback(() => { setQuery(''); inputRef.current?.focus(); }, []);

  const hasQuery = query.trim().length > 0;
  const open = focused && hasQuery;
  const total = results.products.length + results.shops.length + results.offers.length;
  const muted = darkMode ? 'text-neutral-500' : 'text-gray-400';
  const rowCls = `group flex items-center gap-3 px-1 py-2 transition-colors duration-100 ${darkMode ? 'hover:bg-white/10 focus-visible:bg-white/10' : 'rounded-xl hover:bg-emerald-50 focus-visible:bg-emerald-50'}`;
  const label = (txt) => <p className={`mb-1 text-[11px] font-bold uppercase tracking-wide ${muted}`}>{txt}</p>;
  const arrow = <FiArrowRight className={`h-4 w-4 opacity-0 transition-opacity duration-100 group-hover:opacity-100 rtl:rotate-180 ${muted}`} />;
  const neon = darkMode ? 'text-[#39ff88]' : 'text-emerald-500';

  return (
    <div className="relative w-full max-w-xl" ref={wrapRef} role="search">
      <div className={`flex items-center gap-3 border-[3px] px-4 py-3 transition-colors duration-150 ${
        darkMode
          ? `bg-[#2a2a2a] [box-shadow:5px_5px_0_0_#000] ${focused ? 'border-[#39ff88]' : 'border-black'}`
          : `rounded-2xl border-2 bg-white ${focused ? 'border-emerald-500' : 'border-gray-200'}`
      }`}>
        <FiSearch className={`h-5 w-5 flex-shrink-0 transition-colors duration-150 ${focused ? neon : muted}`} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          maxLength={MAX_QUERY}
          onChange={onChange}
          onFocus={onFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="search"
          enterKeyHint="search"
          aria-expanded={open}
          aria-controls={hasQuery ? panelId : undefined}
          placeholder={tr(language, 'search')}
          aria-label={tr(language, 'searchAria')}
          className={`hp-search min-w-0 flex-1 bg-transparent text-sm font-medium outline-none ${darkMode ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-500'}`}
        />
        {query && (
          <button type="button" onClick={clear} aria-label={tr(language, 'clearSearch')} className={darkMode ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasQuery && (
        <div
          id={panelId}
          aria-hidden={!open}
          className={`hp-sb absolute inset-x-0 top-full z-50 mt-3 max-h-[420px] origin-top overflow-y-auto overscroll-contain p-4 text-start transition-[opacity,transform,visibility] duration-150 ease-out motion-reduce:transition-none ${
            open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'
          } ${darkMode ? 'border-[3px] border-black bg-[#2a2a2a] [box-shadow:6px_6px_0_0_#000]' : 'rounded-2xl border border-emerald-100 bg-white shadow-2xl'}`}
        >
          {total === 0 && (
            <div className="py-6 text-center" role="status">
              <p className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-600'}`}>{tr(language, 'noResultsFor', { query: query.slice(0, 30) })}</p>
              <p className={`mt-1 text-xs ${muted}`}>{tr(language, 'tryDifferent')}</p>
            </div>
          )}

          {results.products.length > 0 && (
            <div className="mb-3">
              {label(tr(language, 'searchProducts'))}
              {results.products.map((p) => (
                <Link key={p.key} to={p.href} onClick={close} className={rowCls}>
                  <div className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl ${darkMode ? 'border-2 border-black bg-[#1e1e1e]' : 'border border-emerald-100 bg-white'}`}>
                    {p.imageUrl && <img src={p.imageUrl} alt="" width={48} height={48} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                    <p className={`text-xs font-bold tabular-nums ${darkMode ? 'text-[#39ff88]' : 'text-emerald-700'}`}>{money(p.finalPrice)}</p>
                  </div>
                  {arrow}
                </Link>
              ))}
            </div>
          )}

          {results.shops.length > 0 && (
            <div className="mb-3">
              {label(tr(language, 'searchShops'))}
              {results.shops.map((s) => (
                <Link key={s.key} to={s.href} onClick={close} className={rowCls}>
                  <Chip3D className="h-10 w-10 flex-shrink-0 text-base font-black">{s.name?.charAt(0)?.toUpperCase() || 'S'}</Chip3D>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                    {s.city && <p className={`truncate text-xs ${muted}`}>{s.city}</p>}
                  </div>
                  {arrow}
                </Link>
              ))}
            </div>
          )}

          {results.offers.length > 0 && (
            <div>
              {label(tr(language, 'searchOffers'))}
              {results.offers.map(({ id, title, Icon }) => (
                <Link key={id} to="/offers" onClick={close} className={rowCls}>
                  <Chip3D tone="am" className="h-10 w-10 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>
                  <p className={`flex-1 text-sm font-medium ${darkMode ? 'text-neutral-200' : 'text-gray-700'}`}>{title}</p>
                  {arrow}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const SearchSection = memo(({ darkMode, language, products, shops }) => (
  <section className={`relative z-20 py-10 sm:py-12 ${darkMode ? DARK_PAGE : 'bg-gray-50'}`}>
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:px-8">
      <div>
        <h2 className={`text-xl font-bold tracking-tight sm:text-2xl ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{tr(language, 'findDeviceOrShop')}</h2>
        <p className={`mt-1 text-sm ${darkMode ? 'text-neutral-400' : 'text-emerald-800/70'}`}>{tr(language, 'searchSubtitle')}</p>
      </div>
      <SearchBar darkMode={darkMode} products={products} shops={shops} language={language} />
    </div>
  </section>
));

const ActionCard = memo(({ darkMode, language, index, title, description, to, ctaLabel, scene }) => (
  <Link to={to} className={`group h-full p-5 sm:p-6 ${neoCard(darkMode, 'lg', true)}`}>
    <div className="flex items-center gap-3">
      <NumBadge n={pad2(language, index)} darkMode={darkMode} />
      <h3 className={`text-xl font-extrabold uppercase sm:text-2xl ${language === 'ar' ? 'tracking-normal' : 'tracking-[-0.02em]'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
        <span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{title}</span>
      </h3>
    </div>

    <p className={`mt-4 text-base font-medium leading-relaxed sm:text-lg ${darkMode ? 'text-neutral-200' : 'text-gray-800'}`}>{description}</p>

    <div aria-hidden="true" className="my-6 aspect-[3/2] w-full">
      <IsoIllustration type={scene} onGreen={false} darkMode={darkMode} className="h-full w-full" />
    </div>

    <CardFooter label={ctaLabel} darkMode={darkMode} isAr={language === 'ar'} />
  </Link>
));

const ActionSection = memo(({ darkMode, language }) => (
  <section className={`py-14 sm:py-20 ${LAZY_SECTION} ${darkMode ? DARK_PAGE : 'bg-gray-50'}`}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        label={tr(language, 'quickAccess')}
        title={tr(language, 'todayPrompt')}
        subtitle={tr(language, 'getStarted')}
        darkMode={darkMode}
        isAr={language === 'ar'}
      />

      <div className="grid grid-cols-1 gap-8 pb-2 pe-2 md:grid-cols-2 lg:gap-10">
        <ActionCard
          darkMode={darkMode} language={language} index={1} scene="repairCard"
          title={tr(language, 'repairDevice')}
          description={tr(language, 'repairDescription')}
          to="/repair" ctaLabel={tr(language, 'bookRepair')}
        />
        <ActionCard
          darkMode={darkMode} language={language} index={2} scene="offersCard"
          title={tr(language, 'latestOffers')}
          description={tr(language, 'offersDescription')}
          to="/offers" ctaLabel={tr(language, 'viewOffers')}
        />
      </div>
    </div>
  </section>
));

const ProductCard = memo(({ product, darkMode, language, onAddToCart, onOpen }) => {
  const [failed, setFailed] = useState(false);
  const [btn, setBtn] = useState('idle');
  const timer = useRef();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  useEffect(() => { setFailed(false); }, [product.imageUrl]);

  const cond = pick(CONDITION, product.condition);
  const out = product.stock === 0;
  const hasDiscount = product.discount > 0;
  const showImage = !!product.imageUrl && !failed;

  const open = useCallback(() => onOpen(product), [onOpen, product]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const handleError = useCallback(() => setFailed(true), []);
  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (out || btn === 'adding') return;
    setBtn('adding');
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setBtn(ok ? 'added' : 'idle');
    if (ok) timer.current = setTimeout(() => mounted.current && setBtn('idle'), 1400);
  }, [out, btn, onAddToCart, product]);

  return (
    <article
      onClick={open}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={product.name}
      className={`group h-full cursor-pointer ${neoCard(darkMode, 'sm', true)}`}
    >
      <div className={MEDIA_WRAP}>
        <div className={`${MEDIA_BOX} aspect-[3/2] ${mediaBg(darkMode)}`}>
          <div className="absolute start-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
            {cond && <span className={`rounded-full border-2 border-[color:var(--ink)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white ${cond.badge}`}>{tr(language, cond.labelKey)}</span>}
            {hasDiscount && <span className="rounded-full border-2 border-[color:var(--ink)] bg-rose-500 px-2 py-0.5 text-[9px] font-extrabold text-white" dir="ltr">-{product.discount}%</span>}
          </div>
          {showImage ? (
            <img
              src={product.imageUrl} alt={product.name} width={PRODUCT_IMG_W} height={PRODUCT_IMG_H} loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
              onError={handleError}
              className="h-full w-full object-cover transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105"
            />
          ) : (
            <ProductFallbackArt name={product.name} categoryName={product.categoryName} label={tr(language, 'deviceLabel')} darkMode={darkMode} />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1 pb-3">
          {product.categoryName && <span className={`block truncate text-[10px] font-bold uppercase tracking-wide ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>{product.categoryName}</span>}
          <h3 className={`mt-0.5 line-clamp-1 text-base font-extrabold uppercase ${language === 'ar' ? 'tracking-normal' : 'tracking-[-0.01em]'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{product.name}</h3>
          {product._snippet && (
            <p className={`mt-1.5 line-clamp-2 text-xs font-medium leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>{product._snippet}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t-2 border-[color:var(--ink)] pt-3">
          <div className="min-w-0">
            <p className={`truncate text-base font-extrabold tabular-nums ${darkMode ? 'text-[#39ff88]' : 'text-emerald-800'}`}>{money(product.finalPrice)}</p>
            {hasDiscount && <p className={`truncate text-[11px] tabular-nums line-through ${darkMode ? 'text-neutral-500' : 'text-gray-400'}`}>{money(product.price)}</p>}
            {out && <p className="text-[10px] font-semibold text-rose-500">{tr(language, 'outOfStock')}</p>}
          </div>
          <button type="button" onClick={handleCart} disabled={out || btn === 'adding'} aria-label={tr(language, 'addToCart')} className={NEO_ICON}>
            {btn === 'adding' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-950 border-t-transparent" />
              : btn === 'added' ? <FiCheck className="h-4 w-4" /> : <FiShoppingCart className={`h-4 w-4 ${darkMode ? '' : 'text-white'}`} />}
          </button>
        </div>
      </div>
    </article>
  );
});

const ShopCard = memo(({ shop, darkMode, language, onOpen }) => {
  const open = useCallback(() => onOpen(shop), [onOpen, shop]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const tel = phoneHref(shop.phone);
  const isAr = language === 'ar';
  const neonText = darkMode ? 'text-[#39ff88]' : 'text-emerald-500';
  return (
    <article
      onClick={open}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={shop.name}
      className={`group relative h-full cursor-pointer ${neoCard(darkMode, 'sm', true)}`}
    >
      <div className={MEDIA_WRAP}>
        <div className={`${MEDIA_BOX} ${mediaBg(darkMode)} flex h-48 items-end justify-center px-4 pt-4 sm:h-56`}>
          <StorefrontIllustration className="pointer-events-none h-full w-auto max-w-full transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105" />
          {shop.verified && (
            <span className={`absolute start-3 top-3 flex items-center gap-1 rounded-full border-2 border-[color:var(--ink)] px-2 py-1 text-[10px] font-extrabold uppercase ${darkMode ? 'bg-[#39ff88] text-black' : 'bg-emerald-400 text-white'}`}>
              <RiVerifiedBadgeLine className="h-3 w-3" /> {tr(language, 'verified')}
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex flex-1 flex-col gap-1.5 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`line-clamp-1 text-base font-extrabold uppercase leading-snug ${isAr ? 'tracking-normal' : 'tracking-[-0.01em]'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{shop.name || tr(language, 'unnamedShop')}</h3>
            {hasRating && (
              <span className={`flex flex-shrink-0 items-center gap-1 rounded-full border-2 border-[color:var(--ink)] px-2 py-0.5 text-xs font-extrabold ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                <RiStarFill className="h-3 w-3" /><span dir="ltr">{shop.rating.toFixed(1)}</span>
              </span>
            )}
          </div>
          {shop.shopType && (
            <span className={`inline-flex max-w-full items-center gap-1 self-start text-[11px] font-bold uppercase tracking-wide ${darkMode ? 'text-[#39ff88]' : 'text-emerald-700'}`}>
              <RiStoreLine className="h-3 w-3 flex-shrink-0" /><span className="truncate">{shop.shopType}</span>
            </span>
          )}
          {shop._address ? (
            <p className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>
              <FiMapPin className={`h-3 w-3 flex-shrink-0 ${neonText}`} />
              <span className="line-clamp-1">{shop._address}</span>
            </p>
          ) : (
            <span className={`inline-flex items-center gap-1 self-start rounded-full border-2 border-[color:var(--ink)] px-2 py-0.5 text-[10px] font-extrabold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
              <FiMapPin className="h-3 w-3 flex-shrink-0" />{tr(language, 'noAddress')}
            </span>
          )}
          <p className={`line-clamp-2 text-sm font-medium leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>{shop._snippet || tr(language, 'shopDescription')}</p>
          {tel && (
            <a href={tel} onClick={(e) => e.stopPropagation()} className={`flex min-w-0 items-center gap-1.5 text-xs font-bold ${darkMode ? 'text-neutral-200 hover:text-[#39ff88]' : 'text-gray-800 hover:text-emerald-500'}`}>
              <FiPhone className={`h-3 w-3 flex-shrink-0 ${neonText}`} /><span className="truncate" dir="ltr">{shop.phone}</span>
            </a>
          )}
        </div>
        <CardFooter label={tr(language, 'visitShop')} darkMode={darkMode} isAr={isAr} />
      </div>
    </article>
  );
});

const HomepageContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => { document.title = tr(language, 'pageTitle'); }, [language]);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.hpTheme = darkMode ? 'dark' : 'light';
    return () => { delete el.dataset.hpTheme; };
  }, [darkMode]);

  const recoveredRef = useRef(false);
  useEffect(() => {
    if (recoveredRef.current || useAuthStore.getState().accessToken) return;
    recoveredRef.current = true;
    recoverGoogleSession().then((session) => {
      if (!session) return;
      const to = redirectFor(session.roles, '/');
      if (to !== '/') navigate(to, { replace: true });
    });
  }, [navigate]);

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['homeData', userId ?? 'anon'],
    enabled: !!accessToken,
    queryFn: async ({ signal }) => {
      const [shopRes, productRes] = await Promise.all([
        api.get('/api/users/shops/all', { signal }),
        api.get('/api/products', { signal }).catch((e) => {
          if (signal?.aborted) throw e;
          return { data: { content: [] } };
        }),
      ]);
      const list = productRes.data?.content || productRes.data || [];
      const catalog = (Array.isArray(list) ? list : []).filter((p) => p && !p.deleted).map(normalizeProduct);
      const shops = (shopRes.data?.content || []).filter(Boolean).map(normalizeShop);
      return {
        shops,
        catalog,
        latestShops: shops.slice(-RAIL_LIMIT),
        latestProducts: catalog.slice(-RAIL_LIMIT),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
  const isLoading = !!accessToken && queryLoading;

  const shops = data?.shops || [];
  const catalog = data?.catalog || [];
  const products = data?.latestProducts || [];
  const latestShops = data?.latestShops || [];
  const prodRail = useRail(products);
  const shopRail = useRail(latestShops);
  const [prodSecRef, prodVisible] = useOnScreen();
  const [shopSecRef, shopVisible] = useOnScreen();

  const showTop = useBackToTop();
  const scrollToTop = useCallback(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  const handleAddToCart = useCallback(async (product) => {
    if (!useAuthStore.getState().accessToken) {
      const Swal = await loadSwal();
      const r = await Swal.fire({
        title: tr(language, 'loginRequiredTitle'), text: tr(language, 'loginRequiredText'), icon: 'info',
        showCancelButton: true, confirmButtonText: tr(language, 'goToLogin'),
      });
      if (r.isConfirmed) navigate('/login');
      return false;
    }
    try {
      const res = await api.post('/api/cart/items', { productId: product.id, quantity: 1 });
      if (res.status < 200 || res.status >= 300) throw new Error('Unexpected response');
      window.dispatchEvent(new Event('cart:updated'));
      toast({
        icon: 'success', title: tr(language, 'addedTitle'),
        text: tr(language, 'addedToCart', { name: clean(product.name, 60) }), timer: 2800,
      });
      return true;
    } catch (err) {
      toast({ icon: 'error', title: tr(language, 'errorTitle'), text: err?.response?.data?.message || tr(language, 'addToCartFailed'), timer: 3500 });
      return false;
    }
  }, [navigate, language]);

  const openProduct = useCallback((p) => {
    const id = safeId(p.id);
    if (id) navigate(`/device/${id}`);
  }, [navigate]);
  const openShop = useCallback((s) => {
    const id = safeId(s.id);
    if (id) navigate(`/shops/${id}`);
  }, [navigate]);

  const RAIL = 'hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5 pt-1 sm:gap-6 motion-reduce:scroll-auto';
  const sectionBg = darkMode ? DARK_PAGE : 'bg-gray-50';

  return (
    <div
      dir={languageDirection(language)}
      className={`min-h-screen ${isAr ? 'font-cairo' : 'font-jakarta'} ${darkMode ? `${DARK_PAGE} text-white` : 'bg-gray-50 text-gray-900'}`}
    >
      <Device3DStyles />
      <style>{EXTRAS_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <Hero variant="home" darkMode={darkMode} />

      <ActionSection darkMode={darkMode} language={language} />

      <Suspense fallback={<div className={`h-[420px] w-full animate-pulse ${darkMode ? DARK_PAGE : 'bg-emerald-50'}`} />}>
        <Service darkMode={darkMode} />
      </Suspense>

      <SearchSection darkMode={darkMode} language={language} products={catalog} shops={shops} />

      <section ref={prodSecRef} className={`py-14 sm:py-20 ${LAZY_SECTION} ${prodVisible ? '' : 'anim-paused'} ${sectionBg}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            darkMode={darkMode} isAr={isAr}
            label={tr(language, 'featuredBadge')}
            title={tr(language, 'featuredProducts')}
            subtitle={tr(language, 'featuredSubtitle')}
          >
            <RailArrows rail={prodRail} darkMode={darkMode} language={language} />
          </SectionTitle>

          {isLoading ? <RailSkeleton w="w-[280px] sm:w-[320px]" h="h-[400px]" darkMode={darkMode} />
            : products.length === 0 ? <EmptyRail label={tr(language, 'noProducts')} darkMode={darkMode} />
            : (
              <div ref={prodRail.ref} className={RAIL}>
                {products.map((p) => (
                  <div key={p.id} className="w-[280px] flex-shrink-0 snap-start pb-2 pe-2 sm:w-[320px] md:w-[340px]">
                    <ProductCard product={p} darkMode={darkMode} language={language} onAddToCart={handleAddToCart} onOpen={openProduct} />
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>

      <section ref={shopSecRef} className={`py-14 sm:py-20 ${LAZY_SECTION} ${shopVisible ? '' : 'anim-paused'} ${sectionBg}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            darkMode={darkMode} isAr={isAr}
            label={tr(language, 'verified')}
            title={tr(language, 'topShops')}
            subtitle={tr(language, 'shopsSubtitle')}
          >
            <RailArrows rail={shopRail} darkMode={darkMode} language={language} />
          </SectionTitle>

          {isLoading ? <RailSkeleton w="w-[300px] sm:w-[350px]" h="h-[520px]" darkMode={darkMode} />
            : latestShops.length === 0 ? <EmptyRail label={tr(language, 'noShops')} darkMode={darkMode} />
            : (
              <div ref={shopRail.ref} className={RAIL}>
                {latestShops.map((s) => (
                  <div key={s.id} className="w-[300px] flex-shrink-0 snap-start pb-2 pe-2 sm:w-[350px]">
                    <ShopCard shop={s} darkMode={darkMode} language={language} onOpen={openShop} />
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>

      <Suspense fallback={<div className={`h-64 w-full animate-pulse ${darkMode ? DARK_PAGE : 'bg-white'}`} />}>
        <OffersSlider darkMode={darkMode} />
      </Suspense>

      {showTop && (
        <div className="fixed bottom-5 end-5 z-40">
          <Btn3D onClick={scrollToTop} aria-label={tr(language, 'backToTop')} className="h-11 w-11">
            <FiArrowUp className="h-5 w-5" />
          </Btn3D>
        </div>
      )}

      <CookieConsent darkMode={darkMode} language={language} />
    </div>
  );
});

const Homepage = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <HomepageContent {...props} />
  </QueryClientProvider>
));

export { queryClient };
export default Homepage;