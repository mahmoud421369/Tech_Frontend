import React, {
  useState, useEffect, useCallback, useRef, useMemo, memo, Suspense, lazy, useDeferredValue, useTransition, useId,
} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiX, FiSliders, FiCheck, FiGrid, FiList, FiArrowUp, FiRefreshCw, FiChevronDown, FiChevronLeft,
  FiChevronRight, FiSearch, FiHeart, FiPlus, FiAlertCircle,
} from 'react-icons/fi';
import { RiStarFill } from 'react-icons/ri';
import api from '../common/api/api';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import { UI3D_CSS, Defs3D, Glyph3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  LISTING_CSS, PAGE_SIZES, readStorage, safeImageUrl, clamp, clean, loadSwal, useBackToTop, useModalLock,
} from '../components/user/ListingKit';
import { IsoIllustration, isoCatKey } from '../components/user/IsoIllustrations';

const Hero = lazy(() => import('../components/user/Hero'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

const LATEST_LIMIT = 4;
const CATEGORY_LIMIT = 6;
const MOBILE_QUERY = '(max-width: 1023px)';
const MOBILE_BATCH = 8;
const LOW_STOCK = 5;
const SAVED_KEY = 'nb_saved_devices';
const SHEET_MS = 180;
const PRODUCT_IMG_W = 400;
const PRODUCT_IMG_H = 320;
const EMPTY_LIST = [];
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));

const DARK_PAGE = 'bg-[#141414]';
const LAZY_SECTION = '[content-visibility:auto] [contain-intrinsic-size:auto_760px]';

const DEFAULT_TEXT = {
  en: {
    eyebrowCategories: 'Categories', eyebrowProducts: 'Shop', prevPage: 'Previous page', nextPage: 'Next page', pageN: 'Page {{n}}', loadingMore: 'Loading more devices', endOfList: 'You have seen all devices',
    save: 'Save', saved: 'Saved', savedOnly: 'Saved only', onSaleOnly: 'On sale only', moreFilters: 'More filters', sortDiscount: 'Biggest discount',
    youSave: 'Save {{value}}', originalPrice: 'Original price', discountedPrice: 'Price after discount', discountValue: 'Discount',
    onlyLeft: 'Only {{count}} left in stock',
  },
  ar: {
    eyebrowCategories: 'التصنيفات', eyebrowProducts: 'المتجر', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية', pageN: 'صفحة {{n}}', loadingMore: 'جارٍ تحميل المزيد من الأجهزة', endOfList: 'لقد شاهدت جميع الأجهزة',
    save: 'حفظ', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', onSaleOnly: 'العروض فقط', moreFilters: 'فلاتر إضافية', sortDiscount: 'أكبر خصم',
    youSave: 'وفّر {{value}}', originalPrice: 'السعر الأصلي', discountedPrice: 'السعر بعد الخصم', discountValue: 'الخصم',
    onlyLeft: 'متبقي {{count}} فقط في المخزون',
  },
  fr: {
    eyebrowCategories: 'Catégories', eyebrowProducts: 'Boutique', prevPage: 'Page précédente', nextPage: 'Page suivante', pageN: 'Page {{n}}', loadingMore: "Chargement d'autres appareils", endOfList: 'Vous avez vu tous les appareils',
    save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrés uniquement', onSaleOnly: 'En promotion uniquement', moreFilters: 'Plus de filtres', sortDiscount: 'Plus grande remise',
    youSave: 'Économisez {{value}}', originalPrice: "Prix d'origine", discountedPrice: 'Prix après remise', discountValue: 'Remise',
    onlyLeft: 'Plus que {{count}} en stock',
  },
};
const DEVICE_SECTIONS = {
  en: enTranslations.devices,
  ar: arTranslations.devices,
  fr: frTranslations.devices,
};
const translators = {};
const getT = (lang) => {
  if (!translators[lang]) {
    const dict = { ...DEFAULT_TEXT.en, ...DEVICE_SECTIONS.en, ...DEFAULT_TEXT[lang], ...DEVICE_SECTIONS[lang] };
    translators[lang] = (key, values) => {
      let text = dict[key] ?? key;
      if (values) for (const k of Object.keys(values)) text = text.split(`{{${k}}}`).join(String(values[k]));
      return text;
    };
  }
  return translators[lang];
};

const interpolateNodes = (text, nodes) =>
  text.split(/(\{\{\w+\}\})/).map((part, i) => {
    const hit = /^\{\{(\w+)\}\}$/.exec(part);
    return hit && nodes[hit[1]] !== undefined ? <React.Fragment key={i}>{nodes[hit[1]]}</React.Fragment> : part;
  });

const NUMBER_FORMAT = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const COMPACT_FORMAT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const fmt = (n) => NUMBER_FORMAT.format(Number(n) || 0);
const money = (n, currency) => `${currency} ${fmt(n)}`;
const round2 = (n) => Math.round(n * 100) / 100;

const MAX_QUERY = 60;
const sanitizeQuery = (raw) =>
  String(raw ?? '')
    .replace(/[\p{Cc}\p{Cf}<>]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, MAX_QUERY);
const fold = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, '')
    .toLowerCase();

const safeId = (id) => {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  const s = String(id);
  return s && s.length <= 128 ? encodeURIComponent(s) : null;
};

const CONDITION_KEYS = { NEW: 'conditionNew', USED: 'conditionUsed', REFURBISHED: 'conditionRefurbished' };
const CONDITION_LIST = Object.keys(CONDITION_KEYS);
const condKey = (c) => (typeof c === 'string' && Object.prototype.hasOwnProperty.call(CONDITION_KEYS, c) ? CONDITION_KEYS[c] : null);
const condLabel = (t, c) => { const k = condKey(c); return k ? t(k) : clean(c, 30) || t('conditionUnknown'); };

const kindOf = (name = '') => {
  const k = String(name).toLowerCase();
  if (k.includes('laptop') || k.includes('notebook') || k.includes('computer')) return 'laptop';
  if (k.includes('phone') || k.includes('mobile')) return 'phone';
  if (k.includes('tablet') || k.includes('ipad')) return 'tablet';
  if (k.includes('audio') || k.includes('headphone') || k.includes('earbud')) return 'audio';
  if (k.includes('watch') || k.includes('wear')) return 'watch';
  if (k.includes('monitor') || k.includes('screen') || k.includes('tv') || k.includes('display')) return 'monitor';
  if (k.includes('game') || k.includes('console')) return 'gaming';
  if (k.includes('camera') || k.includes('photo')) return 'camera';
  return 'box';
};

