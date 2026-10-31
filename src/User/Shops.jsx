import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useId, memo, Suspense, lazy, useDeferredValue, useTransition,
} from 'react';
import { useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiMapPin, FiPhone, FiX, FiSliders, FiGrid, FiList, FiArrowRight, FiArrowUp, FiCheck,
  FiShield, FiTool, FiRefreshCw, FiShoppingBag, FiExternalLink, FiInfo, FiNavigation,
  FiMessageSquare, FiPackage, FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch, FiHeart,
} from 'react-icons/fi';
import { RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
import api from '../common/api/api';
import { resolveImageSrc } from '../common/utils/productutils';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import {
  roleStyle, getShopRole, serviceLabel, addressLine, directionsUrl,
} from '../common/utils/shopsutils';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { LISTING_CSS, useBackToTop, useModalLock } from '../components/user/ListingKit';
import { IsoIllustration, isoRoleKey } from '../components/user/IsoIllustrations';

const Hero = lazy(() => import('../components/user/Hero'));
const DeliveryMap = lazy(() => import('../Delivery/DeliveryMap'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, gcTime: 10 * 60 * 1000 } },
});

const MOBILE_QUERY = '(max-width: 1023.98px)';
const MOBILE_BATCH = 8;
const SAVED_KEY = 'nb_saved_shops';
const SAVED_MAX = 500;
const SHOP_PAGE_SIZES = [10, 15, 20, 30];
const FEATURED_LIMIT = 5;
const FAVORITES_LIMIT = 4;
const SPECIALTY_LIMIT = 6;
const EXIT_MS = 180;
const STATS_STALE = 5 * 60 * 1000;
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));

const DARK_PAGE = 'bg-[#141414]';
const LAZY_SECTION = '[content-visibility:auto] [contain-intrinsic-size:auto_760px]';
const SHOP_GRID = 'grid grid-cols-2 gap-3 pb-2 pe-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5';
const FAVORITES_GRID = 'grid grid-cols-2 gap-3 pb-2 pe-2 sm:gap-4 md:grid-cols-4';

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
  const raw = String(s?.logoUrl ?? s?.logo ?? s?.logoPath ?? s?.shopLogo ?? '').trim();
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
    eyebrowSpecialties: 'Specialties', eyebrowShops: 'Directory', prevPage: 'Previous page', nextPage: 'Next page', pageN: 'Page {{n}}',
    noAddress: 'No address listed', loadingMore: 'Loading more shops', endOfList: 'You have seen all shops',
    save: 'Save shop', saved: 'Saved', savedOnly: 'Saved only', directionsTo: 'Directions to', yourLocation: 'Your location',
    locating: 'Finding your location', locationDenied: 'We could not get your location. The shop is shown on the map.',
    openInMaps: 'Open in Maps', retryLocation: 'Try again',
    moreFilters: 'More filters', ratedOnly: 'Has ratings', hasPhone: 'Has phone number', hasAddress: 'Has address',
    repairAndSell: 'Repair & sell', sortVerified: 'Verified first',
  },
  ar: {
    reviewOne: 'تقييم', reviewMany: 'تقييمات', productOne: 'منتج', productMany: 'منتجات',
    eyebrowSpecialties: 'التخصصات', eyebrowShops: 'الدليل', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية', pageN: 'صفحة {{n}}',
    noAddress: 'لا يوجد عنوان مسجل', loadingMore: 'جارٍ تحميل المزيد من المتاجر', endOfList: 'لقد شاهدت جميع المتاجر',
    save: 'حفظ المتجر', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', directionsTo: 'الاتجاهات إلى', yourLocation: 'موقعك',
    locating: 'جارٍ تحديد موقعك', locationDenied: 'تعذر تحديد موقعك. يظهر المتجر على الخريطة.',
    openInMaps: 'فتح في الخرائط', retryLocation: 'إعادة المحاولة',
    moreFilters: 'فلاتر إضافية', ratedOnly: 'لديه تقييمات', hasPhone: 'لديه رقم هاتف', hasAddress: 'لديه عنوان',
    repairAndSell: 'صيانة وبيع', sortVerified: 'الموثقة أولاً',
  },
  fr: {
    reviewOne: 'avis', reviewMany: 'avis', productOne: 'produit', productMany: 'produits',
    eyebrowSpecialties: 'Spécialités', eyebrowShops: 'Annuaire', prevPage: 'Page précédente', nextPage: 'Page suivante', pageN: 'Page {{n}}',
    noAddress: 'Aucune adresse indiquée', loadingMore: "Chargement d'autres boutiques", endOfList: 'Vous avez vu toutes les boutiques',
    save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrées uniquement', directionsTo: 'Itinéraire vers', yourLocation: 'Votre position',
    locating: 'Localisation en cours', locationDenied: "Position introuvable. La boutique est affichée sur la carte.",
    openInMaps: 'Ouvrir dans Maps', retryLocation: 'Réessayer',
    moreFilters: 'Plus de filtres', ratedOnly: 'Avec des notes', hasPhone: 'Avec téléphone', hasAddress: 'Avec adresse',
    repairAndSell: 'Réparation & vente', sortVerified: 'Vérifiées d’abord',
  },
};

const tr = (lang, key, params) => {
  const raw = SHOPS_TRANSLATIONS[lang]?.[key] ?? EXTRA[lang]?.[key] ?? SHOPS_TRANSLATIONS.en?.[key] ?? EXTRA.en[key] ?? key;
  const text = typeof raw === 'string' ? raw : String(key);
  return params ? text.replace(/\{\{(\w+)\}\}/g, (_, k) => (params[k] !== undefined ? params[k] : '')) : text;
};

const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '').slice(0, 20)}`;

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
  }, []);
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

const useShopLogo = (shop, active) => {
  const id = shop.id;
  const listLogo = useMemo(() => shopLogoSrc(shop), [shop]);
  const q = useQuery({
    queryKey: ['shop', id],
    queryFn: async ({ signal }) => {
      try {
        return (await api.get(`/api/shops/${encodeURIComponent(id)}`, { signal })).data;
      } catch (e) {
        if (signal?.aborted) throw e;
        return null;
      }
    },
    select: shopLogoSrc,
    enabled: active && !listLogo && id != null,
    staleTime: STATS_STALE,
    retry: false,
    refetchOnMount: false,
  });
  return listLogo || q.data || null;
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
const VIEW_MODES = [['grid', FiGrid, 'gridView'], ['list', FiList, 'listView']];

const HL = (hex) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23${hex}' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")`;

