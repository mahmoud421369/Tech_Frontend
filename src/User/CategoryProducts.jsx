import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useId, memo, Suspense, lazy, useDeferredValue,
} from 'react';
import { useParams, Link, useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown, FiX, FiSliders, FiGrid, FiList,
  FiArrowUp, FiRefreshCw, FiCheck, FiHeart, FiPlus, FiAlertCircle,
} from 'react-icons/fi';
import { RiStarFill } from 'react-icons/ri';
import { LazyMotion, domAnimation, m, AnimatePresence, MotionConfig } from 'framer-motion';
import api from '../common/api/api';
import Navbar from '../components/user/Navbar';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  LISTING_CSS, CONDITIONS, readStorage, safeImageUrl, kindOfCategory, priceStep, clamp, loadSwal,
  useBackToTop, useModalLock, useHScroll, PriceRangeSlider,
} from '../components/user/ListingKit';
import { IsoIllustration, isoCatKey } from '../components/user/IsoIllustrations';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import { markImg, isImgOk, isImgBad, warmImages } from '../common/utils/imageCache';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const Footer = lazy(() => import('../components/user/Footer'));
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } },
});

const DEALS_LIMIT = 8;
const BUY_AGAIN_LIMIT = 12;
const CARD_IMG_W = 480;
const CARD_IMG_H = 384;
const SAVED_KEY = 'nb_saved_devices';
const SAVED_MAX = 500;
const PRODUCTS_MAX = 2000;
const ORDERS_MAX = 200;
const PRIORITY_CARDS = 4;
const SNIPPET_MAX = 90;
const LOW_STOCK = 5;
const PAGE_SIZE_LIST = [12, 24, 36, 48];
const ORDERS_ENDPOINT = '/api/orders/my';
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const PG_CSS = `
.font-jakarta, .font-jakarta * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.font-cairo, .font-cairo * { font-family: 'Cairo', system-ui, sans-serif; }
.pg-root button,.pg-root input,.pg-root select,.pg-root textarea{font-family:inherit}
.pg-root.cp-page{--ink:#e5e7eb;--acc:#10b981;--acc-ink:#022c22;--tx:#022c22;--mu:#4b5563;--sf:#ffffff;--sf2:#f3f4f6;--pg:#f9fafb;--sale:#c2410c;--pos:#15803d;--img:#ffffff;--sk1:#e5e7eb;--sk2:#f3f4f6;background:var(--pg);color:var(--tx)}
.pg-root.cp-page.pg-dark{--ink:rgba(255,255,255,.12);--acc:#39ff88;--acc-ink:#022c22;--tx:#ffffff;--mu:#a3a3a3;--sf:#1e1e1e;--sf2:#262626;--pg:#141414;--sale:#fb923c;--pos:#4ade80;--img:#2a2a2a;--sk1:#262626;--sk2:#343434}
.pg-enter{animation:pgEnter .38s cubic-bezier(.16,1,.3,1) backwards}
@keyframes pgEnter{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.pg-rise{animation:pgRise .4s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*45ms)}
@keyframes pgRise{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}
.pg-card{animation:pgRise .34s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*28ms)}
.pg-pop{animation:pgPop .12s ease-out both;transform-origin:top}
@keyframes pgPop{from{opacity:0;transform:translate3d(0,-6px,0) scale(.98)}to{opacity:1;transform:none}}
.pg-fade{animation:pgFade .3s ease both}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
.pg-skel{background:linear-gradient(100deg,var(--sk1) 30%,var(--sk2) 50%,var(--sk1) 70%);background-size:200% 100%;animation:pgShimmer 1.4s linear infinite}
@keyframes pgShimmer{from{background-position:100% 0}to{background-position:-100% 0}}
.pg-nosb{scrollbar-width:none}
.pg-nosb::-webkit-scrollbar{display:none}
.pg-sb{scrollbar-width:thin;scrollbar-color:var(--acc) var(--sf2)}
@media (prefers-reduced-motion:reduce){.pg-enter,.pg-rise,.pg-card,.pg-pop,.pg-fade,.pg-skel{animation:none}}
`;

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('category-page-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'category-page-styles';
  tag.textContent = `${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}${PG_CSS}`;
  document.head.appendChild(tag);
};
injectStyles();

