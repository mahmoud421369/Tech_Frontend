import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useId, memo, useTransition, useDeferredValue, useSyncExternalStore,
} from 'react';
import { Link, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiX, FiCalendar, FiClock, FiTag, FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch, FiSliders, FiCheck,
  FiPercent, FiChevronDown, FiShield, FiBox, FiGrid,
} from 'react-icons/fi';
import { RiStoreLine } from 'react-icons/ri';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import api from '../common/api/api';
import queryClient from '../common/utils/queryClient';
import { useModalLock, clean, safeImageUrl } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { authHeaders, expireSession, isUnauthorized, useAuthGuard } from '../common/utils/auth';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

gsap.registerPlugin(ScrollTrigger);

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
    noMatch: 'No offers match your filters', viewOffer: 'View offer',
    offerFailed: 'Failed to load offer', pagination: 'Pagination', prevPage: 'Previous page', nextPage: 'Next page',
    page: 'Page', loading: 'Loading', shopNow: 'Shop now', search: 'Search offers', sortBy: 'Sort by',
    sortBest: 'Highest discount', sortEnding: 'Ending soonest', sortName: 'Name A–Z',
    discountType: 'Discount type', shops: 'Shops', allShops: 'All shops', filters: 'Filters',
    clearAll: 'Clear filters', results: 'results', newArrivals: 'New arrivals', newArrivalsHint: 'Fresh in stock at Tech-Restore',
    showResults: 'Show results', scrollProgress: 'Page progress',
    pageSub: 'Exclusive discounts from trusted repair and device shops. New offers land all the time.',
    condition: 'Condition', conditionNew: 'New', conditionLikeNew: 'Like new', conditionUsed: 'Used',
    conditionRefurbished: 'Refurbished', conditionGood: 'Good', conditionFair: 'Fair', conditionExcellent: 'Excellent',
  },
  ar: {
    crumbHome: 'الرئيسية', crumbOffers: 'العروض', breadcrumb: 'مسار التنقل',
    filterAll: 'كل العروض', filterPercent: 'نسبة مئوية', filterFixed: 'مبلغ ثابت', filterSoon: 'تنتهي قريبًا',
    filterLabel: 'تصفية العروض', tryAgain: 'حاول مرة أخرى', loadFail: 'تعذّر تحميل العروض حاليًا.',
    noMatch: 'لا توجد عروض مطابقة', viewOffer: 'عرض التفاصيل',
    offerFailed: 'تعذّر تحميل العرض', pagination: 'الصفحات', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية',
    page: 'صفحة', loading: 'جارٍ التحميل', shopNow: 'تسوّق الآن', search: 'ابحث في العروض', sortBy: 'ترتيب حسب',
    sortBest: 'أعلى خصم', sortEnding: 'الأقرب انتهاءً', sortName: 'الاسم أ–ي',
    discountType: 'نوع الخصم', shops: 'المتاجر', allShops: 'كل المتاجر', filters: 'التصفية',
    clearAll: 'مسح التصفية', results: 'نتيجة', newArrivals: 'وصل حديثًا', newArrivalsHint: 'جديد في المخزون',
    showResults: 'عرض النتائج', scrollProgress: 'تقدم الصفحة',
    pageSub: 'خصومات حصرية من متاجر صيانة وأجهزة موثوقة، وعروض جديدة طوال الوقت.',
    condition: 'الحالة', conditionNew: 'جديد', conditionLikeNew: 'كالجديد', conditionUsed: 'مستعمل',
    conditionRefurbished: 'مجدّد', conditionGood: 'جيد', conditionFair: 'مقبول', conditionExcellent: 'ممتاز',
  },
  fr: {
    crumbHome: 'Accueil', crumbOffers: 'Offres', breadcrumb: "Fil d'Ariane",
    filterAll: 'Toutes les offres', filterPercent: 'Pourcentage', filterFixed: 'Montant fixe', filterSoon: 'Bientôt terminées',
    filterLabel: 'Filtrer les offres', tryAgain: 'Réessayer', loadFail: 'Impossible de charger les offres pour le moment.',
    noMatch: 'Aucune offre ne correspond', viewOffer: "Voir l'offre",
    offerFailed: "Échec du chargement de l'offre", pagination: 'Pagination', prevPage: 'Page précédente', nextPage: 'Page suivante',
    page: 'Page', loading: 'Chargement', shopNow: 'Acheter', search: 'Rechercher une offre', sortBy: 'Trier par',
    sortBest: 'Meilleure remise', sortEnding: 'Fin la plus proche', sortName: 'Nom A–Z',
    discountType: 'Type de remise', shops: 'Boutiques', allShops: 'Toutes les boutiques', filters: 'Filtres',
    clearAll: 'Effacer les filtres', results: 'résultats', newArrivals: 'Nouveautés', newArrivalsHint: 'Tout juste en stock',
    showResults: 'Voir les résultats', scrollProgress: 'Progression de la page',
    pageSub: 'Remises exclusives de boutiques de réparation et d’appareils de confiance. De nouvelles offres arrivent sans cesse.',
    condition: 'État', conditionNew: 'Neuf', conditionLikeNew: 'Comme neuf', conditionUsed: "D'occasion",
    conditionRefurbished: 'Reconditionné', conditionGood: 'Bon état', conditionFair: 'État correct', conditionExcellent: 'Excellent état',
  },
};

const tr = (language, key) =>
  OFFER_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  OFFER_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

