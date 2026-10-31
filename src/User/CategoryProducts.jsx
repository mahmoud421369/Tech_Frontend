import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useId, memo, Suspense, lazy, useDeferredValue,
} from 'react';
import { useParams, Link, useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown, FiX, FiSliders, FiGrid, FiList,
  FiArrowRight, FiArrowUp, FiShield, FiTool, FiRefreshCw, FiCheck, FiHeart, FiTag, FiBox, FiPercent, FiPlus,
  FiShoppingBag, FiAlertCircle, FiZap,
} from 'react-icons/fi';
import { RiVerifiedBadgeLine, RiStarFill } from 'react-icons/ri';
import { LazyMotion, domAnimation, m, AnimatePresence, MotionConfig } from 'framer-motion';
import api from '../common/api/api';
import Navbar from '../components/user/Navbar';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  LISTING_CSS, CONDITIONS, readStorage, safeImageUrl, kindOfCategory, priceStep, clamp, loadSwal,
  useBackToTop, useModalLock, useHScroll, PriceRangeSlider,
} from '../components/user/ListingKit';
import { IsoIllustration, isoCatKey, isoCondKey } from '../components/user/IsoIllustrations';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const Footer = lazy(() => import('../components/user/Footer'));
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } },
});

const DEALS_LIMIT = 8;
const BUY_AGAIN_LIMIT = 12;
const HERO_PER_KIND = 3;
const HERO_MS = 6000;
const SWIPE_PX = 48;
const CARD_IMG_W = 480;
const CARD_IMG_H = 384;
const SAVED_KEY = 'nb_saved_devices';
const SNIPPET_MAX = 90;
const LOW_STOCK = 5;
const PAGE_SIZE_LIST = [12, 24, 36, 48];
const ORDERS_ENDPOINT = '/api/orders/my';

