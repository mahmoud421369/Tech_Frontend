import React, {
  useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo, useTransition,
} from 'react';
import { useNavigate, useNavigationType, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiTool, FiInfo, FiX, FiMail, FiPhone, FiCalendar, FiMapPin, FiCheck, FiCheckCircle, FiFileText,
  FiTag, FiXCircle, FiPackage, FiTruck, FiSlash, FiShield, FiChevronLeft, FiChevronRight, FiArrowRight,
  FiRefreshCw, FiSmartphone,
} from 'react-icons/fi';
import { RiStoreLine, RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
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
  },
};

const tr = (language, key) =>
  REPAIR_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  REPAIR_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

const NB_CSS = `
.nb{--nb-bg:#f3f6f4;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#5b7468;--nb-line:#e3e9e6;--nb-line2:#cfdad4;--nb-shadow:rgba(4,38,26,.1);--nb-gray:#eef3f0;--nb-accent:#059669;--nb-btn:#047857;--nb-on:#ffffff;--nb-glow:rgba(16,185,129,.12);--nb-ring:rgba(16,185,129,.5);--nb-scrim:rgba(4,38,26,.55);background-color:var(--nb-bg);background-image:radial-gradient(52rem 22rem at 90% -6rem,var(--nb-glow),transparent 68%),radial-gradient(40rem 20rem at -8% 28rem,var(--nb-glow),transparent 70%);background-repeat:no-repeat;color:var(--nb-ink);color-scheme:light;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.nb-dark{--nb-bg:#06261b;--nb-card:#0b3427;--nb-ink:#ecfdf5;--nb-muted:#8fb8a6;--nb-line:rgba(167,243,208,.14);--nb-line2:rgba(167,243,208,.26);--nb-shadow:rgba(2,20,14,.45);--nb-gray:#104534;--nb-accent:#34d399;--nb-btn:#10b981;--nb-on:#022c22;--nb-glow:rgba(52,211,153,.09);--nb-ring:rgba(52,211,153,.55);--nb-scrim:rgba(3,30,21,.72);color-scheme:dark}
.nb[lang=ar] *{letter-spacing:0!important}
.nb button,.nb input,.nb textarea{font-family:inherit}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:1px solid var(--nb-line);border-radius:1.25rem;box-shadow:0 1px 2px var(--nb-shadow);transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s ease,border-color .25s ease}
@media (hover:hover){.nb-lift:hover{transform:translate3d(0,-3px,0);box-shadow:0 16px 32px -16px var(--nb-shadow);border-color:var(--nb-accent)}}
.nb-pick,.nb-pick:hover{border-color:var(--nb-btn);box-shadow:0 0 0 2px var(--nb-btn),0 14px 28px -16px var(--nb-shadow)}
.nb-bar{display:inline-block;width:28px;height:6px;border-radius:999px;background:linear-gradient(90deg,var(--nb-accent),#059669)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--nb-card);color:var(--nb-ink);border:1px solid var(--nb-line2);border-radius:999px;font-weight:700;cursor:pointer;transition:transform .18s cubic-bezier(.2,.8,.2,1),background-color .18s ease,border-color .18s ease,filter .18s ease,box-shadow .18s ease,opacity .18s ease}
.nb-btn:not(.nb-btn-a):not(.nb-btn-on):hover:not(:disabled){background:var(--nb-gray);border-color:var(--nb-accent)}
@media (hover:hover){.nb-btn:hover:not(:disabled){transform:translate3d(0,-1px,0)}}
.nb-btn:active:not(:disabled){transform:scale(.97)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{position:relative;overflow:hidden;isolation:isolate;background:linear-gradient(135deg,#10b981 0%,#059669 50%,#047857 100%);color:#ffffff;border-color:transparent;box-shadow:0 12px 24px -12px rgba(4,120,87,.85),inset 0 1px 0 rgba(255,255,255,.28)}
.nb-btn-a::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.34) 50%,transparent 70%);transform:translate3d(-130%,0,0);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.nb-btn-a:hover:not(:disabled)::after{transform:translate3d(130%,0,0)}
.nb-btn-a:hover:not(:disabled),.nb-btn-on:hover:not(:disabled){filter:brightness(1.07);border-color:transparent;box-shadow:0 16px 28px -12px rgba(4,120,87,.95),inset 0 1px 0 rgba(255,255,255,.32)}
.nb-btn:focus-visible,.nb-focus:focus-visible{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:1px solid var(--nb-line2);border-radius:1.25rem;transition:box-shadow .18s ease,border-color .18s ease}
.nb-field:hover{border-color:var(--nb-accent)}
.nb-field:focus-within{border-color:var(--nb-accent);box-shadow:0 0 0 3px var(--nb-ring)}
.nb-flip{display:inline-block}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:1px dashed var(--nb-line2);border-radius:1.5rem}
.nb-sk{background:linear-gradient(90deg,var(--nb-gray) 25%,color-mix(in srgb,var(--nb-gray) 45%,var(--nb-card)) 50%,var(--nb-gray) 75%);background-size:220% 100%;border-radius:.75rem;animation:nbShimmer 1.5s linear infinite}
@keyframes nbShimmer{from{background-position:120% 0}to{background-position:-120% 0}}
@keyframes nbIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.nb-in{animation:nbIn .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*40ms)}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-btn-a::after,.nb-field{transition:none}.nb-lift:hover,.nb-btn:hover:not(:disabled){transform:none}.nb-in,.nb-sk{animation:none!important}}
`;