const PAGE_CSS = `
${EXTRAS_CSS}
@font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
.of{--bd:#e5e7eb;--sf:#ffffff;--sf2:#f3f4f6;--tx:#052e1e;--mu:rgba(5,46,30,.68);--acc:#059669;--ln:#000000;--shd:#000000;--pg:#ffffff;--hi:rgba(255,255,255,.8);--scrim:rgba(0,0,0,.6);--warn:#c2410c;--dx:1;background:var(--pg);color:var(--tx);color-scheme:light;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.of[dir=rtl]{--dx:-1}
.of-dark{--bd:rgba(255,255,255,.16);--sf:#1c1c1e;--sf2:#2a2a2e;--tx:#ffffff;--mu:rgba(255,255,255,.66);--acc:#39ff88;--ln:rgba(255,255,255,.16);--shd:#0b4a35;--pg:#141414;--hi:rgba(255,255,255,.08);--scrim:rgba(0,0,0,.72);--warn:#fdba74;color-scheme:dark}
.of[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
.of[lang=ar] *{letter-spacing:0!important}
.of button,.of input{font-family:inherit}
html.lenis,html.lenis body{height:auto}
.lenis.lenis-smooth{scroll-behavior:auto!important}
.lenis.lenis-stopped{overflow:clip}
@keyframes ofShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.of-sk{position:relative;overflow:hidden;border-radius:8px;background:var(--bd)}
.of-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--hi),transparent);animation:ofShimmer 1.3s ease-in-out infinite}
.of[dir=rtl] .of-sk::after{animation-direction:reverse}
@keyframes ofFade{from{opacity:0}to{opacity:1}}
@keyframes ofFadeOut{from{opacity:1}to{opacity:0}}
.of-fade{animation:ofFade .18s ease-out both}
.of-fade-out{animation:ofFadeOut .18s ease-in both}
@keyframes ofModal{from{opacity:0;transform:translate3d(0,24px,0)}to{opacity:1;transform:none}}
@keyframes ofModalOut{from{opacity:1;transform:none}to{opacity:0;transform:translate3d(0,24px,0)}}
.of-modal{animation:ofModal .24s cubic-bezier(.2,.8,.2,1) both}
.of-modal-out{animation:ofModalOut .18s ease-in both}
@keyframes ofDrawer{from{transform:translate3d(calc(var(--dx,1)*-100%),0,0)}to{transform:none}}
@keyframes ofDrawerOut{from{transform:none}to{transform:translate3d(calc(var(--dx,1)*-100%),0,0)}}
.of-drawer{animation:ofDrawer .26s cubic-bezier(.2,.8,.2,1) both}
.of-drawer-out{animation:ofDrawerOut .18s ease-in both}
@keyframes ofPop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.of-pop{animation:ofPop .14s cubic-bezier(.2,.8,.2,1) both;transform-origin:top}
.of-grid{content-visibility:auto;contain-intrinsic-size:auto 600px;padding:10px;margin:-10px}
.of-scroll{scrollbar-width:thin;scrollbar-color:var(--acc) transparent;overscroll-behavior:contain}
@media (hover:hover){.of-lift{transition:transform .15s ease,box-shadow .15s ease}.of-lift:hover{transform:translate3d(0,-3px,0);box-shadow:calc(var(--dx)*6px) 6px 0 0 var(--shd)}.of-zoom img{transition:transform .5s cubic-bezier(.22,.8,.2,1)}.of-zoom:hover img{transform:scale3d(1.05,1.05,1)}}
@media (prefers-reduced-motion:reduce){.of-sk::after,.of-fade,.of-fade-out,.of-modal,.of-modal-out,.of-drawer,.of-drawer-out,.of-pop{animation:none}.of-lift,.of-zoom img{transition:none}.of-lift:hover,.of-zoom:hover img{transform:none}}
`;
if (typeof document !== 'undefined' && !document.querySelector('style[data-offers-styles]')) {
  const tag = document.createElement('style');
  tag.setAttribute('data-offers-styles', 'true');
  tag.textContent = PAGE_CSS;
  document.head.appendChild(tag);
}

const PAGE_SIZE = 12;
const SOON_DAYS = 3;
const LATEST_LIMIT = 4;
const OFFERS_CAP = 500;
const PRODUCTS_CAP = 500;
const QUERY_MAX = 80;
const PAGE_MAX = 10000;
const LEAVE_MS = 180;
const ID_RE = /^[\w-]{1,64}$/;
const DESKTOP_Q = '(min-width: 1024px)';
const REDUCED_Q = '(prefers-reduced-motion: reduce)';
const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };
const EMPTY_LIST = [];
const EMPTY_OFFER = { discountType: '', discountValue: 0, status: 'INACTIVE' };
const DEFAULTS = { type: 'all', sort: 'best', page: '1' };
const SORTS = [['best', 'sortBest'], ['ending', 'sortEnding'], ['name', 'sortName']];
const GRID = 'grid grid-cols-1 gap-6 min-[720px]:grid-cols-2 xl:grid-cols-3';
const SK_OFFERS = [0, 1, 2, 3, 4, 5];
const SK_LATEST = [0, 1, 2, 3];
const SK_ROWS = [0, 1, 2, 3];
const QUERY_OPTS = { retry: false, refetchOnWindowFocus: false };
const CONDITION_KEYS = {
  NEW: 'conditionNew', LIKE_NEW: 'conditionLikeNew', USED: 'conditionUsed', REFURBISHED: 'conditionRefurbished',
  GOOD: 'conditionGood', FAIR: 'conditionFair', EXCELLENT: 'conditionExcellent',
};

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const PRESS = 'transition-[transform,box-shadow,background-color,color,border-color] duration-150 active:translate-y-0.5 active:[box-shadow:none] motion-reduce:transition-none';
const SHADOW = (n) => `[box-shadow:calc(var(--dx)*${n}px)_${n}px_0_0_var(--shd)]`;
const CARD = `rounded-2xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(4)}`;
const CHIP = 'border-2 border-black bg-[#39ff88] text-emerald-950';
const CHIP_WARN = 'border-2 border-black bg-amber-300 text-black';
const CHIP_BAD = 'border-2 border-black bg-rose-400 text-black';
const BTN_BASE = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] px-5 py-2.5 text-sm font-extrabold ${PRESS} ${FOCUS} disabled:cursor-not-allowed disabled:opacity-50`;
const BTN_PRIMARY = `${BTN_BASE} border-black bg-[#39ff88] text-emerald-950 ${SHADOW(3)} hover:bg-[#7dffb0]`;
const BTN_SECONDARY = `${BTN_BASE} border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(3)} hover:bg-[color:var(--sf2)]`;
const BTN_SMALL = 'min-h-10 !px-3 !py-2 text-xs';
const BTN_ICON = `inline-flex cursor-pointer items-center justify-center rounded-xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(3)} ${PRESS} ${FOCUS} hover:bg-[color:var(--sf2)] disabled:cursor-not-allowed disabled:opacity-40`;
const FIELD = `rounded-xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(3)}`;
const TEXT_LINK = `rounded-md hover:underline hover:decoration-2 hover:underline-offset-4 ${FOCUS}`;

let lenisRef = null;

const prefersReduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_Q).matches;

const scrollToEl = (el) => {
  if (!el) return;
  if (lenisRef) lenisRef.scrollTo(el, { offset: -144, duration: 1 });
  else el.scrollIntoView({ block: 'start', behavior: prefersReduced() ? 'auto' : 'smooth' });
};