const SORT_KEYS = [
  ['relevance', 'sortRelevance'],
  ['priceLowToHigh', 'sortPriceLow'],
  ['priceHighToLow', 'sortPriceHigh'],
  ['newest', 'sortNewest'],
  ['discount', 'sortDiscount'],
];
const PRICE_STEP = (max) => (max >= 20000 ? 500 : max >= 2000 ? 100 : 10);
const HISTOGRAM_BINS = 16;

const computeFinal = (price, type, value) => {
  if (!(price > 0) || !(value > 0) || !type) return price;
  if (type === 'PERCENTAGE') return value < 100 ? round2(price - (price * value) / 100) : price;
  return value < price ? round2(price - value) : price;
};

const normalizeProduct = (p) => {
  const price = Number(p.price) || 0;
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
    _desc: clean(p.description, 140),
    _rating: clamp(Number(p.rating ?? p.averageRating) || 0, 0, 5),
    _reviews: Math.max(0, Number(p.reviewCount ?? p.reviewsCount ?? p.ratingCount) || 0),
    _text: fold(`${p.name || ''} ${p.categoryName || ''}`),
    _ts: Date.parse(p.createdAt) || 0,
  };
};

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const useSavedProducts = () => {
  const [ids, setIds] = useState(readSaved);
  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);
  const set = useMemo(() => new Set(ids), [ids]);
  return [set, toggle];
};

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(MOBILE_QUERY);
    if (!mq) return undefined;
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return mobile;
};

const HL = (hex) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23${hex}' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")`;

const PX_CSS = `
.hp-hl,.hp-hl-dark{padding-bottom:.2em;background-position:left bottom;background-repeat:no-repeat;background-size:100% .3em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.hp-hl{background-image:${HL('10b981')}}
.hp-hl-dark{background-image:${HL('39ff88')}}
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
@keyframes hpSheetUp{from{transform:translateY(100%)}to{transform:none}}
@keyframes hpSheetDown{from{transform:none}to{transform:translateY(100%)}}
@keyframes hpSheetSide{from{transform:translateX(calc(var(--dx)*-100%))}to{transform:none}}
@keyframes hpSheetSideOut{from{transform:none}to{transform:translateX(calc(var(--dx)*-100%))}}
.hp-fade-in{animation:hpFadeIn .18s ease-out both}
.hp-fade-out{animation:hpFadeOut .18s ease-in both}
.hp-sheet{animation:hpSheetUp .22s cubic-bezier(.2,.8,.2,1) both}
.hp-sheet-out{animation:hpSheetDown .18s ease-in both}
@media (min-width:640px){.hp-sheet{animation-name:hpSheetSide}.hp-sheet-out{animation-name:hpSheetSideOut}}
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
.hp-range{position:absolute;inset:0;width:100%;height:22px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none}
.hp-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;box-sizing:border-box;pointer-events:auto;width:22px;height:22px;border-radius:8px;background:var(--acc);border:3px solid var(--ink);box-shadow:2px 2px 0 var(--sh);cursor:grab}
.hp-range::-moz-range-thumb{box-sizing:border-box;pointer-events:auto;width:22px;height:22px;border-radius:8px;background:var(--acc);border:3px solid var(--ink);box-shadow:2px 2px 0 var(--sh);cursor:grab}
.hp-range:focus-visible::-webkit-slider-thumb{outline:3px solid var(--acc);outline-offset:2px}
.hp-range:focus-visible::-moz-range-thumb{outline:3px solid var(--acc);outline-offset:2px}
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
.hp-pop,.hp-rise,.hp-load-dot,.hp-fade-in,.hp-fade-out,.hp-sheet,.hp-sheet-out{animation:none}
.hp-dot{transition:none}
.hp-dot:hover,.hp-dot:active{transform:none}
}
`;
let pxStylesInjected = false;
const injectPxStylesOnce = () => {
  if (pxStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-devices-styles', 'true');
  tag.textContent = PX_CSS;
  document.head.appendChild(tag);
  pxStylesInjected = true;
};
injectPxStylesOnce();

const STYLE_EL = <style>{`${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}`}</style>;

const NEO_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#022c22] [--sh:#022c22] [--acc:#34d399] [--fld:#ffffff] [--txt:#022c22] [--mut:#4b5563] [--hist:#d1d5db] [--deal:#c2410c]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#39ff88] [--fld:#1e1e1e] [--txt:#ffffff] [--mut:#a3a3a3] [--hist:#3a3a3a] [--deal:#fb923c]',
};
const NEO_SURFACE = { light: 'bg-white', dark: 'bg-[#2a2a2a]' };
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

const FIELD =
  'min-h-11 w-full rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--fld)] px-3 py-2.5 text-sm font-semibold text-[color:var(--txt)] outline-none ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';

const PRODUCT_ADD_BTN =
  'relative z-10 inline-flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:[box-shadow:none] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const PRODUCT_LINK =
  'outline-none after:absolute after:inset-0 after:z-[1] focus-visible:after:outline focus-visible:after:outline-[3px] ' +
  'focus-visible:after:-outline-offset-4 focus-visible:after:outline-[color:var(--acc)]';

const productMediaBg = (darkMode) => (darkMode ? 'hp-media hp-media-dark bg-[#1e1e1e]' : 'bg-white');

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

