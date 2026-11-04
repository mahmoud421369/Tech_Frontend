import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useId, memo, Suspense, lazy, useDeferredValue,
} from 'react';
import { useParams, Link, useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown, FiX, FiSliders,
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
const CARD_IMG_H = 480;
const SAVED_KEY = 'nb_saved_devices';
const SAVED_MAX = 500;
const PRODUCTS_MAX = 2000;
const ORDERS_MAX = 200;
const PRIORITY_CARDS = 4;
const LOW_STOCK = 5;
const PAGE_SIZE = 24;
const TOP_RATING = 4.5;
const TOP_REVIEWS = 100;
const ORDERS_ENDPOINT = '/api/orders/my';
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const PG_CSS = `
.font-jakarta, .font-jakarta * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.font-cairo, .font-cairo * { font-family: 'Cairo', system-ui, sans-serif; }
.pg-root button,.pg-root input,.pg-root select,.pg-root textarea{font-family:inherit}
.pg-root.cp-page{--dx:1;--bg:#ffffff;--card:#ffffff;--tx:#052e1e;--mu:rgba(5,46,30,.68);--ln:#e5e7eb;--soft:#f3f4f6;--acc:#059669;--btn:#39ff88;--btn2:#7dffb0;--btn-ink:#022c22;--sale:#dc2626;--pos:#15803d;--img:#f3f4f6;--bd:#000000;--sd:#000000;--ring:#059669;--sk1:#eceef1;--sk2:#f7f8f9;--ease:cubic-bezier(.22,.8,.2,1);--sh2:calc(var(--dx)*2px) 2px 0 0 var(--sd);--sh3:calc(var(--dx)*3px) 3px 0 0 var(--sd);--sh:calc(var(--dx)*4px) 4px 0 0 var(--sd);--sh6:calc(var(--dx)*6px) 6px 0 0 var(--sd);background:var(--bg);color:var(--tx);color-scheme:light;line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.pg-root.cp-page[dir=rtl]{--dx:-1}
.pg-root.cp-page.pg-dark{--bg:#121212;--card:#1c1c1e;--tx:#ffffff;--mu:rgba(255,255,255,.66);--ln:rgba(255,255,255,.12);--soft:#2a2a2e;--acc:#39ff88;--img:#232327;--bd:rgba(255,255,255,.16);--sd:#0b4a35;--ring:#39ff88;--sale:#fb7185;--pos:#4ade80;--sk1:#2a2a2e;--sk2:#343438;color-scheme:dark}
.pg-enter{animation:pgEnter .4s cubic-bezier(.16,1,.3,1) backwards}
@keyframes pgEnter{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.pg-rise{animation:pgRise .5s cubic-bezier(.16,.84,.24,1) both;animation-delay:calc(var(--i,0)*45ms)}
@keyframes pgRise{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}
.pg-card{animation:pgRise .36s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*28ms)}
.pg-pop{animation:pgPop .14s ease-out both;transform-origin:top}
@keyframes pgPop{from{opacity:0;transform:translate3d(0,-6px,0) scale(.98)}to{opacity:1;transform:none}}
.pg-fade{animation:pgFade .3s ease both}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
.pg-skel{background:linear-gradient(100deg,var(--sk1) 30%,var(--sk2) 50%,var(--sk1) 70%);background-size:200% 100%;animation:pgShimmer 1.4s linear infinite}
@keyframes pgShimmer{from{background-position:100% 0}to{background-position:-100% 0}}
.pg-nosb{scrollbar-width:none}
.pg-nosb::-webkit-scrollbar{display:none}
.pg-sb{scrollbar-width:thin;scrollbar-color:var(--ln) transparent}
.pg-pcard{box-shadow:var(--sh);transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.pg-pcard img{transition:transform 1.1s var(--ease),opacity .3s ease}
@media (hover:hover){.pg-pcard:hover{transform:translate3d(0,-3px,0);box-shadow:var(--sh6)}.pg-pcard:hover img{transform:scale3d(1.04,1.04,1)}}
.pg-defer{content-visibility:auto;contain-intrinsic-size:auto 560px}
@media (prefers-reduced-motion:reduce){.pg-enter,.pg-rise,.pg-card,.pg-pop,.pg-fade,.pg-skel{animation:none}.pg-pcard,.pg-pcard img{transition:none}.pg-pcard:hover,.pg-pcard:hover img{transform:none}}
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

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]';
const CARD = 'rounded-[18px] border-2 border-[color:var(--bd)] bg-[color:var(--card)] text-[color:var(--tx)]';
const PANEL = 'rounded-[20px] border-[3px] border-[color:var(--bd)] bg-[color:var(--card)] text-[color:var(--tx)] [box-shadow:var(--sh)]';
const BTN = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[color:var(--bd)] bg-[color:var(--card)] px-4 py-2.5 text-sm font-bold text-[color:var(--tx)] [box-shadow:var(--sh3)] transition-[transform,box-shadow,background-color] duration-200 motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-px [@media(hover:hover)]:hover:bg-[color:var(--btn)] [@media(hover:hover)]:hover:text-[color:var(--btn-ink)] active:translate-y-0.5 active:[box-shadow:none] disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS}`;
const BTN_ON = '!bg-[color:var(--btn)] !text-[color:var(--btn-ink)]';
const FAB = `flex flex-none cursor-pointer items-center justify-center rounded-full border-2 border-[color:var(--bd)] bg-white/95 text-[#111111] [box-shadow:var(--sh2)] transition-[transform,background-color] duration-200 motion-reduce:transition-none [@media(hover:hover)]:hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS}`;
const CHIP = `inline-flex h-10 flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-transparent bg-[color:var(--soft)] px-3.5 text-sm font-semibold text-[color:var(--tx)] transition-[background-color,border-color] duration-200 motion-reduce:transition-none [@media(hover:hover)]:hover:border-[color:var(--bd)] ${FOCUS}`;
const CHIP_ON = '!border-[color:var(--bd)] !bg-[color:var(--btn)] !text-[color:var(--btn-ink)]';
const FIELD = `rounded-xl border-2 border-[color:var(--bd)] bg-[color:var(--card)] text-[color:var(--tx)] [box-shadow:var(--sh2)] focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--ring)]`;
const WRAP = 'mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8';
const MUTED = 'text-[color:var(--mu)]';
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const scrollBehavior = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const EXTRA = {
  en: {
    save: 'Save', saved: 'Saved', savedOnly: 'Saved only', inStockOnly: 'In stock only', inStock: 'In stock', moreFilters: 'More filters', sortDiscount: 'Biggest discount',
    originalPrice: 'Original price', discountedPrice: 'Price after discount', discountValue: 'Discount', off: 'OFF', topRated: 'Top rated',
    onlyLeft: 'Only {{count}} left in stock',
    buyAgainTitle: 'Buy it again', buyAgainSub: 'Items you have purchased before',
    loading: 'Loading',
  },
  ar: {
    save: 'حفظ', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', inStockOnly: 'المتوفر فقط', inStock: 'متوفر', moreFilters: 'فلاتر إضافية', sortDiscount: 'أكبر خصم',
    originalPrice: 'السعر الأصلي', discountedPrice: 'السعر بعد الخصم', discountValue: 'الخصم', off: 'خصم', topRated: 'الأعلى تقييمًا',
    onlyLeft: 'متبقي {{count}} فقط في المخزون',
    buyAgainTitle: 'اشترِ مرة أخرى', buyAgainSub: 'منتجات اشتريتها من قبل',
    loading: 'جارٍ التحميل',
  },
  fr: {
    save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrés uniquement', inStockOnly: 'En stock uniquement', inStock: 'En stock', moreFilters: 'Plus de filtres', sortDiscount: 'Plus grande remise',
    originalPrice: "Prix d'origine", discountedPrice: 'Prix après remise', discountValue: 'Remise', off: 'de remise', topRated: 'Les mieux notés',
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
const NUM_CACHE = {};
const getNumber = (language) => {
  const fmt = (NUM_CACHE[language] ||= new Intl.NumberFormat(LOCALES[language] || LOCALES.en, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
  return (n) => fmt.format(Number(n || 0));
};
const COMPACT_FORMAT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const round2 = (n) => Math.round(n * 100) / 100;

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
const EMPTY_LIST = [];
const GRID_COLS = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

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
    animate: { x: 0, transition: { duration: 0.24, ease: EASE } },
    exit: { x: off, transition: { duration: 0.16, ease: 'easeIn' } },
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

const Skel = ({ className = '' }) => <div aria-hidden="true" className={`pg-skel rounded-xl ${className}`} />;

const CardSkeleton = memo(() => (
  <div aria-hidden="true" className={`flex h-full flex-col p-2.5 [box-shadow:var(--sh)] ${CARD}`}>
    <Skel className="aspect-square w-full !rounded-[14px]" />
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-1.5 pb-1.5 pt-3">
      <Skel className="h-3.5 w-4/5 !rounded" />
      <Skel className="h-3.5 w-3/5 !rounded" />
      <Skel className="h-5 w-16 !rounded-full" />
      <Skel className="mt-2 h-6 w-1/2 !rounded" />
    </div>
  </div>
));

const GridSkeleton = memo(({ count, label }) => (
  <div className={`grid gap-4 ${GRID_COLS}`} role="status" aria-label={label} aria-busy="true">
    {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}
  </div>
));

const FilterSkeleton = memo(() => (
  <div aria-hidden="true" className="w-full space-y-7">
    {[0, 1, 2].map((i) => (
      <div key={i} className="space-y-3">
        <Skel className="h-5 w-28 !rounded" />
        <Skel className="h-4 w-full !rounded" />
        <Skel className="h-4 w-4/5 !rounded" />
      </div>
    ))}
  </div>
));

const SliderSkeleton = memo(() => (
  <div aria-hidden="true">
    <div className="mb-6 flex items-center justify-between gap-3">
      <Skel className="h-7 w-56 !rounded" />
      <div className="flex gap-2"><Skel className="h-10 w-10" /><Skel className="h-10 w-10" /></div>
    </div>
    <div className="flex gap-4 overflow-hidden pb-4">
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
  <div className="mb-5 flex items-end justify-between gap-4">
    <div className="min-w-0">
      <h2 className="min-w-0 text-xl font-bold leading-tight tracking-tight [text-wrap:balance] rtl:leading-[1.4] rtl:tracking-normal sm:text-2xl">{title}</h2>
      {subtitle && <p className={`mt-1.5 text-sm ${MUTED}`}>{subtitle}</p>}
    </div>
    {children && <div className="flex-shrink-0">{children}</div>}
  </div>
));

const NbDropdown = memo(({ value, onChange, options, ariaLabel, prefix, className = '', align = 'start' }) => {
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
        className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 px-3.5 text-start text-sm font-semibold outline-none ${FIELD} ${FOCUS}`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {prefix && <span className={`hidden flex-none sm:inline ${MUTED}`}>{prefix}:</span>}
          <span className="truncate">{current?.label}</span>
        </span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul ref={listRef} id={`${uid}-list`} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className={`pg-pop pg-sb absolute top-full z-30 mt-3 max-h-64 min-w-full overflow-y-auto overscroll-contain p-1 ${PANEL} ${align === 'end' ? 'end-0' : 'start-0'}`}>
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={selected}
                onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`flex min-h-10 cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${selected ? 'bg-[color:var(--btn)] font-bold text-[color:var(--btn-ink)]' : i === active ? 'bg-[color:var(--soft)]' : ''}`}>
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

const OptionRow = memo(({ label, count, selected, onClick }) => (
  <button type="button" role="checkbox" aria-checked={selected} onClick={onClick}
    className={`flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg py-1.5 text-start text-sm font-medium ${FOCUS}`}>
    <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 border-[color:var(--bd)] text-[color:var(--btn-ink)] transition-colors duration-200 motion-reduce:transition-none ${selected ? 'bg-[color:var(--btn)]' : 'bg-[color:var(--card)]'}`}>
      {selected && <FiCheck aria-hidden="true" className="h-3 w-3" strokeWidth={3} />}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className={`text-xs tabular-nums ${MUTED}`} dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ title, isOpen, onToggle, children }) => (
  <section className="mb-2">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className={`flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg py-3 text-start ${FOCUS}`}>
      <span className="min-w-0 flex-1 truncate text-base font-bold">{title}</span>
      <FiChevronDown aria-hidden="true" className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="pg-fade min-w-0 pb-3">{children}</div>}
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
    <nav aria-label={t('paginationLabel')} className="flex flex-wrap items-center justify-center gap-2.5">
      <button type="button" className={PAGE_BTN} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}><FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></button>
      {items.map((x) => (typeof x === 'number' ? (
        <button key={x} type="button" onClick={() => onChange(x)} aria-label={`${x}`} aria-current={x === page ? 'page' : undefined}
          className={`${PAGE_BTN} ${x === page ? BTN_ON : ''}`}>{x}</button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-bold">…</span>))}
      <button type="button" className={PAGE_BTN} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}><FiChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></button>
    </nav>
  );
});

const Crumbs = memo(({ name, nameLoading, t }) => (
  <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-sm font-medium ${MUTED}`}>
    <Link to="/" className={`rounded-md transition-colors duration-200 hover:text-[color:var(--acc)] ${FOCUS}`}>{t('home')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    {nameLoading
      ? <Skel className="h-4 w-24 !rounded" />
      : <span aria-current="page" className="max-w-[14rem] truncate font-semibold text-[color:var(--tx)]">{name}</span>}
  </nav>
));

const Price = memo(({ product, num, currency, t }) => {
  const d = product.saving > 0;
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5" dir="ltr">
      <span className="sr-only">{d ? `${t('discountedPrice')}: ` : ''}</span>
      <span className="text-xs font-semibold">{currency}</span>
      <span className={`text-xl font-bold leading-tight tabular-nums tracking-tight ${d ? '' : ''}`}>{num(product.finalPrice)}</span>
      {d && (
        <>
          <span className={`text-[11px] font-medium tabular-nums line-through ${MUTED}`}>
            <span className="sr-only">{t('originalPrice')}: </span>{num(product.price)}
          </span>
          <span className="text-xs font-bold tabular-nums text-[color:var(--pos)]">{product._pct}% {t('off')}</span>
        </>
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
      <div role="img" aria-label={alt} className="pg-fade absolute inset-0 flex items-center justify-center overflow-hidden [contain:layout_paint]">
        <IsoIllustration type={catKey} tone="emerald" darkMode={darkMode} onGreen={false} hoverOnly className="aspect-square h-[78%]" />
      </div>
    );
  }
  return (
    <>
      {!loaded && <Skel className="absolute inset-0 !rounded-none" />}
      <img
        ref={imgRef} src={src} alt={alt} width={CARD_IMG_W} height={CARD_IMG_H}
        loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'low'} referrerPolicy="no-referrer" draggable={false}
        onLoad={handleLoad} onError={handleError}
        className={`absolute inset-0 block h-full w-full object-contain p-4 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
});

const ProductCard = memo(({ product, darkMode, isSaved = false, priority = false, onSave, onAddToCart, onOpen, t, num, currency, catKey }) => {
  const [btn, setBtn] = useState('idle');
  const timer = useRef();
  const mounted = useRef(true);
  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= LOW_STOCK;
  const top = product._rating >= TOP_RATING && product._reviews >= TOP_REVIEWS;

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

  return (
    <article
      onClick={open} onKeyDown={handleKey} tabIndex={0} aria-label={product.name}
      className={`pg-pcard group relative flex h-full cursor-pointer flex-col p-2.5 ${CARD} ${FOCUS}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-[color:var(--img)] [contain:layout_paint]">
        <DeviceImage src={product._img} alt={product.name} catKey={catKey} darkMode={darkMode} priority={priority} />
        {top && (
          <span className="absolute start-0 top-0 z-10 rounded-ee-xl bg-[color:var(--btn)] px-2.5 py-1 text-[11px] font-bold leading-none text-[color:var(--btn-ink)]">{t('topRated')}</span>
        )}
        <button
          type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
          className={`${FAB} absolute end-2 top-2 z-10 h-9 w-9`}
        >
          <FiHeart aria-hidden="true" className={`h-4 w-4 ${isSaved ? 'text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button" onClick={handleCart} disabled={out || btn === 'adding'} aria-busy={btn === 'adding'} aria-label={t('addToCart')} title={t('addToCart')}
          className={`${FAB} absolute bottom-2 end-2 z-10 h-10 w-10 ${btn === 'added' ? '!bg-[color:var(--btn)]' : ''}`}
        >
          {btn === 'adding' ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
            : btn === 'added' ? <FiCheck aria-hidden="true" className="h-5 w-5" strokeWidth={3} />
              : <FiPlus aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 px-1.5 pb-1.5 pt-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">{product.name}</h3>

        {product._rating > 0 && (
          <p className="inline-flex w-fit items-center gap-1 rounded-full bg-[color:var(--soft)] px-2 py-0.5 text-xs font-semibold" dir="ltr">
            <RiStarFill aria-hidden="true" className="h-3 w-3 text-[color:var(--pos)]" />
            <span className="tabular-nums">{product._rating.toFixed(1)}</span>
            {product._reviews > 0 && <span className={`font-medium tabular-nums ${MUTED}`}>({COMPACT_FORMAT.format(product._reviews)})</span>}
          </p>
        )}

        <div className="mt-auto pt-1">
          <Price product={product} num={num} currency={currency} t={t} />
        </div>

        {out ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--sale)]">
            <FiAlertCircle aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />{t('outOfStock')}
          </p>
        ) : low ? (
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <span aria-hidden="true" className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-orange-500" />{t('onlyLeft', { count: product.stock })}
          </p>
        ) : null}
      </div>
    </article>
  );
});

const ProductSlider = memo(({ title, subtitle, products, darkMode, isRTL, saved, onSave, onAddToCart, onOpen, t, num, currency, catKey }) => {
  const { ref, edge, scroll } = useHScroll(products.length, isRTL);
  if (!products.length) return null;
  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;
  return (
    <div>
      <SectionTitle title={title} subtitle={subtitle}>
        <div className="flex gap-2">
          <button type="button" className={`${BTN} !min-h-10 !w-10 !px-0`} onClick={() => scroll('back')} disabled={!edge.l} aria-label={t('scrollBack')}><BackIcon aria-hidden="true" className="h-5 w-5" /></button>
          <button type="button" className={`${BTN} !min-h-10 !w-10 !px-0`} onClick={() => scroll('forward')} disabled={!edge.r} aria-label={t('scrollForward')}><ForwardIcon aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      </SectionTitle>
      <div ref={ref} className="pg-nosb -mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 pb-6 pt-2 motion-reduce:scroll-auto">
        {products.map((p) => (
          <div key={p.id} className="w-[210px] flex-shrink-0 snap-start sm:w-[250px]">
            <ProductCard product={p} darkMode={darkMode} isSaved={saved.has(p.id)} onSave={onSave} onAddToCart={onAddToCart} onOpen={onOpen} t={t} num={num} currency={currency} catKey={catKey} />
          </div>
        ))}
      </div>
    </div>
  );
});

const StateCard = memo(({ illustration, title, subtitle, darkMode, children }) => (
  <div className={`pg-fade px-4 py-14 text-center sm:py-20 ${PANEL}`}>
    <IsoIllustration type={illustration} tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
    <p className="mb-2 text-lg font-bold sm:text-2xl">{title}</p>
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
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2">
        <h3 className="flex min-w-0 items-center gap-2 text-lg font-bold">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{t('filters')}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className={`flex-shrink-0 cursor-pointer rounded-md text-xs font-bold text-[color:var(--acc)] transition-opacity hover:opacity-80 ${FOCUS}`}>{t('resetAll')}</button>}
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
  const num = useMemo(() => getNumber(language), [language]);
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

  const [saved, toggleSaved] = useSavedProducts();
  const [hasToken] = useState(() => !!readStorage('authToken'));
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRangeState] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  useEffect(() => { setCurrentPage(1); }, [deferred]);
  useEffect(() => { setCurrentPage((p) => Math.min(p, totalPages)); }, [totalPages]);

  const paginated = useMemo(() => filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filteredProducts, currentPage]);
  const startItem = filteredProducts.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredProducts.length);
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

  const railCount = CONDITIONS.length + 6;
  const { ref: railRef, edge: railEdge, scroll: railScroll } = useHScroll(railCount, isRTL);
  const RailIcon = isRTL ? FiChevronLeft : FiChevronRight;

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

          <div ref={gridRef} id="category-products" className="mt-6 flex scroll-mt-24 items-start gap-8 lg:gap-10">
            <aside aria-label={t('filters')} className="pg-rise pg-sb sticky top-28 hidden max-h-[calc(100vh-8rem)] w-64 flex-shrink-0 overflow-y-auto overscroll-contain pe-2 lg:block xl:w-72" style={STAGGER[1]}>
              {isLoading ? <FilterSkeleton /> : <FilterPanel {...filterPanelProps} />}
            </aside>

            <div className="min-w-0 flex-1">
              <div className="pg-rise mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3" style={STAGGER[1]}>
                <div className="min-w-0">
                  {nameLoading
                    ? <Skel className="h-8 w-56 !rounded" />
                    : <h1 className="pg-fade min-w-0 text-xl font-bold leading-tight tracking-tight [text-wrap:balance] rtl:leading-[1.4] rtl:tracking-normal sm:text-2xl">
                      {isLoading ? heading : <><b dir="ltr" className="tabular-nums">{filteredProducts.length}</b> {t('productsLabel')} <span className={`font-medium ${MUTED}`}>· {heading}</span></>}
                    </h1>}
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:flex-none">
                  <div className={`relative flex h-11 min-w-0 flex-1 items-center gap-2 px-3.5 sm:w-64 sm:flex-none ${FIELD}`}>
                    <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
                    <input type="search" autoComplete="off" value={searchTerm} maxLength={80} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search')} aria-label={t('searchAria')}
                      className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:opacity-60 sm:text-sm" />
                    {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label={t('clearSearch')} className={`cursor-pointer rounded-full ${FOCUS}`}><FiX aria-hidden="true" className="h-4 w-4" /></button>}
                  </div>
                  <NbDropdown ariaLabel={t('sortBy')} prefix={t('sortBy')} value={sortBy} onChange={setSortBy} options={sortOptions} align="end" className="w-44 sm:w-60" />
                </div>
              </div>

              <div className="pg-rise relative mb-6 flex items-center gap-3" style={STAGGER[2]}>
                <div ref={railRef} className="pg-nosb -mx-1 flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto px-1 py-2">
                  <button type="button" onClick={openSidebar} aria-haspopup="dialog" aria-expanded={isSidebarOpen} className={`${CHIP} ${CHIP_ON} lg:hidden`}>
                    <FiSliders aria-hidden="true" className="h-4 w-4" />{t('filters')}
                    {activeFiltersCount > 0 && <span dir="ltr" className="tabular-nums">({activeFiltersCount})</span>}
                  </button>
                  {CONDITIONS.map((c) => (
                    <button key={c} type="button" aria-pressed={conditions.includes(c)} onClick={() => toggleCondition(c)} className={`${CHIP} ${conditions.includes(c) ? CHIP_ON : ''}`}>{condLabel(c)}</button>
                  ))}
                  <button type="button" aria-pressed={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} className={`${CHIP} ${onSaleOnly ? CHIP_ON : ''}`}>{t('onSale')}</button>
                  <button type="button" aria-pressed={inStockOnly} onClick={() => setInStockOnly((v) => !v)} className={`${CHIP} ${inStockOnly ? CHIP_ON : ''}`}>{t('inStock')}</button>
                  <button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly((v) => !v)} className={`${CHIP} ${savedOnly ? CHIP_ON : ''}`}>{t('savedOnly')}</button>
                  {priceRange && (
                    <button type="button" onClick={() => setPriceRangeState(null)} className={`${CHIP} ${CHIP_ON}`}>
                      {currency} {priceRange[0].toLocaleString(numLocale)} – {priceRange[1].toLocaleString(numLocale)}<FiX aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {activeFiltersCount > 0 && (
                    <button type="button" onClick={clearFilters} className={`flex-none cursor-pointer whitespace-nowrap rounded-md px-2 text-sm font-bold text-[color:var(--acc)] transition-opacity hover:opacity-80 ${FOCUS}`}>{t('clearAll')}</button>
                  )}
                </div>
                {railEdge.r && (
                  <button type="button" onClick={() => railScroll('forward')} aria-label={t('scrollForward')} className={`${FAB} hidden h-10 w-10 sm:flex`}>
                    <RailIcon aria-hidden="true" className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div aria-busy={isStale} className={`transition-opacity duration-200 motion-reduce:transition-none ${isStale ? 'opacity-70' : 'opacity-100'}`}>
                {isLoading ? (
                  <GridSkeleton count={8} label={t('loading')} />
                ) : isError ? (
                  <StateCard illustration="shopsEmpty" title={t('loadErrorTitle')} subtitle={t('loadErrorText')} darkMode={darkMode}>
                    <button type="button" onClick={() => refetch()} className={`${BTN} ${BTN_ON}`}><FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{t('tryAgain')}</button>
                  </StateCard>
                ) : filteredProducts.length === 0 ? (
                  <StateCard illustration="shopEmpty" title={enriched.length ? t('noProducts') : t('nothingHere')} subtitle={enriched.length ? t('removeFilter') : t('checkBackSoon')} darkMode={darkMode}>
                    {enriched.length > 0 && <button type="button" onClick={clearFilters} className={`${BTN} ${BTN_ON}`}>{t('clearFilters')}</button>}
                  </StateCard>
                ) : (
                  <div className={`grid gap-4 sm:gap-5 ${GRID_COLS}`}>
                    {paginated.map((p, i) => (
                      <div key={p.id} className="pg-card min-w-0" style={STAGGER[i % 12]}>
                        <ProductCard product={p} darkMode={darkMode} isSaved={saved.has(p.id)} priority={i < PRIORITY_CARDS} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct} t={t} num={num} currency={currency} catKey={catKey} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 pt-10">
                  <Pagination page={currentPage} total={totalPages} onChange={goToPage} t={t} />
                  <p className={`text-xs font-medium ${MUTED}`}><span dir="ltr">{startItem}–{endItem}</span> / <span dir="ltr">{filteredProducts.length}</span> {t('productsLabel')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {deals.length > 0 && !isLoading && (
          <section aria-label={t('biggestDiscounts')} className="pg-defer py-10 sm:py-14">
            <div className={WRAP}>
              <Deferred fallback={<SliderSkeleton />}>
                <ProductSlider
                  title={t('biggestDiscounts')} subtitle={categoryName ? t('bestSavings', { name: categoryName }) : undefined}
                  products={deals} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct}
                  t={t} num={num} currency={currency} catKey={catKey}
                />
              </Deferred>
            </div>
          </section>
        )}

        {purchased.length > 0 && (
          <section aria-label={t('buyAgainTitle')} className="pg-defer py-10 sm:py-14">
            <div className={WRAP}>
              <Deferred fallback={<SliderSkeleton />}>
                <ProductSlider
                  title={t('buyAgainTitle')} subtitle={t('buyAgainSub')}
                  products={purchased} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct}
                  t={t} num={num} currency={currency} catKey={catKey}
                />
              </Deferred>
            </div>
          </section>
        )}
      </main>

      {showTop && (
        <div className="pg-fade fixed bottom-5 end-5 z-40">
          <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} className={`${BTN} ${BTN_ON} !min-h-0 h-12 w-12 !px-0`}><FiArrowUp aria-hidden="true" className="h-5 w-5" /></button>
        </div>
      )}

      <LazyMotion features={domAnimation}>
        <MotionConfig reducedMotion="user">
          <AnimatePresence>
            {isSidebarOpen && (
              <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t('filters')}>
                <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={closeSidebar} aria-hidden="true" />
                <m.div {...drawerMotion(isRTL)} style={GPU}
                  className="absolute inset-y-0 start-0 flex w-[22rem] min-w-0 max-w-[90vw] transform-gpu flex-col border-e-[3px] border-[color:var(--bd)] bg-[color:var(--bg)] text-[color:var(--tx)] md:w-96">
                  <div className="flex items-center justify-between px-4 pb-2 pt-4">
                    <h3 className="text-lg font-bold">{t('filters')}</h3>
                    <button type="button" onClick={closeSidebar} aria-label={t('closeFilters')} className={`${BTN} !min-h-10 !w-10 !px-0`}><FiX aria-hidden="true" className="h-5 w-5" /></button>
                  </div>
                  <div className="pg-sb min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                    {isLoading ? <FilterSkeleton /> : <FilterPanel {...filterPanelProps} />}
                  </div>
                  <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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