const useLenis = (barRef) => {
  useEffect(() => {
    if (prefersReduced()) return undefined;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, autoRaf: false });
    lenisRef = lenis;
    const bar = barRef.current;
    const setX = bar ? gsap.quickSetter(bar, 'scaleX') : null;
    const onScroll = ({ progress }) => {
      ScrollTrigger.update();
      if (setX) setX(Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0)));
    };
    lenis.on('scroll', onScroll);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    onScroll(lenis);
    return () => {
      gsap.ticker.remove(tick);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      if (lenisRef === lenis) lenisRef = null;
    };
  }, [barRef]);
};

const useLenisPause = (active) => {
  useEffect(() => {
    if (!active) return undefined;
    lenisRef?.stop();
    return () => lenisRef?.start();
  }, [active]);
};

const subscribeDesktop = (cb) => {
  const m = window.matchMedia(DESKTOP_Q);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const getDesktop = () => window.matchMedia(DESKTOP_Q).matches;
const getDesktopServer = () => false;
const useIsDesktop = () => useSyncExternalStore(subscribeDesktop, getDesktop, getDesktopServer);

const useIdleFlag = (active) => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active || on) return undefined;
    if (typeof window.requestIdleCallback === 'function') {
      const h = window.requestIdleCallback(() => setOn(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(h);
    }
    const h = setTimeout(() => setOn(true), 300);
    return () => clearTimeout(h);
  }, [active, on]);
  return on;
};

const useLeave = (onClose) => {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(0);
  const request = useCallback(() => {
    if (timer.current) return;
    if (prefersReduced()) { onClose(); return; }
    setLeaving(true);
    timer.current = window.setTimeout(onClose, LEAVE_MS);
  }, [onClose]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [leaving, request];
};

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    if (lenisRef) lenisRef.scrollTo(0, { immediate: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navType]);
};

const numCache = {};
const money = (n, language) => {
  const loc = LOCALES[language] || 'en-GB';
  numCache[loc] ||= new Intl.NumberFormat(loc, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `EGP ${numCache[loc].format(Number(n || 0))}`;
};

const plainNums = {};
const plainNum = (n, language) => {
  const loc = LOCALES[language] || 'en-GB';
  plainNums[loc] ||= new Intl.NumberFormat(loc, { maximumFractionDigits: 2 });
  return plainNums[loc].format(n);
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
  if (v == null || v === '' || typeof v === 'object' || typeof v === 'boolean') return null;
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

const safeId = (v) => {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  const s = String(v);
  return ID_RE.test(s) ? s : '';
};

const safeStr = (v, max) => (typeof v === 'string' || typeof v === 'number' ? clean(String(v), max) : '');
const safeImg = (v) => (typeof v === 'string' && v.length <= 2048 ? safeImageUrl(v) || '' : '');
const safeParam = (v) => (v && ID_RE.test(v) ? v : '');
const stripControl = (v) => v.replace(/[\p{Cc}\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu, '');
const round2 = (n) => Math.round(n * 100) / 100;
const shopPath = (id) => `/shops/${encodeURIComponent(id)}`;
const findInList = (qc, id) => (qc.getQueryData(['offers']) || []).find((o) => o.id === id);

const normalizeOffer = (o) => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const id = safeId(o.id);
  if (!id) return null;
  const type = normType(o.discountType);
  const isPct = type === 'PERCENTAGE';
  const raw = Math.max(0, Number(o.discountValue) || 0);
  const value = Number.isFinite(raw) ? raw : 0;
  const start = toDate(o.startDate);
  const end = toDate(o.endDate);
  return {
    id,
    name: safeStr(o.name, 120),
    description: safeStr(o.description, 600),
    discountType: type,
    discountValue: isPct ? Math.min(value, 100) : Math.min(value, 1e9),
    startDate: start ? start.toISOString() : null,
    endDate: end ? end.toISOString() : null,
    status: o.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    shopId: safeId(o.shopId),
    shopName: safeStr(o.shopName, 80),
  };
};

const pickImage = (p) => {
  const first = Array.isArray(p.images) ? p.images[0] : null;
  const nested = typeof first === 'string' ? first : first && typeof first === 'object' ? first.url || first.imageUrl : '';
  return safeImg(p.imageUrl) || safeImg(p.image) || safeImg(nested) || safeImg(p.thumbnail) || '';
};

const normCondition = (v) => {
  const raw = safeStr(v, 40);
  if (!raw) return { key: '', text: '' };
  const key = raw.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return { key, text: raw.replace(/_/g, ' ') };
};

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
  const category = p.categoryName ?? (p.category && typeof p.category === 'object' ? p.category.name : p.category);
  return {
    id: String(p.id),
    name: safeStr(p.name, 120),
    description: safeStr(p.description, 220),
    categoryName: safeStr(category, 60),
    condition: normCondition(p.condition ?? p.productCondition),
    price,
    finalPrice,
    saving,
    pct: saving > 0 && price > 0 ? Math.max(1, Math.round((saving / price) * 100)) : 0,
    img: pickImage(p),
    ts: Date.parse(p.createdAt) || 0,
    num: Number(p.id) || 0,
  };
};

const isSoon = (o) => o.status === 'ACTIVE' && o.days !== null && o.days <= SOON_DAYS;

const FILTERS = [
  ['all', 'filterAll', () => true],
  ['percent', 'filterPercent', (o) => o.discountType === 'PERCENTAGE'],
  ['fixed', 'filterFixed', (o) => o.discountType === 'FIXED_AMOUNT'],
  ['soon', 'filterSoon', isSoon],
];
const FILTER_FN = Object.fromEntries(FILTERS.map(([key, , fn]) => [key, fn]));

const offerScore = (o) => (o.discountType === 'PERCENTAGE' ? o.discountValue : 0);

const sortOffers = (list, sort, language) => {
  const out = list.slice();
  if (sort === 'ending') out.sort((a, b) => (a.days ?? 1e9) - (b.days ?? 1e9));
  else if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, language));
  else out.sort((a, b) => offerScore(b) - offerScore(a) || b.discountValue - a.discountValue);
  return out;
};

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

const Sk = ({ className = '' }) => <div aria-hidden="true" className={`of-sk ${className}`} />;

