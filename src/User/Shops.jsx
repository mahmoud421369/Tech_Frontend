import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, memo, Suspense, lazy, useDeferredValue, useTransition, createContext, useContext, useId,
} from 'react';
import { useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiMapPin, FiX, FiSliders, FiArrowRight, FiArrowUp, FiCheck, FiShield, FiTool, FiRefreshCw,
  FiShoppingBag, FiExternalLink, FiInfo, FiNavigation, FiMessageSquare, FiPackage, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiSearch, FiHeart, FiPhone,
} from 'react-icons/fi';
import { RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
import api from '../common/api/api';
import { resolveImageSrc } from '../common/utils/productutils';
import {
  markImg, isImgOk, isImgBad, readLogoEntry, writeLogo, LOGO_STALE_MS,
} from '../common/utils/imageCache';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import {
  roleStyle, getShopRole, serviceLabel, addressLine, directionsUrl,
} from '../common/utils/shopsutils';
import { useBackToTop, useModalLock } from '../components/user/ListingKit';
import { IsoIllustration, isoRoleKey } from '../components/user/IsoIllustrations';

const DeliveryMap = lazy(() => import('../Delivery/DeliveryMap'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, gcTime: 10 * 60 * 1000 } },
});

const BATCH = 12;
const SAVED_KEY = 'nb_saved_shops';
const SAVED_MAX = 500;
const CAROUSEL_LIMIT = 10;
const CATEGORY_LIMIT = 14;
const EXIT_MS = 180;
const STATS_STALE = 5 * 60 * 1000;
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));

const LOGO_DIR = '/uploads/shop-logos/';
const LOGO_MAX = 2048;
const BAD_LOGO_CHARS = /[\x00-\x1f\\<>"'`]/;
const DATA_IMAGE = /^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i;
const REMOTE_SRC = /^(https?:)?\/\//i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

const isHttpUrl = (raw) => {
  try {
    const u = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

const shopLogoSrc = (s) => {
  const found = [s?.logoUrl, s?.logo, s?.logoPath, s?.shopLogo].find((v) => typeof v === 'string' && v.trim());
  const raw = found ? found.trim() : '';
  if (!raw || raw.length > LOGO_MAX || raw.includes('..')) return null;
  if (DATA_IMAGE.test(raw)) return raw;
  if (BAD_LOGO_CHARS.test(raw)) return null;
  if (REMOTE_SRC.test(raw)) return isHttpUrl(raw) ? raw : null;
  if (ANY_SCHEME.test(raw)) return null;
  const path = raw.includes('/') ? (raw.startsWith('/') ? raw : `/${raw}`) : `${LOGO_DIR}${encodeURIComponent(raw)}`;
  return resolveImageSrc(path) || path;
};

const SHOPS_TRANSLATIONS = {
  en: enTranslations.shops,
  ar: arTranslations.shops || arTranslations.hero?.shops,
  fr: frTranslations.shops || frTranslations.hero?.shops,
};

const EXTRA = {
  en: {
    reviewOne: 'review', reviewMany: 'reviews', productOne: 'product', productMany: 'products',
    noAddress: 'No address listed', loadingMore: 'Loading more shops', endOfList: 'You have seen all shops',
    save: 'Save shop', saved: 'Saved', savedOnly: 'Saved only', directionsTo: 'Directions to', yourLocation: 'Your location',
    locating: 'Finding your location', locationDenied: 'We could not get your location. The shop is shown on the map.',
    openInMaps: 'Open in Maps', retryLocation: 'Try again',
    moreFilters: 'More filters', ratedOnly: 'Has ratings', hasPhone: 'Has phone number', hasAddress: 'Has address',
    repairAndSell: 'Repair & sell', sortVerified: 'Verified first', scrollPrev: 'Scroll back', scrollNext: 'Scroll forward',
  },
  ar: {
    reviewOne: 'تقييم', reviewMany: 'تقييمات', productOne: 'منتج', productMany: 'منتجات',
    noAddress: 'لا يوجد عنوان مسجل', loadingMore: 'جارٍ تحميل المزيد من المتاجر', endOfList: 'لقد شاهدت جميع المتاجر',
    save: 'حفظ المتجر', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', directionsTo: 'الاتجاهات إلى', yourLocation: 'موقعك',
    locating: 'جارٍ تحديد موقعك', locationDenied: 'تعذر تحديد موقعك. يظهر المتجر على الخريطة.',
    openInMaps: 'فتح في الخرائط', retryLocation: 'إعادة المحاولة',
    moreFilters: 'فلاتر إضافية', ratedOnly: 'لديه تقييمات', hasPhone: 'لديه رقم هاتف', hasAddress: 'لديه عنوان',
    repairAndSell: 'صيانة وبيع', sortVerified: 'الموثقة أولاً', scrollPrev: 'السابق', scrollNext: 'التالي',
  },
  fr: {
    reviewOne: 'avis', reviewMany: 'avis', productOne: 'produit', productMany: 'produits',
    noAddress: 'Aucune adresse indiquée', loadingMore: "Chargement d'autres boutiques", endOfList: 'Vous avez vu toutes les boutiques',
    save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrées uniquement', directionsTo: 'Itinéraire vers', yourLocation: 'Votre position',
    locating: 'Localisation en cours', locationDenied: 'Position introuvable. La boutique est affichée sur la carte.',
    openInMaps: 'Ouvrir dans Maps', retryLocation: 'Réessayer',
    moreFilters: 'Plus de filtres', ratedOnly: 'Avec des notes', hasPhone: 'Avec téléphone', hasAddress: 'Avec adresse',
    repairAndSell: 'Réparation & vente', sortVerified: 'Vérifiées d’abord', scrollPrev: 'Précédent', scrollNext: 'Suivant',
  },
};

const tr = (lang, key, params) => {
  const raw = SHOPS_TRANSLATIONS[lang]?.[key] ?? EXTRA[lang]?.[key] ?? SHOPS_TRANSLATIONS.en?.[key] ?? EXTRA.en[key] ?? key;
  const text = typeof raw === 'string' ? raw : String(key);
  return params ? text.replace(/\{\{(\w+)\}\}/g, (_, k) => (params[k] !== undefined ? params[k] : '')) : text;
};

const clean = (v, max = 200) => (typeof v === 'string' ? v.replace(/[\p{Cc}\p{Cf}]/gu, ' ').trim().slice(0, max) : '');
const telHref = (phone) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  return digits ? `tel:${digits}` : undefined;
};
const safeId = (id) => {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  const s = String(id);
  return s && s.length <= 128 ? encodeURIComponent(s) : null;
};

const useIsMobile = (query = '(max-width: 639.98px)') => {
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

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    if (!Array.isArray(v)) return [];
    return v.filter((x) => (typeof x === 'string' && x.length <= 64) || Number.isFinite(x)).slice(-SAVED_MAX);
  } catch {
    return [];
  }
};

const useSavedShops = () => {
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

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navType]);
};

const useExit = (onClose) => {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef();
  const close = useCallback(() => {
    if (timer.current) return;
    setLeaving(true);
    timer.current = setTimeout(onClose, EXIT_MS);
  }, [onClose]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [leaving, close];
};

const makeObserveOnce = (options) => {
  let io;
  const callbacks = new WeakMap();
  return (el, cb) => {
    if (typeof IntersectionObserver === 'undefined') { cb(); return undefined; }
    io ||= new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const fn = callbacks.get(e.target);
        io.unobserve(e.target);
        callbacks.delete(e.target);
        fn?.();
      }
    }, options);
    callbacks.set(el, cb);
    io.observe(el);
    return () => { io.unobserve(el); callbacks.delete(el); };
  };
};

const observeOnce = makeObserveOnce({ rootMargin: '200px' });
const observeReveal = makeObserveOnce({ rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

const useSeen = () => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !ref.current) return undefined;
    return observeOnce(ref.current, () => setSeen(true));
  }, [seen]);
  return [ref, seen];
};

const Reveal = memo(({ as: Tag = 'div', className = '', children, ...rest }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (shown || !ref.current) return undefined;
    return observeReveal(ref.current, () => setShown(true));
  }, [shown]);
  return (
    <Tag ref={ref} data-shown={shown ? '1' : '0'} className={`hp-rv ${className}`} {...rest}>
      {children}
    </Tag>
  );
});

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

