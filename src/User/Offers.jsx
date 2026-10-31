import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, memo, useTransition,
} from 'react';
import { Link, useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiX, FiCalendar, FiClock, FiTag, FiZap, FiArrowRight, FiChevronLeft, FiChevronRight, FiRefreshCw,
} from 'react-icons/fi';
import { RiStoreLine } from 'react-icons/ri';
import api from '../common/api/api';
import { useModalLock, clean, safeImageUrl } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { Defs3D, Device3DStyles } from '../components/user/Device3D';
import { authHeaders, expireSession, isUnauthorized, useAuthGuard } from '../common/utils/auth';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } },
});

const OFFER_TRANSLATIONS = {
  en: enTranslations.offersPage,
  ar: arTranslations.offersPage || arTranslations.hero?.offersPage,
  fr: frTranslations.offersPage || frTranslations.hero?.offersPage,
};

const LOCAL_TEXT = {
  en: {
    crumbHome: 'Home', crumbOffers: 'Offers', breadcrumb: 'Breadcrumb',
    filterAll: 'All offers', filterPercent: 'Percentage', filterFixed: 'Fixed amount', filterSoon: 'Ending soon',
    filterLabel: 'Filter offers', tryAgain: 'Try again', loadFail: "We couldn't load offers right now.",
    noMatch: 'No offers in this filter', bestDeal: 'Best deal right now', viewOffer: 'View offer',
    offerFailed: 'Failed to load offer', pagination: 'Pagination', prevPage: 'Previous page', nextPage: 'Next page',
    page: 'Page', loading: 'Loading',
    limitedOffer: 'Limited offer', newArrival: 'Just landed', shopNow: 'Shop now',
    prevSlide: 'Previous slide', nextSlide: 'Next slide', goToSlide: 'Go to slide',
  },
  ar: {
    crumbHome: 'الرئيسية', crumbOffers: 'العروض', breadcrumb: 'مسار التنقل',
    filterAll: 'كل العروض', filterPercent: 'نسبة مئوية', filterFixed: 'مبلغ ثابت', filterSoon: 'تنتهي قريبًا',
    filterLabel: 'تصفية العروض', tryAgain: 'حاول مرة أخرى', loadFail: 'تعذّر تحميل العروض حاليًا.',
    noMatch: 'لا توجد عروض في هذا التصنيف', bestDeal: 'أفضل عرض الآن', viewOffer: 'عرض التفاصيل',
    offerFailed: 'تعذّر تحميل العرض', pagination: 'الصفحات', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية',
    page: 'صفحة', loading: 'جارٍ التحميل',
    limitedOffer: 'عرض محدود', newArrival: 'وصل حديثًا', shopNow: 'تسوّق الآن',
    prevSlide: 'الشريحة السابقة', nextSlide: 'الشريحة التالية', goToSlide: 'اذهب إلى الشريحة',
  },
  fr: {
    crumbHome: 'Accueil', crumbOffers: 'Offres', breadcrumb: "Fil d'Ariane",
    filterAll: 'Toutes les offres', filterPercent: 'Pourcentage', filterFixed: 'Montant fixe', filterSoon: 'Bientôt terminées',
    filterLabel: 'Filtrer les offres', tryAgain: 'Réessayer', loadFail: 'Impossible de charger les offres pour le moment.',
    noMatch: 'Aucune offre dans ce filtre', bestDeal: 'Meilleure offre du moment', viewOffer: "Voir l'offre",
    offerFailed: "Échec du chargement de l'offre", pagination: 'Pagination', prevPage: 'Page précédente', nextPage: 'Page suivante',
    page: 'Page', loading: 'Chargement',
    limitedOffer: 'Offre limitée', newArrival: 'Vient d’arriver', shopNow: 'Acheter',
    prevSlide: 'Diapositive précédente', nextSlide: 'Diapositive suivante', goToSlide: 'Aller à la diapositive',
  },
};

const tr = (language, key) =>
  OFFER_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  OFFER_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