const PAGE_CSS = `
  ${EXTRAS_CSS}
  @keyframes hpRise { from { opacity: 0; transform: translate3d(0, 16px, 0); } to { opacity: 1; transform: none; } }
  .hp-rise { animation: hpRise .5s cubic-bezier(.16,.84,.24,1) both; animation-delay: calc(var(--i, 0) * 60ms); }
  @keyframes hpStep { from { opacity: 0; transform: translate3d(calc(var(--dx, 1) * var(--dir, 1) * 18px), 0, 0); } to { opacity: 1; transform: none; } }
  .hp-step { animation: hpStep .3s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes hpFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes hpFadeOut { from { opacity: 1; } to { opacity: 0; } }
  .hp-fade { animation: hpFade .18s ease-out both; }
  .hp-fade-out { animation: hpFadeOut .18s ease-in both; }
  @keyframes hpModal { from { opacity: 0; transform: translate3d(0, 24px, 0) scale(.98); } to { opacity: 1; transform: none; } }
  @keyframes hpModalOut { from { opacity: 1; transform: none; } to { opacity: 0; transform: translate3d(0, 24px, 0) scale(.98); } }
  .hp-modal { animation: hpModal .24s cubic-bezier(.2,.8,.2,1) both; }
  .hp-modal-out { animation: hpModalOut .18s ease-in both; }
  @keyframes hpPop { 0% { transform: scale(.5); opacity: 0; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
  .hp-pop { animation: hpPop .4s cubic-bezier(.2,.9,.3,1.3) both; animation-delay: .1s; }
  @media (prefers-reduced-motion: reduce) {
    .hp-rise, .hp-step, .hp-fade, .hp-fade-out, .hp-modal, .hp-modal-out, .hp-pop { animation: none; }
  }
  ${NB_CSS}
`;
if (typeof document !== 'undefined' && !document.querySelector('style[data-repair-styles]')) {
  const tag = document.createElement('style');
  tag.setAttribute('data-repair-styles', 'true');
  tag.textContent = PAGE_CSS;
  document.head.appendChild(tag);
}

const LAZY_SECTION = '[content-visibility:auto] [contain-intrinsic-size:auto_760px]';
const REDUCED_Q = '(prefers-reduced-motion: reduce)';
const LEAVE_MS = 180;
const ID_RE = /^[\w-]{1,64}$/;

const TILE_TONES = {
  em: 'bg-emerald-500 text-white', sky: 'bg-sky-500 text-white', vi: 'bg-violet-500 text-white',
  am: 'bg-amber-400 text-emerald-950', ro: 'bg-rose-500 text-white', te: 'bg-teal-500 text-white',
};

