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

const BATCH = 12;
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
const REDUCED_Q = '(prefers-reduced-motion: reduce)';
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));
const RISE = Array.from({ length: 4 }, (_, i) => ({ '--d': i }));
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const GRID = 'grid grid-cols-1 gap-6 min-[720px]:grid-cols-2 xl:grid-cols-3';
const RATING_STEPS = [4, 4.5, 4.8];
const EMPTY_LIST = [];

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
    crumbHome: 'Home', crumbShops: 'Shops', breadcrumb: 'Breadcrumb',
    pageSub: 'Find trusted repair and device shops near you. Compare ratings, services and locations.',
  },
  ar: {
    reviewOne: 'تقييم', reviewMany: 'تقييمات', productOne: 'منتج', productMany: 'منتجات',
    noAddress: 'لا يوجد عنوان مسجل', loadingMore: 'جارٍ تحميل المزيد من المتاجر', endOfList: 'لقد شاهدت جميع المتاجر',
    save: 'حفظ المتجر', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', directionsTo: 'الاتجاهات إلى', yourLocation: 'موقعك',
    locating: 'جارٍ تحديد موقعك', locationDenied: 'تعذر تحديد موقعك. يظهر المتجر على الخريطة.',
    openInMaps: 'فتح في الخرائط', retryLocation: 'إعادة المحاولة',
    moreFilters: 'فلاتر إضافية', ratedOnly: 'لديه تقييمات', hasPhone: 'لديه رقم هاتف', hasAddress: 'لديه عنوان',
    repairAndSell: 'صيانة وبيع', sortVerified: 'الموثقة أولاً', scrollPrev: 'السابق', scrollNext: 'التالي',
    crumbHome: 'الرئيسية', crumbShops: 'المتاجر', breadcrumb: 'مسار التنقل',
    pageSub: 'اعثر على متاجر صيانة وأجهزة موثوقة بالقرب منك، وقارن التقييمات والخدمات والمواقع.',
  },
  fr: {
    reviewOne: 'avis', reviewMany: 'avis', productOne: 'produit', productMany: 'produits',
    noAddress: 'Aucune adresse indiquée', loadingMore: "Chargement d'autres boutiques", endOfList: 'Vous avez vu toutes les boutiques',
    save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrées uniquement', directionsTo: 'Itinéraire vers', yourLocation: 'Votre position',
    locating: 'Localisation en cours', locationDenied: 'Position introuvable. La boutique est affichée sur la carte.',
    openInMaps: 'Ouvrir dans Maps', retryLocation: 'Réessayer',
    moreFilters: 'Plus de filtres', ratedOnly: 'Avec des notes', hasPhone: 'Avec téléphone', hasAddress: 'Avec adresse',
    repairAndSell: 'Réparation & vente', sortVerified: 'Vérifiées d’abord', scrollPrev: 'Précédent', scrollNext: 'Suivant',
    crumbHome: 'Accueil', crumbShops: 'Boutiques', breadcrumb: "Fil d'Ariane",
    pageSub: 'Trouvez des boutiques de réparation et d’appareils de confiance près de chez vous. Comparez notes, services et adresses.',
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

const NB_CSS = `
@font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
.nb{--dx:1;--nb-bg:#ffffff;--nb-card:#ffffff;--nb-ink:#052e1e;--nb-muted:rgba(5,46,30,.68);--nb-line:#e5e7eb;--nb-bd:#000000;--nb-gray:#f3f4f6;--nb-media:#ffffff;--nb-accent:#059669;--nb-btn:#39ff88;--nb-btn2:#7dffb0;--nb-on:#022c22;--nb-ring:#059669;--nb-scrim:rgba(0,0,0,.6);--nb-warn:#c2410c;--nb-glow:rgba(57,255,136,.18);--nb-ease:cubic-bezier(.22,.8,.2,1);
--nb-sh2:calc(var(--dx)*2px) 2px 0 0 var(--nb-bd);--nb-sh3:calc(var(--dx)*3px) 3px 0 0 var(--nb-bd);--nb-sh4:calc(var(--dx)*4px) 4px 0 0 var(--nb-bd);--nb-sh6:calc(var(--dx)*6px) 6px 0 0 var(--nb-bd);--nb-sh8:calc(var(--dx)*8px) 8px 0 0 var(--nb-bd);
background:var(--nb-bg);color:var(--nb-ink);color-scheme:light;line-height:1.55;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.nb[dir=rtl]{--dx:-1}
.nb-dark{--nb-bg:#121212;--nb-card:#1c1c1e;--nb-ink:#ffffff;--nb-muted:rgba(255,255,255,.66);--nb-line:rgba(255,255,255,.12);--nb-bd:#000000;--nb-gray:#2a2a2e;--nb-media:#161618;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-btn2:#7dffb0;--nb-on:#022c22;--nb-ring:#39ff88;--nb-scrim:rgba(0,0,0,.72);--nb-warn:#fdba74;--nb-glow:rgba(57,255,136,.14);color-scheme:dark}
.nb[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
.nb[lang=ar] *{letter-spacing:0!important}
.nb button,.nb input{font-family:inherit}
.nb-gray{background:var(--nb-gray)}
.nb-media{background:var(--nb-media)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-warn{color:var(--nb-warn)}
.nb-line{border-color:var(--nb-line)}
.nb-bd{border-color:var(--nb-bd)}
.nb-card{background:var(--nb-card);border:3px solid var(--nb-bd);border-radius:20px;box-shadow:var(--nb-sh4);transition:transform .35s var(--nb-ease),box-shadow .35s var(--nb-ease)}
.nb-big{box-shadow:var(--nb-sh8)}
@media (hover:hover){.nb-lift:hover{transform:translate3d(0,-3px,0);box-shadow:var(--nb-sh6)}}
.nb-chip{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;border:2px solid var(--nb-bd);border-radius:10px;background:var(--nb-btn);color:var(--nb-on);box-shadow:var(--nb-sh2)}
.nb-chip-warn{background:#fcd34d;color:#000}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-bd);border-radius:12px;box-shadow:var(--nb-sh3);font-weight:700;cursor:pointer;transition:transform .2s var(--nb-ease),box-shadow .2s var(--nb-ease),background-color .2s ease,color .2s ease}
@media (hover:hover){.nb-btn:hover:not(:disabled){background:var(--nb-btn);color:var(--nb-on);box-shadow:var(--nb-sh4);transform:translate3d(0,-1px,0)}}
.nb-btn:active:not(:disabled){transform:translate3d(0,2px,0);box-shadow:none}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on);border-width:3px;box-shadow:var(--nb-sh4)}
@media (hover:hover){.nb-btn-a:hover:not(:disabled),.nb-btn-on:hover:not(:disabled){background:var(--nb-btn2)}}
.nb-btn:focus-visible,.nb-focus:focus-visible{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-bd);border-radius:14px;box-shadow:var(--nb-sh3);transition:box-shadow .2s var(--nb-ease)}
@media (hover:hover){.nb-field:hover{box-shadow:var(--nb-sh4)}}
.nb-field:focus-within{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-field input::placeholder{color:var(--nb-muted)}
.nb-field input::-webkit-search-cancel-button,.nb-field input::-webkit-search-decoration{display:none;-webkit-appearance:none}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:3px dashed var(--nb-bd);border-radius:20px}
.nb-rule{border-top:3px solid var(--nb-bd)}
.nb-sk{position:relative;overflow:hidden;border-radius:12px;background:color-mix(in srgb,var(--nb-ink) 8%,transparent)}
.nb-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--nb-card) 70%,transparent),transparent);animation:nbShimmer 1.3s ease-in-out infinite}
.nb[dir=rtl] .nb-sk::after{animation-direction:reverse}
@keyframes nbShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.nb-opt{border-radius:12px;transition:background-color .2s ease,color .2s ease}
@media (hover:hover){.nb-zoom img{transition:transform 1.1s var(--nb-ease),opacity .3s ease}.nb-zoom:hover img{transform:scale3d(1.04,1.04,1)}}
@keyframes nbIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.nb-in{animation:nbIn .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*40ms)}
@keyframes nbRise{from{opacity:0;transform:translate3d(0,16px,0)}to{opacity:1;transform:none}}
.nb-rise{animation:nbRise .6s cubic-bezier(.16,.84,.24,1) both;animation-delay:calc(var(--d,0)*70ms)}
@keyframes shFade{from{opacity:0}to{opacity:1}}
@keyframes shFadeOut{from{opacity:1}to{opacity:0}}
@keyframes shModal{from{opacity:0;transform:translate3d(0,24px,0)}to{opacity:1;transform:none}}
@keyframes shModalOut{from{opacity:1;transform:none}to{opacity:0;transform:translate3d(0,24px,0)}}
@keyframes shDrawer{from{transform:translate3d(calc(var(--dx,1)*-100%),0,0)}to{transform:none}}
@keyframes shDrawerOut{from{transform:none}to{transform:translate3d(calc(var(--dx,1)*-100%),0,0)}}
@keyframes shPop{from{opacity:0;transform:translate3d(0,-6px,0)}to{opacity:1;transform:none}}
@keyframes shHeart{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes shDot{0%,80%,100%{transform:scale(.55);opacity:.4}40%{transform:scale(1);opacity:1}}
.sh-fade{animation:shFade .18s ease-out both}
.sh-fade-out{animation:shFadeOut .18s ease-in both}
.sh-modal{animation:shModal .24s cubic-bezier(.2,.8,.2,1) both}
.sh-modal-out{animation:shModalOut .18s ease-in both}
.sh-drawer{animation:shDrawer .26s cubic-bezier(.2,.8,.2,1) both}
.sh-drawer-out{animation:shDrawerOut .18s ease-in both}
.sh-pop{animation:shPop .16s cubic-bezier(.2,.8,.2,1) both;transform-origin:top}
.sh-heart{animation:shHeart .3s ease-out}
.sh-dot{animation:shDot 1s ease-in-out infinite}
.sh-dot:nth-child(2){animation-delay:.15s}
.sh-dot:nth-child(3){animation-delay:.3s}
.sh-noscroll{scrollbar-width:none;-ms-overflow-style:none}
.sh-noscroll::-webkit-scrollbar{display:none}
.sh-lazy{content-visibility:auto;contain-intrinsic-size:auto 420px;padding:8px;margin:-8px}
@media (prefers-reduced-motion:no-preference){html:has(.nb){scroll-behavior:smooth}}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-field,.nb-opt,.nb-zoom img{transition:none}.nb-lift:hover,.nb-btn:hover:not(:disabled),.nb-zoom:hover img{transform:none}.nb-in,.nb-rise,.sh-fade,.sh-fade-out,.sh-modal,.sh-modal-out,.sh-drawer,.sh-drawer-out,.sh-pop,.sh-heart,.sh-dot{animation:none!important}.nb-sk::after{animation:none}}
`;

if (typeof document !== 'undefined' && !document.querySelector('style[data-shops-styles]')) {
  const tag = document.createElement('style');
  tag.setAttribute('data-shops-styles', 'true');
  tag.textContent = NB_CSS;
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

const MOBILE_Q = '(max-width: 639.98px)';
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

const Sk = ({ className = '' }) => <div aria-hidden="true" className={`nb-sk ${className}`} />;

const IconTile = memo(({ Icon, className = 'h-9 w-9', iconClassName = 'h-4 w-4' }) => (
  <span aria-hidden="true" className={`nb-chip ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const Crumbs = memo(({ t }) => (
  <nav aria-label={t('breadcrumb')} className="nb-muted flex flex-wrap items-center gap-2 text-sm font-medium">
    <Link to="/" className="nb-focus rounded-md transition-colors hover:text-[color:var(--nb-accent)]">{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    <span aria-current="page" className="text-[color:var(--nb-ink)]">{t('crumbShops')}</span>
  </nav>
));

const CardSkeleton = memo(({ carousel = false }) => (
  <div className={`nb-card overflow-hidden ${carousel ? 'w-[72%] flex-shrink-0 sm:w-72' : ''}`} aria-hidden="true">
    <Sk className="aspect-[16/10] w-full !rounded-none" />
    <div className="space-y-2.5 p-3.5">
      <Sk className="h-4 w-3/4" />
      <Sk className="h-3 w-1/2" />
      <Sk className="h-3 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Sk className="h-9 w-20" />
        <Sk className="h-9 w-9" />
      </div>
    </div>
  </div>
));

const CarouselSkeleton = memo(() => (
  <div className="py-6" aria-hidden="true">
    <div className="mb-4 space-y-2">
      <Sk className="h-6 w-48" />
      <Sk className="h-3 w-64 max-w-full" />
    </div>
    <div className="flex gap-5 overflow-hidden">
      {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} carousel />)}
    </div>
  </div>
));

const PageSkeleton = memo(({ label }) => (
  <div role="status" aria-busy="true" aria-label={label}>
    <CarouselSkeleton />
    <div className="mb-4 mt-6 space-y-2">
      <Sk className="h-6 w-40" />
      <Sk className="h-3 w-56 max-w-full" />
    </div>
    <div className={GRID}>
      {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
    </div>
  </div>
));

const FilterSkeleton = memo(() => (
  <div aria-hidden="true" className="nb-card space-y-6 self-start p-4">
    {[0, 1].map((g) => (
      <div key={g} className="space-y-2">
        <Sk className="h-4 w-24" />
        {[0, 1, 2, 3].map((r) => <Sk key={r} className="h-10 w-full" />)}
      </div>
    ))}
  </div>
));

const StateBox = memo(({ label, hint, onAction, actionLabel, fetching }) => (
  <div className="nb-dot nb-in flex flex-col items-center px-4 py-14 text-center">
    <ThemedIso type="shopsEmpty" tone="emerald" onGreen={false} className="mb-3 h-28 w-28" />
    <p className="text-base font-bold">{label}</p>
    {hint && <p className="nb-muted mt-1 max-w-md text-sm">{hint}</p>}
    {onAction && actionLabel && (
      <button type="button" onClick={() => onAction()} className="nb-btn nb-btn-a mt-5 min-h-11 px-4 text-sm">
        <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${fetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{actionLabel}
      </button>
    )}
  </div>
));

const Chip = memo(({ active, onClick, children, icon: Icon, onRemove }) => (
  <button
    type="button" onClick={onClick} aria-pressed={active}
    className={`nb-btn nb-focus h-10 flex-shrink-0 whitespace-nowrap px-3 text-xs ${active ? 'nb-btn-on' : ''}`}
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
      <div className="nb-gray absolute inset-0 flex items-end justify-center px-6 pt-5">
        <ThemedIso type={isoRoleKey(role)} tone="emerald" onGreen={false} className="pointer-events-none h-full w-auto max-w-full" />
      </div>
    );
  }
  return (
    <>
      {!loaded && <div aria-hidden="true" className="nb-sk absolute inset-0 !rounded-none" />}
      <img
        ref={imgRef} src={src} alt={name || ''} width={400} height={250}
        loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} decoding="async" referrerPolicy="no-referrer"
        onLoad={onLoad} onError={onError}
        className={`absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-300 motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
});

const RatingLine = ({ rating, reviews, className = '' }) => (
  <p className={`flex items-center gap-1 text-xs font-bold ${className}`}>
    <RiStarFill className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
    <span dir="ltr" className="tabular-nums">{rating.toFixed(1)}</span>
    {reviews > 0 && <span dir="ltr" className="nb-muted font-semibold tabular-nums">({reviews})</span>}
  </p>
);

const SaveButton = ({ isSaved, onClick, t, className = '' }) => (
  <button
    type="button" onClick={onClick} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
    className={`nb-btn nb-focus h-9 w-9 flex-shrink-0 !rounded-full ${className}`}
  >
    <FiHeart key={String(isSaved)} className={`h-4 w-4 ${isSaved ? 'sh-heart text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
  </button>
);

const VerifiedMark = ({ t }) => (
  <span className="nb-ic inline-flex flex-shrink-0">
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
    <button type="button" onClick={showDetails} className="nb-btn nb-focus h-9 px-3 text-xs">
      <FiInfo className="h-4 w-4" aria-hidden="true" />{t('details')}
    </button>
    <button type="button" onClick={directions} aria-label={t('getDirections')} title={t('getDirections')} className="nb-btn nb-btn-a nb-focus h-9 w-9">
      <FiNavigation className="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
);

const ShopCard = memo(({ shop, isSaved, actions, t, eager = false }) => {
  const role = getShopRole(shop);
  const rs = roleStyle(role);
  const address = addressLine(shop);
  const hasRating = shop.rating > 0;
  const [mediaRef, logo] = useShopLogo(shop, eager);
  const reviews = useMemo(() => shopFallback(shop).reviews, [shop]);
  const { open, showDetails, directions, save, onKey } = useShopHandlers(shop, actions);

  return (
    <article
      onClick={open} onKeyDown={onKey} tabIndex={0} aria-label={shop.name || t('unnamedShop')}
      className="nb-card nb-lift nb-zoom nb-focus flex h-full cursor-pointer flex-col overflow-hidden"
    >
      <div ref={mediaRef} className="nb-media nb-bd relative aspect-[16/10] w-full flex-shrink-0 overflow-hidden border-b-[3px] [contain:layout_paint]">
        <ShopImage src={logo} name={shop.name} role={role} eager={eager} />
        <span className="nb-chip absolute start-3 top-3 max-w-[65%] gap-1.5 px-2.5 py-1 text-[11px] font-bold">
          <rs.icon aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{serviceLabel(role, t)}</span>
        </span>
        <SaveButton isSaved={isSaved} onClick={save} t={t} className="absolute end-3 top-3" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5">
        <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-bold leading-snug">
          <span className="min-w-0 truncate">{shop.name || t('unnamedShop')}</span>
          {shop.verified && <VerifiedMark t={t} />}
        </h3>
        {hasRating && <RatingLine rating={shop.rating} reviews={reviews} />}
        <p className="nb-muted flex min-w-0 items-center gap-1.5 text-xs font-semibold">
          <FiMapPin aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{address || t('noAddress')}</span>
        </p>
        {shop.shopType && (
          <p className="nb-ic flex min-w-0 items-center gap-1.5 text-xs font-semibold">
            <FiShoppingBag aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{shop.shopType}</span>
          </p>
        )}
        <CardActions showDetails={showDetails} directions={directions} t={t} />
      </div>
    </article>
  );
});

const TopRatedCard = memo(({ shop, rank, isSaved, actions, t, eager = false }) => {
  const role = getShopRole(shop);
  const address = addressLine(shop);
  const hasRating = shop.rating > 0;
  const [mediaRef, logo] = useShopLogo(shop, eager);
  const reviews = useMemo(() => shopFallback(shop).reviews, [shop]);
  const { open, showDetails, directions, save, onKey } = useShopHandlers(shop, actions);

  return (
    <article
      onClick={open} onKeyDown={onKey} tabIndex={0} aria-label={shop.name || t('unnamedShop')}
      className="nb-card nb-lift nb-zoom nb-focus flex h-full cursor-pointer items-stretch gap-4 overflow-hidden p-4"
    >
      <div ref={mediaRef} className="nb-media nb-bd relative h-28 w-28 flex-shrink-0 self-center overflow-hidden rounded-2xl border-2 [contain:layout_paint] sm:h-32 sm:w-32">
        <ShopImage src={logo} name={shop.name} role={role} eager={eager} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <span dir="ltr" aria-hidden="true" className="nb-gray nb-bd rounded-lg border-2 px-2 py-0.5 text-xs font-bold tabular-nums">#{rank}</span>
          <SaveButton isSaved={isSaved} onClick={save} t={t} />
        </div>
        <h3 className="mt-2 flex min-w-0 items-center gap-1.5 text-sm font-bold leading-snug">
          <span className="min-w-0 truncate">{shop.name || t('unnamedShop')}</span>
          {shop.verified && <VerifiedMark t={t} />}
        </h3>
        {hasRating && <RatingLine rating={shop.rating} reviews={reviews} className="mt-1" />}
        <p className="nb-muted mt-1 flex min-w-0 items-center gap-1.5 text-xs font-semibold">
          <FiMapPin aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{address || t('noAddress')}</span>
        </p>
        <CardActions showDetails={showDetails} directions={directions} t={t} />
      </div>
    </article>
  );
});

const ShopCell = memo(({ index, className = '', children }) => (
  <div className={`nb-in min-w-0 ${className}`} style={STAGGER[index % STAGGER.length]}>{children}</div>
));

const Carousel = memo(({ title, subtitle, count, onViewAll, viewAllLabel, shops, saved, actions, t, featured = false }) => {
  const ref = useRef(null);
  const scroll = useCallback((d) => {
    const el = ref.current;
    if (!el) return;
    const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollBy({ left: d * sign * el.clientWidth * 0.8, behavior: prefersReduced() ? 'auto' : 'smooth' });
  }, []);
  return (
    <section aria-label={title} className="sh-lazy mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
            {title}
            {count != null && <span dir="ltr" className="nb-muted ms-2 text-sm font-semibold tabular-nums">({count})</span>}
          </h2>
          {subtitle && <p className="nb-muted mt-1.5 line-clamp-1 text-sm">{subtitle}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {onViewAll && (
            <button type="button" onClick={onViewAll} className="nb-btn nb-focus h-10 px-3 text-xs">
              {viewAllLabel}<FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={() => scroll(-1)} aria-label={t('scrollPrev')} className="nb-btn nb-focus hidden h-10 w-10 sm:inline-flex"><FiChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={t('scrollNext')} className="nb-btn nb-focus hidden h-10 w-10 sm:inline-flex"><FiChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" /></button>
        </div>
      </div>
      <div ref={ref} className="sh-noscroll -mx-2 flex snap-x snap-mandatory gap-5 overflow-x-auto px-2 pb-3 pt-1">
        {shops.map((s, i) => (
          <ShopCell key={s.id} index={i} className={`flex-shrink-0 snap-start ${featured ? 'w-[88%] sm:w-[25rem]' : 'w-[72%] sm:w-72'}`}>
            {featured
              ? <TopRatedCard shop={s} rank={i + 1} isSaved={saved.has(s.id)} actions={actions} t={t} eager={i < 2} />
              : <ShopCard shop={s} isSaved={saved.has(s.id)} actions={actions} t={t} eager={i < 2} />}
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

const FilterGroup = memo(({ title, children }) => (
  <fieldset className="nb-line min-w-0 border-b-2 py-4 first:pt-0 last:border-b-0 last:pb-0">
    <legend className="mb-3 text-sm font-bold">{title}</legend>
    <div className="flex flex-col gap-1.5">{children}</div>
  </fieldset>
));

const FilterOption = memo(({ active, label, count, onClick, radio = false }) => {
  const disabled = count === 0 && !active;
  return (
    <button
      type="button" role={radio ? 'radio' : 'checkbox'} aria-checked={active} disabled={disabled} onClick={onClick}
      className={`nb-opt nb-focus flex min-h-10 w-full cursor-pointer items-center gap-2 border-2 px-3 text-start text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'nb-bd bg-[color:var(--nb-btn)] text-[color:var(--nb-on)]' : 'border-transparent hover:bg-[color:var(--nb-gray)]'
      }`}
    >
      <span aria-hidden="true" className={`nb-bd inline-flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 ${radio ? 'rounded-full' : 'rounded-md'}`}>
        {active && <FiCheck className="h-3 w-3" strokeWidth={4} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span dir="ltr" className={`text-xs tabular-nums ${active ? 'opacity-80' : 'nb-muted'}`}>{count}</span>}
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
          ? <p className="nb-muted text-sm">{t('noTypes')}</p>
          : (
            <div className="flex max-h-52 min-w-0 flex-col gap-1.5 overflow-y-auto overscroll-contain">
              {shopTypes.map((ty) => <FilterOption key={ty} label={ty} count={countsByType[ty] || 0} active={selectedShopTypes.includes(ty)} onClick={() => toggleShopType(ty)} />)}
            </div>
          )}
      </FilterGroup>

      {cities.length > 0 && (
        <FilterGroup title={t('city')}>
          <div className="flex max-h-40 min-w-0 flex-col gap-1.5 overflow-y-auto overscroll-contain">
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
      <div className={`${leaving ? 'sh-fade-out' : 'sh-fade'} absolute inset-0 bg-[color:var(--nb-scrim)]`} onClick={requestClose} aria-hidden="true" />
      <div className={`nb-card nb-big ${leaving ? 'sh-drawer-out' : 'sh-drawer'} absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col !rounded-none`}>
        <div className="nb-gray nb-line flex items-center justify-between border-b-2 p-4">
          <h2 className="text-base font-bold">{t('filters')}</h2>
          <button type="button" onClick={requestClose} aria-label={t('closeFilters')} className="nb-btn nb-focus h-9 w-9">
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        <div className="nb-line flex gap-3 border-t-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {hasFilters && <button type="button" onClick={onClear} className="nb-btn nb-focus min-h-11 flex-1 text-xs">{t('clearAll')}</button>}
          <button type="button" onClick={apply} className="nb-btn nb-btn-a nb-focus min-h-11 flex-[2] text-xs">
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
        className="nb-field nb-focus flex h-11 min-w-[9rem] cursor-pointer items-center justify-between gap-2 px-4 text-sm font-semibold"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="nb-muted hidden sm:inline">{label}:</span>
          <span className="truncate">{current}</span>
        </span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef} id={`${id}-list`} role="listbox" tabIndex={-1} aria-label={label}
          aria-activedescendant={`${id}-opt-${active}`} onKeyDown={onListKey}
          className="nb-card sh-pop absolute end-0 z-30 mt-3 w-56 max-w-[calc(100vw-2rem)] overflow-hidden p-1 outline-none"
        >
          {options.map(([k, text], i) => {
            const isSel = k === value;
            return (
              <li
                key={k} id={`${id}-opt-${i}`} role="option" aria-selected={isSel}
                onMouseEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`nb-opt flex min-h-10 cursor-pointer items-center gap-2 px-3 text-sm ${
                  isSel ? 'bg-[color:var(--nb-btn)] font-bold text-[color:var(--nb-on)]' : i === active ? 'nb-gray font-semibold' : 'font-semibold'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{text}</span>
                {isSel && <FiCheck aria-hidden="true" className="h-4 w-4 flex-shrink-0" strokeWidth={4} />}
              </li>
            );
          })}
        </ul>
      )}
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
    <div ref={ref} role="status" aria-live="polite" className="flex min-h-[4rem] items-center justify-center gap-3 pt-10">
      {hasMore ? (
        <>
          <span aria-hidden="true" className="flex items-center gap-1.5">
            <span className="sh-dot nb-bd h-3 w-3 rounded-full border-2 bg-[color:var(--nb-btn)]" />
            <span className="sh-dot nb-bd h-3 w-3 rounded-full border-2 bg-[color:var(--nb-btn)]" />
            <span className="sh-dot nb-bd h-3 w-3 rounded-full border-2 bg-[color:var(--nb-btn)]" />
          </span>
          <span className="text-xs font-bold">{t('loadingMore')}</span>
        </>
      ) : total > BATCH ? (
        <p className="sh-pop flex items-center justify-center gap-1.5 text-xs font-bold">
          <FiCheck aria-hidden="true" className="nb-ic h-3.5 w-3.5" strokeWidth={4} />{t('endOfList')}
        </p>
      ) : null}
    </div>
  );
});