const IconTile = memo(({ Icon, className = 'h-9 w-9', iconClassName = 'h-4 w-4' }) => (
  <span aria-hidden="true" className={`flex flex-shrink-0 items-center justify-center rounded-lg ${CHIP} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const CardTitle = memo(({ children, className = 'mb-4' }) => (
  <h3 className={`${className} text-sm font-extrabold tracking-wide rtl:tracking-normal`}>{children}</h3>
));

const Crumbs = memo(({ t }) => (
  <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-1.5 text-xs font-bold sm:text-sm">
    <Link to="/" className={TEXT_LINK}>{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3 w-3 flex-shrink-0 text-[color:var(--mu)] rtl:rotate-180" />
    <span className="text-[color:var(--mu)]" aria-current="page">{t('crumbOffers')}</span>
  </nav>
));

const StatusPill = memo(({ active, text }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${active ? 'border-2 border-black bg-black text-[#39ff88]' : CHIP_BAD}`}>
    {text}
  </span>
));

const OfferCard = memo(({ offer, language, onViewDetail, t }) => {
  const meta = useOfferMeta(offer, language);
  const open = useCallback(() => onViewDetail(offer.id), [onViewDetail, offer.id]);
  const onButton = useCallback((e) => { e.stopPropagation(); onViewDetail(offer.id); }, [onViewDetail, offer.id]);
  const stop = useCallback((e) => e.stopPropagation(), []);
  const hasDiscount = offer.discountValue > 0;
  return (
    <article
      data-card
      aria-label={offer.name}
      onClick={open}
      className={`of-lift flex h-full cursor-pointer flex-col overflow-hidden ${CARD} ${meta.isActive ? '' : 'opacity-80'}`}
    >
      <div className="flex items-center justify-between gap-3 border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf2)] px-4 py-3">
        {hasDiscount ? (
          <div dir="ltr" className="flex items-baseline gap-1 leading-none">
            {meta.isFixed && <span className="text-xs font-semibold">EGP</span>}
            <span className="text-3xl font-extrabold tabular-nums tracking-tight">{plainNum(offer.discountValue, language)}</span>
            {meta.isPct && <FiPercent aria-hidden="true" className="h-5 w-5 self-center" strokeWidth={3} />}
            <span className="ms-1 text-[11px] font-extrabold text-[color:var(--acc)]">{t('off')}</span>
          </div>
        ) : (
          <IconTile Icon={FiTag} className="h-10 w-10" iconClassName="h-5 w-5" />
        )}
        <StatusPill active={meta.isActive} text={meta.isActive ? t('active') : t('inactive')} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-extrabold leading-snug">{offer.name}</h3>
        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-[color:var(--mu)]">{offer.description || t('descriptionFallback')}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-2 border-[color:var(--bd)] pt-3 text-xs">
          {offer.shopName && offer.shopId ? (
            <Link to={shopPath(offer.shopId)} onClick={stop} className={`flex min-w-0 items-center gap-1.5 font-bold ${TEXT_LINK}`}>
              <RiStoreLine aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--acc)]" />
              <span className="truncate">{offer.shopName}</span>
            </Link>
          ) : offer.shopName ? (
            <span className="flex min-w-0 items-center gap-1.5 font-bold">
              <RiStoreLine aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--acc)]" />
              <span className="truncate">{offer.shopName}</span>
            </span>
          ) : <span />}
          {meta.remaining && (
            <span className={`flex items-center gap-1 font-semibold ${meta.urgent && meta.isActive ? 'text-[color:var(--warn)]' : 'text-[color:var(--mu)]'}`}>
              <FiClock aria-hidden="true" className="h-3 w-3 flex-shrink-0" />{meta.remaining}
            </span>
          )}
        </div>
        <button type="button" onClick={onButton} className={`${BTN_PRIMARY} ${BTN_SMALL} mt-auto w-full`}>{t('viewOffer')}</button>
      </div>
    </article>
  );
});

const ProductCard = memo(({ product, darkMode, language, t }) => {
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);
  const { condition } = product;
  const conditionLabel = condition.key && CONDITION_KEYS[condition.key] ? t(CONDITION_KEYS[condition.key]) : condition.text;
  return (
    <Link
      data-reveal
      to={`/device/${encodeURIComponent(product.id)}`}
      className={`of-lift of-zoom group relative flex min-w-0 flex-col overflow-hidden ${CARD} ${FOCUS}`}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf2)]">
        {product.img && !failed ? (
          <img
            src={product.img} alt={product.name} width={320} height={320} loading="lazy" decoding="async"
            referrerPolicy="no-referrer" onError={onError} className="h-full w-full object-contain p-4"
          />
        ) : (
          <IsoIllustration type="offers" tone="emerald" onGreen={false} darkMode={darkMode} className="h-1/2 w-1/2" />
        )}
        {product.pct > 0 && (
          <span dir="ltr" className={`absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ${CHIP}`}>-{product.pct}%</span>
        )}
        {conditionLabel && (
          <span className={`absolute end-3 top-3 inline-flex max-w-[60%] items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${CHIP_WARN}`}>
            <FiShield aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{conditionLabel}</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.categoryName && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--acc)]">
            <FiGrid aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{product.categoryName}</span>
          </span>
        )}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold leading-5">{product.name}</h3>
        {product.description && <p className="line-clamp-2 text-xs leading-5 text-[color:var(--mu)]">{product.description}</p>}
        {conditionLabel && (
          <p className="text-xs font-semibold text-[color:var(--mu)]">
            {t('condition')}: <span className="font-extrabold text-[color:var(--tx)]">{conditionLabel}</span>
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t-[3px] border-[color:var(--ln)] p-4">
        <div dir="ltr" className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-extrabold tabular-nums text-[color:var(--acc)]">{money(product.finalPrice, language)}</span>
          {product.saving > 0 && <span className="text-xs tabular-nums text-[color:var(--mu)] line-through">{money(product.price, language)}</span>}
        </div>
        <span className={`${BTN_PRIMARY} ${BTN_SMALL}`}>{t('shopNow')}</span>
      </div>
    </Link>
  );
});

const OfferSkeleton = memo(() => (
  <div className={`flex h-[260px] flex-col overflow-hidden ${CARD}`}>
    <div className="flex items-center justify-between border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf2)] px-4 py-3">
      <Sk className="h-8 w-24" />
      <Sk className="h-7 w-20 !rounded-full" />
    </div>
    <div className="flex flex-1 flex-col gap-2.5 p-4">
      <Sk className="h-5 w-4/5" />
      <Sk className="h-3 w-full" />
      <Sk className="h-3 w-2/3" />
      <Sk className="mt-auto h-10 w-full" />
    </div>
  </div>
));