const PX_CSS = `
.hp-hl,.hp-hl-dark,.hp-hl-gold,.hp-hl-gold-dark{padding-bottom:.2em;background-position:left bottom;background-repeat:no-repeat;background-size:100% .3em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.hp-hl{background-image:${HL('10b981')}}
.hp-hl-dark{background-image:${HL('39ff88')}}
.hp-hl-gold{background-image:${HL('f59e0b')}}
.hp-hl-gold-dark{background-image:${HL('facc15')}}
@keyframes hpPop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.hp-pop{animation:hpPop .14s ease-out both;transform-origin:top}
@keyframes hpRise{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
.hp-rise{animation:hpRise .32s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*30ms)}
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
.hp-fade-in{animation:hpFadeIn .18s ease-out both}
.hp-fade-out{animation:hpFadeOut .18s ease-in both}
.hp-modal-in{animation:hpModalIn .24s cubic-bezier(.2,.8,.2,1) both}
.hp-modal-out{animation:hpModalOut .18s ease-in both}
.hp-drawer{animation:hpDrawerIn .24s cubic-bezier(.2,.8,.2,1) both}
.hp-drawer-out{animation:hpDrawerOut .18s ease-in both}
.hp-search::-webkit-search-cancel-button,.hp-search::-webkit-search-decoration{display:none;-webkit-appearance:none}
.hp-glow{background-image:radial-gradient(circle at 6% 0%,rgba(52,211,153,.2),transparent 38%),radial-gradient(circle at 96% 100%,rgba(249,115,22,.1),transparent 36%)}
.hp-glow-dark{background-image:radial-gradient(circle at 6% 0%,rgba(57,255,136,.09),transparent 38%),radial-gradient(circle at 96% 100%,rgba(249,115,22,.07),transparent 36%)}
.hp-pattern{--p1:rgba(4,38,26,.13);--p2:rgba(16,185,129,.12);background-image:radial-gradient(circle at 2px 2px,var(--p1) 1.6px,transparent 1.8px),repeating-linear-gradient(135deg,var(--p2) 0 2px,transparent 2px 18px);background-size:22px 22px,auto}
.hp-pattern-dark{--p1:rgba(57,255,136,.14);--p2:rgba(57,255,136,.06)}
.hp-media{--m-dot:rgba(4,38,26,.14);background-image:radial-gradient(circle at 1px 1px,var(--m-dot) 1px,transparent 1.4px);background-size:14px 14px}
.hp-media-dark{--m-dot:rgba(57,255,136,.16)}
.hp-cat{--dx:1;--c-card:#ffffff;--c-ink:#04261a;--c-line:#04261a;--c-acc:#10b981;--c-on:#04261a}
[dir="rtl"] .hp-cat{--dx:-1}
.hp-cat-dark{--c-card:#2a2a2a;--c-ink:#ffffff;--c-line:#000000;--c-acc:#39ff88;--c-on:#022c22}
.hp-dot{display:flex;flex-direction:column;align-items:center;gap:.5rem;background:var(--c-card);color:var(--c-ink);cursor:pointer;border:3px solid var(--c-line);border-radius:1rem;box-shadow:calc(var(--dx)*5px) 5px 0 0 var(--c-line);transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,color .2s ease}
.hp-dot-on{background:var(--c-acc);color:var(--c-on)}
@media (hover:hover){.hp-dot:hover{background:var(--c-acc);color:var(--c-on);transform:translateY(-4px);box-shadow:calc(var(--dx)*7px) 9px 0 0 var(--c-line)}}
.hp-dot:active{transform:translateY(2px);box-shadow:calc(var(--dx)*2px) 2px 0 0 var(--c-line)}
.hp-dot:focus-visible{outline:3px solid var(--c-acc);outline-offset:4px}
html[data-hp-theme]{--sb-thumb:#34d399;--sb-thumb-hover:#6ee7b7;--sb-track:#e8ebe9;--sb-ink:#022c22}
html[data-hp-theme="dark"]{--sb-thumb:#39ff88;--sb-thumb-hover:#86ffb4;--sb-track:#1e1e1e;--sb-ink:#000000}
html[data-hp-theme],.hp-sb{scrollbar-width:thin;scrollbar-color:var(--sb-thumb) var(--sb-track)}
@supports selector(::-webkit-scrollbar){
html[data-hp-theme],.hp-sb{scrollbar-width:auto;scrollbar-color:auto}
html[data-hp-theme]::-webkit-scrollbar{width:14px;height:14px}
.hp-sb::-webkit-scrollbar{width:10px;height:10px}
html[data-hp-theme]::-webkit-scrollbar-track,.hp-sb::-webkit-scrollbar-track{background:var(--sb-track)}
html[data-hp-theme]::-webkit-scrollbar-track:vertical,.hp-sb::-webkit-scrollbar-track:vertical{border-left:3px solid var(--sb-ink)}
html[data-hp-theme]::-webkit-scrollbar-thumb,.hp-sb::-webkit-scrollbar-thumb{background:var(--sb-thumb);border:3px solid var(--sb-ink)}
html[data-hp-theme]::-webkit-scrollbar-thumb:hover,.hp-sb::-webkit-scrollbar-thumb:hover{background:var(--sb-thumb-hover)}
html[data-hp-theme]::-webkit-scrollbar-corner,.hp-sb::-webkit-scrollbar-corner{background:var(--sb-track)}
}
@media (prefers-reduced-motion:reduce){
.hp-pop,.hp-rise,.hp-load-dot,.hp-fade-in,.hp-fade-out,.hp-modal-in,.hp-modal-out,.hp-drawer,.hp-drawer-out{animation:none}
.hp-dot{transition:none}
.hp-dot:hover,.hp-dot:active{transform:none}
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

const STYLE_EL = <style>{`${UI3D_CSS}${LISTING_CSS}`}</style>;

const NEO_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#022c22] [--sh:#022c22] [--acc:#34d399] [--fld:#ffffff] [--txt:#022c22] [--mut:#4b5563] [--hist:#d1d5db] [--row:#ecfdf5]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#39ff88] [--fld:#1e1e1e] [--txt:#ffffff] [--mut:#a3a3a3] [--hist:#3a3a3a] [--row:#232323]',
};
const GOLD_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#422006] [--sh:#422006] [--acc:#fbbf24] [--fld:#ffffff] [--txt:#422006] [--mut:#78350f] [--hist:#fde68a] [--row:#fef3c7]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#facc15] [--fld:#1e1e1e] [--txt:#ffffff] [--mut:#a3a3a3] [--hist:#3a3a3a] [--row:#232323]',
};
const NEO_SURFACE = { light: 'bg-white', dark: 'bg-[#2a2a2a]' };
const GOLD_SURFACE = { light: 'bg-amber-50', dark: 'bg-[#2a2a2a]' };
const NEO_BOX = {
  lg: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]',
  sm: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--sh)]',
};
const NEO_PRESS =
  'transition-[transform,box-shadow] duration-200 motion-reduce:transition-none ' +
  '[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*8px)_10px_0_0_var(--sh)] ' +
  'active:translate-y-[2px] active:translate-x-[calc(var(--dx)*2px)] active:[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[color:var(--acc)]';
const neoCard = (darkMode, size = 'lg', press = false) => {
  const k = darkMode ? 'dark' : 'light';
  return `${NEO_THEME[k]} ${NEO_BOX[size]} ${NEO_SURFACE[k]}${press ? ` ${NEO_PRESS}` : ''}`;
};
const goldCard = (darkMode, press = false) => {
  const k = darkMode ? 'dark' : 'light';
  return `${GOLD_THEME[k]} ${NEO_BOX.sm} ${GOLD_SURFACE[k]}${press ? ` ${NEO_PRESS}` : ''}`;
};

const NEO_ICON =
  'inline-flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:[box-shadow:none] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const NEO_BTN =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:[box-shadow:none] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoBtn = (darkMode, active) => {
  const k = darkMode ? 'dark' : 'light';
  const tone = active ? 'bg-[color:var(--acc)] text-emerald-950' : `${NEO_SURFACE[k]} ${darkMode ? 'text-white' : 'text-emerald-950'}`;
  return `${NEO_THEME[k]} ${NEO_BTN} ${tone}`;
};
const CARD_BTN = `${NEO_BTN} min-w-0 flex-1 !min-h-10 !px-2 !py-1.5 !text-[11px] bg-[color:var(--fld)] text-[color:var(--txt)]`;
const CARD_BTN_ACC = `${NEO_BTN} min-w-0 flex-1 !min-h-10 !px-2 !py-1.5 !text-[11px] bg-[color:var(--acc)] text-emerald-950`;

const FIELD =
  'min-h-11 w-full rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--fld)] px-3 py-2.5 text-sm font-semibold text-[color:var(--txt)] outline-none ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const TEXT_LINK = `min-h-11 cursor-pointer text-xs font-extrabold underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 text-[color:var(--txt)] ${FOCUS}`;

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

const SectionTitle = memo(({ label, title, subtitle, count, darkMode, isAr, gold, children }) => {
  const hl = gold ? (darkMode ? 'hp-hl-gold-dark' : 'hp-hl-gold') : (darkMode ? 'hp-hl-dark' : 'hp-hl');
  const bar = gold
    ? (darkMode ? 'border-black bg-[#facc15]' : 'border-amber-950 bg-amber-400')
    : (darkMode ? 'border-[#39ff88] bg-[#39ff88]' : 'border-emerald-950 bg-emerald-400');
  const ink = darkMode ? 'text-white' : gold ? 'text-amber-950' : 'text-emerald-950';
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-14">
      <div className="min-w-0 max-w-3xl">
        {label && (
          <div className="mb-5 flex items-center gap-3">
            <span aria-hidden="true" className={`h-3.5 w-12 rounded-full border-2 ${bar}`} />
            <span className={`text-sm font-bold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${ink}`}>{label}</span>
          </div>
        )}
        <h2
          className={`text-3xl font-extrabold [text-wrap:balance] sm:text-5xl lg:text-6xl ${
            isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.18] tracking-[-0.04em]'
          } ${ink}`}
        >
          {parts.map(({ part, hl: on }, i) => (on ? <span key={i} className={hl}>{part}</span> : part))}
          {count != null && <span dir="ltr" className="ms-3 align-middle text-xl font-bold tabular-nums opacity-70 sm:text-2xl">({count})</span>}
        </h2>
        {subtitle && (
          <p className={`mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${darkMode ? 'text-neutral-300' : 'text-gray-800'}`}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
});

const Dropdown = memo(({ id, value, options, onChange, ariaLabel, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const listId = `${id}-list`;
  const selectedIdx = Math.max(0, options.findIndex((o) => String(o.value) === String(value)));
  const current = options[selectedIdx];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => { if (open) setActive(selectedIdx); }, [open, selectedIdx]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

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

  const surface = 'bg-[color:var(--fld)] text-[color:var(--txt)]';

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-30' : ''} ${className}`}>
      <button
        ref={btnRef} id={id} type="button" role="combobox" aria-label={ariaLabel}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
        aria-activedescendant={open ? `${id}-o${active}` : undefined}
        onClick={() => setOpen((o) => !o)} onKeyDown={onKeyDown}
        className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-[color:var(--ink)] px-3 text-start text-sm font-semibold outline-none ${FOCUS} ${surface}`}
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef} id={listId} role="listbox" tabIndex={-1}
          className={`hp-pop hp-sb absolute end-0 top-full z-30 mt-2 max-h-60 min-w-full overflow-y-auto overscroll-contain rounded-xl border-[3px] border-[color:var(--ink)] py-1 [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] ${surface}`}
        >
          {options.map((o, i) => {
            const selected = String(o.value) === String(value);
            return (
              <li
                key={String(o.value)} id={`${id}-o${i}`} role="option" aria-selected={selected}
                onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-sm font-bold transition-colors duration-100 ${
                  selected ? 'bg-[color:var(--acc)] text-emerald-950' : i === active ? 'bg-[color:var(--hist)]' : ''
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

const SearchField = memo(({ value, onChange, placeholder, ariaLabel, clearLabel, pending }) => {
  const inputRef = useRef(null);
  const handleClear = useCallback(() => { onChange(''); inputRef.current?.focus(); }, [onChange]);
  return (
    <div className="relative min-w-0 flex-1" role="search">
      <FiSearch aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--txt)]" />
      <input
        ref={inputRef} type="search" inputMode="search" autoComplete="off" maxLength={100}
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={ariaLabel}
        className={`${FIELD} hp-search ps-10 pe-16`}
      />
      <div className="absolute end-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {pending && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent text-[color:var(--txt)] motion-reduce:animate-none" />}
        {value && (
          <button type="button" onClick={handleClear} aria-label={clearLabel} className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[color:var(--txt)] ${FOCUS}`}>
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

