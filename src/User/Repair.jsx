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
    yourRequest: 'Votre demande', notSelected: 'Pas encore choisi', journeySub: "Suivez votre appareil de la demande à la livraison.",
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

LOCAL_TEXT.en.scrollProgress = 'Page progress';

const tr = (language, key) =>
  REPAIR_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  REPAIR_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

const NB_CSS = `
@font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
.nb{--dx:1;--nb-bg:#ffffff;--nb-card:#ffffff;--nb-ink:#052e1e;--nb-muted:rgba(5,46,30,.68);--nb-line:#e5e7eb;--nb-bd:#000000;--nb-sd:#000000;--nb-gray:#f3f4f6;--nb-media:#f3f4f6;--nb-accent:#059669;--nb-btn:#39ff88;--nb-btn2:#7dffb0;--nb-on:#022c22;--nb-ring:#059669;--nb-scrim:rgba(0,0,0,.6);--nb-warn:#c2410c;
--nb-sh2:calc(var(--dx)*2px) 2px 0 0 var(--nb-sd);--nb-sh3:calc(var(--dx)*3px) 3px 0 0 var(--nb-sd);--nb-sh4:calc(var(--dx)*4px) 4px 0 0 var(--nb-sd);--nb-sh6:calc(var(--dx)*6px) 6px 0 0 var(--nb-sd);--nb-sh8:calc(var(--dx)*8px) 8px 0 0 var(--nb-sd);
background:var(--nb-bg);color:var(--nb-ink);color-scheme:light;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.nb[dir=rtl]{--dx:-1}
.nb-dark{--nb-bg:#121212;--nb-card:#1c1c1e;--nb-ink:#ffffff;--nb-muted:rgba(255,255,255,.66);--nb-line:rgba(255,255,255,.16);--nb-bd:rgba(255,255,255,.16);--nb-sd:#0b4a35;--nb-gray:#2a2a2e;--nb-media:#2a2a2e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-btn2:#7dffb0;--nb-on:#022c22;--nb-ring:#39ff88;--nb-scrim:rgba(0,0,0,.72);--nb-warn:#fdba74;color-scheme:dark}
.nb[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
.nb[lang=ar] *{letter-spacing:0!important}
.nb button,.nb input,.nb textarea{font-family:inherit}
.nb-gray{background:var(--nb-gray)}
.nb-media{background:var(--nb-media)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-bd{border-color:var(--nb-bd)}
.nb-card{background:var(--nb-card);border:3px solid var(--nb-bd);border-radius:1rem;box-shadow:var(--nb-sh4);transition:transform .15s ease,box-shadow .15s ease}
.nb-big{box-shadow:var(--nb-sh8)}
@media (hover:hover){.nb-lift:hover{transform:translate3d(0,-2px,0);box-shadow:var(--nb-sh6)}}
.nb-pick,.nb-pick:hover{box-shadow:var(--nb-sh6);outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-chip{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;border:2px solid var(--nb-bd);border-radius:.625rem;background:var(--nb-btn);color:var(--nb-on);box-shadow:var(--nb-sh2)}
.nb-chip-bad{background:#fb7185;color:#000}
.nb-tag{display:inline-flex;align-items:center;gap:6px;border:2px solid var(--nb-bd);border-radius:.625rem;background:var(--nb-card);box-shadow:var(--nb-sh2)}
.nb-rate{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border:2px solid var(--nb-bd);border-radius:999px;background:#fcd34d;color:#000;font-size:11px;font-weight:700}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-bd);border-radius:.75rem;box-shadow:var(--nb-sh3);font-weight:700;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,background-color .15s ease,color .15s ease}
@media (hover:hover){.nb-btn:hover:not(:disabled){background:var(--nb-btn);color:var(--nb-on);box-shadow:var(--nb-sh4);transform:translate3d(0,-1px,0)}}
.nb-btn:active:not(:disabled){transform:translate3d(0,2px,0);box-shadow:none}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on);border-width:3px;box-shadow:var(--nb-sh4)}
@media (hover:hover){.nb-btn-a:hover:not(:disabled),.nb-btn-on:hover:not(:disabled){background:var(--nb-btn2)}}
.nb-btn:focus-visible,.nb-focus:focus-visible{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-bd);border-radius:.875rem;box-shadow:var(--nb-sh3);transition:box-shadow .15s ease}
@media (hover:hover){.nb-field:hover{box-shadow:var(--nb-sh4)}}
.nb-field:focus-within{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-field textarea::placeholder{color:var(--nb-muted)}
.nb-flip{display:inline-block}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:3px dashed var(--nb-bd);border-radius:1rem}
.nb-opt{transition:background-color .15s ease,color .15s ease}
.nb-st{position:relative}
.nb-st::before{content:'';position:absolute;top:calc(1.125rem - 1.5px);inset-inline-start:calc(-50% + 1.5rem);inset-inline-end:calc(50% + 1.5rem);height:3px;border-radius:2px;background:var(--nb-line)}
.nb-st:first-child::before{display:none}
.nb-st[data-done=true]::before{background:var(--nb-btn)}
.nb-sk{position:relative;overflow:hidden;border-radius:.5rem;background:color-mix(in srgb,var(--nb-ink) 10%,transparent)}
.nb-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--nb-card) 70%,transparent),transparent);animation:nbShimmer 1.3s ease-in-out infinite}
.nb[dir=rtl] .nb-sk::after{animation-direction:reverse}
@keyframes nbShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
@keyframes nbIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.nb-in{animation:nbIn .25s cubic-bezier(.2,.8,.2,1) both}
@keyframes nbRise{from{opacity:0;transform:translate3d(0,16px,0)}to{opacity:1;transform:none}}
.nb-rise{animation:nbRise .5s cubic-bezier(.16,.84,.24,1) both;animation-delay:calc(var(--d,0)*70ms)}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-field,.nb-opt{transition:none}.nb-lift:hover,.nb-btn:hover:not(:disabled){transform:none}.nb-in,.nb-rise{animation:none!important}.nb-sk::after{animation:none}}
`;