const Skeletons = memo(({ label }) => (
  <div className={GRID} role="status" aria-busy="true" aria-label={label}>
    {SK_OFFERS.map((i) => <OfferSkeleton key={i} />)}
  </div>
));

const ToolbarSkeleton = memo(() => (
  <div aria-hidden="true" className="mb-5 flex flex-wrap items-center gap-3">
    <Sk className="h-11 min-w-0 flex-1 basis-60" />
    <Sk className="h-11 w-40" />
  </div>
));

const HeaderChipsSkeleton = memo(() => (
  <div aria-hidden="true" className="flex gap-2">
    <Sk className="h-8 w-28 !rounded-full" />
    <Sk className="h-8 w-24 !rounded-full" />
  </div>
));

const FilterSkeleton = memo(() => (
  <div aria-hidden="true" className={`space-y-6 self-start p-4 ${CARD}`}>
    {[0, 1].map((g) => (
      <div key={g} className="space-y-2">
        <Sk className="h-4 w-24" />
        {SK_ROWS.map((r) => <Sk key={r} className="h-10 w-full" />)}
      </div>
    ))}
  </div>
));

const LatestSkeleton = memo(() => (
  <div aria-hidden="true" className="grid grid-cols-2 gap-5 lg:grid-cols-4">
    {SK_LATEST.map((i) => (
      <div key={i} className={`overflow-hidden ${CARD}`}>
        <Sk className="aspect-square w-full !rounded-none" />
        <div className="space-y-2 p-4"><Sk className="h-3 w-1/3" /><Sk className="h-4 w-full" /><Sk className="h-3 w-4/5" /><Sk className="h-10 w-full" /></div>
      </div>
    ))}
  </div>
));

