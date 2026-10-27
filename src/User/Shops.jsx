import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useId, memo, Suspense, lazy, useDeferredValue, useTransition,
} from 'react';
import { useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiMapPin, FiPhone, FiX, FiSliders, FiGrid, FiList, FiArrowRight, FiArrowUp, FiCheck,
  FiShield, FiTool, FiRefreshCw, FiShoppingBag, FiExternalLink, FiInfo, FiNavigation,
  FiMessageSquare, FiPackage, FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch,
} from 'react-icons/fi';
import { RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
import { LazyMotion, MotionConfig, domAnimation, m, AnimatePresence } from 'framer-motion';
import api from '../common/api/api';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import {
  roleStyle, getShopRole, serviceLabel, addressLine, directionsUrl,
} from '../common/utils/shopsutils';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import {
  LISTING_CSS, PAGE_SIZES, useLangFont, useBackToTop, useModalLock,
} from '../components/user/ListingKit';
import { IsoIllustration, isoRoleKey } from '../components/user/IsoIllustrations';

const Hero = lazy(() => import('../components/user/Hero'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, gcTime: 10 * 60 * 1000 } },
});

const MOBILE_QUERY = '(max-width: 1023.98px)';
const MOBILE_BATCH = 8;

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

const SHOPS_TRANSLATIONS = {
  en: enTranslations.shops,
  ar: arTranslations.shops || arTranslations.hero?.shops,
  fr: frTranslations.shops || frTranslations.hero?.shops,
};

const EXTRA = {
  en: {
    reviewOne: 'review', reviewMany: 'reviews', productOne: 'product', productMany: 'products',
    eyebrowSpecialties: 'Specialties', eyebrowShops: 'Directory', prevPage: 'Previous page', nextPage: 'Next page', pageN: 'Page {{n}}',
    noAddress: 'No address listed', loadingMore: 'Loading more shops', endOfList: 'You have seen all shops',
  },
  ar: {
    reviewOne: 'تقييم', reviewMany: 'تقييمات', productOne: 'منتج', productMany: 'منتجات',
    eyebrowSpecialties: 'التخصصات', eyebrowShops: 'الدليل', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية', pageN: 'صفحة {{n}}',
    noAddress: 'لا يوجد عنوان مسجل', loadingMore: 'جارٍ تحميل المزيد من المتاجر', endOfList: 'لقد شاهدت جميع المتاجر',
  },
  fr: {
    reviewOne: 'avis', reviewMany: 'avis', productOne: 'produit', productMany: 'produits',
    eyebrowSpecialties: 'Spécialités', eyebrowShops: 'Annuaire', prevPage: 'Page précédente', nextPage: 'Page suivante', pageN: 'Page {{n}}',
    noAddress: 'Aucune adresse indiquée', loadingMore: "Chargement d'autres boutiques", endOfList: 'Vous avez vu toutes les boutiques',
  },
};

const tr = (lang, key, params) => {
  const raw = SHOPS_TRANSLATIONS[lang]?.[key] ?? EXTRA[lang]?.[key] ?? SHOPS_TRANSLATIONS.en?.[key] ?? EXTRA.en[key] ?? key;
  return params ? raw.replace(/\{\{(\w+)\}\}/g, (_, k) => (params[k] !== undefined ? params[k] : '')) : raw;
};

const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const STAGGER = Array.from({ length: 8 }, (_, i) => ({ '--i': i }));

const useIsMobile = (query = MOBILE_QUERY) => {
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

const toCount = (...vals) => {
  for (const v of vals) {
    if (v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 0;
};

const shopFallback = (s) => ({
  reviews: toCount(s.reviewCount, s.reviewsCount, s.totalReviews, s.numReviews, s.ratingCount, s.reviews?.length),
  products: toCount(s.productCount, s.productsCount, s.totalProducts, s.numProducts, s.products?.length),
});

const countOf = (data) => {
  const total = Number(data?.totalElements);
  if (Number.isFinite(total) && total >= 0) return total;
  const list = data?.content ?? data;
  return Array.isArray(list) ? list.filter(Boolean).length : 0;
};

let sharedIO;
const seenCallbacks = new WeakMap();
const observeOnce = (el, cb) => {
  if (typeof IntersectionObserver === 'undefined') { cb(); return undefined; }
  sharedIO ||= new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const fn = seenCallbacks.get(e.target);
      sharedIO.unobserve(e.target);
      seenCallbacks.delete(e.target);
      fn?.();
    });
  }, { rootMargin: '200px' });
  seenCallbacks.set(el, cb);
  sharedIO.observe(el);
  return () => { sharedIO.unobserve(el); seenCallbacks.delete(el); };
};

const useSeen = () => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !ref.current) return undefined;
    return observeOnce(ref.current, () => setSeen(true));
  }, [seen]);
  return [ref, seen];
};

const STATS_STALE = 5 * 60 * 1000;

const useShopCounts = (shop, enabled) => {
  const id = shop.id;
  const on = enabled && id != null;
  const products = useQuery({
    queryKey: ['shopProductsCount', id],
    queryFn: async ({ signal }) => countOf((await api.get(`/api/products/shop/${encodeURIComponent(id)}`, { signal })).data),
    enabled: on,
    staleTime: STATS_STALE,
    retry: false,
    refetchOnMount: false,
  });
  const reviews = useQuery({
    queryKey: ['shopReviewsCount', id],
    queryFn: async ({ signal }) => countOf((await api.get(`/api/reviews/${encodeURIComponent(id)}/reviews`, { signal })).data),
    enabled: on,
    staleTime: STATS_STALE,
    retry: false,
    refetchOnMount: false,
  });
  const fb = useMemo(() => shopFallback(shop), [shop]);
  return {
    products: products.data ?? (products.isError ? fb.products : fb.products > 0 ? fb.products : null),
    reviews: reviews.data ?? (reviews.isError ? fb.reviews : fb.reviews > 0 ? fb.reviews : null),
  };
};