const PAGE_CSS = `
  ${EXTRAS_CSS}
  @keyframes hpFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes hpFadeOut { from { opacity: 1; } to { opacity: 0; } }
  .hp-fade { animation: hpFade .18s ease-out both; }
  .hp-fade-out { animation: hpFadeOut .18s ease-in both; }
  @keyframes hpModal { from { opacity: 0; transform: translate3d(0, 24px, 0); } to { opacity: 1; transform: none; } }
  @keyframes hpModalOut { from { opacity: 1; transform: none; } to { opacity: 0; transform: translate3d(0, 24px, 0); } }
  .hp-modal { animation: hpModal .24s cubic-bezier(.2,.8,.2,1) both; }
  .hp-modal-out { animation: hpModalOut .18s ease-in both; }
  @media (prefers-reduced-motion: no-preference) { html:has(.nb) { scroll-behavior: smooth; } }
  @media (prefers-reduced-motion: reduce) {
    .hp-fade, .hp-fade-out, .hp-modal, .hp-modal-out { animation: none; }
  }
  ${NB_CSS}
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

const LAZY_SECTION = '[content-visibility:auto] [contain-intrinsic-size:auto_420px]';
const REDUCED_Q = '(prefers-reduced-motion: reduce)';
const LEAVE_MS = 180;
const ID_RE = /^[\w-]{1,64}$/;
const RISE = Array.from({ length: 4 }, (_, i) => ({ '--d': i }));

const IconTile = memo(({ Icon, className = 'h-9 w-9', iconClassName = 'h-4 w-4', bad = false }) => (
  <span aria-hidden="true" className={`nb-chip ${bad ? 'nb-chip-bad' : ''} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const BTN_BASE = 'nb-btn min-h-11 px-4 py-2.5 text-sm';