const SectionTitle = memo(({ title, subtitle, darkMode, isAr }) => {
  const hl = darkMode ? 'hp-hl-dark' : 'hp-hl';
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-14">
      <div className="min-w-0 max-w-3xl">
        <h2
          className={`text-3xl font-extrabold [text-wrap:balance] sm:text-5xl lg:text-6xl ${
            isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.18] tracking-[-0.04em]'
          } ${ink}`}
        >
          {parts.map(({ part, hl: on }, i) => (on ? <span key={i} className={hl}>{part}</span> : part))}
        </h2>
        {subtitle && (
          <p className={`mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${darkMode ? 'text-neutral-300' : 'text-gray-800'}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
});

const DeviceScene = memo(({ className = 'h-24 w-32' }) => (
  <div className={`relative flex-shrink-0 ${className}`} aria-hidden="true">
    <div className="absolute inset-x-3 bottom-0 h-4 rounded-full bg-black/20 blur-md" />
    <Glyph3D kind="laptop" className="absolute bottom-1 start-0 h-[78%] w-[62%]" />
    <Glyph3D kind="phone" className="lk-float absolute end-[10%] top-0 h-[72%] w-[28%]" />
  </div>
));

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
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${id}-o${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-[color:var(--ink)] px-3 text-start text-sm font-semibold outline-none ${FOCUS} ${surface}`}
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={`hp-pop hp-sb absolute start-0 top-full z-30 mt-2 max-h-60 min-w-full overflow-y-auto overscroll-contain rounded-xl border-[3px] border-[color:var(--ink)] py-1 [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] ${surface}`}
        >
          {options.map((o, i) => {
            const selected = String(o.value) === String(value);
            return (
              <li
                key={String(o.value)}
                id={`${id}-o${i}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
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
  const handleChange = useCallback((e) => onChange(sanitizeQuery(e.target.value)), [onChange]);
  const handleClear = useCallback(() => { onChange(''); inputRef.current?.focus(); }, [onChange]);
  return (
    <div className="relative min-w-0 flex-1" role="search">
      <FiSearch aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--txt)]" />
      <input
        ref={inputRef}
        type="search" inputMode="search" enterKeyHint="search"
        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
        maxLength={MAX_QUERY}
        value={value} onChange={handleChange} placeholder={placeholder} aria-label={ariaLabel}
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

const PriceBlock = memo(({ product, t }) => {
  const currency = t('currency');
  const discounted = product.saving > 0;
  return (
    <div className="min-w-0">
      {discounted && (
        <p className="text-[11px] tabular-nums text-[color:var(--mut)] line-through">
          <span className="sr-only">{t('originalPrice')}: </span><span dir="ltr">{money(product.price, currency)}</span>
        </p>
      )}
      <p className={`truncate text-lg font-extrabold leading-tight tabular-nums ${discounted ? 'text-[color:var(--deal)]' : 'text-[color:var(--txt)]'}`}>
        <span className="sr-only">{discounted ? `${t('discountedPrice')}: ` : ''}</span><span dir="ltr">{money(product.finalPrice, currency)}</span>
      </p>
      {discounted && (
        <p className="truncate text-[11px] font-bold text-[color:var(--deal)]">
          {t('youSave', { value: money(product.saving, currency) })}
        </p>
      )}
    </div>
  );
});

const ProductCard = memo(({ product, darkMode, onAddToCart, onSave, isSaved, layout, t }) => {
  const src = useMemo(() => safeImageUrl(product.imageUrl), [product.imageUrl]);
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  const [btn, setBtn] = useState('idle');
  const imgRef = useRef(null);
  const timer = useRef();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  useEffect(() => { setFailed(!src); setLoaded(false); }, [src]);
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src, failed]);

  const id = safeId(product.id);
  const isList = layout === 'list';
  const out = product.stock === 0;
  const low = typeof product.stock === 'number' && product.stock > 0 && product.stock <= LOW_STOCK;
  const ink = 'text-[color:var(--txt)]';
  const muted = 'text-[color:var(--mut)]';

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setFailed(true), []);
  const handleSave = useCallback(() => onSave(product.id), [onSave, product.id]);
  const handleCart = useCallback(async () => {
    if (out || btn === 'adding') return;
    setBtn('adding');
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setBtn(ok ? 'added' : 'idle');
    if (ok) timer.current = setTimeout(() => mounted.current && setBtn('idle'), 1400);
  }, [out, btn, onAddToCart, product]);

  return (
    <article aria-label={product.name} className={`group relative h-full overflow-hidden ${neoCard(darkMode, 'sm', true)} ${isList ? '!flex-row' : ''}`}>
      <div
        className={`relative flex-shrink-0 overflow-hidden border-[color:var(--ink)] [contain:layout_paint] ${productMediaBg(darkMode)} ${
          isList ? 'min-h-[10rem] w-32 self-stretch border-e-[3px] sm:w-48' : 'aspect-[5/4] w-full border-b-[3px]'
        }`}
      >
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label={`${product.name} – ${t('imageUnavailable')}`}>
            <IsoIllustration
              type={isoCatKey(kindOf(product.categoryName || product.name))} darkMode={darkMode} onGreen={false}
              className="h-[64%] w-[64%] transition-transform duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105"
            />
          </div>
        ) : (
          <img
            ref={imgRef}
            src={src} alt={product.name} width={PRODUCT_IMG_W} height={PRODUCT_IMG_H}
            loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
            onLoad={handleLoad} onError={handleError}
            className={`absolute inset-0 h-full w-full object-contain p-4 transition-[opacity,transform] duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105 ${
              loaded ? (out ? 'opacity-50' : 'opacity-100') : 'opacity-0'
            } ${darkMode ? 'drop-shadow-[0_6px_6px_rgba(0,0,0,0.18)]' : ''}`}
          />
        )}
        {!failed && !loaded && <div aria-hidden="true" className={`absolute inset-0 animate-pulse motion-reduce:animate-none ${darkMode ? 'bg-[#2a2a2a]' : 'bg-black/5'}`} />}
      </div>

      <button
        type="button" onClick={handleSave} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
        className={`${NEO_ICON} absolute end-2 top-2 z-10 !h-10 !w-10 ${isSaved ? '' : '!bg-white'}`}
      >
        <FiHeart className={`h-4 w-4 ${isSaved ? 'text-rose-600' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
        <h3 className={`line-clamp-2 text-sm font-bold leading-snug ${isList ? '' : 'min-h-[2.5rem]'} ${ink}`} title={product.name}>
          {id ? <Link to={`/device/${id}`} className={PRODUCT_LINK}>{product.name}</Link> : product.name}
        </h3>

        <p className={`line-clamp-2 text-xs font-medium leading-relaxed ${isList ? 'sm:line-clamp-3' : ''} ${muted}`}>{product._desc || t('noDescription')}</p>

        {product._rating > 0 && (
          <p className={`flex items-center gap-1 text-xs font-bold ${ink}`}>
            <RiStarFill className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            <span dir="ltr" className="tabular-nums">{product._rating.toFixed(1)}</span>
            {product._reviews > 0 && <span dir="ltr" className={`font-medium tabular-nums ${muted}`}>({COMPACT_FORMAT.format(product._reviews)})</span>}
          </p>
        )}

        {out ? (
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{t('outOfStock')}</span>
          </p>
        ) : low ? (
          <p className={`flex items-center gap-1.5 text-xs font-medium ${ink}`}>
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" aria-hidden="true" />
            <span>{t('onlyLeft', { count: product.stock })}</span>
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2.5 border-t-2 border-dotted border-[color:var(--ink)] pt-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
          <PriceBlock product={product} t={t} />
          <button type="button" onClick={handleCart} disabled={out || btn === 'adding'} aria-label={t('addToCart')} className={`${PRODUCT_ADD_BTN} max-sm:!w-full`}>
            {btn === 'adding' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
              : btn === 'added' ? <FiCheck className="h-5 w-5" /> : <FiPlus className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </article>
  );
});

const ProductGrid = memo(({ products, layout, wide, darkMode, saved, onSave, onAddToCart, t }) => (
  <div className={`grid gap-4 pb-2 pe-2 sm:gap-5 ${layout === 'grid' ? (wide ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3') : 'grid-cols-1'}`}>
    {products.map((p, i) => (
      <div key={p.id} className="hp-rise min-w-0" style={STAGGER[i % STAGGER.length]}>
        <ProductCard product={p} darkMode={darkMode} onAddToCart={onAddToCart} onSave={onSave} isSaved={saved.has(p.id)} layout={layout} t={t} />
      </div>
    ))}
  </div>
));

const InfiniteSentinel = memo(({ hasMore, count, onMore, darkMode, t }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return undefined;
    if (typeof IntersectionObserver === 'undefined') { onMore(); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onMore(); }, { rootMargin: '700px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, count, onMore]);
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
      ) : count > MOBILE_BATCH ? (
        <p className="hp-pop flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase text-[color:var(--txt)]">
          <FiCheck aria-hidden="true" className="h-3.5 w-3.5" />{t('endOfList')}
        </p>
      ) : null}
    </div>
  );
});

const LatestSection = memo(({ products, darkMode, isAr, saved, onSave, onAddToCart, t }) => (
  <section
    aria-label={t('latestArrivals')}
    className={`hp-pattern ${darkMode ? 'hp-pattern-dark' : ''} py-14 sm:py-20 ${LAZY_SECTION} ${darkMode ? DARK_PAGE : 'bg-gray-50'}`}
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle darkMode={darkMode} isAr={isAr} title={t('latestArrivals')} subtitle={t('latestArrivalsSub')} />
      <div className="grid grid-cols-2 gap-4 pb-2 pe-2 sm:gap-5 lg:grid-cols-4">
        {products.map((p, i) => (
          <div key={p.id} className="hp-rise min-w-0" style={STAGGER[i % STAGGER.length]}>
            <ProductCard product={p} darkMode={darkMode} onAddToCart={onAddToCart} onSave={onSave} isSaved={saved.has(p.id)} layout="grid" t={t} />
          </div>
        ))}
      </div>
    </div>
  </section>
));

const CategoryGrid = memo(({ categories, productsByCategory, selectedCategoryId, onSelect, darkMode, isAr, t }) => {
  const top = useMemo(
    () => [...categories].sort((a, b) => (productsByCategory[b.id]?.length || 0) - (productsByCategory[a.id]?.length || 0)).slice(0, CATEGORY_LIMIT),
    [categories, productsByCategory],
  );
  if (!top.length) return null;
  return (
    <section
      aria-label={t('browseCategories')}
      className={`hp-glow ${darkMode ? `hp-glow-dark ${DARK_PAGE}` : 'bg-gray-50'} py-14 sm:py-20 ${LAZY_SECTION}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle darkMode={darkMode} isAr={isAr} title={t('browseCategories')} subtitle={t('browseCategoriesSub')} />
        <div className={`hp-cat ${darkMode ? 'hp-cat-dark' : ''}`}>
          <div className="grid grid-cols-2 gap-4 pb-2 pe-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {top.map((cat) => {
              const active = selectedCategoryId === cat.id;
              const count = productsByCategory[cat.id]?.length || 0;
              return (
                <button
                  key={cat.id} type="button" onClick={() => onSelect(cat.id)} aria-pressed={active}
                  className={`hp-dot group relative min-h-11 p-3 pt-6 text-center sm:gap-2.5 sm:p-4 sm:pt-7 ${active ? 'hp-dot-on' : ''}`}
                >
                  <IsoIllustration
                    type={isoCatKey(kindOf(cat.name))} darkMode={darkMode} onGreen={false}
                    className="h-14 w-14 transition-transform duration-200 motion-reduce:transition-none group-hover:scale-110 sm:h-16 sm:w-16"
                  />
                  <span className="line-clamp-1 w-full text-sm font-extrabold uppercase">{cat.name}</span>
                  <span className="text-xs font-bold opacity-80">{t('itemsCount', { count })}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
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

const NumField = memo(({ value, onCommit, label, t }) => {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(n)) { setError(t('errorInvalidNumber')); setDraft(String(value)); return; }
    const msg = onCommit(n);
    if (msg) { setError(msg); setDraft(String(value)); } else setError('');
  };
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-[color:var(--txt)]">{label}</span>
      <div className={`flex min-h-11 items-center rounded-lg border-2 bg-[color:var(--fld)] px-3 text-sm font-bold text-[color:var(--txt)] focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)] ${error ? 'border-rose-500' : 'border-[color:var(--ink)]'}`} dir="ltr">
        <span className="me-1 text-[color:var(--mut)]">{t('currency')}</span>
        <input
          type="number" inputMode="numeric" min={0} value={draft} aria-invalid={!!error}
          onChange={(e) => { setDraft(e.target.value); setError(''); }} onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()} className="w-full min-w-0 bg-transparent tabular-nums outline-none"
        />
      </div>
      {error && <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-500">{error}</p>}
    </label>
  );
});

const PriceRangeFilter = memo(({ bounds, value, onChange, histogram, darkMode, t }) => {
  const { max, step } = bounds;
  const [lo, hi] = value;
  const leftPct = (lo / max) * 100;
  const rightPct = (hi / max) * 100;
  const peak = Math.max(1, ...histogram);
  const presets = useMemo(() => [
    { label: t('presetUnder', { value: 5 }), r: [0, Math.min(5000, max)] },
    { label: t('presetRange', { min: 5, max: 20 }), r: [Math.min(5000, max), Math.min(20000, max)] },
    { label: t('presetOver', { value: 20 }), r: [Math.min(20000, max), max] },
  ].filter((p) => p.r[0] < p.r[1]), [t, max]);

  const commitMin = (n) => {
    if (n < 0) return t('errorNegative');
    if (n > hi) return t('errorMinGreater');
    onChange([n, hi]);
    return '';
  };
  const commitMax = (n) => {
    if (n < 0) return t('errorNegative');
    if (n < lo) return t('errorMaxLess');
    if (n > max) return t('errorMaxPrice', { max: max.toLocaleString() });
    onChange([lo, n]);
    return '';
  };

  return (
    <div className="min-w-0 space-y-5 px-1" dir="ltr">
      <div className="flex h-12 items-end gap-[3px]" aria-hidden="true">
        {histogram.map((c, i) => {
          const binStart = (i / histogram.length) * max;
          const binEnd = ((i + 1) / histogram.length) * max;
          const inRange = binEnd > lo && binStart < hi;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${inRange ? 'bg-[color:var(--acc)]' : 'bg-[color:var(--hist)]'}`}
              style={{ height: `${Math.max(c ? 12 : 4, (c / peak) * 100)}%`, opacity: c ? 1 : 0.5 }}
            />
          );
        })}
      </div>
      <div className="relative flex h-[22px] items-center">
        <div className="absolute inset-x-0 h-2.5 rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--hist)]" />
        <div className="absolute h-2.5 border-y-2 border-[color:var(--ink)] bg-[color:var(--acc)]" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        <input
          type="range" aria-label={t('minPriceAria')} min={0} max={max} step={step} value={lo}
          onChange={(e) => onChange([Math.max(0, Math.min(Number(e.target.value), hi - step)), hi])}
          className="hp-range" style={{ zIndex: lo > max - step * 3 ? 5 : 3 }}
        />
        <input
          type="range" aria-label={t('maxPriceAria')} min={0} max={max} step={step} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
          className="hp-range" style={{ zIndex: 4 }}
        />
      </div>
      <div className="flex flex-col gap-4 min-[380px]:flex-row min-[380px]:gap-5">
        <NumField label={t('priceMin')} value={lo} onCommit={commitMin} t={t} />
        <NumField label={t('priceMax')} value={hi} onCommit={commitMax} t={t} />
      </div>
      <div className="flex flex-wrap gap-2.5">
        {presets.map((p) => {
          const on = lo === p.r[0] && hi === p.r[1];
          return (
            <button key={p.r.join('-')} type="button" onClick={() => onChange(p.r)} aria-pressed={on} className={`${neoBtn(darkMode, on)} !min-h-9 !px-3 !py-1.5 !text-xs`}>
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const FilterPanel = memo((p) => {
  const {
    t, darkMode, onClose, categories, productsByCategory, selectedCategoryId, setSelectedCategoryId, selectedConditions, toggleCondition, conditionCounts,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, setInStockOnly, onSaleOnly, setOnSaleOnly, savedOnly, setSavedOnly,
    open, setOpen, clearFilters, activeFiltersCount, totalCount,
  } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className="w-full min-w-0 text-[color:var(--txt)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-4">
        <h3 className="flex min-w-0 items-center gap-2 text-lg font-extrabold uppercase">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
          <span className={`truncate ${darkMode ? 'hp-hl-dark' : 'hp-hl'}`}>{t('filters')}</span>
        </h3>
        <div className="flex flex-shrink-0 items-center gap-3">
          {activeFiltersCount > 0 && (
            <button type="button" onClick={clearFilters} className={`min-h-11 cursor-pointer text-xs font-extrabold underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 ${FOCUS}`}>{t('resetAll')}</button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} aria-label={t('closeFilters')} className={`${NEO_ICON} !h-10 !w-10`}><FiX className="h-4 w-4" /></button>
          )}
        </div>
      </div>

      <FilterBlock num="01" title={t('priceRange')} isOpen={open.price} onToggle={() => toggle('price')} darkMode={darkMode}>
        <PriceRangeFilter bounds={priceBounds} value={priceValue} onChange={setPriceRange} histogram={histogram} darkMode={darkMode} t={t} />
      </FilterBlock>

      <FilterBlock num="02" title={t('condition')} isOpen={open.cond} onToggle={() => toggle('cond')} darkMode={darkMode}>
        <div className="min-w-0 break-words">
          {CONDITION_LIST.map((value) => (
            <OptionRow key={value} type="check" label={t(CONDITION_KEYS[value])} count={conditionCounts[value] || 0} selected={selectedConditions.includes(value)} onClick={() => toggleCondition(value)} />
          ))}
          <OptionRow type="check" label={t('inStockOnly')} selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)} />
        </div>
      </FilterBlock>

      <FilterBlock num="03" title={t('category')} isOpen={open.cat} onToggle={() => toggle('cat')} darkMode={darkMode}>
        <div className="hp-sb max-h-52 min-w-0 overflow-y-auto overscroll-contain break-words pe-2" role="radiogroup" aria-label={t('category')}>
          <OptionRow type="radio" label={t('all')} count={totalCount} selected={selectedCategoryId === 'all'} onClick={() => setSelectedCategoryId('all')} />
          {categories.map((c) => (
            <OptionRow key={c.id} type="radio" label={c.name} count={productsByCategory[c.id]?.length || 0} selected={selectedCategoryId === c.id} onClick={() => setSelectedCategoryId(c.id)} />
          ))}
        </div>
      </FilterBlock>

      <FilterBlock num="04" title={t('moreFilters')} isOpen={open.more} onToggle={() => toggle('more')} darkMode={darkMode}>
        <div className="min-w-0 break-words">
          <OptionRow type="check" label={t('onSaleOnly')} selected={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} />
          <OptionRow type="check" label={t('savedOnly')} selected={savedOnly} onClick={() => setSavedOnly((v) => !v)} />
        </div>
      </FilterBlock>
    </div>
  );
});

const pageWindow = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (cur >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push(`gap-${n}`); out.push(n); });
  return out;
};

const Pagination = memo(({ page, total, onChange, darkMode, t }) => {
  const items = useMemo(() => pageWindow(page, total), [page, total]);
  if (total <= 1) return null;
  const icon = `${NEO_THEME[darkMode ? 'dark' : 'light']} ${NEO_ICON}`;
  return (
    <nav aria-label={t('pageN', { n: page })} className="mt-10 flex flex-wrap items-center justify-center gap-3 pe-2">
      <button type="button" className={icon} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <FiChevronLeft className="h-5 w-5 rtl:rotate-180" />
      </button>
      {items.map((n) => (typeof n === 'number' ? (
        <button
          key={n} type="button" onClick={() => onChange(n)} aria-label={t('pageN', { n })} aria-current={n === page ? 'page' : undefined}
          className={`${neoBtn(darkMode, n === page)} !min-w-11 !px-2 tabular-nums`}
        >
          {n}
        </button>
      ) : <span key={n} aria-hidden="true" className="px-1 font-extrabold text-[color:var(--txt)]">…</span>))}
      <button type="button" className={icon} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
        <FiChevronRight className="h-5 w-5 rtl:rotate-180" />
      </button>
    </nav>
  );
});

const ProductsContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = getT(language);
  const dir = languageDirection(language);
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const uid = useId().replace(/:/g, '');
  const [, startTransition] = useTransition();

  const [saved, toggleSaved] = useSavedProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const searchPending = searchTerm !== deferredSearch;
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [priceRange, setPriceRangeState] = useState(null);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(MOBILE_BATCH);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [viewMode, setViewMode] = useState('grid');
  const [sheet, setSheet] = useState('closed');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [open, setOpen] = useState({ price: true, cond: true, cat: true, more: true });
  const [token] = useState(() => readStorage('authToken'));
  const gridRef = useRef(null);
  const sheetTimer = useRef();
  const showTop = useBackToTop();

  const openSheet = useCallback(() => { clearTimeout(sheetTimer.current); setSheet('open'); }, []);
  const closeSheet = useCallback(() => {
    setSheet((s) => (s === 'open' ? 'leave' : s));
    clearTimeout(sheetTimer.current);
    sheetTimer.current = setTimeout(() => setSheet('closed'), SHEET_MS);
  }, []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const toggleFilters = useCallback(() => setFiltersOpen((v) => !v), []);
  useModalLock(sheet === 'open', closeSheet);
  useEffect(() => () => clearTimeout(sheetTimer.current), []);

  useEffect(() => { document.title = t('pageTitle'); }, [t]);
  useEffect(() => { if (!isMobile) { clearTimeout(sheetTimer.current); setSheet('closed'); } }, [isMobile]);
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.hpTheme = darkMode ? 'dark' : 'light';
    return () => { delete el.dataset.hpTheme; };
  }, [darkMode]);

  const sortOptions = useMemo(() => SORT_KEYS.map(([value, key]) => ({ value, label: t(key) })), [t]);
  const rowOptions = useMemo(() => PAGE_SIZES.map((n) => ({ value: n, label: t('perPage', { count: n }) })), [t]);

  const authConfig = useMemo(() => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined), [token]);

  const { data: categories = EMPTY_LIST } = useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/categories', { ...authConfig, signal });
      const cats = res.data?.content || res.data || [];
      return Array.isArray(cats) ? cats.map((c) => ({ id: c.id, name: String(c.name || c.id) })) : [];
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const { data: products = EMPTY_LIST, isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/products', { signal });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const p of list) {
        if (!p || p.deleted) continue;
        out.push(normalizeProduct(p));
      }
      return out;
    },
    staleTime: 5 * 60 * 1000,
  });

  const priceBounds = useMemo(() => {
    const top = products.reduce((mx, p) => Math.max(mx, p.finalPrice, p.price), 0);
    const step = PRICE_STEP(top);
    return { max: Math.max(step * 10, Math.ceil(top / step) * step), step };
  }, [products]);
  const priceValue = useMemo(() => {
    if (!priceRange) return [0, priceBounds.max];
    const hi = clamp(Number(priceRange[1]) || 0, 0, priceBounds.max);
    const lo = Math.min(clamp(Number(priceRange[0]) || 0, 0, priceBounds.max), hi);
    return [lo, hi];
  }, [priceRange, priceBounds.max]);
  const deferredPriceValue = useDeferredValue(priceValue);
  const setPriceRange = useCallback((r) => {
    const hi = clamp(Number(r[1]) || 0, 0, priceBounds.max);
    const lo = Math.min(clamp(Number(r[0]) || 0, 0, priceBounds.max), hi);
    setPriceRangeState(lo <= 0 && hi >= priceBounds.max ? null : [lo, hi]);
  }, [priceBounds.max]);

  const productsByCategory = useMemo(() => {
    const map = {};
    products.forEach((p) => { if (p.categoryId != null) (map[p.categoryId] ||= []).push(p); });
    return map;
  }, [products]);

  const latestProducts = useMemo(() => products.slice(-LATEST_LIMIT), [products]);

  const baseFiltered = useMemo(() => {
    const term = fold(deferredSearch).trim();
    return products.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (term && !p._text.includes(term)) return false;
      if (inStockOnly && p.stock === 0) return false;
      if (onSaleOnly && !(p.saving > 0)) return false;
      if (savedOnly && !saved.has(p.id)) return false;
      return true;
    });
  }, [products, saved, deferredSearch, selectedCategoryId, inStockOnly, onSaleOnly, savedOnly]);

  const conditionCounts = useMemo(() => {
    const c = {};
    baseFiltered.forEach((p) => { c[p.condition] = (c[p.condition] || 0) + 1; });
    return c;
  }, [baseFiltered]);

  const histogram = useMemo(() => {
    const bins = Array(HISTOGRAM_BINS).fill(0);
    baseFiltered.forEach((p) => {
      if (selectedConditions.length && !selectedConditions.includes(p.condition)) return;
      bins[Math.min(HISTOGRAM_BINS - 1, Math.floor((p.finalPrice / priceBounds.max) * HISTOGRAM_BINS))]++;
    });
    return bins;
  }, [baseFiltered, selectedConditions, priceBounds.max]);

  const filteredProducts = useMemo(() => {
    const [lo, hi] = deferredPriceValue;
    const list = baseFiltered.filter(
      (p) => p.finalPrice >= lo && p.finalPrice <= hi && (!selectedConditions.length || selectedConditions.includes(p.condition)),
    );
    if (sortBy === 'priceLowToHigh') list.sort((a, b) => a.finalPrice - b.finalPrice);
    else if (sortBy === 'priceHighToLow') list.sort((a, b) => b.finalPrice - a.finalPrice);
    else if (sortBy === 'newest') list.sort((a, b) => b._ts - a._ts);
    else if (sortBy === 'discount') list.sort((a, b) => b.discount - a.discount);
    return list;
  }, [baseFiltered, deferredPriceValue, selectedConditions, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  useEffect(() => {
    setPage(1);
    setVisibleCount(MOBILE_BATCH);
  }, [selectedCategoryId, pageSize, deferredSearch, deferredPriceValue, selectedConditions, inStockOnly, onSaleOnly, savedOnly, sortBy]);

  const pageOffset = (currentPage - 1) * pageSize;
  const paginatedProducts = useMemo(() => filteredProducts.slice(pageOffset, pageOffset + pageSize), [filteredProducts, pageOffset, pageSize]);
  const infiniteProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);
  const listProducts = isMobile ? infiniteProducts : paginatedProducts;
  const hasMore = isMobile && visibleCount < filteredProducts.length;
  const listOffset = isMobile ? 0 : pageOffset;
  const startItem = filteredProducts.length ? listOffset + 1 : 0;
  const endItem = isMobile ? infiniteProducts.length : Math.min(pageOffset + pageSize, filteredProducts.length);

  const loadMore = useCallback(() => startTransition(() => setVisibleCount((c) => c + MOBILE_BATCH)), []);

  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);
  const scrollToTop = useCallback(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, []);
  const goToPage = useCallback((pg) => { setPage(pg); scrollToGrid(); }, [scrollToGrid]);
  const selectCategory = useCallback((id) => { setSelectedCategoryId(id); scrollToGrid(); }, [scrollToGrid]);

  const handleAddToCart = useCallback(async (product) => {
    const tk = readStorage('authToken');
    if (!tk) {
      const Swal = await loadSwal();
      const r = await Swal.fire({
        title: t('loginRequiredTitle'), text: t('loginRequiredText'), icon: 'info',
        showCancelButton: true, confirmButtonText: t('goToLogin'), cancelButtonText: t('cancel'),
      });
      if (r.isConfirmed) navigate('/login');
      return false;
    }
    try {
      const res = await api.post('/api/cart/items', { productId: product.id, quantity: 1 }, { headers: { Authorization: `Bearer ${tk}` } });
      if (res.status < 200 || res.status >= 300) throw new Error('Unexpected response');
      window.dispatchEvent(new Event('cart:updated'));
      toast({ icon: 'success', title: t('addedToCartTitle'), text: t('addedToCartText', { name: clean(product.name, 60) }), timer: 2800 });
      return true;
    } catch (err) {
      toast({ icon: 'error', title: t('addToCartFailedTitle'), text: err?.response?.data?.message, timer: 3500 });
      return false;
    }
  }, [navigate, t]);

  const clearFilters = useCallback(() => {
    setSearchTerm(''); setPriceRangeState(null); setSelectedCategoryId('all'); setSelectedConditions([]); setInStockOnly(false); setOnSaleOnly(false); setSavedOnly(false); setSortBy('relevance'); setPage(1); setVisibleCount(MOBILE_BATCH);
  }, []);
  const toggleCondition = useCallback((c) => setSelectedConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])), []);
  const resetCategory = useCallback(() => setSelectedCategoryId('all'), []);
  const resetPrice = useCallback(() => setPriceRangeState(null), []);
  const resetStock = useCallback(() => setInStockOnly(false), []);
  const resetSale = useCallback(() => setOnSaleOnly(false), []);
  const resetSaved = useCallback(() => setSavedOnly(false), []);
  const resetSearch = useCallback(() => setSearchTerm(''), []);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCategoryId !== 'all' ? 1 : 0) + selectedConditions.length + (priceRange ? 1 : 0) + (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + (savedOnly ? 1 : 0);
  const selectedCategoryName = useMemo(() => categories.find((c) => c.id === selectedCategoryId)?.name, [categories, selectedCategoryId]);
  const currency = t('currency');
  const totalCount = products.length;

  const filterPanelProps = useMemo(() => ({
    t, darkMode, categories, productsByCategory, selectedCategoryId, setSelectedCategoryId, selectedConditions, toggleCondition, conditionCounts,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, setInStockOnly, onSaleOnly, setOnSaleOnly, savedOnly, setSavedOnly,
    open, setOpen, clearFilters, activeFiltersCount, totalCount,
  }), [t, darkMode, categories, productsByCategory, selectedCategoryId, selectedConditions, toggleCondition, conditionCounts,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, onSaleOnly, savedOnly, open, clearFilters, activeFiltersCount, totalCount]);

  const k = darkMode ? 'dark' : 'light';
  const sidebarVisible = filtersOpen && !isMobile;
  const layout = isMobile ? 'grid' : viewMode;
  const wide = !sidebarVisible;
  const skeletonCols = layout === 'grid' ? (wide ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3') : 'grid-cols-1';
  const stale = searchPending || deferredPriceValue !== priceValue;
  const filterButtonOn = isMobile ? sheet === 'open' : filtersOpen;
  const pageBg = darkMode ? DARK_PAGE : 'bg-gray-50';
  const chipBtn = `${neoBtn(darkMode, false)} !min-h-9 !px-3 !py-1 !text-xs`;

  return (
    <div
      dir={dir} lang={language}
      className={`${NEO_THEME[k]} min-h-screen overflow-x-clip ${isAr ? 'font-cairo' : 'font-jakarta'} ${darkMode ? `${DARK_PAGE} text-white` : 'bg-gray-50 text-gray-900'}`}
    >
      {STYLE_EL}
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <Suspense fallback={<div className={`h-[360px] w-full animate-pulse motion-reduce:animate-none sm:h-[480px] ${darkMode ? 'bg-[#2a2a2a]' : 'bg-emerald-50'}`} />}>
        <Hero variant="devices" darkMode={darkMode} />
      </Suspense>

      <CategoryGrid
        categories={categories} productsByCategory={productsByCategory} selectedCategoryId={selectedCategoryId}
        onSelect={selectCategory} darkMode={darkMode} isAr={isAr} t={t}
      />

      {!isLoading && latestProducts.length > 0 && (
        <LatestSection products={latestProducts} darkMode={darkMode} isAr={isAr} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} t={t} />
      )}

      <section aria-label={t('allProducts')} className={darkMode ? DARK_PAGE : 'bg-gray-100'}>
        <div id="products-grid" ref={gridRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <SectionTitle darkMode={darkMode} isAr={isAr} title={t('allProducts')} subtitle={t('allProductsSubtitle')} />

          <div className="flex items-stretch gap-5 lg:gap-8">
            {sidebarVisible && (
              <aside id="filters-panel" className="hp-pop flex w-[17rem] min-w-0 flex-shrink-0 pb-2 pe-2 xl:w-[19rem]">
                <div className={`hp-sb min-w-0 flex-1 p-4 sm:p-5 ${neoCard(darkMode, 'sm')}`}>
                  <div className="sticky top-24">
                    <FilterPanel {...filterPanelProps} onClose={closeFilters} />
                  </div>
                </div>
              </aside>
            )}

            <div className="w-full min-w-0 flex-1">
              <div className={`relative z-20 mb-6 me-2 flex flex-col gap-4 p-4 sm:p-5 ${neoCard(darkMode, 'sm')}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[color:var(--txt)]" aria-live="polite">
                    {interpolateNodes(t('showing'), {
                      range: <b dir="ltr" className="tabular-nums">{startItem}–{endItem}</b>,
                      total: <b dir="ltr" className="tabular-nums">{filteredProducts.length}</b>,
                    })}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button" onClick={isMobile ? openSheet : toggleFilters}
                      aria-expanded={filterButtonOn} aria-controls="filters-panel"
                      className={neoBtn(darkMode, !isMobile && filtersOpen)}
                    >
                      <FiSliders className="h-4 w-4" aria-hidden="true" />
                      <span>{t('filters')}</span>
                      {activeFiltersCount > 0 && <span dir="ltr" className="tabular-nums">({activeFiltersCount})</span>}
                    </button>
                    <div className="hidden items-center gap-3 lg:flex">
                      <Dropdown id={`${uid}-rows`} ariaLabel={t('rowsPerPage')} value={pageSize} onChange={setPageSize} options={rowOptions} className="w-36 flex-shrink-0" />
                      {[['grid', FiGrid, t('gridView')], ['list', FiList, t('listView')]].map(([mode, Icon, label]) => (
                        <button
                          key={mode} type="button" onClick={() => setViewMode(mode)} aria-label={label} aria-pressed={viewMode === mode}
                          className={`${neoBtn(darkMode, viewMode === mode)} !w-11 !px-0`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <SearchField value={searchTerm} onChange={setSearchTerm} placeholder={t('search')} ariaLabel={t('searchAria')} clearLabel={t('clearSearch')} pending={searchPending} />
                  <Dropdown id={`${uid}-sort`} ariaLabel={t('sortProducts')} value={sortBy} onChange={setSortBy} options={sortOptions} className="w-full sm:w-56" />
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-3 pe-2">
                  {selectedCategoryId !== 'all' && <button type="button" onClick={resetCategory} className={chipBtn}><span className="max-w-[10rem] truncate">{selectedCategoryName || t('category')}</span><FiX className="h-3 w-3" aria-hidden="true" /></button>}
                  {selectedConditions.map((c) => <button key={c} type="button" onClick={() => toggleCondition(c)} className={chipBtn}><span>{condLabel(t, c)}</span><FiX className="h-3 w-3" aria-hidden="true" /></button>)}
                  {priceRange && <button type="button" onClick={resetPrice} className={chipBtn}><span dir="ltr" className="tabular-nums">{`${money(priceValue[0], currency)} – ${money(priceValue[1], currency)}`}</span><FiX className="h-3 w-3" aria-hidden="true" /></button>}
                  {inStockOnly && <button type="button" onClick={resetStock} className={chipBtn}><span>{t('inStock')}</span><FiX className="h-3 w-3" aria-hidden="true" /></button>}
                  {onSaleOnly && <button type="button" onClick={resetSale} className={chipBtn}><span>{t('onSaleOnly')}</span><FiX className="h-3 w-3" aria-hidden="true" /></button>}
                  {savedOnly && <button type="button" onClick={resetSaved} className={chipBtn}><span>{t('savedOnly')}</span><FiX className="h-3 w-3" aria-hidden="true" /></button>}
                  {searchTerm && <button type="button" onClick={resetSearch} className={chipBtn}><span className="max-w-[10rem] truncate">{`“${searchTerm.slice(0, 20)}”`}</span><FiX className="h-3 w-3" aria-hidden="true" /></button>}
                  <button type="button" onClick={clearFilters} className={`min-h-11 cursor-pointer text-xs font-extrabold underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 text-[color:var(--txt)] ${FOCUS}`}>{t('clearAll')}</button>
                </div>
              )}

              {isLoading ? (
                <div className={`grid gap-4 pb-2 pe-2 sm:gap-5 ${skeletonCols}`} role="status" aria-busy="true">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`h-[340px] animate-pulse rounded-2xl motion-reduce:animate-none sm:h-[380px] ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70'}`} />)}
                </div>
              ) : isError ? (
                <div className={`me-2 items-center px-4 py-14 text-center sm:py-20 ${neoCard(darkMode, 'sm')}`}>
                  <DeviceScene className="mx-auto mb-4 h-24 w-32" />
                  <p className="mb-2 text-lg font-extrabold uppercase text-[color:var(--txt)] sm:text-xl">{t('loadErrorTitle')}</p>
                  <p className="mb-6 text-sm font-medium text-[color:var(--mut)]">{t('loadErrorText')}</p>
                  <button type="button" onClick={() => refetch()} className={neoBtn(darkMode, true)}><FiRefreshCw className="h-4 w-4" aria-hidden="true" /> {t('tryAgain')}</button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className={`me-2 items-center px-4 py-14 text-center sm:py-24 ${neoCard(darkMode, 'sm')}`}>
                  <DeviceScene className="mx-auto mb-4 h-24 w-32" />
                  <p className="mb-2 text-lg font-extrabold uppercase text-[color:var(--txt)] sm:text-2xl">{t('noProducts')}</p>
                  <p className="mb-6 text-sm font-medium text-[color:var(--mut)] sm:text-base">{t('adjustFilters')}</p>
                  <button type="button" onClick={clearFilters} className={neoBtn(darkMode, true)}>{t('clearFilters')}</button>
                </div>
              ) : (
                <div aria-busy={stale} className={`transition-opacity duration-150 motion-reduce:transition-none ${stale ? 'opacity-70' : 'opacity-100'}`}>
                  <ProductGrid products={listProducts} layout={layout} wide={wide} darkMode={darkMode} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} t={t} />
                  {isMobile
                    ? <InfiniteSentinel hasMore={hasMore} count={filteredProducts.length} onMore={loadMore} darkMode={darkMode} t={t} />
                    : <Pagination page={currentPage} total={totalPages} onChange={goToPage} darkMode={darkMode} t={t} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showTop && (
        <div className="hp-pop fixed bottom-5 end-5 z-40">
          <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} className={`${NEO_THEME[k]} ${NEO_ICON}`}>
            <FiArrowUp className="h-5 w-5" />
          </button>
        </div>
      )}

      {sheet !== 'closed' && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('filters')}>
          <div className={`absolute inset-0 bg-black/60 ${sheet === 'leave' ? 'hp-fade-out' : 'hp-fade-in'}`} onClick={closeSheet} />
          <div
            className={`${sheet === 'leave' ? 'hp-sheet-out' : 'hp-sheet'} ${pageBg} absolute inset-x-0 bottom-0 flex max-h-[88vh] min-w-0 transform-gpu flex-col rounded-t-2xl border-t-[3px] border-[color:var(--ink)] sm:inset-y-0 sm:end-auto sm:start-0 sm:max-h-none sm:w-[22rem] sm:max-w-[90vw] sm:rounded-none sm:border-e-[3px] sm:border-t-0 md:w-96`}
          >
            <div className="hp-sb min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 pe-5">
              <FilterPanel {...filterPanelProps} onClose={closeSheet} />
            </div>
            <div className="border-t-[3px] border-[color:var(--ink)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => { closeSheet(); scrollToGrid(); }} className={`${neoBtn(darkMode, true)} w-full`}>{t('showItems', { count: filteredProducts.length })}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const Products = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <ProductsContent {...props} />
  </QueryClientProvider>
));
export { queryClient };
export default Products;