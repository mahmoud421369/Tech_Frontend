import React, {
  useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo, useTransition,
} from 'react';
import { useNavigate, useNavigationType, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiTool, FiInfo, FiX, FiMail, FiPhone, FiCalendar, FiMapPin, FiCheck, FiCheckCircle, FiFileText,
  FiTag, FiXCircle, FiPackage, FiTruck, FiSlash, FiShield, FiChevronLeft, FiChevronRight, FiArrowRight,
  FiRefreshCw, FiSmartphone, FiLock,
} from 'react-icons/fi';
import { RiStoreLine, RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import poppins400 from '@fontsource/poppins/files/poppins-latin-400-normal.woff2';
import poppins600 from '@fontsource/poppins/files/poppins-latin-600-normal.woff2';
import poppins700 from '@fontsource/poppins/files/poppins-latin-700-normal.woff2';
import api from '../common/api/api';
import { useModalLock, clean, kindOfCategory } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration, isoCatKey } from '../components/user/IsoIllustrations';
import { Defs3D, Device3DStyles } from '../components/user/Device3D';
import { authHeaders, cleanText, expireSession, isUnauthorized, useAuthGuard } from '../common/utils/auth';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

if (typeof document !== 'undefined') {
  [poppins400, poppins600, poppins700].forEach((href) => {
    if (typeof href !== 'string' || !href || document.head.querySelector(`link[rel="preload"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  });
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } },
});

const REPAIR_TRANSLATIONS = {
  en: enTranslations.repair,
  ar: arTranslations.repair || arTranslations.hero?.repair,
  fr: frTranslations.repair || frTranslations.hero?.repair,
};

const LOCAL_TEXT = {
  en: {
    crumbHome: 'Home', crumbRepair: 'Repair', breadcrumb: 'Breadcrumb', progress: 'Progress',
    tryAgain: 'Try again', loadCategoriesFail: "We couldn't load device types.", noCategories: 'No device types available yet.',
    selectCategoryPrompt: 'Select a device type to continue.', loadShopsFail: "We couldn't load repair shops.",
    yourRequest: 'Your request', notSelected: 'Not selected yet', journeySub: 'Follow your device from request to delivery.',
    descBlank: "Description can't be blank. Please describe what's wrong with your device.",
    descRequiredTitle: 'Description required', descRequiredText: "Please describe what's wrong with your device",
    selectDeviceTitle: 'Select device type', sentTitle: 'Request sent', sentText: 'Your repair request was sent to {{name}}.',
    sendFailTitle: 'Failed to send', sendFailText: 'Something went wrong.', verifiedLabel: 'Verified',
    pagination: 'Pagination', prevPage: 'Previous page', nextPage: 'Next page', page: 'Page',
    suggestions: 'Quick suggestions',
    loading: 'Loading',
    s1: 'Screen cracked', s2: 'Battery issue', s3: 'Not charging', s4: 'Overheating', s5: 'Software crash', s6: 'Water damage',
    pageTitle: 'Book a repair',
    pageSub: 'Trusted repair shops, clear prices, and live tracking from pickup to delivery.',
    trustShops: 'Verified repair shops', trustPickup: 'Pickup & delivery', trustQuote: 'Clear price quotes', trustTrack: 'Live tracking',
    summaryNote: 'You approve the price before any repair starts.',
    pickShop: 'Select shop',
    scrollProgress: 'Page progress',
  },
  ar: {
    crumbHome: 'الرئيسية', crumbRepair: 'إصلاح', breadcrumb: 'مسار التنقل', progress: 'التقدم',
    tryAgain: 'حاول مرة أخرى', loadCategoriesFail: 'تعذّر تحميل أنواع الأجهزة.', noCategories: 'لا توجد أنواع أجهزة متاحة بعد.',
    selectCategoryPrompt: 'اختر نوع الجهاز للمتابعة.', loadShopsFail: 'تعذّر تحميل متاجر الصيانة.',
    yourRequest: 'طلبك', notSelected: 'لم يتم الاختيار بعد', journeySub: 'تابع جهازك من الطلب حتى التسليم.',
    descBlank: 'لا يمكن ترك الوصف فارغًا. يرجى وصف مشكلة جهازك.',
    descRequiredTitle: 'الوصف مطلوب', descRequiredText: 'يرجى وصف مشكلة جهازك',
    selectDeviceTitle: 'اختر نوع الجهاز', sentTitle: 'تم إرسال الطلب', sentText: 'تم إرسال طلب الإصلاح إلى {{name}}.',
    sendFailTitle: 'تعذّر الإرسال', sendFailText: 'حدث خطأ ما.', verifiedLabel: 'موثّق',
    pagination: 'الصفحات', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية', page: 'صفحة',
    suggestions: 'اقتراحات سريعة',
    loading: 'جارٍ التحميل',
    s1: 'الشاشة مكسورة', s2: 'مشكلة في البطارية', s3: 'لا يشحن', s4: 'ارتفاع الحرارة', s5: 'تعطل البرنامج', s6: 'تلف بالماء',
    pageTitle: 'احجز إصلاحًا',
    pageSub: 'متاجر صيانة موثوقة، أسعار واضحة، وتتبّع مباشر من الاستلام حتى التسليم.',
    trustShops: 'متاجر صيانة موثّقة', trustPickup: 'استلام وتوصيل', trustQuote: 'أسعار واضحة', trustTrack: 'تتبّع مباشر',
    summaryNote: 'توافق على السعر قبل بدء أي إصلاح.',
    pickShop: 'اختر المتجر',
    scrollProgress: 'تقدم الصفحة',
  },
  fr: {
    crumbHome: 'Accueil', crumbRepair: 'Réparation', breadcrumb: "Fil d'Ariane", progress: 'Progression',
    tryAgain: 'Réessayer', loadCategoriesFail: "Impossible de charger les types d'appareils.", noCategories: "Aucun type d'appareil disponible pour l'instant.",
    selectCategoryPrompt: "Sélectionnez un type d'appareil pour continuer.", loadShopsFail: 'Impossible de charger les ateliers de réparation.',
    yourRequest: 'Votre demande', notSelected: 'Pas encore choisi', journeySub: 'Suivez votre appareil de la demande à la livraison.',
    descBlank: 'La description ne peut pas être vide. Décrivez le problème de votre appareil.',
    descRequiredTitle: 'Description requise', descRequiredText: 'Veuillez décrire le problème de votre appareil',
    selectDeviceTitle: "Sélectionnez le type d'appareil", sentTitle: 'Demande envoyée', sentText: 'Votre demande de réparation a été envoyée à {{name}}.',
    sendFailTitle: "Échec de l'envoi", sendFailText: "Une erreur s'est produite.", verifiedLabel: 'Vérifié',
    pagination: 'Pagination', prevPage: 'Page précédente', nextPage: 'Page suivante', page: 'Page',
    suggestions: 'Suggestions rapides',
    loading: 'Chargement',
    s1: 'Écran cassé', s2: 'Problème de batterie', s3: 'Ne charge pas', s4: 'Surchauffe', s5: 'Plantage logiciel', s6: 'Dégât des eaux',
    pageTitle: 'Réserver une réparation',
    pageSub: 'Ateliers de confiance, prix clairs et suivi en direct de la collecte à la livraison.',
    trustShops: 'Ateliers vérifiés', trustPickup: 'Collecte et livraison', trustQuote: 'Prix clairs', trustTrack: 'Suivi en direct',
    summaryNote: 'Vous validez le prix avant toute réparation.',
    pickShop: 'Choisir',
    scrollProgress: 'Progression de la page',
  },
};

const tr = (language, key) =>
  REPAIR_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  REPAIR_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

const PAGE_CSS = `
${EXTRAS_CSS}
@font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
.rp{--bd:#e5e7eb;--sf:#ffffff;--sf2:#f3f4f6;--tx:#052e1e;--mu:rgba(5,46,30,.68);--acc:#059669;--ln:#000000;--shd:#000000;--pg:#ffffff;--ping:#059669;--hi:rgba(255,255,255,.8);--scrim:rgba(0,0,0,.6);--warn:#c2410c;--dx:1;background:var(--pg);color:var(--tx);color-scheme:light;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.rp[dir=rtl]{--dx:-1}
.rp-dark{--bd:rgba(255,255,255,.16);--sf:#1c1c1e;--sf2:#2a2a2e;--tx:#ffffff;--mu:rgba(255,255,255,.66);--acc:#39ff88;--ln:rgba(255,255,255,.16);--shd:#0b4a35;--pg:#141414;--ping:#39ff88;--hi:rgba(255,255,255,.08);--scrim:rgba(0,0,0,.72);--warn:#fdba74;color-scheme:dark}
.rp[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
.rp[lang=ar] *{letter-spacing:0!important}
.rp button,.rp input,.rp textarea{font-family:inherit}
.rp-sh2{box-shadow:calc(var(--dx)*2px) 2px 0 0 var(--shd)}
.rp-sh3{box-shadow:calc(var(--dx)*3px) 3px 0 0 var(--shd)}
.rp-sh4{box-shadow:calc(var(--dx)*4px) 4px 0 0 var(--shd)}
.rp-sh6{box-shadow:calc(var(--dx)*6px) 6px 0 0 var(--shd)}
.rp-sh8{box-shadow:calc(var(--dx)*8px) 8px 0 0 var(--shd)}
.rp-pick,.rp-pick:hover{box-shadow:calc(var(--dx)*6px) 6px 0 0 var(--shd);outline:3px solid var(--acc);outline-offset:2px}
@media (hover:hover){.rp-lift{transition:transform .15s ease,box-shadow .15s ease}.rp-lift:hover{transform:translate3d(0,-2px,0);box-shadow:calc(var(--dx)*6px) 6px 0 0 var(--shd)}}
.rp-flip{display:inline-block}
.rp[dir=rtl] .rp-flip{transform:scaleX(-1)}
@keyframes rpShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.rp-sk{position:relative;overflow:hidden}
.rp-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--hi),transparent);animation:rpShimmer 1.3s ease-in-out infinite}
[dir="rtl"] .rp-sk::after{animation-direction:reverse}
@keyframes rpRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.rp-rise{animation:rpRise .35s cubic-bezier(.2,.8,.2,1) both}
.rp-in{animation:rpRise .25s cubic-bezier(.2,.8,.2,1) both}
@keyframes rpSeg{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.rp-seg{transform-origin:left;animation:rpSeg .5s ease-out both}
[dir="rtl"] .rp-seg{transform-origin:right}
@keyframes rpPing{0%{opacity:.7;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.5)}}
.rp-live{position:relative}
.rp-live::after{content:"";position:absolute;inset:-3px;border-radius:9999px;border:2px solid var(--ping);pointer-events:none;animation:rpPing 2s ease-out infinite}
@keyframes rpFade{from{opacity:0}to{opacity:1}}
@keyframes rpFadeOut{from{opacity:1}to{opacity:0}}
.rp-fade{animation:rpFade .18s ease-out both}
.rp-fade-out{animation:rpFadeOut .18s ease-in both}
@keyframes rpModal{from{opacity:0;transform:translate3d(0,24px,0)}to{opacity:1;transform:none}}
@keyframes rpModalOut{from{opacity:1;transform:none}to{opacity:0;transform:translate3d(0,24px,0)}}
.rp-modal{animation:rpModal .24s cubic-bezier(.2,.8,.2,1) both}
.rp-modal-out{animation:rpModalOut .18s ease-in both}
.rp-defer{content-visibility:auto;contain-intrinsic-size:auto 520px}
.rp-scroll{scrollbar-width:thin;scrollbar-color:var(--acc) transparent;overscroll-behavior:contain}
@media (prefers-reduced-motion:no-preference){html:has(.rp){scroll-behavior:smooth}}
@media (prefers-reduced-motion:reduce){.rp-sk::after,.rp-rise,.rp-in,.rp-seg,.rp-live::after,.rp-fade,.rp-fade-out,.rp-modal,.rp-modal-out{animation:none}.rp-lift,.rp-lift:hover{transition:none;transform:none}}
`;

if (typeof document !== 'undefined') {
  let tag = document.querySelector('style[data-repair-styles]');
  if (!tag) {
    tag = document.createElement('style');
    tag.setAttribute('data-repair-styles', 'true');
    document.head.appendChild(tag);
  }
  if (tag.textContent !== PAGE_CSS) tag.textContent = PAGE_CSS;
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const PRESS = 'transition-[transform,box-shadow,background-color,color,border-color] duration-150 active:translate-y-0.5 active:[box-shadow:none] motion-reduce:transition-none';
const CARD = 'rp-sh4 rounded-2xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)]';
const CHIP = 'border-2 border-black bg-[#39ff88] text-emerald-950';
const NODE_IDLE = 'border-2 border-[color:var(--ln)] bg-[color:var(--sf2)] text-[color:var(--mu)]';
const NODE_BAD = 'border-2 border-black bg-rose-400 text-black';
const BTN_BASE = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] px-5 py-2.5 text-sm font-extrabold ${PRESS} ${FOCUS} disabled:cursor-not-allowed disabled:opacity-50`;
const BTN_PRIMARY = `${BTN_BASE} rp-sh3 border-black bg-[#39ff88] text-emerald-950 hover:bg-[#7dffb0]`;
const BTN_SECONDARY = `${BTN_BASE} rp-sh3 border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] hover:bg-[color:var(--sf2)]`;
const BTN_SMALL = `inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-[color:var(--ln)] bg-[color:var(--sf)] px-3 py-1 text-xs font-bold text-[color:var(--tx)] rp-sh2 ${PRESS} ${FOCUS} hover:bg-[color:var(--sf2)]`;
const BTN_ICON = `inline-flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] rp-sh2 ${PRESS} ${FOCUS} hover:bg-[color:var(--sf2)] disabled:cursor-not-allowed disabled:opacity-40`;
const TEXT_LINK = `rounded-md hover:underline hover:decoration-2 hover:underline-offset-4 ${FOCUS}`;

const REDUCED_Q = '(prefers-reduced-motion: reduce)';
const LEAVE_MS = 180;
const ID_RE = /^[\w-]{1,64}$/;
const MAX_DESC = 1000;
const CATEGORY_PAGE_SIZE = 6;
const SHOP_PAGE_SIZE = 4;
const CATEGORIES_MAX = 200;
const SHOPS_MAX = 500;
const SUGGESTION_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'];
const EMPTY_LIST = [];
const SK_CATEGORIES = [0, 1, 2, 3, 4, 5];
const SK_SHOPS = [0, 1, 2, 3];
const SK = 'rp-sk rounded-lg bg-[color:var(--bd)]';
const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };
const SHOP_TYPES = new Set(['BOTH', 'REPAIRER', 'SELLER']);

const TRUST_ITEMS = [
  { key: 'trustShops', Icon: FiShield },
  { key: 'trustPickup', Icon: FiTruck },
  { key: 'trustQuote', Icon: FiTag },
  { key: 'trustTrack', Icon: FiMapPin },
];

const STEP_DEFS = [
  { labelKey: 'describe', icon: FiFileText },
  { labelKey: 'category', icon: FiSmartphone },
  { labelKey: 'shop', icon: RiStoreLine },
  { labelKey: 'done', icon: FiCheckCircle },
];

const STEP_HEAD = [
  { title: 'describeProblem', subtitle: 'specificHelp', infoTitle: 'detailsTitle', infoBody: 'detailsBody', icon: FiFileText },
  { title: 'deviceType', subtitle: 'categorySubtitle', infoTitle: 'categoryTitle', infoBody: 'categoryBody', icon: FiSmartphone },
  { title: 'chooseShopTitle', subtitle: 'chooseShopSubtitle', infoTitle: 'shopTitle', infoBody: 'shopBody', icon: RiStoreLine },
  { title: 'doneTitle', subtitle: 'doneBody', infoTitle: 'doneTitle', infoBody: 'doneBody', icon: FiCheckCircle },
];

const INFO_SCENES = ['repairCard', 'devices', 'shop', 'track'];

const STATUS_JOURNEY = [
  { key: 'SUBMITTED', labelKey: 'submitted', descKey: 'submittedDesc', Icon: FiFileText },
  { key: 'QUOTE_SENT', labelKey: 'setPrice', descKey: 'setPriceDesc', Icon: FiTag },
  { key: 'QUOTE_APPROVED', labelKey: 'priceAccepted', descKey: 'priceAcceptedDesc', Icon: FiCheckCircle },
  { key: 'QUOTE_REJECTED', labelKey: 'priceRejected', descKey: 'priceRejectedDesc', Icon: FiXCircle, danger: true },
  { key: 'DEVICE_COLLECTED', labelKey: 'devicePickedUp', descKey: 'devicePickedUpDesc', Icon: FiPackage },
  { key: 'REPAIRING', labelKey: 'repairing', descKey: 'repairingDesc', Icon: FiTool },
  { key: 'REPAIR_COMPLETED', labelKey: 'repairCompleted', descKey: 'repairCompletedDesc', Icon: FiShield },
  { key: 'DEVICE_DELIVERED', labelKey: 'deviceDelivered', descKey: 'deviceDeliveredDesc', Icon: FiTruck },
  { key: 'CANCELLED', labelKey: 'cancelled', descKey: 'cancelledDesc', Icon: FiSlash, danger: true },
];

const prefersReduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_Q).matches;

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

const useLeave = (onClose) => {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(0);
  const request = useCallback(() => {
    if (timer.current) return;
    if (prefersReduced()) { onClose(); return; }
    setLeaving(true);
    timer.current = window.setTimeout(onClose, LEAVE_MS);
  }, [onClose]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [leaving, request];
};

const useInView = (margin = '400px') => {
  const [el, setEl] = useState(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (seen || !el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [el, seen, margin]);
  return [setEl, seen];
};

const useIdleFlag = (active) => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active || on) return undefined;
    if (typeof window.requestIdleCallback === 'function') {
      const h = window.requestIdleCallback(() => setOn(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(h);
    }
    const h = window.setTimeout(() => setOn(true), 300);
    return () => window.clearTimeout(h);
  }, [active, on]);
  return on;
};

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navType]);
};

