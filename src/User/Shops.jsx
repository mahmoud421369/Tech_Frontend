import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useId, memo, Suspense, lazy,
  useDeferredValue, useTransition, useSyncExternalStore, createContext, useContext,
} from 'react';
import { Link, useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiMapPin, FiX, FiSliders, FiArrowRight, FiArrowUp, FiCheck, FiShield, FiTool, FiRefreshCw,
  FiShoppingBag, FiExternalLink, FiInfo, FiNavigation, FiMessageSquare, FiPackage, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiSearch, FiHeart, FiPhone,
} from 'react-icons/fi';
import { RiStarFill, RiVerifiedBadgeLine, RiStoreLine } from 'react-icons/ri';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import poppins400 from '@fontsource/poppins/files/poppins-latin-400-normal.woff2';
import poppins600 from '@fontsource/poppins/files/poppins-latin-600-normal.woff2';
import poppins700 from '@fontsource/poppins/files/poppins-latin-700-normal.woff2';
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

if (typeof document !== 'undefined') {
  [poppins400, poppins600, poppins700].forEach((href) => {
    if (!href || document.head.querySelector(`link[rel="preload"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  });
}

const DeliveryMap = lazy(() => import('../Delivery/DeliveryMap'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } },
});

const PAGE_SIZE = 12;
const SAVED_KEY = 'nb_saved_shops';
const SAVED_MAX = 500;
const SHOPS_MAX = 2000;
const CAROUSEL_LIMIT = 10;
const CATEGORY_LIMIT = 14;
const LEAVE_MS = 180;
const STATS_STALE = 5 * 60 * 1000;
const QUERY_MAX = 100;
const ID_RE = /^[\w-]{1,64}$/;
const DESKTOP_Q = '(min-width: 1024px)';
const MOBILE_Q = '(max-width: 639.98px)';
const REDUCED_Q = '(prefers-reduced-motion: reduce)';
const STAGGER = Array.from({ length: PAGE_SIZE }, (_, i) => ({ '--i': i }));
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const GRID = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3';
const RATING_STEPS = [4, 4.5, 4.8];
const EMPTY_LIST = [];

const LOGO_DIR = '/uploads/shop-logos/';
const LOGO_MAX = 2048;
const BAD_LOGO_CHARS = /[\x00-\x1f\\<>"'`]/;
const DATA_IMAGE = /^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i;
const REMOTE_SRC = /^(https?:)?\/\//i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const PRESS = 'transition-[transform,box-shadow,background-color,color,border-color] duration-150 active:translate-y-0.5 active:[box-shadow:none] motion-reduce:transition-none';
const SHADOW = (n) => `[box-shadow:calc(var(--dx)*${n}px)_${n}px_0_0_var(--shd)]`;
const CARD = `rounded-2xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(4)}`;
const CHIP = 'border-2 border-black bg-[#39ff88] text-emerald-950';
const BTN_BASE = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] font-extrabold ${PRESS} ${FOCUS} disabled:cursor-not-allowed disabled:opacity-50`;
const BTN_PRIMARY = `${BTN_BASE} border-black bg-[#39ff88] text-emerald-950 ${SHADOW(3)} hover:bg-[#7dffb0]`;
const BTN_SECONDARY = `${BTN_BASE} border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(3)} hover:bg-[color:var(--sf2)]`;
const BTN_ON = `${BTN_BASE} border-black bg-[#39ff88] text-emerald-950 ${SHADOW(3)}`;
const FIELD = `rounded-xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(3)}`;
const TEXT_LINK = `rounded-md hover:underline hover:decoration-2 hover:underline-offset-4 ${FOCUS}`;
const LIFT = '[@media(hover:hover)]:hover:-translate-y-0.5';

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
    noAddress: 'No address listed',
    save: 'Save shop', saved: 'Saved', savedOnly: 'Saved only', directionsTo: 'Directions to', yourLocation: 'Your location',
    locating: 'Finding your location', locationDenied: 'We could not get your location. The shop is shown on the map.',
    openInMaps: 'Open in Maps', retryLocation: 'Try again',
    moreFilters: 'More filters', ratedOnly: 'Has ratings', hasPhone: 'Has phone number', hasAddress: 'Has address',
    repairAndSell: 'Repair & sell', sortVerified: 'Verified first', scrollPrev: 'Scroll back', scrollNext: 'Scroll forward',
    crumbHome: 'Home', crumbShops: 'Shops', breadcrumb: 'Breadcrumb',
    pagination: 'Pagination', prevPage: 'Previous page', nextPage: 'Next page', goToPage: 'Go to page', pageOf: 'Page {{page}} of {{total}}',
    prev: 'Previous', next: 'Next',
  },
  ar: {
    reviewOne: 'تقييم', reviewMany: 'تقييمات', productOne: 'منتج', productMany: 'منتجات',
    noAddress: 'لا يوجد عنوان مسجل',
    save: 'حفظ المتجر', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', directionsTo: 'الاتجاهات إلى', yourLocation: 'موقعك',
    locating: 'جارٍ تحديد موقعك', locationDenied: 'تعذر تحديد موقعك. يظهر المتجر على الخريطة.',
    openInMaps: 'فتح في الخرائط', retryLocation: 'إعادة المحاولة',
    moreFilters: 'فلاتر إضافية', ratedOnly: 'لديه تقييمات', hasPhone: 'لديه رقم هاتف', hasAddress: 'لديه عنوان',
    repairAndSell: 'صيانة وبيع', sortVerified: 'الموثقة أولاً', scrollPrev: 'السابق', scrollNext: 'التالي',
    crumbHome: 'الرئيسية', crumbShops: 'المتاجر', breadcrumb: 'مسار التنقل',
    pagination: 'ترقيم الصفحات', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية', goToPage: 'الانتقال إلى الصفحة', pageOf: 'الصفحة {{page}} من {{total}}',
    prev: 'السابق', next: 'التالي',
  },
  fr: {
    reviewOne: 'avis', reviewMany: 'avis', productOne: 'produit', productMany: 'produits',
    noAddress: 'Aucune adresse indiquée',
    save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrées uniquement', directionsTo: 'Itinéraire vers', yourLocation: 'Votre position',
    locating: 'Localisation en cours', locationDenied: 'Position introuvable. La boutique est affichée sur la carte.',
    openInMaps: 'Ouvrir dans Maps', retryLocation: 'Réessayer',
    moreFilters: 'Plus de filtres', ratedOnly: 'Avec des notes', hasPhone: 'Avec téléphone', hasAddress: 'Avec adresse',
    repairAndSell: 'Réparation & vente', sortVerified: 'Vérifiées d’abord', scrollPrev: 'Précédent', scrollNext: 'Suivant',
    crumbHome: 'Accueil', crumbShops: 'Boutiques', breadcrumb: "Fil d'Ariane",
    pagination: 'Pagination', prevPage: 'Page précédente', nextPage: 'Page suivante', goToPage: 'Aller à la page', pageOf: 'Page {{page}} sur {{total}}',
    prev: 'Précédent', next: 'Suivant',
  },
};

const tr = (lang, key, params) => {
  const raw = SHOPS_TRANSLATIONS[lang]?.[key] ?? EXTRA[lang]?.[key] ?? SHOPS_TRANSLATIONS.en?.[key] ?? EXTRA.en[key] ?? key;
  const text = typeof raw === 'string' ? raw : String(key);
  return params ? text.replace(/\{\{(\w+)\}\}/g, (_, k) => (params[k] !== undefined ? params[k] : '')) : text;
};

const clean = (v, max = 200) => (typeof v === 'string'
  ? v.replace(/[\p{Cc}\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
  : '');

const stripControl = (v) => v.replace(/[\p{Cc}\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu, '');

const telHref = (phone) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  return digits ? `tel:${digits}` : undefined;
};

const safeId = (id) => {
  if (typeof id !== 'string' && typeof id !== 'number') return '';
  const s = String(id);
  return ID_RE.test(s) ? s : '';
};

const safeHref = (raw) => {
  if (typeof raw !== 'string' || raw.length > 2048) return undefined;
  try {
    const u = new URL(raw, window.location.origin);
    return u.protocol === 'https:' ? u.href : undefined;
  } catch {
    return undefined;
  }
};

const cleanAddress = (a) => {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(a)) {
    if (BLOCKED_KEYS.has(k)) continue;
    if (typeof v === 'string') out[k] = clean(v, 200);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
};

const normalizeShop = (s) => {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
  const id = safeId(s.id);
  if (!id) return null;
  const rating = Number(s.rating);
  return {
    ...s,
    id,
    name: clean(s.name, 120),
    description: clean(s.description, 1000),
    phone: clean(typeof s.phone === 'number' ? String(s.phone) : s.phone, 30),
    shopType: clean(s.shopType, 60),
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0,
    verified: s.verified === true || s.verified === 'true',
    shopAddress: cleanAddress(s.shopAddress),
  };
};

const prefersReduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_Q).matches;

const scrollToEl = (el) => {
  if (el) el.scrollIntoView({ block: 'start', behavior: prefersReduced() ? 'auto' : 'smooth' });
};

const buildPages = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur, cur - 1, cur + 1]);
  if (cur <= 3) { set.add(2); set.add(3); set.add(4); }
  if (cur >= total - 2) { set.add(total - 1); set.add(total - 2); set.add(total - 3); }
  const arr = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => {
    if (i && n - arr[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
};

const PAGE_CSS = `
@font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
.sh{--bd:#e5e7eb;--sf:#ffffff;--sf2:#f3f4f6;--tx:#052e1e;--mu:rgba(5,46,30,.68);--acc:#059669;--ln:#000000;--shd:#000000;--pg:#ffffff;--hi:rgba(255,255,255,.8);--scrim:rgba(0,0,0,.6);--dx:1;background:var(--pg);color:var(--tx);color-scheme:light;line-height:1.55;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.sh[dir=rtl]{--dx:-1}
.sh-dark{--bd:rgba(255,255,255,.16);--sf:#1c1c1e;--sf2:#2a2a2e;--tx:#ffffff;--mu:rgba(255,255,255,.66);--acc:#39ff88;--ln:rgba(255,255,255,.16);--shd:#0b4a35;--pg:#141414;--hi:rgba(255,255,255,.08);--scrim:rgba(0,0,0,.72);color-scheme:dark}
.sh[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
.sh[lang=ar] *{letter-spacing:0!important}
.sh button,.sh input{font-family:inherit}
.sh-field input::placeholder{color:var(--mu)}
.sh-field input::-webkit-search-cancel-button,.sh-field input::-webkit-search-decoration{display:none;-webkit-appearance:none}
.sh-field:focus-within{outline:2px solid var(--acc);outline-offset:2px}
@keyframes shShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.sh-sk{position:relative;overflow:hidden}
.sh-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--hi),transparent);animation:shShimmer 1.3s ease-in-out infinite}
.sh[dir=rtl] .sh-sk::after{animation-direction:reverse}
@keyframes shIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.sh-in{animation:shIn .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*35ms)}
@keyframes shFade{from{opacity:0}to{opacity:1}}
@keyframes shFadeOut{from{opacity:1}to{opacity:0}}
@keyframes shModal{from{opacity:0;transform:translate3d(0,24px,0)}to{opacity:1;transform:none}}
@keyframes shModalOut{from{opacity:1;transform:none}to{opacity:0;transform:translate3d(0,24px,0)}}
@keyframes shDrawer{from{transform:translate3d(calc(var(--dx,1)*-100%),0,0)}to{transform:none}}
@keyframes shDrawerOut{from{transform:none}to{transform:translate3d(calc(var(--dx,1)*-100%),0,0)}}
@keyframes shPop{from{opacity:0;transform:translate3d(0,-6px,0)}to{opacity:1;transform:none}}
@keyframes shHeart{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
.sh-fade{animation:shFade .18s ease-out both}
.sh-fade-out{animation:shFadeOut .18s ease-in both}
.sh-modal{animation:shModal .24s cubic-bezier(.2,.8,.2,1) both}
.sh-modal-out{animation:shModalOut .18s ease-in both}
.sh-drawer{animation:shDrawer .26s cubic-bezier(.2,.8,.2,1) both}
.sh-drawer-out{animation:shDrawerOut .18s ease-in both}
.sh-pop{animation:shPop .14s cubic-bezier(.2,.8,.2,1) both;transform-origin:top}
.sh-heart{animation:shHeart .3s ease-out}
.sh-noscroll{scrollbar-width:none;-ms-overflow-style:none}
.sh-noscroll::-webkit-scrollbar{display:none}
.sh-scroll{scrollbar-width:thin;scrollbar-color:var(--acc) transparent;overscroll-behavior:contain}
.sh-defer{content-visibility:auto;contain-intrinsic-size:auto 420px}
@media (prefers-reduced-motion:no-preference){html:has(.sh){scroll-behavior:smooth}}
@media (prefers-reduced-motion:reduce){.sh-sk::after,.sh-in,.sh-fade,.sh-fade-out,.sh-modal,.sh-modal-out,.sh-drawer,.sh-drawer-out,.sh-pop,.sh-heart{animation:none!important}}
`;

if (typeof document !== 'undefined' && !document.querySelector('style[data-shops-styles]')) {
  const tag = document.createElement('style');
  tag.setAttribute('data-shops-styles', 'true');
  tag.textContent = PAGE_CSS;
  document.head.appendChild(tag);
}

const DarkCtx = createContext(false);
const ThemedIso = (props) => <IsoIllustration {...props} darkMode={useContext(DarkCtx)} />;

const useScrollProgress = (barRef) => {
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || prefersReduced()) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.documentElement;
      const limit = el.scrollHeight - el.clientHeight;
      bar.style.transform = `scaleX(${limit > 0 ? Math.min(1, Math.max(0, window.scrollY / limit)) : 0})`;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [barRef]);
};

const subscribeMq = (q) => (cb) => {
  const m = window.matchMedia(q);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const subscribeDesktop = subscribeMq(DESKTOP_Q);
const getDesktop = () => window.matchMedia(DESKTOP_Q).matches;
const getFalse = () => false;
const useIsDesktop = () => useSyncExternalStore(subscribeDesktop, getDesktop, getFalse);

const subscribeMobile = subscribeMq(MOBILE_Q);
const getMobile = () => window.matchMedia(MOBILE_Q).matches;
const useIsMobile = () => useSyncExternalStore(subscribeMobile, getMobile, getFalse);

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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navType]);
};

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    if (!Array.isArray(v)) return [];
    const out = [];
    for (const x of v) {
      const id = safeId(x);
      if (id) out.push(id);
    }
    return out.slice(-SAVED_MAX);
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
  useEffect(() => {
    const onStorage = (e) => { if (e.key === SAVED_KEY) setIds(readSaved()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const set = useMemo(() => new Set(ids), [ids]);
  return [set, toggle];
};

const observeOnce = (() => {
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
    }, { rootMargin: '200px' });
    callbacks.set(el, cb);
    io.observe(el);
    return () => { io.unobserve(el); callbacks.delete(el); };
  };
})();