const btnCls = (primary) => `${BTN_BASE} ${primary ? 'nb-btn-a' : ''}`;
const SMALL_BTN = '!min-h-9 !px-3 !py-1 !text-xs';

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
  useEffect(() => () => clearTimeout(timer.current), []);
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
    const h = setTimeout(() => setOn(true), 300);
    return () => clearTimeout(h);
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

const SectionHead = memo(({ title, subtitle, level: H = 'h2', big = false }) => (
  <header className="min-w-0 max-w-2xl">
    <H className={`font-bold leading-snug [text-wrap:balance] ${big ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'}`}>{title}</H>
    {subtitle && <p className="nb-muted mt-2 text-sm leading-relaxed">{subtitle}</p>}
  </header>
));

const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };
const dateFmtCache = {};
const formatDate = (iso, language) => {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return null;
  const loc = LOCALES[language] || 'en-GB';
  dateFmtCache[loc] ||= new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' });
  return dateFmtCache[loc].format(d);
};

const telHref = (phone) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  return digits ? `tel:${digits}` : null;
};

const dropRepairsCache = () => {
  try { sessionStorage.removeItem('acct:repairs'); } catch { }
};

const MAX_DESC = 1000;
const CATEGORY_PAGE_SIZE = 6;
const SHOP_PAGE_SIZE = 4;
const SUGGESTION_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'];
const EMPTY_LIST = [];
const SK_CATEGORIES = [0, 1, 2, 3, 4, 5];
const SK_SHOPS = [0, 1, 2, 3];

const TRUST_ITEMS = [
  { key: 'trustShops', Icon: FiShield },
  { key: 'trustPickup', Icon: FiTruck },
  { key: 'trustQuote', Icon: FiTag },
  { key: 'trustTrack', Icon: FiMapPin },
];

