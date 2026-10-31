import React, {
  useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo, useTransition,
} from 'react';
import { useNavigate, useNavigationType, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiTool, FiInfo, FiX, FiMail, FiPhone, FiCalendar, FiMapPin, FiCheck, FiCheckCircle, FiFileText,
  FiTag, FiXCircle, FiPackage, FiTruck, FiSlash, FiShield, FiChevronLeft, FiChevronRight, FiArrowRight,
  FiRefreshCw,
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
    prevSlide: 'Previous slide', nextSlide: 'Next slide', goToSlide: 'Go to slide', loading: 'Loading',
    s1: 'Screen cracked', s2: 'Battery issue', s3: 'Not charging', s4: 'Overheating', s5: 'Software crash', s6: 'Water damage',
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
    prevSlide: 'الشريحة السابقة', nextSlide: 'الشريحة التالية', goToSlide: 'اذهب إلى الشريحة', loading: 'جارٍ التحميل',
    s1: 'الشاشة مكسورة', s2: 'مشكلة في البطارية', s3: 'لا يشحن', s4: 'ارتفاع الحرارة', s5: 'تعطل البرنامج', s6: 'تلف بالماء',
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
    prevSlide: 'Diapositive précédente', nextSlide: 'Diapositive suivante', goToSlide: 'Aller à la diapositive', loading: 'Chargement',
    s1: 'Écran cassé', s2: 'Problème de batterie', s3: 'Ne charge pas', s4: 'Surchauffe', s5: 'Plantage logiciel', s6: 'Dégât des eaux',
  },
};

const tr = (language, key) =>
  REPAIR_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  REPAIR_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

const PAGE_CSS = `
  .hp-hl, .hp-hl-dark, .hp-hl-on {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-size: 100% 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .hp-hl      { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-on   { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23facc15' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  @keyframes hpFloat { 0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); } 50% { transform: translateY(-14px) rotate(var(--r, 0deg)); } }
  .hp-float { animation: hpFloat 6s ease-in-out infinite; will-change: transform; }
  @keyframes hpDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(18px, -22px); } }
  .hp-drift { animation: hpDrift 11s ease-in-out infinite; }
  @keyframes hpRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .hp-rise { animation: hpRise 0.28s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i, 0) * 28ms); }
  @keyframes hpStep { from { opacity: 0; transform: translateX(calc(var(--dx, 1) * 14px)); } to { opacity: 1; transform: none; } }
  .hp-step { animation: hpStep 0.2s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes hpFade { from { opacity: 0; } to { opacity: 1; } }
  .hp-fade { animation: hpFade 0.16s ease-out both; }
  @keyframes hpModal { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: none; } }
  .hp-modal { animation: hpModal 0.2s cubic-bezier(.2,.8,.2,1) both; }
  .hp-pattern {
    --p1: rgba(4, 38, 26, .13);
    --p2: rgba(16, 185, 129, .12);
    background-image:
      radial-gradient(circle at 2px 2px, var(--p1) 1.6px, transparent 1.8px),
      repeating-linear-gradient(135deg, var(--p2) 0 2px, transparent 2px 18px);
    background-size: 22px 22px, auto;
  }
  .hp-pattern-dark { --p1: rgba(57, 255, 136, .14); --p2: rgba(57, 255, 136, .06); }
  .hp-cat { --dx: 1; --c-card: #ffffff; --c-ink: #04261a; --c-line: #04261a; --c-acc: #10b981; --c-on: #04261a; }
  [dir="rtl"] .hp-cat { --dx: -1; }
  .hp-cat-dark { --c-card: #2a2a2a; --c-ink: #ffffff; --c-line: #000000; --c-acc: #39ff88; --c-on: #022c22; }
  .hp-dot {
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    background: var(--c-card); color: var(--c-ink); cursor: pointer;
    border: 3px solid var(--c-line); border-radius: 1rem;
    box-shadow: calc(var(--dx) * 5px) 5px 0 0 var(--c-line);
    transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease, color .15s ease;
  }
  .hp-dot-on { background: var(--c-acc); color: var(--c-on); transform: translateY(-2px); box-shadow: calc(var(--dx) * 7px) 7px 0 0 var(--c-line); }
  @media (hover: hover) {
    .hp-dot:hover {
      background: var(--c-acc); color: var(--c-on);
      transform: translateY(-4px);
      box-shadow: calc(var(--dx) * 7px) 9px 0 0 var(--c-line);
    }
  }
  .hp-dot:active { transform: translateY(2px); box-shadow: calc(var(--dx) * 2px) 2px 0 0 var(--c-line); }
  .hp-dot:focus-visible { outline: 3px solid var(--c-acc); outline-offset: 4px; }
  .hs-root { contain: paint; }
  .hs-slide {
    opacity: 0; visibility: hidden; will-change: opacity;
    transition: opacity .38s cubic-bezier(.4,0,.2,1), visibility 0s linear .38s;
  }
  .hs-on { opacity: 1; visibility: visible; transition: opacity .38s cubic-bezier(.4,0,.2,1), visibility 0s; }
  .hs-bg { background: linear-gradient(135deg, var(--tb) 0%, var(--tc) 100%); }
  .hs-dots { background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.14) 1px, transparent 1.4px); background-size: 18px 18px; }
  /* Radial gradient instead of filter: blur(80px) - same soft glow, far cheaper to paint. */
  .hs-blob { background: radial-gradient(closest-side, var(--ta) 0%, transparent 100%); opacity: .3; will-change: transform; }
  /* Only the visible slide animates. */
  .hs-slide:not(.hs-on) .hp-float,
  .hs-slide:not(.hs-on) .hp-drift { animation-play-state: paused; }
  .hs-a { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity .2s ease, transform .2s ease; }
  .hs-on .hs-a {
    opacity: 1; transform: none;
    transition: opacity .4s ease calc(var(--d, 0) * 50ms + 60ms), transform .55s cubic-bezier(.16,1,.3,1) calc(var(--d, 0) * 50ms + 60ms);
  }
  .hs-v { opacity: 0; transform: translate3d(0, 10px, 0) scale(.9) rotate(-3deg); transition: opacity .2s ease, transform .2s ease; }
  .hs-on .hs-v { opacity: 1; transform: none; transition: opacity .45s ease .08s, transform .7s cubic-bezier(.16,1,.3,1) .08s; }
  .hs-bar { transform: scaleX(0); animation: hsBar linear forwards; }
  @keyframes hsBar { to { transform: scaleX(1); } }
  @media (prefers-reduced-motion: reduce) {
    .hp-rise, .hp-step, .hp-fade, .hp-modal, .hp-float, .hp-drift { animation: none; }
    .hp-dot { transition: none; }
    .hp-dot:hover, .hp-dot:active, .hp-dot-on { transform: none; }
    .hs-a, .hs-v, .hs-on .hs-a, .hs-on .hs-v { transform: none; transition: opacity .2s ease; }
    .hs-bar { animation: none; transform: scaleX(1); }
  }
`;
let stylesInjected = false;
const injectStylesOnce = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-repair-styles', 'true');
  tag.textContent = PAGE_CSS;
  document.head.appendChild(tag);
  stylesInjected = true;
};
injectStylesOnce();