const PAGE_CSS = `
  .hp-hl, .hp-hl-dark, .hp-hl-on {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-size: 100% 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .hp-hl      { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-on   { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23facc15' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  @keyframes hpFloat { 0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); } 50% { transform: translateY(-14px) rotate(var(--r, 0deg)); } }
  .hp-float { animation: hpFloat 6s ease-in-out infinite; }
  @keyframes hpDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(18px, -22px); } }
  .hp-drift { animation: hpDrift 11s ease-in-out infinite; }
  @keyframes hpRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .hp-rise { animation: hpRise 0.28s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i, 0) * 28ms); }
  @keyframes hpFade { from { opacity: 0; } to { opacity: 1; } }
  .hp-fade { animation: hpFade 0.16s ease-out both; }
  @keyframes hpModal { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: none; } }
  .hp-modal { animation: hpModal 0.2s cubic-bezier(.2,.8,.2,1) both; }
  .hp-pattern {
    --p1: rgba(4, 38, 26, .13);
    --p2: rgba(16, 185, 129, .12);
    background-image:
      radial-gradient(circle at 2px 2px, var(--p1) 1.6px, transparent 1.8px),
      repeating-linear-gradient(135deg, var(--p2) 0 2px, transparent 2px 18px);
    background-size: 22px 22px, auto;
  }
  .hp-pattern-dark { --p1: rgba(57, 255, 136, .14); --p2: rgba(57, 255, 136, .06); }
  .hp-media {
    background-image: radial-gradient(circle at 1px 1px, rgba(4, 38, 26, .16) 1px, transparent 1.4px);
    background-size: 14px 14px;
  }
  .hs-root { contain: paint; }
  .hs-slide {
    opacity: 0; visibility: hidden; will-change: opacity;
    transition: opacity .38s cubic-bezier(.4,0,.2,1), visibility 0s linear .38s;
  }
  .hs-on { opacity: 1; visibility: visible; transition: opacity .38s cubic-bezier(.4,0,.2,1), visibility 0s; }
  .hs-bg { background: linear-gradient(135deg, var(--tb) 0%, var(--tc) 100%); }
  .hs-dots { background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.14) 1px, transparent 1.4px); background-size: 18px 18px; }
  .hs-blob { background: var(--ta); opacity: .22; filter: blur(80px); will-change: transform; }
  .hs-a { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity .2s ease, transform .2s ease; }
  .hs-on .hs-a {
    opacity: 1; transform: none;
    transition: opacity .4s ease calc(var(--d, 0) * 50ms + 60ms), transform .55s cubic-bezier(.16,1,.3,1) calc(var(--d, 0) * 50ms + 60ms);
  }
  .hs-v { opacity: 0; transform: translate3d(0, 10px, 0) scale(.9) rotate(-3deg); transition: opacity .2s ease, transform .2s ease; }
  .hs-on .hs-v { opacity: 1; transform: none; transition: opacity .45s ease .08s, transform .7s cubic-bezier(.16,1,.3,1) .08s; }
  .hs-bar { transform: scaleX(0); animation: hsBar linear forwards; }
  @keyframes hsBar { to { transform: scaleX(1); } }
  @media (prefers-reduced-motion: reduce) {
    .hp-rise, .hp-fade, .hp-modal, .hp-float, .hp-drift { animation: none; }
    .hs-a, .hs-v, .hs-on .hs-a, .hs-on .hs-v { transform: none; transition: opacity .2s ease; }
    .hs-bar { animation: none; transform: scaleX(1); }
  }
`;
let stylesInjected = false;
const injectStylesOnce = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-offers-styles', 'true');
  tag.textContent = PAGE_CSS;
  document.head.appendChild(tag);
  stylesInjected = true;
};
injectStylesOnce();

const DARK_PAGE = 'bg-[#141414]';
const LAZY_SECTION = '[content-visibility:auto] [contain-intrinsic-size:auto_760px]';

const NEO_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#022c22] [--sh:#022c22] [--acc:#34d399]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#39ff88]',
};
const NEO_SURFACE = { light: 'bg-white', dark: 'bg-[#2a2a2a]' };
const NEO_BOX = {
  lg: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]',
  sm: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--sh)]',
};
const NEO_PRESS =
  'transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  '[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*8px)_10px_0_0_var(--sh)] ' +
  'active:translate-y-[2px] active:translate-x-[calc(var(--dx)*2px)] active:[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[color:var(--acc)]';
const neoCard = (darkMode, size = 'lg', press = false) => {
  const k = darkMode ? 'dark' : 'light';
  return `${NEO_THEME[k]} ${NEO_BOX[size]} ${NEO_SURFACE[k]}${press ? ` ${NEO_PRESS}` : ''}`;
};

const NEO_ICON =
  'inline-flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoIcon = (darkMode) => `${NEO_THEME[darkMode ? 'dark' : 'light']} ${NEO_ICON}`;

const NEO_BTN =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoBtn = (darkMode, active) => {
  const k = darkMode ? 'dark' : 'light';
  const tone = active ? 'bg-[color:var(--acc)] text-emerald-950' : `${NEO_SURFACE[k]} ${darkMode ? 'text-white' : 'text-emerald-950'}`;
  return `${NEO_THEME[k]} ${NEO_BTN} ${tone}`;
};

const HERO_BTN =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-black px-5 py-3 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*5px)_5px_0_0_#000] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  '[@media(hover:hover)]:hover:-translate-y-0.5 active:translate-y-[5px] active:translate-x-[calc(var(--dx)*5px)] active:[box-shadow:0_0_0_0_#000] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white';
const HERO_ARROW =
  'inline-flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-[3px] border-black bg-white text-black ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_#000] transition-[transform,box-shadow] duration-100 motion-reduce:transition-none ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_#000] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white';
const HERO_H = 'h-[max(44rem,92svh)] lg:h-[max(46rem,94svh)]';

const THEMES = [
  { a: '#34d399', b: '#04261a', c: '#0b4a35', ink: '#022c22' },
  { a: '#fbbf24', b: '#2a1403', c: '#6b3b06', ink: '#422006' },
  { a: '#a78bfa', b: '#150f3a', c: '#33277d', ink: '#1e1b4b' },
  { a: '#fb7185', b: '#3b0a17', c: '#7a1530', ink: '#4c0519' },
  { a: '#38bdf8', b: '#06263d', c: '#0c4c75', ink: '#082f49' },
];
const themeVars = (th) => ({ '--ta': th.a, '--tb': th.b, '--tc': th.c, '--ti': th.ink });

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

const SectionTitle = memo(({ label, title, subtitle, darkMode, isAr, level: H = 'h2' }) => {
  const parts = useMemo(() => splitHeading(title), [title]);
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const bar = darkMode ? 'border-[#39ff88] bg-[#39ff88]' : 'border-emerald-950 bg-emerald-400';
  const sub = darkMode ? 'text-neutral-300' : 'text-gray-800';
  return (
    <div className="min-w-0 max-w-3xl">
      {label && (
        <div className="mb-5 flex items-center gap-3">
          <span aria-hidden="true" className={`h-3.5 w-12 rounded-full border-2 ${bar}`} />
          <span className={`text-sm font-bold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${ink}`}>{label}</span>
        </div>
      )}
      <H
        className={`text-3xl font-extrabold [text-wrap:balance] sm:text-5xl ${
          isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.18] tracking-[-0.04em]'
        } ${ink}`}
      >
        {parts.map(({ part, hl }, i) => (hl ? <span key={i} className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{part}</span> : part))}
      </H>
      {subtitle && (
        <p className={`mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${sub}`}>{subtitle}</p>
      )}
    </div>
  );
});