const InfoRow = ({ icon: Icon, className = '', children }) => (
  <p className={`flex min-w-0 items-start gap-1.5 text-xs font-medium leading-snug text-[color:var(--txt)] ${className}`}>
    <Icon aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[color:var(--acc)]" />
    <span className="line-clamp-2 min-w-0 break-words">{children}</span>
  </p>
);

const NoAddress = memo(({ t }) => <span className="font-bold text-[color:var(--deal,#b45309)]">{t('noAddress')}</span>);

const PhoneLink = ({ phone }) => (
  <a href={telHref(phone)} onClick={(e) => e.stopPropagation()} dir="ltr" className="hover:underline focus-visible:underline">
    {clean(String(phone), 30)}
  </a>
);

const VerifiedMark = memo(({ label, darkMode }) => (
  <span className="inline-flex flex-shrink-0" title={label}>
    <RiVerifiedBadgeLine aria-hidden="true" className={`h-4 w-4 ${darkMode ? 'text-[#39ff88]' : 'text-emerald-600'}`} />
    <span className="sr-only">{label}</span>
  </span>
));

const AWNING_STRIPES = [0, 1, 2, 3, 4];

const GoldShopArt = memo(({ darkMode }) => {
  const ink = darkMode ? '#000000' : '#422006';
  const wall = darkMode ? '#3f3f3f' : '#FEF3C7';
  const glass = darkMode ? '#FDE047' : '#FCD34D';
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full p-3" aria-hidden="true" focusable="false">
      <ellipse cx="100" cy="138" rx="76" ry="8" fill={darkMode ? '#000' : '#78350F'} opacity={darkMode ? 0.45 : 0.2} />
      <rect x="38" y="62" width="124" height="74" fill={wall} stroke={ink} strokeWidth="3" />
      {AWNING_STRIPES.map((i) => (
        <rect key={i} x={30 + i * 28} y="36" width="28" height="28" fill={i % 2 ? '#FFFFFF' : '#FBBF24'} stroke={ink} strokeWidth="3" />
      ))}
      <rect x="48" y="78" width="32" height="28" fill={glass} stroke={ink} strokeWidth="3" />
      <rect x="120" y="78" width="32" height="28" fill={glass} stroke={ink} strokeWidth="3" />
      <rect x="88" y="90" width="24" height="46" fill="#F59E0B" stroke={ink} strokeWidth="3" />
      <circle cx="106" cy="114" r="2.5" fill={ink} />
      <path d="M100 8l4.4 11 11.6 1-8.8 7.6 2.8 11.4L100 33l-10 6 2.8-11.4L84 20l11.6-1z" fill="#FBBF24" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
});

const ShopImage = memo(({ src, name, role, darkMode, eager = false, hover = true, gold = false }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  useEffect(() => { setFailed(false); setLoaded(false); }, [src]);
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src, failed]);
  const onError = useCallback(() => setFailed(true), []);
  const onLoad = useCallback(() => setLoaded(true), []);
  if (!src || failed) {
    if (gold) {
      return (
        <div className="absolute inset-0 flex items-end justify-center">
          <GoldShopArt darkMode={darkMode} />
        </div>
      );
    }
    return (
      <div className="absolute inset-0 flex items-end justify-center px-4 pt-4">
        <div className="flex h-full max-w-full items-end justify-center">
          <IsoIllustration
            type={isoRoleKey(role)} tone="emerald" darkMode={darkMode} onGreen={false}
            className={`pointer-events-none h-full w-auto max-w-full transition-transform duration-200 motion-reduce:transition-none ${hover ? 'group-hover:scale-105' : ''}`}
          />
        </div>
      </div>
    );
  }
  return (
    <>
      {!loaded && <div aria-hidden="true" className={`absolute inset-0 animate-pulse motion-reduce:animate-none ${darkMode ? 'bg-[#2a2a2a]' : 'bg-black/5'}`} />}
      <img
        ref={imgRef} src={src} alt={name || ''} width={400} height={300}
        loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} decoding="async" referrerPolicy="no-referrer"
        onLoad={onLoad} onError={onError}
        className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-300 motion-reduce:transition-none ${hover ? '[@media(hover:hover)]:group-hover:scale-105' : ''} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
});