const REPAIR_CAPS = [
  { icon: FiTool, titleKey: 'capRepairTitle', textKey: 'capRepairText' },
  { icon: FiShield, titleKey: 'capCertifiedTitle', textKey: 'capCertifiedText' },
];
const SELL_CAPS = [
  { icon: FiShoppingBag, titleKey: 'capBuySellTitle', textKey: 'capBuySellText' },
  { icon: FiRefreshCw, titleKey: 'capTradeInTitle', textKey: 'capTradeInText' },
];
const BOTH_CAPS = [...REPAIR_CAPS, ...SELL_CAPS];
const capabilitiesFor = (role) => (role === 'REPAIRER' ? REPAIR_CAPS : role === 'SELLER' ? SELL_CAPS : BOTH_CAPS);

const ROLE_SECTIONS = [
  { role: 'REPAIRER', title: 'repairSectionTitle', sub: 'repairSectionSub' },
  { role: 'SELLER', title: 'sellSectionTitle', sub: 'sellSectionSub' },
  { role: 'BOTH', title: 'bothSectionTitle', sub: 'bothSectionSub' },
];

const RATING_STEPS = [4, 4.5, 4.8];
const VIEW_MODES = [['grid', FiGrid, 'gridView'], ['list', FiList, 'listView']];

const NB_CSS = `
.nb{--nb-bg:#eef9f3;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-dark .border-dotted,.nb-dark .nb-dot{border-color:#3f3f3f}
.nb-dark .nb-bg.nb-line{border-color:#3a3a3a}
.nb-bg{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-rule{display:block;width:100%;height:4px;margin-top:8px;background:var(--nb-accent)}
.nb-divider{display:block;height:8px;background:var(--nb-accent);border-block:2px solid var(--nb-line)}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-chip-n{background:var(--nb-gray);color:var(--nb-muted);border-style:dashed}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-arrow{display:inline-flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);cursor:pointer;transition:transform .15s ease}
.nb-arrow:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-lift:hover .nb-arrow{transform:translateX(3px)}
.nb[dir=rtl] .nb-lift:hover .nb-arrow{transform:translateX(-3px)}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt-active{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-media{background:var(--nb-gray)}
.nb-media-b{border:2px solid var(--nb-line)}
.nb-box{display:flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;border:2px solid var(--nb-line);background:var(--nb-card);color:var(--nb-on)}
.nb-box-on{background:var(--nb-btn)}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:2px dotted var(--nb-line);cursor:pointer;transition:transform .15s ease,background-color .15s ease}
.nb-dot:hover,.nb-dot-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-dot:hover{transform:translateY(-3px)}
.nb-dot:hover .nb-chip,.nb-dot-on .nb-chip{background:#ffffff;color:#04261a;border-color:#04261a}
.nb-dot:focus-visible{outline:3px solid var(--nb-accent);outline-offset:3px}
@keyframes nbSpin{to{transform:rotate(360deg)}}
.nb-spin{animation:nbSpin .7s linear infinite}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-arrow,.nb-dot{transition:none}.nb-spin{animation:none}}
`;
const STYLE_EL = <style>{`${UI3D_CSS}${LISTING_CSS}${NB_CSS}`}</style>;

const EASE = [0.16, 1, 0.3, 1];
const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};
const PANEL_MOTION = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: EASE } },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' } },
};
const DRAWER_MOTION = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { y: '100%', transition: { duration: 0.2, ease: 'easeIn' } },
};
const GPU = { willChange: 'transform, opacity' };

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
};

const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || '');
  const i = s.lastIndexOf(' ');
  const head = i > 0 ? s.slice(0, i + 1) : '';
  const tail = i > 0 ? s.slice(i + 1) : s;
  return (
    <>
      {head}
      <span className="relative inline-block">
        {tail}
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 10" preserveAspectRatio="none" className="nb-squig pointer-events-none absolute inset-x-0 -bottom-2 h-2.5 w-full">
          <path d="M1 6 C 20 2, 40 9, 60 5 S 90 3, 99 6" fill="none" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </>
  );
});

const SectionHead = memo(({ eyebrow, title, subtitle, count, action }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
    <div className="min-w-0 max-w-2xl">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
        <UnderlinedTitle text={title} />
        {count != null && <span dir="ltr" className="nb-chip ms-3 align-middle text-xs">{count}</span>}
      </h2>
      {subtitle && <p className="nb-muted mt-4 text-base sm:text-lg">{subtitle}</p>}
    </div>
    {action}
  </header>
));