const IconTile = memo(({ Icon, tone = 'em', className = 'h-9 w-9', iconClassName = 'h-4 w-4' }) => (
  <span aria-hidden="true" className={`flex flex-shrink-0 items-center justify-center rounded-full ${TILE_TONES[tone] || TILE_TONES.em} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const BTN_BASE = 'nb-btn min-h-11 px-4 py-2.5 text-sm';
const btnCls = (primary) => `${BTN_BASE} ${primary ? 'nb-btn-a' : ''}`;
const SMALL_BTN = '!min-h-9 !px-3 !py-1 !text-xs';

const prefersReduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_Q).matches;

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

const AccentTitle = memo(({ text }) => {
  const s = String(text || '');
  const i = s.lastIndexOf(' ');
  const head = i > 0 ? s.slice(0, i + 1) : '';
  const tail = i > 0 ? s.slice(i + 1) : s;
  return (
    <>
      {head}
      <span className="nb-ic">{tail}</span>
    </>
  );
});

const SectionHead = memo(({ eyebrow, title, subtitle, level: H = 'h2' }) => (
  <header className="min-w-0 max-w-2xl">
    {eyebrow && (
      <p className="flex items-center gap-2 text-xs font-extrabold tracking-wide rtl:tracking-normal">
        <span className="nb-bar" aria-hidden="true" />{eyebrow}
      </p>
    )}
    <H className="mt-3 text-3xl font-extrabold leading-[1.2] tracking-[-0.02em] [text-wrap:balance] rtl:tracking-normal sm:text-4xl">
      <AccentTitle text={title} />
    </H>
    {subtitle && <p className="nb-muted mt-2 text-base font-medium sm:text-lg">{subtitle}</p>}
  </header>
));

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navType]);
};

const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };
const dateFmtCache = {};
const formatDate = (iso, language) => {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return null;
  const loc = LOCALES[language] || 'en-GB';
  dateFmtCache[loc] ||= new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' });
  return dateFmtCache[loc].format(d);
};

const NUMBER_LOCALE = { en: 'en', fr: 'fr', ar: 'ar-EG' };
const padFormats = {};
const pad2 = (language, n) => {
  const locale = NUMBER_LOCALE[language] || 'en';
  const fmt = (padFormats[locale] ||= new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }));
  return fmt.format(n);
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
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));
const SK_CATEGORIES = [0, 1, 2, 3, 4, 5];
const SK_SHOPS = [0, 1, 2, 3];

const STEP_DEFS = [
  { labelKey: 'describe', hintKey: 'describeHint' },
  { labelKey: 'category', hintKey: 'pickCategoryHint' },
  { labelKey: 'shop', hintKey: 'chooseShopHint' },
  { labelKey: 'done', hintKey: 'sendRequestHint' },
];

const STEP_HEAD = [
  { title: 'describeProblem', subtitle: 'specificHelp', infoTitle: 'detailsTitle', infoBody: 'detailsBody', icon: FiFileText, tone: 'am' },
  { title: 'deviceType', subtitle: 'categorySubtitle', infoTitle: 'categoryTitle', infoBody: 'categoryBody', icon: FiSmartphone, tone: 'sky' },
  { title: 'chooseShopTitle', subtitle: 'chooseShopSubtitle', infoTitle: 'shopTitle', infoBody: 'shopBody', icon: RiStoreLine, tone: 'vi' },
  { title: 'doneTitle', subtitle: 'doneBody', infoTitle: 'doneTitle', infoBody: 'doneBody', icon: FiCheckCircle, tone: 'em' },
];

const INFO_SCENES = ['repairCard', 'devices', 'shop', 'track'];

const STATUS_JOURNEY = [
  { key: 'SUBMITTED', labelKey: 'submitted', descKey: 'submittedDesc', Icon: FiFileText, tone: 'sky' },
  { key: 'QUOTE_SENT', labelKey: 'setPrice', descKey: 'setPriceDesc', Icon: FiTag, tone: 'vi' },
  { key: 'QUOTE_APPROVED', labelKey: 'priceAccepted', descKey: 'priceAcceptedDesc', Icon: FiCheckCircle, tone: 'te' },
  { key: 'QUOTE_REJECTED', labelKey: 'priceRejected', descKey: 'priceRejectedDesc', Icon: FiXCircle, tone: 'ro', danger: true },
  { key: 'DEVICE_COLLECTED', labelKey: 'devicePickedUp', descKey: 'devicePickedUpDesc', Icon: FiPackage, tone: 'am' },
  { key: 'REPAIRING', labelKey: 'repairing', descKey: 'repairingDesc', Icon: FiTool, tone: 'vi' },
  { key: 'REPAIR_COMPLETED', labelKey: 'repairCompleted', descKey: 'repairCompletedDesc', Icon: FiShield, tone: 'te' },
  { key: 'DEVICE_DELIVERED', labelKey: 'deviceDelivered', descKey: 'deviceDeliveredDesc', Icon: FiTruck, tone: 'em' },
  { key: 'CANCELLED', labelKey: 'cancelled', descKey: 'cancelledDesc', Icon: FiSlash, tone: 'ro', danger: true },
];

const toList = (res) => {
  const raw = res?.data?.content || res?.data || [];
  return Array.isArray(raw) ? raw : [];
};
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
  <nav aria-label={t('breadcrumb')} className="nb-muted flex flex-wrap items-center gap-2 text-sm font-medium">
    <Link to="/" className="nb-focus rounded transition-colors hover:text-[color:var(--nb-ink)] hover:underline">{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    <span aria-current="page" className="text-[color:var(--nb-ink)]">{t('crumbRepair')}</span>
  </nav>
));

const Sk = ({ className = '' }) => <div aria-hidden="true" className={`nb-sk ${className}`} />;

const VerifiedMark = memo(({ label }) => (
  <span className="inline-flex flex-shrink-0" title={label}>
    <RiVerifiedBadgeLine aria-hidden="true" className="nb-ic h-4 w-4" />
    <span className="sr-only">{label}</span>
  </span>
));

const Meter = memo(({ pct }) => (
  <div className="nb-gray h-2 overflow-hidden rounded-full" aria-hidden="true">
    <div
      className="h-full w-full origin-left rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-transform duration-500 ease-out rtl:origin-right rtl:bg-gradient-to-l motion-reduce:transition-none"
      style={{ transform: `scaleX(${pct / 100})` }}
    />
  </div>
));

const ProgressSteps = memo(({ step, t }) => {
  const total = STEP_DEFS.length;
  return (
    <div className="nb-card p-4 sm:p-5">
      <p className="sr-only">{t('step')} {step} {t('of')} {total}</p>
      <ol aria-label={t('progress')} className="grid grid-cols-4 gap-2">
        {STEP_DEFS.map(({ labelKey, hintKey }, i) => {
          const n = i + 1;
          const reached = step >= n;
          const active = step === n;
          return (
            <li key={labelKey} aria-current={active ? 'step' : undefined} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold tabular-nums transition-[background-color,box-shadow,transform] duration-300 motion-reduce:transition-none ${
                  reached ? 'bg-[color:var(--nb-btn)] text-[color:var(--nb-on)]' : 'nb-gray'
                } ${active ? 'scale-110 ring-4 ring-emerald-500/25' : ''}`}
              >
                {step > n ? <FiCheck aria-hidden="true" className="h-5 w-5" strokeWidth={3} /> : <span dir="ltr">{pad2('en', n)}</span>}
              </span>
              <div className="min-w-0 max-w-full px-0.5">
                <p className={`truncate text-[11px] font-extrabold transition-colors duration-300 sm:text-xs ${reached ? '' : 'nb-muted'}`}>{t(labelKey)}</p>
                <p className="nb-muted mt-0.5 hidden truncate text-[11px] font-medium sm:block">{t(hintKey)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-4">
        <Meter pct={(step / total) * 100} />
      </div>
    </div>
  );
});