const useShopCounts = (shop) => {
  const id = shop.id;
  const on = id != null;
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

const useShopLogo = (shop, eager = false) => {
  const [ref, seen] = useSeen();
  const id = shop.id;
  const listLogo = useMemo(() => shopLogoSrc(shop), [shop]);
  const entry = listLogo || id == null ? undefined : readLogoEntry(id);
  const q = useQuery({
    queryKey: ['shop', id],
    queryFn: async ({ signal }) => {
      try {
        const res = await api.get(`/api/shops/${encodeURIComponent(id)}`, { signal });
        const src = shopLogoSrc(res.data);
        writeLogo(id, src);
        return src;
      } catch (e) {
        if (signal?.aborted) throw e;
        return null;
      }
    },
    initialData: entry ? entry.u : undefined,
    initialDataUpdatedAt: entry ? entry.t : undefined,
    enabled: (eager || seen) && !listLogo && id != null,
    staleTime: LOGO_STALE_MS,
    retry: false,
    refetchOnMount: false,
  });
  return [ref, listLogo || q.data || null];
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
];

const RATING_STEPS = [4, 4.5, 4.8];

const PX_CSS = `
.hp-dark,.hp-light{font-family:inherit}
.hp-dark button,.hp-dark input,.hp-dark select,.hp-dark textarea,.hp-light button,.hp-light input,.hp-light select,.hp-light textarea{font-family:inherit}
.hp-dark{color-scheme:dark;--bg:#022c22;--panel:#022c22;--g1:#065f46;--g2:#022c22;--g3:#064e3b;--bar:rgba(2,44,34,.95);--card:rgba(6,78,59,.5);--card-hi:rgba(6,78,59,.8);--line:rgba(255,255,255,.1);--line2:rgba(255,255,255,.2);--txt:#ffffff;--mut:rgba(255,255,255,.82);--hov:rgba(255,255,255,.1);--fld:#064e3b;--chip:rgba(6,78,59,.7);--tag:rgba(6,95,70,.8);--pill:rgba(2,44,34,.85);--media:#064e3b;--acc:#6ee7b7;--ring:#6ee7b7;--overlay:rgba(0,0,0,.7);--sk:rgba(255,255,255,.08);--skhi:rgba(255,255,255,.12)}
.hp-light{color-scheme:light;--bg:#f3f4f6;--panel:#ffffff;--g1:#d1fae5;--g2:#a7f3d0;--g3:#ecfdf5;--bar:rgba(255,255,255,.95);--card:#ffffff;--card-hi:#f0fdf4;--line:#e5e7eb;--line2:#d1d5db;--txt:#022c22;--mut:#4b5563;--hov:rgba(5,150,105,.1);--fld:#ffffff;--chip:#ffffff;--tag:#d1fae5;--pill:rgba(255,255,255,.93);--media:#e5e7eb;--acc:#047857;--ring:#059669;--overlay:rgba(2,44,34,.55);--sk:rgba(2,44,34,.07);--skhi:rgba(255,255,255,.75)}
@keyframes hpShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.hp-sk{position:relative;overflow:hidden;background:var(--sk)}
.hp-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--skhi),transparent);animation:hpShimmer 1.25s ease-in-out infinite}
[dir="rtl"] .hp-sk::after{animation-direction:reverse}
@keyframes hpPop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.hp-pop{animation:hpPop .14s ease-out both;transform-origin:top}
@keyframes hpRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.hp-rise{animation:hpRise .45s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0)*40ms)}
@keyframes hpPage{from{opacity:0;transform:translate3d(0,16px,0)}to{opacity:1;transform:none}}
.hp-page{animation:hpPage .55s cubic-bezier(.22,1,.36,1) both;animation-delay:var(--pd,0ms)}
@keyframes hpSoft{from{opacity:0}to{opacity:1}}
.hp-soft{animation:hpSoft .5s ease-out both}
.hp-rv{opacity:0;transform:translate3d(0,24px,0);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1);will-change:opacity,transform}
.hp-rv[data-shown="1"]{opacity:1;transform:none;will-change:auto}
@keyframes hpDot{0%,80%,100%{transform:scale(.55);opacity:.4}40%{transform:scale(1);opacity:1}}
.hp-load-dot{animation:hpDot 1s ease-in-out infinite}
.hp-load-dot:nth-child(2){animation-delay:.15s}
.hp-load-dot:nth-child(3){animation-delay:.3s}
@keyframes hpFadeIn{from{opacity:0}to{opacity:1}}
@keyframes hpFadeOut{from{opacity:1}to{opacity:0}}
@keyframes hpModalIn{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
@keyframes hpModalOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(16px) scale(.98)}}
@keyframes hpDrawerIn{from{transform:translateX(calc(var(--dx)*-100%))}to{transform:none}}
@keyframes hpDrawerOut{from{transform:none}to{transform:translateX(calc(var(--dx)*-100%))}}
@keyframes hpHeart{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
.hp-fade-in{animation:hpFadeIn .18s ease-out both}
.hp-fade-out{animation:hpFadeOut .18s ease-in both}
.hp-modal-in{animation:hpModalIn .24s cubic-bezier(.2,.8,.2,1) both}
.hp-modal-out{animation:hpModalOut .18s ease-in both}
.hp-drawer{animation:hpDrawerIn .24s cubic-bezier(.2,.8,.2,1) both}
.hp-drawer-out{animation:hpDrawerOut .18s ease-in both}
.hp-heart-on{animation:hpHeart .3s ease-out}
.hp-search::-webkit-search-cancel-button,.hp-search::-webkit-search-decoration{display:none;-webkit-appearance:none}
.hp-noscroll{scrollbar-width:none;-ms-overflow-style:none}
.hp-noscroll::-webkit-scrollbar{display:none}
.hp-sb{scrollbar-width:thin;scrollbar-color:#34d399 transparent}
.hp-sb::-webkit-scrollbar{width:8px;height:8px}
.hp-sb::-webkit-scrollbar-thumb{background:#34d399;border-radius:999px}
.hp-sb::-webkit-scrollbar-track{background:transparent}
.hp-lazy{content-visibility:auto;contain-intrinsic-size:auto 420px}
@media (prefers-reduced-motion:no-preference){
html:has(.hp-dark),html:has(.hp-light){scroll-behavior:smooth}
}
@media (prefers-reduced-motion:reduce){
.hp-sk::after,.hp-pop,.hp-rise,.hp-page,.hp-soft,.hp-load-dot,.hp-fade-in,.hp-fade-out,.hp-modal-in,.hp-modal-out,.hp-drawer,.hp-drawer-out,.hp-heart-on{animation:none}
.hp-rv{opacity:1;transform:none;transition:none;will-change:auto}
}
`;

let pxStylesInjected = false;
const injectPxStylesOnce = () => {
  if (pxStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-shops-styles', 'true');
  tag.textContent = PX_CSS;
  document.head.appendChild(tag);
  pxStylesInjected = true;
};
injectPxStylesOnce();

const DarkCtx = createContext(true);
const ThemedIso = (props) => <IsoIllustration {...props} darkMode={useContext(DarkCtx)} />;

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]';
const SURFACE = 'border border-[color:var(--line)] bg-[color:var(--card)]';
const PANEL = 'border border-[color:var(--line)] bg-[color:var(--panel)]';
const BTN_BASE = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold transition-[transform,background-color,border-color] duration-150 active:scale-95 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const BTN_PRIMARY = `${BTN_BASE} bg-emerald-600 text-white hover:bg-emerald-500`;
const BTN_GHOST = `${BTN_BASE} border border-[color:var(--line2)] bg-[color:var(--chip)] text-[color:var(--txt)] hover:border-emerald-400/70`;
const ICON_BTN = `inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-[transform,background-color] duration-150 active:scale-90 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const ICON_SOLID = `${ICON_BTN} bg-[color:var(--pill)] text-[color:var(--txt)] hover:bg-emerald-600 hover:!text-white`;
const ICON_GLASS = `${ICON_BTN} border border-[color:var(--line2)] bg-[color:var(--fld)] text-[color:var(--txt)] hover:bg-emerald-600 hover:!text-white`;

const splitHeading = (text) => {
  const str = String(text ?? '');
  if (str.includes('**')) return str.split('**').map((part, i) => ({ part, hl: i % 2 === 1 }));
  const words = str.split(' ');
  if (words.length < 2) return [{ part: str, hl: true }];
  const n = words.length <= 3 ? 1 : 2;
  return [{ part: `${words.slice(0, -n).join(' ')} `, hl: false }, { part: words.slice(-n).join(' '), hl: true }];
};

const SkBox = ({ className = '' }) => <div className={`hp-sk rounded-lg ${className}`} />;

const CardSkeleton = memo(({ carousel = false }) => (
  <div className={`overflow-hidden rounded-2xl ${SURFACE} ${carousel ? 'w-[72%] flex-shrink-0 snap-start sm:w-64' : ''}`} aria-hidden="true">
    <SkBox className="aspect-[16/10] !rounded-none" />
    <div className="space-y-2.5 p-3.5">
      <SkBox className="h-4 w-3/4" />
      <SkBox className="h-3 w-1/2" />
      <SkBox className="h-3 w-2/3" />
    </div>
  </div>
));

const CarouselSkeleton = memo(() => (
  <div className="py-6" aria-hidden="true">
    <div className="mb-4 space-y-2">
      <SkBox className="h-6 w-48" />
      <SkBox className="h-3 w-64 max-w-full" />
    </div>
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} carousel />)}
    </div>
  </div>
));

const CategorySkeleton = memo(() => (
  <div className="flex gap-4 overflow-hidden py-4" aria-hidden="true">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex w-20 flex-shrink-0 flex-col items-center gap-2">
        <SkBox className="h-16 w-16 !rounded-full" />
        <SkBox className="h-3 w-14" />
      </div>
    ))}
  </div>
));

const GridSkeleton = memo(({ className }) => (
  <div className={className} role="status" aria-busy="true">
    {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
  </div>
));

const PageSkeleton = memo(({ gridClass, label }) => (
  <div role="status" aria-busy="true" aria-label={label}>
    <CategorySkeleton />
    <CarouselSkeleton />
    <div className="mb-4 mt-6 space-y-2">
      <SkBox className="h-6 w-40" />
      <SkBox className="h-3 w-56 max-w-full" />
    </div>
    <GridSkeleton className={gridClass} />
  </div>
));

const SearchField = memo(({ value, onChange, placeholder, ariaLabel, clearLabel, pending }) => {
  const inputRef = useRef(null);
  const handleClear = useCallback(() => { onChange(''); inputRef.current?.focus(); }, [onChange]);
  return (
    <div className="relative min-w-0 flex-1" role="search">
      <FiSearch aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--txt)]" />
      <input
        ref={inputRef} type="search" inputMode="search" autoComplete="off" spellCheck={false} maxLength={100}
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={ariaLabel}
        className={`hp-search h-12 w-full rounded-full border border-[color:var(--line2)] bg-[color:var(--fld)] ps-11 pe-14 text-sm font-semibold text-[color:var(--txt)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[color:var(--mut)] hover:border-emerald-400/60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40`}
      />
      <div className="absolute end-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {pending && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent text-[color:var(--txt)] motion-reduce:animate-none" />}
        {value && (
          <button type="button" onClick={handleClear} aria-label={clearLabel} className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[color:var(--txt)] transition-colors hover:bg-[color:var(--hov)] ${FOCUS}`}>
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

const Dropdown = memo(({ value, onChange, options, ariaLabel }) => {
  const uid = useId().replace(/:/g, '');
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selectedIndex);
  const current = options[selectedIndex];

  const openMenu = useCallback(() => { setActive(selectedIndex); setOpen(true); }, [selectedIndex]);
  const closeMenu = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);
  const pick = useCallback((i) => {
    const o = options[i];
    if (o) onChange(o.value);
    closeMenu();
  }, [options, onChange, closeMenu]);

  useEffect(() => {
    if (!open) return undefined;
    listRef.current?.focus({ preventScroll: true });
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${uid}-o${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, uid]);

  const onButtonKey = useCallback((e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(); }
  }, [openMenu]);

  const onListKey = useCallback((e) => {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive((i) => Math.min(last, i + 1)); break;
      case 'ArrowUp': e.preventDefault(); setActive((i) => Math.max(0, i - 1)); break;
      case 'Home': e.preventDefault(); setActive(0); break;
      case 'End': e.preventDefault(); setActive(last); break;
      case 'Enter':
      case ' ': e.preventDefault(); pick(active); break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); closeMenu(); break;
      case 'Tab': closeMenu(false); break;
      default: break;
    }
  }, [options.length, active, pick, closeMenu]);

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        ref={btnRef} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${uid}-list`} aria-label={`${ariaLabel}: ${current?.label ?? ''}`}
        onClick={() => (open ? closeMenu(false) : openMenu())} onKeyDown={onButtonKey}
        className={`inline-flex h-10 w-44 cursor-pointer items-center justify-between gap-2 rounded-full border border-[color:var(--line2)] bg-[color:var(--fld)] ps-4 pe-3 text-sm font-bold text-[color:var(--txt)] transition-colors hover:border-emerald-400/70 ${FOCUS}`}
      >
        <span className="min-w-0 flex-1 truncate text-start">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          id={`${uid}-list`} ref={listRef} role="listbox" tabIndex={-1} aria-label={ariaLabel} aria-activedescendant={`${uid}-o${active}`} onKeyDown={onListKey}
          className={`hp-pop hp-sb absolute start-0 top-full z-50 mt-2 max-h-64 w-56 overflow-y-auto overscroll-contain rounded-2xl p-1.5 text-[color:var(--txt)] shadow-xl shadow-black/30 outline-none ${PANEL}`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={selected}
                onPointerEnter={() => setActive(i)} onClick={() => pick(i)}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${i === active ? 'bg-[color:var(--hov)]' : ''}`}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {selected && <FiCheck aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" strokeWidth={3} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

const Chip = memo(({ active, onClick, children, icon: Icon, onRemove }) => (
  <button
    type="button" onClick={onClick} aria-pressed={active}
    className={`inline-flex h-10 flex-shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition-[background-color,border-color,transform] duration-150 active:scale-95 motion-reduce:transition-none ${FOCUS} ${
      active ? 'border-emerald-400 bg-emerald-600 text-white' : 'border-[color:var(--line2)] bg-[color:var(--chip)] text-[color:var(--txt)] hover:border-emerald-400/70'
    }`}
  >
    {Icon && <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0" />}
    <span className="max-w-[10rem] truncate">{children}</span>
    {onRemove && <FiX aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />}
  </button>
));

const ShopImage = memo(({ src, name, role, eager = false }) => {
  const [failed, setFailed] = useState(() => isImgBad(src));
  const [loaded, setLoaded] = useState(() => isImgOk(src));
  const imgRef = useRef(null);
  useEffect(() => { setFailed(isImgBad(src)); setLoaded(isImgOk(src)); }, [src]);
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) { markImg(src, 'ok'); setLoaded(true); }
  }, [src, failed]);
  const onError = useCallback(() => { markImg(src, 'bad'); setFailed(true); }, [src]);
  const onLoad = useCallback(() => { markImg(src, 'ok'); setLoaded(true); }, [src]);
  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-br from-[color:var(--g1)] to-[color:var(--g2)] px-6 pt-5">
        <ThemedIso
          type={isoRoleKey(role)} tone="emerald" onGreen={false}
          className="pointer-events-none h-full w-auto max-w-full transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
    );
  }
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 bg-white" />
      {!loaded && <div aria-hidden="true" className="hp-sk absolute inset-0 !rounded-none !bg-black/5" />}
      <img
        ref={imgRef} src={src} alt={name || ''} width={400} height={250}
        loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} decoding="async" referrerPolicy="no-referrer"
        onLoad={onLoad} onError={onError}
        className={`absolute inset-0 h-full w-full object-contain p-4 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105 motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
});

const RatingLine = ({ rating, reviews, className = '' }) => (
  <p className={`flex items-center gap-1 text-xs font-extrabold ${className}`}>
    <RiStarFill className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
    <span dir="ltr" className="tabular-nums">{rating.toFixed(1)}</span>
    {reviews > 0 && <span dir="ltr" className="font-semibold tabular-nums opacity-80">({reviews})</span>}
  </p>
);

const SaveButton = ({ isSaved, onClick, t, className = '' }) => (
  <button
    type="button" onClick={onClick} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
    className={`${ICON_SOLID} !h-9 !w-9 ${className}`}
  >
    <FiHeart key={String(isSaved)} className={`h-4 w-4 ${isSaved ? 'hp-heart-on text-rose-400' : ''}`} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
  </button>
);

const CARD_MOTION = 'transition-[transform,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] active:scale-[.98] motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-emerald-400/60 [@media(hover:hover)]:hover:shadow-xl [@media(hover:hover)]:hover:shadow-black/20';

const ShopCard = memo(({ shop, isSaved, actions, t, eager = false }) => {
  const { onDetails, onOpen, onDirections, onSave } = actions;
  const role = getShopRole(shop);
  const rs = roleStyle(role);
  const address = addressLine(shop);
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const [mediaRef, logo] = useShopLogo(shop, eager);
  const reviews = useMemo(() => shopFallback(shop).reviews, [shop]);
  const open = useCallback(() => onOpen(shop.id), [onOpen, shop.id]);
  const showDetails = useCallback((e) => { e.stopPropagation(); onDetails(shop); }, [onDetails, shop]);
  const directions = useCallback((e) => { e.stopPropagation(); onDirections(shop); }, [onDirections, shop]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(shop.id); }, [onSave, shop.id]);

  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={shop.name || t('unnamedShop')}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl text-[color:var(--txt)] ${SURFACE} ${CARD_MOTION} [@media(hover:hover)]:hover:bg-[color:var(--card-hi)] ${FOCUS}`}
    >
      <div ref={mediaRef} className="relative aspect-[16/10] w-full flex-shrink-0 overflow-hidden bg-[color:var(--media)] [contain:layout_paint]">
        <ShopImage src={logo} name={shop.name} role={role} eager={eager} />
        <SaveButton isSaved={isSaved} onClick={save} t={t} className="absolute end-3 top-3" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5">
        <h3 className="min-w-0 text-base font-extrabold leading-snug">
          <span className="block truncate">{shop.name || t('unnamedShop')}</span>
        </h3>
        {hasRating && <RatingLine rating={shop.rating} reviews={reviews} />}
        <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[color:var(--mut)]">
          <FiMapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--acc)]" />
          <span className="truncate">{address || t('noAddress')}</span>
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-[color:var(--acc)]">
          <rs.icon aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{serviceLabel(role, t)}{shop.shopType ? ` / ${shop.shopType}` : ''}</span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <button type="button" onClick={showDetails} className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-extrabold text-[color:var(--txt)] transition-colors hover:bg-[color:var(--hov)] ${FOCUS}`}>
            <FiInfo className="h-4 w-4" aria-hidden="true" />{t('details')}
          </button>
          <button type="button" onClick={directions} aria-label={t('getDirections')} title={t('getDirections')} className={`${ICON_BTN} !h-9 !w-9 bg-emerald-600 text-white hover:bg-emerald-500`}>
            <FiNavigation className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
});

const TopRatedCard = memo(({ shop, rank, isSaved, actions, t, eager = false }) => {
  const { onDetails, onOpen, onDirections, onSave } = actions;
  const role = getShopRole(shop);
  const address = addressLine(shop);
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const [mediaRef, logo] = useShopLogo(shop, eager);
  const reviews = useMemo(() => shopFallback(shop).reviews, [shop]);
  const open = useCallback(() => onOpen(shop.id), [onOpen, shop.id]);
  const showDetails = useCallback((e) => { e.stopPropagation(); onDetails(shop); }, [onDetails, shop]);
  const directions = useCallback((e) => { e.stopPropagation(); onDirections(shop); }, [onDirections, shop]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(shop.id); }, [onSave, shop.id]);

  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={shop.name || t('unnamedShop')}
      className={`group relative flex h-full cursor-pointer items-stretch gap-4 overflow-hidden rounded-3xl border border-[color:var(--line2)] bg-gradient-to-br from-[color:var(--g3)] to-[color:var(--card)] p-4 text-[color:var(--txt)] ${CARD_MOTION} ${FOCUS}`}
    >
      <div ref={mediaRef} className="relative h-28 w-28 flex-shrink-0 self-center overflow-hidden rounded-2xl bg-[color:var(--media)] [contain:layout_paint] sm:h-32 sm:w-32">
        <ShopImage src={logo} name={shop.name} role={role} eager={eager} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <span dir="ltr" aria-hidden="true" className="text-3xl font-black leading-none tabular-nums text-[color:var(--acc)]">#{rank}</span>
          <SaveButton isSaved={isSaved} onClick={save} t={t} />
        </div>
        <h3 className="mt-1 min-w-0 text-lg font-extrabold leading-snug">
          <span className="block truncate">{shop.name || t('unnamedShop')}</span>
        </h3>
        {hasRating && <RatingLine rating={shop.rating} reviews={reviews} className="!text-sm" />}
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[color:var(--mut)]">
          <FiMapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--acc)]" />
          <span className="truncate">{address || t('noAddress')}</span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <button type="button" onClick={showDetails} className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-extrabold text-[color:var(--txt)] transition-colors hover:bg-[color:var(--hov)] ${FOCUS}`}>
            <FiInfo className="h-4 w-4" aria-hidden="true" />{t('details')}
          </button>
          <button type="button" onClick={directions} aria-label={t('getDirections')} title={t('getDirections')} className={`${ICON_BTN} !h-9 !w-9 bg-emerald-600 text-white hover:bg-emerald-500`}>
            <FiNavigation className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
});