const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = '', align = 'start' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[selectedIdx];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);

  useEffect(() => { if (isOpen) setActive(selectedIdx); }, [isOpen, selectedIdx]);
  useEffect(() => {
    if (isOpen) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, active]);

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
        ref={btnRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listId}
        aria-activedescendant={isOpen ? `${uid}-o${active}` : undefined}
        onClick={() => setIsOpen((o) => !o)} onKeyDown={onKeyDown}
        className="nb-field flex h-10 w-full items-center justify-between gap-2 ps-3 pe-3 text-start text-xs font-bold uppercase"
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul
          ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className={`nb-menu absolute top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1 ${align === 'end' ? 'end-0' : 'start-0'}`}
        >
          {options.map((o, i) => (
            <li
              key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
              className={`nb-opt whitespace-nowrap ${i === active ? 'nb-opt-active' : ''}`}
            >
              <span>{o.label}</span>
              {o.value === value && <FiCheck aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const SearchField = memo(({ value, onChange, placeholder, ariaLabel, clearLabel, pending }) => (
  <div className="nb-field relative flex h-10 min-w-0 flex-1 items-center gap-2 px-3">
    <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
    <input
      type="text" inputMode="search" autoComplete="off" maxLength={100}
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={ariaLabel}
      className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
    />
    {pending && <span aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />}
    {value && (
      <button type="button" onClick={() => onChange('')} aria-label={clearLabel} className="flex-shrink-0 focus-visible:outline focus-visible:outline-2">
        <FiX className="h-4 w-4" />
      </button>
    )}
  </div>
));

const FilterChip = memo(({ label, onRemove }) => (
  <button type="button" onClick={onRemove} className="nb-btn gap-1.5 px-2.5 py-1 text-xs">
    <span className="max-w-[10rem] truncate">{label}</span><FiX className="h-3 w-3 flex-shrink-0" />
  </button>
));

const InfoRow = ({ icon: Icon, children }) => (
  <p className="flex min-w-0 items-start justify-start gap-1.5 text-xs leading-snug">
    <Icon aria-hidden="true" className="nb-ic mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
    <span className="line-clamp-2 min-w-0 break-words">{children}</span>
  </p>
);

const NoAddressBadge = memo(({ t }) => (
  <span className="nb-chip nb-chip-n w-fit max-w-full">
    <span className="truncate">{t('noAddress')}</span>
  </span>
));

const DirectionsBtn = ({ shop, t, className = '', dense = false }) => (
  <a
    href={directionsUrl(shop, null)} target="_blank" rel="noopener noreferrer" aria-label={t('getDirections')} title={t('getDirections')}
    onClick={(e) => e.stopPropagation()}
    className={`nb-btn nb-btn-a min-w-0 px-3 text-xs ${className}`}
  >
    <FiNavigation className="h-3.5 w-3.5 flex-shrink-0" /> <span className={dense ? 'hidden truncate sm:inline lg:hidden' : 'truncate'}>{t('getDirections')}</span>
  </a>
);

const ShopStats = memo(({ shop, t, className = '' }) => {
  const [ref, seen] = useSeen();
  const { reviews, products } = useShopCounts(shop, seen);
  const plus = (n) => (n == null ? '+–' : `+${n}`);
  return (
    <div ref={ref} className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold ${className}`}>
      <span className="inline-flex min-w-0 items-center gap-1">
        <FiMessageSquare className="nb-ic h-3 w-3 flex-shrink-0" />
        <span dir="ltr" className="tabular-nums">{plus(reviews)}</span> <span className="truncate">{reviews === 1 ? t('reviewOne') : t('reviewMany')}</span>
      </span>
      <span className="inline-flex min-w-0 items-center gap-1">
        <FiPackage className="nb-ic h-3 w-3 flex-shrink-0" />
        <span dir="ltr" className="tabular-nums">{plus(products)}</span> <span className="truncate">{products === 1 ? t('productOne') : t('productMany')}</span>
      </span>
    </div>
  );
});

const ShopCard = memo(({ shop, darkMode, index = 0, layout = 'grid', variant = 'grid', dense = false, onDetails, onOpen, t, className = '' }) => {
  const role = getShopRole(shop);
  const rs = roleStyle(role);
  const address = addressLine(shop);
  const isList = layout === 'list';
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const snippet = clean(shop.description, 130) || t('noDescription');
  const open = useCallback(() => onOpen(shop.id), [onOpen, shop.id]);
  const showDetails = useCallback((e) => { e.stopPropagation(); onDetails?.(shop); }, [onDetails, shop]);
  const visit = useCallback((e) => { e.stopPropagation(); open(); }, [open]);

  const media = (
    <div className={`nb-media relative overflow-hidden ${
      isList ? 'h-28 flex-shrink-0 border-b-2 nb-line sm:h-auto sm:w-48 sm:border-b-0 sm:border-e-2' : `h-28 sm:h-32 ${variant === 'grid' ? 'nb-media-b' : ''}`}`}>
      <span className="nb-chip nb-chip-a absolute start-2 top-2 z-10 max-w-[85%]">
        <rs.icon className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{serviceLabel(role, t)}</span>
      </span>
      {hasRating && (
        <span className="nb-chip absolute bottom-2 end-2 z-10">
          <RiStarFill className="h-3 w-3 text-amber-500" /> <span dir="ltr">{shop.rating.toFixed(1)}</span>
        </span>
      )}
      <IsoIllustration
        type={isoRoleKey(role)} tone="emerald" darkMode={darkMode} onGreen={false}
        className="absolute inset-x-0 bottom-0 mx-auto aspect-square h-[88%] transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );

  const head = (
    <div className="min-w-0">
      <h3 className={`line-clamp-2 text-[13px] font-extrabold uppercase leading-snug sm:text-sm ${isList ? '' : 'min-h-[2.4rem]'}`}>
        {shop.name || t('unnamedShop')}
        {shop.verified && <RiVerifiedBadgeLine className="ms-1 inline h-4 w-4 align-text-bottom text-sky-500" title={t('verified')} aria-label={t('verified')} />}
      </h3>
      <span className="nb-rule" aria-hidden="true" />
      <p className="nb-muted mt-2 truncate text-[10px] font-bold uppercase tracking-wide">{shop.shopType || t('electronics')}</p>
    </div>
  );

  const text = <p className={`line-clamp-2 text-xs leading-5 opacity-90 ${isList ? '' : 'min-h-[2.5rem]'}`}>{snippet}</p>;

  const details = (
    <div className="flex min-w-0 flex-col items-start gap-1.5">
      <ShopStats shop={shop} t={t} />
      <InfoRow icon={FiMapPin}>{address || <NoAddressBadge t={t} />}</InfoRow>
      {shop.phone && <InfoRow icon={FiPhone}><span dir="ltr">{shop.phone}</span></InfoRow>}
    </div>
  );

  const footer = (
    <div className={`mt-auto flex items-center gap-2 ${variant === 'latest' && !isList ? 'border-t-2 nb-line pt-3' : 'pt-1'}`}>
      <DirectionsBtn shop={shop} t={t} dense={dense} className="h-9 flex-1" />
      <button type="button" onClick={showDetails} aria-label={t('details')} title={t('details')} className="nb-btn h-9 w-9 flex-shrink-0">
        <FiInfo className="h-4 w-4" />
      </button>
      <button type="button" onClick={visit} aria-label={t('visitShop')} title={t('visitShop')} className="nb-arrow">
        <FiArrowRight className="nb-flip h-4 w-4" />
      </button>
    </div>
  );

  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={shop.name || t('unnamedShop')}
      style={STAGGER[index % 8]}
      className={`anim-fade-up nb-card nb-lift group relative flex h-full cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nb-accent)] ${
        isList ? 'flex-col sm:flex-row' : 'flex-col'} ${className}`}
    >
      {isList && media}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        {head}
        {isList ? text : variant === 'latest' ? <>{media}{text}</> : <>{text}{media}</>}
        {details}
        {footer}
      </div>
    </article>
  );
});

const ShopDetailsModal = memo(({ shop, darkMode, onClose, onOpen, t }) => {
  const role = getShopRole(shop);
  const caps = capabilitiesFor(role);
  const address = addressLine(shop);
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;

  useModalLock(true, onClose);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name || t('unnamedShop')}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <m.div
        {...PANEL_MOTION} style={GPU}
        className="nb-card relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain !transition-none sm:max-w-lg"
      >
        <div className="nb-gray nb-line relative flex items-center gap-3 border-b-2 p-4 pe-14 sm:gap-4 sm:p-5">
          <IsoIllustration type={isoRoleKey(role)} tone="emerald" darkMode={darkMode} onGreen={false} className="h-24 w-24 flex-shrink-0 sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-base font-extrabold uppercase sm:text-lg">{shop.name || t('unnamedShop')}</h2>
            <span className="nb-rule" aria-hidden="true" />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="nb-chip nb-chip-a">{serviceLabel(role, t)}</span>
              {shop.verified && (
                <span className="nb-chip"><RiVerifiedBadgeLine className="h-3 w-3 text-sky-500" /> {t('verified')}</span>
              )}
              {hasRating && (
                <span className="nb-chip"><RiStarFill className="h-3 w-3 text-amber-500" /> <span dir="ltr">{shop.rating.toFixed(1)}</span></span>
              )}
            </div>
            <ShopStats shop={shop} t={t} className="mt-2" />
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="nb-btn absolute end-3 top-3 h-8 w-8">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <section>
            <h3 className="mb-2 text-xs font-extrabold uppercase"><span className="nb-ul">{t('about')}</span></h3>
            <p className="text-sm leading-relaxed opacity-90">{shop.description || t('noDescription')}</p>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-extrabold uppercase"><span className="nb-ul">{t('whatShopCanDo')}</span></h3>
            <ul className="grid gap-3">
              {caps.map(({ icon: Icon, titleKey, textKey }) => (
                <li key={titleKey} className="flex items-start gap-3">
                  <span className="nb-chip nb-chip-a !p-1.5"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">{t(titleKey)}</p>
                    <p className="nb-muted text-xs">{t(textKey)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="nb-gray nb-line grid justify-items-start gap-2 border-2 border-dotted p-3.5">
            {shop.shopType && <InfoRow icon={FiShoppingBag}>{shop.shopType}</InfoRow>}
            <InfoRow icon={FiMapPin}>{address || <NoAddressBadge t={t} />}</InfoRow>
            {shop.phone && <InfoRow icon={FiPhone}><span dir="ltr">{shop.phone}</span></InfoRow>}
          </section>

          <div className="grid grid-cols-2 gap-3">
            <DirectionsBtn shop={shop} t={t} className="col-span-2 py-3" />
            <button type="button" onClick={onClose} className="nb-btn py-2.5 text-sm uppercase">{t('close')}</button>
            <button type="button" onClick={() => onOpen(shop.id)} className="nb-btn nb-btn-a py-2.5 text-sm uppercase"><FiExternalLink className="h-4 w-4" /> {t('visitShop')}</button>
          </div>
        </div>
      </m.div>
    </div>
  );
});

const SpecialtyGrid = memo(({ shopTypes, countsByType, selected, onToggle, darkMode, title, subtitle, t }) => {
  const top = useMemo(() => [...shopTypes].sort((a, b) => (countsByType[b] || 0) - (countsByType[a] || 0)).slice(0, 6), [shopTypes, countsByType]);
  if (!top.length) return null;
  return (
    <section aria-label={title} className="lk-cv nb-bg py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow={t('eyebrowSpecialties')} title={title} subtitle={subtitle} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {top.map((type) => {
            const active = selected.includes(type);
            const count = countsByType[type] || 0;
            return (
              <button key={type} type="button" onClick={() => onToggle(type)} aria-pressed={active}
                className={`nb-dot group relative flex flex-col items-center gap-2 p-3 text-center sm:gap-2.5 sm:p-4 ${active ? 'nb-dot-on' : ''}`}>
                <IsoIllustration
                  type="shop_store" darkMode={darkMode} onGreen={false}
                  className="h-16 w-16 transition-transform duration-200 group-hover:scale-110 sm:h-20 sm:w-20"
                />
                <span className="line-clamp-1 w-full text-sm font-extrabold uppercase">{type}</span>
                <span className="nb-chip"><span dir="ltr">{count}</span> {count === 1 ? t('shopSingular') : t('shopPlural')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

const FavoritesSection = memo(({ shops, darkMode, t, onDetails, onOpen }) => (
  <section aria-label={t('customerFavorites')} className="nb-gray nb-line lk-cv border-t-2 py-10 sm:py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHead eyebrow={t('topRated')} title={t('customerFavorites')} subtitle={t('topRatedSubtitle')} />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {shops.map((s, i) => (
          <ShopCard key={s.id} shop={s} darkMode={darkMode} index={i} variant="latest" dense onDetails={onDetails} onOpen={onOpen} t={t} />
        ))}
      </div>
    </div>
  </section>
));

const RoleSections = memo(({ shops, darkMode, t, onDetails, onOpen, onViewAll }) => {
  const groups = useMemo(() => ROLE_SECTIONS.map((sec) => {
    const list = shops.filter((s) => getShopRole(s) === sec.role);
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return { ...sec, list, top: list.slice(0, 4) };
  }).filter((g) => g.list.length), [shops]);

  if (!groups.length) return null;
  return (
    <>
      {groups.map(({ role, title, sub, list, top }, gi) => (
        <section key={role} aria-label={t(title)} className={`lk-cv nb-line border-t-2 py-10 sm:py-16 ${gi % 2 === 0 ? 'nb-bg' : 'nb-gray'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHead
              eyebrow={serviceLabel(role, t)} title={t(title)} count={list.length} subtitle={t(sub)}
              action={(
                <button type="button" onClick={() => onViewAll(role)} className="nb-btn nb-btn-a px-4 py-2 text-xs uppercase sm:text-sm">
                  {t('viewAll')} <FiArrowRight className="nb-flip h-4 w-4" />
                </button>
              )}
            />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {top.map((s, i) => (
                <ShopCard key={s.id} shop={s} darkMode={darkMode} index={i} dense onDetails={onDetails} onOpen={onOpen} t={t} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
});

const OptionRow = memo(({ type, label, count, selected, onClick }) => (
  <button
    type="button" role={type === 'check' ? 'checkbox' : 'radio'} aria-checked={selected} onClick={onClick}
    className="flex w-full items-center gap-2.5 py-1.5 text-start text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--nb-accent)]"
  >
    <span className={`nb-box ${type === 'radio' ? 'rounded-full' : ''} ${selected ? 'nb-box-on' : ''}`}>
      {selected && (type === 'check' ? <FiCheck className="h-3 w-3" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-[color:var(--nb-on)]" />)}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className="nb-muted text-xs tabular-nums" dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ title, isOpen, onToggle, children }) => (
  <section className="border-t-2 nb-line">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center gap-2.5 py-3 text-start">
      <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold uppercase"><span className="nb-ul">{title}</span></span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="min-w-0 pb-4">{children}</div>}
  </section>
));

const Pill = memo(({ label, active, onClick }) => (
  <button type="button" onClick={onClick} aria-pressed={active} className={`nb-btn px-2.5 py-1 text-[11px] ${active ? 'nb-btn-on' : ''}`}>
    {label}
  </button>
));

const STAR = <RiStarFill className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />;

const FilterPanel = memo((p) => {
  const { t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    open, setOpen, clearFilters, activeFiltersCount } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className="nb-card w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold uppercase">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="nb-ul truncate">{t('filters')}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className="flex-shrink-0 text-xs font-bold underline underline-offset-4">{t('resetAll')}</button>}
      </div>

      <FilterBlock title={t('serviceType')} isOpen={open.role} onToggle={() => toggle('role')}>
        <div className="min-w-0 break-words" role="radiogroup" aria-label={t('serviceType')}>
          <OptionRow type="radio" label={t('allShops')} count={roleCounts.ALL} selected={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')} />
          <OptionRow type="radio" label={t('repairServices')} count={roleCounts.REPAIRER} selected={roleFilter === 'REPAIRER'} onClick={() => setRoleFilter('REPAIRER')} />
          <OptionRow type="radio" label={t('sellTradeIn')} count={roleCounts.SELLER} selected={roleFilter === 'SELLER'} onClick={() => setRoleFilter('SELLER')} />
        </div>
      </FilterBlock>

      <FilterBlock title={t('shopType')} isOpen={open.type} onToggle={() => toggle('type')}>
        {shopTypes.length === 0
          ? <p className="nb-muted text-sm">{t('noTypes')}</p>
          : <div className="max-h-44 min-w-0 overflow-y-auto overscroll-contain break-words pe-1 sm:max-h-52">
              {shopTypes.map((ty) => <OptionRow key={ty} type="check" label={ty} count={countsByType[ty] || 0} selected={selectedShopTypes.includes(ty)} onClick={() => toggleShopType(ty)} />)}
            </div>}
      </FilterBlock>

      {cities.length > 0 && (
        <FilterBlock title={t('city')} isOpen={open.city} onToggle={() => toggle('city')}>
          <div className="flex max-h-40 min-w-0 flex-wrap gap-2 overflow-y-auto overscroll-contain p-1">
            {cities.map((c) => <Pill key={c} label={c} active={selectedCities.includes(c)} onClick={() => toggleCity(c)} />)}
          </div>
        </FilterBlock>
      )}

      <FilterBlock title={t('minimumRating')} isOpen={open.rating} onToggle={() => toggle('rating')}>
        <div className="min-w-0 break-words" role="radiogroup" aria-label={t('minimumRating')}>
          <OptionRow type="radio" label={t('anyRating')} selected={minRating === 0} onClick={() => setMinRating(0)} />
          {RATING_STEPS.map((v) => (
            <OptionRow key={v} type="radio" label={<span className="inline-flex items-center gap-1.5">{STAR}<span dir="ltr">{v}+</span> {t('stars')}</span>} selected={minRating === v} onClick={() => setMinRating(v)} />
          ))}
        </div>
        <div className="mt-1">
          <OptionRow type="check" label={t('verifiedOnly')} selected={showVerifiedOnly} onClick={() => setShowVerifiedOnly((v) => !v)} />
        </div>
      </FilterBlock>
    </div>
  );
});

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

const PAGE_BTN = 'inline-flex h-10 min-w-[2.5rem] items-center justify-center border-2 border-[color:var(--nb-line)] bg-[color:var(--nb-card)] px-2 text-sm font-bold tabular-nums text-[color:var(--nb-ink)] shadow-[3px_3px_0_var(--nb-shadow)] transition duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--nb-shadow)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nb-accent)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_var(--nb-shadow)] motion-reduce:transition-none';
const PAGE_BTN_ON = '!bg-[color:var(--nb-btn)] !text-[color:var(--nb-on)]';

const Pagination = memo(({ page, total, onChange, t }) => {
  const items = useMemo(() => pageWindow(page, total), [page, total]);
  if (total <= 1) return null;
  return (
    <nav aria-label={t('pagination')}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button type="button" className={PAGE_BTN} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
            <FiChevronLeft aria-hidden="true" className="nb-flip h-4 w-4" />
          </button>
        </li>
        {items.map((x) => (typeof x === 'number' ? (
          <li key={x}>
            <button type="button" onClick={() => onChange(x)} aria-label={t('pageN', { n: x })} aria-current={x === page ? 'page' : undefined}
              className={`${PAGE_BTN} ${x === page ? PAGE_BTN_ON : ''}`}>{x}</button>
          </li>
        ) : <li key={x} aria-hidden="true" className="px-1 font-extrabold">…</li>))}
        <li>
          <button type="button" className={PAGE_BTN} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
            <FiChevronRight aria-hidden="true" className="nb-flip h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
});

const InfiniteSentinel = memo(({ hasMore, shown, total, onMore, t }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return undefined;
    if (typeof IntersectionObserver === 'undefined') { onMore(); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onMore(); }, { rootMargin: '700px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown, onMore]);
  return (
    <div ref={ref} className="flex min-h-[3.5rem] items-center justify-center pt-8" role="status" aria-live="polite">
      {hasMore ? (
        <span className="nb-chip !px-3 !py-1.5">
          <span aria-hidden="true" className="nb-spin h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />
          {t('loadingMore')}
        </span>
      ) : total > MOBILE_BATCH ? (
        <span className="nb-chip !px-3 !py-1.5"><FiCheck aria-hidden="true" className="h-3 w-3" />{t('endOfList')}</span>
      ) : null}
    </div>
  );
});

const ShopsContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k, params) => tr(language, k, params), [language]);
  const dir = languageDirection(language);
  const font = useLangFont(language);
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();
  useScrollTopOnEnter();

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const searchPending = searchTerm !== deferredSearch;
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(MOBILE_BATCH);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [viewMode, setViewMode] = useState('grid');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedShopTypes, setSelectedShopTypes] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [detailsShop, setDetailsShop] = useState(null);
  const [open, setOpen] = useState({ role: true, type: true, city: true, rating: true });
  const gridRef = useRef(null);
  const showTop = useBackToTop();
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const drawerOpen = isMobile && isSidebarOpen;
  useModalLock(drawerOpen, closeSidebar);
  useEffect(() => { if (!isMobile) setIsSidebarOpen(false); }, [isMobile]);

  useEffect(() => { ensureNbFont(); }, []);
  useEffect(() => { document.title = t('pageTitle'); }, [t]);

  const { data: shops = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['shopsList'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/shops/all', { signal });
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list.filter(Boolean) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { shopTypes, cities, countsByType, roleCounts, topRated, searchIndex } = useMemo(() => {
    const types = new Set(), citySet = new Set(), counts = {}, index = new Map();
    let rep = 0, sell = 0;
    for (const s of shops) {
      if (s.shopType) { types.add(s.shopType); counts[s.shopType] = (counts[s.shopType] || 0) + 1; }
      if (s.shopAddress?.city) citySet.add(s.shopAddress.city);
      const r = getShopRole(s);
      if (r !== 'SELLER') rep++;
      if (r !== 'REPAIRER') sell++;
      index.set(s.id, `${s.name || ''} ${s.shopType || ''} ${s.shopAddress?.city || ''} ${s.shopAddress?.street || ''} ${s.description || ''} ${s.phone || ''}`.toLowerCase());
    }
    return {
      shopTypes: [...types].sort(),
      cities: [...citySet].sort(),
      countsByType: counts,
      roleCounts: { ALL: shops.length, REPAIRER: rep, SELLER: sell },
      topRated: shops.filter((s) => s.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 4),
      searchIndex: index,
    };
  }, [shops]);

  const filteredShops = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    const list = shops.filter((s) => {
      const role = getShopRole(s);
      if (roleFilter !== 'ALL' && role !== roleFilter && role !== 'BOTH') return false;
      if (selectedShopTypes.length && !selectedShopTypes.includes(s.shopType)) return false;
      if (selectedCities.length && !selectedCities.includes(s.shopAddress?.city)) return false;
      if ((s.rating || 0) < minRating) return false;
      if (showVerifiedOnly && !s.verified) return false;
      if (term && !searchIndex.get(s.id)?.includes(term)) return false;
      return true;
    });
    if (sortBy === 'ratingHighToLow') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'nameAZ') list.sort((a, b) => (a.name || '').localeCompare(b.name || '', language));
    return list;
  }, [shops, searchIndex, deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, sortBy, language]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / pageSize));
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(MOBILE_BATCH);
  }, [pageSize, deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, sortBy]);
  const page = Math.min(currentPage, totalPages);

  const pageOffset = (page - 1) * pageSize;
  const paginated = useMemo(() => filteredShops.slice(pageOffset, pageOffset + pageSize), [filteredShops, pageOffset, pageSize]);
  const infinite = useMemo(() => filteredShops.slice(0, visibleCount), [filteredShops, visibleCount]);
  const listShops = isMobile ? infinite : paginated;
  const listOffset = isMobile ? 0 : pageOffset;
  const hasMore = isMobile && visibleCount < filteredShops.length;
  const startItem = filteredShops.length ? listOffset + 1 : 0;
  const endItem = isMobile ? infinite.length : Math.min(pageOffset + pageSize, filteredShops.length);

  const loadMore = useCallback(() => startTransition(() => setVisibleCount((c) => c + MOBILE_BATCH)), []);
  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  const goToPage = useCallback((pg) => { setCurrentPage(pg); scrollToGrid(); }, [scrollToGrid]);
  const openShop = useCallback((id) => navigate(`/shops/${encodeURIComponent(id)}`), [navigate]);
  const toggleShopType = useCallback((ty) => setSelectedShopTypes((p) => (p.includes(ty) ? p.filter((x) => x !== ty) : [...p, ty])), []);
  const toggleCity = useCallback((c) => setSelectedCities((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const pickSpecialty = useCallback((ty) => { toggleShopType(ty); scrollToGrid(); }, [toggleShopType, scrollToGrid]);
  const clearFilters = useCallback(() => {
    setSearchTerm(''); setRoleFilter('ALL'); setSelectedShopTypes([]); setSelectedCities([]); setMinRating(0); setShowVerifiedOnly(false); setSortBy('relevance'); setCurrentPage(1); setVisibleCount(MOBILE_BATCH);
  }, []);
  const openDetails = useCallback((shop) => setDetailsShop(shop), []);
  const closeDetails = useCallback(() => setDetailsShop(null), []);
  const openFromModal = useCallback((id) => { setDetailsShop(null); openShop(id); }, [openShop]);
  const viewAllRole = useCallback((role) => {
    setRoleFilter(role === 'BOTH' ? 'ALL' : role);
    setSelectedShopTypes([]); setSelectedCities([]);
    scrollToGrid();
  }, [scrollToGrid]);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (roleFilter !== 'ALL' ? 1 : 0) + selectedShopTypes.length + selectedCities.length + (minRating > 0 ? 1 : 0) + (showVerifiedOnly ? 1 : 0);

  const heroButtons = useMemo(() => [
    { label: t('heroFind'), onClick: scrollToGrid, primary: true },
    { label: t('heroBrowse'), to: '/devices', primary: false },
  ], [scrollToGrid, t]);

  const sortOptions = useMemo(() => [
    { value: 'relevance', label: t('sortRelevance') },
    { value: 'ratingHighToLow', label: t('sortRating') },
    { value: 'nameAZ', label: t('sortName') },
  ], [t]);

  const rowOptions = useMemo(() => PAGE_SIZES.map((n) => ({ value: n, label: `${n} ${t('perPage')}` })), [t]);

  const filterPanelProps = useMemo(() => ({
    t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    open, setOpen, clearFilters, activeFiltersCount,
  }), [t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, roleCounts, minRating, showVerifiedOnly, open, clearFilters, activeFiltersCount]);

  const layout = isMobile ? 'grid' : viewMode;
  const gridCols = layout === 'grid' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1';

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div
          dir={dir} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
          className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-hidden ${isAr ? font.className : ''}`}
        >
          {STYLE_EL}
          <Defs3D />

          <Suspense fallback={<div className="nb-gray h-[360px] w-full animate-pulse sm:h-[480px]" />}>
            <Hero
              variant="shops"
              darkMode={darkMode}
              badge={t('heroBadge')}
              headingLine1={t('heroLine1')}
              headingAccent={t('heroAccent')}
              headingLine2={t('heroLine2')}
              description={t('heroDescription')}
              buttons={heroButtons}
            />
          </Suspense>

          {!isLoading && (
            <SpecialtyGrid shopTypes={shopTypes} countsByType={countsByType} selected={selectedShopTypes} onToggle={pickSpecialty}
              darkMode={darkMode} title={t('findExpert')} subtitle={t('browseSpecialty')} t={t} />
          )}

          {!isLoading && topRated.length > 0 && (
            <FavoritesSection shops={topRated} darkMode={darkMode} t={t} onDetails={openDetails} onOpen={openShop} />
          )}

          {!isLoading && !isError && (
            <RoleSections shops={shops} darkMode={darkMode} t={t} onDetails={openDetails} onOpen={openShop} onViewAll={viewAllRole} />
          )}

          <section aria-label={t('allShopsTitle')} className="nb-bg">
            <span className="nb-divider" aria-hidden="true" />
            <div id="shop-results" ref={gridRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
              <div className="flex items-start gap-5 lg:gap-8">
                {!isMobile && (
                  <aside className="sticky top-20 max-h-[calc(100vh-5rem)] w-[17rem] min-w-0 flex-shrink-0 self-start overflow-y-auto overscroll-contain pb-2 pe-2 xl:w-[19rem]">
                    <FilterPanel {...filterPanelProps} />
                  </aside>
                )}

                <div className="w-full min-w-0 flex-1">
                  <SectionHead eyebrow={t('eyebrowShops')} title={t('allShopsTitle')} subtitle={t('allShopsSubtitle')} />

                  <div className="nb-card mb-6 flex flex-col gap-3 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm opacity-80" aria-live="polite">
                        <b dir="ltr">{startItem}–{endItem}</b> / <b dir="ltr">{filteredShops.length}</b> {t('shopsFound')}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {!isMobile && (
                          <>
                            <NbDropdown ariaLabel={t('rowsPerPage')} value={pageSize} onChange={setPageSize} options={rowOptions} align="end" className="w-36 flex-shrink-0" />
                            {VIEW_MODES.map(([mode, Icon, labelKey]) => (
                              <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-label={t(labelKey)} title={t(labelKey)} aria-pressed={viewMode === mode}
                                className={`nb-btn h-10 w-10 ${viewMode === mode ? 'nb-btn-on' : ''}`}>
                                <Icon className="h-4 w-4" />
                              </button>
                            ))}
                          </>
                        )}
                        {isMobile && (
                          <button type="button" onClick={() => setIsSidebarOpen(true)} className="nb-btn nb-btn-a h-10 px-3 text-xs uppercase">
                            <FiSliders className="h-3.5 w-3.5" /> {t('filters')}
                            {activeFiltersCount > 0 && <span className="flex h-4 min-w-[1rem] items-center justify-center bg-white px-1 text-[10px] font-bold text-[#04261a]">{activeFiltersCount}</span>}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <SearchField value={searchTerm} onChange={setSearchTerm} placeholder={t('search')} ariaLabel={t('searchAria')} clearLabel={t('clearSearch')} pending={searchPending} />
                      <NbDropdown ariaLabel={t('sortBy')} value={sortBy} onChange={setSortBy} options={sortOptions} align="end" className="w-full sm:w-52" />
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                      {roleFilter !== 'ALL' && <FilterChip label={serviceLabel(roleFilter, t)} onRemove={() => setRoleFilter('ALL')} />}
                      {selectedShopTypes.map((ty) => <FilterChip key={ty} label={ty} onRemove={() => toggleShopType(ty)} />)}
                      {selectedCities.map((c) => <FilterChip key={c} label={c} onRemove={() => toggleCity(c)} />)}
                      {minRating > 0 && <FilterChip label={`${minRating}+ ${t('stars')}`} onRemove={() => setMinRating(0)} />}
                      {showVerifiedOnly && <FilterChip label={t('verified')} onRemove={() => setShowVerifiedOnly(false)} />}
                      {searchTerm && <FilterChip label={`“${searchTerm.slice(0, 20)}”`} onRemove={() => setSearchTerm('')} />}
                      <button type="button" onClick={clearFilters} className="text-xs font-bold underline underline-offset-4">{t('clearAll')}</button>
                    </div>
                  )}

                  {isLoading ? (
                    <div className={`grid gap-4 sm:gap-6 ${gridCols}`} role="status" aria-label={t('loading')}>
                      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="nb-gray nb-line h-[360px] animate-pulse border-2 motion-reduce:animate-none" />)}
                    </div>
                  ) : isError ? (
                    <div className="nb-card px-4 py-14 text-center sm:py-20">
                      <IsoIllustration type="shopsEmpty" tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32" />
                      <p className="mb-2 text-lg font-extrabold uppercase sm:text-xl">{t('loadErrorTitle')}</p>
                      <p className="mb-6 text-sm opacity-80">{t('loadErrorText')}</p>
                      <button type="button" onClick={() => refetch()} className="nb-btn nb-btn-a px-6 py-3 text-sm uppercase"><FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> {t('tryAgain')}</button>
                    </div>
                  ) : filteredShops.length === 0 ? (
                    <div className="nb-card px-4 py-14 text-center sm:py-24">
                      <IsoIllustration type="shopsEmpty" tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
                      <p className="mb-2 text-lg font-extrabold uppercase sm:text-2xl">{shops.length ? t('noMatch') : t('noShops')}</p>
                      <p className="mb-6 text-sm opacity-80 sm:text-base">{shops.length ? t('tryRemoveFilter') : t('newShopsSoon')}</p>
                      {shops.length > 0 && <button type="button" onClick={clearFilters} className="nb-btn nb-btn-a px-6 py-3 text-sm uppercase sm:text-base">{t('clearFilters')}</button>}
                    </div>
                  ) : (
                    <>
                      <div className={`grid gap-4 sm:gap-6 ${gridCols}`}>
                        {listShops.map((s, i) => (
                          <ShopCard key={s.id} shop={s} darkMode={darkMode} index={listOffset + i} layout={layout} dense={layout === 'grid'} onDetails={openDetails} onOpen={openShop} t={t} />
                        ))}
                      </div>
                      {isMobile ? (
                        <InfiniteSentinel hasMore={hasMore} shown={visibleCount} total={filteredShops.length} onMore={loadMore} t={t} />
                      ) : totalPages > 1 && (
                        <div className="flex flex-col items-center gap-3 pt-8">
                          <Pagination page={page} total={totalPages} onChange={goToPage} t={t} />
                          <p className="nb-muted text-xs">
                            <span dir="ltr">{startItem}–{endItem}</span> / <span dir="ltr">{filteredShops.length}</span> {t('shopsFound')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {showTop && (
              <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-5 end-5 z-40">
                <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} title={t('backToTop')} className="nb-btn nb-btn-a h-11 w-11"><FiArrowUp className="h-5 w-5" /></button>
              </m.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {drawerOpen && (
              <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t('filters')}>
                <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={closeSidebar} />
                <m.div {...DRAWER_MOTION} style={GPU}
                  className="nb-bg nb-line absolute inset-x-0 bottom-0 flex max-h-[88vh] min-w-0 transform-gpu flex-col border-t-2 sm:inset-y-0 sm:end-auto sm:start-0 sm:max-h-none sm:w-[22rem] sm:max-w-[90vw] sm:border-e-2 sm:border-t-0 md:w-96">
                  <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-4">
                    <h3 className="text-base font-extrabold uppercase"><span className="nb-ul">{t('filters')}</span></h3>
                    <button type="button" onClick={closeSidebar} aria-label={t('closeFilters')} className="nb-btn h-9 w-9"><FiX className="h-5 w-5" /></button>
                  </div>
                  <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pe-4 sm:px-4 sm:pe-5"><FilterPanel {...filterPanelProps} /></div>
                  <div className="nb-line border-t-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                    <button type="button" onClick={() => { closeSidebar(); scrollToGrid(); }} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">{t('showShops', { count: filteredShops.length })}</button>
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {detailsShop && <ShopDetailsModal key={detailsShop.id} shop={detailsShop} darkMode={darkMode} onClose={closeDetails} onOpen={openFromModal} t={t} />}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
});
export { queryClient };
export default function Shops(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopsContent {...props} />
    </QueryClientProvider>
  );
}