const DARK_PAGE = 'bg-[#141414]';
const LAZY_SECTION = '[content-visibility:auto] [contain-intrinsic-size:auto_760px]';

const NEO_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#022c22] [--sh:#022c22] [--acc:#34d399]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#39ff88]',
};
const NEO_SURFACE = { light: 'bg-white', dark: 'bg-[#2a2a2a]' };
const NEO_BOX = {
  lg: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]',
  sm: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--sh)]',
};
const NEO_PRESS =
  'transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  '[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*8px)_10px_0_0_var(--sh)] ' +
  'active:translate-y-[2px] active:translate-x-[calc(var(--dx)*2px)] active:[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[color:var(--acc)]';
const neoCard = (darkMode, size = 'lg', press = false) => {
  const k = darkMode ? 'dark' : 'light';
  return `${NEO_THEME[k]} ${NEO_BOX[size]} ${NEO_SURFACE[k]}${press ? ` ${NEO_PRESS}` : ''}`;
};

const NEO_ICON =
  'inline-flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoIcon = (darkMode) => `${NEO_THEME[darkMode ? 'dark' : 'light']} ${NEO_ICON}`;

const NEO_BTN =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoBtn = (darkMode, active) => {
  const k = darkMode ? 'dark' : 'light';
  const tone = active ? 'bg-[color:var(--acc)] text-emerald-950' : `${NEO_SURFACE[k]} ${darkMode ? 'text-white' : 'text-emerald-950'}`;
  return `${NEO_THEME[k]} ${NEO_BTN} ${tone}`;
};
const SMALL_BTN = '!min-h-9 !px-3 !py-1 !text-xs !normal-case';

const NEO_ROW = 'rounded-xl border-2 border-dotted border-[color:var(--ink)]';

const HERO_BTN =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-black px-5 py-3 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*5px)_5px_0_0_#000] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  '[@media(hover:hover)]:hover:-translate-y-0.5 active:translate-y-[5px] active:translate-x-[calc(var(--dx)*5px)] active:[box-shadow:0_0_0_0_#000] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white';
const HERO_ARROW =
  'inline-flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-[3px] border-black bg-white text-black ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_#000] transition-[transform,box-shadow] duration-100 motion-reduce:transition-none ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_#000] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white';
const HERO_H = 'h-[max(42rem,88svh)] lg:h-[max(46rem,94svh)]';
const HERO_MS = 6000;
const SWIPE_PX = 48;
const DELAY = Array.from({ length: 8 }, (_, i) => ({ '--d': i }));

/*
 * Each theme carries a `hue` - the CSS hue-rotate (in degrees) that shifts the
 * illustration's base green (#39ff88, hue ~146deg) to the theme's accent colour.
 * It is precomputed here, so no per-render colour maths is needed.
 */
const THEMES = [
  { a: '#34d399', b: '#04261a', c: '#0b4a35', ink: '#022c22', hue: 0 },    // emerald (native colour)
  { a: '#fbbf24', b: '#2a1403', c: '#6b3b06', ink: '#422006', hue: -103 }, // amber
  { a: '#a78bfa', b: '#150f3a', c: '#33277d', ink: '#1e1b4b', hue: 109 },  // violet
  { a: '#38bdf8', b: '#06263d', c: '#0c4c75', ink: '#082f49', hue: 53 },   // sky
];
const themeVars = (th) => ({ '--ta': th.a, '--tb': th.b, '--tc': th.c, '--ti': th.ink });

// Static per-theme style objects (stable references, so memoised slides never re-render because of them).
const ILLUSTRATION_STYLES = THEMES.map((th) => ({
  filter: `${th.hue ? `hue-rotate(${th.hue}deg) ` : ''}drop-shadow(0 18px 30px rgba(0,0,0,0.35))`,
}));

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

const SectionTitle = memo(({ label, title, subtitle, darkMode, isAr, level: H = 'h2' }) => {
  const parts = useMemo(() => splitHeading(title), [title]);
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const bar = darkMode ? 'border-[#39ff88] bg-[#39ff88]' : 'border-emerald-950 bg-emerald-400';
  const sub = darkMode ? 'text-neutral-300' : 'text-gray-800';
  return (
    <div className="min-w-0 max-w-3xl">
      {label && (
        <div className="mb-5 flex items-center gap-3">
          <span aria-hidden="true" className={`h-3.5 w-12 rounded-full border-2 ${bar}`} />
          <span className={`text-sm font-bold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${ink}`}>{label}</span>
        </div>
      )}
      <H
        className={`text-3xl font-extrabold [text-wrap:balance] sm:text-5xl ${
          isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.18] tracking-[-0.04em]'
        } ${ink}`}
      >
        {parts.map(({ part, hl }, i) => (hl ? <span key={i} className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{part}</span> : part))}
      </H>
      {subtitle && (
        <p className={`mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${sub}`}>{subtitle}</p>
      )}
    </div>
  );
});

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