const ShopCell = memo(({ index, className = '', children }) => (
  <div className={`hp-rise min-w-0 ${className}`} style={STAGGER[index % STAGGER.length]}>{children}</div>
));

const Carousel = memo(({ title, subtitle, count, onViewAll, viewAllLabel, shops, saved, actions, t, featured = false }) => {
  const ref = useRef(null);
  const scroll = useCallback((d) => {
    const el = ref.current;
    if (!el) return;
    const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollBy({ left: d * sign * el.clientWidth * 0.8, behavior: 'smooth' });
  }, []);
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <Reveal as="section" aria-label={title} className="hp-lazy py-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight sm:text-2xl">
            {parts.map(({ part, hl }, i) => (hl ? <span key={i} className="text-[color:var(--acc)]">{part}</span> : part))}
            {count != null && <span dir="ltr" className="ms-2 text-sm font-bold tabular-nums opacity-70">({count})</span>}
          </h2>
          {subtitle && <p className="mt-1 line-clamp-1 text-sm font-medium text-[color:var(--mut)]">{subtitle}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {onViewAll && (
            <button type="button" onClick={onViewAll} className={`inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full px-3 text-sm font-extrabold text-[color:var(--acc)] transition-colors hover:bg-[color:var(--hov)] ${FOCUS}`}>
              {viewAllLabel}<FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={() => scroll(-1)} aria-label={t('scrollPrev')} className={`${ICON_GLASS} hidden sm:inline-flex`}><FiChevronLeft className="h-5 w-5 rtl:rotate-180" /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={t('scrollNext')} className={`${ICON_GLASS} hidden sm:inline-flex`}><FiChevronRight className="h-5 w-5 rtl:rotate-180" /></button>
        </div>
      </div>
      <div ref={ref} className="hp-noscroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {shops.map((s, i) => (
          featured ? (
            <ShopCell key={s.id} index={i} className="w-[88%] flex-shrink-0 snap-start sm:w-[25rem]">
              <TopRatedCard shop={s} rank={i + 1} isSaved={saved.has(s.id)} actions={actions} t={t} eager={i < 2} />
            </ShopCell>
          ) : (
            <ShopCell key={s.id} index={i} className="w-[72%] flex-shrink-0 snap-start sm:w-64">
              <ShopCard shop={s} isSaved={saved.has(s.id)} actions={actions} t={t} eager={i < 2} />
            </ShopCell>
          )
        ))}
      </div>
    </Reveal>
  );
});