const FONT_URLS = {
  jakarta: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  cairo: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
};
const requestedFonts = new Set();
const addLink = (rel, href, extra) => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (extra) Object.assign(link, extra);
  document.head.appendChild(link);
};
const ensureFont = (key) => {
  if (typeof document === 'undefined' || requestedFonts.has(key) || !FONT_URLS[key]) return;
  if (!requestedFonts.size) {
    addLink('preconnect', 'https://fonts.googleapis.com');
    addLink('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
  }
  requestedFonts.add(key);
  addLink('stylesheet', FONT_URLS[key], { referrerPolicy: 'no-referrer' });
};

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const BOX = 'rounded-xl border border-[color:var(--ink)] bg-[color:var(--sf)] text-[color:var(--tx)]';
const BOX_SQUARE = 'rounded-none border border-[color:var(--ink)] bg-[color:var(--sf)] text-[color:var(--tx)]';
const PRESS = `transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-[color:var(--acc)] [@media(hover:hover)]:hover:shadow-xl ${FOCUS}`;
const BTN = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold transition-[transform,filter,background-color,box-shadow] duration-150 motion-reduce:transition-none active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const BTN_ON = '!border-transparent bg-[color:var(--acc)] text-[color:var(--acc-ink)] hover:brightness-95';
const BTN_CART = '!border-transparent bg-gradient-to-b from-emerald-500 to-emerald-600 !text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_8px_16px_-8px_rgba(5,150,105,.8)] [@media(hover:hover)]:hover:-translate-y-px [@media(hover:hover)]:hover:from-emerald-400 [@media(hover:hover)]:hover:to-emerald-600 [@media(hover:hover)]:hover:shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_12px_20px_-8px_rgba(5,150,105,.9)] disabled:shadow-none';
const BTN_CART_DONE = '!from-emerald-700 !to-emerald-700';
const BTN_OFF = 'bg-[color:var(--sf)] text-[color:var(--tx)] hover:bg-[color:var(--sf2)]';
const BTN_SM = '!min-h-9 !px-3 !py-1.5 text-xs';
const ICON = `inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[color:var(--ink)] transition-[transform,background-color] duration-150 motion-reduce:transition-none active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const FIELD = 'rounded-lg border border-[color:var(--ink)] bg-[color:var(--sf)] text-[color:var(--tx)] focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)]';
const WRAP = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';
const LAZY = '[content-visibility:auto] [contain-intrinsic-size:auto_640px]';
const MUTED = 'text-[color:var(--mu)]';
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const scrollBehavior = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const EXTRA = {
  en: {
    save: 'Save', saved: 'Saved', savedOnly: 'Saved only', inStockOnly: 'In stock only', inStock: 'In stock', moreFilters: 'More filters', sortDiscount: 'Biggest discount',
    youSave: 'Save {{value}}', originalPrice: 'Original price', discountedPrice: 'Price after discount', discountValue: 'Discount',
    onlyLeft: 'Only {{count}} left in stock',
    buyAgainTitle: 'Buy it again', buyAgainSub: 'Items you have purchased before',
    loading: 'Loading',
  },
  ar: {
    save: 'حفظ', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', inStockOnly: 'المتوفر فقط', inStock: 'متوفر', moreFilters: 'فلاتر إضافية', sortDiscount: 'أكبر خصم',
    youSave: 'وفّر {{value}}', originalPrice: 'السعر الأصلي', discountedPrice: 'السعر بعد الخصم', discountValue: 'الخصم',
    onlyLeft: 'متبقي {{count}} فقط في المخزون',
    buyAgainTitle: 'اشترِ مرة أخرى', buyAgainSub: 'منتجات اشتريتها من قبل',
    loading: 'جارٍ التحميل',
  },
  fr: {
    save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrés uniquement', inStockOnly: 'En stock uniquement', inStock: 'En stock', moreFilters: 'Plus de filtres', sortDiscount: 'Plus grande remise',
    youSave: 'Économisez {{value}}', originalPrice: "Prix d'origine", discountedPrice: 'Prix après remise', discountValue: 'Remise',
    onlyLeft: 'Plus que {{count}} en stock',
    buyAgainTitle: 'Racheter', buyAgainSub: 'Articles que vous avez déjà achetés',
    loading: 'Chargement',
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
  for (const o of orders.slice(0, ORDERS_MAX)) {
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
const VIEW_MODES = [['grid', FiGrid], ['list', FiList]];
const EMPTY_LIST = [];

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    if (!Array.isArray(v)) return [];
    return v.filter((x) => typeof x === 'string' || typeof x === 'number').slice(0, SAVED_MAX);
  } catch {
    return [];
  }
};

const useSavedProducts = () => {
  const [ids, setIds] = useState(readSaved);
  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-SAVED_MAX);
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

const Skel = ({ className = '' }) => <div aria-hidden="true" className={`pg-skel ${className}`} />;

const CardSkeleton = memo(({ list }) => (
  <div aria-hidden="true" className={`flex h-full overflow-hidden ${BOX} ${list ? 'flex-row' : 'flex-col'}`}>
    <Skel className={list ? 'min-h-[10rem] w-32 flex-shrink-0 self-stretch sm:w-48' : 'aspect-[4/3] w-full'} />
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5">
      <Skel className="h-3.5 w-4/5 rounded" />
      <Skel className="h-3.5 w-3/5 rounded" />
      <Skel className="h-3 w-1/3 rounded" />
      <div className="mt-auto space-y-2 pt-3">
        <Skel className="h-5 w-1/2 rounded" />
        <Skel className={`h-10 rounded-lg ${list ? 'w-36' : 'w-full'}`} />
      </div>
    </div>
  </div>
));

const GridSkeleton = memo(({ count, list, gridCols, label }) => (
  <div className={`grid gap-4 ${gridCols}`} role="status" aria-label={label} aria-busy="true">
    {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} list={list} />)}
  </div>
));

const FilterSkeleton = memo(() => (
  <div aria-hidden="true" className={`w-full space-y-5 p-4 ${BOX_SQUARE}`}>
    <Skel className="h-5 w-24 rounded" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="space-y-3 border-t border-[color:var(--ink)] pt-4">
        <Skel className="h-4 w-32 rounded" />
        <Skel className="h-4 w-full rounded" />
        <Skel className="h-4 w-4/5 rounded" />
      </div>
    ))}
  </div>
));

const SliderSkeleton = memo(() => (
  <div aria-hidden="true">
    <div className="mb-6 flex items-center gap-3">
      <Skel className="h-8 w-1.5 rounded-full" />
      <Skel className="h-7 w-56 rounded" />
    </div>
    <div className="flex gap-4 overflow-hidden">
      {[0, 1, 2, 3].map((i) => <div key={i} className="w-[210px] flex-shrink-0 sm:w-[250px]"><CardSkeleton /></div>)}
    </div>
  </div>
));

const Deferred = ({ children, fallback = null, minHeight = 420, margin = '480px' }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (shown) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, margin]);
  return <div ref={ref} style={shown ? undefined : { minHeight }}>{shown ? <div className="pg-fade">{children}</div> : fallback}</div>;
};

const SectionTitle = memo(({ title, subtitle, children }) => (
  <div className="mb-6 sm:mb-8">
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-8 w-1.5 shrink-0 rounded-full bg-[color:var(--acc)]" />
      <h2 className="min-w-0 text-xl font-extrabold tracking-[-0.02em] [text-wrap:balance] rtl:leading-[1.4] rtl:tracking-normal sm:text-3xl">{title}</h2>
      <span aria-hidden="true" className="hidden h-px flex-1 border-t border-[color:var(--ink)] sm:block" />
      {children && <div className="ms-auto flex-shrink-0 sm:ms-0">{children}</div>}
    </div>
    {subtitle && <p className={`mt-2 ps-[18px] text-sm font-medium sm:text-base ${MUTED}`}>{subtitle}</p>}
  </div>
));

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
          className={`pg-pop pg-sb absolute top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1 shadow-xl ${BOX} ${align === 'end' ? 'end-0' : 'start-0'}`}>
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={selected}
                onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-sm font-bold ${selected ? 'bg-[color:var(--acc)] text-[color:var(--acc-ink)]' : i === active ? 'bg-[color:var(--sf2)]' : ''}`}>
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
  <button type="button" onClick={onRemove} className={`${BTN} ${BTN_OFF} ${BTN_SM}`}>
    <span className="max-w-[10rem] truncate">{label}</span><FiX aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
  </button>
));