const ShopStats = memo(({ shop, active, t, className = '' }) => {
  const { reviews, products } = useShopCounts(shop, active);
  const plus = (n) => (n == null ? '+–' : `+${n}`);
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-[color:var(--txt)] ${className}`}>
      <span className="inline-flex min-w-0 items-center gap-1">
        <FiMessageSquare aria-hidden="true" className="h-3 w-3 flex-shrink-0 text-[color:var(--acc)]" />
        <span dir="ltr" className="tabular-nums">{plus(reviews)}</span> <span className="truncate">{reviews === 1 ? t('reviewOne') : t('reviewMany')}</span>
      </span>
      <span className="inline-flex min-w-0 items-center gap-1">
        <FiPackage aria-hidden="true" className="h-3 w-3 flex-shrink-0 text-[color:var(--acc)]" />
        <span dir="ltr" className="tabular-nums">{plus(products)}</span> <span className="truncate">{products === 1 ? t('productOne') : t('productMany')}</span>
      </span>
    </div>
  );
});

const ShopCard = memo(({ shop, darkMode, layout = 'grid', gold = false, isSaved = false, actions, t }) => {
  const { onDetails, onOpen, onDirections, onSave } = actions;
  const role = getShopRole(shop);
  const rs = roleStyle(role);
  const address = addressLine(shop);
  const isList = layout === 'list';
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const snippet = clean(shop.description, 110) || t('noDescription');
  const [cardRef, seen] = useSeen();
  const logo = useShopLogo(shop, seen);
  const accent = gold ? (darkMode ? 'text-[#facc15]' : 'text-amber-700') : (darkMode ? 'text-[#39ff88]' : 'text-emerald-700');
  const open = useCallback(() => onOpen(shop.id), [onOpen, shop.id]);
  const showDetails = useCallback((e) => { e.stopPropagation(); onDetails(shop); }, [onDetails, shop]);
  const visit = useCallback((e) => { e.stopPropagation(); open(); }, [open]);
  const directions = useCallback((e) => { e.stopPropagation(); onDirections(shop); }, [onDirections, shop]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(shop.id); }, [onSave, shop.id]);
  const mediaBg = gold ? (darkMode ? 'bg-[#1e1e1e]' : 'bg-amber-100') : (darkMode ? 'hp-media hp-media-dark bg-[#1e1e1e]' : 'bg-white');

  return (
    <article
      ref={cardRef}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={shop.name || t('unnamedShop')}
      className={`group relative h-full cursor-pointer overflow-hidden ${gold ? goldCard(darkMode, true) : neoCard(darkMode, 'sm', true)} ${isList ? 'sm:!flex-row' : ''}`}
    >
      <div
        className={`flex flex-shrink-0 flex-col border-b-[3px] border-[color:var(--ink)] ${
          isList ? 'w-full sm:w-56 sm:border-b-0 sm:border-e-[3px]' : 'w-full'
        }`}
      >
        <div
          className={`relative w-full overflow-hidden [contain:layout_paint] ${mediaBg} ${
            isList ? 'h-40 sm:h-auto sm:min-h-[9rem] sm:flex-1' : 'h-40 sm:h-44'
          }`}
        >
          <ShopImage src={logo} name={shop.name} role={role} darkMode={darkMode} gold={gold} />
        </div>
        <div className="flex items-center gap-2 border-t-[3px] border-[color:var(--ink)] bg-[color:var(--row)] p-2">
          <button type="button" onClick={directions} aria-label={t('getDirections')} title={t('getDirections')} className={CARD_BTN_ACC}>
            <FiNavigation className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{t('getDirections')}</span>
          </button>
          <button
            type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
            className={`${NEO_ICON} !h-10 !w-10 ${isSaved ? '' : '!bg-white'}`}
          >
            <FiHeart className={`h-4 w-4 ${isSaved ? 'text-rose-600' : ''}`} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <div className="flex flex-1 flex-col gap-1.5 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-extrabold uppercase leading-snug text-[color:var(--txt)]">
              <span className="truncate">{shop.name || t('unnamedShop')}</span>
              {shop.verified && <VerifiedMark label={t('verified')} darkMode={darkMode} />}
            </h3>
            {hasRating && (
              <span className={`flex flex-shrink-0 items-center gap-1 text-xs font-extrabold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                <RiStarFill className="h-3.5 w-3.5" aria-hidden="true" /><span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
              </span>
            )}
          </div>
          <p className={`flex min-w-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${accent}`}>
            <rs.icon aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{serviceLabel(role, t)}{shop.shopType ? ` · ${shop.shopType}` : ''}</span>
          </p>
          <InfoRow icon={FiMapPin}>{address || <NoAddress t={t} />}</InfoRow>
          <p className="line-clamp-2 text-xs font-medium leading-relaxed text-[color:var(--mut)]">{snippet}</p>
          <ShopStats shop={shop} active={seen} t={t} className="mt-0.5" />
          {shop.phone && <InfoRow icon={FiPhone}><PhoneLink phone={shop.phone} /></InfoRow>}
        </div>
        <div className="mt-auto flex items-center gap-2 border-t-2 border-[color:var(--ink)] pt-3">
          <button type="button" onClick={showDetails} aria-label={t('details')} title={t('details')} className={CARD_BTN}>
            <FiInfo className="h-4 w-4 flex-shrink-0" aria-hidden="true" /> <span className="truncate">{t('details')}</span>
          </button>
          <button type="button" onClick={visit} aria-label={t('visitShop')} title={t('visitShop')} className={`${NEO_ICON} !h-10 !w-10`}>
            <FiArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </article>
  );
});

const ShopCell = ({ index, children }) => (
  <div className="hp-rise min-w-0" style={STAGGER[index % STAGGER.length]}>{children}</div>
);