const PG_CSS = `
.pg-root{--dx:1;--ink:#022c22;--sh:#022c22;--acc:#34d399;--tx:#022c22;--mu:#4b5563;--sf:#ffffff;--sf2:#f3f4f6;--pg:#f9fafb;--sale:#c2410c;--pos:#15803d;background:var(--pg);color:var(--tx)}
.pg-root[dir=rtl]{--dx:-1}
.pg-dark{--ink:#000000;--sh:#000000;--acc:#39ff88;--tx:#ffffff;--mu:#a3a3a3;--sf:#2a2a2a;--sf2:#1e1e1e;--pg:#141414;--sale:#fb923c;--pos:#4ade80}
.pg-hl{padding-bottom:.2em;background-position:left bottom;background-repeat:no-repeat;background-size:100% .3em;-webkit-box-decoration-break:clone;box-decoration-break:clone;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")}
.pg-dark .pg-hl{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")}
.pg-glow{background-image:radial-gradient(circle at 6% 0%,rgba(52,211,153,.2),transparent 38%),radial-gradient(circle at 96% 100%,rgba(249,115,22,.1),transparent 36%)}
.pg-dark .pg-glow{background-image:radial-gradient(circle at 6% 0%,rgba(57,255,136,.09),transparent 38%),radial-gradient(circle at 96% 100%,rgba(249,115,22,.07),transparent 36%)}
.pg-pattern{--p1:rgba(4,38,26,.13);--p2:rgba(16,185,129,.12);background-image:radial-gradient(circle at 2px 2px,var(--p1) 1.6px,transparent 1.8px),repeating-linear-gradient(135deg,var(--p2) 0 2px,transparent 2px 18px);background-size:22px 22px,auto}
.pg-dark .pg-pattern{--p1:rgba(57,255,136,.14);--p2:rgba(57,255,136,.06)}
.pg-enter{animation:pgEnter .22s cubic-bezier(.16,1,.3,1) backwards}
@keyframes pgEnter{from{opacity:0;transform:translate3d(0,8px,0)}to{opacity:1;transform:none}}
.pg-rise{animation:pgRise .28s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*24ms)}
@keyframes pgRise{from{opacity:0;transform:translate3d(0,12px,0)}to{opacity:1;transform:none}}
.pg-pop{animation:pgPop .12s ease-out both;transform-origin:top}
@keyframes pgPop{from{opacity:0;transform:translate3d(0,-6px,0) scale(.98)}to{opacity:1;transform:none}}
.pg-fade{animation:pgFade .2s ease both}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
.pg-nosb{scrollbar-width:none}
.pg-nosb::-webkit-scrollbar{display:none}
.pg-sb{scrollbar-width:thin;scrollbar-color:var(--acc) var(--sf2)}
@keyframes hpFloat{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-14px) rotate(var(--r,0deg))}}
.hp-float{animation:hpFloat 6s ease-in-out infinite}
@keyframes hpDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-22px)}}
.hp-drift{animation:hpDrift 11s ease-in-out infinite}
.hs-root{contain:paint}
.hs-slide{opacity:0;visibility:hidden;will-change:opacity;transition:opacity .38s cubic-bezier(.4,0,.2,1),visibility 0s linear .38s}
.hs-on{opacity:1;visibility:visible;transition:opacity .38s cubic-bezier(.4,0,.2,1),visibility 0s}
.hs-bg{background:linear-gradient(135deg,var(--tb) 0%,var(--tc) 100%)}
.hs-dots{background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,.14) 1px,transparent 1.4px);background-size:18px 18px}
.hs-blob{background:var(--ta);opacity:.22;filter:blur(80px);will-change:transform}
.hs-a{opacity:0;transform:translate3d(0,22px,0);transition:opacity .2s ease,transform .2s ease}
.hs-on .hs-a{opacity:1;transform:none;transition:opacity .4s ease calc(var(--d,0)*50ms + 60ms),transform .55s cubic-bezier(.16,1,.3,1) calc(var(--d,0)*50ms + 60ms)}
.hs-v{opacity:0;transform:translate3d(0,10px,0) scale(.9) rotate(-3deg);transition:opacity .2s ease,transform .2s ease}
.hs-on .hs-v{opacity:1;transform:none;transition:opacity .45s ease .08s,transform .7s cubic-bezier(.16,1,.3,1) .08s}
.hs-bar{transform:scaleX(0);animation:hsBar linear forwards}
@keyframes hsBar{to{transform:scaleX(1)}}
@media (prefers-reduced-motion:reduce){.pg-enter,.pg-rise,.pg-pop,.pg-fade,.hp-float,.hp-drift{animation:none}.hs-a,.hs-v,.hs-on .hs-a,.hs-on .hs-v{transform:none;transition:opacity .2s ease}.hs-bar{animation:none;transform:scaleX(1)}}
`;

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('category-page-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'category-page-styles';
  tag.textContent = `${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}${PG_CSS}`;
  document.head.appendChild(tag);
};
injectStyles();

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const BOX_LG = 'rounded-2xl border-[3px] border-[color:var(--ink)] bg-[color:var(--sf)] text-[color:var(--tx)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]';
const BOX_SM = 'rounded-2xl border-[3px] border-[color:var(--ink)] bg-[color:var(--sf)] text-[color:var(--tx)] [box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--sh)]';
const PRESS = `transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*8px)_10px_0_0_var(--sh)] active:translate-y-[2px] active:translate-x-[calc(var(--dx)*2px)] active:[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] ${FOCUS}`;
const BTN = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold uppercase [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-100 motion-reduce:transition-none active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const BTN_ON = 'bg-[color:var(--acc)] text-emerald-950';
const BTN_OFF = 'bg-[color:var(--sf)] text-[color:var(--tx)]';
const BTN_SM = '!min-h-9 !px-3 !py-1.5 text-xs';
const ICON = `inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-[color:var(--ink)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-100 motion-reduce:transition-none active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:none] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const FIELD = 'rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--sf2)] text-[color:var(--tx)] focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)]';
const WRAP = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';
const SECTION = 'py-14 sm:py-20';
const LAZY = '[content-visibility:auto] [contain-intrinsic-size:auto_640px]';
const MUTED = 'text-[color:var(--mu)]';
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));
const DELAY = Array.from({ length: 8 }, (_, i) => ({ '--d': i }));

const HERO_H = 'h-[max(42rem,88svh)] lg:h-[max(46rem,94svh)]';
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

const THEMES = [
  { a: '#34d399', b: '#04261a', c: '#0b4a35', ink: '#022c22' },
  { a: '#fbbf24', b: '#2a1403', c: '#6b3b06', ink: '#422006' },
  { a: '#a78bfa', b: '#150f3a', c: '#33277d', ink: '#1e1b4b' },
  { a: '#fb7185', b: '#3b0a17', c: '#7a1530', ink: '#4c0519' },
  { a: '#38bdf8', b: '#06263d', c: '#0c4c75', ink: '#082f49' },
  { a: '#f97316', b: '#2b1105', c: '#6a2b0a', ink: '#431407' },
  { a: '#2dd4bf', b: '#042a28', c: '#0b524d', ink: '#042f2e' },
];
const themeVars = (th) => ({ '--ta': th.a, '--tb': th.b, '--tc': th.c, '--ti': th.ink });

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const scrollBehavior = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const EXTRA = {
  en: {
    save: 'Save', saved: 'Saved', savedOnly: 'Saved only', inStockOnly: 'In stock only', inStock: 'In stock', moreFilters: 'More filters', sortDiscount: 'Biggest discount',
    youSave: 'Save {{value}}', originalPrice: 'Original price', discountedPrice: 'Price after discount', discountValue: 'Discount',
    onlyLeft: 'Only {{count}} left in stock',
    buyAgainTitle: 'Buy it again', buyAgainSub: 'Items you have purchased before',
    shopNow: 'Shop now', newArrival: 'Just landed', topDeal: 'Top deal', browseAll: 'Browse products',
    prevSlide: 'Previous slide', nextSlide: 'Next slide', goToSlide: 'Go to slide', loading: 'Loading',
  },
  ar: {
    save: 'حفظ', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', inStockOnly: 'المتوفر فقط', inStock: 'متوفر', moreFilters: 'فلاتر إضافية', sortDiscount: 'أكبر خصم',
    youSave: 'وفّر {{value}}', originalPrice: 'السعر الأصلي', discountedPrice: 'السعر بعد الخصم', discountValue: 'الخصم',
    onlyLeft: 'متبقي {{count}} فقط في المخزون',
    buyAgainTitle: 'اشترِ مرة أخرى', buyAgainSub: 'منتجات اشتريتها من قبل',
    shopNow: 'تسوّق الآن', newArrival: 'وصل حديثًا', topDeal: 'أفضل عرض', browseAll: 'تصفّح المنتجات',
    prevSlide: 'الشريحة السابقة', nextSlide: 'الشريحة التالية', goToSlide: 'اذهب إلى الشريحة', loading: 'جارٍ التحميل',
  },
  fr: {
    save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrés uniquement', inStockOnly: 'En stock uniquement', inStock: 'En stock', moreFilters: 'Plus de filtres', sortDiscount: 'Plus grande remise',
    youSave: 'Économisez {{value}}', originalPrice: "Prix d'origine", discountedPrice: 'Prix après remise', discountValue: 'Remise',
    onlyLeft: 'Plus que {{count}} en stock',
    buyAgainTitle: 'Racheter', buyAgainSub: 'Articles que vous avez déjà achetés',
    shopNow: 'Acheter', newArrival: 'Vient d’arriver', topDeal: 'Meilleure offre', browseAll: 'Parcourir les produits',
    prevSlide: 'Diapositive précédente', nextSlide: 'Diapositive suivante', goToSlide: 'Aller à la diapositive', loading: 'Chargement',
  },
};

const NS = {
  en: { ...EXTRA.en, ...enTranslations.devices, ...enTranslations.categoryProducts },
  ar: { ...EXTRA.ar, ...arTranslations.devices, ...arTranslations.categoryProducts },
  fr: { ...EXTRA.fr, ...frTranslations.devices, ...frTranslations.categoryProducts },
};
const tr = (lang, key, vars) => {
  let s = NS[lang]?.[key] ?? NS.en?.[key] ?? key;
  if (vars && typeof vars === 'object') for (const k in vars) s = s.split(`{{${k}}}`).join(vars[k]);
  return s;
};

const LOCALES = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR' };
const FMT_CACHE = {};
const getMoney = (language, currency) => {
  const fmt = (FMT_CACHE[language] ||= new Intl.NumberFormat(LOCALES[language] || LOCALES.en, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  return (n) => `${currency} ${fmt.format(Number(n || 0))}`;
};
const COMPACT_FORMAT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const round2 = (n) => Math.round(n * 100) / 100;

const snippetOf = (text, max = SNIPPET_MAX) => {
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

const computeFinal = (price, type, value) => {
  if (!(price > 0) || !(value > 0) || !type) return price;
  if (type === 'PERCENTAGE') return value < 100 ? round2(price - (price * value) / 100) : price;
  return value < price ? round2(price - value) : price;
};

const normalizeProduct = (p) => {
  const price = Math.max(0, Number(p.price) || 0);
  const legacy = clamp(Number(p.discount) || 0, 0, 100);
  const apiFinal = Number(p.finalPrice);
  const discountValue = Number(p.discountValue) || 0;
  const apiType = p.discountType || null;
  let finalPrice = price;
  if (apiFinal > 0 && apiFinal < price) finalPrice = apiFinal;
  else if (discountValue > 0 && apiType) finalPrice = computeFinal(price, apiType, discountValue);
  else if (legacy) finalPrice = round2(price * (1 - legacy / 100));
  const saving = round2(Math.max(0, price - finalPrice));
  const discount = price > 0 ? (saving / price) * 100 : 0;
  return {
    ...p,
    price,
    finalPrice,
    saving,
    discount,
    discountType: saving > 0 ? (apiType || 'PERCENTAGE') : null,
    discountValue: saving > 0 && discountValue > 0 ? discountValue : 0,
    _pct: saving > 0 ? Math.max(1, Math.round(discount)) : 0,
    _rating: clamp(Number(p.rating ?? p.averageRating) || 0, 0, 5),
    _reviews: Math.max(0, Number(p.reviewCount ?? p.reviewsCount ?? p.ratingCount) || 0),
    _name: String(p.name || '').toLowerCase(),
    _ts: Date.parse(p.createdAt) || 0,
    _img: safeImageUrl(p.image || p.imageUrl) || '',
    _snip: snippetOf(p.description),
  };
};

const nameOf = (v, lang) => {
  if (!v) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim().slice(0, 120);
  if (typeof v === 'object') return nameOf(v[lang] ?? v.name ?? v.en ?? v.categoryName ?? v.title, lang);
  return '';
};

const extractPurchasedIds = (data) => {
  const orders = data?.content ?? data?.data ?? data ?? [];
  if (!Array.isArray(orders)) return [];
  const seen = new Set();
  const out = [];
  for (const o of orders) {
    const items = o?.items ?? o?.orderItems ?? o?.products ?? [];
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      const id = it?.productId ?? it?.product?.id ?? it?.id;
      if (id == null) continue;
      const key = String(id);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out;
};

const SORT_KEYS = [
  ['relevance', 'sortRelevance'],
  ['priceLowToHigh', 'sortPriceLow'],
  ['priceHighToLow', 'sortPriceHigh'],
  ['newest', 'sortNewest'],
  ['discount', 'sortDiscount'],
];
const TRUST_KEYS = [
  [RiVerifiedBadgeLine, 'trustVerified', 'trustVerifiedText'],
  [FiTool, 'trustQuality', 'trustQualityText'],
  [FiRefreshCw, 'trustEwaste', 'trustEwasteText'],
  [FiShield, 'trustSecure', 'trustSecureText'],
];
const VIEW_MODES = [['grid', FiGrid], ['list', FiList]];
const EMPTY_LIST = [];

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const useSavedProducts = () => {
  const [ids, setIds] = useState(readSaved);
  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);
  const set = useMemo(() => new Set(ids), [ids]);
  return [set, toggle];
};

const useScrollTopOnEnter = (key) => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navType, key]);
};

const EASE = [0.16, 1, 0.3, 1];
const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } },
};
const drawerMotion = (rtl) => {
  const off = rtl ? '100%' : '-100%';
  return {
    initial: { x: off },
    animate: { x: 0, transition: { duration: 0.22, ease: EASE } },
    exit: { x: off, transition: { duration: 0.15, ease: 'easeIn' } },
  };
};
const GPU = { willChange: 'transform, opacity' };

const useIsMobile = (query = '(max-width: 1023.98px)') => {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
};

const splitHeading = (text) => {
  const str = String(text ?? '');
  if (str.includes('**')) return str.split('**').map((part, i) => ({ part, hl: i % 2 === 1 }));
  const mt = str.match(/^(.*[,،]\s*)([^,،]+)$/);
  if (mt) return [{ part: mt[1], hl: false }, { part: mt[2], hl: true }];
  const words = str.split(' ');
  if (words.length < 2) return [{ part: str, hl: true }];
  const n = words.length <= 3 ? 1 : 2;
  return [{ part: `${words.slice(0, -n).join(' ')} `, hl: false }, { part: words.slice(-n).join(' '), hl: true }];
};

const SectionTitle = memo(({ label, title, subtitle, children }) => {
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-12">
      <div className="min-w-0 max-w-3xl">
        {label && (
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden="true" className="h-3.5 w-12 rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--acc)]" />
            <span className="text-sm font-bold uppercase tracking-wide rtl:tracking-normal">{label}</span>
          </div>
        )}
        <h2 className="text-3xl font-extrabold leading-[1.18] tracking-[-0.04em] [text-wrap:balance] rtl:leading-[1.4] rtl:tracking-normal sm:text-5xl lg:text-6xl">
          {parts.map(({ part, hl }, i) => (hl ? <span key={i} className="pg-hl">{part}</span> : part))}
        </h2>
        {subtitle && <p className={`mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${MUTED}`}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
});

const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = '', align = 'start' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();
  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[selectedIdx];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);
  useEffect(() => { if (isOpen) setActive(selectedIdx); }, [isOpen, selectedIdx]);
  useEffect(() => { if (isOpen) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [isOpen, active]);

  const choose = (i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setIsOpen(false);
    btnRef.current?.focus();
  };
  const onKeyDown = (e) => {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.min(i + 1, last)); break;
      case 'ArrowUp': e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.max(i - 1, 0)); break;
      case 'Home': if (isOpen) { e.preventDefault(); setActive(0); } break;
      case 'End': if (isOpen) { e.preventDefault(); setActive(last); } break;
      case 'Enter': case ' ': e.preventDefault(); if (isOpen) choose(active); else setIsOpen(true); break;
      case 'Escape': if (isOpen) { e.preventDefault(); e.stopPropagation(); setIsOpen(false); } break;
      case 'Tab': setIsOpen(false); break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${isOpen ? 'z-30' : ''} ${className}`}>
      <button
        ref={btnRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={`${uid}-list`}
        aria-activedescendant={isOpen ? `${uid}-o${active}` : undefined}
        onClick={() => setIsOpen((o) => !o)} onKeyDown={onKeyDown}
        className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 px-3 text-start text-sm font-semibold outline-none ${FIELD} ${FOCUS}`}
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul ref={listRef} id={`${uid}-list`} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className={`pg-pop pg-sb absolute top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1 ${BOX_SM} !rounded-xl ${align === 'end' ? 'end-0' : 'start-0'}`}>
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={selected}
                onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-sm font-bold ${selected ? 'bg-[color:var(--acc)] text-emerald-950' : i === active ? 'bg-[color:var(--sf2)]' : ''}`}>
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