const CategoryRail = memo(({ types, countsByType, selected, onToggle, onAll, allLabel, total, ariaLabel }) => (
  <nav aria-label={ariaLabel} className="hp-noscroll -mx-4 flex gap-4 overflow-x-auto px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
    <button type="button" onClick={onAll} aria-pressed={!selected.length} className={`group flex w-20 flex-shrink-0 cursor-pointer flex-col items-center gap-2 rounded-2xl text-[color:var(--txt)] ${FOCUS}`}>
      <span className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-active:scale-90 motion-reduce:transition-none [@media(hover:hover)]:group-hover:-translate-y-1 ${!selected.length ? 'border-emerald-300 bg-emerald-600 text-white' : 'border-[color:var(--line2)] bg-[color:var(--fld)]'}`}>
        <FiShoppingBag className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="line-clamp-1 w-full text-center text-xs font-extrabold">{allLabel}</span>
      <span dir="ltr" className="-mt-1.5 text-[11px] font-semibold tabular-nums opacity-70">{total}</span>
    </button>
    {types.map((ty) => {
      const active = selected.includes(ty);
      return (
        <button key={ty} type="button" onClick={() => onToggle(ty)} aria-pressed={active} className={`group flex w-20 flex-shrink-0 cursor-pointer flex-col items-center gap-2 rounded-2xl text-[color:var(--txt)] ${FOCUS}`}>
          <span className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-xl font-black uppercase transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-active:scale-90 motion-reduce:transition-none [@media(hover:hover)]:group-hover:-translate-y-1 ${active ? 'border-emerald-300 bg-emerald-600 text-white' : 'border-[color:var(--line2)] bg-[color:var(--fld)]'}`}>
            {ty.trim().charAt(0)}
          </span>
          <span className="line-clamp-1 w-full text-center text-xs font-extrabold">{ty}</span>
          <span dir="ltr" className="-mt-1.5 text-[11px] font-semibold tabular-nums opacity-70">{countsByType[ty] || 0}</span>
        </button>
      );
    })}
  </nav>
));