const STEP_DEFS = [
  { labelKey: 'describe', hintKey: 'describeHint' },
  { labelKey: 'category', hintKey: 'pickCategoryHint' },
  { labelKey: 'shop', hintKey: 'chooseShopHint' },
  { labelKey: 'done', hintKey: 'sendRequestHint' },
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

const toList = (res) => {
  const raw = res?.data?.content || res?.data || [];
  return Array.isArray(raw) ? raw : [];
};
const validId = (x) => x && x.id != null && ID_RE.test(String(x.id));
const normalizeCategory = (c) => ({ id: String(c.id), name: clean(String(c.name ?? ''), 80) });
const normalizeShop = (s) => ({
  id: String(s.id),
  name: clean(String(s.name ?? ''), 120),
  email: s.email ? clean(String(s.email), 120) : '',
  phone: s.phone ? clean(String(s.phone), 30) : '',
  description: s.description ? clean(String(s.description), 600) : '',
  shopType: s.shopType ? clean(String(s.shopType), 40) : '',
  verified: !!s.verified,
  activate: !!s.activate,
  rating: Number.isFinite(Number(s.rating)) && Number(s.rating) > 0 ? Number(s.rating) : null,
  createdAt: s.createdAt || null,
  shopAddress: s.shopAddress
    ? { street: clean(String(s.shopAddress.street || ''), 120), city: clean(String(s.shopAddress.city || ''), 80), state: clean(String(s.shopAddress.state || ''), 80) }
    : null,
});

const shopAddressLine = (shop, withState) => {
  if (!shop.shopAddress) return '';
  const { street, city, state } = shop.shopAddress;
  return (withState ? [street, city, state] : [street, city]).filter(Boolean).join(', ');
};

const Crumbs = memo(({ t }) => (
  <nav aria-label={t('breadcrumb')} className="nb-muted flex flex-wrap items-center gap-2 text-sm font-semibold">
    <Link to="/" className="nb-focus rounded-md transition-colors hover:text-[color:var(--nb-ink)] hover:underline hover:decoration-2 hover:underline-offset-4">{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    <span aria-current="page" className="text-[color:var(--nb-ink)]">{t('crumbRepair')}</span>
  </nav>
));

const TrustBar = memo(({ t }) => (
  <ul className="flex flex-wrap gap-3 text-xs font-bold">
    {TRUST_ITEMS.map(({ key, Icon }) => (
      <li key={key} className="nb-tag px-3 py-1.5">
        <Icon aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />
        <span>{t(key)}</span>
      </li>
    ))}
  </ul>
));

const Sk = ({ className = '' }) => <div aria-hidden="true" className={`nb-sk ${className}`} />;

const VerifiedMark = memo(({ label }) => (
  <span className="inline-flex flex-shrink-0" title={label}>
    <RiVerifiedBadgeLine aria-hidden="true" className="nb-ic h-4 w-4" />
    <span className="sr-only">{label}</span>
  </span>
));

const Meter = memo(({ pct }) => (
  <div className="nb-bd h-3 overflow-hidden rounded-full border-2 bg-[color:var(--nb-card)]" aria-hidden="true">
    <div
      className="h-full w-full origin-left bg-[color:var(--nb-btn)] transition-transform duration-300 ease-out rtl:origin-right motion-reduce:transition-none"
      style={{ transform: `scaleX(${pct / 100})` }}
    />
  </div>
));

const ProgressSteps = memo(({ step, t }) => {
  const total = STEP_DEFS.length;
  return (
    <div className="nb-card px-4 py-5 sm:px-6">
      <p className="sr-only">{t('step')} {step} {t('of')} {total}</p>
      <ol aria-label={t('progress')} className="grid grid-cols-4">
        {STEP_DEFS.map(({ labelKey, hintKey }, i) => {
          const n = i + 1;
          const reached = step >= n;
          const active = step === n;
          return (
            <li key={labelKey} data-done={reached} aria-current={active ? 'step' : undefined} className="nb-st flex min-w-0 flex-col items-center gap-2 text-center">
              <span
                className={`relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums transition-colors duration-200 motion-reduce:transition-none nb-bd ${
                  reached
                    ? 'bg-[color:var(--nb-btn)] text-[color:var(--nb-on)] shadow-[var(--nb-sh2)]'
                    : 'bg-[color:var(--nb-card)] nb-muted'
                } ${active ? 'outline outline-[3px] outline-offset-2 outline-[color:var(--nb-ring)]' : ''}`}
              >
                {step > n ? <FiCheck aria-hidden="true" className="h-4 w-4" strokeWidth={4} /> : <span dir="ltr">{n}</span>}
              </span>
              <div className="min-w-0 max-w-full px-0.5">
                <p className={`truncate text-xs font-bold ${reached ? '' : 'nb-muted'}`}>{t(labelKey)}</p>
                <p className="nb-muted mt-0.5 hidden truncate text-[11px] sm:block">{t(hintKey)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 sm:hidden">
        <Meter pct={(step / total) * 100} />
      </div>
    </div>
  );
});

const NavButtons = memo(({ onBack, onNext, nextLabel, nextDisabled, isLoading, showBack = true, t }) => (
  <div className={`nb-line mt-8 flex flex-wrap gap-3 border-t-2 pt-5 ${showBack ? 'justify-between' : 'justify-end'}`}>
    {showBack && (
      <button type="button" className={btnCls(false)} onClick={onBack} disabled={isLoading}>
        <FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />{t('back')}
      </button>
    )}
    <button type="button" className={`${btnCls(true)} flex-1 sm:flex-none sm:px-8`} onClick={onNext} disabled={nextDisabled || isLoading} aria-busy={isLoading}>
      {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />}
      <span>{isLoading ? t('sending') : nextLabel || t('continue')}</span>
      {!isLoading && <FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />}
    </button>
  </div>
));

const CategorySkeleton = memo(() => (
  <div className="nb-card flex flex-col items-center gap-2.5 p-3 sm:p-4">
    <Sk className="h-16 w-full sm:h-20" />
    <Sk className="h-4 w-2/3" />
  </div>
));

const ShopSkeleton = memo(() => (
  <div className="nb-card flex h-48 flex-col gap-3 p-4">
    <div className="flex items-start gap-3">
      <Sk className="h-10 w-10 flex-none" />
      <div className="min-w-0 flex-1 space-y-2"><Sk className="h-4 w-3/4" /><Sk className="h-3 w-1/4" /></div>
      <Sk className="h-9 w-9 flex-none" />
    </div>
    <Sk className="h-3 w-2/3" />
    <Sk className="mt-auto h-9 w-full" />
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
  <div className="nb-dot nb-in flex flex-col items-center px-4 py-12 text-center">
    <IsoIllustration type="shop" tone="emerald" onGreen={false} darkMode={darkMode} className="mb-3 h-24 w-24" />
    <p className="text-base font-bold">{label}</p>
    {onRetry && (
      <button type="button" onClick={() => onRetry()} className={`mt-5 ${btnCls(true)}`}>
        <FiRefreshCw aria-hidden="true" className="h-4 w-4" />{retryLabel}
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
    <nav aria-label={t('pagination')} aria-busy={pending} className="flex flex-wrap items-center justify-center gap-3 pt-8">
      <button type="button" className="nb-btn h-10 w-10" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <FiChevronLeft aria-hidden="true" className="nb-flip h-4 w-4" />
      </button>
      {pageWindow(page, totalPages).map((x) => (typeof x === 'number' ? (
        <button
          key={x} type="button" onClick={() => onChange(x)}
          aria-label={`${t('page')} ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`nb-btn h-10 min-w-[2.5rem] px-2 text-sm tabular-nums ${x === page ? 'nb-btn-on' : ''}`}
        >
          <span dir="ltr">{x}</span>
        </button>
      ) : <span key={x} aria-hidden="true" className="nb-muted px-1 font-bold">…</span>))}
      <button type="button" className="nb-btn h-10 w-10" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
        <FiChevronRight aria-hidden="true" className="nb-flip h-4 w-4" />
      </button>
    </nav>
  );
});

const DescribeStep = memo(({ initial, onChange, t }) => {
  const [value, setValue] = useState(initial);
  const update = useCallback((v) => { const next = v.slice(0, MAX_DESC); setValue(next); onChange(next); }, [onChange]);
  const handleChange = useCallback((e) => update(e.target.value), [update]);
  const addSuggestion = useCallback(
    (s) => update(value ? `${value}, ${s.toLowerCase()}` : s),
    [update, value],
  );
  const blank = value.length > 0 && !value.trim();
  return (
    <div className="max-w-3xl">
      <label htmlFor="repair-description" className="sr-only">{t('describeProblem')}</label>
      <div className={`nb-field overflow-hidden ${blank ? '!border-rose-500' : ''}`}>
        <textarea
          id="repair-description" value={value} onChange={handleChange}
          maxLength={MAX_DESC} placeholder={t('issuePlaceholder')} aria-required="true" autoComplete="off" spellCheck
          aria-invalid={blank} aria-describedby={blank ? 'repair-description-error' : undefined}
          className="block min-h-[170px] w-full resize-none rounded-none border-0 bg-transparent px-4 py-3.5 text-base font-semibold leading-relaxed outline-none placeholder:font-normal placeholder:opacity-70 sm:min-h-[200px] sm:text-sm"
        />
        <div className="nb-line nb-muted flex items-center justify-between gap-3 border-t-2 px-4 py-2 text-xs font-semibold">
          <span className="min-w-0 truncate">{t('tip')}</span>
          <span dir="ltr" className="flex-shrink-0 tabular-nums transition-colors" style={value.length > 900 ? { color: 'var(--nb-warn)' } : undefined}>{value.length} / {MAX_DESC}</span>
        </div>
      </div>
      {blank && (
        <p id="repair-description-error" role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-bold text-rose-600">
          <FiXCircle aria-hidden="true" className="h-4 w-4 flex-shrink-0" />{t('descBlank')}
        </p>
      )}
      <div role="group" aria-label={t('suggestions')} className="mt-5 flex flex-wrap gap-3">
        {SUGGESTION_KEYS.map((k) => {
          const s = t(k);
          return <button key={k} type="button" onClick={() => addSuggestion(s)} className={`nb-btn ${SMALL_BTN}`}>+ {s}</button>;
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
      className={`nb-card nb-lift nb-focus relative flex min-h-11 w-full cursor-pointer flex-col items-center gap-2.5 p-3 text-center sm:p-4 ${active ? 'nb-pick' : ''}`}
    >
      <span className="nb-gray nb-line flex w-full items-center justify-center rounded-xl border-2 py-2">
        <IsoIllustration type={catKey} darkMode={darkMode} onGreen={false} className="h-12 w-12 sm:h-14 sm:w-14" />
      </span>
      <span className="line-clamp-1 w-full text-sm font-bold">{cat.name}</span>
      {active && (
        <span aria-hidden="true" className="nb-chip absolute end-2 top-2 h-6 w-6 rounded-full">
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
  const mode = shop.activate ? 'nb-lift cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale';
  return (
    <div
      role="radio" aria-checked={active} aria-disabled={!shop.activate} tabIndex={shop.activate ? 0 : -1}
      onClick={select} onKeyDown={onKey}
      className={`nb-card nb-focus flex h-full flex-col gap-3 p-4 ${mode} ${active ? 'nb-pick' : ''}`}
    >
      <div className="flex items-start gap-3">
        <IconTile Icon={RiStoreLine} className="h-10 w-10" iconClassName="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-bold leading-snug">
            <span className="line-clamp-2 min-w-0">{shop.name}</span>
            {shop.verified && <VerifiedMark label={t('verifiedLabel')} />}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="nb-rate">
              <RiStarFill aria-hidden="true" className="h-3 w-3" />
              <span dir="ltr" className="tabular-nums">{shop.rating ? shop.rating.toFixed(1) : t('newRating')}</span>
            </span>
            <span className="nb-tag px-1.5 py-0.5 text-[11px] font-bold !shadow-none"><span className="truncate">{shop.shopType || t('generalType')}</span></span>
          </div>
        </div>
        <button type="button" onClick={info} aria-label={t('shopDetailsAria')} className="nb-btn h-9 w-9 flex-shrink-0">
          <FiInfo aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {address && (
        <p className="nb-muted flex items-center gap-1.5 text-xs font-semibold">
          <FiMapPin aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" /><span className="line-clamp-1">{address}</span>
        </p>
      )}
      <div className="nb-line mt-auto border-t-2 pt-3">
        {shop.activate ? (
          <span aria-hidden="true" className={`nb-opt nb-bd flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border-2 text-xs font-bold ${active ? 'bg-[color:var(--nb-btn)] text-[color:var(--nb-on)]' : 'nb-gray'}`}>
            {active && <FiCheck className="h-4 w-4" strokeWidth={4} />}
            {active ? t('selected') : t('pickShop')}
          </span>
        ) : (
          <span className="nb-muted flex min-h-9 items-center justify-center text-xs font-bold">{t('inactive')}</span>
        )}
      </div>
    </div>
  );
});

const InfoRow = memo(({ Icon, label, value, ltr, dd = false }) => (
  <div className="nb-gray nb-line flex items-center gap-3 rounded-xl border-2 p-3">
    <IconTile Icon={Icon} className="h-9 w-9" iconClassName="h-4 w-4" />
    <div className="min-w-0 flex-1">
      {dd ? <dt className="nb-muted text-xs font-semibold">{label}</dt> : <p className="nb-muted text-xs font-semibold">{label}</p>}
      {dd
        ? <dd className="truncate text-sm font-bold" dir={ltr ? 'ltr' : undefined}>{value}</dd>
        : <p className="truncate text-sm font-bold" dir={ltr ? 'ltr' : undefined}>{value}</p>}
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
      <div className={`${leaving ? 'hp-fade-out' : 'hp-fade'} absolute inset-0 bg-[color:var(--nb-scrim)]`} onClick={requestClose} aria-hidden="true" />
      <div className={`nb-card nb-big ${leaving ? 'hp-modal-out' : 'hp-modal'} relative flex max-h-[92vh] w-full flex-col overflow-hidden sm:max-w-md`}>
        <header className="nb-gray nb-line flex flex-shrink-0 items-center gap-3 border-b-2 px-4 py-3.5 sm:px-5">
          <IconTile Icon={RiStoreLine} className="h-10 w-10" iconClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1.5 text-base font-bold">
              <span className="truncate">{shop.name}</span>
              {shop.verified && <VerifiedMark label={t('verifiedLabel')} />}
            </h2>
            <p className="mt-1">
              <span className="nb-rate">
                <RiStarFill aria-hidden="true" className="h-3 w-3" />
                <span dir="ltr" className="tabular-nums">{shop.rating ? shop.rating.toFixed(1) : t('newRating')}</span>
              </span>
            </p>
          </div>
          <button type="button" onClick={requestClose} aria-label={t('close') || 'Close'} className="nb-btn h-9 w-9 flex-shrink-0">
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {shop.description && <p className="nb-muted text-sm leading-relaxed">{shop.description}</p>}
          {rows.map(({ Icon, label, value, ltr }) => (
            <InfoRow key={label} Icon={Icon} label={label} value={value} ltr={ltr} />
          ))}
        </div>
        {tel && (
          <footer className="nb-line flex-shrink-0 border-t-2 px-4 py-3.5 sm:px-5">
            <a href={tel} rel="noopener noreferrer" className={`${btnCls(true)} w-full text-xs`}><FiPhone aria-hidden="true" className="h-4 w-4" />{t('phone')}</a>
          </footer>
        )}
      </div>
    </div>
  );
});

const InfoPanel = memo(({ step, darkMode, t }) => {
  const head = STEP_HEAD[step - 1];
  return (
    <div key={step} className="nb-card hp-fade overflow-hidden">
      <div className="nb-media nb-bd border-b-[3px] p-3">
        <IsoIllustration type={INFO_SCENES[step - 1]} tone="emerald" onGreen={false} darkMode={darkMode} className="mx-auto h-28 w-28" />
      </div>
      <div className="p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <head.icon aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />
          <span className="min-w-0">{t(head.infoTitle)}</span>
        </h3>
        <p className="nb-muted mt-2 text-sm leading-relaxed">{t(head.infoBody)}</p>
      </div>
    </div>
  );
});

const SummaryPanel = memo(({ category, shop, t }) => {
  const rows = [
    [t('category'), category?.name, FiSmartphone],
    [t('shop'), shop?.name, RiStoreLine],
  ];
  return (
    <div className="nb-card p-5">
      <h3 className="text-sm font-bold">{t('yourRequest')}</h3>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value, Icon]) => (
          <InfoRow key={label} dd Icon={Icon} label={label} value={value || t('notSelected')} />
        ))}
      </dl>
      <p className="nb-muted mt-4 flex items-start gap-2 text-xs leading-relaxed">
        <FiLock aria-hidden="true" className="nb-ic mt-0.5 h-3.5 w-3.5 flex-shrink-0" />{t('summaryNote')}
      </p>
    </div>
  );
});

const JourneySection = memo(({ t }) => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-6">
      <SectionHead big title={t('repairJourney')} subtitle={t('journeySub')} />
    </div>
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {STATUS_JOURNEY.map(({ key, labelKey, descKey, Icon, danger }) => (
        <li key={key} className="nb-card flex min-w-0 items-start gap-3 p-4">
          <IconTile Icon={Icon} bad={danger} className="h-10 w-10" iconClassName="h-5 w-5" />
          <div className="min-w-0">
            <p className="text-sm font-bold">{t(labelKey)}</p>
            <p className="nb-muted mt-1 text-[13px] leading-relaxed">{t(descKey)}</p>
          </div>
        </li>
      ))}
    </ul>
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
    queryFn: async ({ signal }) => toList(await api.get('/api/categories', { headers: authHeaders(), signal })).filter(validId).map(normalizeCategory),
    enabled: !!token && (idle || step >= 2),
    staleTime: 5 * 60 * 1000,
  });

  const shopsQ = useQuery({
    queryKey: ['repairShops'],
    queryFn: async ({ signal }) =>
      toList(await api.get('/api/users/shops/all', { headers: authHeaders(), signal }))
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
      return toast({ icon: 'error', title: t('sendFailTitle'), text: clean(String(err.response?.data?.message || ''), 120) || t('sendFailText'), timer: 3500 });
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
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-clip`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[1200] h-1">
        <div ref={barRef} className="h-full origin-left bg-[color:var(--nb-btn)] rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
      </div>
      <Device3DStyles />
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-32 sm:px-6 lg:px-8" aria-busy={isPending}>
        <header className="nb-rise mb-10 space-y-5" style={RISE[0]}>
          <Crumbs t={t} />
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t('pageTitle')}</h1>
            <p className="nb-muted mt-3 text-sm leading-relaxed sm:text-base">{t('pageSub')}</p>
          </div>
          <TrustBar t={t} />
        </header>

        <section aria-label={t('pageTitle')} id="repair-form" className="nb-rise scroll-mt-28" style={RISE[1]}>
          <div className="mb-8">
            <ProgressSteps step={step} t={t} />
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div aria-busy={isPending} className={`nb-card nb-big overflow-hidden transition-opacity duration-200 motion-reduce:transition-none ${isPending ? 'opacity-60' : ''}`}>
              <div className="nb-gray nb-line border-b-2 p-4 sm:p-6">
                <SectionHead title={t(head.title)} subtitle={t(head.subtitle)} />
              </div>

              <div key={step} className="nb-in p-4 sm:p-6">
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
                        {!category && <p role="status" className="nb-muted mt-5 text-sm font-semibold">{t('selectCategoryPrompt')}</p>}
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
                    <span className="nb-chip mt-2 h-12 w-12 rounded-full">
                      <FiCheck aria-hidden="true" className="h-6 w-6" strokeWidth={4} />
                    </span>
                    <h2 className="mt-5 text-xl font-bold sm:text-2xl">{t('requestSent')}</h2>
                    <p className="nb-muted mt-4 text-sm">{t('requestSentTo')}</p>
                    <p className="mt-1 text-base font-bold">{submittedShop?.name || t('defaultShopName')}</p>
                    <p className="nb-muted text-sm">
                      {submittedShop?.shopAddress?.city || t('defaultCity')}{submittedShop?.shopAddress?.state ? `, ${submittedShop.shopAddress.state}` : ''}
                    </p>
                    <div className="mt-8 flex w-full max-w-md flex-col gap-4 sm:flex-row">
                      <button type="button" onClick={reset} className={`${btnCls(false)} flex-1`}>{t('newRequest')}</button>
                      <button type="button" onClick={toAccount} className={`${btnCls(true)} flex-1`}>
                        {t('viewMyRequests')}<FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="hidden space-y-6 lg:sticky lg:top-28 lg:block">
              <SummaryPanel category={category} shop={shop} t={t} />
              <InfoPanel step={step} darkMode={darkMode} t={t} />
            </aside>
          </div>
        </section>
      </main>

      <section ref={journeyRef} aria-label={t('repairJourney')} className={`pb-14 pt-4 ${LAZY_SECTION}`} style={journeyNear ? undefined : { minHeight: 420 }}>
        {journeyNear && <JourneySection t={t} />}
      </section>

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