const OptionRow = memo(({ label, count, selected, onClick }) => (
  <button type="button" role="checkbox" aria-checked={selected} onClick={onClick}
    className={`flex min-h-10 w-full items-center gap-2.5 rounded-none py-1.5 text-start text-sm font-semibold ${FOCUS}`}>
    <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-none border border-[color:var(--mu)] text-[color:var(--acc-ink)] transition-colors duration-150 motion-reduce:transition-none ${selected ? '!border-transparent bg-[color:var(--acc)]' : 'bg-[color:var(--sf2)]'}`}>
      {selected && <FiCheck aria-hidden="true" className="h-3 w-3" strokeWidth={3} />}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className={`text-xs tabular-nums ${MUTED}`} dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ title, isOpen, onToggle, children }) => (
  <section className="border-t border-[color:var(--ink)]">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className={`flex min-h-11 w-full items-center gap-2.5 rounded-none py-3 text-start ${FOCUS}`}>
      <span className="min-w-0 flex-1 truncate text-sm font-extrabold">{title}</span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="pg-fade min-w-0 pb-4">{children}</div>}
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
    <nav aria-label={t('paginationLabel')} className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" className={`${PAGE_BTN} ${BTN_OFF}`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}><FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></button>
      {items.map((x) => (typeof x === 'number' ? (
        <button key={x} type="button" onClick={() => onChange(x)} aria-label={`${x}`} aria-current={x === page ? 'page' : undefined}
          className={`${PAGE_BTN} ${x === page ? BTN_ON : BTN_OFF}`}>{x}</button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-extrabold">…</span>))}
      <button type="button" className={`${PAGE_BTN} ${BTN_OFF}`} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}><FiChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></button>
    </nav>
  );
});

const Crumbs = memo(({ name, nameLoading, t }) => (
  <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-sm font-semibold ${MUTED}`}>
    <Link to="/" className={`rounded hover:text-[color:var(--tx)] hover:underline underline-offset-4 ${FOCUS}`}>{t('home')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    {nameLoading
      ? <Skel className="h-4 w-24 rounded" />
      : <span aria-current="page" className="max-w-[14rem] truncate text-[color:var(--tx)]">{name}</span>}
  </nav>
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

const DeviceImage = memo(({ src, alt, catKey, darkMode, priority }) => {
  const imgRef = useRef(null);
  const [failed, setFailed] = useState(() => isImgBad(src));
  const [loaded, setLoaded] = useState(() => isImgOk(src));
  const handleError = useCallback(() => { markImg(src, 'bad'); setFailed(true); }, [src]);
  const handleLoad = useCallback(() => { markImg(src, 'ok'); setLoaded(true); }, [src]);
  useEffect(() => { setFailed(isImgBad(src)); setLoaded(isImgOk(src)); }, [src]);
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) { markImg(src, 'ok'); setLoaded(true); }
  }, [src, failed]);
  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className="pg-fade absolute inset-0 flex items-center justify-center overflow-hidden bg-[color:var(--img)] [contain:layout_paint]">
        <IsoIllustration type={catKey} tone="emerald" darkMode={darkMode} onGreen={false} hoverOnly
          className="aspect-square h-[80%] transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105" />
      </div>
    );
  }
  return (
    <>
      {!loaded && <Skel className="absolute inset-0" />}
      <img
        ref={imgRef} src={src} alt={alt} width={CARD_IMG_W} height={CARD_IMG_H}
        loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'low'} referrerPolicy="no-referrer"
        onLoad={handleLoad} onError={handleError}
        className={`absolute inset-0 block h-full w-full object-contain p-4 transition-[opacity,transform] duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
});

const ProductCard = memo(({ product, darkMode, layout = 'grid', isSaved = false, priority = false, onSave, onAddToCart, onOpen, t, money, condLabel, catKey, categoryName }) => {
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
      className={`group relative flex h-full cursor-pointer overflow-hidden ${BOX} ${PRESS} ${isList ? 'flex-row' : 'flex-col'}`}
    >
      <div className={`relative overflow-hidden bg-[color:var(--img)] [contain:layout_paint] ${isList ? 'min-h-[10rem] w-32 flex-shrink-0 self-stretch border-e border-[color:var(--ink)] sm:w-48' : 'aspect-[4/3] w-full border-b border-[color:var(--ink)]'}`}>
        <DeviceImage src={product._img} alt={product.name} catKey={catKey} darkMode={darkMode} priority={priority} />
        {product._pct > 0 && (
          <span dir="ltr" className="absolute start-2 top-2 z-10 rounded-md bg-orange-500 px-1.5 py-1 text-[11px] font-black leading-none tabular-nums text-white shadow-sm">-{product._pct}%</span>
        )}
        <button
          type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
          className={`${ICON} absolute end-2 top-2 z-10 h-9 w-9 border-transparent bg-white/90 text-emerald-950 shadow-sm backdrop-blur hover:bg-white`}
        >
          <FiHeart aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${isSaved ? 'scale-110 text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
        <h3 className={`line-clamp-2 text-sm font-bold leading-snug ${isList ? '' : 'min-h-[2.5rem]'}`}>{product.name}</h3>
        {isList && <p className={`line-clamp-2 text-xs leading-5 ${MUTED}`}>{product._snip || t('noDescription')}</p>}

        {meta && <p className="line-clamp-1 text-[11px] font-bold text-[color:var(--pos)]">{meta}</p>}

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

        <div className={`mt-auto flex gap-2 pt-2 ${isList ? 'items-end justify-between' : 'flex-col'}`}>
          <Price product={product} money={money} t={t} />
          <button
            type="button" onClick={handleCart} disabled={out || btn === 'adding'} aria-busy={btn === 'adding'}
            className={`${BTN} ${BTN_CART} ${btn === 'added' ? BTN_CART_DONE : ''} !min-h-10 ${isList ? '' : 'w-full'}`}
          >
            {btn === 'adding' ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
              : btn === 'added' ? <FiCheck aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
              : <FiPlus aria-hidden="true" className="h-4 w-4" strokeWidth={3} />}
            <span>{t('addToCart')}</span>
          </button>
        </div>
      </div>
    </article>
  );
});

const ProductSlider = memo(({ title, subtitle, products, darkMode, isRTL, saved, onSave, onAddToCart, onOpen, t, money, condLabel, catKey, categoryName }) => {
  const { ref, edge, scroll } = useHScroll(products.length, isRTL);
  if (!products.length) return null;
  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;
  return (
    <div>
      <SectionTitle title={title} subtitle={subtitle}>
        <div className="flex gap-2">
          <button type="button" className={`${ICON} ${BTN_OFF} h-10 w-10`} onClick={() => scroll('back')} disabled={!edge.l} aria-label={t('scrollBack')}><BackIcon aria-hidden="true" className="h-5 w-5" /></button>
          <button type="button" className={`${ICON} ${BTN_OFF} h-10 w-10`} onClick={() => scroll('forward')} disabled={!edge.r} aria-label={t('scrollForward')}><ForwardIcon aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      </SectionTitle>
      <div ref={ref} className="pg-nosb flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 pt-1 motion-reduce:scroll-auto">
        {products.map((p) => (
          <div key={p.id} className="w-[210px] flex-shrink-0 snap-start sm:w-[250px]">
            <ProductCard product={p} darkMode={darkMode} isSaved={saved.has(p.id)} onSave={onSave} onAddToCart={onAddToCart} onOpen={onOpen} t={t} money={money} condLabel={condLabel} catKey={catKey} categoryName={categoryName} />
          </div>
        ))}
      </div>
    </div>
  );
});

const StateCard = memo(({ illustration, title, subtitle, darkMode, children }) => (
  <div className={`pg-fade px-4 py-14 text-center sm:py-20 ${BOX}`}>
    <IsoIllustration type={illustration} tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
    <p className="mb-2 text-lg font-extrabold sm:text-2xl">{title}</p>
    <p className={`mb-6 text-sm font-medium sm:text-base ${MUTED}`}>{subtitle}</p>
    {children}
  </div>
));

const FilterPanel = memo((p) => {
  const { t, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, setOnSaleOnly, onSaleCount,
    inStockOnly, setInStockOnly, savedOnly, setSavedOnly,
    priceRange, setPriceRange, maxPrice, open, setOpen, clearFilters, activeFiltersCount, darkMode, bare } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const step = priceStep(maxPrice);
  return (
    <div className={`w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4 ${bare ? '' : BOX_SQUARE}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{t('filters')}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className={`flex-shrink-0 rounded-none text-xs font-bold underline underline-offset-4 ${FOCUS}`}>{t('resetAll')}</button>}
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
  const { categoryId: rawCategoryId } = useParams();
  const categoryId = ID_RE.test(rawCategoryId || '') ? rawCategoryId : '';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  useScrollTopOnEnter(categoryId);

  useEffect(() => { ensureFont(isAr ? 'cairo' : 'jakarta'); }, [isAr]);

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
  useEffect(() => { if (!isMobile) setIsSidebarOpen(false); }, [isMobile]);

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
      for (const p of list.slice(0, PRODUCTS_MAX)) if (p && typeof p === 'object') out.push(normalizeProduct(p));
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

  useEffect(() => {
    const urls = [];
    for (const p of paginated) if (p._img) urls.push(p._img);
    return warmImages(urls);
  }, [paginated]);

  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: scrollBehavior() }), []);
  const goToPage = useCallback((pg) => { setCurrentPage(pg); scrollToGrid(); }, [scrollToGrid]);
  const toggleCondition = useCallback((c) => setConditions((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const openProduct = useCallback((id) => {
    const safe = String(id ?? '');
    if (ID_RE.test(safe)) navigate(`/device/${encodeURIComponent(safe)}`);
  }, [navigate]);
  const handleCartClick = useCallback(() => navigate('/cart'), [navigate]);

  const handleAddToCart = useCallback(async (product) => {
    if (product?.id == null) return false;
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

  const filterPanelProps = useMemo(() => ({
    darkMode, t, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, setOnSaleOnly, onSaleCount,
    inStockOnly, setInStockOnly, savedOnly, setSavedOnly,
    priceRange, setPriceRange, maxPrice, open, setOpen, clearFilters, activeFiltersCount,
  }), [darkMode, t, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, onSaleCount,
    inStockOnly, savedOnly, priceRange, setPriceRange, maxPrice, open, clearFilters, activeFiltersCount]);

  const layout = isMobile ? 'grid' : viewMode;
  const gridCols = layout === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1';
  const viewLabels = { grid: t('gridView'), list: t('listView') };
  const skeletonCount = layout === 'grid' ? 8 : 4;

  return (
    <div
      dir={dir} lang={language}
      className={`pg-root cp-page ${darkMode ? 'pg-dark' : ''} min-h-screen overflow-x-hidden ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <Defs3D />
      <Toaster darkMode={darkMode} />
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} onCartClick={handleCartClick} />

      <main key={categoryId} className="pg-enter">
        <div className={`${WRAP} pb-12 pt-28 sm:pt-32`}>
          <div className="pg-rise" style={STAGGER[0]}>
            <Crumbs name={heading} nameLoading={nameLoading} t={t} />
          </div>

          <header className="pg-rise mb-6 mt-4 flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--ink)] pb-4" style={STAGGER[1]}>
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="h-9 w-1.5 shrink-0 rounded-full bg-[color:var(--acc)]" />
              {nameLoading
                ? <Skel className="h-9 w-56 rounded" />
                : <h1 className="pg-fade min-w-0 text-2xl font-extrabold tracking-[-0.02em] [text-wrap:balance] rtl:leading-[1.4] rtl:tracking-normal sm:text-4xl">{heading}</h1>}
            </div>
            {isLoading ? <Skel className="h-4 w-24 rounded" /> : !isError && (
              <p className={`pg-fade text-sm font-semibold ${MUTED}`}>
                <b dir="ltr" className="tabular-nums text-[color:var(--tx)]">{enriched.length}</b> {t('productsLabel')}
              </p>
            )}
          </header>

          <div ref={gridRef} id="category-products" className="flex scroll-mt-24 items-start gap-6 lg:gap-8">
            <aside aria-label={t('filters')} className="pg-rise pg-sb sticky top-24 hidden max-h-[calc(100vh-7rem)] w-72 flex-shrink-0 overflow-y-auto overscroll-contain lg:block" style={STAGGER[2]}>
              {isLoading ? <FilterSkeleton /> : <FilterPanel {...filterPanelProps} />}
            </aside>

            <div className="min-w-0 flex-1">
              <div className={`pg-rise mb-5 flex flex-col gap-3 p-3 sm:p-4 ${BOX}`} style={STAGGER[2]}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className={`relative flex h-11 min-w-0 flex-1 items-center gap-2 px-3 ${FIELD}`}>
                    <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
                    <input type="search" autoComplete="off" value={searchTerm} maxLength={80} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search')} aria-label={t('searchAria')}
                      className="min-w-0 flex-1 p-3 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60" />
                    {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label={t('clearSearch')} className={`rounded ${FOCUS}`}><FiX aria-hidden="true" className="h-4 w-4" /></button>}
                  </div>
                  <NbDropdown ariaLabel={t('sortBy')} value={sortBy} onChange={setSortBy} options={sortOptions} align="end" className="w-full sm:w-56" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className={`text-sm font-medium ${MUTED}`} aria-live="polite">
                    <b dir="ltr" className="text-[color:var(--tx)]">{startItem}–{endItem}</b> / <b dir="ltr" className="text-[color:var(--tx)]">{filteredProducts.length}</b> {t('productsLabel')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {!isMobile && (
                      <>
                        <NbDropdown ariaLabel={perPageAria} value={pageSize} onChange={setPageSize} options={rowOptions} align="end" className="w-40 flex-shrink-0" />
                        {VIEW_MODES.map(([mode, Icon]) => (
                          <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-label={viewLabels[mode]} title={viewLabels[mode]} aria-pressed={viewMode === mode}
                            className={`${ICON} h-11 w-11 ${viewMode === mode ? BTN_ON : BTN_OFF}`}><Icon aria-hidden="true" className="h-4 w-4" /></button>
                        ))}
                      </>
                    )}
                    <button type="button" onClick={openSidebar} aria-haspopup="dialog" aria-expanded={isSidebarOpen} className={`${BTN} ${BTN_ON} lg:hidden`}>
                      <FiSliders aria-hidden="true" className="h-4 w-4" />{t('filters')}
                      {activeFiltersCount > 0 && <span dir="ltr" className="tabular-nums">({activeFiltersCount})</span>}
                    </button>
                  </div>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="pg-fade mb-5 flex flex-wrap items-center gap-2">
                  {conditions.map((c) => <FilterChip key={c} label={condLabel(c)} onRemove={() => toggleCondition(c)} />)}
                  {priceRange && <FilterChip label={`${currency} ${priceRange[0].toLocaleString(numLocale)} – ${priceRange[1].toLocaleString(numLocale)}`} onRemove={() => setPriceRangeState(null)} />}
                  {onSaleOnly && <FilterChip label={t('onSale')} onRemove={() => setOnSaleOnly(false)} />}
                  {inStockOnly && <FilterChip label={t('inStock')} onRemove={() => setInStockOnly(false)} />}
                  {savedOnly && <FilterChip label={t('savedOnly')} onRemove={() => setSavedOnly(false)} />}
                  {searchTerm && <FilterChip label={`“${searchTerm.slice(0, 20)}”`} onRemove={() => setSearchTerm('')} />}
                  <button type="button" onClick={clearFilters} className={`rounded-md text-xs font-bold underline underline-offset-4 ${FOCUS}`}>{t('clearAll')}</button>
                </div>
              )}

              <div aria-busy={isStale} className={`transition-opacity duration-200 motion-reduce:transition-none ${isStale ? 'opacity-70' : 'opacity-100'}`}>
                {isLoading ? (
                  <GridSkeleton count={skeletonCount} list={layout === 'list'} gridCols={gridCols} label={t('loading')} />
                ) : isError ? (
                  <StateCard illustration="shopsEmpty" title={t('loadErrorTitle')} subtitle={t('loadErrorText')} darkMode={darkMode}>
                    <button type="button" onClick={() => refetch()} className={`${BTN} ${BTN_ON}`}><FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{t('tryAgain')}</button>
                  </StateCard>
                ) : filteredProducts.length === 0 ? (
                  <StateCard illustration="shopEmpty" title={enriched.length ? t('noProducts') : t('nothingHere')} subtitle={enriched.length ? t('removeFilter') : t('checkBackSoon')} darkMode={darkMode}>
                    {enriched.length > 0 && <button type="button" onClick={clearFilters} className={`${BTN} ${BTN_ON}`}>{t('clearFilters')}</button>}
                  </StateCard>
                ) : (
                  <div className={`grid gap-4 ${gridCols}`}>
                    {paginated.map((p, i) => (
                      <div key={p.id} className="pg-card min-w-0" style={STAGGER[i % 12]}>
                        <ProductCard product={p} darkMode={darkMode} layout={layout} isSaved={saved.has(p.id)} priority={i < PRIORITY_CARDS} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct} t={t} money={money} condLabel={condLabel} catKey={catKey} categoryName={categoryName} />
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
        </div>

        {deals.length > 0 && !isLoading && (
          <section aria-label={t('biggestDiscounts')} className={`border-t border-[color:var(--ink)] bg-[color:var(--sf)] py-10 sm:py-14 ${LAZY}`}>
            <div className={WRAP}>
              <Deferred fallback={<SliderSkeleton />}>
                <ProductSlider
                  title={t('biggestDiscounts')} subtitle={categoryName ? t('bestSavings', { name: categoryName }) : undefined}
                  products={deals} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct}
                  t={t} money={money} condLabel={condLabel} catKey={catKey} categoryName={categoryName}
                />
              </Deferred>
            </div>
          </section>
        )}

        {purchased.length > 0 && (
          <section aria-label={t('buyAgainTitle')} className={`border-t border-[color:var(--ink)] py-10 sm:py-14 ${LAZY}`}>
            <div className={WRAP}>
              <Deferred fallback={<SliderSkeleton />}>
                <ProductSlider
                  title={t('buyAgainTitle')} subtitle={t('buyAgainSub')}
                  products={purchased} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct}
                  t={t} money={money} condLabel={condLabel} catKey={catKey} categoryName={categoryName}
                />
              </Deferred>
            </div>
          </section>
        )}
      </main>

      {showTop && (
        <div className="pg-fade fixed bottom-5 end-5 z-40">
          <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} className={`${BTN} ${BTN_ON} !min-h-0 h-11 w-11 !px-0 shadow-lg`}><FiArrowUp aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      )}

      <LazyMotion features={domAnimation}>
        <MotionConfig reducedMotion="user">
          <AnimatePresence>
            {isSidebarOpen && (
              <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t('filters')}>
                <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={closeSidebar} aria-hidden="true" />
                <m.div {...drawerMotion(isRTL)} style={GPU}
                  className="absolute inset-y-0 start-0 flex w-[22rem] min-w-0 max-w-[90vw] transform-gpu flex-col border-e border-[color:var(--ink)] bg-[color:var(--pg)] text-[color:var(--tx)] md:w-96">
                  <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-4">
                    <h3 className="text-base font-extrabold">{t('filters')}</h3>
                    <button type="button" onClick={closeSidebar} aria-label={t('closeFilters')} className={`${ICON} ${BTN_OFF} h-10 w-10`}><FiX aria-hidden="true" className="h-5 w-5" /></button>
                  </div>
                  <div className="pg-sb min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 sm:px-4">
                    {isLoading ? <FilterSkeleton /> : <FilterPanel {...filterPanelProps} />}
                  </div>
                  <div className="border-t border-[color:var(--ink)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
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