const InfoRow = memo(({ Icon, children }) => (
  <div className="nb-gray nb-line flex items-start gap-3 rounded-2xl border-2 p-3">
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
        <FiMessageSquare aria-hidden="true" className="nb-ic h-3.5 w-3.5" />
        <span dir="ltr" className="tabular-nums">{plus(reviews)}</span> {reviews === 1 ? t('reviewOne') : t('reviewMany')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <FiPackage aria-hidden="true" className="nb-ic h-3.5 w-3.5" />
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
      <div className={`${leaving ? 'sh-fade-out' : 'sh-fade'} absolute inset-0 bg-[color:var(--nb-scrim)]`} onClick={close} aria-hidden="true" />
      <div className={`nb-card nb-big ${leaving ? 'sh-modal-out' : 'sh-modal'} relative flex max-h-[94vh] w-full flex-col overflow-hidden sm:max-w-2xl`}>
        <header className="nb-gray nb-line flex flex-shrink-0 items-center gap-3 border-b-2 px-4 py-3.5 sm:px-5">
          <IconTile Icon={FiNavigation} className="h-10 w-10" iconClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <p className="nb-muted text-[11px] font-semibold">{t('directionsTo')}</p>
            <h2 className="line-clamp-1 text-base font-bold">{name}</h2>
            <p className="nb-muted line-clamp-1 text-xs">{address || t('noAddress')}</p>
          </div>
          <button type="button" onClick={close} aria-label={t('close')} className="nb-btn nb-focus h-9 w-9 flex-shrink-0">
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <Suspense fallback={<div className="nb-sk w-full" style={{ aspectRatio: isMobile ? '1 / 1' : '1 / 0.62' }} />}>
            <DeliveryMap
              items={items} selectedId={origin ? shop.id : null} onSelect={noop} aspect={isMobile ? 1 : 0.62}
              startLabel={t('yourLocation')} endLabel={name}
              className="nb-bd !rounded-2xl !border-[3px]"
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
                <button type="button" onClick={locate} className="nb-btn nb-focus min-h-10 px-4 text-xs">
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" />{t('retryLocation')}
                </button>
              )}
              {mapsHref && (
                <a href={mapsHref} target="_blank" rel="noopener noreferrer nofollow" className="nb-btn nb-btn-a nb-focus min-h-10 px-4 text-xs">
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
      <div className={`${leaving ? 'sh-fade-out' : 'sh-fade'} absolute inset-0 bg-[color:var(--nb-scrim)]`} onClick={close} aria-hidden="true" />
      <div className={`nb-card nb-big ${leaving ? 'sh-modal-out' : 'sh-modal'} relative flex max-h-[92vh] w-full flex-col overflow-hidden sm:max-w-md`}>
        <div className="nb-media nb-bd relative h-44 w-full flex-shrink-0 overflow-hidden border-b-[3px] sm:h-52">
          <ShopImage src={logo} name={shop.name} role={role} eager />
          <div className="absolute end-3 top-3 z-10 flex items-center gap-2">
            <button type="button" onClick={() => onDirections(shop)} aria-label={t('getDirections')} title={t('getDirections')} className="nb-btn nb-focus h-9 w-9">
              <FiNavigation aria-hidden="true" className="h-4 w-4" />
            </button>
            <button type="button" onClick={close} aria-label={t('close')} className="nb-btn nb-focus h-9 w-9">
              <FiX aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold leading-snug">
              <span className="line-clamp-2 min-w-0">{shop.name || t('unnamedShop')}</span>
              {shop.verified && <VerifiedMark t={t} />}
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
              <span className="nb-ic">{serviceLabel(role, t)}</span>
              {hasRating && (
                <span className="inline-flex items-center gap-1">
                  <RiStarFill className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /><span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
                </span>
              )}
            </p>
            <div className="mt-3"><ShopStats shop={shop} t={t} /></div>
          </div>

          <section>
            <h3 className="mb-2 text-sm font-bold">{t('about')}</h3>
            <p className="nb-muted text-sm leading-relaxed">{shop.description || t('noDescription')}</p>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold">{t('whatShopCanDo')}</h3>
            <ul className="grid gap-3">
              {caps.map(({ icon: Icon, titleKey, textKey }) => (
                <li key={titleKey} className="flex items-start gap-3">
                  <IconTile Icon={Icon} className="h-10 w-10" iconClassName="h-4 w-4" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{t(titleKey)}</p>
                    <p className="nb-muted text-xs">{t(textKey)}</p>
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
                <a href={tel} dir="ltr" className="nb-focus hover:underline">{shop.phone}</a>
              </InfoRow>
            )}
          </section>
        </div>

        <footer className="nb-line grid flex-shrink-0 grid-cols-2 gap-3 border-t-2 px-4 py-3.5 sm:px-5">
          <button type="button" onClick={close} className="nb-btn nb-focus min-h-11 px-4 text-xs">{t('close')}</button>
          <button type="button" onClick={() => onOpen(shop.id)} className="nb-btn nb-btn-a nb-focus min-h-11 px-4 text-xs">
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
    setVisibleCount(BATCH);
  }, [deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, savedOnly, ratedOnly, hasPhoneOnly, hasAddressOnly, sortBy]);

  const visibleShops = useMemo(() => filteredShops.slice(0, visibleCount), [filteredShops, visibleCount]);
  const hasMore = visibleCount < filteredShops.length;

  const loadMore = useCallback(() => startTransition(() => setVisibleCount((c) => c + BATCH)), []);
  const scrollToGrid = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToEl(gridRef.current)));
  }, []);
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
    setSortBy('relevance'); setVisibleCount(BATCH);
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
  const browsing = activeFiltersCount === 0 && sortBy === 'relevance';

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
      <div dir={languageDirection(language)} lang={language} className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-clip`}>
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[1200] h-1">
          <div ref={barRef} className="h-full origin-left bg-[color:var(--nb-btn)] rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
        </div>

        <main className="mx-auto max-w-[88rem] px-4 pb-14 pt-32 sm:px-6 lg:px-8" aria-busy={isLoading || isPending}>
          <header className="nb-rise mb-10" style={RISE[0]}>
            <Crumbs t={t} />
            <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <div className="min-w-0 max-w-2xl">
                <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t('pageTitle')}</h1>
                <p className="nb-muted mt-3 text-sm leading-relaxed sm:text-base">{t('pageSub')}</p>
              </div>
              {isLoading ? (
                <div aria-hidden="true" className="flex gap-2"><Sk className="h-8 w-28" /><Sk className="h-8 w-24" /></div>
              ) : hasShops && (
                <div className="nb-in flex flex-wrap gap-3 text-xs font-bold">
                  <span className="nb-chip px-3 py-1.5"><span dir="ltr" className="tabular-nums">{shops.length}</span>&nbsp;{t('allShops')}</span>
                  {verifiedCount > 0 && (
                    <span className="nb-chip nb-chip-warn px-3 py-1.5"><span dir="ltr" className="tabular-nums">{verifiedCount}</span>&nbsp;{t('verified')}</span>
                  )}
                </div>
              )}
            </div>
          </header>

          <div className={`nb-rise grid gap-8 ${showSidebar ? 'lg:grid-cols-[16rem_minmax(0,1fr)]' : ''}`} style={RISE[1]}>
            {showSidebar && (
              <aside className="self-start lg:sticky lg:top-28" aria-label={t('filters')}>
                {isLoading ? <FilterSkeleton /> : (
                  <div className="nb-card nb-in max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain p-4">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h2 className="text-base font-bold">{t('filters')}</h2>
                      {activeFiltersCount > 0 && (
                        <button type="button" onClick={clearFilters} className="nb-ic nb-focus rounded-md text-xs font-bold transition-opacity hover:opacity-80">{t('resetAll')}</button>
                      )}
                    </div>
                    {panel}
                  </div>
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
                  <div className="nb-in mb-4 flex flex-wrap items-center gap-3">
                    <div className="nb-field relative flex h-11 min-w-0 flex-1 basis-60 items-center gap-2 px-4" role="search">
                      <FiSearch aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />
                      <input
                        type="search" value={searchTerm} onChange={onSearch} placeholder={t('search')} aria-label={t('searchAria')}
                        maxLength={QUERY_MAX} autoComplete="off" spellCheck={false} enterKeyHint="search"
                        className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:opacity-70 sm:text-sm"
                      />
                      {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} aria-label={t('clearSearch')} className="nb-focus flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full">
                          <FiX aria-hidden="true" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <SortDropdown value={sortBy} onChange={setSortBy} options={sortOptions} label={t('sortBy')} />
                    {showFilterButton && (
                      <button type="button" onClick={openDrawer} aria-haspopup="dialog" className="nb-btn nb-focus h-11 flex-shrink-0 gap-2 px-4 text-xs">
                        <FiSliders aria-hidden="true" className="h-4 w-4" />{t('filters')}
                        {activeFiltersCount > 0 && (
                          <span dir="ltr" className="nb-chip sh-pop h-5 min-w-[1.25rem] px-1 text-[11px] font-bold tabular-nums !shadow-none">{activeFiltersCount}</span>
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
                        featured title={t('customerFavorites')} subtitle={t('topRatedSubtitle')} onViewAll={viewAllTop} viewAllLabel={t('viewAll')}
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
                          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{t('allShopsTitle')}</h2>
                          <p role="status" className="nb-muted mt-1.5 text-sm">
                            <b dir="ltr" className="font-bold tabular-nums text-[color:var(--nb-ink)]">{filteredShops.length}</b> {t('shopsFound')}
                          </p>
                        </div>
                        {activeFiltersCount > 0 && (
                          <button type="button" onClick={clearFilters} className="nb-ic nb-focus rounded-md text-sm font-bold transition-opacity hover:opacity-80">{t('clearAll')}</button>
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
                          <div className={`${GRID} sh-lazy`}>
                            {visibleShops.map((s, i) => (
                              <ShopCell key={s.id} index={i % BATCH}>
                                <ShopCard shop={s} isSaved={saved.has(s.id)} actions={actions} t={t} eager={i < 4} />
                              </ShopCell>
                            ))}
                          </div>
                          <InfiniteSentinel hasMore={hasMore} shown={visibleCount} total={filteredShops.length} onMore={loadMore} t={t} />
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
            <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} title={t('backToTop')} className="nb-btn nb-btn-a nb-focus h-12 w-12">
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