const NavButtons = memo(({ onBack, onNext, nextLabel, nextDisabled, isLoading, showBack = true, t }) => (
  <div className={`nb-line mt-8 flex flex-wrap gap-3 border-t pt-5 ${showBack ? 'justify-between' : 'justify-end'}`}>
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
    <Sk className="h-[4.5rem] w-full !rounded-xl sm:h-20" />
    <Sk className="h-4 w-2/3" />
  </div>
));

const ShopSkeleton = memo(() => (
  <div className="nb-card flex h-44 flex-col gap-3 p-4">
    <div className="flex items-start gap-3">
      <Sk className="h-10 w-10 flex-none !rounded-full" />
      <div className="min-w-0 flex-1 space-y-2"><Sk className="h-4 w-3/4" /><Sk className="h-3 w-1/4" /></div>
      <Sk className="h-9 w-9 flex-none !rounded-full" />
    </div>
    <Sk className="h-3 w-2/3" />
    <Sk className="mt-auto h-4 w-1/3" />
  </div>
));

const CategoriesSkeleton = memo(({ label }) => (
  <div className="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 sm:gap-5" role="status" aria-busy="true" aria-label={label}>
    {SK_CATEGORIES.map((i) => <CategorySkeleton key={i} />)}
  </div>
));

const ShopsSkeleton = memo(({ label }) => (
  <div className="grid grid-cols-1 gap-5 p-1 sm:grid-cols-2 sm:gap-6" role="status" aria-busy="true" aria-label={label}>
    {SK_SHOPS.map((i) => <ShopSkeleton key={i} />)}
  </div>
));