const useBodyScrollLock = (locked) => {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; };
  }, [locked]);
};

const dateFmtCache = new Map();
const formatDate = (iso, language) => {
  if (typeof iso !== 'string' && typeof iso !== 'number') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const loc = LOCALES[language] || 'en-GB';
  let f = dateFmtCache.get(loc);
  if (!f) { f = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' }); dateFmtCache.set(loc, f); }
  return f.format(d);
};

const telHref = (phone) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  return /^\+?\d{3,19}$/.test(digits) ? `tel:${digits}` : null;
};

const dropRepairsCache = () => {
  try { sessionStorage.removeItem('acct:repairs'); } catch { }
};

const toList = (res) => {
  const raw = res?.data?.content || res?.data || [];
  return Array.isArray(raw) ? raw : [];
};
const validId = (x) => !!x && typeof x === 'object' && x.id != null && ID_RE.test(String(x.id));
const normalizeCategory = (c) => ({ id: String(c.id), name: clean(String(c.name ?? ''), 80) });
const normalizeShop = (s) => {
  const rating = Number(s.rating);
  const type = typeof s.shopType === 'string' ? s.shopType.toUpperCase() : '';
  const addr = s.shopAddress && typeof s.shopAddress === 'object' ? s.shopAddress : null;
  return {
    id: String(s.id),
    name: clean(String(s.name ?? ''), 120),
    email: s.email ? clean(String(s.email), 120) : '',
    phone: s.phone ? clean(String(s.phone), 30) : '',
    description: s.description ? clean(String(s.description), 600) : '',
    shopType: SHOP_TYPES.has(type) ? type : '',
    verified: s.verified === true,
    activate: s.activate === true,
    rating: Number.isFinite(rating) && rating > 0 ? Math.min(5, rating) : null,
    createdAt: typeof s.createdAt === 'string' || typeof s.createdAt === 'number' ? s.createdAt : null,
    shopAddress: addr
      ? { street: clean(String(addr.street || ''), 120), city: clean(String(addr.city || ''), 80), state: clean(String(addr.state || ''), 80) }
      : null,
  };
};