const FilterChip = memo(({ label, onRemove }) => (
  <button type="button" onClick={onRemove} className={`${BTN} ${BTN_OFF} ${BTN_SM} normal-case`}>
    <span className="max-w-[10rem] truncate">{label}</span><FiX aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
  </button>
));

const OptionRow = memo(({ label, count, selected, onClick }) => (
  <button type="button" role="checkbox" aria-checked={selected} onClick={onClick}
    className={`flex min-h-10 w-full items-center gap-2.5 rounded-md py-1.5 text-start text-sm font-semibold ${FOCUS}`}>
    <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 border-[color:var(--ink)] text-emerald-950 ${selected ? 'bg-[color:var(--acc)]' : 'bg-[color:var(--sf2)]'}`}>
      {selected && <FiCheck aria-hidden="true" className="h-3 w-3" strokeWidth={3} />}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className={`text-xs tabular-nums ${MUTED}`} dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ title, isOpen, onToggle, children }) => (
  <section className="border-t-2 border-[color:var(--ink)]">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className={`flex min-h-11 w-full items-center gap-2.5 rounded-md py-3 text-start ${FOCUS}`}>
      <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold uppercase"><span className="pg-hl">{title}</span></span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="min-w-0 pb-4">{children}</div>}
  </section>
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

const PAGE_BTN = `${BTN} !min-h-10 !min-w-[2.5rem] !px-2 tabular-nums`;

const Pagination = memo(({ page, total, onChange, t }) => {
  const items = useMemo(() => pageWindow(page, total), [page, total]);
  if (total <= 1) return null;
  return (
    <nav aria-label={t('paginationLabel')} className="flex flex-wrap items-center justify-center gap-2 pe-1 pb-1">
      <button type="button" className={`${PAGE_BTN} ${BTN_OFF}`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}><FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></button>
      {items.map((x) => (typeof x === 'number' ? (
        <button key={x} type="button" onClick={() => onChange(x)} aria-label={`${x}`} aria-current={x === page ? 'page' : undefined}
          className={`${PAGE_BTN} ${x === page ? BTN_ON : BTN_OFF}`}>{x}</button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-extrabold">…</span>))}
      <button type="button" className={`${PAGE_BTN} ${BTN_OFF}`} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}><FiChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></button>
    </nav>
  );
});

const Crumbs = memo(({ name, t }) => (
  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-bold text-white/80">
    <Link to="/devices" className="underline decoration-[color:var(--ta)] decoration-2 underline-offset-4 hover:no-underline">{t('backToAll')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    <span aria-current="page" className="max-w-[14rem] truncate text-white">{name}</span>
  </nav>
));

const HeroImg = memo(({ src, alt, catKey, eager }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  const onError = useCallback(() => setFailed(true), []);
  if (!src || failed) return <IsoIllustration type={catKey} tone="emerald" onGreen={false} darkMode className="h-full w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]" />;
  return (
    <img
      src={src} alt={alt} width={720} height={720} decoding="async" referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} onError={onError}
      className="h-full w-full transform-gpu object-contain mix-blend-multiply drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)] transition-[transform,filter] duration-300 ease-[cubic-bezier(.16,1,.3,1)] will-change-transform motion-reduce:transition-none [@media(hover:hover)]:group-hover:-translate-y-3 [@media(hover:hover)]:group-hover:-rotate-3 [@media(hover:hover)]:group-hover:scale-110 [@media(hover:hover)]:group-hover:drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)] active:scale-105"
    />
  );
});

const HeroSlide = memo(({ slide, on, name, count, catKey, categoryName, money, onOpen, onBrowse, t }) => {
  const { kind, data, theme } = slide;
  const isCat = kind === 'category';
  const isDeal = kind === 'deal';
  const title = isCat ? name : data.name;
  const bigText = isCat ? String(count) : isDeal ? `-${data._pct}%` : 'NEW';
  const open = useCallback(() => (isCat ? onBrowse() : onOpen(data.id)), [isCat, onBrowse, onOpen, data]);
  const label = isCat ? t('productsLabel') : isDeal ? t('topDeal') : t('newArrival');
  const BadgeIcon = isCat ? FiTag : isDeal ? FiPercent : FiZap;
  const desc = isCat ? '' : data._snip;
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
        {bigText}
      </span>

      <div className="relative mx-auto grid h-full max-w-7xl items-center gap-6 px-4 pb-36 pt-44 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:gap-12 lg:px-8 lg:pb-40 lg:pt-52">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="hs-a flex flex-wrap items-center gap-2" style={DELAY[0]}>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-[3px] border-black bg-[color:var(--ta)] px-3 py-1 text-xs font-black uppercase text-[color:var(--ti)]">
              <BadgeIcon aria-hidden="true" className="h-3.5 w-3.5" />{label}
            </span>
            {!isCat && categoryName && (
              <span className="inline-flex max-w-[12rem] items-center gap-1.5 rounded-lg border-2 border-white/30 px-3 py-1 text-xs font-bold text-white/90">
                <FiTag aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{categoryName}</span>
              </span>
            )}
          </div>

          <h2
            className="hs-a mt-5 line-clamp-3 break-words text-4xl font-black leading-[1.08] tracking-[-0.03em] [text-wrap:balance] rtl:leading-[1.35] rtl:tracking-normal sm:text-6xl lg:text-7xl"
            style={DELAY[1]}
          >
            {title}
          </h2>

          {isCat ? (
            <p className="hs-a mt-5 max-w-xl text-base font-medium leading-relaxed text-white/80 sm:text-lg" style={DELAY[2]}>
              <span dir="ltr" className="font-extrabold tabular-nums">{count}</span>{' '}
              {count === 1 ? t('productFromSellers') : t('productsFromSellers')}
            </p>
          ) : desc ? (
            <p className="hs-a mt-5 line-clamp-3 max-w-xl text-base font-medium leading-relaxed text-white/80 sm:text-lg" style={DELAY[2]}>{desc}</p>
          ) : null}

          {!isCat && (
            <div className="hs-a mt-6 flex flex-wrap items-end gap-x-5 gap-y-2" style={DELAY[3]} dir="ltr">
              <span className="text-4xl font-black tabular-nums text-[color:var(--ta)] sm:text-5xl">{money(data.finalPrice)}</span>
              {data.saving > 0 && (
                <>
                  <span className="pb-1 text-base font-semibold tabular-nums text-white/60 line-through">{money(data.price)}</span>
                  <span className="mb-1 rounded-md border-2 border-black bg-white px-2 py-0.5 text-xs font-black tabular-nums text-black">-{data._pct}%</span>
                </>
              )}
            </div>
          )}

          <div className="hs-a mt-8 flex flex-wrap gap-4 pb-1 pe-1" style={DELAY[4]}>
            <button type="button" onClick={open} tabIndex={on ? 0 : -1} className={`${HERO_BTN} bg-[color:var(--ta)] text-[color:var(--ti)]`}>
              {isCat ? t('browseAll') : t('shopNow')}<FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="hs-v relative h-44 w-44 sm:h-64 sm:w-64 lg:h-[28rem] lg:w-[28rem]">
            <div className="hp-float h-full w-full [--r:0deg]">
              {isCat ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <IsoIllustration type={catKey} tone="emerald" onGreen={false} darkMode className="h-full w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]" />
                </div>
              ) : (
                <div className="group absolute inset-0 flex items-center justify-center">
                  <HeroImg src={data._img} alt={data.name} catKey={catKey} eager={false} />
                </div>
              )}
              {!isCat && data._pct > 0 && (
                <span className="absolute -bottom-3 end-2 rounded-xl border-[3px] border-black bg-[color:var(--ta)] px-3 py-1.5 text-sm font-black tabular-nums text-[color:var(--ti)] sm:text-xl" dir="ltr">-{data._pct}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const HeroSlider = memo(({ slides, loading, language, label, crumbs, renderSlide, slideTitle, t }) => {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const rootRef = useRef(null);
  const startX = useRef(null);
  const isRTL = languageDirection(language) === 'rtl';
  const count = slides.length;
  const safe = count ? Math.min(index, count - 1) : 0;
  const paused = hover || !inView || !tabVisible;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, count]);

  useEffect(() => {
    const on = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

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
  const pause = useCallback(() => setHover(true), []);
  const resume = useCallback(() => setHover(false), []);
  const onFocus = useCallback((e) => { if (e.target.matches?.(':focus-visible')) setHover(true); }, []);

  if (loading || !count) {
    return (
      <div className={`relative overflow-hidden bg-[#04261a] ${HERO_H}`} role="status" aria-label={t('loading')}>
        <div className="mx-auto grid h-full max-w-7xl items-center gap-10 px-4 pt-44 sm:px-6 lg:grid-cols-2 lg:px-8">
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

  const active = slides[safe];

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel" aria-label={label}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onKeyDown={onKeyDown}
      onMouseEnter={pause} onMouseLeave={resume} onFocus={onFocus} onBlur={resume}
      className={`hs-root relative isolate touch-pan-y overflow-hidden text-white [--dx:1] rtl:[--dx:-1] ${HERO_H}`}
    >
      <div className="absolute inset-0" aria-live={paused ? 'polite' : 'off'}>
        {slides.map((s, i) => renderSlide(s, i === safe))}
      </div>

      <div className="absolute inset-x-0 top-32 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" style={themeVars(active.theme)}>
        {crumbs}
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
                  <span className={`mt-2 hidden truncate text-xs font-bold transition-colors duration-200 lg:block ${i === safe ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>
                    {slideTitle(s)}
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

const TrustStrip = memo(({ items }) => (
  <section aria-label="Trust" className={`p-4 sm:p-6 ${BOX_LG}`}>
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase">{title}</p>
            <p className={`text-xs font-medium ${MUTED}`}>{text}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
));

const Price = memo(({ product, money, t }) => {
  const d = product.saving > 0;
  return (
    <div className="min-w-0" dir="ltr">
      {d && (
        <p className={`text-[11px] tabular-nums line-through ${MUTED}`}>
          <span className="sr-only">{t('originalPrice')}: </span>{money(product.price)}
        </p>
      )}
      <p className={`truncate text-lg font-extrabold leading-tight tabular-nums ${d ? 'text-[color:var(--sale)]' : ''}`}>
        <span className="sr-only">{d ? `${t('discountedPrice')}: ` : ''}</span>{money(product.finalPrice)}
      </p>
      {d && (
        <p dir="auto" className="truncate text-[11px] font-bold text-[color:var(--sale)]">
          {t('youSave', { value: money(product.saving) })} <span dir="ltr">(-{product._pct}%)</span>
        </p>
      )}
    </div>
  );
});

const DeviceImage = memo(({ src, alt, catKey, darkMode }) => {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[color:var(--sf2)] [contain:layout_paint]">
        <IsoIllustration type={catKey} tone="emerald" darkMode={darkMode} onGreen={false} hoverOnly
          className="aspect-square h-[80%] transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105" />
      </div>
    );
  }
  return (
    <img
      src={src} alt={alt} width={CARD_IMG_W} height={CARD_IMG_H} loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
      onError={handleError}
      className="pg-fade absolute inset-0 block h-full w-full object-contain p-4 transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105"
    />
  );
});

const ProductCard = memo(({ product, darkMode, layout = 'grid', isSaved = false, onSave, onAddToCart, onOpen, t, money, condLabel, catKey, categoryName }) => {
  const [btn, setBtn] = useState('idle');
  const timer = useRef();
  const mounted = useRef(true);
  const isList = layout === 'list';
  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= LOW_STOCK;

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);

  const open = useCallback(() => onOpen(product.id), [onOpen, product.id]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(product.id); }, [onSave, product.id]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (out || btn === 'adding') return;
    setBtn('adding');
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setBtn(ok ? 'added' : 'idle');
    if (ok) timer.current = setTimeout(() => mounted.current && setBtn('idle'), 1600);
  }, [out, btn, onAddToCart, product]);

  const label = categoryName || product.categoryName || '';
  const meta = [product.condition ? condLabel(product.condition) : '', label].filter(Boolean).join(' · ');

  return (
    <article
      onClick={open}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={product.name}
      className={`group relative flex h-full cursor-pointer overflow-hidden ${BOX_SM} ${PRESS} ${isList ? 'flex-row' : 'flex-col'}`}
    >
      <div className={`relative overflow-hidden bg-white [contain:layout_paint] ${isList ? 'min-h-[10rem] w-32 flex-shrink-0 self-stretch border-e-[3px] border-[color:var(--ink)] sm:w-48' : 'aspect-[5/4] w-full border-b-[3px] border-[color:var(--ink)]'}`}>
        <DeviceImage src={product._img} alt={product.name} catKey={catKey} darkMode={darkMode} />
        <button
          type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
          className={`${ICON} absolute end-2.5 top-2.5 z-10 h-9 w-9 bg-white text-emerald-950`}
        >
          <FiHeart aria-hidden="true" className={`h-4 w-4 ${isSaved ? 'text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
        <h3 className={`line-clamp-2 text-sm font-bold leading-snug ${isList ? '' : 'min-h-[2.5rem]'}`}>{product.name}</h3>
        <p className={`line-clamp-2 text-xs leading-5 ${MUTED} ${isList ? '' : 'min-h-[2.5rem]'}`}>{product._snip || t('noDescription')}</p>

        {meta && <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--pos)] rtl:tracking-normal">{meta}</p>}

        {product._rating > 0 && (
          <p className="flex items-center gap-1 text-xs font-bold" dir="ltr">
            <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
            <span className="tabular-nums">{product._rating.toFixed(1)}</span>
            {product._reviews > 0 && <span className={`font-medium tabular-nums ${MUTED}`}>({COMPACT_FORMAT.format(product._reviews)})</span>}
          </p>
        )}

        {out ? (
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
            <FiAlertCircle aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />{t('outOfStock')}
          </p>
        ) : low ? (
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <FiAlertCircle aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" />{t('onlyLeft', { count: product.stock })}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 border-t-2 border-dotted border-[color:var(--ink)] pt-2.5">
          <Price product={product} money={money} t={t} />
          <button type="button" onClick={handleCart} disabled={out || btn === 'adding'} aria-label={t('addToCart')} title={t('addToCart')}
            className={`${ICON} h-11 w-11 rounded-xl bg-[color:var(--acc)] text-emerald-950`}>
            {btn === 'adding' ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
              : btn === 'added' ? <FiCheck aria-hidden="true" className="h-5 w-5" />
              : <FiPlus aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </article>
  );
});

const ProductSlider = memo(({ icon: Icon = FiPercent, title, subtitle, products, darkMode, isRTL, saved, onSave, onAddToCart, onOpen, t, money, condLabel, catKey, categoryName }) => {
  const { ref, edge, scroll } = useHScroll(products.length, isRTL);
  if (!products.length) return null;
  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;
  return (
    <div>
      <SectionTitle
        label={title} title={title} subtitle={subtitle}
      >
        <div className="flex gap-3 pe-2 pb-2">
          <button type="button" className={`${ICON} ${BTN_OFF} h-11 w-11`} onClick={() => scroll('back')} disabled={!edge.l} aria-label={t('scrollBack')}><BackIcon aria-hidden="true" className="h-5 w-5" /></button>
          <button type="button" className={`${ICON} ${BTN_OFF} h-11 w-11`} onClick={() => scroll('forward')} disabled={!edge.r} aria-label={t('scrollForward')}><ForwardIcon aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      </SectionTitle>
      <div ref={ref} className="pg-nosb flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 pe-3 ps-1 pt-1 motion-reduce:scroll-auto sm:gap-6">
        {products.map((p) => (
          <div key={p.id} className="w-[210px] flex-shrink-0 snap-start sm:w-[250px]">
            <ProductCard product={p} darkMode={darkMode} isSaved={saved.has(p.id)} onSave={onSave} onAddToCart={onAddToCart} onOpen={onOpen} t={t} money={money} condLabel={condLabel} catKey={catKey} categoryName={categoryName} />
          </div>
        ))}
      </div>
    </div>
  );
});

const ConditionGrid = memo(({ counts, selected, onToggle, onReset, darkMode, title, subtitle, t, condLabel }) => {
  const items = CONDITIONS.filter((c) => counts[c] > 0);
  if (!items.length) return null;
  return (
    <section aria-label={title} className={`pg-pattern bg-[color:var(--pg)] ${SECTION} ${LAZY}`}>
      <div className={WRAP}>
        <SectionTitle title={title} subtitle={subtitle} label={t('shopByCondition')}>
          <div className="pe-1 pb-1">
            <button type="button" onClick={onReset} className={`${BTN} ${BTN_ON}`}>{t('allProducts')} <FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></button>
          </div>
        </SectionTitle>
        <div className="grid grid-cols-3 gap-4 pb-2 pe-2 sm:gap-6">
          {items.map((c) => {
            const active = selected.includes(c);
            return (
              <button key={c} type="button" onClick={() => onToggle(c)} aria-pressed={active}
                className={`group flex flex-col items-center gap-2 p-3 text-center sm:gap-3 sm:p-5 ${BOX_SM} ${PRESS} ${active ? 'bg-[color:var(--acc)] !text-emerald-950' : ''}`}>
                <IsoIllustration type={isoCondKey(c)} darkMode={darkMode} onGreen={false} hoverOnly
                  className="h-16 w-16 transition-transform duration-200 motion-reduce:transition-none group-hover:scale-110 sm:h-20 sm:w-20" />
                <span className="text-sm font-extrabold uppercase">{condLabel(c)}</span>
                <span className="text-xs font-bold opacity-80"><span dir="ltr" className="tabular-nums">{counts[c]}</span> {counts[c] === 1 ? t('itemSingular') : t('itemPlural')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

const StateCard = memo(({ illustration, title, subtitle, darkMode, children }) => (
  <div className={`px-4 py-14 text-center sm:py-20 ${BOX_SM}`}>
    <IsoIllustration type={illustration} tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
    <p className="mb-2 text-lg font-extrabold uppercase sm:text-2xl">{title}</p>
    <p className={`mb-6 text-sm font-medium sm:text-base ${MUTED}`}>{subtitle}</p>
    {children}
  </div>
));

const FilterPanel = memo((p) => {
  const { t, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, setOnSaleOnly, onSaleCount,
    inStockOnly, setInStockOnly, savedOnly, setSavedOnly,
    priceRange, setPriceRange, maxPrice, open, setOpen, clearFilters, activeFiltersCount, darkMode } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const step = priceStep(maxPrice);
  return (
    <div className={`w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4 ${BOX_SM}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold uppercase">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{t('filters')}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className={`flex-shrink-0 rounded-md text-xs font-bold underline underline-offset-4 ${FOCUS}`}>{t('resetAll')}</button>}
      </div>

      <FilterBlock title={t('condition')} isOpen={open.cond} onToggle={() => toggle('cond')}>
        {CONDITIONS.map((c) => <OptionRow key={c} label={condLabel(c)} count={countsByCondition[c] || 0} selected={conditions.includes(c)} onClick={() => toggleCondition(c)} />)}
      </FilterBlock>

      {maxPrice > 0 && (
        <FilterBlock title={t('priceRange')} isOpen={open.price} onToggle={() => toggle('price')}>
          <PriceRangeSlider range={priceRange || [0, maxPrice]} max={maxPrice} step={step} onChange={setPriceRange} darkMode={darkMode} />
        </FilterBlock>
      )}

      <FilterBlock title={t('offersFilter')} isOpen={open.offers} onToggle={() => toggle('offers')}>
        <OptionRow label={t('onSaleOnly')} count={onSaleCount} selected={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} />
      </FilterBlock>

      <FilterBlock title={t('moreFilters')} isOpen={open.more} onToggle={() => toggle('more')}>
        <OptionRow label={t('inStockOnly')} selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)} />
        <OptionRow label={t('savedOnly')} selected={savedOnly} onClick={() => setSavedOnly((v) => !v)} />
      </FilterBlock>
    </div>
  );
});

function CategoryProductsContent({ darkMode, toggleDarkMode }) {
  const language = useAppLanguage();
  const t = useCallback((k, vars) => tr(language, k, vars), [language]);
  const currency = t('currency');
  const money = useMemo(() => getMoney(language, currency), [language, currency]);
  const numLocale = LOCALES[language] || LOCALES.en;
  const dir = languageDirection(language);
  const isRTL = dir === 'rtl';
  const isAr = language === 'ar';
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  useScrollTopOnEnter(categoryId);

  const condLabel = useCallback((c) => {
    const k = `condition${c}`;
    const s = t(k);
    return s === k ? c : s;
  }, [t]);
  const sortOptions = useMemo(() => SORT_KEYS.map(([value, k]) => ({ value, label: t(k) })), [t]);
  const perPageRaw = t('perPage');
  const rowOptions = useMemo(() => PAGE_SIZE_LIST.map((n) => ({
    value: n,
    label: perPageRaw.includes('{{count}}') ? perPageRaw.split('{{count}}').join(n) : `${n} ${perPageRaw}`,
  })), [perPageRaw]);
  const perPageAria = useMemo(() => perPageRaw.split('{{count}}').join('').trim(), [perPageRaw]);
  const trustItems = useMemo(() => TRUST_KEYS.map(([icon, title, text]) => ({ icon, title: t(title), text: t(text) })), [t]);

  const [saved, toggleSaved] = useSavedProducts();
  const [hasToken] = useState(() => !!readStorage('authToken'));
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRangeState] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [pageSize, setPageSize] = useState(PAGE_SIZE_LIST[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [open, setOpen] = useState({ cond: true, price: true, offers: true, more: true });
  const gridRef = useRef(null);
  const showTop = useBackToTop();
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  useModalLock(isSidebarOpen, closeSidebar);

  const filters = useMemo(
    () => ({ searchTerm, priceRange, conditions, onSaleOnly, inStockOnly, savedOnly, sortBy }),
    [searchTerm, priceRange, conditions, onSaleOnly, inStockOnly, savedOnly, sortBy]
  );
  const deferred = useDeferredValue(filters);
  const isStale = deferred !== filters;

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async ({ signal }) => {
      const token = readStorage('authToken');
      const res = await api.get(
        `/api/categories/${encodeURIComponent(categoryId)}`,
        token ? { signal, headers: { Authorization: `Bearer ${token}` } } : { signal }
      );
      const body = res.data?.content ?? res.data?.data ?? res.data ?? {};
      const c = Array.isArray(body) ? body.find((x) => String(x?.id) === String(categoryId)) || {} : body;
      return { id: c.id ?? categoryId, name: c.name ?? c.categoryName ?? c.title ?? null };
    },
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
    retry: shouldRetry,
  });

  const { data: enriched = EMPTY_LIST, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: async ({ signal }) => {
      const res = await api.get(`/api/products/category/${encodeURIComponent(categoryId)}`, { signal });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const p of list) if (p) out.push(normalizeProduct(p));
      return out;
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
  });

  const { data: purchasedIds = EMPTY_LIST } = useQuery({
    queryKey: ['orders', 'purchased-ids'],
    queryFn: async ({ signal }) => {
      const token = readStorage('authToken');
      const res = await api.get(ORDERS_ENDPOINT, { signal, headers: { Authorization: `Bearer ${token}` } });
      return extractPurchasedIds(res.data);
    },
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const categoryName = useMemo(() => {
    const direct = nameOf(category?.name, language);
    if (direct) return direct;
    for (const p of enriched) {
      const n = nameOf(p.category ?? p.categoryName, language);
      if (n) return n;
    }
    return '';
  }, [category, enriched, language]);
  const nameLoading = !categoryName && (categoryLoading || isLoading);
  const heading = categoryName || t('categoryTitle');

  useEffect(() => {
    document.title = categoryName ? `${categoryName} | ${t('titleSuffix')}` : t('titleSuffix');
  }, [categoryName, t]);

  const clearFilters = useCallback(() => {
    setSearchTerm(''); setPriceRangeState(null); setConditions([]); setOnSaleOnly(false); setInStockOnly(false); setSavedOnly(false); setSortBy('relevance'); setCurrentPage(1);
  }, []);
  useEffect(() => { clearFilters(); }, [categoryId, clearFilters]);

  const maxPrice = useMemo(() => {
    const top = enriched.reduce((mx, p) => Math.max(mx, p.finalPrice), 0);
    const step = priceStep(top);
    return top ? Math.ceil(top / step) * step : 0;
  }, [enriched]);
  const setPriceRange = useCallback((r) => setPriceRangeState(r[0] <= 0 && r[1] >= maxPrice ? null : r), [maxPrice]);

  const { countsByCondition, onSaleCount, deals } = useMemo(() => {
    const c = {};
    let sale = 0;
    const discounted = [];
    for (const p of enriched) {
      if (p.condition) c[p.condition] = (c[p.condition] || 0) + 1;
      if (p.saving > 0) { sale++; discounted.push(p); }
    }
    discounted.sort((a, b) => b.discount - a.discount);
    return { countsByCondition: c, onSaleCount: sale, deals: discounted.slice(0, DEALS_LIMIT) };
  }, [enriched]);

  const heroItems = useMemo(() => {
    if (!enriched.length) return EMPTY_LIST;
    const topDeals = deals.slice(0, HERO_PER_KIND);
    const newest = enriched.filter((p) => p.stock !== 0).sort((a, b) => b._ts - a._ts).slice(0, HERO_PER_KIND);
    const seen = new Set();
    const out = [];
    const n = Math.max(topDeals.length, newest.length);
    for (let i = 0; i < n; i++) {
      for (const [p, kind] of [[topDeals[i], 'deal'], [newest[i], 'new']]) {
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          out.push({ kind, key: `${kind}${p.id}`, data: p });
        }
      }
    }
    return out.slice(0, HERO_PER_KIND * 2);
  }, [enriched, deals]);

  const slides = useMemo(
    () => (heroItems.length ? heroItems : [{ kind: 'category', key: 'category' }]).map((s, i) => ({ ...s, theme: THEMES[i % THEMES.length] })),
    [heroItems],
  );

  const purchased = useMemo(() => {
    if (!purchasedIds.length || !enriched.length) return EMPTY_LIST;
    const map = new Map();
    for (const p of enriched) map.set(String(p.id), p);
    const out = [];
    for (const id of purchasedIds) {
      const p = map.get(id);
      if (p) out.push(p);
      if (out.length >= BUY_AGAIN_LIMIT) break;
    }
    return out;
  }, [purchasedIds, enriched]);

  const filteredProducts = useMemo(() => {
    const { searchTerm: s, priceRange: pr, conditions: cs, onSaleOnly: os, inStockOnly: st, savedOnly: sv, sortBy: sb } = deferred;
    const term = s.trim().toLowerCase();
    const lo = pr ? pr[0] : 0;
    const hi = pr ? pr[1] : Infinity;
    const list = enriched.filter((p) => {
      if (p.finalPrice < lo || p.finalPrice > hi) return false;
      if (cs.length && !cs.includes(p.condition)) return false;
      if (os && !(p.saving > 0)) return false;
      if (st && p.stock === 0) return false;
      if (sv && !saved.has(p.id)) return false;
      if (term && !p._name.includes(term)) return false;
      return true;
    });
    if (sb === 'priceLowToHigh') list.sort((a, b) => a.finalPrice - b.finalPrice);
    else if (sb === 'priceHighToLow') list.sort((a, b) => b.finalPrice - a.finalPrice);
    else if (sb === 'newest') list.sort((a, b) => b._ts - a._ts);
    else if (sb === 'discount') list.sort((a, b) => b.discount - a.discount);
    return list;
  }, [enriched, deferred, saved]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [pageSize, deferred]);
  useEffect(() => { setCurrentPage((p) => Math.min(p, totalPages)); }, [totalPages]);

  const paginated = useMemo(() => filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredProducts, currentPage, pageSize]);
  const startItem = filteredProducts.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, filteredProducts.length);
  const activeFiltersCount = (searchTerm ? 1 : 0) + conditions.length + (priceRange ? 1 : 0) + (onSaleOnly ? 1 : 0) + (inStockOnly ? 1 : 0) + (savedOnly ? 1 : 0);

  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: scrollBehavior() }), []);
  const goToPage = useCallback((pg) => { setCurrentPage(pg); scrollToGrid(); }, [scrollToGrid]);
  const toggleCondition = useCallback((c) => setConditions((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const pickCondition = useCallback((c) => { toggleCondition(c); scrollToGrid(); }, [toggleCondition, scrollToGrid]);
  const resetCondition = useCallback(() => { setConditions([]); scrollToGrid(); }, [scrollToGrid]);
  const openProduct = useCallback((id) => navigate(`/device/${encodeURIComponent(id)}`), [navigate]);
  const handleCartClick = useCallback(() => navigate('/cart'), [navigate]);

  const handleAddToCart = useCallback(async (product) => {
    const token = readStorage('authToken');
    if (!token) {
      const Swal = await loadSwal();
      const result = await Swal.fire({
        title: t('loginRequiredTitle'), text: t('loginRequiredText'),
        icon: 'info', showCancelButton: true, confirmButtonText: t('goToLogin'), cancelButtonText: t('cancel'),
      });
      if (result.isConfirmed) navigate('/login');
      return false;
    }
    try {
      const res = await api.post('/api/cart/items', { productId: product.id, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status < 200 || res.status >= 300) throw new Error('Unexpected response');
      window.dispatchEvent(new Event('cart:updated'));
      toast({ icon: 'success', title: t('addedToCartTitle'), text: t('addedToCartText', { name: String(product.name || '').slice(0, 60) }), timer: 2500 });
      return true;
    } catch {
      toast({ icon: 'error', title: t('errorTitle'), text: t('addToCartFailedTitle'), timer: 3000 });
      return false;
    }
  }, [navigate, t]);

  const categoryKind = useMemo(() => kindOfCategory(categoryName), [categoryName]);
  const catKey = useMemo(() => isoCatKey(categoryKind), [categoryKind]);

  const renderSlide = useCallback((s, on) => (
    <HeroSlide
      key={s.key} slide={s} on={on} name={heading} count={enriched.length} catKey={catKey} categoryName={categoryName}
      money={money} onOpen={openProduct} onBrowse={scrollToGrid} t={t}
    />
  ), [heading, enriched.length, catKey, categoryName, money, openProduct, scrollToGrid, t]);
  const slideTitle = useCallback((s) => (s.kind === 'category' ? heading : s.data.name), [heading]);
  const crumbs = useMemo(() => <Crumbs name={heading} t={t} />, [heading, t]);

  const filterPanelProps = useMemo(() => ({
    darkMode, t, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, setOnSaleOnly, onSaleCount,
    inStockOnly, setInStockOnly, savedOnly, setSavedOnly,
    priceRange, setPriceRange, maxPrice, open, setOpen, clearFilters, activeFiltersCount,
  }), [darkMode, t, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, onSaleCount,
    inStockOnly, savedOnly, priceRange, setPriceRange, maxPrice, open, clearFilters, activeFiltersCount]);

  const layout = isMobile ? 'grid' : viewMode;
  const gridCols = layout === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1';
  const viewLabels = { grid: t('gridView'), list: t('listView') };

  return (
    <div
      dir={dir} lang={language}
      className={`pg-root ${darkMode ? 'pg-dark' : ''} min-h-screen overflow-x-hidden ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <Defs3D />
      <Toaster darkMode={darkMode} />
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} onCartClick={handleCartClick} />

      <div className="pg-enter">
        <h1 className="sr-only">{heading}</h1>
        <HeroSlider
          slides={slides} loading={nameLoading} language={language} label={heading}
          crumbs={crumbs} renderSlide={renderSlide} slideTitle={slideTitle} t={t}
        />

        <div className="pg-glow relative z-20 bg-[color:var(--pg)]">
          <div className={`${WRAP} pb-14 pt-10 sm:pb-20 sm:pt-14`}>
            <div className="pe-2 pb-2">
              <TrustStrip items={trustItems} />
            </div>
          </div>
        </div>
      </div>

      {purchased.length > 0 && (
        <section aria-label={t('buyAgainTitle')} className={`pg-pattern bg-[color:var(--pg)] ${SECTION} ${LAZY}`}>
          <div className={WRAP}>
            <ProductSlider
              icon={FiShoppingBag} title={t('buyAgainTitle')} subtitle={t('buyAgainSub')}
              products={purchased} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct}
              t={t} money={money} condLabel={condLabel} catKey={catKey} categoryName={categoryName}
            />
          </div>
        </section>
      )}

      {!isLoading && !isError && (
        <ConditionGrid counts={countsByCondition} selected={conditions} onToggle={pickCondition} onReset={resetCondition}
          darkMode={darkMode} title={t('shopByCondition')} subtitle={t('shopByConditionSub')} t={t} condLabel={condLabel} />
      )}

      {!isLoading && deals.length > 0 && (
        <section aria-label={t('biggestDiscounts')} className={`pg-glow bg-[color:var(--pg)] ${SECTION} ${LAZY}`}>
          <div className={WRAP}>
            <ProductSlider
              icon={FiPercent} title={t('biggestDiscounts')} subtitle={categoryName ? t('bestSavings', { name: categoryName }) : undefined}
              products={deals} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct}
              t={t} money={money} condLabel={condLabel} catKey={catKey} categoryName={categoryName}
            />
          </div>
        </section>
      )}

      <section aria-label={heading} className="pg-pattern bg-[color:var(--pg)]">
        <div id="category-products" ref={gridRef} className={`${WRAP} scroll-mt-20 ${SECTION}`}>
          <div className="w-full min-w-0">
            <SectionTitle label={t('productsLabel')} title={heading} />

            <div className={`mb-6 flex flex-col gap-3 p-3 sm:p-4 ${BOX_SM}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className={`text-sm font-medium ${MUTED}`} aria-live="polite">
                  <b dir="ltr" className="text-[color:var(--tx)]">{startItem}–{endItem}</b> / <b dir="ltr" className="text-[color:var(--tx)]">{filteredProducts.length}</b> {t('productsLabel')}
                </p>
                <div className="flex flex-wrap items-center gap-2 pe-1 pb-1">
                  {!isMobile && (
                    <>
                      <NbDropdown ariaLabel={perPageAria} value={pageSize} onChange={setPageSize} options={rowOptions} align="end" className="w-40 flex-shrink-0" />
                      {VIEW_MODES.map(([mode, Icon]) => (
                        <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-label={viewLabels[mode]} title={viewLabels[mode]} aria-pressed={viewMode === mode}
                          className={`${ICON} h-11 w-11 ${viewMode === mode ? BTN_ON : BTN_OFF}`}><Icon aria-hidden="true" className="h-4 w-4" /></button>
                      ))}
                    </>
                  )}
                  <button type="button" onClick={openSidebar} aria-haspopup="dialog" aria-expanded={isSidebarOpen} className={`${BTN} ${BTN_ON}`}>
                    <FiSliders aria-hidden="true" className="h-4 w-4" />{t('filters')}
                    {activeFiltersCount > 0 && <span dir="ltr" className="tabular-nums">({activeFiltersCount})</span>}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className={`relative flex h-11 min-w-0 flex-1 items-center gap-2 px-3 ${FIELD}`}>
                  <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
                  <input type="search" autoComplete="off" value={searchTerm} maxLength={80} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search')} aria-label={t('searchAria')}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60" />
                  {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label={t('clearSearch')} className={`rounded ${FOCUS}`}><FiX aria-hidden="true" className="h-4 w-4" /></button>}
                </div>
                <NbDropdown ariaLabel={t('sortBy')} value={sortBy} onChange={setSortBy} options={sortOptions} align="end" className="w-full sm:w-56" />
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2 pe-1 pb-1">
                {conditions.map((c) => <FilterChip key={c} label={condLabel(c)} onRemove={() => toggleCondition(c)} />)}
                {priceRange && <FilterChip label={`${currency} ${priceRange[0].toLocaleString(numLocale)} – ${priceRange[1].toLocaleString(numLocale)}`} onRemove={() => setPriceRangeState(null)} />}
                {onSaleOnly && <FilterChip label={t('onSale')} onRemove={() => setOnSaleOnly(false)} />}
                {inStockOnly && <FilterChip label={t('inStock')} onRemove={() => setInStockOnly(false)} />}
                {savedOnly && <FilterChip label={t('savedOnly')} onRemove={() => setSavedOnly(false)} />}
                {searchTerm && <FilterChip label={`“${searchTerm.slice(0, 20)}”`} onRemove={() => setSearchTerm('')} />}
                <button type="button" onClick={clearFilters} className={`rounded-md text-xs font-bold underline underline-offset-4 ${FOCUS}`}>{t('clearAll')}</button>
              </div>
            )}

            <div aria-busy={isStale} className={`transition-opacity duration-150 motion-reduce:transition-none ${isStale ? 'opacity-70' : 'opacity-100'}`}>
              {isLoading ? (
                <div className={`grid gap-4 pb-2 pe-2 sm:gap-5 ${gridCols}`} role="status" aria-label={t('loading')}>
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[380px] animate-pulse rounded-2xl bg-[color:var(--sf2)] motion-reduce:animate-none" />)}
                </div>
              ) : isError ? (
                <StateCard illustration="shopsEmpty" title={t('loadErrorTitle')} subtitle={t('loadErrorText')} darkMode={darkMode}>
                  <button type="button" onClick={() => refetch()} className={`${BTN} ${BTN_ON}`}><FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{t('tryAgain')}</button>
                </StateCard>
              ) : filteredProducts.length === 0 ? (
                <StateCard illustration="shopEmpty" title={enriched.length ? t('noProducts') : t('nothingHere')} subtitle={enriched.length ? t('removeFilter') : t('checkBackSoon')} darkMode={darkMode}>
                  {enriched.length > 0 && <button type="button" onClick={clearFilters} className={`${BTN} ${BTN_ON}`}>{t('clearFilters')}</button>}
                </StateCard>
              ) : (
                <div className={`grid gap-4 pb-2 pe-2 sm:gap-5 ${gridCols}`}>
                  {paginated.map((p, i) => (
                    <div key={p.id} className="pg-rise min-w-0" style={STAGGER[i % 12]}>
                      <ProductCard product={p} darkMode={darkMode} layout={layout} isSaved={saved.has(p.id)} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct} t={t} money={money} condLabel={condLabel} catKey={catKey} categoryName={categoryName} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 pt-8">
                <Pagination page={currentPage} total={totalPages} onChange={goToPage} t={t} />
                <p className={`text-xs font-medium ${MUTED}`}><span dir="ltr">{startItem}–{endItem}</span> / <span dir="ltr">{filteredProducts.length}</span> {t('productsLabel')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {showTop && (
        <div className="fixed bottom-5 end-5 z-40">
          <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} className={`${BTN} ${BTN_ON} !min-h-0 h-11 w-11 !px-0`}><FiArrowUp aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      )}

      <LazyMotion features={domAnimation}>
        <MotionConfig reducedMotion="user">
          <AnimatePresence>
            {isSidebarOpen && (
              <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t('filters')}>
                <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={closeSidebar} aria-hidden="true" />
                <m.div {...drawerMotion(isRTL)} style={GPU}
                  className="absolute inset-y-0 start-0 flex w-[22rem] min-w-0 max-w-[90vw] transform-gpu flex-col border-e-[3px] border-[color:var(--ink)] bg-[color:var(--pg)] text-[color:var(--tx)] md:w-96">
                  <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-4">
                    <h3 className="text-base font-extrabold uppercase"><span className="pg-hl">{t('filters')}</span></h3>
                    <button type="button" onClick={closeSidebar} aria-label={t('closeFilters')} className={`${ICON} ${BTN_OFF} h-10 w-10`}><FiX aria-hidden="true" className="h-5 w-5" /></button>
                  </div>
                  <div className="pg-sb min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pe-4 sm:px-4 sm:pe-5"><FilterPanel {...filterPanelProps} /></div>
                  <div className="border-t-[3px] border-[color:var(--ink)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                    <button type="button" onClick={() => { closeSidebar(); scrollToGrid(); }} className={`${BTN} ${BTN_ON} w-full`}>{t('showItems', { count: filteredProducts.length })}</button>
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>
        </MotionConfig>
      </LazyMotion>

      <Suspense fallback={null}><Footer darkMode={darkMode} /></Suspense>
    </div>
  );
}

export { queryClient };
export default function CategoryProducts(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <CategoryProductsContent {...props} />
    </QueryClientProvider>
  );
}