const useSeen = () => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !ref.current) return undefined;
    return observeOnce(ref.current, () => setSeen(true));
  }, [seen]);
  return [ref, seen];
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

const useShopCounts = (shop) => {
  const id = shop.id;
  const products = useQuery({
    queryKey: ['shopProductsCount', id],
    queryFn: async ({ signal }) => countOf((await api.get(`/api/products/shop/${encodeURIComponent(id)}`, { signal })).data),
    staleTime: STATS_STALE,
    refetchOnMount: false,
  });
  const reviews = useQuery({
    queryKey: ['shopReviewsCount', id],
    queryFn: async ({ signal }) => countOf((await api.get(`/api/reviews/${encodeURIComponent(id)}/reviews`, { signal })).data),
    staleTime: STATS_STALE,
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
  const entry = listLogo ? undefined : readLogoEntry(id);
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
    enabled: (eager || seen) && !listLogo,
    staleTime: LOGO_STALE_MS,
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

const SK = 'sh-sk rounded-lg bg-[color:var(--bd)]';
const Sk = ({ className = '' }) => <div aria-hidden="true" className={`${SK} ${className}`} />;

const IconTile = memo(({ Icon, className = 'h-9 w-9', iconClassName = 'h-4 w-4' }) => (
  <span aria-hidden="true" className={`flex flex-shrink-0 items-center justify-center rounded-lg ${CHIP} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const Crumbs = memo(({ t }) => (
  <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-1.5 text-xs font-bold sm:text-sm">
    <Link to="/" className={TEXT_LINK}>{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3 w-3 flex-shrink-0 text-[color:var(--mu)] rtl:rotate-180" />
    <span aria-current="page" className="text-[color:var(--mu)]">{t('crumbShops')}</span>
  </nav>
));

const CardSkeleton = memo(({ carousel = false }) => (
  <div className={`overflow-hidden ${CARD} ${carousel ? 'w-[46%] flex-shrink-0 sm:w-64' : ''}`} aria-hidden="true">
    <div className={`${SK} aspect-[4/3] w-full !rounded-none sm:aspect-[16/10]`} />
    <div className="space-y-2.5 p-3 sm:p-3.5">
      <Sk className="h-4 w-3/4" />
      <Sk className="h-3 w-1/2" />
      <Sk className="h-3 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Sk className="h-9 w-16 sm:w-20" />
        <Sk className="h-9 w-9" />
      </div>
    </div>
  </div>
));

const PageSkeleton = memo(({ label }) => (
  <div role="status" aria-busy="true" aria-label={label}>
    <div className="mb-5 space-y-2">
      <Sk className="h-6 w-40" />
      <Sk className="h-3 w-56 max-w-full" />
    </div>
    <div className={GRID}>
      {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
    </div>
  </div>
));

const FilterSkeleton = memo(() => (
  <div aria-hidden="true" className={`space-y-6 self-start p-4 ${CARD}`}>
    {[0, 1].map((g) => (
      <div key={g} className="space-y-2">
        <Sk className="h-4 w-24" />
        {[0, 1, 2, 3].map((r) => <Sk key={r} className="h-10 w-full" />)}
      </div>
    ))}
  </div>
));

const StateBox = memo(({ label, hint, onAction, actionLabel, fetching }) => (
  <div className={`sh-in mx-auto flex max-w-lg flex-col items-center px-6 py-10 text-center ${CARD}`}>
    <ThemedIso type="shopsEmpty" tone="emerald" onGreen={false} className="mb-3 h-28 w-28" />
    <h2 className="text-xl font-extrabold tracking-tight rtl:tracking-normal">{label}</h2>
    {hint && <p className="mt-3 max-w-md text-sm font-medium text-[color:var(--mu)]">{hint}</p>}
    {onAction && actionLabel && (
      <button type="button" onClick={() => onAction()} className={`${BTN_PRIMARY} mt-6 min-h-11 px-5 py-2.5 text-sm`}>
        <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${fetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{actionLabel}
      </button>
    )}
  </div>
));

const Chip = memo(({ active, onClick, children, icon: Icon, onRemove }) => (
  <button
    type="button" onClick={onClick} aria-pressed={active}
    className={`${active ? BTN_ON : BTN_SECONDARY} h-10 flex-shrink-0 whitespace-nowrap px-3 text-xs`}
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
      <div className="absolute inset-0 flex items-end justify-center bg-[color:var(--sf2)] px-6 pt-5">
        <ThemedIso type={isoRoleKey(role)} tone="emerald" onGreen={false} className="pointer-events-none h-full w-auto max-w-full" />
      </div>
    );
  }
  return (
    <>
      {!loaded && <div aria-hidden="true" className={`${SK} absolute inset-0 !rounded-none`} />}
      <img
        ref={imgRef} src={src} alt={name || ''} width={400} height={250}
        loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} decoding="async" referrerPolicy="no-referrer"
        onLoad={onLoad} onError={onError}
        className={`absolute inset-0 h-full w-full object-contain p-3 transition-opacity duration-300 motion-reduce:transition-none sm:p-4 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
});

const RatingLine = ({ rating, reviews, className = '' }) => (
  <p className={`flex items-center gap-1 text-xs font-extrabold ${className}`}>
    <RiStarFill className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
    <span dir="ltr" className="tabular-nums">{rating.toFixed(1)}</span>
    {reviews > 0 && <span dir="ltr" className="font-semibold tabular-nums text-[color:var(--mu)]">({reviews})</span>}
  </p>
);

const SaveButton = ({ isSaved, onClick, t, className = '' }) => (
  <button
    type="button" onClick={onClick} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
    className={`${BTN_SECONDARY} h-8 w-8 flex-shrink-0 !rounded-full sm:h-9 sm:w-9 ${className}`}
  >
    <FiHeart key={String(isSaved)} className={`h-4 w-4 ${isSaved ? 'sh-heart text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
  </button>
);

const VerifiedMark = ({ t }) => (
  <span className="inline-flex flex-shrink-0 text-[color:var(--acc)]">
    <RiVerifiedBadgeLine aria-hidden="true" className="h-4 w-4" />
    <span className="sr-only">{t('verified')}</span>
  </span>
);

const useShopHandlers = (shop, actions) => {
  const { onDetails, onOpen, onDirections, onSave } = actions;
  const open = useCallback(() => onOpen(shop.id), [onOpen, shop.id]);
  const showDetails = useCallback((e) => { e.stopPropagation(); onDetails(shop); }, [onDetails, shop]);
  const directions = useCallback((e) => { e.stopPropagation(); onDirections(shop); }, [onDirections, shop]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(shop.id); }, [onSave, shop.id]);
  const onKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(shop.id); }, [onOpen, shop.id]);
  return { open, showDetails, directions, save, onKey };
};

const CardActions = ({ showDetails, directions, t }) => (
  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
    <button type="button" onClick={showDetails} aria-label={t('details')} className={`${BTN_SECONDARY} h-9 flex-1 px-2 text-xs sm:flex-none sm:px-3`}>
      <FiInfo className="h-4 w-4" aria-hidden="true" /><span className="hidden min-[400px]:inline">{t('details')}</span>
    </button>
    <button type="button" onClick={directions} aria-label={t('getDirections')} title={t('getDirections')} className={`${BTN_PRIMARY} h-9 w-9 flex-shrink-0`}>
      <FiNavigation className="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
);

const ShopCard = memo(({ shop, isSaved, actions, t, eager = false }) => {
  const role = getShopRole(shop);
  const RoleIcon = roleStyle(role).icon;
  const address = addressLine(shop);
  const hasRating = shop.rating > 0;
  const [mediaRef, logo] = useShopLogo(shop, eager);
  const reviews = useMemo(() => shopFallback(shop).reviews, [shop]);
  const { open, showDetails, directions, save, onKey } = useShopHandlers(shop, actions);

  return (
    <article
      onClick={open} onKeyDown={onKey} tabIndex={0} aria-label={shop.name || t('unnamedShop')}
      className={`${CARD} ${PRESS} ${LIFT} ${FOCUS} flex h-full cursor-pointer flex-col overflow-hidden`}
    >
      <div ref={mediaRef} className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] [contain:layout_paint] sm:aspect-[16/10]">
        <ShopImage src={logo} name={shop.name} role={role} eager={eager} />
        <span className={`absolute start-2 top-2 inline-flex max-w-[62%] items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold sm:start-3 sm:top-3 sm:max-w-[65%] sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${CHIP}`}>
          <RoleIcon aria-hidden="true" className="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">{serviceLabel(role, t)}</span>
        </span>
        <SaveButton isSaved={isSaved} onClick={save} t={t} className="absolute end-2 top-2 sm:end-3 sm:top-3" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3.5">
        <h3 className="flex min-w-0 items-center gap-1.5 text-[13px] font-extrabold leading-snug sm:text-sm">
          <span className="min-w-0 truncate">{shop.name || t('unnamedShop')}</span>
          {shop.verified && <VerifiedMark t={t} />}
        </h3>
        {hasRating && <RatingLine rating={shop.rating} reviews={reviews} />}
        <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[color:var(--mu)]">
          <FiMapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--acc)]" />
          <span className="truncate">{address || t('noAddress')}</span>
        </p>
        {shop.shopType && (
          <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[color:var(--acc)]">
            <FiShoppingBag aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{shop.shopType}</span>
          </p>
        )}
        <CardActions showDetails={showDetails} directions={directions} t={t} />
      </div>
    </article>
  );
});

const ShopCell = memo(({ index, className = '', children }) => (
  <div className={`sh-in min-w-0 ${className}`} style={STAGGER[index % STAGGER.length]}>{children}</div>
));

const Carousel = memo(({ title, subtitle, count, onViewAll, viewAllLabel, shops, saved, actions, t }) => {
  const ref = useRef(null);
  const scroll = useCallback((d) => {
    const el = ref.current;
    if (!el) return;
    const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollBy({ left: d * sign * el.clientWidth * 0.8, behavior: prefersReduced() ? 'auto' : 'smooth' });
  }, []);
  return (
    <section aria-label={title} className="sh-defer mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight tracking-tight rtl:tracking-normal sm:text-2xl">
            {title}
            {count != null && <span dir="ltr" className="ms-2 text-sm font-semibold tabular-nums text-[color:var(--mu)]">({count})</span>}
          </h2>
          {subtitle && <p className="mt-1.5 line-clamp-1 text-sm font-medium text-[color:var(--mu)]">{subtitle}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {onViewAll && (
            <button type="button" onClick={onViewAll} className={`${BTN_SECONDARY} h-10 px-3 text-xs`}>
              {viewAllLabel}<FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={() => scroll(-1)} aria-label={t('scrollPrev')} className={`${BTN_SECONDARY} hidden h-10 w-10 sm:inline-flex`}><FiChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={t('scrollNext')} className={`${BTN_SECONDARY} hidden h-10 w-10 sm:inline-flex`}><FiChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" /></button>
        </div>
      </div>
      <div ref={ref} className="sh-noscroll -mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-4 pt-1 sm:gap-5">
        {shops.map((s, i) => (
          <ShopCell key={s.id} index={i} className="w-[46%] flex-shrink-0 snap-start sm:w-64">
            <ShopCard shop={s} isSaved={saved.has(s.id)} actions={actions} t={t} eager={i < 2} />
          </ShopCell>
        ))}
      </div>
    </section>
  );
});

const CategoryRail = memo(({ types, countsByType, selected, onToggle, onAll, allLabel, total, ariaLabel }) => (
  <nav aria-label={ariaLabel} className="sh-noscroll -mx-2 mb-6 flex gap-3 overflow-x-auto px-2 py-2">
    <Chip active={!selected.length} onClick={onAll} icon={FiShoppingBag}>
      {allLabel} <span dir="ltr" className="tabular-nums">({total})</span>
    </Chip>
    {types.map((ty) => (
      <Chip key={ty} active={selected.includes(ty)} onClick={() => onToggle(ty)}>
        {ty} <span dir="ltr" className="tabular-nums">({countsByType[ty] || 0})</span>
      </Chip>
    ))}
  </nav>
));

const Pagination = memo(({ page, total, onChange, t }) => {
  const pages = useMemo(() => buildPages(page, total), [page, total]);
  if (total <= 1) return null;
  return (
    <nav aria-label={t('pagination')} className="mt-8 flex flex-col items-center gap-3">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button
            type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}
            aria-label={t('prevPage')} title={t('prevPage')} className={`${BTN_SECONDARY} h-10 min-w-10 px-3 text-xs`}
          >
            <FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
            <span className="hidden sm:inline">{t('prev')}</span>
          </button>
        </li>
        {pages.map((p) => (typeof p === 'number' ? (
          <li key={p}>
            <button
              type="button" onClick={() => onChange(p)} aria-label={`${t('goToPage')} ${p}`} aria-current={p === page ? 'page' : undefined}
              className={`${p === page ? BTN_ON : BTN_SECONDARY} h-10 min-w-10 px-3 text-xs tabular-nums`}
            >
              <span dir="ltr">{p}</span>
            </button>
          </li>
        ) : (
          <li key={p} aria-hidden="true" className="px-1 text-sm font-extrabold text-[color:var(--mu)]">…</li>
        )))}
        <li>
          <button
            type="button" onClick={() => onChange(page + 1)} disabled={page >= total}
            aria-label={t('nextPage')} title={t('nextPage')} className={`${BTN_SECONDARY} h-10 min-w-10 px-3 text-xs`}
          >
            <span className="hidden sm:inline">{t('next')}</span>
            <FiChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
          </button>
        </li>
      </ul>
      <p role="status" aria-live="polite" className="text-xs font-semibold text-[color:var(--mu)]">
        <span dir="ltr">{t('pageOf', { page, total })}</span>
      </p>
    </nav>
  );
});

const FilterGroup = memo(({ title, children }) => (
  <fieldset className="min-w-0 border-b-2 border-[color:var(--bd)] py-4 first:pt-0 last:border-b-0 last:pb-0">
    <legend className="mb-3 text-sm font-extrabold">{title}</legend>
    <div className="flex flex-col gap-1.5">{children}</div>
  </fieldset>
));

const FilterOption = memo(({ active, label, count, onClick, radio = false }) => {
  const disabled = count === 0 && !active;
  return (
    <button
      type="button" role={radio ? 'radio' : 'checkbox'} aria-checked={active} disabled={disabled} onClick={onClick}
      className={`flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border-2 px-3 text-start text-sm font-semibold transition-colors motion-reduce:transition-none ${FOCUS} disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'border-black bg-[#39ff88] font-extrabold text-emerald-950' : 'border-transparent hover:bg-[color:var(--sf2)]'
      }`}
    >
      <span aria-hidden="true" className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 border-current ${radio ? 'rounded-full' : 'rounded-md'}`}>
        {active && <FiCheck className="h-3 w-3" strokeWidth={4} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span dir="ltr" className={`text-xs tabular-nums ${active ? 'opacity-80' : 'text-[color:var(--mu)]'}`}>{count}</span>}
    </button>
  );
});

const STAR = <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />;

const FilterPanel = memo((p) => {
  const {
    t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    savedOnly, setSavedOnly, ratedOnly, setRatedOnly, hasPhoneOnly, setHasPhoneOnly, hasAddressOnly, setHasAddressOnly,
  } = p;
  return (
    <div className="w-full min-w-0">
      <FilterGroup title={t('serviceType')}>
        <div role="radiogroup" aria-label={t('serviceType')} className="flex flex-col gap-1.5">
          <FilterOption radio label={t('allShops')} count={roleCounts.ALL} active={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')} />
          <FilterOption radio label={t('repairServices')} count={roleCounts.REPAIRER} active={roleFilter === 'REPAIRER'} onClick={() => setRoleFilter('REPAIRER')} />
          <FilterOption radio label={t('sellTradeIn')} count={roleCounts.SELLER} active={roleFilter === 'SELLER'} onClick={() => setRoleFilter('SELLER')} />
          <FilterOption radio label={t('repairAndSell')} count={roleCounts.BOTH} active={roleFilter === 'BOTH'} onClick={() => setRoleFilter('BOTH')} />
        </div>
      </FilterGroup>

      <FilterGroup title={t('shopType')}>
        {shopTypes.length === 0
          ? <p className="text-sm text-[color:var(--mu)]">{t('noTypes')}</p>
          : (
            <div className="sh-scroll flex max-h-52 min-w-0 flex-col gap-1.5 overflow-y-auto">
              {shopTypes.map((ty) => <FilterOption key={ty} label={ty} count={countsByType[ty] || 0} active={selectedShopTypes.includes(ty)} onClick={() => toggleShopType(ty)} />)}
            </div>
          )}
      </FilterGroup>

      {cities.length > 0 && (
        <FilterGroup title={t('city')}>
          <div className="sh-scroll flex max-h-40 min-w-0 flex-col gap-1.5 overflow-y-auto">
            {cities.map((c) => <FilterOption key={c} label={c} active={selectedCities.includes(c)} onClick={() => toggleCity(c)} />)}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title={t('minimumRating')}>
        <div role="radiogroup" aria-label={t('minimumRating')} className="flex flex-col gap-1.5">
          <FilterOption radio label={t('anyRating')} active={minRating === 0} onClick={() => setMinRating(0)} />
          {RATING_STEPS.map((v) => (
            <FilterOption
              key={v} radio active={minRating === v} onClick={() => setMinRating(v)}
              label={<span className="inline-flex items-center gap-1.5">{STAR}<span dir="ltr">{v}+</span> {t('stars')}</span>}
            />
          ))}
        </div>
        <FilterOption label={t('verifiedOnly')} active={showVerifiedOnly} onClick={() => setShowVerifiedOnly((v) => !v)} />
        <FilterOption label={t('savedOnly')} active={savedOnly} onClick={() => setSavedOnly((v) => !v)} />
      </FilterGroup>

      <FilterGroup title={t('moreFilters')}>
        <FilterOption label={t('ratedOnly')} active={ratedOnly} onClick={() => setRatedOnly((v) => !v)} />
        <FilterOption label={t('hasPhone')} active={hasPhoneOnly} onClick={() => setHasPhoneOnly((v) => !v)} />
        <FilterOption label={t('hasAddress')} active={hasAddressOnly} onClick={() => setHasAddressOnly((v) => !v)} />
      </FilterGroup>
    </div>
  );
});

const FilterDrawer = memo(({ onClose, onApply, t, total, onClear, hasFilters, children }) => {
  const [leaving, requestClose] = useLeave(onClose);
  useModalLock(true, requestClose);
  const apply = useCallback(() => { requestClose(); onApply(); }, [requestClose, onApply]);
  return (
    <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true" aria-label={t('filters')}>
      <div className={`${leaving ? 'sh-fade-out' : 'sh-fade'} absolute inset-0 bg-[color:var(--scrim)]`} onClick={requestClose} aria-hidden="true" />
      <div className={`${CARD} ${leaving ? 'sh-drawer-out' : 'sh-drawer'} absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col !rounded-none`}>
        <div className="flex items-center justify-between border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf2)] p-4">
          <h2 className="text-base font-extrabold">{t('filters')}</h2>
          <button type="button" onClick={requestClose} aria-label={t('closeFilters')} className={`${BTN_SECONDARY} h-9 w-9`}>
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="sh-scroll flex-1 overflow-y-auto p-4">{children}</div>
        <div className="flex gap-3 border-t-[3px] border-[color:var(--ln)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {hasFilters && <button type="button" onClick={onClear} className={`${BTN_SECONDARY} min-h-11 flex-1 text-xs`}>{t('clearAll')}</button>}
          <button type="button" onClick={apply} className={`${BTN_PRIMARY} min-h-11 flex-[2] text-xs`}>
            {t('showShops', { count: total })}
          </button>
        </div>
      </div>
    </div>
  );
});

const SortDropdown = memo(({ value, onChange, options, label }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const id = useId().replace(/:/g, '');
  const selected = Math.max(0, options.findIndex(([k]) => k === value));
  const current = options[selected]?.[1] || '';

  const close = useCallback((refocus) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);
  const openAt = useCallback((i) => { setActive(i); setOpen(true); }, []);
  const toggle = useCallback(() => { if (open) close(false); else openAt(selected); }, [open, close, openAt, selected]);
  const choose = useCallback((i) => { onChange(options[i][0]); close(true); }, [onChange, options, close]);

  useEffect(() => {
    if (!open) return undefined;
    listRef.current?.focus();
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const onButtonKey = useCallback((e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openAt(selected); }
  }, [openAt, selected]);

  const onListKey = useCallback((e) => {
    const last = options.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i >= last ? 0 : i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? last : i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'Tab') setOpen(false);
  }, [options.length, active, choose, close]);

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-30' : ''}`}>
      <button
        ref={btnRef} type="button" onClick={toggle} onKeyDown={onButtonKey}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-label={`${label}: ${current}`}
        className={`${FIELD} ${PRESS} ${FOCUS} flex h-11 min-w-[9rem] cursor-pointer items-center justify-between gap-2 px-4 text-sm font-bold hover:bg-[color:var(--sf2)]`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="hidden text-[color:var(--mu)] sm:inline">{label}:</span>
          <span className="truncate">{current}</span>
        </span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef} id={`${id}-list`} role="listbox" tabIndex={-1} aria-label={label}
          aria-activedescendant={`${id}-opt-${active}`} onKeyDown={onListKey}
          className={`${CARD} sh-pop absolute end-0 z-30 mt-3 w-56 max-w-[calc(100vw-2rem)] overflow-hidden p-1 outline-none`}
        >
          {options.map(([k, text], i) => {
            const isSel = k === value;
            return (
              <li
                key={k} id={`${id}-opt-${i}`} role="option" aria-selected={isSel}
                onMouseEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm ${
                  isSel ? 'bg-[#39ff88] font-extrabold text-emerald-950' : i === active ? 'bg-[color:var(--sf2)] font-bold' : 'font-semibold'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{text}</span>
                {isSel && <FiCheck aria-hidden="true" className="h-4 w-4 flex-shrink-0" strokeWidth={3} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

const InfoRow = memo(({ Icon, children }) => (
  <div className="flex items-start gap-3 rounded-2xl border-2 border-[color:var(--ln)] bg-[color:var(--sf2)] p-3">
    <IconTile Icon={Icon} className="h-9 w-9" iconClassName="h-4 w-4" />
    <div className="min-w-0 flex-1 self-center break-words text-sm font-bold">{children}</div>
  </div>
));

const ShopStats = memo(({ shop, t }) => {
  const { reviews, products } = useShopCounts(shop);
  const plus = (n) => (n == null ? '+–' : `+${n}`);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
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
  const [leaving, close] = useLeave(onClose);
  const [status, setStatus] = useState('locating');
  const [origin, setOrigin] = useState(null);
  const address = addressLine(shop);
  const name = shop.name || t('unnamedShop');
  const mapsHref = useMemo(() => safeHref(directionsUrl(shop, null)), [shop]);

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
      <div className={`${leaving ? 'sh-fade-out' : 'sh-fade'} absolute inset-0 bg-[color:var(--scrim)]`} onClick={close} aria-hidden="true" />
      <div className={`${CARD} ${leaving ? 'sh-modal-out' : 'sh-modal'} relative flex max-h-[94vh] w-full flex-col overflow-hidden sm:max-w-2xl`}>
        <header className="flex flex-shrink-0 items-center gap-3 border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf2)] px-4 py-3.5 sm:px-5">
          <IconTile Icon={FiNavigation} className="h-10 w-10" iconClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[color:var(--mu)]">{t('directionsTo')}</p>
            <h2 className="line-clamp-1 text-base font-extrabold">{name}</h2>
            <p className="line-clamp-1 text-xs text-[color:var(--mu)]">{address || t('noAddress')}</p>
          </div>
          <button type="button" onClick={close} aria-label={t('close')} className={`${BTN_SECONDARY} h-9 w-9 flex-shrink-0`}>
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="sh-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <Suspense fallback={<div className={`${SK} w-full`} style={{ aspectRatio: isMobile ? '1 / 1' : '1 / 0.62' }} />}>
            <DeliveryMap
              items={items} selectedId={origin ? shop.id : null} onSelect={noop} aspect={isMobile ? 1 : 0.62}
              startLabel={t('yourLocation')} endLabel={name}
              className="!rounded-2xl !border-[3px] !border-[color:var(--ln)]"
            />
          </Suspense>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="status" aria-live="polite" className="min-w-0 flex-1 text-xs font-semibold">
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
                <button type="button" onClick={locate} className={`${BTN_SECONDARY} min-h-10 px-4 text-xs`}>
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" />{t('retryLocation')}
                </button>
              )}
              {mapsHref && (
                <a href={mapsHref} target="_blank" rel="noopener noreferrer nofollow" className={`${BTN_PRIMARY} min-h-10 px-4 text-xs`}>
                  <FiExternalLink className="h-4 w-4" aria-hidden="true" />{t('openInMaps')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ShopDetailsModal = memo(({ shop, onClose, onOpen, onDirections, t }) => {
  const [leaving, close] = useLeave(onClose);
  const role = getShopRole(shop);
  const caps = capabilitiesFor(role);
  const address = addressLine(shop);
  const hasRating = shop.rating > 0;
  const [, logo] = useShopLogo(shop, true);
  const tel = telHref(shop.phone);
  useModalLock(true, close);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name || t('unnamedShop')}>
      <div className={`${leaving ? 'sh-fade-out' : 'sh-fade'} absolute inset-0 bg-[color:var(--scrim)]`} onClick={close} aria-hidden="true" />
      <div className={`${CARD} ${leaving ? 'sh-modal-out' : 'sh-modal'} relative flex max-h-[92vh] w-full flex-col overflow-hidden sm:max-w-md`}>
        <div className="relative h-44 w-full flex-shrink-0 overflow-hidden border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] sm:h-52">
          <ShopImage src={logo} name={shop.name} role={role} eager />
          <div className="absolute end-3 top-3 z-10 flex items-center gap-2">
            <button type="button" onClick={() => onDirections(shop)} aria-label={t('getDirections')} title={t('getDirections')} className={`${BTN_SECONDARY} h-9 w-9`}>
              <FiNavigation aria-hidden="true" className="h-4 w-4" />
            </button>
            <button type="button" onClick={close} aria-label={t('close')} className={`${BTN_SECONDARY} h-9 w-9`}>
              <FiX aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="sh-scroll min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold leading-snug">
              <span className="line-clamp-2 min-w-0">{shop.name || t('unnamedShop')}</span>
              {shop.verified && <VerifiedMark t={t} />}
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
              <span className="text-[color:var(--acc)]">{serviceLabel(role, t)}</span>
              {hasRating && (
                <span className="inline-flex items-center gap-1">
                  <RiStarFill className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /><span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
                </span>
              )}
            </p>
            <div className="mt-3"><ShopStats shop={shop} t={t} /></div>
          </div>

          <section>
            <h3 className="mb-2 text-sm font-extrabold">{t('about')}</h3>
            <p className="text-sm leading-relaxed text-[color:var(--mu)]">{shop.description || t('noDescription')}</p>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-extrabold">{t('whatShopCanDo')}</h3>
            <ul className="grid gap-3">
              {caps.map(({ icon: Icon, titleKey, textKey }) => (
                <li key={titleKey} className="flex items-start gap-3">
                  <IconTile Icon={Icon} className="h-10 w-10" iconClassName="h-4 w-4" />
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">{t(titleKey)}</p>
                    <p className="text-xs text-[color:var(--mu)]">{t(textKey)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2.5">
            {shop.shopType && <InfoRow Icon={FiShoppingBag}>{shop.shopType}</InfoRow>}
            <InfoRow Icon={FiMapPin}>{address || t('noAddress')}</InfoRow>
            {tel && (
              <InfoRow Icon={FiPhone}>
                <a href={tel} dir="ltr" className={TEXT_LINK}>{shop.phone}</a>
              </InfoRow>
            )}
          </section>
        </div>

        <footer className="grid flex-shrink-0 grid-cols-2 gap-3 border-t-[3px] border-[color:var(--ln)] px-4 py-3.5 sm:px-5">
          <button type="button" onClick={close} className={`${BTN_SECONDARY} min-h-11 px-4 text-xs`}>{t('close')}</button>
          <button type="button" onClick={() => onOpen(shop.id)} className={`${BTN_PRIMARY} min-h-11 px-4 text-xs`}>
            <RiStoreLine className="h-4 w-4" aria-hidden="true" />{t('visitShop')}
          </button>
        </footer>
      </div>
    </div>
  );
});

const ShopsContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k, params) => tr(language, k, params), [language]);
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [isPending, startTransition] = useTransition();
  useScrollTopOnEnter();

  const [saved, toggleSaved] = useSavedShops();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [page, setPage] = useState(1);
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsShop, setDetailsShop] = useState(null);
  const [directionsShop, setDirectionsShop] = useState(null);
  const gridRef = useRef(null);
  const barRef = useRef(null);
  const showTop = useBackToTop();

  useScrollProgress(barRef);
  useEffect(() => { document.title = `${t('pageTitle')} | Tech-Restore`; }, [t]);
  useEffect(() => { if (isDesktop) setDrawerOpen(false); }, [isDesktop]);

  const { data: shops = EMPTY_LIST, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['shopsList'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/shops/all', { signal });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const item of list) {
        if (out.length >= SHOPS_MAX) break;
        const shop = normalizeShop(item);
        if (shop) out.push(shop);
      }
      return out;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { shopTypes, cities, countsByType, roleCounts, topRated, roleGroups, searchIndex, verifiedCount } = useMemo(() => {
    const types = new Set();
    const citySet = new Set();
    const counts = Object.create(null);
    const index = new Map();
    let rep = 0; let sell = 0; let both = 0; let verified = 0;
    const byRole = { REPAIRER: [], SELLER: [] };
    for (const s of shops) {
      if (s.shopType) { types.add(s.shopType); counts[s.shopType] = (counts[s.shopType] || 0) + 1; }
      if (s.shopAddress?.city) citySet.add(s.shopAddress.city);
      if (s.verified) verified++;
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
      verifiedCount: verified,
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
    setPage(1);
  }, [deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, savedOnly, ratedOnly, hasPhoneOnly, hasAddressOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleShops = useMemo(
    () => filteredShops.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredShops, currentPage],
  );

  const scrollToGrid = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToEl(gridRef.current)));
  }, []);
  const goToPage = useCallback((p) => {
    const next = Math.min(totalPages, Math.max(1, Math.floor(Number(p)) || 1));
    startTransition(() => setPage(next));
    scrollToGrid();
  }, [totalPages, scrollToGrid]);
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
  }, []);
  const openShop = useCallback((id) => {
    const safe = safeId(id);
    if (safe) navigate(`/shops/${encodeURIComponent(safe)}`);
  }, [navigate]);
  const toggleShopType = useCallback((ty) => setSelectedShopTypes((p) => (p.includes(ty) ? p.filter((x) => x !== ty) : [...p, ty])), []);
  const toggleCity = useCallback((c) => setSelectedCities((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const clearTypes = useCallback(() => setSelectedShopTypes([]), []);
  const clearFilters = useCallback(() => {
    setSearchTerm(''); setRoleFilter('ALL'); setSelectedShopTypes([]); setSelectedCities([]); setMinRating(0);
    setShowVerifiedOnly(false); setSavedOnly(false); setRatedOnly(false); setHasPhoneOnly(false); setHasAddressOnly(false);
    setSortBy('relevance'); setPage(1);
  }, []);
  const onSearch = useCallback((e) => setSearchTerm(stripControl(e.target.value).slice(0, QUERY_MAX)), []);
  const openDetails = useCallback((shop) => setDetailsShop(shop), []);
  const closeDetails = useCallback(() => setDetailsShop(null), []);
  const openDirections = useCallback((shop) => setDirectionsShop(shop), []);
  const closeDirections = useCallback(() => setDirectionsShop(null), []);
  const openFromModal = useCallback((id) => { setDetailsShop(null); openShop(id); }, [openShop]);
  const directionsFromModal = useCallback((shop) => { setDetailsShop(null); setDirectionsShop(shop); }, []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const viewAllRole = useCallback((role) => {
    setRoleFilter(role); setSelectedShopTypes([]); setSelectedCities([]);
    scrollToGrid();
  }, [scrollToGrid]);
  const viewAllTop = useCallback(() => {
    setMinRating(4); setSortBy('ratingHighToLow');
    scrollToGrid();
  }, [scrollToGrid]);

  const actions = useMemo(() => ({
    onDetails: openDetails, onOpen: openShop, onDirections: openDirections, onSave: toggleSaved,
  }), [openDetails, openShop, openDirections, toggleSaved]);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (roleFilter !== 'ALL' ? 1 : 0) + selectedShopTypes.length + selectedCities.length
    + (minRating > 0 ? 1 : 0) + (showVerifiedOnly ? 1 : 0) + (savedOnly ? 1 : 0) + (ratedOnly ? 1 : 0) + (hasPhoneOnly ? 1 : 0) + (hasAddressOnly ? 1 : 0);
  const browsing = activeFiltersCount === 0 && sortBy === 'relevance' && currentPage === 1;

  const sortOptions = useMemo(() => [
    ['relevance', t('sortRelevance')],
    ['ratingHighToLow', t('sortRating')],
    ['verifiedFirst', t('sortVerified')],
    ['nameAZ', t('sortName')],
  ], [t]);

  const hasShops = shops.length > 0;
  const showTools = !isLoading && !isError && hasShops;
  const showSidebar = isDesktop && (isLoading || (!isError && hasShops));
  const showFilterButton = !isDesktop && showTools;
  const panelOn = showSidebar || drawerOpen;

  const panel = useMemo(() => (panelOn ? (
    <FilterPanel
      t={t} shopTypes={shopTypes} countsByType={countsByType} selectedShopTypes={selectedShopTypes} toggleShopType={toggleShopType}
      cities={cities} selectedCities={selectedCities} toggleCity={toggleCity}
      roleFilter={roleFilter} setRoleFilter={setRoleFilter} roleCounts={roleCounts} minRating={minRating} setMinRating={setMinRating}
      showVerifiedOnly={showVerifiedOnly} setShowVerifiedOnly={setShowVerifiedOnly} savedOnly={savedOnly} setSavedOnly={setSavedOnly}
      ratedOnly={ratedOnly} setRatedOnly={setRatedOnly} hasPhoneOnly={hasPhoneOnly} setHasPhoneOnly={setHasPhoneOnly}
      hasAddressOnly={hasAddressOnly} setHasAddressOnly={setHasAddressOnly}
    />
  ) : null), [panelOn, t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, roleCounts, minRating, showVerifiedOnly, savedOnly, ratedOnly, hasPhoneOnly, hasAddressOnly]);

  return (
    <DarkCtx.Provider value={Boolean(darkMode)}>
      <div dir={languageDirection(language)} lang={language} className={`sh min-h-screen [overflow-x:clip] ${darkMode ? 'sh-dark' : 'sh-light'}`}>
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[1200] h-1">
          <div ref={barRef} className="h-full origin-left bg-[#39ff88] rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
        </div>

        <main className="mx-auto max-w-[88rem] px-4 pb-16 pt-36 sm:px-6 md:pt-32 lg:px-8" aria-busy={isLoading || isPending}>
          <header className="mb-8">
            <Crumbs t={t} />
            <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <h1 className="min-w-0 text-2xl font-extrabold leading-tight tracking-tight rtl:tracking-normal sm:text-3xl">{t('pageTitle')}</h1>
              {isLoading ? (
                <div aria-hidden="true" className="flex gap-2"><Sk className="h-8 w-28" /><Sk className="h-8 w-24" /></div>
              ) : hasShops && (
                <div className="sh-in flex flex-wrap gap-3 text-xs font-extrabold">
                  <span className={`rounded-full px-3 py-1.5 ${CHIP}`}><span dir="ltr" className="tabular-nums">{shops.length}</span>&nbsp;{t('allShops')}</span>
                  {verifiedCount > 0 && (
                    <span className="rounded-full border-2 border-black bg-amber-300 px-3 py-1.5 text-black"><span dir="ltr" className="tabular-nums">{verifiedCount}</span>&nbsp;{t('verified')}</span>
                  )}
                </div>
              )}
            </div>
          </header>

          <div className={`grid items-start gap-8 ${showSidebar ? 'lg:grid-cols-[17rem_minmax(0,1fr)] xl:gap-10' : ''}`}>
            {showSidebar && (
              <aside className="self-start lg:sticky lg:top-28" aria-label={t('filters')}>
                {isLoading ? <FilterSkeleton /> : (
                  <section className={`sh-scroll sh-in max-h-[calc(100vh-8rem)] overflow-y-auto p-4 ${CARD}`}>
                    <div className="mb-4 flex items-center justify-between gap-2 border-b-2 border-[color:var(--bd)] pb-3">
                      <h2 className="flex items-center gap-2 text-base font-extrabold">
                        <FiSliders aria-hidden="true" className="h-4 w-4 text-[color:var(--acc)]" />{t('filters')}
                      </h2>
                      {activeFiltersCount > 0 && (
                        <button type="button" onClick={clearFilters} className={`${TEXT_LINK} text-xs font-extrabold text-[color:var(--acc)]`}>{t('resetAll')}</button>
                      )}
                    </div>
                    {panel}
                  </section>
                )}
              </aside>
            )}

            <section className="min-w-0 scroll-mt-28" aria-label={t('allShopsTitle')}>
              {isLoading && (
                <div aria-hidden="true" className="mb-5 flex flex-wrap items-center gap-3">
                  <Sk className="h-11 min-w-0 flex-1 basis-60" />
                  <Sk className="h-11 w-40" />
                </div>
              )}

              {showTools && (
                <>
                  <div className="sh-in mb-4 flex flex-wrap items-center gap-3">
                    <div className={`${FIELD} sh-field relative flex h-11 min-w-0 flex-1 basis-60 items-center gap-2 px-4`} role="search">
                      <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" />
                      <input
                        type="search" value={searchTerm} onChange={onSearch} placeholder={t('search')} aria-label={t('searchAria')}
                        maxLength={QUERY_MAX} autoComplete="off" spellCheck={false} enterKeyHint="search"
                        className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-normal sm:text-sm"
                      />
                      {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} aria-label={t('clearSearch')} className={`flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full ${FOCUS}`}>
                          <FiX aria-hidden="true" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <SortDropdown value={sortBy} onChange={setSortBy} options={sortOptions} label={t('sortBy')} />
                    {showFilterButton && (
                      <button type="button" onClick={openDrawer} aria-haspopup="dialog" className={`${BTN_SECONDARY} h-11 flex-shrink-0 px-4 text-xs`}>
                        <FiSliders aria-hidden="true" className="h-4 w-4" />{t('filters')}
                        {activeFiltersCount > 0 && (
                          <span dir="ltr" className={`sh-pop inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[11px] font-extrabold tabular-nums ${CHIP}`}>{activeFiltersCount}</span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="sh-noscroll -mx-2 mb-5 flex items-center gap-3 overflow-x-auto px-2 py-2">
                    <Chip active={roleFilter === 'REPAIRER'} onClick={() => setRoleFilter(roleFilter === 'REPAIRER' ? 'ALL' : 'REPAIRER')} icon={FiTool}>{t('repairServices')}</Chip>
                    <Chip active={roleFilter === 'SELLER'} onClick={() => setRoleFilter(roleFilter === 'SELLER' ? 'ALL' : 'SELLER')} icon={FiShoppingBag}>{t('sellTradeIn')}</Chip>
                    <Chip active={roleFilter === 'BOTH'} onClick={() => setRoleFilter(roleFilter === 'BOTH' ? 'ALL' : 'BOTH')} icon={FiRefreshCw}>{t('repairAndSell')}</Chip>
                    <Chip active={minRating >= 4} onClick={() => setMinRating(minRating >= 4 ? 0 : 4)} icon={RiStarFill}>4+ {t('stars')}</Chip>
                    <Chip active={showVerifiedOnly} onClick={() => setShowVerifiedOnly((v) => !v)} icon={RiVerifiedBadgeLine}>{t('verified')}</Chip>
                    <Chip active={savedOnly} onClick={() => setSavedOnly((v) => !v)} icon={FiHeart}>{t('savedOnly')}</Chip>
                  </div>
                </>
              )}

              <div className={`transition-opacity duration-200 motion-reduce:transition-none ${isPending ? 'opacity-60' : ''}`}>
                {isLoading ? (
                  <PageSkeleton label={t('loading')} />
                ) : isError ? (
                  <StateBox label={t('loadErrorTitle')} hint={t('loadErrorText')} onAction={refetch} actionLabel={t('tryAgain')} fetching={isFetching} />
                ) : !hasShops ? (
                  <StateBox label={t('noShops')} hint={t('newShopsSoon')} />
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

                    <section aria-label={t('allShopsTitle')} className="pt-2">
                      <div id="shop-results" ref={gridRef} className="mb-5 flex scroll-mt-28 flex-wrap items-end justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-xl font-extrabold tracking-tight rtl:tracking-normal sm:text-2xl">{t('allShopsTitle')}</h2>
                          <p role="status" className="mt-1.5 text-sm font-medium text-[color:var(--mu)]">
                            <b dir="ltr" className="font-extrabold tabular-nums text-[color:var(--tx)]">{filteredShops.length}</b> {t('shopsFound')}
                          </p>
                        </div>
                        {activeFiltersCount > 0 && (
                          <button type="button" onClick={clearFilters} className={`${TEXT_LINK} text-sm font-extrabold text-[color:var(--acc)]`}>{t('clearAll')}</button>
                        )}
                      </div>

                      {(selectedShopTypes.length > 0 || selectedCities.length > 0) && (
                        <div className="mb-5 flex flex-wrap items-center gap-3">
                          {selectedShopTypes.map((ty) => <Chip key={`ty-${ty}`} active onClick={() => toggleShopType(ty)} onRemove>{ty}</Chip>)}
                          {selectedCities.map((c) => <Chip key={`c-${c}`} active onClick={() => toggleCity(c)} onRemove>{c}</Chip>)}
                        </div>
                      )}

                      {filteredShops.length === 0 ? (
                        <StateBox label={t('noMatch')} hint={t('tryRemoveFilter')} onAction={clearFilters} actionLabel={t('clearFilters')} />
                      ) : (
                        <>
                          <div key={currentPage} className={GRID}>
                            {visibleShops.map((s, i) => (
                              <ShopCell key={s.id} index={i}>
                                <ShopCard shop={s} isSaved={saved.has(s.id)} actions={actions} t={t} eager={i < 4} />
                              </ShopCell>
                            ))}
                          </div>
                          <Pagination page={currentPage} total={totalPages} onChange={goToPage} t={t} />
                        </>
                      )}
                    </section>
                  </>
                )}
              </div>
            </section>
          </div>
        </main>

        {showTop && (
          <div className="sh-pop fixed bottom-5 end-5 z-40">
            <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} title={t('backToTop')} className={`${BTN_PRIMARY} h-12 w-12`}>
              <FiArrowUp aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        )}

        {drawerOpen && !isDesktop && (
          <FilterDrawer onClose={closeDrawer} onApply={scrollToGrid} t={t} total={filteredShops.length} onClear={clearFilters} hasFilters={activeFiltersCount > 0}>
            {panel}
          </FilterDrawer>
        )}

        {detailsShop && (
          <ShopDetailsModal key={detailsShop.id} shop={detailsShop} onClose={closeDetails} onOpen={openFromModal} onDirections={directionsFromModal} t={t} />
        )}

        {directionsShop && (
          <DirectionsModal key={`dir-${directionsShop.id}`} shop={directionsShop} onClose={closeDirections} t={t} />
        )}
      </div>
    </DarkCtx.Provider>
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