const StateBox = memo(({ darkMode, label, onRetry, retryLabel }) => (
  <div className="nb-dot nb-in flex flex-col items-center px-4 py-10 text-center">
    <IsoIllustration type="shop" tone="emerald" onGreen={false} darkMode={darkMode} className="mb-3 h-32 w-32" />
    <p className="text-base font-extrabold">{label}</p>
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
    <nav aria-label={t('pagination')} aria-busy={pending} className="flex flex-wrap items-center justify-center gap-2 pt-8">
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
      ) : <span key={x} aria-hidden="true" className="nb-muted px-1 font-extrabold">…</span>))}
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
          maxLength={MAX_DESC} placeholder={t('issuePlaceholder')} aria-required="true" autoComplete="off"
          aria-invalid={blank} aria-describedby={blank ? 'repair-description-error' : undefined}
          className="min-h-[170px] w-full resize-none bg-transparent px-4 py-4 text-base font-semibold outline-none placeholder:font-medium placeholder:opacity-60 sm:min-h-[200px] sm:px-5 sm:text-sm"
        />
        <div className="nb-line nb-muted flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs font-bold sm:px-5">
          <span className="min-w-0 truncate">{t('tip')}</span>
          <span dir="ltr" className={`flex-shrink-0 tabular-nums transition-colors ${value.length > 900 ? 'text-orange-500' : ''}`}>{value.length} / {MAX_DESC}</span>
        </div>
      </div>
      {blank && (
        <p id="repair-description-error" role="alert" className="nb-in mt-3 flex items-center gap-1.5 text-sm font-bold text-rose-500">
          <FiXCircle aria-hidden="true" className="h-4 w-4 flex-shrink-0" />{t('descBlank')}
        </p>
      )}
      <div role="group" aria-label={t('suggestions')} className="mt-5 flex flex-wrap gap-2.5">
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
      <span className="nb-gray flex w-full items-center justify-center rounded-xl py-2">
        <IsoIllustration type={catKey} darkMode={darkMode} onGreen={false} className="h-14 w-14 sm:h-16 sm:w-16" />
      </span>
      <span className="line-clamp-1 w-full text-sm font-extrabold">{cat.name}</span>
      {active && (
        <span aria-hidden="true" className="hp-pop absolute end-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--nb-btn)] text-[color:var(--nb-on)]">
          <FiCheck className="h-3.5 w-3.5" strokeWidth={3} />
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
      className={`nb-card nb-focus relative flex h-full flex-col gap-3 p-4 ${mode} ${active ? 'nb-pick' : ''}`}
    >
      <div className="flex items-start gap-3">
        <IconTile Icon={RiStoreLine} tone={active ? 'em' : 'vi'} className="h-10 w-10" iconClassName="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-extrabold leading-snug">
            <span className="line-clamp-2 min-w-0">{shop.name}</span>
            {shop.verified && <VerifiedMark label={t('verifiedLabel')} />}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs font-extrabold">
            <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
            <span dir="ltr" className="tabular-nums">{shop.rating ? shop.rating.toFixed(1) : t('newRating')}</span>
          </p>
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
      <div className="nb-line mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs font-extrabold">
        <span className="nb-muted flex min-w-0 items-center gap-1.5"><span className="truncate">{shop.shopType || t('generalType')}</span></span>
        {active ? (
          <span className="nb-ic flex flex-shrink-0 items-center gap-1"><FiCheck aria-hidden="true" className="h-4 w-4" strokeWidth={3} />{t('selected')}</span>
        ) : !shop.activate ? (
          <span className="flex-shrink-0">{t('inactive')}</span>
        ) : null}
      </div>
    </div>
  );
});