const StateBox = memo(({ darkMode, label, hint, onRetry, fetching, retryLabel }) => (
  <div className={`mx-auto flex max-w-md flex-col items-center px-6 py-10 text-center ${CARD}`}>
    <IsoIllustration type="offers" tone="emerald" darkMode={darkMode} onGreen={false} className="mb-3 h-28 w-28" />
    <h2 className="text-xl font-extrabold tracking-tight rtl:tracking-normal">{label}</h2>
    {hint && <p className="mt-3 text-sm font-medium text-[color:var(--mu)]">{hint}</p>}
    {onRetry && (
      <button type="button" onClick={() => onRetry()} className={`${BTN_PRIMARY} mt-6`}>
        <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${fetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{retryLabel}
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

const Pager = memo(({ page, totalPages, onChange, pending, t }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t('pagination')} aria-busy={pending} className="flex flex-wrap items-center justify-center gap-3 pt-10">
      <button type="button" className={`${BTN_ICON} h-10 w-10`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </button>
      {pageWindow(page, totalPages).map((x) => (typeof x === 'number' ? (
        <button
          key={x} type="button" onClick={() => onChange(x)}
          aria-label={`${t('page')} ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`${x === page ? `${BTN_ICON} !border-black !bg-[#39ff88] !text-emerald-950` : BTN_ICON} h-10 min-w-[2.5rem] px-2 text-sm font-extrabold tabular-nums`}
        >
          <span dir="ltr">{x}</span>
        </button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-extrabold text-[color:var(--mu)]">…</span>))}
      <button type="button" className={`${BTN_ICON} h-10 w-10`} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
        <FiChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </button>
    </nav>
  );
});

const FilterGroup = memo(({ title, children }) => (
  <fieldset className="border-b-2 border-[color:var(--bd)] py-4 first:pt-0 last:border-b-0 last:pb-0">
    <legend className="mb-3 text-sm font-extrabold">{title}</legend>
    <div className="flex flex-col gap-1.5">{children}</div>
  </fieldset>
));

const FilterOption = memo(({ active, label, count, onClick }) => {
  const disabled = count === 0 && !active;
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border-2 px-3 text-start text-sm font-bold transition-colors duration-150 motion-reduce:transition-none ${FOCUS} disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'border-black bg-[#39ff88] text-emerald-950' : 'border-transparent hover:bg-[color:var(--sf2)]'
      }`}
    >
      <span aria-hidden="true" className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 ${active ? 'border-black' : 'border-[color:var(--ln)]'}`}>
        {active && <FiCheck className="h-3 w-3" strokeWidth={4} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span dir="ltr" className={`text-xs tabular-nums ${active ? 'opacity-80' : 'text-[color:var(--mu)]'}`}>{count}</span>
    </button>
  );
});

const FilterPanel = memo(({ type, typeCounts, onType, shop, shops, onShop, t }) => (
  <div>
    <FilterGroup title={t('discountType')}>
      {FILTERS.map(([key, labelKey]) => (
        <FilterOption key={key} active={type === key} label={t(labelKey)} count={typeCounts[key]} onClick={() => onType(key)} />
      ))}
    </FilterGroup>
    {shops.length > 0 && (
      <FilterGroup title={t('shops')}>
        <FilterOption active={!shop} label={t('allShops')} count={shops.reduce((n, s) => n + s.count, 0)} onClick={() => onShop('')} />
        {shops.map((s) => (
          <FilterOption key={s.id} active={shop === s.id} label={s.name} count={s.count} onClick={() => onShop(s.id)} />
        ))}
      </FilterGroup>
    )}
  </div>
));

const FilterDrawer = memo(({ onClose, t, total, onClear, hasFilters, children }) => {
  const [leaving, requestClose] = useLeave(onClose);
  useModalLock(true, requestClose);
  useLenisPause(true);
  return (
    <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true" aria-label={t('filters')}>
      <div className={`${leaving ? 'of-fade-out' : 'of-fade'} absolute inset-0 bg-[color:var(--scrim)]`} onClick={requestClose} aria-hidden="true" />
      <div className={`${CARD} ${leaving ? 'of-drawer-out' : 'of-drawer'} absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col overflow-hidden !rounded-s-none`}>
        <div className="flex items-center justify-between border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf2)] p-4">
          <h2 className="text-base font-extrabold">{t('filters')}</h2>
          <button type="button" onClick={requestClose} aria-label={t('close')} className={`${BTN_ICON} h-9 w-9`}>
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div data-lenis-prevent className="of-scroll flex-1 overflow-y-auto p-4">{children}</div>
        <div className="flex gap-3 border-t-[3px] border-[color:var(--ln)] p-4">
          {hasFilters && (
            <button type="button" onClick={onClear} className={`${BTN_SECONDARY} ${BTN_SMALL} flex-1`}>{t('clearAll')}</button>
          )}
          <button type="button" onClick={requestClose} className={`${BTN_PRIMARY} ${BTN_SMALL} flex-[2]`}>
            {t('showResults')} (<span dir="ltr" className="tabular-nums">{total}</span>)
          </button>
        </div>
      </div>
    </div>
  );
});

const Dropdown = memo(({ value, onChange, options, label }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId().replace(/:/g, '');
  const listId = `${uid}-list`;
  const foundIdx = options.findIndex((o) => o.value === value);
  const selectedIdx = Math.max(0, foundIdx);
  const current = options[selectedIdx];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => { if (open) setActive(selectedIdx); }, [open, selectedIdx]);
  useEffect(() => { if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [open, active]);

  const choose = useCallback((i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
    btnRef.current?.focus();
  }, [options, onChange]);

  const onKeyDown = (e) => {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!open) setOpen(true); else setActive((i) => Math.min(i + 1, last)); break;
      case 'ArrowUp': e.preventDefault(); if (!open) setOpen(true); else setActive((i) => Math.max(i - 1, 0)); break;
      case 'Home': if (open) { e.preventDefault(); setActive(0); } break;
      case 'End': if (open) { e.preventDefault(); setActive(last); } break;
      case 'Enter':
      case ' ': e.preventDefault(); if (open) choose(active); else setOpen(true); break;
      case 'Escape': if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } break;
      case 'Tab': setOpen(false); break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-30' : ''}`}>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${uid}-o${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex min-h-11 w-full min-w-[10rem] cursor-pointer items-center justify-between gap-2 px-4 text-start text-sm font-bold ${FIELD} ${PRESS} ${FOCUS} hover:bg-[color:var(--sf2)]`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="hidden text-[color:var(--mu)] sm:inline">{label}:</span>
          <span className="truncate">{current?.label}</span>
        </span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className={`of-pop of-scroll absolute end-0 top-full z-30 mt-3 max-h-64 w-56 max-w-[calc(100vw-2rem)] overflow-y-auto p-1 ${CARD}`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${uid}-o${i}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                  selected ? 'bg-[#39ff88] font-extrabold text-emerald-950' : i === active ? 'bg-[color:var(--sf2)] font-bold' : 'font-semibold'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {selected && <FiCheck aria-hidden="true" className="h-4 w-4 flex-shrink-0" strokeWidth={3} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

const InfoRow = memo(({ Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border-2 border-[color:var(--bd)] bg-[color:var(--sf2)] p-3">
    <IconTile Icon={Icon} />
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-[color:var(--mu)]">{label}</p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  </div>
));

const OfferDetailModal = memo(({ offerId, language, onClose, t }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [leaving, requestClose] = useLeave(onClose);
  useModalLock(true, requestClose);
  useLenisPause(true);

  const validId = ID_RE.test(offerId);
  const { data: offer, isLoading, isError, error } = useQuery({
    ...QUERY_OPTS,
    queryKey: ['offerDetail', offerId],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get(`/api/users/offers/${encodeURIComponent(offerId)}`, { headers: authHeaders(), signal });
        const normalized = normalizeOffer(data);
        if (!normalized) throw Object.assign(new Error('Invalid offer response'), { response: { status: 404 } });
        return normalized;
      } catch (err) {
        if (!isUnauthorized(err) && !signal?.aborted) {
          const cached = findInList(qc, offerId);
          if (cached) return cached;
        }
        throw err;
      }
    },
    enabled: validId,
    staleTime: 60 * 1000,
    placeholderData: () => findInList(qc, offerId),
  });

  useEffect(() => {
    if (!isError) return;
    if (isUnauthorized(error)) expireSession(navigate);
    else toast({ icon: 'error', title: tr(language, 'offerFailed'), timer: 3500 });
  }, [isError, error, navigate, language]);

  const meta = useOfferMeta(offer || EMPTY_OFFER, language);
  const shopLink = offer?.shopId ? shopPath(offer.shopId) : null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={offer?.name || t('offerDetails')}>
      <div className={`${leaving ? 'of-fade-out' : 'of-fade'} absolute inset-0 bg-[color:var(--scrim)]`} onClick={requestClose} aria-hidden="true" />
      <div className={`${CARD} ${leaving ? 'of-modal-out' : 'of-modal'} relative flex max-h-[92vh] w-full flex-col overflow-hidden sm:max-w-md`}>
        <header className="flex flex-shrink-0 items-center gap-3 border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf2)] px-4 py-3.5 sm:px-5">
          <IconTile Icon={FiTag} className="h-10 w-10" iconClassName="h-5 w-5" />
          <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-extrabold">{offer?.name || t('offerDetails')}</h2>
          <button type="button" onClick={requestClose} aria-label={t('close')} className={`${BTN_ICON} h-9 w-9 flex-shrink-0`}>
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div data-lenis-prevent className="of-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="space-y-3" role="status" aria-label={t('loading')}>
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-4/5" />
              <Sk className="h-16 w-full" />
              <Sk className="h-16 w-full" />
            </div>
          ) : offer ? (
            <>
              {offer.description && <p className="text-sm leading-relaxed text-[color:var(--mu)]">{offer.description}</p>}
              <InfoRow Icon={FiTag} label={t('youSave')} value={meta.amount} />
              {meta.range && <InfoRow Icon={FiCalendar} label={t('validPeriod')} value={<span dir="ltr">{meta.range}</span>} />}
              {meta.remaining && <InfoRow Icon={FiClock} label={meta.isActive ? t('active') : t('inactive')} value={meta.remaining} />}
              {offer.shopName && <InfoRow Icon={RiStoreLine} label={t('shop')} value={offer.shopName} />}
            </>
          ) : (
            <p className="py-10 text-center text-sm font-bold text-[color:var(--mu)]">{t('notFound')}</p>
          )}
        </div>

        <footer className={`grid flex-shrink-0 gap-3 border-t-[3px] border-[color:var(--ln)] px-4 py-3.5 sm:px-5 ${shopLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button type="button" onClick={requestClose} className={`${BTN_SECONDARY} ${BTN_SMALL}`}>{t('close')}</button>
          {shopLink && (
            <Link to={shopLink} onClick={onClose} className={`${BTN_PRIMARY} ${BTN_SMALL}`}>
              <RiStoreLine aria-hidden="true" className="h-4 w-4" />{t('visitShop')}
            </Link>
          )}
        </footer>
      </div>
    </div>
  );
});

const OffersContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const t = useCallback((key) => tr(language, key), [language]);
  const token = useAuthGuard();
  const isDesktop = useIsDesktop();
  useScrollTopOnEnter();

  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const gridRef = useRef(null);
  const latestRef = useRef(null);
  const barRef = useRef(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const typeParam = params.get('type');
  const type = FILTER_FN[typeParam] ? typeParam : DEFAULTS.type;
  const sortParam = params.get('sort');
  const sort = SORTS.some(([k]) => k === sortParam) ? sortParam : DEFAULTS.sort;
  const shop = safeParam(params.get('shop'));
  const page = Math.min(PAGE_MAX, Math.max(1, parseInt(params.get('page'), 10) || 1));

  useLenis(barRef);
  useEffect(() => { document.title = `${tr(language, 'activeOffers')} | Tech-Restore`; }, [language]);
  useEffect(() => { if (isDesktop) setDrawerOpen(false); }, [isDesktop]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReduced()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('[data-hero]', { opacity: 0, y: 18, duration: 0.5, ease: 'power3.out', stagger: 0.08, clearProps: 'opacity,transform' });
    }, root);
    return () => ctx.revert();
  }, []);

  const update = useCallback((patch) => {
    startTransition(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!('page' in patch)) next.delete('page');
        for (const [k, v] of Object.entries(patch)) {
          if (v == null || v === '' || DEFAULTS[k] === String(v)) next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      }, { replace: true });
    });
  }, [setParams]);

  const { data: offers = EMPTY_LIST, isPending: offersPending, isError, isFetching, error, refetch } = useQuery({
    ...QUERY_OPTS,
    queryKey: ['offers'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/offers', { headers: authHeaders(), signal });
      const raw = res.data?.content || res.data || [];
      if (!Array.isArray(raw)) return [];
      const out = [];
      for (const item of raw) {
        if (out.length >= OFFERS_CAP) break;
        const o = normalizeOffer(item);
        if (o) out.push(o);
      }
      return out;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  const loading = !token || offersPending;
  const idle = useIdleFlag(!loading);

  const { data: latest = EMPTY_LIST, isPending: latestPending } = useQuery({
    ...QUERY_OPTS,
    queryKey: ['latestProducts'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/products', { signal });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const p of list.slice(0, PRODUCTS_CAP)) {
        if (p && typeof p === 'object' && ID_RE.test(String(p.id)) && !p.deleted && (Number(p.stock) || 0) > 0) out.push(normalizeLatest(p));
      }
      out.sort((a, b) => b.ts - a.ts || b.num - a.num);
      return out.slice(0, LATEST_LIMIT);
    },
    enabled: idle,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isError && isUnauthorized(error)) expireSession(navigate);
  }, [isError, error, navigate]);

  const prepared = useMemo(
    () => offers.map((o) => ({ ...o, days: daysLeftNum(o.endDate), hay: `${o.name} ${o.description} ${o.shopName}`.toLowerCase() })),
    [offers],
  );

  const searched = useMemo(
    () => (deferredQuery ? prepared.filter((o) => o.hay.includes(deferredQuery)) : prepared),
    [prepared, deferredQuery],
  );

  const typeCounts = useMemo(() => {
    const src = shop ? searched.filter((o) => o.shopId === shop) : searched;
    const out = Object.create(null);
    for (const [key, , fn] of FILTERS) out[key] = src.reduce((n, o) => n + (fn(o) ? 1 : 0), 0);
    return out;
  }, [searched, shop]);

  const shopOptions = useMemo(() => {
    const map = new Map();
    const fn = FILTER_FN[type];
    for (const o of searched) {
      if (!o.shopId || !o.shopName || !fn(o)) continue;
      const cur = map.get(o.shopId);
      if (cur) cur.count += 1;
      else map.set(o.shopId, { id: o.shopId, name: o.shopName, count: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, language));
  }, [searched, type, language]);

  const filtered = useMemo(() => {
    let list = searched.filter(FILTER_FN[type]);
    if (shop) list = list.filter((o) => o.shopId === shop);
    return sortOffers(list, sort, language);
  }, [searched, type, shop, sort, language]);

  const soonCount = useMemo(() => prepared.reduce((n, o) => n + (isSoon(o) ? 1 : 0), 0), [prepared]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);
  const pageKey = useMemo(() => `${safePage}:${paged.map((o) => o.id).join(',')}`, [safePage, paged]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReduced()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-card]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.05, clearProps: 'opacity,transform' });
    }, grid);
    return () => ctx.revert();
  }, [pageKey]);

  const latestCount = latest.length;
  useEffect(() => {
    const el = latestRef.current;
    if (!el || !latestCount || prefersReduced()) return undefined;
    const ctx = gsap.context(() => {
      gsap.set('[data-reveal]', { opacity: 0, y: 28 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.08, overwrite: true, clearProps: 'opacity,transform' }),
      });
    }, el);
    return () => ctx.revert();
  }, [latestCount]);

  const hasFilters = type !== DEFAULTS.type || !!shop || !!query;
  const activeCount = (type !== DEFAULTS.type ? 1 : 0) + (shop ? 1 : 0);

  const changePage = useCallback((p) => {
    update({ page: Math.min(Math.max(1, p), totalPages) });
    scrollToEl(listRef.current);
  }, [update, totalPages]);
  const changeType = useCallback((v) => update({ type: v, shop, sort }), [update, shop, sort]);
  const changeShop = useCallback((v) => update({ shop: v, type, sort }), [update, type, sort]);
  const changeSort = useCallback((v) => update({ sort: v, type, shop }), [update, type, shop]);
  const sortOptions = useMemo(() => SORTS.map(([k, labelKey]) => ({ value: k, label: t(labelKey) })), [t]);
  const onQuery = useCallback((e) => {
    setQuery(stripControl(e.target.value).slice(0, QUERY_MAX));
    setParams((prev) => { const n = new URLSearchParams(prev); n.delete('page'); return n; }, { replace: true });
  }, [setParams]);
  const clearAll = useCallback(() => { setQuery(''); startTransition(() => setParams({}, { replace: true })); }, [setParams]);
  const openDetail = useCallback((id) => setDetailId(id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const showError = isError && !isUnauthorized(error);
  const hasOffers = offers.length > 0;
  const showTools = !loading && !showError && hasOffers;
  const showSidebar = isDesktop && (loading || (!showError && hasOffers));
  const showFilterButton = !isDesktop && showTools;
  const showLatest = latest.length > 0 || (idle && latestPending);

  const panel = (
    <FilterPanel
      type={type} typeCounts={typeCounts} onType={changeType}
      shop={shop} shops={shopOptions} onShop={changeShop} t={t}
    />
  );

  return (
    <div
      ref={rootRef}
      dir={languageDirection(language)}
      lang={language}
      className={`of ${darkMode ? 'of-dark' : ''} min-h-screen [overflow-x:clip]`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[1200] h-1">
        <div ref={barRef} className="h-full origin-left bg-[#39ff88] rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
      </div>
      <Toaster darkMode={darkMode} />

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-36 sm:px-6 md:pb-16 md:pt-32 lg:px-8" aria-busy={loading || isPending}>
        <header className="mb-8">
          <div data-hero><Crumbs t={t} /></div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div data-hero className="min-w-0 max-w-2xl">
              <h1 className="text-2xl font-extrabold tracking-tight rtl:tracking-normal sm:text-3xl">{t('activeOffers')}</h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[color:var(--mu)]">{t('pageSub')}</p>
            </div>
            {loading ? <HeaderChipsSkeleton /> : hasOffers && (
              <div data-hero className="flex flex-wrap gap-3 text-xs font-extrabold">
                <span className={`rounded-full px-3 py-1.5 ${CHIP}`}><span dir="ltr" className="tabular-nums">{offers.length}</span>&nbsp;{t('available')}</span>
                {soonCount > 0 && (
                  <span className={`rounded-full px-3 py-1.5 ${CHIP_WARN}`}><span dir="ltr" className="tabular-nums">{soonCount}</span>&nbsp;{t('filterSoon')}</span>
                )}
              </div>
            )}
          </div>
        </header>

        <div data-hero className={`grid gap-8 ${showSidebar ? 'lg:grid-cols-[16rem_minmax(0,1fr)]' : ''}`}>
          {showSidebar && (
            <aside className="self-start lg:sticky lg:top-32" aria-label={t('filterLabel')}>
              {loading ? <FilterSkeleton /> : <div className={`p-4 ${CARD}`}>{panel}</div>}
            </aside>
          )}

          <section ref={listRef} className="min-w-0 scroll-mt-36" aria-label={t('activeOffers')}>
            {loading && <ToolbarSkeleton />}
            {showTools && (
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className={`relative flex h-11 min-w-0 flex-1 basis-60 items-center gap-2 px-4 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)] ${FIELD}`}>
                  <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" />
                  <input
                    type="search" value={query} onChange={onQuery} placeholder={t('search')} aria-label={t('search')}
                    maxLength={QUERY_MAX} autoComplete="off" spellCheck={false} enterKeyHint="search"
                    className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none placeholder:font-medium placeholder:text-[color:var(--mu)] sm:text-sm"
                  />
                </div>
                <div className="w-full sm:w-auto"><Dropdown value={sort} onChange={changeSort} options={sortOptions} label={t('sortBy')} /></div>
                {showFilterButton && (
                  <button type="button" onClick={openDrawer} aria-haspopup="dialog" className={`${BTN_SECONDARY} ${BTN_SMALL} !min-h-11 flex-shrink-0`}>
                    <FiSliders aria-hidden="true" className="h-4 w-4" />{t('filters')}
                    {activeCount > 0 && (
                      <span dir="ltr" className={`of-pop inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] font-extrabold tabular-nums ${CHIP}`}>{activeCount}</span>
                    )}
                  </button>
                )}
              </div>
            )}

            {showTools && (
              <div className="mb-5 flex items-center justify-between gap-3">
                <p role="status" className="text-sm text-[color:var(--mu)]">
                  <span dir="ltr" className="font-extrabold tabular-nums text-[color:var(--tx)]">{filtered.length}</span> {t('results')}
                </p>
                {hasFilters && (
                  <button type="button" onClick={clearAll} className={`${TEXT_LINK} cursor-pointer text-sm font-extrabold text-[color:var(--acc)] underline decoration-2 underline-offset-4`}>{t('clearAll')}</button>
                )}
              </div>
            )}

            <div className={`transition-opacity duration-200 motion-reduce:transition-none ${isPending ? 'opacity-60' : ''}`}>
              {loading ? (
                <Skeletons label={t('loading')} />
              ) : showError ? (
                <StateBox darkMode={darkMode} label={t('loadFail')} onRetry={refetch} fetching={isFetching} retryLabel={t('tryAgain')} />
              ) : !hasOffers ? (
                <StateBox darkMode={darkMode} label={t('noActive')} hint={t('checkBack')} />
              ) : paged.length === 0 ? (
                <StateBox darkMode={darkMode} label={t('noMatch')} onRetry={clearAll} retryLabel={t('clearAll')} />
              ) : (
                <>
                  <div ref={gridRef} className={`${GRID} of-grid`}>
                    {paged.map((o) => (
                      <OfferCard key={o.id} offer={o} language={language} onViewDetail={openDetail} t={t} />
                    ))}
                  </div>
                  <Pager page={safePage} totalPages={totalPages} onChange={changePage} pending={isPending} t={t} />
                </>
              )}
            </div>
          </section>
        </div>

        {showLatest && (
          <section ref={latestRef} className="mt-16" aria-label={t('newArrivals')}>
            <header className="mb-6">
              <p className="text-xs font-semibold text-[color:var(--mu)]">{t('newArrivalsHint')}</p>
              <h2 className="mt-2 flex items-center gap-3 text-2xl font-extrabold tracking-tight rtl:tracking-normal sm:text-3xl">
                <IconTile Icon={FiBox} className="h-10 w-10" iconClassName="h-5 w-5" />{t('newArrivals')}
              </h2>
            </header>
            {latest.length === 0 ? <LatestSkeleton /> : (
              <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
                {latest.map((p) => (
                  <ProductCard key={p.id} product={p} darkMode={darkMode} language={language} t={t} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {drawerOpen && !isDesktop && (
        <FilterDrawer onClose={closeDrawer} t={t} total={filtered.length} onClear={clearAll} hasFilters={hasFilters}>
          {panel}
        </FilterDrawer>
      )}
      {detailId && <OfferDetailModal key={detailId} offerId={detailId} language={language} onClose={closeDetail} t={t} />}
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