const OptionRow = memo(({ type, label, count, selected, onClick }) => (
  <button
    type="button" role={type === 'check' ? 'checkbox' : 'radio'} aria-checked={selected} onClick={onClick}
    className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-start text-sm font-bold text-[color:var(--txt)] transition-colors hover:bg-[color:var(--hov)] ${FOCUS}`}
  >
    <span
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 transition-colors duration-150 motion-reduce:transition-none ${type === 'radio' ? 'rounded-full' : 'rounded-md'} ${
        selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[color:var(--line2)] bg-transparent'
      }`}
    >
      {selected && (type === 'check' ? <FiCheck className="h-3 w-3" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-white" />)}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className="text-xs font-semibold tabular-nums opacity-70" dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ title, isOpen, onToggle, children }) => (
  <section className="border-t border-[color:var(--line)]">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className={`flex min-h-12 w-full cursor-pointer items-center gap-3 py-3 text-start text-[color:var(--txt)] ${FOCUS}`}>
      <span className="min-w-0 flex-1 truncate text-sm font-extrabold">{title}</span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="hp-pop min-w-0 pb-4">{children}</div>}
  </section>
));

const STAR = <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />;

const FilterPanel = memo((p) => {
  const {
    t, onClose, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    savedOnly, setSavedOnly, ratedOnly, setRatedOnly, hasPhoneOnly, setHasPhoneOnly, hasAddressOnly, setHasAddressOnly,
    open, setOpen, clearFilters, activeFiltersCount,
  } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className="w-full min-w-0 text-[color:var(--txt)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 text-lg font-extrabold">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" />
          <span className="truncate">{t('filters')}</span>
        </h3>
        <div className="flex flex-shrink-0 items-center gap-2">
          {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className={`min-h-10 cursor-pointer rounded-full px-3 text-xs font-extrabold text-[color:var(--acc)] underline underline-offset-4 ${FOCUS}`}>{t('resetAll')}</button>}
          {onClose && <button type="button" onClick={onClose} aria-label={t('closeFilters')} className={ICON_GLASS}><FiX className="h-4 w-4" /></button>}
        </div>
      </div>

      <FilterBlock title={t('serviceType')} isOpen={open.role} onToggle={() => toggle('role')}>
        <div className="min-w-0 break-words" role="radiogroup" aria-label={t('serviceType')}>
          <OptionRow type="radio" label={t('allShops')} count={roleCounts.ALL} selected={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')} />
          <OptionRow type="radio" label={t('repairServices')} count={roleCounts.REPAIRER} selected={roleFilter === 'REPAIRER'} onClick={() => setRoleFilter('REPAIRER')} />
          <OptionRow type="radio" label={t('sellTradeIn')} count={roleCounts.SELLER} selected={roleFilter === 'SELLER'} onClick={() => setRoleFilter('SELLER')} />
          <OptionRow type="radio" label={t('repairAndSell')} count={roleCounts.BOTH} selected={roleFilter === 'BOTH'} onClick={() => setRoleFilter('BOTH')} />
        </div>
      </FilterBlock>

      <FilterBlock title={t('shopType')} isOpen={open.type} onToggle={() => toggle('type')}>
        {shopTypes.length === 0
          ? <p className="text-sm font-medium opacity-80">{t('noTypes')}</p>
          : (
            <div className="hp-sb max-h-52 min-w-0 overflow-y-auto overscroll-contain break-words pe-2">
              {shopTypes.map((ty) => <OptionRow key={ty} type="check" label={ty} count={countsByType[ty] || 0} selected={selectedShopTypes.includes(ty)} onClick={() => toggleShopType(ty)} />)}
            </div>
          )}
      </FilterBlock>

      {cities.length > 0 && (
        <FilterBlock title={t('city')} isOpen={open.city} onToggle={() => toggle('city')}>
          <div className="hp-sb flex max-h-40 min-w-0 flex-wrap gap-2 overflow-y-auto overscroll-contain pe-2">
            {cities.map((c) => <Chip key={c} active={selectedCities.includes(c)} onClick={() => toggleCity(c)}>{c}</Chip>)}
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
          <OptionRow type="check" label={t('savedOnly')} selected={savedOnly} onClick={() => setSavedOnly((v) => !v)} />
        </div>
      </FilterBlock>

      <FilterBlock title={t('moreFilters')} isOpen={open.more} onToggle={() => toggle('more')}>
        <div className="min-w-0 break-words">
          <OptionRow type="check" label={t('ratedOnly')} selected={ratedOnly} onClick={() => setRatedOnly((v) => !v)} />
          <OptionRow type="check" label={t('hasPhone')} selected={hasPhoneOnly} onClick={() => setHasPhoneOnly((v) => !v)} />
          <OptionRow type="check" label={t('hasAddress')} selected={hasAddressOnly} onClick={() => setHasAddressOnly((v) => !v)} />
        </div>
      </FilterBlock>
    </div>
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
    <div ref={ref} role="status" aria-live="polite" className="flex min-h-[4rem] items-center justify-center gap-3 pt-8 text-[color:var(--txt)]">
      {hasMore ? (
        <>
          <span aria-hidden="true" className="flex items-center gap-1.5">
            <span className="hp-load-dot h-2.5 w-2.5 rounded-full bg-[color:var(--acc)]" />
            <span className="hp-load-dot h-2.5 w-2.5 rounded-full bg-[color:var(--acc)]" />
            <span className="hp-load-dot h-2.5 w-2.5 rounded-full bg-[color:var(--acc)]" />
          </span>
          <span className="text-xs font-bold">{t('loadingMore')}</span>
        </>
      ) : total > BATCH ? (
        <p className="hp-pop flex items-center justify-center gap-1.5 text-xs font-extrabold">
          <FiCheck aria-hidden="true" className="h-3.5 w-3.5 text-[color:var(--acc)]" />{t('endOfList')}
        </p>
      ) : null}
    </div>
  );
});

const InfoLine = ({ icon: Icon, children }) => (
  <p className="flex min-w-0 items-start gap-2 text-sm font-medium text-[color:var(--txt)]">
    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" />
    <span className="min-w-0 break-words">{children}</span>
  </p>
);

const ShopStats = memo(({ shop, t }) => {
  const { reviews, products } = useShopCounts(shop);
  const plus = (n) => (n == null ? '+–' : `+${n}`);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[color:var(--txt)]">
      <span className="inline-flex items-center gap-1.5">
        <FiMessageSquare aria-hidden="true" className="h-3.5 w-3.5 text-[color:var(--acc)]" />
        <span dir="ltr" className="tabular-nums">{plus(reviews)}</span> {reviews === 1 ? t('reviewOne') : t('reviewMany')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <FiPackage aria-hidden="true" className="h-3.5 w-3.5 text-[color:var(--acc)]" />
        <span dir="ltr" className="tabular-nums">{plus(products)}</span> {products === 1 ? t('productOne') : t('productMany')}
      </span>
    </div>
  );
});

const DirectionsModal = memo(({ shop, onClose, t }) => {
  const isMobile = useIsMobile();
  const [leaving, close] = useExit(onClose);
  const [status, setStatus] = useState('locating');
  const [origin, setOrigin] = useState(null);
  const address = addressLine(shop);
  const name = shop.name || t('unnamedShop');

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setStatus('denied'); return; }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (p) => { setOrigin({ latitude: p.coords.latitude, longitude: p.coords.longitude }); setStatus('ready'); },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => { locate(); }, [locate]);
  useModalLock(true, close);

  const items = useMemo(() => [{ id: shop.id, pickup: origin, drop: shop.shopAddress || {} }], [shop, origin]);
  const noop = useCallback(() => {}, []);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`${t('directionsTo')} ${name}`}>
      <div className={`absolute inset-0 bg-[color:var(--overlay)] ${leaving ? 'hp-fade-out' : 'hp-fade-in'}`} onClick={close} />
      <div className={`${leaving ? 'hp-modal-out' : 'hp-modal-in'} hp-sb relative max-h-[94vh] w-full transform-gpu overflow-y-auto overscroll-contain rounded-t-3xl text-[color:var(--txt)] sm:max-w-2xl sm:rounded-3xl ${PANEL}`}>
        <div className="relative flex items-center gap-3 border-b border-[color:var(--line)] p-4 pe-16">
          <span aria-hidden="true" className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><FiNavigation className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold opacity-80">{t('directionsTo')}</p>
            <h2 className="line-clamp-1 text-base font-extrabold sm:text-lg">{name}</h2>
            <p className="line-clamp-1 text-xs font-medium opacity-80">{address || t('noAddress')}</p>
          </div>
          <button type="button" onClick={close} aria-label={t('close')} className={`${ICON_GLASS} absolute end-3 top-3`}>
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-3 sm:p-4">
          <Suspense fallback={<div className="hp-sk w-full rounded-2xl" style={{ aspectRatio: isMobile ? '1 / 1' : '1 / 0.62' }} />}>
            <DeliveryMap
              items={items}
              selectedId={origin ? shop.id : null}
              onSelect={noop}
              aspect={isMobile ? 1 : 0.62}
              startLabel={t('yourLocation')}
              endLabel={name}
              className="!rounded-2xl !border !border-[color:var(--line)]"
            />
          </Suspense>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="status" aria-live="polite" className="min-w-0 flex-1 text-xs font-bold">
              {status === 'locating' && (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
                  {t('locating')}
                </span>
              )}
              {status === 'denied' && <span>{t('locationDenied')}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {status === 'denied' && (
                <button type="button" onClick={locate} className={`${BTN_GHOST} !min-h-10 !px-4 !text-xs`}>
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" /> {t('retryLocation')}
                </button>
              )}
              <a href={directionsUrl(shop, null)} target="_blank" rel="noopener noreferrer nofollow" className={`${BTN_PRIMARY} !min-h-10 !px-4 !text-xs`}>
                <FiExternalLink className="h-4 w-4" aria-hidden="true" /> {t('openInMaps')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ShopDetailsModal = memo(({ shop, onClose, onOpen, onDirections, t }) => {
  const [leaving, close] = useExit(onClose);
  const role = getShopRole(shop);
  const caps = capabilitiesFor(role);
  const address = addressLine(shop);
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const [, logo] = useShopLogo(shop, true);
  const tel = telHref(shop.phone);

  useModalLock(true, close);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name || t('unnamedShop')}>
      <div className={`absolute inset-0 bg-[color:var(--overlay)] ${leaving ? 'hp-fade-out' : 'hp-fade-in'}`} onClick={close} />
      <div className={`${leaving ? 'hp-modal-out' : 'hp-modal-in'} hp-sb group relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain rounded-t-3xl text-[color:var(--txt)] sm:max-w-lg sm:rounded-3xl ${PANEL}`}>
        <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-[color:var(--media)] sm:h-56">
          <ShopImage src={logo} name={shop.name} role={role} eager />
          <div className="absolute end-3 top-3 z-10 flex items-center gap-2">
            <button type="button" onClick={() => onDirections(shop)} aria-label={t('getDirections')} title={t('getDirections')} className={ICON_SOLID}>
              <FiNavigation className="h-4 w-4" />
            </button>
            <button type="button" onClick={close} aria-label={t('close')} className={ICON_SOLID}>
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-[color:var(--line)] p-4 sm:p-5">
          <h2 className="text-xl font-extrabold leading-snug">
            <span className="line-clamp-2">{shop.name || t('unnamedShop')}</span>
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-extrabold text-[color:var(--acc)]">
            <span>{serviceLabel(role, t)}</span>
            {hasRating && (
              <span className="inline-flex items-center gap-1 text-[color:var(--txt)]">
                <RiStarFill className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /><span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
              </span>
            )}
          </p>
          <div className="mt-3"><ShopStats shop={shop} t={t} /></div>
        </div>

        <div className="space-y-6 p-4 sm:p-5">
          <section>
            <h3 className="mb-2 text-sm font-extrabold text-[color:var(--acc)]">{t('about')}</h3>
            <p className="text-sm font-medium leading-relaxed">{clean(shop.description, 1000) || t('noDescription')}</p>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-extrabold text-[color:var(--acc)]">{t('whatShopCanDo')}</h3>
            <ul className="grid gap-3">
              {caps.map(({ icon: Icon, titleKey, textKey }) => (
                <li key={titleKey} className="flex items-start gap-3">
                  <span aria-hidden="true" className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">{t(titleKey)}</p>
                    <p className="text-xs font-medium opacity-80">{t(textKey)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={`grid gap-2.5 rounded-2xl p-3.5 ${SURFACE}`}>
            {shop.shopType && <InfoLine icon={FiShoppingBag}>{clean(String(shop.shopType), 60)}</InfoLine>}
            <InfoLine icon={FiMapPin}>{address || t('noAddress')}</InfoLine>
            {tel && (
              <InfoLine icon={FiPhone}>
                <a href={tel} dir="ltr" className="hover:underline focus-visible:underline">{clean(String(shop.phone), 30)}</a>
              </InfoLine>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3 pb-1">
            <button type="button" onClick={close} className={BTN_GHOST}>{t('close')}</button>
            <button type="button" onClick={() => onOpen(shop.id)} className={BTN_PRIMARY}><FiExternalLink className="h-4 w-4" aria-hidden="true" /> {t('visitShop')}</button>
          </div>
        </div>
      </div>
    </div>
  );
});

const EmptyState = memo(({ title, text, action, onAction, icon = 'shopsEmpty' }) => (
  <div className={`hp-pop flex flex-col items-center rounded-3xl px-4 py-14 text-center text-[color:var(--txt)] sm:py-20 ${SURFACE}`}>
    <ThemedIso type={icon} tone="emerald" onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
    <p className="mb-2 text-lg font-extrabold sm:text-2xl">{title}</p>
    <p className="mb-6 max-w-md text-sm font-medium opacity-85 sm:text-base">{text}</p>
    {action && <button type="button" onClick={onAction} className={BTN_PRIMARY}>{action}</button>}
  </div>
));

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4';

const ShopsContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k, params) => tr(language, k, params), [language]);
  const dir = languageDirection(language);
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  useScrollTopOnEnter();

  const [saved, toggleSaved] = useSavedShops();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const searchPending = searchTerm !== deferredSearch;
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedShopTypes, setSelectedShopTypes] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [ratedOnly, setRatedOnly] = useState(false);
  const [hasPhoneOnly, setHasPhoneOnly] = useState(false);
  const [hasAddressOnly, setHasAddressOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [sheet, setSheet] = useState('closed');
  const [detailsShop, setDetailsShop] = useState(null);
  const [directionsShop, setDirectionsShop] = useState(null);
  const [open, setOpen] = useState({ role: true, type: true, city: true, rating: true, more: true });
  const gridRef = useRef(null);
  const sheetTimer = useRef();
  const showTop = useBackToTop();

  const openSheet = useCallback(() => { clearTimeout(sheetTimer.current); setSheet('open'); }, []);
  const closeSheet = useCallback(() => {
    setSheet((s) => (s === 'open' ? 'leave' : s));
    clearTimeout(sheetTimer.current);
    sheetTimer.current = setTimeout(() => setSheet('closed'), EXIT_MS);
  }, []);
  useModalLock(sheet === 'open', closeSheet);
  useEffect(() => () => clearTimeout(sheetTimer.current), []);

  useEffect(() => { document.title = t('pageTitle'); }, [t]);

  const { data: shops = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['shopsList'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/shops/all', { signal });
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list.filter((s) => s && s.id != null) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { shopTypes, cities, countsByType, roleCounts, topRated, roleGroups, searchIndex } = useMemo(() => {
    const types = new Set(); const citySet = new Set(); const counts = {}; const index = new Map();
    let rep = 0; let sell = 0; let both = 0;
    const byRole = { REPAIRER: [], SELLER: [] };
    for (const s of shops) {
      if (s.shopType) { types.add(s.shopType); counts[s.shopType] = (counts[s.shopType] || 0) + 1; }
      if (s.shopAddress?.city) citySet.add(s.shopAddress.city);
      const r = getShopRole(s);
      if (r !== 'SELLER') rep++;
      if (r !== 'REPAIRER') sell++;
      if (r === 'BOTH') both++;
      if (r === 'REPAIRER' || r === 'SELLER') byRole[r].push(s);
      index.set(s.id, `${s.name || ''} ${s.shopType || ''} ${s.shopAddress?.city || ''} ${s.shopAddress?.street || ''} ${s.description || ''} ${s.phone || ''}`.toLowerCase());
    }
    const groups = ROLE_SECTIONS.map((sec) => {
      const list = [...byRole[sec.role]].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return { ...sec, count: list.length, top: list.slice(0, CAROUSEL_LIMIT) };
    }).filter((g) => g.count);
    return {
      shopTypes: [...types].sort(),
      cities: [...citySet].sort(),
      countsByType: counts,
      roleCounts: { ALL: shops.length, REPAIRER: rep, SELLER: sell, BOTH: both },
      topRated: shops.filter((s) => s.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, CAROUSEL_LIMIT),
      roleGroups: groups,
      searchIndex: index,
    };
  }, [shops]);

  const categoryTypes = useMemo(
    () => [...shopTypes].sort((a, b) => (countsByType[b] || 0) - (countsByType[a] || 0)).slice(0, CATEGORY_LIMIT),
    [shopTypes, countsByType],
  );

  const filteredShops = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    const list = shops.filter((s) => {
      const role = getShopRole(s);
      if (roleFilter !== 'ALL' && role !== roleFilter && role !== 'BOTH') return false;
      if (selectedShopTypes.length && !selectedShopTypes.includes(s.shopType)) return false;
      if (selectedCities.length && !selectedCities.includes(s.shopAddress?.city)) return false;
      if ((s.rating || 0) < minRating) return false;
      if (showVerifiedOnly && !s.verified) return false;
      if (savedOnly && !saved.has(s.id)) return false;
      if (ratedOnly && !(s.rating > 0)) return false;
      if (hasPhoneOnly && !s.phone) return false;
      if (hasAddressOnly && !addressLine(s)) return false;
      if (term && !searchIndex.get(s.id)?.includes(term)) return false;
      return true;
    });
    if (sortBy === 'ratingHighToLow') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'verifiedFirst') list.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0) || (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'nameAZ') list.sort((a, b) => (a.name || '').localeCompare(b.name || '', language));
    return list;
  }, [shops, searchIndex, saved, deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, savedOnly, ratedOnly, hasPhoneOnly, hasAddressOnly, sortBy, language]);

  useEffect(() => {
    setVisibleCount(BATCH);
  }, [deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, savedOnly, ratedOnly, hasPhoneOnly, hasAddressOnly, sortBy]);

  const visibleShops = useMemo(() => filteredShops.slice(0, visibleCount), [filteredShops, visibleCount]);
  const hasMore = visibleCount < filteredShops.length;

  const loadMore = useCallback(() => startTransition(() => setVisibleCount((c) => c + BATCH)), []);
  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);
  const scrollToTop = useCallback(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, []);
  const openShop = useCallback((id) => {
    const safe = safeId(id);
    if (safe) navigate(`/shops/${safe}`);
  }, [navigate]);
  const toggleShopType = useCallback((ty) => setSelectedShopTypes((p) => (p.includes(ty) ? p.filter((x) => x !== ty) : [...p, ty])), []);
  const toggleCity = useCallback((c) => setSelectedCities((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const clearTypes = useCallback(() => setSelectedShopTypes([]), []);
  const clearFilters = useCallback(() => {
    setSearchTerm(''); setRoleFilter('ALL'); setSelectedShopTypes([]); setSelectedCities([]); setMinRating(0); setShowVerifiedOnly(false); setSavedOnly(false); setRatedOnly(false); setHasPhoneOnly(false); setHasAddressOnly(false); setSortBy('relevance'); setVisibleCount(BATCH);
  }, []);
  const openDetails = useCallback((shop) => setDetailsShop(shop), []);
  const closeDetails = useCallback(() => setDetailsShop(null), []);
  const openDirections = useCallback((shop) => setDirectionsShop(shop), []);
  const closeDirections = useCallback(() => setDirectionsShop(null), []);
  const openFromModal = useCallback((id) => { setDetailsShop(null); openShop(id); }, [openShop]);
  const directionsFromModal = useCallback((shop) => { setDetailsShop(null); setDirectionsShop(shop); }, []);
  const viewAllRole = useCallback((role) => {
    setRoleFilter(role);
    setSelectedShopTypes([]); setSelectedCities([]);
    scrollToGrid();
  }, [scrollToGrid]);
  const viewAllTop = useCallback(() => {
    setMinRating(4); setSortBy('ratingHighToLow');
    scrollToGrid();
  }, [scrollToGrid]);

  const actions = useMemo(() => ({
    onDetails: openDetails, onOpen: openShop, onDirections: openDirections, onSave: toggleSaved,
  }), [openDetails, openShop, openDirections, toggleSaved]);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (roleFilter !== 'ALL' ? 1 : 0) + selectedShopTypes.length + selectedCities.length + (minRating > 0 ? 1 : 0) + (showVerifiedOnly ? 1 : 0) + (savedOnly ? 1 : 0) + (ratedOnly ? 1 : 0) + (hasPhoneOnly ? 1 : 0) + (hasAddressOnly ? 1 : 0);
  const browsing = activeFiltersCount === 0 && sortBy === 'relevance';

  const sortOptions = useMemo(() => [
    { value: 'relevance', label: t('sortRelevance') },
    { value: 'ratingHighToLow', label: t('sortRating') },
    { value: 'verifiedFirst', label: t('sortVerified') },
    { value: 'nameAZ', label: t('sortName') },
  ], [t]);

  const filterPanelProps = useMemo(() => (sheet !== 'closed' ? {
    t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    savedOnly, setSavedOnly, ratedOnly, setRatedOnly, hasPhoneOnly, setHasPhoneOnly, hasAddressOnly, setHasAddressOnly,
    open, setOpen, clearFilters, activeFiltersCount,
  } : null), [sheet, t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, roleCounts, minRating, showVerifiedOnly, savedOnly, ratedOnly, hasPhoneOnly, hasAddressOnly, open, clearFilters, activeFiltersCount]);

  const heading = useMemo(() => splitHeading(`${t('heroLine1')} **${t('heroAccent')}** ${t('heroLine2')}`.trim()), [t]);

  return (
    <div
      dir={dir} lang={language}
      className={`min-h-screen overflow-x-clip mt-10 ${darkMode ? 'hp-dark' : 'hp-light'} bg-[color:var(--bg)] text-[color:var(--txt)] [--dx:1] rtl:[--dx:-1] ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <header className="bg-gradient-to-b from-[color:var(--g3)] to-[color:var(--bg)] pb-6 pt-24 sm:pt-28">
        <div className="hp-page mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className={`max-w-3xl text-3xl font-extrabold [text-wrap:balance] sm:text-5xl ${isAr ? 'leading-[1.4]' : 'leading-[1.15] tracking-tight'}`}>
            {heading.map(({ part, hl }, i) => (hl ? <span key={i} className="text-[color:var(--acc)]">{part}</span> : part))}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[color:var(--mut)] sm:text-base">{t('heroDescription')}</p>
        </div>
      </header>

      <div className="hp-soft sticky top-[var(--shops-sticky-top,0px)] z-30 border-y border-[color:var(--line)] bg-[color:var(--bar)]">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SearchField value={searchTerm} onChange={setSearchTerm} placeholder={t('search')} ariaLabel={t('searchAria')} clearLabel={t('clearSearch')} pending={searchPending} />
            <button type="button" onClick={openSheet} aria-haspopup="dialog" aria-expanded={sheet === 'open'} className={`${BTN_PRIMARY} !h-12 flex-shrink-0 !px-4 sm:!px-5`}>
              <FiSliders className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('filters')}</span>
              {activeFiltersCount > 0 && <span dir="ltr" className="tabular-nums">({activeFiltersCount})</span>}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Dropdown value={sortBy} onChange={setSortBy} options={sortOptions} ariaLabel={t('sortBy')} />
            <div className="hp-noscroll flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              <Chip active={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')}>{t('allShops')}</Chip>
              <Chip active={roleFilter === 'REPAIRER'} onClick={() => setRoleFilter(roleFilter === 'REPAIRER' ? 'ALL' : 'REPAIRER')} icon={FiTool}>{t('repairServices')}</Chip>
              <Chip active={roleFilter === 'SELLER'} onClick={() => setRoleFilter(roleFilter === 'SELLER' ? 'ALL' : 'SELLER')} icon={FiShoppingBag}>{t('sellTradeIn')}</Chip>
              <Chip active={roleFilter === 'BOTH'} onClick={() => setRoleFilter(roleFilter === 'BOTH' ? 'ALL' : 'BOTH')} icon={FiRefreshCw}>{t('repairAndSell')}</Chip>
              <Chip active={minRating >= 4} onClick={() => setMinRating(minRating >= 4 ? 0 : 4)} icon={RiStarFill}>4+ {t('stars')}</Chip>
              <Chip active={showVerifiedOnly} onClick={() => setShowVerifiedOnly((v) => !v)} icon={RiVerifiedBadgeLine}>{t('verified')}</Chip>
              <Chip active={savedOnly} onClick={() => setSavedOnly((v) => !v)} icon={FiHeart}>{t('savedOnly')}</Chip>
            </div>
          </div>
        </div>
      </div>

      <main className="hp-page mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8" style={{ '--pd': '120ms' }}>
        {isLoading ? (
          <PageSkeleton gridClass={GRID_CLASS} label={t('loading')} />
        ) : isError ? (
          <div className="pt-10">
            <EmptyState
              title={t('loadErrorTitle')} text={t('loadErrorText')}
              action={<span className="inline-flex items-center gap-2"><FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />{t('tryAgain')}</span>}
              onAction={() => refetch()}
            />
          </div>
        ) : (
          <>
            {browsing && categoryTypes.length > 0 && (
              <CategoryRail
                types={categoryTypes} countsByType={countsByType} selected={selectedShopTypes} onToggle={toggleShopType} onAll={clearTypes}
                allLabel={t('allShops')} total={shops.length} ariaLabel={t('shopType')}
              />
            )}

            {browsing && topRated.length > 0 && (
              <Carousel
                featured
                title={t('customerFavorites')} subtitle={t('topRatedSubtitle')} onViewAll={viewAllTop} viewAllLabel={t('viewAll')}
                shops={topRated} saved={saved} actions={actions} t={t}
              />
            )}

            {browsing && roleGroups.map((g) => (
              <Carousel
                key={g.role} title={t(g.title)} subtitle={t(g.sub)} count={g.count} onViewAll={() => viewAllRole(g.role)} viewAllLabel={t('viewAll')}
                shops={g.top} saved={saved} actions={actions} t={t}
              />
            ))}

            <Reveal as="section" aria-label={t('allShopsTitle')} className="pt-6">
              <div id="shop-results" ref={gridRef} className="mb-4 flex scroll-mt-40 flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold sm:text-2xl">{t('allShopsTitle')}</h2>
                  <p className="mt-1 text-sm font-medium text-[color:var(--mut)]" aria-live="polite">
                    <b dir="ltr" className="tabular-nums">{filteredShops.length}</b> {t('shopsFound')}
                  </p>
                </div>
                {activeFiltersCount > 0 && (
                  <button type="button" onClick={clearFilters} className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-extrabold text-[color:var(--acc)] transition-colors hover:bg-[color:var(--hov)] ${FOCUS}`}>
                    <FiX className="h-4 w-4" aria-hidden="true" />{t('clearAll')}
                  </button>
                )}
              </div>

              {(selectedShopTypes.length > 0 || selectedCities.length > 0) && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {selectedShopTypes.map((ty) => <Chip key={`ty-${ty}`} active onClick={() => toggleShopType(ty)} onRemove>{ty}</Chip>)}
                  {selectedCities.map((c) => <Chip key={`c-${c}`} active onClick={() => toggleCity(c)} onRemove>{c}</Chip>)}
                </div>
              )}

              {filteredShops.length === 0 ? (
                <EmptyState
                  title={shops.length ? t('noMatch') : t('noShops')} text={shops.length ? t('tryRemoveFilter') : t('newShopsSoon')}
                  action={shops.length > 0 ? t('clearFilters') : null} onAction={clearFilters}
                />
              ) : (
                <>
                  <div className={GRID_CLASS}>
                    {visibleShops.map((s, i) => (
                      <ShopCell key={s.id} index={i % BATCH}>
                        <ShopCard shop={s} isSaved={saved.has(s.id)} actions={actions} t={t} eager={i < 4} />
                      </ShopCell>
                    ))}
                  </div>
                  <InfiniteSentinel hasMore={hasMore} shown={visibleCount} total={filteredShops.length} onMore={loadMore} t={t} />
                </>
              )}
            </Reveal>
          </>
        )}
      </main>

      {showTop && (
        <div className="hp-pop fixed bottom-5 end-5 z-40">
          <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} title={t('backToTop')} className={`${ICON_BTN} !h-12 !w-12 bg-emerald-600 text-white shadow-lg shadow-black/40 hover:bg-emerald-500`}>
            <FiArrowUp className="h-5 w-5" />
          </button>
        </div>
      )}

      {sheet !== 'closed' && filterPanelProps && (
        <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t('filters')}>
          <div className={`absolute inset-0 bg-[color:var(--overlay)] ${sheet === 'leave' ? 'hp-fade-out' : 'hp-fade-in'}`} onClick={closeSheet} />
          <div
            className={`${sheet === 'leave' ? 'hp-drawer-out' : 'hp-drawer'} absolute inset-y-0 start-0 flex w-[22rem] min-w-0 max-w-[90vw] transform-gpu flex-col border-e border-[color:var(--line)] bg-[color:var(--panel)] md:w-96`}
          >
            <div className="hp-sb min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 pe-5">
              <FilterPanel {...filterPanelProps} onClose={closeSheet} />
            </div>
            <div className="border-t border-[color:var(--line)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => { closeSheet(); scrollToGrid(); }} className={`${BTN_PRIMARY} w-full`}>{t('showShops', { count: filteredShops.length })}</button>
            </div>
          </div>
        </div>
      )}

      {detailsShop && (
        <ShopDetailsModal key={detailsShop.id} shop={detailsShop} onClose={closeDetails} onOpen={openFromModal} onDirections={directionsFromModal} t={t} />
      )}

      {directionsShop && (
        <DirectionsModal key={`dir-${directionsShop.id}`} shop={directionsShop} onClose={closeDirections} t={t} />
      )}
    </div>
  );
});

export { queryClient };
export default function Shops(props) {
  return (
    <DarkCtx.Provider value={Boolean(props.darkMode)}>
      <QueryClientProvider client={queryClient}>
        <ShopsContent {...props} />
      </QueryClientProvider>
    </DarkCtx.Provider>
  );
}