const CardFooter = memo(({ label, darkMode, isAr }) => (
  <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-[color:var(--ink)] pt-3">
    <span className={`truncate text-sm font-extrabold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{label}</span>
    <span aria-hidden="true" className={NEO_ICON}><FiArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
  </div>
));

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navType]);
};

const PAGE_SIZE = 6;
const SOON_DAYS = 3;
const OFFER_SLIDES = 4;
const LATEST_LIMIT = 4;
const HERO_MS = 6000;
const SWIPE_PX = 48;
const STAGGER = Array.from({ length: PAGE_SIZE }, (_, i) => ({ '--i': i }));
const DELAY = Array.from({ length: 8 }, (_, i) => ({ '--d': i }));
const GRID = 'grid grid-cols-1 gap-6 pb-2 pe-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-8';
const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };

const numCache = {};
const money = (n, language) => {
  const loc = LOCALES[language] || 'en-GB';
  numCache[loc] ||= new Intl.NumberFormat(loc, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `EGP ${numCache[loc].format(Number(n || 0))}`;
};

const fmtCache = {};
const dateFmt = (language, withYear) => {
  const loc = LOCALES[language] || 'en-GB';
  const k = `${loc}:${withYear}`;
  fmtCache[k] ||= new Intl.DateTimeFormat(loc, withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
  return fmtCache[k];
};
const rtfCache = {};
const rtf = (language) => {
  const loc = LOCALES[language] || 'en-GB';
  rtfCache[loc] ||= new Intl.RelativeTimeFormat(loc, { numeric: 'auto' });
  return rtfCache[loc];
};

const toDate = (v) => {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysLeftNum = (end) => {
  const e = toDate(end);
  if (!e) return null;
  const diff = Math.ceil((e - new Date()) / 86400000);
  return diff < 0 ? null : diff;
};

const formatRange = (start, end, language) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '';
  return `${dateFmt(language, false).format(s)} — ${dateFmt(language, true).format(e)}`;
};

const normType = (t) => {
  const s = String(t ?? '').toUpperCase();
  if (s === 'PERCENTAGE' || s === 'PERCENT') return 'PERCENTAGE';
  if (s === 'FIXED_AMOUNT' || s === 'FIXED_VALUE' || s === 'FIXED') return 'FIXED_AMOUNT';
  return '';
};

const normalizeOffer = (o) => {
  const type = normType(o.discountType);
  const isPct = type === 'PERCENTAGE';
  const raw = Math.max(0, Number(o.discountValue) || 0);
  return {
    id: String(o.id),
    name: clean(String(o.name ?? ''), 120),
    description: o.description ? clean(String(o.description), 600) : '',
    discountType: type,
    discountValue: isPct ? Math.min(raw, 100) : raw,
    startDate: o.startDate || null,
    endDate: o.endDate || null,
    status: o.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    shopId: o.shopId != null ? String(o.shopId) : '',
    shopName: o.shopName ? clean(String(o.shopName), 80) : '',
  };
};

const round2 = (n) => Math.round(n * 100) / 100;

const normalizeLatest = (p) => {
  const price = Math.max(0, Number(p.price) || 0);
  const apiFinal = Number(p.finalPrice);
  const dv = Number(p.discountValue) || 0;
  const type = normType(p.discountType);
  let finalPrice = price;
  if (apiFinal > 0 && apiFinal < price) finalPrice = apiFinal;
  else if (dv > 0 && type === 'PERCENTAGE') finalPrice = dv < 100 ? round2((price * (100 - dv)) / 100) : price;
  else if (dv > 0 && type === 'FIXED_AMOUNT') finalPrice = dv < price ? round2(price - dv) : price;
  else {
    const legacy = Math.min(100, Math.max(0, Number(p.discount) || 0));
    if (legacy) finalPrice = round2((price * (100 - legacy)) / 100);
  }
  const saving = round2(Math.max(0, price - finalPrice));
  return {
    id: String(p.id),
    name: clean(String(p.name ?? ''), 120),
    description: clean(String(p.description ?? ''), 160),
    categoryName: clean(String(p.categoryName ?? ''), 60),
    price,
    finalPrice,
    saving,
    pct: saving > 0 && price > 0 ? Math.max(1, Math.round((saving / price) * 100)) : 0,
    img: safeImageUrl(p.imageUrl || p.image) || '',
    ts: Date.parse(p.createdAt) || 0,
    num: Number(p.id) || 0,
  };
};

const shopPath = (id) => `/shops/${encodeURIComponent(id)}`;
const findInList = (qc, id) => (qc.getQueryData(['offers']) || []).find((o) => o.id === id);

const EMPTY_OFFER = { discountType: '', discountValue: 0, status: 'INACTIVE' };
const EMPTY_LIST = [];

const isSoon = (o) => {
  if (o.status !== 'ACTIVE') return false;
  const d = daysLeftNum(o.endDate);
  return d !== null && d <= SOON_DAYS;
};

const FILTERS = [
  ['all', 'filterAll', () => true],
  ['percent', 'filterPercent', (o) => o.discountType === 'PERCENTAGE'],
  ['fixed', 'filterFixed', (o) => o.discountType === 'FIXED_AMOUNT'],
  ['soon', 'filterSoon', isSoon],
];
const FILTER_FN = Object.fromEntries(FILTERS.map(([key, , fn]) => [key, fn]));

const offerScore = (o) => (o.discountType === 'PERCENTAGE' ? o.discountValue : 0);

const useOfferMeta = (offer, language) =>
  useMemo(() => {
    const days = daysLeftNum(offer.endDate);
    const isPct = offer.discountType === 'PERCENTAGE';
    const isFixed = offer.discountType === 'FIXED_AMOUNT';
    return {
      isPct,
      isFixed,
      isActive: offer.status === 'ACTIVE',
      remaining: days === null ? null : rtf(language).format(days, 'day'),
      urgent: days !== null && days <= SOON_DAYS,
      range: formatRange(offer.startDate, offer.endDate, language),
      amount: isPct ? `${offer.discountValue}%` : isFixed ? money(offer.discountValue, language) : String(offer.discountValue),
    };
  }, [offer, language]);

const Crumbs = memo(({ t }) => (
  <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-2 text-sm font-bold text-white/80">
    <Link to="/" className="underline decoration-[color:var(--ta)] decoration-2 underline-offset-4 hover:no-underline">{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    <span aria-current="page" className="text-white">{t('crumbOffers')}</span>
  </nav>
));

const MetaRow = memo(({ icon: Icon, children, className = '', iconClass }) => (
  <p className={`flex min-w-0 items-center gap-2 text-xs font-semibold ${className}`}>
    <Icon aria-hidden="true" className={`h-3.5 w-3.5 flex-shrink-0 ${iconClass}`} />
    <span className="min-w-0 flex-1 truncate">{children}</span>
  </p>
));

const HeroImg = memo(({ src, alt, eager }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  const onError = useCallback(() => setFailed(true), []);
  if (!src || failed) return <IsoIllustration type="offers" tone="emerald" onGreen={false} darkMode={false} className="h-3/4 w-3/4" />;
  return (
    <img
      src={src} alt={alt} width={720} height={720} decoding="async" referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} onError={onError}
      className="h-full w-full object-contain p-6 sm:p-10"
    />
  );
});

const HeroSlide = memo(({ slide, on, first, language, onOffer, onProduct, t }) => {
  const { kind, data, theme } = slide;
  const isOffer = kind === 'offer';
  const meta = useOfferMeta(isOffer ? data : EMPTY_OFFER, language);
  const open = useCallback(() => (isOffer ? onOffer(data.id) : onProduct(data.id)), [isOffer, onOffer, onProduct, data.id]);
  const bigNum = isOffer ? (meta.isPct ? `${data.discountValue}%` : String(data.discountValue)) : '';
  const desc = isOffer ? data.description || t('descriptionFallback') : data.description || data.categoryName;
  return (
    <div className={`hs-slide absolute inset-0 ${on ? 'hs-on' : ''}`} style={themeVars(theme)} role="group" aria-roledescription="slide" aria-hidden={!on}>
      <div className="hs-bg absolute inset-0" />
      <span aria-hidden="true" className="hs-blob hp-drift pointer-events-none absolute -end-24 top-10 h-[28rem] w-[28rem] rounded-full" />
      <span aria-hidden="true" className="hs-blob pointer-events-none absolute -bottom-40 -start-24 h-[24rem] w-[24rem] rounded-full" style={{ opacity: 0.14 }} />
      <div aria-hidden="true" className="hs-dots absolute inset-0" />
      <span
        aria-hidden="true" dir="ltr"
        className="pointer-events-none absolute -bottom-10 end-2 select-none text-[11rem] font-black leading-none text-[color:var(--ta)] opacity-[.09] sm:text-[22rem]"
      >
        {isOffer ? bigNum : 'NEW'}
      </span>

      <div className="relative mx-auto grid h-full max-w-7xl items-center gap-6 px-4 pb-36 pt-32 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:gap-12 lg:px-8 lg:pb-40 lg:pt-36">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="hs-a flex flex-wrap items-center gap-2" style={DELAY[0]}>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-[3px] border-black bg-[color:var(--ta)] px-3 py-1 text-xs font-black uppercase text-[color:var(--ti)]">
              {isOffer ? <FiTag aria-hidden="true" className="h-3.5 w-3.5" /> : <FiZap aria-hidden="true" className="h-3.5 w-3.5" />}
              {isOffer ? t('limitedOffer') : t('newArrival')}
            </span>
            {isOffer && meta.remaining && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-white/30 px-3 py-1 text-xs font-bold text-white/90">
                <FiClock aria-hidden="true" className="h-3.5 w-3.5" />{meta.remaining}
              </span>
            )}
            {!isOffer && data.categoryName && (
              <span className="inline-flex max-w-[12rem] items-center gap-1.5 rounded-lg border-2 border-white/30 px-3 py-1 text-xs font-bold text-white/90">
                <FiTag aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{data.categoryName}</span>
              </span>
            )}
          </div>

          <h2
            className="hs-a mt-5 line-clamp-3 break-words text-4xl font-black leading-[1.08] tracking-[-0.03em] [text-wrap:balance] rtl:leading-[1.35] rtl:tracking-normal sm:text-6xl lg:text-7xl"
            style={DELAY[1]}
          >
            {data.name}
          </h2>

          {desc && <p className="hs-a mt-5 line-clamp-3 max-w-xl text-base font-medium leading-relaxed text-white/80 sm:text-lg" style={DELAY[2]}>{desc}</p>}

          <div className="hs-a mt-6 flex flex-wrap items-end gap-x-5 gap-y-2" style={DELAY[3]} dir="ltr">
            {isOffer ? (
              <>
                <span className="text-4xl font-black tabular-nums text-[color:var(--ta)] sm:text-5xl">{meta.amount}</span>
                <span className="pb-1 text-sm font-extrabold uppercase text-white/80">{t('off')}</span>
                {meta.range && <span className="pb-1 text-xs font-semibold text-white/70">{meta.range}</span>}
              </>
            ) : (
              <>
                <span className="text-4xl font-black tabular-nums text-[color:var(--ta)] sm:text-5xl">{money(data.finalPrice, language)}</span>
                {data.saving > 0 && (
                  <>
                    <span className="pb-1 text-base font-semibold tabular-nums text-white/60 line-through">{money(data.price, language)}</span>
                    <span className="mb-1 rounded-md border-2 border-black bg-white px-2 py-0.5 text-xs font-black tabular-nums text-black">-{data.pct}%</span>
                  </>
                )}
              </>
            )}
          </div>

          <div className="hs-a mt-8 flex flex-wrap gap-4 pb-1 pe-1" style={DELAY[4]}>
            <button type="button" onClick={open} tabIndex={on ? 0 : -1} className={`${HERO_BTN} bg-[color:var(--ta)] text-[color:var(--ti)]`}>
              {isOffer ? t('viewOffer') : t('shopNow')}<FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
            </button>
            {isOffer && data.shopId && (
              <Link to={shopPath(data.shopId)} tabIndex={on ? 0 : -1} className={`${HERO_BTN} bg-white text-black`}>
                <RiStoreLine aria-hidden="true" className="h-4 w-4" /><span className="max-w-[12rem] truncate">{data.shopName || t('visitShop')}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="hs-v relative h-44 w-44 sm:h-64 sm:w-64 lg:h-[28rem] lg:w-[28rem]">
            <div className="hp-float h-full w-full [--r:0deg]">
              {isOffer ? (
                <>
                  <div className="absolute inset-0 flex -rotate-3 flex-col items-center justify-center rounded-[2rem] border-[3px] border-black bg-[color:var(--ta)] text-[color:var(--ti)] [box-shadow:calc(var(--dx)*12px)_12px_0_0_#000]">
                    <span dir="ltr" className="text-[4.5rem] font-black leading-none tabular-nums sm:text-[7rem] lg:text-[10rem]">{bigNum}</span>
                    <span className="mt-1 text-sm font-extrabold uppercase sm:text-xl lg:text-3xl">{meta.isFixed ? 'EGP ' : ''}{t('off')}</span>
                  </div>
                  <IsoIllustration type="offers" tone="emerald" onGreen={false} darkMode className="pointer-events-none absolute -bottom-6 -start-8 h-24 w-24 sm:h-36 sm:w-36 lg:-bottom-10 lg:-start-14 lg:h-52 lg:w-52" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex rotate-3 items-center justify-center overflow-hidden rounded-[2rem] border-[3px] border-black bg-white [box-shadow:calc(var(--dx)*12px)_12px_0_0_var(--ta)]">
                    <HeroImg src={data.img} alt={data.name} eager={first} />
                  </div>
                  {data.pct > 0 && (
                    <span className="absolute -bottom-3 end-2 rounded-xl border-[3px] border-black bg-[color:var(--ta)] px-3 py-1.5 text-sm font-black tabular-nums text-[color:var(--ti)] sm:text-xl" dir="ltr">-{data.pct}%</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const HeroSlider = memo(({ slides, loading, language, onOffer, onProduct, t }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(null);
  const isRTL = languageDirection(language) === 'rtl';
  const count = slides.length;
  const safe = count ? Math.min(index, count - 1) : 0;

  useEffect(() => { if (count && index >= count) setIndex(0); }, [count, index]);

  const go = useCallback((i) => setIndex(i), []);
  const step = useCallback((d) => setIndex((i) => (count ? (i + d + count) % count : 0)), [count]);
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const onPointerDown = useCallback((e) => { startX.current = e.clientX; }, []);
  const onPointerUp = useCallback((e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    step((isRTL ? dx > 0 : dx < 0) ? 1 : -1);
  }, [isRTL, step]);
  const onPointerCancel = useCallback(() => { startX.current = null; }, []);
  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(isRTL ? -1 : 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(isRTL ? 1 : -1); }
  }, [isRTL, step]);
  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);
  const onFocus = useCallback((e) => { if (e.target.matches?.(':focus-visible')) setPaused(true); }, []);

  if (loading) {
    return (
      <div className={`relative overflow-hidden bg-[#04261a] ${HERO_H}`} role="status" aria-label={t('loading')}>
        <div className="mx-auto grid h-full max-w-7xl items-center gap-10 px-4 pt-32 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-5">
            <div className="h-7 w-40 animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none" />
            <div className="h-16 w-full max-w-xl animate-pulse rounded-xl bg-white/10 motion-reduce:animate-none" />
            <div className="h-5 w-full max-w-md animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
            <div className="h-12 w-44 animate-pulse rounded-xl bg-white/10 motion-reduce:animate-none" />
          </div>
          <div className="hidden h-[26rem] animate-pulse rounded-[2rem] bg-white/10 motion-reduce:animate-none lg:block" />
        </div>
      </div>
    );
  }

  if (!count) {
    return (
      <section aria-label={t('activeOffers')} className={`relative isolate overflow-hidden text-white ${HERO_H}`} style={themeVars(THEMES[0])}>
        <div className="hs-bg absolute inset-0" />
        <div aria-hidden="true" className="hs-dots absolute inset-0" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center gap-6 px-4 pt-28 sm:px-6 lg:px-8">
          <Crumbs t={t} />
          <h2 className="max-w-2xl text-4xl font-black leading-[1.1] tracking-[-0.03em] rtl:leading-[1.35] rtl:tracking-normal sm:text-6xl">{t('activeOffers')}</h2>
          <p className="max-w-xl text-base font-medium text-white/80 sm:text-lg">{t('checkBack')}</p>
        </div>
        <IsoIllustration type="offers" tone="emerald" onGreen={false} darkMode className="hp-float pointer-events-none absolute bottom-24 end-10 hidden h-72 w-72 lg:block" />
      </section>
    );
  }

  const active = slides[safe];

  return (
    <section
      aria-roledescription="carousel" aria-label={t('activeOffers')}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onKeyDown={onKeyDown}
      onMouseEnter={pause} onMouseLeave={resume} onFocus={onFocus} onBlur={resume}
      className={`hs-root relative isolate touch-pan-y overflow-hidden text-white [--dx:1] rtl:[--dx:-1] ${HERO_H}`}
    >
      <div className="absolute inset-0" aria-live={paused ? 'polite' : 'off'}>
        {slides.map((s, i) => (
          <HeroSlide key={s.key} slide={s} on={i === safe} first={i === 0} language={language} onOffer={onOffer} onProduct={onProduct} t={t} />
        ))}
      </div>

      <div className="absolute inset-x-0 top-24 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" style={themeVars(active.theme)}>
        <Crumbs t={t} />
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20" style={themeVars(active.theme)}>
          <div className="mx-auto flex max-w-7xl items-end gap-4 px-4 pb-6 sm:px-6 lg:px-8">
            <div role="tablist" className="grid min-w-0 flex-1 gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
              {slides.map((s, i) => (
                <button
                  key={s.key} type="button" role="tab" aria-selected={i === safe} aria-label={`${t('goToSlide')} ${i + 1}`}
                  onClick={() => go(i)}
                  className="group min-w-0 rounded-md pt-3 text-start focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="relative block h-1.5 overflow-hidden rounded-full bg-white/25">
                    {i < safe && <span className="absolute inset-0 rounded-full bg-white/70" />}
                    {i === safe && (
                      <span
                        key={safe}
                        onAnimationEnd={next}
                        className="hs-bar absolute inset-0 origin-left rounded-full bg-[color:var(--ta)] rtl:origin-right"
                        style={{ animationDuration: `${HERO_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                      />
                    )}
                  </span>
                  <span className={`mt-2 hidden truncate text-xs font-bold transition-colors duration-200 md:block ${i === safe ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>
                    {s.data.name}
                  </span>
                </button>
              ))}
            </div>
            <span dir="ltr" className="hidden flex-shrink-0 pb-1 text-sm font-black tabular-nums text-white/80 sm:block">
              {String(safe + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
            <div className="flex flex-shrink-0 gap-3 pb-1 pe-1">
              <button type="button" onClick={prev} aria-label={t('prevSlide')} className={HERO_ARROW}><FiChevronLeft aria-hidden="true" className="h-5 w-5 rtl:rotate-180" /></button>
              <button type="button" onClick={next} aria-label={t('nextSlide')} className={HERO_ARROW}><FiChevronRight aria-hidden="true" className="h-5 w-5 rtl:rotate-180" /></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

const OfferCard = memo(({ offer, index, darkMode, language, onViewDetail, t }) => {
  const meta = useOfferMeta(offer, language);
  const open = useCallback(() => onViewDetail(offer.id), [onViewDetail, offer.id]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const isAr = language === 'ar';
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const body = darkMode ? 'text-neutral-300' : 'text-gray-700';
  const neon = darkMode ? 'text-[#39ff88]' : 'text-emerald-600';
  const media = meta.isPct
    ? (darkMode ? 'bg-[#facc15] text-black' : 'bg-amber-300 text-amber-950')
    : 'bg-[color:var(--acc)] text-emerald-950';
  return (
    <div className="hp-rise min-w-0" style={STAGGER[index % PAGE_SIZE]}>
      <article
        onClick={open}
        onKeyDown={handleKey}
        tabIndex={0}
        aria-label={offer.name}
        className={`group relative h-full cursor-pointer overflow-hidden ${neoCard(darkMode, 'sm', true)}`}
      >
        <div className={`hp-media flex h-28 items-baseline justify-center gap-2 border-b-[3px] border-[color:var(--ink)] pt-7 ${media}`}>
          <span dir="ltr" className="text-5xl font-black leading-none tabular-nums">{meta.isPct ? `${offer.discountValue}%` : offer.discountValue}</span>
          <span className="text-xs font-extrabold uppercase">{meta.isFixed ? 'EGP ' : ''}{t('off')}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3.5">
          <div className="flex flex-1 flex-col gap-1.5 pb-3">
            <h3 className={`line-clamp-1 text-sm font-extrabold uppercase leading-snug ${isAr ? 'tracking-normal' : 'tracking-[-0.01em]'} ${ink}`}>{offer.name}</h3>
            <p className={`line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-relaxed ${body}`}>{offer.description || t('descriptionFallback')}</p>
            {meta.range && <MetaRow icon={FiCalendar} className={body} iconClass={neon}><span dir="ltr">{meta.range}</span></MetaRow>}
            {meta.remaining && (
              <MetaRow icon={FiClock} className={meta.urgent ? (darkMode ? 'text-orange-300' : 'text-orange-700') : body} iconClass={meta.urgent ? '' : neon}>{meta.remaining}</MetaRow>
            )}
            {!meta.isActive && <MetaRow icon={FiX} className={body} iconClass="text-rose-500">{t('inactive')}</MetaRow>}
            {offer.shopName && offer.shopId && (
              <Link to={shopPath(offer.shopId)} onClick={(e) => e.stopPropagation()} className={`flex min-h-6 w-fit max-w-full items-center gap-2 text-xs font-bold underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 ${ink}`}>
                <RiStoreLine aria-hidden="true" className={`h-3.5 w-3.5 flex-shrink-0 ${neon}`} /><span className="truncate">{offer.shopName}</span>
              </Link>
            )}
          </div>
          <CardFooter label={t('offerDetails')} darkMode={darkMode} isAr={isAr} />
        </div>
      </article>
    </div>
  );
});

const Skeletons = memo(({ darkMode, count }) => (
  <div className={GRID} role="status" aria-busy="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`h-[340px] animate-pulse rounded-2xl motion-reduce:animate-none ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70'}`} />
    ))}
  </div>
));

const StateBox = memo(({ darkMode, label, hint, onRetry, fetching, retryLabel }) => (
  <div className={`flex flex-col items-center rounded-2xl border-[3px] border-dashed py-12 text-center ${darkMode ? 'border-[#39ff88]/40 bg-[#1e1e1e]' : 'border-emerald-300 bg-white/60'}`}>
    <IsoIllustration type="offers" tone="emerald" darkMode={darkMode} onGreen={false} className="mb-3 h-32 w-32" />
    <p className={`text-base font-extrabold uppercase ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{label}</p>
    {hint && <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>{hint}</p>}
    {onRetry && (
      <button type="button" onClick={() => onRetry()} className={`mt-5 ${neoBtn(darkMode, true)}`}>
        <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />{retryLabel}
      </button>
    )}
  </div>
));

const pageWindow = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 3) [2, 3, 4].forEach((x) => set.add(x));
  if (cur >= total - 2) [total - 1, total - 2, total - 3].forEach((x) => set.add(x));
  const nums = [...set].filter((x) => x >= 1 && x <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((x, i) => { if (i && x - nums[i - 1] > 1) out.push(`gap-${x}`); out.push(x); });
  return out;
};

const Pager = memo(({ page, totalPages, onChange, pending, darkMode, t }) => {
  if (totalPages <= 1) return null;
  const arrow = `${neoBtn(darkMode, false)} !w-11 !px-0`;
  return (
    <nav aria-label={t('pagination')} aria-busy={pending} className="mt-10 flex flex-wrap items-center justify-center gap-3 pe-2">
      <button type="button" className={arrow} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </button>
      {pageWindow(page, totalPages).map((x) => (typeof x === 'number' ? (
        <button
          key={x} type="button" onClick={() => onChange(x)}
          aria-label={`${t('page')} ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`${neoBtn(darkMode, x === page)} !min-w-11 !px-2 tabular-nums`}
        >
          <span dir="ltr">{x}</span>
        </button>
      ) : <span key={x} aria-hidden="true" className={`px-1 font-extrabold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>…</span>))}
      <button type="button" className={arrow} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
        <FiChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </button>
    </nav>
  );
});

const InfoRow = ({ Icon, label, value, darkMode, children }) => (
  <div className={`flex items-center gap-3 rounded-xl border-2 border-dotted border-[color:var(--ink)] p-3 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
    <span aria-hidden="true" className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950">
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0 flex-1">
      <p className={`text-[11px] font-extrabold uppercase ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>{label}</p>
      <p className={`truncate text-sm font-bold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{value}</p>
    </div>
    {children}
  </div>
);

const OfferDetailModal = memo(({ offerId, darkMode, language, onClose, t }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  useModalLock(true, onClose);

  const { data: offer, isLoading, isError, error } = useQuery({
    queryKey: ['offerDetail', offerId],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get(`/api/users/offers/${encodeURIComponent(offerId)}`, { headers: authHeaders(), signal });
        if (!data || data.id == null) throw Object.assign(new Error('Invalid offer response'), { response: { status: 404 } });
        return normalizeOffer(data);
      } catch (err) {
        if (!isUnauthorized(err) && !signal?.aborted) {
          const cached = findInList(qc, offerId);
          if (cached) return cached;
        }
        throw err;
      }
    },
    enabled: !!offerId,
    staleTime: 60 * 1000,
    placeholderData: () => findInList(qc, offerId),
  });

  useEffect(() => {
    if (!isError) return;
    if (isUnauthorized(error)) expireSession(navigate);
    else toast({ icon: 'error', title: tr(language, 'offerFailed'), timer: 3500 });
  }, [isError, error, navigate, language]);

  const meta = useOfferMeta(offer || EMPTY_OFFER, language);
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const shopLink = offer?.shopId ? shopPath(offer.shopId) : null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={offer?.name || t('offerDetails')}>
      <div className="hp-fade absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`hp-modal relative max-h-[92vh] w-full overflow-y-auto overscroll-contain sm:max-w-md ${neoCard(darkMode, 'lg')}`}>
        <div className={`relative border-b-[3px] border-[color:var(--ink)] p-5 pe-16 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-emerald-50'}`}>
          <h2 className={`line-clamp-2 text-lg font-extrabold uppercase ${ink}`}>
            <span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{offer?.name || t('offerDetails')}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label={t('close')} className={`${neoIcon(darkMode)} absolute end-4 top-4`}>
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {isLoading ? (
            <div className="flex justify-center py-12" role="status" aria-label={t('loading')}>
              <span className="h-9 w-9 animate-spin rounded-full border-4 border-[color:var(--acc)] border-t-transparent motion-reduce:animate-none" />
            </div>
          ) : offer ? (
            <>
              {offer.description && <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-neutral-200' : 'text-gray-800'}`}>{offer.description}</p>}
              <InfoRow Icon={FiTag} label={t('youSave')} value={meta.amount} darkMode={darkMode} />
              {meta.range && <InfoRow Icon={FiCalendar} label={t('validPeriod')} value={<span dir="ltr">{meta.range}</span>} darkMode={darkMode} />}
              {meta.remaining && <InfoRow Icon={FiClock} label={meta.isActive ? t('active') : t('inactive')} value={meta.remaining} darkMode={darkMode} />}
              {offer.shopName && (
                <InfoRow Icon={RiStoreLine} label={t('shop')} value={offer.shopName} darkMode={darkMode} />
              )}
            </>
          ) : (
            <p className={`py-10 text-center text-sm font-bold uppercase ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>{t('notFound')}</p>
          )}

          <div className={`grid gap-3 pb-1 pe-1 pt-2 ${shopLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button type="button" onClick={onClose} className={neoBtn(darkMode, false)}>{t('close')}</button>
            {shopLink && (
              <Link to={shopLink} onClick={onClose} className={neoBtn(darkMode, true)}>
                <RiStoreLine aria-hidden="true" className="h-4 w-4" />{t('visitShop')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const FilterBar = memo(({ filter, counts, onChange, darkMode, t }) => (
  <div role="group" aria-label={t('filterLabel')} className="mb-10 flex flex-wrap gap-3 pb-2 pe-2">
    {FILTERS.map(([key, labelKey]) => (
      <button
        key={key}
        type="button"
        aria-pressed={filter === key}
        onClick={() => onChange(key)}
        className={neoBtn(darkMode, filter === key)}
      >
        <span>{t(labelKey)}</span>
        <span dir="ltr" className="tabular-nums">({counts[key]})</span>
      </button>
    ))}
  </div>
));

const OffersContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const t = useCallback((key) => tr(language, key), [language]);
  const isAr = language === 'ar';
  const token = useAuthGuard();
  useScrollTopOnEnter();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [detailId, setDetailId] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { document.title = 'Exclusive Offers | Tech-Restore'; }, []);

  const { data: offers = EMPTY_LIST, isLoading, isError, isFetching, error, refetch } = useQuery({
    queryKey: ['offers'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/offers', { headers: authHeaders(), signal });
      const raw = res.data?.content || res.data || [];
      return (Array.isArray(raw) ? raw : []).filter((o) => o && o.id != null).map(normalizeOffer);
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  const { data: latest = EMPTY_LIST, isLoading: latestLoading } = useQuery({
    queryKey: ['latestProducts'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/products', { signal });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const p of list) if (p && p.id != null && !p.deleted && (Number(p.stock) || 0) > 0) out.push(normalizeLatest(p));
      out.sort((a, b) => b.ts - a.ts || b.num - a.num);
      return out.slice(0, LATEST_LIMIT);
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isError && isUnauthorized(error)) expireSession(navigate);
  }, [isError, error, navigate]);

  const counts = useMemo(() => {
    const out = {};
    for (const [key, , fn] of FILTERS) out[key] = offers.reduce((n, o) => n + (fn(o) ? 1 : 0), 0);
    return out;
  }, [offers]);

  const slides = useMemo(() => {
    const deals = offers.filter((o) => o.status === 'ACTIVE').sort((a, b) => offerScore(b) - offerScore(a)).slice(0, OFFER_SLIDES);
    const out = [];
    const n = Math.max(deals.length, latest.length);
    for (let i = 0; i < n; i++) {
      if (deals[i]) out.push({ kind: 'offer', key: `o${deals[i].id}`, data: deals[i] });
      if (latest[i]) out.push({ kind: 'product', key: `p${latest[i].id}`, data: latest[i] });
    }
    return out.map((s, i) => ({ ...s, theme: THEMES[i % THEMES.length] }));
  }, [offers, latest]);

  const heroLoading = (isLoading || latestLoading) && slides.length === 0;

  const filtered = useMemo(() => offers.filter(FILTER_FN[filter]), [offers, filter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

  const changePage = useCallback((p) => startTransition(() => setPage(Math.min(Math.max(1, p), totalPages))), [totalPages]);
  const changeFilter = useCallback((f) => startTransition(() => { setFilter(f); setPage(1); }), []);
  const openDetail = useCallback((id) => setDetailId(id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const openProduct = useCallback((id) => navigate(`/device/${encodeURIComponent(id)}`), [navigate]);

  const showError = isError && !isUnauthorized(error);

  return (
    <div
      dir={languageDirection(language)}
      lang={language}
      className={`min-h-screen overflow-x-hidden ${isAr ? 'font-cairo' : 'font-jakarta'} ${darkMode ? `${DARK_PAGE} text-white` : 'bg-gray-50 text-gray-900'}`}
    >
      <Device3DStyles />
      <style>{EXTRAS_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <h1 className="sr-only">{t('activeOffers')}</h1>
      <HeroSlider slides={slides} loading={heroLoading} language={language} onOffer={openDetail} onProduct={openProduct} t={t} />

      <section
        aria-busy={isPending}
        className={`hp-pattern ${darkMode ? 'hp-pattern-dark' : ''} py-14 sm:py-20 ${LAZY_SECTION} ${darkMode ? DARK_PAGE : 'bg-gray-50'}`}
      >
        <div className={`mx-auto max-w-7xl px-4 transition-opacity duration-150 sm:px-6 lg:px-8 ${isPending ? 'opacity-70' : ''}`}>
          <div className="mb-10">
            <SectionTitle
              darkMode={darkMode}
              isAr={isAr}
              label={isLoading ? t('activeOffers') : `${offers.length} ${t('available')}`}
              title={t('activeOffers')}
              subtitle={t('checkBack')}
            />
          </div>

          {!isLoading && !showError && offers.length > 0 && (
            <FilterBar filter={filter} counts={counts} onChange={changeFilter} darkMode={darkMode} t={t} />
          )}

          {isLoading ? (
            <Skeletons darkMode={darkMode} count={6} />
          ) : showError ? (
            <StateBox darkMode={darkMode} label={t('loadFail')} onRetry={refetch} fetching={isFetching} retryLabel={t('tryAgain')} />
          ) : offers.length === 0 ? (
            <StateBox darkMode={darkMode} label={t('noActive')} hint={t('checkBack')} />
          ) : paged.length === 0 ? (
            <StateBox darkMode={darkMode} label={t('noMatch')} />
          ) : (
            <>
              <div className={GRID}>
                {paged.map((o, i) => (
                  <OfferCard key={o.id} offer={o} index={i} darkMode={darkMode} language={language} onViewDetail={openDetail} t={t} />
                ))}
              </div>
              <Pager page={safePage} totalPages={totalPages} onChange={changePage} pending={isPending} darkMode={darkMode} t={t} />
            </>
          )}
        </div>
      </section>

      {detailId && <OfferDetailModal key={detailId} offerId={detailId} darkMode={darkMode} language={language} onClose={closeDetail} t={t} />}
    </div>
  );
});

export { queryClient };
export default function Offers(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <OffersContent {...props} />
    </QueryClientProvider>
  );
}