const DirectionsModal = memo(({ shop, darkMode, onClose, t }) => {
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
      <div className={`absolute inset-0 bg-black/60 ${leaving ? 'hp-fade-out' : 'hp-fade-in'}`} onClick={close} />
      <div className={`${leaving ? 'hp-modal-out' : 'hp-modal-in'} hp-sb relative max-h-[94vh] w-full transform-gpu overflow-y-auto overscroll-contain rounded-b-none sm:max-w-2xl sm:rounded-b-2xl ${neoCard(darkMode, 'lg')}`}>
        <div className="relative flex items-center gap-3 border-b-[3px] border-[color:var(--ink)] p-4 pe-16">
          <span aria-hidden="true" className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950"><FiNavigation className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1 text-[color:var(--txt)]">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[color:var(--mut)]">{t('directionsTo')}</p>
            <h2 className="line-clamp-1 text-base font-extrabold uppercase sm:text-lg">{name}</h2>
            <p className="line-clamp-1 text-xs font-medium text-[color:var(--mut)]">{address || t('noAddress')}</p>
          </div>
          <button type="button" onClick={close} aria-label={t('close')} className={`${NEO_ICON} absolute end-3 top-3 !h-10 !w-10`}>
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-3 sm:p-4">
          <Suspense fallback={<div className={`w-full animate-pulse rounded-xl motion-reduce:animate-none ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70'}`} style={{ aspectRatio: isMobile ? '1 / 1' : '1 / 0.62' }} />}>
            <DeliveryMap
              items={items}
              selectedId={origin ? shop.id : null}
              onSelect={noop}
              aspect={isMobile ? 1 : 0.62}
              startLabel={t('yourLocation')}
              endLabel={name}
              className="!rounded-xl !border-[3px] !border-[color:var(--ink)]"
            />
          </Suspense>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="status" aria-live="polite" className="min-w-0 flex-1 text-xs font-bold text-[color:var(--txt)]">
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
                <button type="button" onClick={locate} className={`${neoBtn(darkMode, false)} !min-h-10 !px-3 !py-1.5 !text-xs`}>
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" /> {t('retryLocation')}
                </button>
              )}
              <a href={directionsUrl(shop, null)} target="_blank" rel="noopener noreferrer nofollow" className={`${neoBtn(darkMode, true)} !min-h-10 !px-3 !py-1.5 !text-xs`}>
                <FiExternalLink className="h-4 w-4" aria-hidden="true" /> {t('openInMaps')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ShopDetailsModal = memo(({ shop, darkMode, onClose, onOpen, onDirections, t }) => {
  const [leaving, close] = useExit(onClose);
  const role = getShopRole(shop);
  const caps = capabilitiesFor(role);
  const address = addressLine(shop);
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const logo = useShopLogo(shop, true);
  const accent = darkMode ? 'text-[#39ff88]' : 'text-emerald-700';

  useModalLock(true, close);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name || t('unnamedShop')}>
      <div className={`absolute inset-0 bg-black/60 ${leaving ? 'hp-fade-out' : 'hp-fade-in'}`} onClick={close} />
      <div className={`${leaving ? 'hp-modal-out' : 'hp-modal-in'} hp-sb group relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain rounded-b-none sm:max-w-lg sm:rounded-b-2xl ${neoCard(darkMode, 'lg')}`}>
        <div className={`relative h-44 w-full flex-shrink-0 overflow-hidden border-b-[3px] border-[color:var(--ink)] sm:h-52 ${darkMode ? 'hp-media hp-media-dark bg-[#1e1e1e]' : 'bg-white'}`}>
          <ShopImage src={logo} name={shop.name} role={role} darkMode={darkMode} eager hover={false} />
          <div className="absolute end-3 top-3 z-10 flex items-center gap-2">
            <button type="button" onClick={() => onDirections(shop)} aria-label={t('getDirections')} title={t('getDirections')} className={`${NEO_ICON} !h-10 !w-10`}>
              <FiNavigation className="h-4 w-4" />
            </button>
            <button type="button" onClick={close} aria-label={t('close')} className={`${NEO_ICON} !h-10 !w-10 !bg-white`}>
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b-[3px] border-[color:var(--ink)] p-4 text-[color:var(--txt)] sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase leading-snug sm:text-xl">
            <span className={`line-clamp-2 ${darkMode ? 'hp-hl-dark' : 'hp-hl'}`}>{shop.name || t('unnamedShop')}</span>
            {shop.verified && <VerifiedMark label={t('verified')} darkMode={darkMode} />}
          </h2>
          <p className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-extrabold uppercase tracking-wide ${accent}`}>
            <span>{serviceLabel(role, t)}</span>
            {hasRating && (
              <span className={`inline-flex items-center gap-1 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                <RiStarFill className="h-3.5 w-3.5" aria-hidden="true" /><span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
              </span>
            )}
          </p>
          <ShopStats shop={shop} active t={t} className="mt-2" />
        </div>

        <div className="space-y-6 p-4 text-[color:var(--txt)] sm:p-5">
          <section>
            <h3 className="mb-2 text-sm font-extrabold uppercase"><span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{t('about')}</span></h3>
            <p className="text-sm font-medium leading-relaxed text-[color:var(--mut)]">{clean(shop.description, 1000) || t('noDescription')}</p>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-extrabold uppercase"><span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{t('whatShopCanDo')}</span></h3>
            <ul className="grid gap-3">
              {caps.map(({ icon: Icon, titleKey, textKey }) => (
                <li key={titleKey} className="flex items-start gap-3">
                  <span aria-hidden="true" className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">{t(titleKey)}</p>
                    <p className="text-xs font-medium text-[color:var(--mut)]">{t(textKey)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2.5 rounded-xl border-[3px] border-dashed border-[color:var(--ink)] bg-[color:var(--row)] p-3.5">
            {shop.shopType && <InfoRow icon={FiShoppingBag}>{shop.shopType}</InfoRow>}
            <InfoRow icon={FiMapPin}>{address || <NoAddress t={t} />}</InfoRow>
            {shop.phone && <InfoRow icon={FiPhone}><PhoneLink phone={shop.phone} /></InfoRow>}
          </section>

          <div className="grid grid-cols-2 gap-3 pb-1 pe-1">
            <button type="button" onClick={close} className={neoBtn(darkMode, false)}>{t('close')}</button>
            <button type="button" onClick={() => onOpen(shop.id)} className={neoBtn(darkMode, true)}><FiExternalLink className="h-4 w-4" aria-hidden="true" /> {t('visitShop')}</button>
          </div>
        </div>
      </div>
    </div>
  );
});

const SpecialtyGrid = memo(({ shopTypes, countsByType, selected, onToggle, darkMode, isAr, title, subtitle, t }) => {
  const top = useMemo(() => [...shopTypes].sort((a, b) => (countsByType[b] || 0) - (countsByType[a] || 0)).slice(0, SPECIALTY_LIMIT), [shopTypes, countsByType]);
  if (!top.length) return null;
  return (
    <section aria-label={title} className={`hp-glow ${darkMode ? `hp-glow-dark ${DARK_PAGE}` : 'bg-gray-50'} py-14 sm:py-20 ${LAZY_SECTION}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle darkMode={darkMode} isAr={isAr} label={t('eyebrowSpecialties')} title={title} subtitle={subtitle} />
        <div className={`hp-cat ${darkMode ? 'hp-cat-dark' : ''}`}>
          <div className="grid grid-cols-2 gap-4 pb-2 pe-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {top.map((type) => {
              const active = selected.includes(type);
              const count = countsByType[type] || 0;
              return (
                <button
                  key={type} type="button" onClick={() => onToggle(type)} aria-pressed={active}
                  className={`hp-dot group relative min-h-11 p-3 pt-6 text-center sm:gap-2.5 sm:p-4 sm:pt-7 ${active ? 'hp-dot-on' : ''}`}
                >
                  <IsoIllustration
                    type="shop_store" darkMode={darkMode} onGreen={false}
                    className="h-14 w-14 transition-transform duration-200 motion-reduce:transition-none group-hover:scale-110 sm:h-16 sm:w-16"
                  />
                  <span className="line-clamp-1 w-full text-sm font-extrabold uppercase">{type}</span>
                  <span className="text-xs font-bold opacity-80"><span dir="ltr" className="tabular-nums">{count}</span> {count === 1 ? t('shopSingular') : t('shopPlural')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});

const FavoritesSection = memo(({ shops, darkMode, isAr, t, actions, saved }) => (
  <section
    aria-label={t('customerFavorites')}
    className={`border-y-4 py-14 sm:py-20 ${LAZY_SECTION} ${darkMode ? 'border-[#facc15]/40 bg-[#1a1708]' : 'border-amber-300 bg-white'}`}
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle gold darkMode={darkMode} isAr={isAr} label={t('topRated')} title={t('customerFavorites')} subtitle={t('topRatedSubtitle')} />
      <div className={FAVORITES_GRID}>
        {shops.map((s, i) => (
          <ShopCell key={s.id} index={i}>
            <ShopCard shop={s} darkMode={darkMode} gold isSaved={saved.has(s.id)} actions={actions} t={t} />
          </ShopCell>
        ))}
      </div>
    </div>
  </section>
));

const RoleSections = memo(({ shops, darkMode, isAr, t, actions, saved, onViewAll }) => {
  const groups = useMemo(() => ROLE_SECTIONS.map((sec) => {
    const list = shops.filter((s) => getShopRole(s) === sec.role);
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return { ...sec, list, top: list.slice(0, FEATURED_LIMIT) };
  }).filter((g) => g.list.length), [shops]);

  if (!groups.length) return null;
  return (
    <>
      {groups.map(({ role, title, sub, list, top }, gi) => (
        <section
          key={role} aria-label={t(title)}
          className={`${gi % 2 === 0 ? `hp-pattern ${darkMode ? 'hp-pattern-dark' : ''}` : `hp-glow ${darkMode ? 'hp-glow-dark' : ''}`} ${darkMode ? DARK_PAGE : 'bg-gray-50'} py-14 sm:py-20 ${LAZY_SECTION}`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle darkMode={darkMode} isAr={isAr} label={serviceLabel(role, t)} title={t(title)} count={list.length} subtitle={t(sub)}>
              <div className="pb-2 pe-2">
                <button type="button" onClick={() => onViewAll(role)} className={neoBtn(darkMode, true)}>
                  {t('viewAll')} <FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </button>
              </div>
            </SectionTitle>
            <div className={SHOP_GRID}>
              {top.map((s, i) => (
                <ShopCell key={s.id} index={i}>
                  <ShopCard shop={s} darkMode={darkMode} isSaved={saved.has(s.id)} actions={actions} t={t} />
                </ShopCell>
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
    className={`flex min-h-11 w-full cursor-pointer items-center gap-2.5 py-1 text-start text-sm font-bold text-[color:var(--txt)] ${FOCUS}`}
  >
    <span
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 border-[color:var(--ink)] transition-colors duration-150 motion-reduce:transition-none ${type === 'radio' ? 'rounded-full' : 'rounded-md'} ${
        selected ? 'bg-[color:var(--acc)] text-emerald-950' : 'bg-[color:var(--fld)]'
      }`}
    >
      {selected && (type === 'check' ? <FiCheck className="h-3 w-3" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-emerald-950" />)}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className="text-xs font-semibold tabular-nums text-[color:var(--mut)]" dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ num, title, isOpen, onToggle, darkMode, children }) => (
  <section className="border-t-[3px] border-[color:var(--ink)]">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className={`flex min-h-11 w-full cursor-pointer items-center gap-3 py-3 text-start text-[color:var(--txt)] ${FOCUS}`}>
      <span aria-hidden="true" className={`text-xl font-black tabular-nums ${darkMode ? 'text-[#39ff88]' : 'text-emerald-600'}`}>{num}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-extrabold uppercase">{title}</span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="hp-pop min-w-0 pb-4">{children}</div>}
  </section>
));

const STAR = <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />;

const FilterPanel = memo((p) => {
  const {
    t, darkMode, onClose, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    savedOnly, setSavedOnly, ratedOnly, setRatedOnly, hasPhoneOnly, setHasPhoneOnly, hasAddressOnly, setHasAddressOnly,
    open, setOpen, clearFilters, activeFiltersCount,
  } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  let n = 0;
  const num = () => String(++n).padStart(2, '0');
  return (
    <div className="w-full min-w-0 text-[color:var(--txt)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-4">
        <h3 className="flex min-w-0 items-center gap-2 text-lg font-extrabold uppercase">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
          <span className={`truncate ${darkMode ? 'hp-hl-dark' : 'hp-hl'}`}>{t('filters')}</span>
        </h3>
        <div className="flex flex-shrink-0 items-center gap-3">
          {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className={TEXT_LINK}>{t('resetAll')}</button>}
          {onClose && <button type="button" onClick={onClose} aria-label={t('closeFilters')} className={`${NEO_ICON} !h-10 !w-10`}><FiX className="h-4 w-4" /></button>}
        </div>
      </div>

      <FilterBlock num={num()} title={t('serviceType')} isOpen={open.role} onToggle={() => toggle('role')} darkMode={darkMode}>
        <div className="min-w-0 break-words" role="radiogroup" aria-label={t('serviceType')}>
          <OptionRow type="radio" label={t('allShops')} count={roleCounts.ALL} selected={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')} />
          <OptionRow type="radio" label={t('repairServices')} count={roleCounts.REPAIRER} selected={roleFilter === 'REPAIRER'} onClick={() => setRoleFilter('REPAIRER')} />
          <OptionRow type="radio" label={t('sellTradeIn')} count={roleCounts.SELLER} selected={roleFilter === 'SELLER'} onClick={() => setRoleFilter('SELLER')} />
          <OptionRow type="radio" label={t('repairAndSell')} count={roleCounts.BOTH} selected={roleFilter === 'BOTH'} onClick={() => setRoleFilter('BOTH')} />
        </div>
      </FilterBlock>

      <FilterBlock num={num()} title={t('shopType')} isOpen={open.type} onToggle={() => toggle('type')} darkMode={darkMode}>
        {shopTypes.length === 0
          ? <p className="text-sm font-medium text-[color:var(--mut)]">{t('noTypes')}</p>
          : (
            <div className="hp-sb max-h-52 min-w-0 overflow-y-auto overscroll-contain break-words pe-2">
              {shopTypes.map((ty) => <OptionRow key={ty} type="check" label={ty} count={countsByType[ty] || 0} selected={selectedShopTypes.includes(ty)} onClick={() => toggleShopType(ty)} />)}
            </div>
          )}
      </FilterBlock>

      {cities.length > 0 && (
        <FilterBlock num={num()} title={t('city')} isOpen={open.city} onToggle={() => toggle('city')} darkMode={darkMode}>
          <div className="hp-sb flex max-h-40 min-w-0 flex-wrap gap-2.5 overflow-y-auto overscroll-contain p-1 pe-3">
            {cities.map((c) => (
              <button key={c} type="button" onClick={() => toggleCity(c)} aria-pressed={selectedCities.includes(c)} className={`${neoBtn(darkMode, selectedCities.includes(c))} !min-h-9 !px-3 !py-1 !text-xs`}>
                {c}
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      <FilterBlock num={num()} title={t('minimumRating')} isOpen={open.rating} onToggle={() => toggle('rating')} darkMode={darkMode}>
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

      <FilterBlock num={num()} title={t('moreFilters')} isOpen={open.more} onToggle={() => toggle('more')} darkMode={darkMode}>
        <div className="min-w-0 break-words">
          <OptionRow type="check" label={t('ratedOnly')} selected={ratedOnly} onClick={() => setRatedOnly((v) => !v)} />
          <OptionRow type="check" label={t('hasPhone')} selected={hasPhoneOnly} onClick={() => setHasPhoneOnly((v) => !v)} />
          <OptionRow type="check" label={t('hasAddress')} selected={hasAddressOnly} onClick={() => setHasAddressOnly((v) => !v)} />
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

const Pagination = memo(({ page, total, onChange, darkMode, t }) => {
  const items = useMemo(() => pageWindow(page, total), [page, total]);
  if (total <= 1) return null;
  const icon = `${NEO_THEME[darkMode ? 'dark' : 'light']} ${NEO_ICON}`;
  return (
    <nav aria-label={t('pagination')} className="flex flex-wrap items-center justify-center gap-3 pe-2">
      <button type="button" className={icon} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <FiChevronLeft className="h-5 w-5 rtl:rotate-180" />
      </button>
      {items.map((x) => (typeof x === 'number' ? (
        <button
          key={x} type="button" onClick={() => onChange(x)} aria-label={t('pageN', { n: x })} aria-current={x === page ? 'page' : undefined}
          className={`${neoBtn(darkMode, x === page)} !min-w-11 !px-2 tabular-nums`}
        >
          {x}
        </button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-extrabold text-[color:var(--txt)]">…</span>))}
      <button type="button" className={icon} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
        <FiChevronRight className="h-5 w-5 rtl:rotate-180" />
      </button>
    </nav>
  );
});

const InfiniteSentinel = memo(({ hasMore, shown, total, onMore, darkMode, t }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return undefined;
    if (typeof IntersectionObserver === 'undefined') { onMore(); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onMore(); }, { rootMargin: '700px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown, onMore]);
  const dot = darkMode ? 'bg-[#39ff88]' : 'bg-emerald-500';
  return (
    <div ref={ref} role="status" aria-live="polite" className="flex min-h-[4rem] items-center justify-center gap-3 pt-8">
      {hasMore ? (
        <>
          <span aria-hidden="true" className="flex items-center gap-1.5">
            <span className={`hp-load-dot h-2.5 w-2.5 rounded-full ${dot}`} />
            <span className={`hp-load-dot h-2.5 w-2.5 rounded-full ${dot}`} />
            <span className={`hp-load-dot h-2.5 w-2.5 rounded-full ${dot}`} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-[color:var(--txt)]">{t('loadingMore')}</span>
        </>
      ) : total > MOBILE_BATCH ? (
        <p className="hp-pop flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase text-[color:var(--txt)]">
          <FiCheck aria-hidden="true" className="h-3.5 w-3.5" />{t('endOfList')}
        </p>
      ) : null}
    </div>
  );
});

const ShopsContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k, params) => tr(language, k, params), [language]);
  const dir = languageDirection(language);
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const uid = useId().replace(/:/g, '');
  const [, startTransition] = useTransition();
  useScrollTopOnEnter();

  const [saved, toggleSaved] = useSavedShops();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const searchPending = searchTerm !== deferredSearch;
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(MOBILE_BATCH);
  const [pageSize, setPageSize] = useState(SHOP_PAGE_SIZES[0]);
  const [viewMode, setViewMode] = useState('grid');
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
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.hpTheme = darkMode ? 'dark' : 'light';
    return () => { delete el.dataset.hpTheme; };
  }, [darkMode]);

  const { data: shops = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['shopsList'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/shops/all', { signal });
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list.filter((s) => s && s.id != null) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { shopTypes, cities, countsByType, roleCounts, topRated, searchIndex } = useMemo(() => {
    const types = new Set(); const citySet = new Set(); const counts = {}; const index = new Map();
    let rep = 0; let sell = 0; let both = 0;
    for (const s of shops) {
      if (s.shopType) { types.add(s.shopType); counts[s.shopType] = (counts[s.shopType] || 0) + 1; }
      if (s.shopAddress?.city) citySet.add(s.shopAddress.city);
      const r = getShopRole(s);
      if (r !== 'SELLER') rep++;
      if (r !== 'REPAIRER') sell++;
      if (r === 'BOTH') both++;
      index.set(s.id, `${s.name || ''} ${s.shopType || ''} ${s.shopAddress?.city || ''} ${s.shopAddress?.street || ''} ${s.description || ''} ${s.phone || ''}`.toLowerCase());
    }
    return {
      shopTypes: [...types].sort(),
      cities: [...citySet].sort(),
      countsByType: counts,
      roleCounts: { ALL: shops.length, REPAIRER: rep, SELLER: sell, BOTH: both },
      topRated: shops.filter((s) => s.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, FAVORITES_LIMIT),
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

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / pageSize));
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(MOBILE_BATCH);
  }, [pageSize, deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, savedOnly, ratedOnly, hasPhoneOnly, hasAddressOnly, sortBy]);
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
  const scrollToTop = useCallback(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, []);
  const goToPage = useCallback((pg) => { setCurrentPage(pg); scrollToGrid(); }, [scrollToGrid]);
  const openShop = useCallback((id) => navigate(`/shops/${encodeURIComponent(id)}`), [navigate]);
  const toggleShopType = useCallback((ty) => setSelectedShopTypes((p) => (p.includes(ty) ? p.filter((x) => x !== ty) : [...p, ty])), []);
  const toggleCity = useCallback((c) => setSelectedCities((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const pickSpecialty = useCallback((ty) => { toggleShopType(ty); scrollToGrid(); }, [toggleShopType, scrollToGrid]);
  const clearFilters = useCallback(() => {
    setSearchTerm(''); setRoleFilter('ALL'); setSelectedShopTypes([]); setSelectedCities([]); setMinRating(0); setShowVerifiedOnly(false); setSavedOnly(false); setRatedOnly(false); setHasPhoneOnly(false); setHasAddressOnly(false); setSortBy('relevance'); setCurrentPage(1); setVisibleCount(MOBILE_BATCH);
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

  const actions = useMemo(() => ({
    onDetails: openDetails, onOpen: openShop, onDirections: openDirections, onSave: toggleSaved,
  }), [openDetails, openShop, openDirections, toggleSaved]);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (roleFilter !== 'ALL' ? 1 : 0) + selectedShopTypes.length + selectedCities.length + (minRating > 0 ? 1 : 0) + (showVerifiedOnly ? 1 : 0) + (savedOnly ? 1 : 0) + (ratedOnly ? 1 : 0) + (hasPhoneOnly ? 1 : 0) + (hasAddressOnly ? 1 : 0);

  const heroButtons = useMemo(() => [
    { label: t('heroFind'), onClick: scrollToGrid, primary: true },
    { label: t('heroBrowse'), to: '/devices', primary: false },
  ], [scrollToGrid, t]);

  const sortOptions = useMemo(() => [
    { value: 'relevance', label: t('sortRelevance') },
    { value: 'ratingHighToLow', label: t('sortRating') },
    { value: 'verifiedFirst', label: t('sortVerified') },
    { value: 'nameAZ', label: t('sortName') },
  ], [t]);

  const rowOptions = useMemo(() => SHOP_PAGE_SIZES.map((n) => ({ value: n, label: `${n} ${t('perPage')}` })), [t]);

  const filterPanelProps = useMemo(() => (sheet !== 'closed' ? {
    t, darkMode, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    savedOnly, setSavedOnly, ratedOnly, setRatedOnly, hasPhoneOnly, setHasPhoneOnly, hasAddressOnly, setHasAddressOnly,
    open, setOpen, clearFilters, activeFiltersCount,
  } : null), [sheet, t, darkMode, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, roleCounts, minRating, showVerifiedOnly, savedOnly, ratedOnly, hasPhoneOnly, hasAddressOnly, open, clearFilters, activeFiltersCount]);

  const k = darkMode ? 'dark' : 'light';
  const layout = isMobile ? 'grid' : viewMode;
  const gridCols = layout === 'grid' ? SHOP_GRID : 'grid grid-cols-1 gap-4 pb-2 pe-2 sm:gap-6';
  const pageBg = darkMode ? DARK_PAGE : 'bg-gray-50';
  const chipBtn = `${neoBtn(darkMode, false)} !min-h-9 !px-3 !py-1 !text-xs`;
  const removable = (key, label, onRemove) => (
    <button key={key} type="button" onClick={onRemove} className={chipBtn}>
      <span className="max-w-[10rem] truncate">{label}</span><FiX className="h-3 w-3" aria-hidden="true" />
    </button>
  );

  return (
    <div
      dir={dir} lang={language}
      className={`${NEO_THEME[k]} min-h-screen overflow-x-clip ${isAr ? 'font-cairo' : 'font-jakarta'} ${darkMode ? `${DARK_PAGE} text-white` : 'bg-gray-50 text-gray-900'}`}
    >
      {STYLE_EL}
      <Defs3D />

      <Suspense fallback={<div className={`h-[360px] w-full animate-pulse motion-reduce:animate-none sm:h-[480px] ${darkMode ? 'bg-[#2a2a2a]' : 'bg-emerald-50'}`} />}>
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
        <SpecialtyGrid
          shopTypes={shopTypes} countsByType={countsByType} selected={selectedShopTypes} onToggle={pickSpecialty}
          darkMode={darkMode} isAr={isAr} title={t('findExpert')} subtitle={t('browseSpecialty')} t={t}
        />
      )}

      {!isLoading && topRated.length > 0 && (
        <FavoritesSection shops={topRated} darkMode={darkMode} isAr={isAr} t={t} actions={actions} saved={saved} />
      )}

      {!isLoading && !isError && (
        <RoleSections shops={shops} darkMode={darkMode} isAr={isAr} t={t} actions={actions} saved={saved} onViewAll={viewAllRole} />
      )}

      <section aria-label={t('allShopsTitle')} className={darkMode ? DARK_PAGE : 'bg-gray-100'}>
        <div id="shop-results" ref={gridRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <SectionTitle darkMode={darkMode} isAr={isAr} label={t('eyebrowShops')} title={t('allShopsTitle')} subtitle={t('allShopsSubtitle')} />

          <div className="w-full min-w-0">
            <div className={`relative z-20 mb-6 me-2 flex flex-col gap-4 p-4 sm:p-5 ${neoCard(darkMode, 'sm')}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-[color:var(--txt)]" aria-live="polite">
                  <b dir="ltr" className="tabular-nums">{startItem}–{endItem}</b> / <b dir="ltr" className="tabular-nums">{filteredShops.length}</b> {t('shopsFound')}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {!isMobile && (
                    <>
                      <Dropdown id={`${uid}-rows`} ariaLabel={t('rowsPerPage')} value={pageSize} onChange={setPageSize} options={rowOptions} className="w-36 flex-shrink-0" />
                      {VIEW_MODES.map(([mode, Icon, labelKey]) => (
                        <button
                          key={mode} type="button" onClick={() => setViewMode(mode)} aria-label={t(labelKey)} title={t(labelKey)} aria-pressed={viewMode === mode}
                          className={`${neoBtn(darkMode, viewMode === mode)} !w-11 !px-0`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      ))}
                    </>
                  )}
                  <button type="button" onClick={openSheet} aria-haspopup="dialog" aria-expanded={sheet === 'open'} className={neoBtn(darkMode, true)}>
                    <FiSliders className="h-4 w-4" aria-hidden="true" />
                    <span>{t('filters')}</span>
                    {activeFiltersCount > 0 && <span dir="ltr" className="tabular-nums">({activeFiltersCount})</span>}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchField value={searchTerm} onChange={setSearchTerm} placeholder={t('search')} ariaLabel={t('searchAria')} clearLabel={t('clearSearch')} pending={searchPending} />
                <Dropdown id={`${uid}-sort`} ariaLabel={t('sortBy')} value={sortBy} onChange={setSortBy} options={sortOptions} className="w-full sm:w-56" />
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-3 pe-2">
                {roleFilter !== 'ALL' && removable('role', serviceLabel(roleFilter, t), () => setRoleFilter('ALL'))}
                {selectedShopTypes.map((ty) => removable(`ty-${ty}`, ty, () => toggleShopType(ty)))}
                {selectedCities.map((c) => removable(`c-${c}`, c, () => toggleCity(c)))}
                {minRating > 0 && removable('rating', `${minRating}+ ${t('stars')}`, () => setMinRating(0))}
                {showVerifiedOnly && removable('verified', t('verified'), () => setShowVerifiedOnly(false))}
                {savedOnly && removable('saved', t('savedOnly'), () => setSavedOnly(false))}
                {ratedOnly && removable('rated', t('ratedOnly'), () => setRatedOnly(false))}
                {hasPhoneOnly && removable('phone', t('hasPhone'), () => setHasPhoneOnly(false))}
                {hasAddressOnly && removable('address', t('hasAddress'), () => setHasAddressOnly(false))}
                {searchTerm && removable('q', `“${searchTerm.slice(0, 20)}”`, () => setSearchTerm(''))}
                <button type="button" onClick={clearFilters} className={TEXT_LINK}>{t('clearAll')}</button>
              </div>
            )}

            {isLoading ? (
              <div className={gridCols} role="status" aria-busy="true" aria-label={t('loading')}>
                {Array.from({ length: 10 }).map((_, i) => <div key={i} className={`h-[380px] animate-pulse rounded-2xl motion-reduce:animate-none ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70'}`} />)}
              </div>
            ) : isError ? (
              <div className={`me-2 items-center px-4 py-14 text-center sm:py-20 ${neoCard(darkMode, 'sm')}`}>
                <IsoIllustration type="shopsEmpty" tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32" />
                <p className="mb-2 text-lg font-extrabold uppercase text-[color:var(--txt)] sm:text-xl">{t('loadErrorTitle')}</p>
                <p className="mb-6 text-sm font-medium text-[color:var(--mut)]">{t('loadErrorText')}</p>
                <button type="button" onClick={() => refetch()} className={neoBtn(darkMode, true)}><FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" /> {t('tryAgain')}</button>
              </div>
            ) : filteredShops.length === 0 ? (
              <div className={`me-2 items-center px-4 py-14 text-center sm:py-24 ${neoCard(darkMode, 'sm')}`}>
                <IsoIllustration type="shopsEmpty" tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
                <p className="mb-2 text-lg font-extrabold uppercase text-[color:var(--txt)] sm:text-2xl">{shops.length ? t('noMatch') : t('noShops')}</p>
                <p className="mb-6 text-sm font-medium text-[color:var(--mut)] sm:text-base">{shops.length ? t('tryRemoveFilter') : t('newShopsSoon')}</p>
                {shops.length > 0 && <button type="button" onClick={clearFilters} className={neoBtn(darkMode, true)}>{t('clearFilters')}</button>}
              </div>
            ) : (
              <>
                <div className={gridCols}>
                  {listShops.map((s, i) => (
                    <ShopCell key={s.id} index={i}>
                      <ShopCard shop={s} darkMode={darkMode} layout={layout} isSaved={saved.has(s.id)} actions={actions} t={t} />
                    </ShopCell>
                  ))}
                </div>
                {isMobile ? (
                  <InfiniteSentinel hasMore={hasMore} shown={visibleCount} total={filteredShops.length} onMore={loadMore} darkMode={darkMode} t={t} />
                ) : totalPages > 1 && (
                  <div className="flex flex-col items-center gap-3 pt-10">
                    <Pagination page={page} total={totalPages} onChange={goToPage} darkMode={darkMode} t={t} />
                    <p className="text-xs font-bold text-[color:var(--mut)]">
                      <span dir="ltr" className="tabular-nums">{startItem}–{endItem}</span> / <span dir="ltr" className="tabular-nums">{filteredShops.length}</span> {t('shopsFound')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {showTop && (
        <div className="hp-pop fixed bottom-5 end-5 z-40">
          <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} title={t('backToTop')} className={`${NEO_THEME[k]} ${NEO_ICON}`}>
            <FiArrowUp className="h-5 w-5" />
          </button>
        </div>
      )}

      {sheet !== 'closed' && filterPanelProps && (
        <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t('filters')}>
          <div className={`absolute inset-0 bg-black/60 ${sheet === 'leave' ? 'hp-fade-out' : 'hp-fade-in'}`} onClick={closeSheet} />
          <div
            className={`${sheet === 'leave' ? 'hp-drawer-out' : 'hp-drawer'} ${pageBg} absolute inset-y-0 start-0 flex w-[22rem] min-w-0 max-w-[90vw] transform-gpu flex-col border-e-[3px] border-[color:var(--ink)] md:w-96`}
          >
            <div className="hp-sb min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 pe-5">
              <FilterPanel {...filterPanelProps} onClose={closeSheet} />
            </div>
            <div className="border-t-[3px] border-[color:var(--ink)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => { closeSheet(); scrollToGrid(); }} className={`${neoBtn(darkMode, true)} w-full`}>{t('showShops', { count: filteredShops.length })}</button>
            </div>
          </div>
        </div>
      )}

      {detailsShop && (
        <ShopDetailsModal key={detailsShop.id} shop={detailsShop} darkMode={darkMode} onClose={closeDetails} onOpen={openFromModal} onDirections={directionsFromModal} t={t} />
      )}

      {directionsShop && (
        <DirectionsModal key={`dir-${directionsShop.id}`} shop={directionsShop} darkMode={darkMode} onClose={closeDirections} t={t} />
      )}
    </div>
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