const STEP_DEFS = [
  { labelKey: 'describe', hintKey: 'describeHint' },
  { labelKey: 'category', hintKey: 'pickCategoryHint' },
  { labelKey: 'shop', hintKey: 'chooseShopHint' },
  { labelKey: 'done', hintKey: 'sendRequestHint' },
];

const STEP_HEAD = [
  { title: 'describeProblem', subtitle: 'specificHelp', infoTitle: 'detailsTitle', infoBody: 'detailsBody' },
  { title: 'deviceType', subtitle: 'categorySubtitle', infoTitle: 'categoryTitle', infoBody: 'categoryBody' },
  { title: 'chooseShopTitle', subtitle: 'chooseShopSubtitle', infoTitle: 'shopTitle', infoBody: 'shopBody' },
  { title: 'doneTitle', subtitle: 'doneBody', infoTitle: 'doneTitle', infoBody: 'doneBody' },
];

const INFO_SCENES = ['repairCard', 'devices', 'shop', 'track'];

const HERO_SLIDES = INFO_SCENES.map((scene, i) => ({ key: scene, scene, i, theme: THEMES[i % THEMES.length], illoStyle: ILLUSTRATION_STYLES[i % THEMES.length] }));

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
  <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-2 text-sm font-bold text-white/80">
    <Link to="/" className="underline decoration-[color:var(--ta)] decoration-2 underline-offset-4 hover:no-underline">{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    <span aria-current="page" className="text-white">{t('crumbRepair')}</span>
  </nav>
));