const shopAddressLine = (shop, withState) => {
  if (!shop.shopAddress) return '';
  const { street, city, state } = shop.shopAddress;
  return (withState ? [street, city, state] : [street, city]).filter(Boolean).join(', ');
};

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

const CardTitle = memo(({ children, className = 'mb-4' }) => (
  <h3 className={`${className} text-sm font-extrabold tracking-wide rtl:tracking-normal`}>{children}</h3>
));

const Chip = memo(({ Icon, size = 'h-9 w-9', iconSize = 'h-4 w-4', bad = false }) => (
  <span aria-hidden="true" className={`flex flex-shrink-0 items-center justify-center rounded-lg ${bad ? NODE_BAD : CHIP} ${size}`}>
    <Icon className={iconSize} />
  </span>
));

const Crumbs = memo(({ t }) => (
  <nav aria-label={t('breadcrumb')} className="flex items-center gap-1.5 text-xs font-bold sm:text-sm">
    <Link to="/" className={TEXT_LINK}>{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3 w-3 flex-shrink-0 text-[color:var(--mu)] rtl:rotate-180" />
    <span className="text-[color:var(--mu)]" aria-current="page">{t('crumbRepair')}</span>
  </nav>
));

const TrustBar = memo(({ t }) => (
  <ul className="flex flex-wrap gap-3 text-xs font-bold">
    {TRUST_ITEMS.map(({ key, Icon }) => (
      <li key={key} className="rp-sh2 inline-flex items-center gap-1.5 rounded-lg border-2 border-[color:var(--ln)] bg-[color:var(--sf)] px-3 py-1.5">
        <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" />
        <span>{t(key)}</span>
      </li>
    ))}
  </ul>
));

const VerifiedMark = memo(({ label }) => (
  <span className="inline-flex flex-shrink-0" title={label}>
    <RiVerifiedBadgeLine aria-hidden="true" className="h-4 w-4 text-[color:var(--acc)]" />
    <span className="sr-only">{label}</span>
  </span>
));

const Rating = memo(({ value, fallback }) => (
  <span className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-amber-300 px-2 py-0.5 text-[11px] font-extrabold text-black">
    <RiStarFill aria-hidden="true" className="h-3 w-3" />
    <span dir="ltr" className="tabular-nums">{value ? value.toFixed(1) : fallback}</span>
  </span>
));

const Progress = memo(({ step, t }) => {
  const total = STEP_DEFS.length;
  return (
    <section aria-label={t('progress')} className={`p-5 sm:p-6 ${CARD}`}>
      <p className="sr-only">{t('step')} {step} {t('of')} {total}</p>
      <ol className="flex">
        {STEP_DEFS.map(({ labelKey, icon: Icon }, i) => {
          const n = i + 1;
          const done = step >= n;
          const current = step === n;
          return (
            <li key={labelKey} aria-current={current ? 'step' : undefined} className="relative flex min-w-0 flex-1 flex-col items-center px-1 text-center">
              {i > 0 && (
                <span aria-hidden="true" className="absolute start-[-50%] top-[17px] h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--bd)]">
                  {done && <span className="rp-seg block h-full w-full rounded-full bg-[#39ff88]" />}
                </span>
              )}
              <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${done ? CHIP : NODE_IDLE} ${current ? 'rp-live' : ''}`}>
                {step > n
                  ? <FiCheck aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={3} />
                  : <Icon aria-hidden="true" className="h-[18px] w-[18px]" />}
              </span>
              <span className={`mt-2.5 max-w-full truncate text-xs font-extrabold sm:text-sm ${done ? '' : 'text-[color:var(--mu)]'}`}>{t(labelKey)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
});

const NavButtons = memo(({ onBack, onNext, nextLabel, nextDisabled, isLoading, showBack = true, t }) => (
  <div className={`mt-8 flex flex-wrap gap-3 ${showBack ? 'justify-between' : 'justify-end'}`}>
    {showBack && (
      <button type="button" className={BTN_SECONDARY} onClick={onBack} disabled={isLoading}>
        <FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />{t('back')}
      </button>
    )}
    <button type="button" className={`${BTN_PRIMARY} flex-1 sm:flex-none sm:px-8`} onClick={onNext} disabled={nextDisabled || isLoading} aria-busy={isLoading}>
      {isLoading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />}
      <span>{isLoading ? t('sending') : nextLabel || t('continue')}</span>
      {!isLoading && <FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />}
    </button>
  </div>
));

const CategorySkeleton = memo(() => (
  <div className={`flex flex-col items-center gap-2.5 p-3 sm:p-4 ${CARD}`}>
    <div className={`${SK} h-16 w-full sm:h-20`} />
    <div className={`${SK} h-4 w-2/3`} />
  </div>
));

const ShopSkeleton = memo(() => (
  <div className={`flex h-48 flex-col gap-3 p-4 ${CARD}`}>
    <div className="flex items-start gap-3">
      <div className={`${SK} h-10 w-10 flex-none`} />
      <div className="min-w-0 flex-1 space-y-2"><div className={`${SK} h-4 w-3/4`} /><div className={`${SK} h-3 w-1/4`} /></div>
      <div className={`${SK} h-9 w-9 flex-none`} />
    </div>
    <div className={`${SK} h-3 w-2/3`} />
    <div className={`${SK} mt-auto h-9 w-full`} />
  </div>
));

const CategoriesSkeleton = memo(({ label }) => (
  <div className="grid grid-cols-2 gap-5 p-2 sm:grid-cols-3" role="status" aria-busy="true" aria-label={label}>
    {SK_CATEGORIES.map((i) => <CategorySkeleton key={i} />)}
  </div>
));

const ShopsSkeleton = memo(({ label }) => (
  <div className="grid grid-cols-1 gap-5 p-2 sm:grid-cols-2" role="status" aria-busy="true" aria-label={label}>
    {SK_SHOPS.map((i) => <ShopSkeleton key={i} />)}
  </div>
));

const StateBox = memo(({ darkMode, label, onRetry, retryLabel }) => (
  <div className="rp-in mx-auto flex max-w-md flex-col items-center px-4 py-10 text-center">
    <IsoIllustration type="shop" tone="emerald" onGreen={false} darkMode={darkMode} className="mb-3 h-24 w-24" />
    <p className="text-base font-extrabold">{label}</p>
    {onRetry && (
      <button type="button" onClick={() => onRetry()} className={`mt-5 ${BTN_PRIMARY}`}>
        <FiRefreshCw aria-hidden="true" className="h-4 w-4" />{retryLabel}
      </button>
    )}
  </div>
));

const Pager = memo(({ page, totalPages, onChange, pending, t }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t('pagination')} aria-busy={pending} className="flex flex-wrap items-center justify-center gap-3 pt-8">
      <button type="button" className={BTN_ICON} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <FiChevronLeft aria-hidden="true" className="rp-flip h-4 w-4" />
      </button>
      {pageWindow(page, totalPages).map((x) => (typeof x === 'number' ? (
        <button
          key={x} type="button" onClick={() => onChange(x)}
          aria-label={`${t('page')} ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`${BTN_ICON} !w-auto min-w-[2.5rem] px-2 text-sm font-extrabold tabular-nums ${x === page ? '!border-black !bg-[#39ff88] !text-emerald-950' : ''}`}
        >
          <span dir="ltr">{x}</span>
        </button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-bold text-[color:var(--mu)]">…</span>))}
      <button type="button" className={BTN_ICON} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
        <FiChevronRight aria-hidden="true" className="rp-flip h-4 w-4" />
      </button>
    </nav>
  );
});

const DescribeStep = memo(({ initial, onChange, t }) => {
  const [value, setValue] = useState(initial);
  const update = useCallback((v) => { const next = v.slice(0, MAX_DESC); setValue(next); onChange(next); }, [onChange]);
  const handleChange = useCallback((e) => update(e.target.value), [update]);
  const addSuggestion = useCallback((s) => update(value ? `${value}, ${s.toLowerCase()}` : s), [update, value]);
  const blank = value.length > 0 && !value.trim();
  return (
    <div className="max-w-3xl">
      <label htmlFor="repair-description" className="sr-only">{t('describeProblem')}</label>
      <div className={`rp-sh3 overflow-hidden rounded-xl border-[3px] bg-[color:var(--sf)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)] ${blank ? 'border-rose-500' : 'border-[color:var(--ln)]'}`}>
        <textarea
          id="repair-description" value={value} onChange={handleChange}
          maxLength={MAX_DESC} placeholder={t('issuePlaceholder')} aria-required="true" autoComplete="off" spellCheck
          aria-invalid={blank} aria-describedby={blank ? 'repair-description-error' : undefined}
          className="block min-h-[170px] w-full resize-none rounded-none border-0 bg-transparent px-4 py-3.5 text-base font-semibold leading-relaxed text-[color:var(--tx)] outline-none placeholder:font-normal placeholder:opacity-70 sm:min-h-[200px] sm:text-sm"
        />
        <div className="flex items-center justify-between gap-3 border-t-2 border-[color:var(--bd)] px-4 py-2 text-xs font-semibold text-[color:var(--mu)]">
          <span className="min-w-0 truncate">{t('tip')}</span>
          <span dir="ltr" className="flex-shrink-0 tabular-nums" style={value.length > 900 ? { color: 'var(--warn)' } : undefined}>{value.length} / {MAX_DESC}</span>
        </div>
      </div>
      {blank && (
        <p id="repair-description-error" role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-bold text-rose-500">
          <FiXCircle aria-hidden="true" className="h-4 w-4 flex-shrink-0" />{t('descBlank')}
        </p>
      )}
      <div role="group" aria-label={t('suggestions')} className="mt-5 flex flex-wrap gap-3">
        {SUGGESTION_KEYS.map((k) => {
          const s = t(k);
          return <button key={k} type="button" onClick={() => addSuggestion(s)} className={BTN_SMALL}>+ {s}</button>;
        })}
      </div>
    </div>
  );
});

const CategoryTile = memo(({ cat, active, onSelect, darkMode }) => {
  const catKey = useMemo(() => isoCatKey(kindOfCategory(cat.name)), [cat.name]);
  const select = useCallback(() => onSelect(cat), [onSelect, cat]);
  return (
    <button
      type="button" aria-pressed={active} onClick={select}
      className={`rp-lift relative flex min-h-11 w-full cursor-pointer flex-col items-center gap-2.5 p-3 text-center sm:p-4 ${CARD} ${FOCUS} ${active ? 'rp-pick' : ''}`}
    >
      <span className="flex w-full items-center justify-center rounded-xl border-2 border-[color:var(--ln)] bg-[color:var(--sf2)] py-2">
        <IsoIllustration type={catKey} darkMode={darkMode} onGreen={false} className="h-12 w-12 sm:h-14 sm:w-14" />
      </span>
      <span className="line-clamp-1 w-full text-sm font-extrabold">{cat.name}</span>
      {active && (
        <span aria-hidden="true" className={`absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full ${CHIP}`}>
          <FiCheck className="h-3.5 w-3.5" strokeWidth={4} />
        </span>
      )}
    </button>
  );
});

const ShopOption = memo(({ shop, active, onSelect, onInfo, t }) => {
  const select = useCallback(() => { if (shop.activate) onSelect(shop); }, [shop, onSelect]);
  const info = useCallback((e) => { e.stopPropagation(); onInfo(shop); }, [onInfo, shop]);
  const onKey = useCallback((e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); select(); }
  }, [select]);
  const address = shopAddressLine(shop, false);
  const mode = shop.activate ? 'rp-lift cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale';
  return (
    <div
      role="radio" aria-checked={active} aria-disabled={!shop.activate} tabIndex={shop.activate ? 0 : -1}
      onClick={select} onKeyDown={onKey}
      className={`flex h-full flex-col gap-3 p-4 ${CARD} ${FOCUS} ${mode} ${active ? 'rp-pick' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Chip Icon={RiStoreLine} size="h-10 w-10" iconSize="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-extrabold leading-snug">
            <span className="line-clamp-2 min-w-0">{shop.name}</span>
            {shop.verified && <VerifiedMark label={t('verifiedLabel')} />}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Rating value={shop.rating} fallback={t('newRating')} />
            <span className="inline-flex items-center rounded-md border-2 border-[color:var(--ln)] bg-[color:var(--sf2)] px-1.5 py-0.5 text-[11px] font-bold">
              <span className="truncate">{shop.shopType || t('generalType')}</span>
            </span>
          </div>
        </div>
        <button type="button" onClick={info} aria-label={t('shopDetailsAria')} className={BTN_ICON}>
          <FiInfo aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {address && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--mu)]">
          <FiMapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--acc)]" /><span className="line-clamp-1">{address}</span>
        </p>
      )}
      <div className="mt-auto pt-1">
        {shop.activate ? (
          <span aria-hidden="true" className={`flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border-2 text-xs font-extrabold transition-colors duration-150 motion-reduce:transition-none ${active ? CHIP : 'border-[color:var(--ln)] bg-[color:var(--sf2)]'}`}>
            {active && <FiCheck className="h-4 w-4" strokeWidth={4} />}
            {active ? t('selected') : t('pickShop')}
          </span>
        ) : (
          <span className="flex min-h-9 items-center justify-center text-xs font-bold text-[color:var(--mu)]">{t('inactive')}</span>
        )}
      </div>
    </div>
  );
});

const DetailRow = memo(({ Icon, label, value, ltr }) => (
  <div className="flex items-start gap-3">
    <Chip Icon={Icon} size="h-8 w-8" />
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-[color:var(--mu)]">{label}</dt>
      <dd className="break-words text-sm font-bold" dir={ltr ? 'ltr' : undefined}>{value}</dd>
    </div>
  </div>
));

const ShopDetailModal = memo(({ shop, language, onClose, t }) => {
  const [leaving, requestClose] = useLeave(onClose);
  useModalLock(true, requestClose);
  useBodyScrollLock(true);
  const rows = [
    { Icon: FiMail, label: t('email'), value: shop.email },
    { Icon: FiPhone, label: t('phone'), value: shop.phone, ltr: true },
    { Icon: RiStoreLine, label: t('type'), value: shop.shopType },
    { Icon: FiMapPin, label: t('address'), value: shopAddressLine(shop, true) },
    { Icon: FiCalendar, label: t('joined'), value: formatDate(shop.createdAt, language) },
  ].filter((r) => r.value);
  const tel = telHref(shop.phone);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name}>
      <div className={`${leaving ? 'rp-fade-out' : 'rp-fade'} absolute inset-0 bg-[color:var(--scrim)]`} onClick={requestClose} aria-hidden="true" />
      <div className={`${CARD} rp-sh8 ${leaving ? 'rp-modal-out' : 'rp-modal'} relative flex max-h-[92vh] w-full flex-col overflow-hidden sm:max-w-md`}>
        <header className="flex flex-shrink-0 items-center gap-3 px-5 pb-2 pt-5">
          <Chip Icon={RiStoreLine} size="h-10 w-10" iconSize="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1.5 text-base font-extrabold">
              <span className="truncate">{shop.name}</span>
              {shop.verified && <VerifiedMark label={t('verifiedLabel')} />}
            </h2>
            <p className="mt-1"><Rating value={shop.rating} fallback={t('newRating')} /></p>
          </div>
          <button type="button" onClick={requestClose} aria-label={t('close') || 'Close'} className={BTN_ICON}>
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>
        <div className="rp-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {shop.description && <p className="text-sm leading-relaxed text-[color:var(--mu)]">{shop.description}</p>}
          <dl className="space-y-4">
            {rows.map(({ Icon, label, value, ltr }) => (
              <DetailRow key={label} Icon={Icon} label={label} value={value} ltr={ltr} />
            ))}
          </dl>
        </div>
        {tel && (
          <footer className="flex-shrink-0 px-5 pb-5">
            <a href={tel} rel="noopener noreferrer" className={`${BTN_PRIMARY} w-full text-xs`}><FiPhone aria-hidden="true" className="h-4 w-4" />{t('phone')}</a>
          </footer>
        )}
      </div>
    </div>
  );
});

const InfoPanel = memo(({ step, darkMode, t }) => {
  const head = STEP_HEAD[step - 1];
  const HeadIcon = head.icon;
  return (
    <section key={step} aria-label={t(head.infoTitle)} className={`rp-fade overflow-hidden ${CARD}`}>
      <div className="border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf2)] p-3">
        <IsoIllustration type={INFO_SCENES[step - 1]} tone="emerald" onGreen={false} darkMode={darkMode} className="mx-auto h-28 w-28" />
      </div>
      <div className="p-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold">
          <HeadIcon aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" />
          <span className="min-w-0">{t(head.infoTitle)}</span>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--mu)]">{t(head.infoBody)}</p>
      </div>
    </section>
  );
});

const SummaryPanel = memo(({ category, shop, t }) => (
  <section aria-label={t('yourRequest')} className={`p-5 ${CARD}`}>
    <CardTitle>{t('yourRequest')}</CardTitle>
    <dl className="space-y-4">
      <DetailRow Icon={FiSmartphone} label={t('category')} value={category?.name || t('notSelected')} />
      <DetailRow Icon={RiStoreLine} label={t('shop')} value={shop?.name || t('notSelected')} />
    </dl>
    <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-[color:var(--mu)]">
      <FiLock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[color:var(--acc)]" />{t('summaryNote')}
    </p>
  </section>
));

const JourneyRow = memo(({ Icon, label, desc, danger, last }) => (
  <li className={`relative flex gap-4 ${last ? '' : 'pb-6'}`}>
    {!last && <span aria-hidden="true" className="absolute bottom-0 start-[16px] top-9 w-[3px] rounded-full bg-[color:var(--bd)]" />}
    <span className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${danger ? NODE_BAD : CHIP}`}>
      <Icon aria-hidden="true" className="h-4 w-4" />
    </span>
    <div className="min-w-0 flex-1 pt-1">
      <p className={`text-sm font-extrabold ${danger ? 'text-rose-500' : ''}`}>{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--mu)]">{desc}</p>
    </div>
  </li>
));

const JourneySection = memo(({ t }) => (
  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <section aria-label={t('repairJourney')} className={`p-5 sm:p-8 ${CARD}`}>
      <h2 className="text-xl font-extrabold tracking-tight rtl:tracking-normal sm:text-2xl">{t('repairJourney')}</h2>
      <p className="mb-6 mt-1.5 text-sm font-medium text-[color:var(--mu)]">{t('journeySub')}</p>
      <ol>
        {STATUS_JOURNEY.map(({ key, labelKey, descKey, Icon, danger }, i) => (
          <JourneyRow key={key} Icon={Icon} label={t(labelKey)} desc={t(descKey)} danger={danger} last={i === STATUS_JOURNEY.length - 1} />
        ))}
      </ol>
    </section>
  </div>
));

const RepairRequestContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useCallback((key) => tr(language, key), [language]);
  const token = useAuthGuard();
  useScrollTopOnEnter();

  const [step, setStep] = useState(1);
  const descRef = useRef('');
  const barRef = useRef(null);
  const submitLock = useRef(false);
  const [hasDesc, setHasDesc] = useState(false);
  const [descSeed, setDescSeed] = useState(0);
  const [category, setCategory] = useState(null);
  const [shop, setShop] = useState(null);
  const [submittedShop, setSubmittedShop] = useState(null);
  const [infoShop, setInfoShop] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [shopPage, setShopPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [journeyRef, journeyNear] = useInView('500px');
  const idle = useIdleFlag(!!token);

  useScrollProgress(barRef);
  useEffect(() => { document.title = 'Book Repair | Tech-Restore'; }, []);

  const onDescChange = useCallback((v) => {
    descRef.current = v;
    const has = !!v.trim();
    setHasDesc((p) => (p === has ? p : has));
  }, []);

  const categoriesQ = useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => toList(await api.get('/api/categories', { headers: authHeaders(), signal }))
      .slice(0, CATEGORIES_MAX).filter(validId).map(normalizeCategory),
    enabled: !!token && (idle || step >= 2),
    staleTime: 5 * 60 * 1000,
  });

  const shopsQ = useQuery({
    queryKey: ['repairShops'],
    queryFn: async ({ signal }) =>
      toList(await api.get('/api/users/shops/all', { headers: authHeaders(), signal }))
        .slice(0, SHOPS_MAX)
        .filter(validId)
        .map(normalizeShop)
        .filter((s) => s.shopType === 'BOTH' || s.shopType === 'REPAIRER'),
    enabled: step >= 2 && !!category && !!token,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const err = categoriesQ.error || shopsQ.error;
    if (err && isUnauthorized(err)) expireSession(navigate);
  }, [categoriesQ.error, shopsQ.error, navigate]);

  const categories = categoriesQ.data || EMPTY_LIST;
  const shops = shopsQ.data || EMPTY_LIST;
  const categoryPages = Math.max(1, Math.ceil(categories.length / CATEGORY_PAGE_SIZE));
  const shopPages = Math.max(1, Math.ceil(shops.length / SHOP_PAGE_SIZE));
  const safeCatPage = Math.min(categoryPage, categoryPages);
  const safeShopPage = Math.min(shopPage, shopPages);
  const pagedCategories = useMemo(() => categories.slice((safeCatPage - 1) * CATEGORY_PAGE_SIZE, safeCatPage * CATEGORY_PAGE_SIZE), [categories, safeCatPage]);
  const pagedShops = useMemo(() => shops.slice((safeShopPage - 1) * SHOP_PAGE_SIZE, safeShopPage * SHOP_PAGE_SIZE), [shops, safeShopPage]);

  const submit = useMutation({
    mutationFn: ({ shopId, text, categoryId }) =>
      api.post(`/api/users/repair-request/${encodeURIComponent(shopId)}`, { description: text, deviceCategory: categoryId }, { headers: authHeaders() }),
    onSuccess: (_res, vars) => {
      dropRepairsCache();
      qc.invalidateQueries({ queryKey: ['repairs'] });
      setSubmittedShop(vars.shop);
      setStep(4);
      toast({
        icon: 'success', title: t('sentTitle'),
        text: t('sentText').split('{{name}}').join(clean(vars.shop.name, 60)), timer: 3500,
      });
    },
    onError: (err) => {
      if (isUnauthorized(err)) return expireSession(navigate);
      const msg = err?.response?.data?.message;
      return toast({ icon: 'error', title: t('sendFailTitle'), text: (typeof msg === 'string' && clean(msg, 120)) || t('sendFailText'), timer: 3500 });
    },
    onSettled: () => { submitLock.current = false; },
  });

  const goTo = useCallback((n) => startTransition(() => { setStep(n); }), []);
  const toStep1 = useCallback(() => goTo(1), [goTo]);
  const toStep2 = useCallback(() => goTo(2), [goTo]);
  const toAccount = useCallback(() => navigate('/account'), [navigate]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!cleanText(descRef.current)) return toast({ icon: 'warning', title: t('descRequiredTitle'), text: t('descRequiredText') });
      return goTo(2);
    }
    if (step === 2) {
      if (!category) return toast({ icon: 'warning', title: t('selectDeviceTitle') });
      return goTo(3);
    }
    return undefined;
  }, [step, category, goTo, t]);

  const handleSend = useCallback(() => {
    if (!shop || !category || submit.isPending || submitLock.current) return;
    if (!shop.activate || !ID_RE.test(shop.id) || !ID_RE.test(category.id)) return;
    const text = cleanText(descRef.current, MAX_DESC);
    if (!text) return;
    submitLock.current = true;
    submit.mutate({ shopId: shop.id, text, categoryId: category.id, shop });
  }, [shop, category, submit]);

  const reset = useCallback(() => {
    descRef.current = '';
    setHasDesc(false);
    setDescSeed((n) => n + 1);
    setStep(1); setCategory(null); setShop(null); setSubmittedShop(null); setCategoryPage(1); setShopPage(1); setInfoShop(null); submit.reset();
  }, [submit]);

  const openInfo = useCallback((s) => setInfoShop(s), []);
  const closeInfo = useCallback(() => setInfoShop(null), []);
  const changeCatPage = useCallback((p) => startTransition(() => setCategoryPage(p)), []);
  const changeShopPage = useCallback((p) => startTransition(() => setShopPage(p)), []);

  const head = STEP_HEAD[step - 1];

  return (
    <div
      dir={languageDirection(language)}
      lang={language}
      className={`rp min-h-screen [overflow-x:clip] ${darkMode ? 'rp-dark' : ''}`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[1200] h-1">
        <div ref={barRef} className="h-full origin-left bg-[#39ff88] rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
      </div>
      <Device3DStyles />
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <main className="mx-auto max-w-6xl px-4 pb-14 pt-36 sm:px-6 md:pt-32 lg:px-8" aria-busy={isPending}>
        <header className="rp-rise mb-8 space-y-5">
          <Crumbs t={t} />
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight rtl:tracking-normal sm:text-3xl">{t('pageTitle')}</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[color:var(--mu)]">{t('pageSub')}</p>
          </div>
          <TrustBar t={t} />
        </header>

        <div id="repair-form" className="rp-rise scroll-mt-28 space-y-6">
          <Progress step={step} t={t} />

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <section
              aria-label={t(head.title)}
              aria-busy={isPending}
              className={`min-w-0 p-5 transition-opacity duration-200 motion-reduce:transition-none sm:p-8 ${CARD} ${isPending ? 'opacity-60' : ''}`}
            >
              <div className="min-w-0 max-w-2xl">
                <h2 className="text-xl font-extrabold tracking-tight rtl:tracking-normal sm:text-2xl">{t(head.title)}</h2>
                <p className="mt-1.5 text-sm font-medium text-[color:var(--mu)]">{t(head.subtitle)}</p>
              </div>

              <div key={step} className="rp-in mt-6">
                {step === 1 && (
                  <>
                    <DescribeStep key={descSeed} initial={descRef.current} onChange={onDescChange} t={t} />
                    <NavButtons showBack={false} onNext={handleNext} nextDisabled={!hasDesc} t={t} />
                  </>
                )}

                {step === 2 && (
                  <>
                    {categoriesQ.isPending ? (
                      <CategoriesSkeleton label={t('loading')} />
                    ) : categoriesQ.isError ? (
                      <StateBox darkMode={darkMode} label={t('loadCategoriesFail')} onRetry={categoriesQ.refetch} retryLabel={t('tryAgain')} />
                    ) : categories.length === 0 ? (
                      <StateBox darkMode={darkMode} label={t('noCategories')} />
                    ) : (
                      <>
                        <div role="group" aria-label={t('deviceType')} className="grid grid-cols-2 gap-5 p-2 sm:grid-cols-3">
                          {pagedCategories.map((c) => (
                            <div key={c.id} className="min-w-0">
                              <CategoryTile cat={c} active={category?.id === c.id} onSelect={setCategory} darkMode={darkMode} />
                            </div>
                          ))}
                        </div>
                        <Pager page={safeCatPage} totalPages={categoryPages} onChange={changeCatPage} pending={isPending} t={t} />
                        {!category && <p role="status" className="mt-5 text-sm font-semibold text-[color:var(--mu)]">{t('selectCategoryPrompt')}</p>}
                      </>
                    )}
                    <NavButtons onBack={toStep1} onNext={handleNext} nextDisabled={!category} t={t} />
                  </>
                )}

                {step === 3 && (
                  <>
                    {shopsQ.isPending ? (
                      <ShopsSkeleton label={t('loading')} />
                    ) : shopsQ.isError ? (
                      <StateBox darkMode={darkMode} label={t('loadShopsFail')} onRetry={shopsQ.refetch} retryLabel={t('tryAgain')} />
                    ) : shops.length === 0 ? (
                      <StateBox darkMode={darkMode} label={t('noShops')} />
                    ) : (
                      <>
                        <div role="radiogroup" aria-label={t('chooseShopTitle')} className="grid grid-cols-1 gap-5 p-2 sm:grid-cols-2">
                          {pagedShops.map((s) => (
                            <div key={s.id} className="flex min-w-0 flex-col">
                              <ShopOption shop={s} active={shop?.id === s.id} onSelect={setShop} onInfo={openInfo} t={t} />
                            </div>
                          ))}
                        </div>
                        <Pager page={safeShopPage} totalPages={shopPages} onChange={changeShopPage} pending={isPending} t={t} />
                      </>
                    )}
                    <NavButtons onBack={toStep2} onNext={handleSend} nextLabel={t('sendRepairRequest')} nextDisabled={!shop} isLoading={submit.isPending} t={t} />
                  </>
                )}

                {step === 4 && (
                  <div className="flex flex-col items-center py-4 text-center" role="status">
                    <IsoIllustration type="marketplace" tone="emerald" onGreen={false} darkMode={darkMode} className="h-32 w-32" />
                    <span aria-hidden="true" className={`mt-2 flex h-12 w-12 items-center justify-center rounded-full ${CHIP}`}>
                      <FiCheck className="h-6 w-6" strokeWidth={4} />
                    </span>
                    <h3 className="mt-5 text-xl font-extrabold sm:text-2xl">{t('requestSent')}</h3>
                    <p className="mt-4 text-sm text-[color:var(--mu)]">{t('requestSentTo')}</p>
                    <p className="mt-1 text-base font-extrabold">{submittedShop?.name || t('defaultShopName')}</p>
                    <p className="text-sm text-[color:var(--mu)]">
                      {submittedShop?.shopAddress?.city || t('defaultCity')}{submittedShop?.shopAddress?.state ? `, ${submittedShop.shopAddress.state}` : ''}
                    </p>
                    <div className="mt-8 flex w-full max-w-md flex-col gap-4 sm:flex-row">
                      <button type="button" onClick={reset} className={`${BTN_SECONDARY} flex-1`}>{t('newRequest')}</button>
                      <button type="button" onClick={toAccount} className={`${BTN_PRIMARY} flex-1`}>
                        {t('viewMyRequests')}<FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <aside className="hidden space-y-6 lg:sticky lg:top-32 lg:block">
              <SummaryPanel category={category} shop={shop} t={t} />
              <InfoPanel step={step} darkMode={darkMode} t={t} />
            </aside>
          </div>
        </div>
      </main>

      <div ref={journeyRef} className="rp-defer pb-16 pt-2" style={journeyNear ? undefined : { minHeight: 420 }}>
        {journeyNear && <JourneySection t={t} />}
      </div>

      {infoShop && <ShopDetailModal key={infoShop.id} shop={infoShop} language={language} onClose={closeInfo} t={t} />}
    </div>
  );
});

export { queryClient };
export default function RepairRequest(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <RepairRequestContent {...props} />
    </QueryClientProvider>
  );
}