const ShopDetailModal = memo(({ shop, language, onClose, t }) => {
  const [leaving, requestClose] = useLeave(onClose);
  useModalLock(true, requestClose);
  const rows = [
    { Icon: FiMail, tone: 'sky', label: t('email'), value: shop.email },
    { Icon: FiPhone, tone: 'vi', label: t('phone'), value: shop.phone, ltr: true },
    { Icon: RiStoreLine, tone: 'em', label: t('type'), value: shop.shopType },
    { Icon: FiMapPin, tone: 'ro', label: t('address'), value: shopAddressLine(shop, true) },
    { Icon: FiCalendar, tone: 'am', label: t('joined'), value: formatDate(shop.createdAt, language) },
  ].filter((r) => r.value);
  const tel = telHref(shop.phone);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name}>
      <div className={`${leaving ? 'hp-fade-out' : 'hp-fade'} absolute inset-0 bg-[color:var(--nb-scrim)] backdrop-blur-[2px]`} onClick={requestClose} aria-hidden="true" />
      <div className={`nb-card ${leaving ? 'hp-modal-out' : 'hp-modal'} relative flex max-h-[92vh] w-full flex-col overflow-hidden !rounded-b-none shadow-2xl sm:max-w-md sm:!rounded-3xl`}>
        <header className="nb-gray nb-line flex flex-shrink-0 items-center gap-3 border-b px-4 py-3.5 sm:px-5">
          <IconTile Icon={RiStoreLine} tone="vi" className="h-10 w-10" iconClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1.5 text-base font-extrabold">
              <span className="truncate">{shop.name}</span>
              {shop.verified && <VerifiedMark label={t('verifiedLabel')} />}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-extrabold">
              <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
              <span dir="ltr" className="tabular-nums">{shop.rating ? shop.rating.toFixed(1) : t('newRating')}</span>
            </p>
          </div>
          <button type="button" onClick={requestClose} aria-label={t('close') || 'Close'} className="nb-btn h-9 w-9 flex-shrink-0">
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {shop.description && <p className="text-sm font-medium leading-relaxed opacity-90">{shop.description}</p>}
          <ul className="space-y-2.5">
            {rows.map(({ Icon, tone, label, value, ltr }) => (
              <li key={label} className="nb-gray flex items-center gap-3 rounded-2xl p-3">
                <IconTile Icon={Icon} tone={tone} className="h-9 w-9" iconClassName="h-4 w-4" />
                <div className="min-w-0">
                  <p className="nb-muted text-[11px] font-extrabold">{label}</p>
                  <p className="truncate text-sm font-bold" dir={ltr ? 'ltr' : undefined}>{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {tel && (
          <footer className="nb-line flex-shrink-0 border-t px-4 py-3.5 sm:px-5">
            <a href={tel} className={`${btnCls(true)} w-full`}><FiPhone aria-hidden="true" className="h-4 w-4" />{t('phone')}</a>
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
      <div className="nb-gray nb-line border-b p-4">
        <IsoIllustration type={INFO_SCENES[step - 1]} tone="emerald" onGreen={false} darkMode={darkMode} className="mx-auto h-40 w-40" />
      </div>
      <div className="p-5">
        <h3 className="flex items-center gap-2.5 text-base font-extrabold">
          <IconTile Icon={head.icon} tone={head.tone} className="h-8 w-8" iconClassName="h-4 w-4" />
          <span className="min-w-0">{t(head.infoTitle)}</span>
        </h3>
        <p className="nb-muted mt-3 text-sm font-medium leading-relaxed">{t(head.infoBody)}</p>
      </div>
    </div>
  );
});

const SummaryPanel = memo(({ category, shop, t }) => {
  const rows = [
    [t('category'), category?.name, FiSmartphone, 'sky'],
    [t('shop'), shop?.name, RiStoreLine, 'vi'],
  ];
  return (
    <div className="nb-card p-5">
      <h3 className="text-base font-extrabold">{t('yourRequest')}</h3>
      <dl className="mt-4 space-y-2.5">
        {rows.map(([label, value, Icon, tone]) => (
          <div key={label} className="nb-gray flex items-center gap-3 rounded-2xl p-3">
            <IconTile Icon={Icon} tone={tone} className="h-9 w-9" iconClassName="h-4 w-4" />
            <div className="min-w-0">
              <dt className="nb-muted text-[11px] font-extrabold">{label}</dt>
              <dd className={`mt-0.5 truncate text-sm font-bold ${value ? '' : 'nb-muted'}`}>{value || t('notSelected')}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
});

const JourneySection = memo(({ language, t }) => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-8 sm:mb-10">
      <SectionHead eyebrow={t('step')} title={t('repairJourney')} subtitle={t('journeySub')} />
    </div>
    <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {STATUS_JOURNEY.map(({ key, labelKey, descKey, Icon, tone, danger }, i) => (
        <li key={key} style={STAGGER[Math.min(i, 11)]} className="nb-in nb-card nb-lift flex min-w-0 flex-col gap-3 p-5">
          <div className="flex items-center gap-3">
            <IconTile Icon={Icon} tone={tone} className="h-11 w-11" iconClassName="h-5 w-5" />
            <span aria-hidden="true" className={`ms-auto text-2xl font-extrabold tabular-nums ${danger ? 'text-rose-500' : 'nb-ic'}`}>{pad2(language, i + 1)}</span>
          </div>
          <p className="text-base font-extrabold">{t(labelKey)}</p>
          <p className="nb-muted text-sm font-medium leading-relaxed">{t(descKey)}</p>
        </li>
      ))}
    </ol>
  </div>
));

const RepairRequestContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useCallback((key) => tr(language, key), [language]);
  const isAr = language === 'ar';
  const token = useAuthGuard();
  useScrollTopOnEnter();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const stepRef = useRef(1);
  stepRef.current = step;
  const descRef = useRef('');
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

  useEffect(() => { document.title = 'Book Repair | Tech-Restore'; }, []);

  const onDescChange = useCallback((v) => {
    descRef.current = v;
    const has = !!v.trim();
    setHasDesc((p) => (p === has ? p : has));
  }, []);

  const categoriesQ = useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => toList(await api.get('/api/categories', { headers: authHeaders(), signal })).filter((c) => c && c.id != null).map(normalizeCategory),
    enabled: !!token && (idle || step >= 2),
    staleTime: 5 * 60 * 1000,
  });

  const shopsQ = useQuery({
    queryKey: ['repairShops'],
    queryFn: async ({ signal }) =>
      toList(await api.get('/api/users/shops/all', { headers: authHeaders(), signal }))
        .filter((s) => s && s.id != null)
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
      setDir(1);
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

  const goTo = useCallback((n) => startTransition(() => {
    setDir(n > stepRef.current ? 1 : -1);
    setStep(n);
  }), []);
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
    setDir(-1);
    setStep(1); setCategory(null); setShop(null); setSubmittedShop(null); setCategoryPage(1); setShopPage(1); setInfoShop(null); submit.reset();
  }, [submit]);

  const openInfo = useCallback((s) => setInfoShop(s), []);
  const closeInfo = useCallback(() => setInfoShop(null), []);
  const changeCatPage = useCallback((p) => startTransition(() => setCategoryPage(p)), []);
  const changeShopPage = useCallback((p) => startTransition(() => setShopPage(p)), []);

  const head = STEP_HEAD[step - 1];
  const stepStyle = useMemo(() => ({ '--dir': dir }), [dir]);

  return (
    <div
      dir={languageDirection(language)}
      lang={language}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-clip [--dx:1] rtl:[--dx:-1] ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <Device3DStyles />
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-32 sm:px-6 lg:px-8">
     

        <section aria-label={t('pageTitle')}>
          <div id="repair-form" className="mb-6 scroll-mt-28 sm:mb-8">
            <div key={step} className="hp-step" style={stepStyle}>
              <SectionHead
                eyebrow={`${t('step')} ${step} ${t('of')} ${STEP_DEFS.length}`}
                title={t(head.title)}
                subtitle={t(head.subtitle)}
              />
            </div>
          </div>

          <div className="hp-rise mb-6 sm:mb-8" style={STAGGER[1]}>
            <ProgressSteps step={step} t={t} />
          </div>

          <div className="hp-rise grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8" style={STAGGER[2]}>
            <div aria-busy={isPending} className={`nb-card p-4 transition-opacity duration-200 sm:p-6 ${isPending ? 'opacity-70' : ''}`}>
              <div key={step} className="hp-step" style={stepStyle}>
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
                        <div role="group" aria-label={t('deviceType')} className="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 sm:gap-5">
                          {pagedCategories.map((c, i) => (
                            <div key={c.id} className="hp-rise relative min-w-0" style={STAGGER[i]}>
                              <CategoryTile cat={c} active={category?.id === c.id} onSelect={setCategory} darkMode={darkMode} />
                            </div>
                          ))}
                        </div>
                        <Pager page={safeCatPage} totalPages={categoryPages} onChange={changeCatPage} pending={isPending} t={t} />
                        {!category && <p role="status" className="nb-muted mt-6 text-sm font-bold">{t('selectCategoryPrompt')}</p>}
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
                        <div role="radiogroup" aria-label={t('chooseShopTitle')} className="grid grid-cols-1 gap-5 p-1 sm:grid-cols-2 sm:gap-6">
                          {pagedShops.map((s, i) => (
                            <div key={s.id} className="hp-rise flex min-w-0 flex-col" style={STAGGER[i]}>
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
                    <IsoIllustration type="marketplace" tone="emerald" onGreen={false} darkMode={darkMode} className="h-40 w-40" />
                    <span className="hp-pop -mt-2 inline-flex"><IconTile Icon={FiCheck} tone="em" className="h-14 w-14" iconClassName="h-7 w-7" /></span>
                    <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl"><AccentTitle text={t('requestSent')} /></h2>
                    <p className="nb-muted mt-4 text-sm font-medium">{t('requestSentTo')}</p>
                    <p className="mt-1 text-lg font-extrabold">{submittedShop?.name || t('defaultShopName')}</p>
                    <p className="nb-muted text-sm font-medium">
                      {submittedShop?.shopAddress?.city || t('defaultCity')}{submittedShop?.shopAddress?.state ? `, ${submittedShop.shopAddress.state}` : ''}
                    </p>
                    <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
                      <button type="button" onClick={reset} className={`${btnCls(false)} flex-1`}>{t('newRequest')}</button>
                      <button type="button" onClick={toAccount} className={`${btnCls(true)} flex-1`}>
                        {t('viewMyRequests')}<FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="hidden space-y-5 lg:sticky lg:top-28 lg:block">
              <InfoPanel step={step} darkMode={darkMode} t={t} />
              <SummaryPanel category={category} shop={shop} t={t} />
            </aside>
          </div>
        </section>
      </main>

      <section ref={journeyRef} aria-label={t('repairJourney')} className={`py-12 sm:py-16 ${LAZY_SECTION}`} style={journeyNear ? undefined : { minHeight: 640 }}>
        {journeyNear && <JourneySection language={language} t={t} />}
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