const HeroSlider = memo(({ slides, loading, language, label, crumbs, renderSlide, t }) => {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const rootRef = useRef(null);
  const startX = useRef(null);
  const isRTL = languageDirection(language) === 'rtl';
  const count = slides.length;
  const safe = count ? Math.min(index, count - 1) : 0;
  const paused = hover || !inView || !tabVisible;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, count]);

  useEffect(() => {
    const on = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  const go = useCallback((i) => setIndex(i), []);
  const step = useCallback((d) => setIndex((i) => (count ? (i + d + count) % count : 0)), [count]);
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);
  const onPointerDown = useCallback((e) => { startX.current = e.clientX; }, []);
  const onPointerUp = useCallback((e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    step((isRTL ? dx > 0 : dx < 0) ? 1 : -1);
  }, [isRTL, step]);
  const onPointerCancel = useCallback(() => { startX.current = null; }, []);
  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(isRTL ? -1 : 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(isRTL ? 1 : -1); }
  }, [isRTL, step]);
  const pause = useCallback(() => setHover(true), []);
  const resume = useCallback(() => setHover(false), []);
  const onFocus = useCallback((e) => { if (e.target.matches?.(':focus-visible')) setHover(true); }, []);

  if (loading || !count) {
    return (
      <div className={`relative overflow-hidden bg-[#04261a] ${HERO_H}`} role="status" aria-label={t('loading')}>
        <div className="mx-auto grid h-full max-w-7xl items-center gap-10 px-4 pt-44 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-5">
            <div className="h-7 w-40 animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none" />
            <div className="h-16 w-full max-w-xl animate-pulse rounded-xl bg-white/10 motion-reduce:animate-none" />
            <div className="h-5 w-full max-w-md animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
            <div className="h-12 w-44 animate-pulse rounded-xl bg-white/10 motion-reduce:animate-none" />
          </div>
          <div className="hidden h-[26rem] animate-pulse rounded-[2rem] bg-white/10 motion-reduce:animate-none lg:block" />
        </div>
      </div>
    );
  }

  const active = slides[safe];

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel" aria-label={label}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onKeyDown={onKeyDown}
      onMouseEnter={pause} onMouseLeave={resume} onFocus={onFocus} onBlur={resume}
      className={`hs-root relative isolate touch-pan-y overflow-hidden text-white [--dx:1] rtl:[--dx:-1] ${HERO_H}`}
    >
      <div className="absolute inset-0" aria-live={paused ? 'polite' : 'off'}>
        {slides.map((s, i) => renderSlide(s, i === safe, i === 0))}
      </div>

      <div className="absolute inset-x-0 top-32 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" style={themeVars(active.theme)}>
        {crumbs}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20" style={themeVars(active.theme)}>
          <div className="mx-auto flex max-w-7xl items-end gap-4 px-4 pb-6 sm:px-6 lg:px-8">
            <div role="tablist" className="grid min-w-0 flex-1 gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
              {slides.map((s, i) => (
                <button
                  key={s.key} type="button" role="tab" aria-selected={i === safe} aria-label={`${t('goToSlide')} ${i + 1}`}
                  onClick={() => go(i)}
                  className="group min-w-0 rounded-md pt-3 text-start focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className="relative block h-1.5 overflow-hidden rounded-full bg-white/25">
                    {i < safe && <span className="absolute inset-0 rounded-full bg-white/70" />}
                    {i === safe && (
                      <span
                        key={safe}
                        onAnimationEnd={next}
                        className="hs-bar absolute inset-0 origin-left rounded-full bg-[color:var(--ta)] rtl:origin-right"
                        style={{ animationDuration: `${HERO_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                      />
                    )}
                  </span>
                  <span className={`mt-2 hidden truncate text-xs font-bold transition-colors duration-200 md:block ${i === safe ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>
                    {t(STEP_HEAD[s.i].infoTitle)}
                  </span>
                </button>
              ))}
            </div>
            <span dir="ltr" className="hidden flex-shrink-0 pb-1 text-sm font-black tabular-nums text-white/80 sm:block">
              {pad2('en', safe + 1)} / {pad2('en', count)}
            </span>
            <div className="flex flex-shrink-0 gap-3 pb-1 pe-1">
              <button type="button" onClick={prev} aria-label={t('prevSlide')} className={HERO_ARROW}><FiChevronLeft aria-hidden="true" className="h-5 w-5 rtl:rotate-180" /></button>
              <button type="button" onClick={next} aria-label={t('nextSlide')} className={HERO_ARROW}><FiChevronRight aria-hidden="true" className="h-5 w-5 rtl:rotate-180" /></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

const RepairSlide = memo(({ slide, on, t, onStart }) => {
  const { i, scene, theme, illoStyle } = slide;
  const head = STEP_HEAD[i];
  const num = pad2('en', i + 1);

  // Mount the (SVG-heavy) illustration lazily: the first time its slide becomes active.
  // It then stays mounted so the cross-fade out of the slide is not cut short.
  const seen = useRef(on);
  if (on) seen.current = true;

  return (
    <div className={`hs-slide absolute inset-0 ${on ? 'hs-on' : ''}`} style={themeVars(theme)} role="group" aria-roledescription="slide" aria-hidden={!on}>
      <div className="hs-bg absolute inset-0" />
      <span aria-hidden="true" className="hs-blob hp-drift pointer-events-none absolute -end-24 top-10 h-[28rem] w-[28rem] rounded-full" />
      <span aria-hidden="true" className="hs-blob pointer-events-none absolute -bottom-40 -start-24 h-[24rem] w-[24rem] rounded-full" style={{ opacity: 0.18 }} />
      <div aria-hidden="true" className="hs-dots absolute inset-0" />
      <span
        aria-hidden="true" dir="ltr"
        className="pointer-events-none absolute -bottom-10 end-2 select-none text-[11rem] font-black leading-none text-[color:var(--ta)] opacity-[.09] sm:text-[22rem]"
      >
        {num}
      </span>

      <div className="relative mx-auto grid h-full max-w-7xl items-center gap-6 px-4 pb-36 pt-44 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:gap-12 lg:px-8 lg:pb-40 lg:pt-52">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="hs-a flex flex-wrap items-center gap-2" style={DELAY[0]}>
            <span className="inline-flex items-center gap-1.5 rounded-lg border-[3px] border-black bg-[color:var(--ta)] px-3 py-1 text-xs font-black uppercase text-[color:var(--ti)]">
              <FiTool aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{t('step')} </span><span dir="ltr" className="tabular-nums">{num}</span>
            </span>
            <span className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-lg border-2 border-white/30 px-3 py-1 text-xs font-bold text-white/90">
              <span className="truncate">{t(STEP_DEFS[i].hintKey)}</span>
            </span>
          </div>

          <h2
            className="hs-a mt-5 line-clamp-3 break-words text-4xl font-black leading-[1.08] tracking-[-0.03em] [text-wrap:balance] rtl:leading-[1.35] rtl:tracking-normal sm:text-6xl lg:text-7xl"
            style={DELAY[1]}
          >
            {t(head.infoTitle)}
          </h2>

          <p className="hs-a mt-5 line-clamp-3 max-w-xl text-base font-medium leading-relaxed text-white/80 sm:text-lg" style={DELAY[2]}>{t(head.infoBody)}</p>

          <div className="hs-a mt-8 flex flex-wrap gap-4 pb-1 pe-1" style={DELAY[3]}>
            <button type="button" onClick={onStart} tabIndex={on ? 0 : -1} className={`${HERO_BTN} bg-[color:var(--ta)] text-[color:var(--ti)]`}>
              {t('continue')}<FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="hs-v relative h-44 w-44 sm:h-64 sm:w-64 lg:h-[26rem] lg:w-[26rem]">
            <div className="hp-float h-full w-full [--r:0deg]">
              <div className="absolute inset-0 flex items-center justify-center">
                {seen.current && (
                  // hue-rotate recolours the illustration to this slide's theme accent
                  // (emerald / amber / violet / sky) without touching the illustration source.
                  <IsoIllustration
                    type={scene} tone="emerald" onGreen={false} darkMode
                    className="h-full w-full"
                    style={illoStyle}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const VerifiedMark = memo(({ label, darkMode }) => (
  <span className="inline-flex flex-shrink-0" title={label}>
    <RiVerifiedBadgeLine aria-hidden="true" className={`h-4 w-4 ${darkMode ? 'text-[#39ff88]' : 'text-emerald-600'}`} />
    <span className="sr-only">{label}</span>
  </span>
));

const ProgressSteps = memo(({ step, darkMode, t }) => {
  const total = STEP_DEFS.length;
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-400' : 'text-gray-600';
  return (
    <div className={`p-4 sm:p-5 ${neoCard(darkMode, 'sm')}`}>
      <p className="sr-only">{t('step')} {step} {t('of')} {total}</p>
      <ol aria-label={t('progress')} className="grid grid-cols-4 gap-2">
        {STEP_DEFS.map(({ labelKey, hintKey }, i) => {
          const n = i + 1;
          const reached = step >= n;
          const active = step === n;
          return (
            <li key={labelKey} aria-current={active ? 'step' : undefined} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl border-[3px] border-[color:var(--ink)] text-base font-black tabular-nums transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none ${
                  reached ? 'bg-[color:var(--acc)] text-emerald-950' : `${NEO_SURFACE[darkMode ? 'dark' : 'light']} ${ink}`
                } ${active ? '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]' : ''}`}
              >
                {step > n ? <FiCheck aria-hidden="true" className="h-5 w-5" strokeWidth={3} /> : <span dir="ltr">{pad2('en', n)}</span>}
              </span>
              <div className="min-w-0 max-w-full px-0.5">
                <p className={`truncate text-[11px] font-extrabold uppercase sm:text-xs ${reached ? ink : muted}`}>{t(labelKey)}</p>
                <p className={`mt-0.5 hidden truncate text-[11px] font-medium sm:block ${muted}`}>{t(hintKey)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div aria-hidden="true" className={`mt-4 h-2.5 overflow-hidden rounded-full border-2 border-[color:var(--ink)] ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-100'}`}>
        <div
          className="h-full origin-left rounded-full bg-[color:var(--acc)] transition-transform duration-300 ease-out rtl:origin-right motion-reduce:transition-none"
          style={{ transform: `scaleX(${step / total})` }}
        />
      </div>
    </div>
  );
});

const NavButtons = memo(({ onBack, onNext, nextLabel, nextDisabled, isLoading, showBack = true, darkMode, t }) => (
  <div className={`mt-8 flex flex-wrap gap-3 pb-1 pe-1 ${showBack ? 'justify-between' : 'justify-end'}`}>
    {showBack && (
      <button type="button" className={neoBtn(darkMode, false)} onClick={onBack} disabled={isLoading}>
        <FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />{t('back')}
      </button>
    )}
    <button type="button" className={`${neoBtn(darkMode, true)} flex-1 sm:flex-none sm:px-8`} onClick={onNext} disabled={nextDisabled || isLoading} aria-busy={isLoading}>
      {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />}
      <span>{isLoading ? t('sending') : nextLabel || t('continue')}</span>
      {!isLoading && <FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />}
    </button>
  </div>
));

const Skeletons = memo(({ count, className, itemClassName, darkMode }) => (
  <div className={className} role="status" aria-busy="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`animate-pulse rounded-2xl motion-reduce:animate-none ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70'} ${itemClassName}`} />
    ))}
  </div>
));

const StateBox = memo(({ darkMode, label, onRetry, retryLabel }) => (
  <div className={`flex flex-col items-center rounded-2xl border-[3px] border-dashed py-10 text-center ${darkMode ? 'border-[#39ff88]/40 bg-[#1e1e1e]' : 'border-emerald-300 bg-white/60'}`}>
    <IsoIllustration type="shop" tone="emerald" onGreen={false} darkMode={darkMode} className="mb-3 h-32 w-32" />
    <p className={`text-base font-extrabold uppercase ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{label}</p>
    {onRetry && (
      <button type="button" onClick={() => onRetry()} className={`mt-5 ${neoBtn(darkMode, true)}`}>
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

const Pager = memo(({ page, totalPages, onChange, pending, darkMode, t }) => {
  if (totalPages <= 1) return null;
  const arrow = `${neoBtn(darkMode, false)} !w-11 !px-0`;
  return (
    <nav aria-label={t('pagination')} aria-busy={pending} className="mt-8 flex flex-wrap items-center justify-center gap-3 pe-1">
      <button type="button" className={arrow} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </button>
      {pageWindow(page, totalPages).map((x) => (typeof x === 'number' ? (
        <button
          key={x} type="button" onClick={() => onChange(x)}
          aria-label={`${t('page')} ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`${neoBtn(darkMode, x === page)} !min-w-11 !px-2 tabular-nums`}
        >
          <span dir="ltr">{x}</span>
        </button>
      ) : <span key={x} aria-hidden="true" className={`px-1 font-extrabold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>…</span>))}
      <button type="button" className={arrow} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
        <FiChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
      </button>
    </nav>
  );
});

const DescribeStep = memo(({ initial, onChange, darkMode, t }) => {
  const [value, setValue] = useState(initial);
  const update = useCallback((v) => { setValue(v); onChange(v); }, [onChange]);
  const handleChange = useCallback((e) => update(e.target.value), [update]);
  const addSuggestion = useCallback(
    (s) => update((value ? `${value}, ${s.toLowerCase()}` : s).slice(0, MAX_DESC)),
    [update, value],
  );
  const blank = value.length > 0 && !value.trim();
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-400' : 'text-gray-600';
  return (
    <div className="max-w-3xl">
      <label htmlFor="repair-description" className="sr-only">{t('describeProblem')}</label>
      <div
        className={`overflow-hidden rounded-xl border-[3px] [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)] ${
          blank ? 'border-rose-500' : 'border-[color:var(--ink)]'
        } ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}
      >
        <textarea
          id="repair-description" value={value} onChange={handleChange}
          maxLength={MAX_DESC} placeholder={t('issuePlaceholder')} aria-required="true"
          aria-invalid={blank} aria-describedby={blank ? 'repair-description-error' : undefined}
          className={`min-h-[170px] w-full resize-none bg-transparent px-4 py-4 text-base font-medium outline-none placeholder:opacity-60 sm:min-h-[200px] sm:px-5 ${ink}`}
        />
        <div className={`flex items-center justify-between gap-3 border-t-2 border-[color:var(--ink)] px-4 py-2.5 text-xs font-bold sm:px-5 ${muted}`}>
          <span className="min-w-0 truncate">{t('tip')}</span>
          <span dir="ltr" className={`flex-shrink-0 tabular-nums ${value.length > 900 ? 'text-orange-500' : ''}`}>{value.length} / {MAX_DESC}</span>
        </div>
      </div>
      {blank && (
        <p id="repair-description-error" role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-bold text-rose-500">
          <FiXCircle aria-hidden="true" className="h-4 w-4 flex-shrink-0" />{t('descBlank')}
        </p>
      )}
      <div role="group" aria-label={t('suggestions')} className="mt-5 flex flex-wrap gap-3 pb-1 pe-1">
        {SUGGESTION_KEYS.map((k) => {
          const s = t(k);
          return <button key={k} type="button" onClick={() => addSuggestion(s)} className={`${neoBtn(darkMode, false)} ${SMALL_BTN}`}>+ {s}</button>;
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
      className={`hp-dot min-h-11 w-full p-3 pt-6 text-center sm:gap-2.5 sm:p-4 sm:pt-7 ${active ? 'hp-dot-on' : ''}`}
    >
      <IsoIllustration type={catKey} darkMode={darkMode} onGreen={false} className="h-14 w-14 sm:h-16 sm:w-16" />
      <span className="line-clamp-1 w-full text-sm font-extrabold uppercase">{cat.name}</span>
      {active && <FiCheck aria-hidden="true" className="absolute end-3 top-3 h-5 w-5" strokeWidth={3} />}
    </button>
  );
});

const ShopOption = memo(({ shop, active, onSelect, onInfo, darkMode, language, t }) => {
  const select = useCallback(() => { if (shop.activate) onSelect(shop); }, [shop, onSelect]);
  const info = useCallback((e) => { e.stopPropagation(); onInfo(shop); }, [onInfo, shop]);
  const address = shopAddressLine(shop, false);
  const k = darkMode ? 'dark' : 'light';
  const isAr = language === 'ar';
  const ink = active ? 'text-emerald-950' : darkMode ? 'text-white' : 'text-emerald-950';
  const body = active ? 'text-emerald-950' : darkMode ? 'text-neutral-300' : 'text-gray-700';
  const surface = active ? 'bg-[color:var(--acc)]' : NEO_SURFACE[k];
  const mode = shop.activate ? `cursor-pointer ${NEO_PRESS}` : 'cursor-not-allowed opacity-50 grayscale';
  return (
    <div
      role="radio" aria-checked={active} aria-disabled={!shop.activate} tabIndex={shop.activate ? 0 : -1}
      onClick={select}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); select(); } }}
      className={`relative h-full gap-3 p-4 ${NEO_THEME[k]} ${NEO_BOX.sm} ${surface} ${ink} ${mode}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className={`flex min-w-0 items-center gap-1.5 text-sm font-extrabold uppercase leading-snug ${isAr ? 'tracking-normal' : 'tracking-[-0.01em]'}`}>
            <span className="line-clamp-2 min-w-0">{shop.name}</span>
            {shop.verified && <VerifiedMark label={t('verifiedLabel')} darkMode={darkMode && !active} />}
          </h3>
          <p className="mt-1.5 flex items-center gap-1 text-xs font-extrabold">
            <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
            <span dir="ltr" className="tabular-nums">{shop.rating ? shop.rating.toFixed(1) : t('newRating')}</span>
          </p>
        </div>
        <button type="button" onClick={info} aria-label={t('shopDetailsAria')} className={neoIcon(darkMode)}>
          <FiInfo aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {address && (
        <p className={`flex items-center gap-1.5 text-xs font-medium ${body}`}>
          <FiMapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" /><span className="line-clamp-1">{address}</span>
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 border-t-2 border-[color:var(--ink)] pt-3 text-xs font-extrabold uppercase">
        <span className="flex min-w-0 items-center gap-1.5"><RiStoreLine aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{shop.shopType || t('generalType')}</span></span>
        {active ? (
          <span className="flex flex-shrink-0 items-center gap-1"><FiCheck aria-hidden="true" className="h-4 w-4" strokeWidth={3} />{t('selected')}</span>
        ) : !shop.activate ? (
          <span className="flex-shrink-0">{t('inactive')}</span>
        ) : null}
      </div>
    </div>
  );
});

const ShopDetailModal = memo(({ shop, darkMode, language, onClose, t }) => {
  useModalLock(true, onClose);
  const rows = [
    { Icon: FiMail, label: t('email'), value: shop.email },
    { Icon: FiPhone, label: t('phone'), value: shop.phone, ltr: true },
    { Icon: RiStoreLine, label: t('type'), value: shop.shopType },
    { Icon: FiMapPin, label: t('address'), value: shopAddressLine(shop, true) },
    { Icon: FiCalendar, label: t('joined'), value: formatDate(shop.createdAt, language) },
  ].filter((r) => r.value);
  const tel = telHref(shop.phone);
  const ink = darkMode ? 'text-white' : 'text-emerald-950';

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name}>
      <div className="hp-fade absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`hp-modal relative max-h-[92vh] w-full overflow-y-auto overscroll-contain sm:max-w-md ${neoCard(darkMode, 'lg')}`}>
        <div className={`relative border-b-[3px] border-[color:var(--ink)] p-5 pe-16 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-emerald-50'}`}>
          <h2 className={`line-clamp-2 flex items-center gap-2 text-lg font-extrabold uppercase ${ink}`}>
            <span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{shop.name}</span>
            {shop.verified && <VerifiedMark label={t('verifiedLabel')} darkMode={darkMode} />}
          </h2>
          <p className={`mt-2 flex items-center gap-1 text-sm font-extrabold ${ink}`}>
            <RiStarFill aria-hidden="true" className="h-4 w-4 text-amber-500" />
            <span dir="ltr" className="tabular-nums">{shop.rating ? shop.rating.toFixed(1) : t('newRating')}</span>
          </p>
          <button type="button" onClick={onClose} aria-label={t('close') || 'Close'} className={`${neoIcon(darkMode)} absolute end-4 top-4`}>
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {shop.description && <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-neutral-200' : 'text-gray-800'}`}>{shop.description}</p>}
          <ul className="space-y-2.5">
            {rows.map(({ Icon, label, value, ltr }) => (
              <li key={label} className={`flex items-center gap-3 p-3 ${NEO_ROW} ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
                <span aria-hidden="true" className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className={`text-[11px] font-extrabold uppercase ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>{label}</p>
                  <p className={`truncate text-sm font-bold ${ink}`} dir={ltr ? 'ltr' : undefined}>{value}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="pb-1 pe-1">
            {tel && <a href={tel} className={`${neoBtn(darkMode, true)} w-full`}><FiPhone aria-hidden="true" className="h-4 w-4" />{t('phone')}</a>}
          </div>
        </div>
      </div>
    </div>
  );
});

const InfoPanel = memo(({ step, darkMode, t }) => {
  const head = STEP_HEAD[step - 1];
  return (
    <div className={`overflow-hidden ${neoCard(darkMode, 'sm')}`}>
      <div className={`border-b-[3px] border-[color:var(--ink)] p-4 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-emerald-50'}`}>
        <IsoIllustration type={INFO_SCENES[step - 1]} tone="emerald" onGreen={false} darkMode={darkMode} className="mx-auto h-40 w-40" />
      </div>
      <div className="p-5">
        <h3 className={`text-base font-extrabold uppercase ${darkMode ? 'text-white' : 'text-emerald-950'}`}><span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{t(head.infoTitle)}</span></h3>
        <p className={`mt-3 text-sm font-medium leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>{t(head.infoBody)}</p>
      </div>
    </div>
  );
});

const SummaryPanel = memo(({ category, shop, darkMode, t }) => {
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-400' : 'text-gray-600';
  const rows = [
    [t('category'), category?.name],
    [t('shop'), shop?.name],
  ];
  return (
    <div className={`p-5 ${neoCard(darkMode, 'sm')}`}>
      <h3 className={`text-base font-extrabold uppercase ${ink}`}>{t('yourRequest')}</h3>
      <dl className="mt-4 space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className={`p-3 ${NEO_ROW} ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
            <dt className={`text-[11px] font-extrabold uppercase ${muted}`}>{label}</dt>
            <dd className={`mt-0.5 truncate text-sm font-bold ${value ? ink : muted}`}>{value || t('notSelected')}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
});

const JourneySection = memo(({ darkMode, language, t }) => {
  const isAr = language === 'ar';
  return (
    <section className={`hp-pattern ${darkMode ? 'hp-pattern-dark' : ''} py-14 sm:py-20 ${LAZY_SECTION} ${darkMode ? DARK_PAGE : 'bg-gray-50'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-14">
          <SectionTitle darkMode={darkMode} isAr={isAr} label={t('step')} title={t('repairJourney')} subtitle={t('journeySub')} />
        </div>
        <ol className="grid grid-cols-1 gap-6 pb-2 pe-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {STATUS_JOURNEY.map(({ key, labelKey, descKey, Icon, danger }, i) => (
            <li key={key} className={`min-w-0 gap-3 p-5 ${neoCard(darkMode, 'sm')}`}>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className={`text-3xl font-black tabular-nums ${danger ? 'text-rose-500' : darkMode ? 'text-[#39ff88]' : 'text-emerald-600'}`}>{pad2(language, i + 1)}</span>
                <span
                  aria-hidden="true"
                  className={`ms-auto inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 border-[color:var(--ink)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] ${danger ? 'bg-rose-500 text-white' : 'bg-[color:var(--acc)] text-emerald-950'}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className={`text-base font-extrabold uppercase ${isAr ? 'tracking-normal' : 'tracking-[-0.01em]'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{t(labelKey)}</p>
              <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>{t(descKey)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
});

function RepairRequestContent({ darkMode }) {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useCallback((key) => tr(language, key), [language]);
  const isAr = language === 'ar';
  const token = useAuthGuard();
  useScrollTopOnEnter();

  const [step, setStep] = useState(1);
  const descRef = useRef('');
  const [hasDesc, setHasDesc] = useState(false);
  const [category, setCategory] = useState(null);
  const [shop, setShop] = useState(null);
  const [submittedShop, setSubmittedShop] = useState(null);
  const [infoShop, setInfoShop] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [shopPage, setShopPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { document.title = 'Book Repair | Tech-Restore'; }, []);

  const onDescChange = useCallback((v) => {
    descRef.current = v;
    const has = !!v.trim();
    setHasDesc((p) => (p === has ? p : has));
  }, []);

  const categoriesQ = useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => toList(await api.get('/api/categories', { headers: authHeaders(), signal })).filter((c) => c && c.id != null).map(normalizeCategory),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const shopsQ = useQuery({
    queryKey: ['repairShops'],
    queryFn: async ({ signal }) =>
      toList(await api.get('/api/users/shops/all', { headers: authHeaders(), signal }))
        .filter((s) => s && s.id != null)
        .map(normalizeShop)
        .filter((s) => s.shopType === 'BOTH' || s.shopType === 'REPAIRER'),
    enabled: step === 3 && !!category && !!token,
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
      return toast({ icon: 'error', title: t('sendFailTitle'), text: err.response?.data?.message || t('sendFailText'), timer: 3500 });
    },
  });

  const goTo = useCallback((n) => startTransition(() => setStep(n)), []);
  const toStep1 = useCallback(() => goTo(1), [goTo]);
  const toStep2 = useCallback(() => goTo(2), [goTo]);
  const toAccount = useCallback(() => navigate('/account'), [navigate]);

  const scrollToForm = useCallback(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('repair-form')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, []);

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
    if (!shop || !category || submit.isPending) return;
    const text = cleanText(descRef.current, MAX_DESC);
    if (!text) return;
    submit.mutate({ shopId: shop.id, text, categoryId: category.id, shop });
  }, [shop, category, submit]);

  const reset = useCallback(() => {
    descRef.current = '';
    setHasDesc(false);
    setStep(1); setCategory(null); setShop(null); setSubmittedShop(null); setCategoryPage(1); setShopPage(1); setInfoShop(null); submit.reset();
  }, [submit]);

  const openInfo = useCallback((s) => setInfoShop(s), []);
  const closeInfo = useCallback(() => setInfoShop(null), []);
  const changeCatPage = useCallback((p) => startTransition(() => setCategoryPage(p)), []);
  const changeShopPage = useCallback((p) => startTransition(() => setShopPage(p)), []);

  const renderSlide = useCallback(
    (s, on) => <RepairSlide key={s.key} slide={s} on={on} t={t} onStart={scrollToForm} />,
    [t, scrollToForm],
  );
  const crumbs = useMemo(() => <Crumbs t={t} />, [t]);

  const head = STEP_HEAD[step - 1];
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-300' : 'text-gray-700';

  return (
    <div
      dir={languageDirection(language)}
      lang={language}
      className={`min-h-screen overflow-x-hidden ${isAr ? 'font-cairo' : 'font-jakarta'} ${darkMode ? `${DARK_PAGE} text-white` : 'bg-gray-50 text-gray-900'}`}
    >
      <Device3DStyles />
      <style>{EXTRAS_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <h1 className="sr-only">{t('crumbRepair')}</h1>
      <HeroSlider
        slides={HERO_SLIDES} loading={false} language={language} label={t('crumbRepair')}
        crumbs={crumbs} renderSlide={renderSlide} t={t}
      />

      <section className={`hp-pattern ${darkMode ? 'hp-pattern-dark' : ''} py-10 sm:py-14 ${darkMode ? DARK_PAGE : 'bg-gray-50'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div id="repair-form" className="mb-8 scroll-mt-24 sm:mb-10">
            <SectionTitle
              key={step}
              darkMode={darkMode}
              isAr={isAr}
              label={`${t('step')} ${step} ${t('of')} ${STEP_DEFS.length}`}
              title={t(head.title)}
              subtitle={t(head.subtitle)}
            />
          </div>

          <div className="mb-8 pb-2 pe-2">
            <ProgressSteps step={step} darkMode={darkMode} t={t} />
          </div>

          <div className="grid items-start gap-6 pb-2 pe-2 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
            <div aria-busy={isPending} className={`p-5 transition-opacity duration-150 sm:p-8 ${neoCard(darkMode, 'lg')} ${isPending ? 'opacity-70' : ''}`}>
              <div key={step} className="hp-step">
                {step === 1 && (
                  <>
                    <DescribeStep initial={descRef.current} onChange={onDescChange} darkMode={darkMode} t={t} />
                    <NavButtons showBack={false} onNext={handleNext} nextDisabled={!hasDesc} darkMode={darkMode} t={t} />
                  </>
                )}

                {step === 2 && (
                  <>
                    {categoriesQ.isLoading ? (
                      <Skeletons darkMode={darkMode} count={6} className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5" itemClassName="h-[150px]" />
                    ) : categoriesQ.isError ? (
                      <StateBox darkMode={darkMode} label={t('loadCategoriesFail')} onRetry={categoriesQ.refetch} retryLabel={t('tryAgain')} />
                    ) : categories.length === 0 ? (
                      <StateBox darkMode={darkMode} label={t('noCategories')} />
                    ) : (
                      <>
                        <div className={`hp-cat ${darkMode ? 'hp-cat-dark' : ''}`}>
                          <div role="group" aria-label={t('deviceType')} className="grid grid-cols-2 gap-4 pb-2 pe-2 sm:grid-cols-3 sm:gap-5">
                            {pagedCategories.map((c, i) => (
                              <div key={c.id} className="hp-rise relative min-w-0" style={STAGGER[i]}>
                                <CategoryTile cat={c} active={category?.id === c.id} onSelect={setCategory} darkMode={darkMode} />
                              </div>
                            ))}
                          </div>
                        </div>
                        <Pager page={safeCatPage} totalPages={categoryPages} onChange={changeCatPage} pending={isPending} darkMode={darkMode} t={t} />
                        {!category && <p role="status" className={`mt-6 text-sm font-bold ${muted}`}>{t('selectCategoryPrompt')}</p>}
                      </>
                    )}
                    <NavButtons onBack={toStep1} onNext={handleNext} nextDisabled={!category} darkMode={darkMode} t={t} />
                  </>
                )}

                {step === 3 && (
                  <>
                    {shopsQ.isLoading ? (
                      <Skeletons darkMode={darkMode} count={4} className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6" itemClassName="h-44" />
                    ) : shopsQ.isError ? (
                      <StateBox darkMode={darkMode} label={t('loadShopsFail')} onRetry={shopsQ.refetch} retryLabel={t('tryAgain')} />
                    ) : shops.length === 0 ? (
                      <StateBox darkMode={darkMode} label={t('noShops')} />
                    ) : (
                      <>
                        <div role="radiogroup" aria-label={t('chooseShopTitle')} className="grid grid-cols-1 gap-5 pb-2 pe-2 sm:grid-cols-2 sm:gap-6">
                          {pagedShops.map((s, i) => (
                            <div key={s.id} className="hp-rise flex min-w-0 flex-col" style={STAGGER[i]}>
                              <ShopOption shop={s} active={shop?.id === s.id} onSelect={setShop} onInfo={openInfo} darkMode={darkMode} language={language} t={t} />
                            </div>
                          ))}
                        </div>
                        <Pager page={safeShopPage} totalPages={shopPages} onChange={changeShopPage} pending={isPending} darkMode={darkMode} t={t} />
                      </>
                    )}
                    <NavButtons onBack={toStep2} onNext={handleSend} nextLabel={t('sendRepairRequest')} nextDisabled={!shop} isLoading={submit.isPending} darkMode={darkMode} t={t} />
                  </>
                )}

                {step === 4 && (
                  <div className="flex flex-col items-center py-4 text-center" role="status">
                    <IsoIllustration type="marketplace" tone="emerald" onGreen={false} darkMode={darkMode} className="h-40 w-40" />
                    <span aria-hidden="true" className={`${neoIcon(darkMode)} -mt-2 !h-14 !w-14 !rounded-xl`}><FiCheck className="h-7 w-7" strokeWidth={3} /></span>
                    <h2 className={`mt-5 text-2xl font-extrabold uppercase sm:text-3xl ${ink}`}><span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{t('requestSent')}</span></h2>
                    <p className={`mt-5 text-sm font-medium ${muted}`}>{t('requestSentTo')}</p>
                    <p className={`mt-1 text-lg font-extrabold uppercase ${ink}`}>{submittedShop?.name || t('defaultShopName')}</p>
                    <p className={`text-sm font-medium ${muted}`}>
                      {submittedShop?.shopAddress?.city || t('defaultCity')}{submittedShop?.shopAddress?.state ? `, ${submittedShop.shopAddress.state}` : ''}
                    </p>
                    <div className="mt-8 flex w-full max-w-md flex-col gap-3 pe-1 pb-1 sm:flex-row">
                      <button type="button" onClick={reset} className={`${neoBtn(darkMode, false)} flex-1`}>{t('newRequest')}</button>
                      <button type="button" onClick={toAccount} className={`${neoBtn(darkMode, true)} flex-1`}>
                        {t('viewMyRequests')}<FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:block">
              <InfoPanel step={step} darkMode={darkMode} t={t} />
              <SummaryPanel category={category} shop={shop} darkMode={darkMode} t={t} />
            </aside>
          </div>
        </div>
      </section>

      <JourneySection darkMode={darkMode} language={language} t={t} />

      {infoShop && <ShopDetailModal key={infoShop.id} shop={infoShop} darkMode={darkMode} language={language} onClose={closeInfo} t={t} />}
    </div>
  );
}

export { queryClient };
export default function RepairRequest(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <RepairRequestContent {...props} />
    </QueryClientProvider>
  );
}