import React, {
  useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, useId, memo, useTransition, useDeferredValue, useSyncExternalStore,
} from 'react';
import { Link, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiX, FiCalendar, FiClock, FiTag, FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch, FiSliders, FiCheck,
  FiPercent, FiChevronDown,
} from 'react-icons/fi';
import { RiStoreLine } from 'react-icons/ri';
import api from '../common/api/api';
import { useModalLock, clean, safeImageUrl } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { authHeaders, expireSession, isUnauthorized, useAuthGuard } from '../common/utils/auth';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } },
});

const OFFER_TRANSLATIONS = {
  en: enTranslations.offersPage,
  ar: arTranslations.offersPage || arTranslations.hero?.offersPage,
  fr: frTranslations.offersPage || frTranslations.hero?.offersPage,
};

const LOCAL_TEXT = {
  en: {
    crumbHome: 'Home', crumbOffers: 'Offers', breadcrumb: 'Breadcrumb',
    filterAll: 'All offers', filterPercent: 'Percentage', filterFixed: 'Fixed amount', filterSoon: 'Ending soon',
    filterLabel: 'Filter offers', tryAgain: 'Try again', loadFail: "We couldn't load offers right now.",
    noMatch: 'No offers match your filters', viewOffer: 'View offer',
    offerFailed: 'Failed to load offer', pagination: 'Pagination', prevPage: 'Previous page', nextPage: 'Next page',
    page: 'Page', loading: 'Loading',
    shopNow: 'Shop now', search: 'Search offers', sortBy: 'Sort by',
    sortBest: 'Highest discount', sortEnding: 'Ending soonest', sortName: 'Name A–Z',
    discountType: 'Discount type', shops: 'Shops', allShops: 'All shops', filters: 'Filters',
    clearAll: 'Clear filters', results: 'results', newArrivals: 'New arrivals', newArrivalsHint: 'Fresh in stock at Tech-Restore',
    showResults: 'Show results',
    pageSub: 'Exclusive discounts from trusted repair and device shops. New offers land all the time.',
  },
  ar: {
    crumbHome: 'الرئيسية', crumbOffers: 'العروض', breadcrumb: 'مسار التنقل',
    filterAll: 'كل العروض', filterPercent: 'نسبة مئوية', filterFixed: 'مبلغ ثابت', filterSoon: 'تنتهي قريبًا',
    filterLabel: 'تصفية العروض', tryAgain: 'حاول مرة أخرى', loadFail: 'تعذّر تحميل العروض حاليًا.',
    noMatch: 'لا توجد عروض مطابقة', viewOffer: 'عرض التفاصيل',
    offerFailed: 'تعذّر تحميل العرض', pagination: 'الصفحات', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية',
    page: 'صفحة', loading: 'جارٍ التحميل',
    shopNow: 'تسوّق الآن', search: 'ابحث في العروض', sortBy: 'ترتيب حسب',
    sortBest: 'أعلى خصم', sortEnding: 'الأقرب انتهاءً', sortName: 'الاسم أ–ي',
    discountType: 'نوع الخصم', shops: 'المتاجر', allShops: 'كل المتاجر', filters: 'التصفية',
    clearAll: 'مسح التصفية', results: 'نتيجة', newArrivals: 'وصل حديثًا', newArrivalsHint: 'جديد في المخزون',
    showResults: 'عرض النتائج',
    pageSub: 'خصومات حصرية من متاجر صيانة وأجهزة موثوقة، وعروض جديدة طوال الوقت.',
  },
  fr: {
    crumbHome: 'Accueil', crumbOffers: 'Offres', breadcrumb: "Fil d'Ariane",
    filterAll: 'Toutes les offres', filterPercent: 'Pourcentage', filterFixed: 'Montant fixe', filterSoon: 'Bientôt terminées',
    filterLabel: 'Filtrer les offres', tryAgain: 'Réessayer', loadFail: 'Impossible de charger les offres pour le moment.',
    noMatch: 'Aucune offre ne correspond', viewOffer: "Voir l'offre",
    offerFailed: "Échec du chargement de l'offre", pagination: 'Pagination', prevPage: 'Page précédente', nextPage: 'Page suivante',
    page: 'Page', loading: 'Chargement',
    shopNow: 'Acheter', search: 'Rechercher une offre', sortBy: 'Trier par',
    sortBest: 'Meilleure remise', sortEnding: 'Fin la plus proche', sortName: 'Nom A–Z',
    discountType: 'Type de remise', shops: 'Boutiques', allShops: 'Toutes les boutiques', filters: 'Filtres',
    clearAll: 'Effacer les filtres', results: 'résultats', newArrivals: 'Nouveautés', newArrivalsHint: 'Tout juste en stock',
    showResults: 'Voir les résultats',
    pageSub: 'Remises exclusives de boutiques de réparation et d’appareils de confiance. De nouvelles offres arrivent sans cesse.',
  },
};

const tr = (language, key) =>
  OFFER_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  OFFER_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

const NB_CSS = `
.nb{--nb-bg:#f3f6f4;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#5b7468;--nb-line:#e3e9e6;--nb-line2:#cfdad4;--nb-shadow:rgba(4,38,26,.1);--nb-gray:#eef3f0;--nb-media:#ffffff;--nb-accent:#059669;--nb-btn:#047857;--nb-on:#ffffff;--nb-glow:rgba(16,185,129,.12);--nb-ring:rgba(16,185,129,.5);--nb-scrim:rgba(4,38,26,.55);background-color:var(--nb-bg);background-image:radial-gradient(52rem 22rem at 90% -6rem,var(--nb-glow),transparent 68%),radial-gradient(40rem 20rem at -8% 28rem,var(--nb-glow),transparent 70%);background-repeat:no-repeat;color:var(--nb-ink);color-scheme:light;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.nb-dark{--nb-bg:#06261b;--nb-card:#0b3427;--nb-ink:#ecfdf5;--nb-muted:#8fb8a6;--nb-line:rgba(167,243,208,.14);--nb-line2:rgba(167,243,208,.26);--nb-shadow:rgba(2,20,14,.45);--nb-gray:#104534;--nb-media:#0f4231;--nb-accent:#34d399;--nb-btn:#10b981;--nb-on:#022c22;--nb-glow:rgba(52,211,153,.09);--nb-ring:rgba(52,211,153,.55);--nb-scrim:rgba(3,30,21,.72);color-scheme:dark}
.nb[lang=ar] *{letter-spacing:0!important}
.nb button,.nb input{font-family:inherit}
.nb-gray{background:var(--nb-gray)}
.nb-media{background:var(--nb-media)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:1px solid var(--nb-line);border-radius:1.25rem;box-shadow:0 1px 2px var(--nb-shadow);transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s ease,border-color .25s ease}
@media (hover:hover){.nb-lift:hover{transform:translate3d(0,-3px,0);box-shadow:0 16px 32px -16px var(--nb-shadow);border-color:var(--nb-accent)}}
.nb-bar{display:inline-block;width:28px;height:6px;border-radius:999px;background:linear-gradient(90deg,var(--nb-accent),#059669)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--nb-card);color:var(--nb-ink);border:1px solid var(--nb-line2);border-radius:999px;font-weight:700;cursor:pointer;transition:transform .18s cubic-bezier(.2,.8,.2,1),background-color .18s ease,border-color .18s ease,filter .18s ease,box-shadow .18s ease,opacity .18s ease}
.nb-btn:not(.nb-btn-a):not(.nb-btn-on):hover:not(:disabled){background:var(--nb-gray);border-color:var(--nb-accent)}
@media (hover:hover){.nb-btn:hover:not(:disabled){transform:translate3d(0,-1px,0)}}
.nb-btn:active:not(:disabled){transform:scale(.97)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{position:relative;overflow:hidden;isolation:isolate;background:linear-gradient(135deg,#10b981 0%,#059669 50%,#047857 100%);color:#ffffff;border-color:transparent;box-shadow:0 12px 24px -12px rgba(4,120,87,.85),inset 0 1px 0 rgba(255,255,255,.28)}
.nb-btn-a::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.34) 50%,transparent 70%);transform:translate3d(-130%,0,0);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.nb-btn-a:hover:not(:disabled)::after,.nb-zoom:hover .nb-btn-a::after{transform:translate3d(130%,0,0)}
.nb-btn-a:hover:not(:disabled),.nb-btn-on:hover:not(:disabled){filter:brightness(1.07);border-color:transparent;box-shadow:0 16px 28px -12px rgba(4,120,87,.95),inset 0 1px 0 rgba(255,255,255,.32)}
.nb-btn:focus-visible,.nb-focus:focus-visible{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:1px solid var(--nb-line2);border-radius:999px;transition:box-shadow .18s ease,border-color .18s ease}
.nb-field:focus-within,.nb-field:hover{border-color:var(--nb-accent)}
.nb-field:focus-within{box-shadow:0 0 0 3px var(--nb-ring)}
.nb-field::placeholder,.nb-field input::placeholder{color:var(--nb-muted)}
.nb-flip{display:inline-block}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:1px dashed var(--nb-line2);border-radius:1.5rem}
.nb-sk{background:linear-gradient(90deg,var(--nb-gray) 25%,color-mix(in srgb,var(--nb-gray) 45%,var(--nb-card)) 50%,var(--nb-gray) 75%);background-size:220% 100%;border-radius:.75rem;animation:nbShimmer 1.5s linear infinite}
@keyframes nbShimmer{from{background-position:120% 0}to{background-position:-120% 0}}
.nb-opt{transition:background-color .15s ease,color .15s ease,transform .15s ease}
.nb-opt:active:not(:disabled){transform:scale(.98)}
@media (hover:hover){.nb-zoom img{transition:transform .6s cubic-bezier(.22,.8,.2,1)}.nb-zoom:hover img{transform:scale3d(1.06,1.06,1)}}
@keyframes nbIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.nb-in{animation:nbIn .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*40ms)}
@keyframes nbRise{from{opacity:0;transform:translate3d(0,16px,0)}to{opacity:1;transform:none}}
.nb-rise{animation:nbRise .55s cubic-bezier(.16,.84,.24,1) both;animation-delay:calc(var(--d,0)*70ms)}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-btn-a::after,.nb-field,.nb-opt,.nb-zoom img{transition:none}.nb-lift:hover,.nb-btn:hover:not(:disabled),.nb-zoom:hover img{transform:none}.nb-in,.nb-rise,.nb-sk{animation:none!important}}
`;

const PAGE_CSS = `
  ${EXTRAS_CSS}
  @keyframes ofFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ofFadeOut { from { opacity: 1; } to { opacity: 0; } }
  .of-fade { animation: ofFade .18s ease-out both; }
  .of-fade-out { animation: ofFadeOut .18s ease-in both; }
  @keyframes ofModal { from { opacity: 0; transform: translate3d(0, 24px, 0) scale(.98); } to { opacity: 1; transform: none; } }
  @keyframes ofModalOut { from { opacity: 1; transform: none; } to { opacity: 0; transform: translate3d(0, 24px, 0) scale(.98); } }
  .of-modal { animation: ofModal .24s cubic-bezier(.2,.8,.2,1) both; }
  .of-modal-out { animation: ofModalOut .18s ease-in both; }
  @keyframes ofDrawer { from { transform: translate3d(calc(var(--dx, 1) * -100%), 0, 0); } to { transform: none; } }
  @keyframes ofDrawerOut { from { transform: none; } to { transform: translate3d(calc(var(--dx, 1) * -100%), 0, 0); } }
  .of-drawer { animation: ofDrawer .26s cubic-bezier(.2,.8,.2,1) both; }
  .of-drawer-out { animation: ofDrawerOut .18s ease-in both; }
  @keyframes ofPop { from { opacity: 0; transform: translate3d(0, -6px, 0) scale(.98); } to { opacity: 1; transform: none; } }
  .of-pop { animation: ofPop .16s cubic-bezier(.2,.8,.2,1) both; transform-origin: top; }
  .of-grid { content-visibility: auto; contain-intrinsic-size: auto 600px; }
  @media (prefers-reduced-motion: reduce) { .of-fade, .of-fade-out, .of-modal, .of-modal-out, .of-drawer, .of-drawer-out, .of-pop { animation: none; } }
  ${NB_CSS}
`;
if (typeof document !== 'undefined' && !document.querySelector('style[data-offers-styles]')) {
  const tag = document.createElement('style');
  tag.setAttribute('data-offers-styles', 'true');
  tag.textContent = PAGE_CSS;
  document.head.appendChild(tag);
}

const PAGE_SIZE = 12;
const SOON_DAYS = 3;
const LATEST_LIMIT = 4;
const OFFERS_CAP = 500;
const QUERY_MAX = 80;
const PAGE_MAX = 10000;
const LEAVE_MS = 180;
const ID_RE = /^[\w-]{1,64}$/;
const DESKTOP_Q = '(min-width: 1024px)';
const REDUCED_Q = '(prefers-reduced-motion: reduce)';
const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };
const EMPTY_LIST = [];
const EMPTY_OFFER = { discountType: '', discountValue: 0, status: 'INACTIVE' };
const DEFAULTS = { type: 'all', sort: 'best', page: '1' };
const SORTS = [['best', 'sortBest'], ['ending', 'sortEnding'], ['name', 'sortName']];
const GRID = 'grid grid-cols-1 gap-5 min-[720px]:grid-cols-2';
const RISE = Array.from({ length: 6 }, (_, i) => ({ '--d': i }));
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ '--i': i }));
const BTN_CLS = 'nb-btn min-h-11 px-4 text-sm';
const SK_OFFERS = [0, 1, 2, 3, 4, 5];
const SK_LATEST = [0, 1, 2, 3];
const SK_ROWS = [0, 1, 2, 3];

const TILE_TONES = {
  em: 'bg-emerald-500 text-white', sky: 'bg-sky-500 text-white', vi: 'bg-violet-500 text-white',
  am: 'bg-amber-400 text-emerald-950', ro: 'bg-rose-500 text-white', te: 'bg-teal-500 text-white',
};

const prefersReduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_Q).matches;

const subscribeDesktop = (cb) => {
  const m = window.matchMedia(DESKTOP_Q);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const getDesktop = () => window.matchMedia(DESKTOP_Q).matches;
const getDesktopServer = () => false;
const useIsDesktop = () => useSyncExternalStore(subscribeDesktop, getDesktop, getDesktopServer);

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

const IconTile = memo(({ Icon, tone = 'em', className = 'h-9 w-9', iconClassName = 'h-4 w-4' }) => (
  <span aria-hidden="true" className={`flex flex-shrink-0 items-center justify-center rounded-full ${TILE_TONES[tone] || TILE_TONES.em} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const numCache = {};
const money = (n, language) => {
  const loc = LOCALES[language] || 'en-GB';
  numCache[loc] ||= new Intl.NumberFormat(loc, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `EGP ${numCache[loc].format(Number(n || 0))}`;
};

const fmtCache = {};
const dateFmt = (language, withYear) => {
  const loc = LOCALES[language] || 'en-GB';
  const k = `${loc}:${withYear}`;
  fmtCache[k] ||= new Intl.DateTimeFormat(loc, withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
  return fmtCache[k];
};
const rtfCache = {};
const rtf = (language) => {
  const loc = LOCALES[language] || 'en-GB';
  rtfCache[loc] ||= new Intl.RelativeTimeFormat(loc, { numeric: 'auto' });
  return rtfCache[loc];
};

const toDate = (v) => {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysLeftNum = (end) => {
  const e = toDate(end);
  if (!e) return null;
  const diff = Math.ceil((e - new Date()) / 86400000);
  return diff < 0 ? null : diff;
};

const formatRange = (start, end, language) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '';
  return `${dateFmt(language, false).format(s)} — ${dateFmt(language, true).format(e)}`;
};

const normType = (t) => {
  const s = String(t ?? '').toUpperCase();
  if (s === 'PERCENTAGE' || s === 'PERCENT') return 'PERCENTAGE';
  if (s === 'FIXED_AMOUNT' || s === 'FIXED_VALUE' || s === 'FIXED') return 'FIXED_AMOUNT';
  return '';
};

const normalizeOffer = (o) => {
  const type = normType(o.discountType);
  const isPct = type === 'PERCENTAGE';
  const raw = Math.max(0, Number(o.discountValue) || 0);
  return {
    id: String(o.id),
    name: clean(String(o.name ?? ''), 120),
    description: o.description ? clean(String(o.description), 600) : '',
    discountType: type,
    discountValue: isPct ? Math.min(raw, 100) : raw,
    startDate: o.startDate || null,
    endDate: o.endDate || null,
    status: o.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    shopId: o.shopId != null ? String(o.shopId) : '',
    shopName: o.shopName ? clean(String(o.shopName), 80) : '',
  };
};

const round2 = (n) => Math.round(n * 100) / 100;

const normalizeLatest = (p) => {
  const price = Math.max(0, Number(p.price) || 0);
  const apiFinal = Number(p.finalPrice);
  const dv = Number(p.discountValue) || 0;
  const type = normType(p.discountType);
  let finalPrice = price;
  if (apiFinal > 0 && apiFinal < price) finalPrice = apiFinal;
  else if (dv > 0 && type === 'PERCENTAGE') finalPrice = dv < 100 ? round2((price * (100 - dv)) / 100) : price;
  else if (dv > 0 && type === 'FIXED_AMOUNT') finalPrice = dv < price ? round2(price - dv) : price;
  else {
    const legacy = Math.min(100, Math.max(0, Number(p.discount) || 0));
    if (legacy) finalPrice = round2((price * (100 - legacy)) / 100);
  }
  const saving = round2(Math.max(0, price - finalPrice));
  return {
    id: String(p.id),
    name: clean(String(p.name ?? ''), 120),
    categoryName: clean(String(p.categoryName ?? ''), 60),
    price,
    finalPrice,
    saving,
    pct: saving > 0 && price > 0 ? Math.max(1, Math.round((saving / price) * 100)) : 0,
    img: safeImageUrl(p.imageUrl || p.image) || '',
    ts: Date.parse(p.createdAt) || 0,
    num: Number(p.id) || 0,
  };
};

const shopPath = (id) => `/shops/${encodeURIComponent(id)}`;
const findInList = (qc, id) => (qc.getQueryData(['offers']) || []).find((o) => o.id === id);
const safeParam = (v) => (v && ID_RE.test(v) ? v : '');

const isSoon = (o) => o.status === 'ACTIVE' && o.days !== null && o.days <= SOON_DAYS;

const FILTERS = [
  ['all', 'filterAll', () => true],
  ['percent', 'filterPercent', (o) => o.discountType === 'PERCENTAGE'],
  ['fixed', 'filterFixed', (o) => o.discountType === 'FIXED_AMOUNT'],
  ['soon', 'filterSoon', isSoon],
];
const FILTER_FN = Object.fromEntries(FILTERS.map(([key, , fn]) => [key, fn]));

const offerScore = (o) => (o.discountType === 'PERCENTAGE' ? o.discountValue : 0);

const sortOffers = (list, sort, language) => {
  const out = list.slice();
  if (sort === 'ending') out.sort((a, b) => (a.days ?? 1e9) - (b.days ?? 1e9));
  else if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, language));
  else out.sort((a, b) => offerScore(b) - offerScore(a) || b.discountValue - a.discountValue);
  return out;
};

const useOfferMeta = (offer, language) =>
  useMemo(() => {
    const days = daysLeftNum(offer.endDate);
    const isPct = offer.discountType === 'PERCENTAGE';
    const isFixed = offer.discountType === 'FIXED_AMOUNT';
    return {
      isPct,
      isFixed,
      isActive: offer.status === 'ACTIVE',
      remaining: days === null ? null : rtf(language).format(days, 'day'),
      urgent: days !== null && days <= SOON_DAYS,
      range: formatRange(offer.startDate, offer.endDate, language),
      amount: isPct ? `${offer.discountValue}%` : isFixed ? money(offer.discountValue, language) : String(offer.discountValue),
    };
  }, [offer, language]);

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navType]);
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

const Crumbs = memo(({ t }) => (
  <nav aria-label={t('breadcrumb')} className="nb-muted flex flex-wrap items-center gap-2 text-sm font-medium">
    <Link to="/" className="nb-focus rounded transition-colors hover:text-[color:var(--nb-ink)] hover:underline">{t('crumbHome')}</Link>
    <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" />
    <span aria-current="page" className="text-[color:var(--nb-ink)]">{t('crumbOffers')}</span>
  </nav>
));

const Sk = ({ className = '' }) => <div aria-hidden="true" className={`nb-sk ${className}`} />;

const TicketCut = memo(() => (
  <div aria-hidden="true" className="relative h-0">
    <span className="nb-line absolute -start-3 -top-3 h-6 w-6 rounded-full border bg-[color:var(--nb-bg)]" />
    <span className="nb-line absolute -end-3 -top-3 h-6 w-6 rounded-full border bg-[color:var(--nb-bg)]" />
    <span className="nb-line absolute inset-x-5 -top-px border-t border-dashed" />
  </div>
));

const plainNums = {};
const plainNum = (n, language) => {
  const loc = LOCALES[language] || 'en-GB';
  plainNums[loc] ||= new Intl.NumberFormat(loc, { maximumFractionDigits: 2 });
  return plainNums[loc].format(n);
};
const pad = (n) => String(n).padStart(2, '0');

const OfferDefs = memo(({ gid }) => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${gid}front`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#047857" /></linearGradient>
      <linearGradient id={`${gid}tag`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
    </defs>
  </svg>
));

const OfferArt = memo(({ gid, className = '' }) => (
  <svg viewBox="0 0 160 120" className={className} role="presentation" aria-hidden="true" focusable="false">
    <ellipse cx="78" cy="109" rx="56" ry="7" fill="#04261a" opacity=".18" />
    <polygon points="26,62 56,50 118,50 88,62" fill="#a7f3d0" />
    <rect x="26" y="62" width="62" height="44" rx="3" fill={`url(#${gid}front)`} />
    <polygon points="88,62 118,50 118,94 88,106" fill="#065f46" />
    <rect x="51" y="62" width="12" height="44" fill="#fbbf24" />
    <polygon points="51,62 63,62 93,50 81,50" fill="#fde68a" />
    <polygon points="88,78 118,66 118,74 88,86" fill="#d97706" />
    <path d="M72 52c-10-14-26-10-22-3 3 5 14 5 22 3zM72 52c10-14 26-10 22-3-3 5-14 5-22 3z" fill="#f59e0b" />
    <circle cx="72" cy="52" r="4" fill="#fbbf24" />
    <rect x="26" y="62" width="10" height="44" rx="3" fill="#fff" opacity=".16" />
    <g transform="translate(96 8) rotate(12)">
      <rect x="2" y="4" width="54" height="40" rx="9" fill="#b45309" opacity=".35" />
      <rect x="0" y="0" width="54" height="40" rx="9" fill={`url(#${gid}tag)`} />
      <rect x="0" y="0" width="54" height="12" rx="9" fill="#fff" opacity=".25" />
      <circle cx="8" cy="20" r="3.5" fill="#fff" opacity=".9" />
      <circle cx="25" cy="15" r="4.5" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="41" cy="28" r="4.5" fill="none" stroke="#fff" strokeWidth="3" />
      <line x1="43" y1="11" x2="24" y2="32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </g>
    <path d="M0-6 1.5-1.5 6 0 1.5 1.5 0 6-1.5 1.5-6 0-1.5-1.5z" fill="#34d399" transform="translate(16 36)" />
    <path d="M0-6 1.5-1.5 6 0 1.5 1.5 0 6-1.5 1.5-6 0-1.5-1.5z" fill="#fbbf24" transform="translate(146 76) scale(.8)" />
  </svg>
));

const OfferCard = memo(({ offer, index, gid, language, onViewDetail, t }) => {
  const meta = useOfferMeta(offer, language);
  const open = useCallback(() => onViewDetail(offer.id), [onViewDetail, offer.id]);
  const onButton = useCallback((e) => { e.stopPropagation(); onViewDetail(offer.id); }, [onViewDetail, offer.id]);
  const stop = useCallback((e) => e.stopPropagation(), []);
  const hasDiscount = offer.discountValue > 0;
  return (
    <article
      aria-label={offer.name}
      onClick={open}
      style={STAGGER[Math.min(index % PAGE_SIZE, 11)]}
      className={`nb-in nb-card nb-lift relative flex h-full cursor-pointer ${meta.isActive ? '' : 'opacity-80'}`}
    >
      <div className="nb-gray nb-line relative flex w-28 flex-none flex-col items-center justify-between rounded-s-[1.2rem] border-e border-dashed px-2 pb-1 pt-3 sm:w-36">
        <span aria-hidden="true" className="nb-line absolute -end-[0.7rem] -top-[0.8rem] z-10 h-5 w-5 rounded-full border bg-[color:var(--nb-bg)] [clip-path:inset(50%_0_0_0)]" />
        <span aria-hidden="true" className="nb-line absolute -bottom-[0.8rem] -end-[0.7rem] z-10 h-5 w-5 rounded-full border bg-[color:var(--nb-bg)] [clip-path:inset(0_0_50%_0)]" />
        {hasDiscount ? (
          <div className="flex flex-col items-center leading-none" dir="ltr">
            <div className="flex items-baseline gap-0.5">
              {meta.isFixed && <span className="text-xs font-extrabold">EGP</span>}
              <span className="text-3xl font-black tabular-nums tracking-tight">{plainNum(offer.discountValue, language)}</span>
              {meta.isPct && <FiPercent aria-hidden="true" className="h-5 w-5 self-center" strokeWidth={3} />}
            </div>
            <span className="nb-ic mt-1 text-[10px] font-extrabold uppercase tracking-widest">{t('off')}</span>
          </div>
        ) : (
          <IconTile Icon={FiTag} tone="em" className="h-10 w-10" iconClassName="h-5 w-5" />
        )}
        <OfferArt gid={gid} className="h-16 w-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span dir="ltr" className="nb-gray rounded-full px-2.5 py-0.5 text-xs font-extrabold tabular-nums">{pad(index + 1)}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white ${meta.isActive ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {meta.isActive ? t('active') : t('inactive')}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-extrabold leading-snug">{offer.name}</h3>
        <p className="nb-muted line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-5">
          {offer.description || t('descriptionFallback')}
        </p>
        <div className="nb-line flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-2.5 text-[11px]">
          {offer.shopName && offer.shopId ? (
            <Link to={shopPath(offer.shopId)} onClick={stop} className="nb-focus flex min-w-0 items-center gap-1.5 rounded font-bold hover:underline">
              <RiStoreLine aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{offer.shopName}</span>
            </Link>
          ) : offer.shopName ? (
            <span className="flex min-w-0 items-center gap-1.5 font-bold">
              <RiStoreLine aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{offer.shopName}</span>
            </span>
          ) : <span />}
          {meta.remaining && (
            <span className={`flex items-center gap-1 font-semibold ${meta.urgent && meta.isActive ? 'text-orange-500' : 'nb-muted'}`}>
              <FiClock aria-hidden="true" className="h-3 w-3 flex-shrink-0" />{meta.remaining}
            </span>
          )}
        </div>
        <button type="button" onClick={onButton} className="nb-btn nb-btn-a mt-auto min-h-10 w-full px-3 text-xs">
          {t('viewOffer')}
        </button>
      </div>
    </article>
  );
});

const ProductCard = memo(({ product, darkMode, language, t }) => {
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);
  return (
    <Link
      to={`/device/${encodeURIComponent(product.id)}`}
      className="nb-card nb-lift nb-zoom nb-focus group relative flex min-w-0 flex-col overflow-hidden"
    >
      <div className="nb-media relative flex aspect-square items-center justify-center overflow-hidden">
        {product.img && !failed ? (
          <img
            src={product.img} alt={product.name} width={320} height={320} loading="lazy" decoding="async"
            referrerPolicy="no-referrer" onError={onError} className="h-full w-full object-contain p-4"
          />
        ) : (
          <IsoIllustration type="offers" tone="emerald" onGreen={false} darkMode={darkMode} className="h-1/2 w-1/2" />
        )}
        {product.pct > 0 && (
          <span dir="ltr" className="absolute start-3 top-3 rounded-full bg-[color:var(--nb-btn)] px-2.5 py-1 text-xs font-extrabold tabular-nums text-[color:var(--nb-on)]">-{product.pct}%</span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3 pb-4">
        {product.categoryName && <span className="nb-muted truncate text-xs font-medium">{product.categoryName}</span>}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5">{product.name}</h3>
      </div>
      <TicketCut />
      <div className="flex flex-1 flex-col gap-2 p-3 pt-4">
        <div dir="ltr" className="flex flex-wrap items-baseline gap-x-2">
          <span className="nb-ic text-base font-extrabold tabular-nums">{money(product.finalPrice, language)}</span>
          {product.saving > 0 && <span className="nb-muted text-xs tabular-nums line-through">{money(product.price, language)}</span>}
        </div>
        <span className="nb-btn nb-btn-a mt-auto min-h-10 px-4 text-sm">{t('shopNow')}</span>
      </div>
    </Link>
  );
});

const OfferSkeleton = memo(() => (
  <div className="nb-card flex h-[216px]">
    <div className="nb-line flex w-28 flex-none flex-col items-center justify-between border-e border-dashed px-2 py-4 sm:w-36">
      <Sk className="h-8 w-16" />
      <Sk className="h-14 w-full" />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
      <div className="flex justify-between"><Sk className="h-5 w-10 !rounded-full" /><Sk className="h-5 w-16 !rounded-full" /></div>
      <Sk className="h-4 w-4/5" />
      <Sk className="h-3 w-full" />
      <Sk className="h-3 w-2/3" />
      <Sk className="mt-auto h-10 w-full !rounded-full" />
    </div>
  </div>
));

const Skeletons = memo(({ label }) => (
  <div className={GRID} role="status" aria-busy="true" aria-label={label}>
    {SK_OFFERS.map((i) => <OfferSkeleton key={i} />)}
  </div>
));

const ToolbarSkeleton = memo(() => (
  <div aria-hidden="true" className="mb-5 flex flex-wrap items-center gap-3">
    <Sk className="h-11 min-w-0 flex-1 basis-60 !rounded-full" />
    <Sk className="h-11 w-40 !rounded-full" />
  </div>
));

const FilterSkeleton = memo(() => (
  <div aria-hidden="true" className="nb-card space-y-6 self-start p-4">
    {[0, 1].map((g) => (
      <div key={g} className="space-y-2">
        <Sk className="h-4 w-24" />
        {SK_ROWS.map((r) => <Sk key={r} className="h-10 w-full !rounded-xl" />)}
      </div>
    ))}
  </div>
));

const LatestSkeleton = memo(() => (
  <div aria-hidden="true" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {SK_LATEST.map((i) => (
      <div key={i} className="nb-card overflow-hidden">
        <Sk className="aspect-square w-full !rounded-none" />
        <div className="space-y-2 p-3"><Sk className="h-3 w-1/3" /><Sk className="h-4 w-full" /><Sk className="h-5 w-1/2" /><Sk className="h-10 w-full !rounded-full" /></div>
      </div>
    ))}
  </div>
));

const StateBox = memo(({ darkMode, label, hint, onRetry, fetching, retryLabel }) => (
  <div className="nb-dot nb-in flex flex-col items-center px-4 py-14 text-center">
    <IsoIllustration type="offers" tone="emerald" darkMode={darkMode} onGreen={false} className="mb-3 h-28 w-28" />
    <p className="text-base font-extrabold">{label}</p>
    {hint && <p className="nb-muted mt-1 text-sm font-medium">{hint}</p>}
    {onRetry && (
      <button type="button" onClick={() => onRetry()} className={`mt-5 nb-btn-a ${BTN_CLS}`}>
        <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />{retryLabel}
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

const FilterGroup = memo(({ title, children }) => (
  <fieldset className="nb-line border-b py-4 first:pt-0 last:border-b-0 last:pb-0">
    <legend className="mb-2 text-sm font-extrabold">{title}</legend>
    <div className="flex flex-col gap-1">{children}</div>
  </fieldset>
));

const FilterOption = memo(({ active, label, count, onClick }) => {
  const disabled = count === 0 && !active;
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`nb-opt nb-focus flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-start text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-[color:var(--nb-btn)] text-[color:var(--nb-on)]' : 'hover:bg-[color:var(--nb-gray)]'
      }`}
    >
      <span aria-hidden="true" className={`nb-line inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${active ? '!border-current' : ''}`}>
        {active && <FiCheck className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span dir="ltr" className={`text-xs tabular-nums ${active ? 'opacity-80' : 'nb-muted'}`}>{count}</span>
    </button>
  );
});

const FilterPanel = memo(({ type, typeCounts, onType, shop, shops, onShop, t }) => (
  <div>
    <FilterGroup title={t('discountType')}>
      {FILTERS.map(([key, labelKey]) => (
        <FilterOption key={key} active={type === key} label={t(labelKey)} count={typeCounts[key]} onClick={() => onType(key)} />
      ))}
    </FilterGroup>
    {shops.length > 0 && (
      <FilterGroup title={t('shops')}>
        <FilterOption active={!shop} label={t('allShops')} count={shops.reduce((n, s) => n + s.count, 0)} onClick={() => onShop('')} />
        {shops.map((s) => (
          <FilterOption key={s.id} active={shop === s.id} label={s.name} count={s.count} onClick={() => onShop(s.id)} />
        ))}
      </FilterGroup>
    )}
  </div>
));

const FilterDrawer = memo(({ onClose, t, total, onClear, hasFilters, children }) => {
  const [leaving, requestClose] = useLeave(onClose);
  useModalLock(true, requestClose);
  return (
    <div className="fixed inset-0 z-[1100] [--dx:1] rtl:[--dx:-1]" role="dialog" aria-modal="true" aria-label={t('filters')}>
      <div className={`${leaving ? 'of-fade-out' : 'of-fade'} absolute inset-0 bg-[color:var(--nb-scrim)] backdrop-blur-[2px]`} onClick={requestClose} aria-hidden="true" />
      <div className={`nb-card ${leaving ? 'of-drawer-out' : 'of-drawer'} absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col !rounded-none`}>
        <div className="nb-gray nb-line flex items-center justify-between border-b p-4">
          <h2 className="text-base font-extrabold">{t('filters')}</h2>
          <button type="button" onClick={requestClose} aria-label={t('close')} className="nb-btn h-9 w-9">
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        <div className="nb-line flex gap-2 border-t p-4">
          {hasFilters && (
            <button type="button" onClick={onClear} className="nb-btn min-h-11 flex-1 text-sm">{t('clearAll')}</button>
          )}
          <button type="button" onClick={requestClose} className="nb-btn nb-btn-a min-h-11 flex-[2] text-sm">
            {t('showResults')} (<span dir="ltr" className="tabular-nums">{total}</span>)
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
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
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
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef} id={`${id}-list`} role="listbox" tabIndex={-1} aria-label={label}
          aria-activedescendant={`${id}-opt-${active}`} onKeyDown={onListKey}
          className="nb-card of-pop absolute end-0 z-30 mt-2 w-56 max-w-[calc(100vw-2rem)] overflow-hidden !rounded-2xl p-1.5 shadow-xl outline-none"
        >
          {options.map(([k, text], i) => {
            const isSel = k === value;
            return (
              <li
                key={k} id={`${id}-opt-${i}`} role="option" aria-selected={isSel}
                onMouseEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`nb-opt flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm ${i === active ? 'nb-gray' : ''} ${isSel ? 'font-extrabold' : 'font-medium'}`}
              >
                <span className="min-w-0 flex-1 truncate">{text}</span>
                {isSel && <FiCheck aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" strokeWidth={3} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

const InfoRow = memo(({ Icon, tone, label, value }) => (
  <div className="nb-gray flex items-center gap-3 rounded-2xl p-3">
    <IconTile Icon={Icon} tone={tone} className="h-9 w-9" iconClassName="h-4 w-4" />
    <div className="min-w-0 flex-1">
      <p className="nb-muted text-xs font-semibold">{label}</p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  </div>
));

const OfferDetailModal = memo(({ offerId, language, onClose, t }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [leaving, requestClose] = useLeave(onClose);
  useModalLock(true, requestClose);

  const validId = ID_RE.test(offerId);
  const { data: offer, isLoading, isError, error } = useQuery({
    queryKey: ['offerDetail', offerId],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get(`/api/users/offers/${encodeURIComponent(offerId)}`, { headers: authHeaders(), signal });
        if (!data || data.id == null) throw Object.assign(new Error('Invalid offer response'), { response: { status: 404 } });
        return normalizeOffer(data);
      } catch (err) {
        if (!isUnauthorized(err) && !signal?.aborted) {
          const cached = findInList(qc, offerId);
          if (cached) return cached;
        }
        throw err;
      }
    },
    enabled: validId,
    staleTime: 60 * 1000,
    placeholderData: () => findInList(qc, offerId),
  });

  useEffect(() => {
    if (!isError) return;
    if (isUnauthorized(error)) expireSession(navigate);
    else toast({ icon: 'error', title: tr(language, 'offerFailed'), timer: 3500 });
  }, [isError, error, navigate, language]);

  const meta = useOfferMeta(offer || EMPTY_OFFER, language);
  const shopLink = offer?.shopId ? shopPath(offer.shopId) : null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={offer?.name || t('offerDetails')}>
      <div className={`${leaving ? 'of-fade-out' : 'of-fade'} absolute inset-0 bg-[color:var(--nb-scrim)] backdrop-blur-[2px]`} onClick={requestClose} aria-hidden="true" />
      <div className={`nb-card ${leaving ? 'of-modal-out' : 'of-modal'} relative flex max-h-[92vh] w-full flex-col overflow-hidden !rounded-b-none shadow-2xl sm:max-w-md sm:!rounded-3xl`}>
        <header className="nb-gray nb-line flex flex-shrink-0 items-center gap-3 border-b px-4 py-3.5 sm:px-5">
          <IconTile Icon={FiTag} tone="em" className="h-10 w-10" iconClassName="h-5 w-5" />
          <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-extrabold">{offer?.name || t('offerDetails')}</h2>
          <button type="button" onClick={requestClose} aria-label={t('close')} className="nb-btn h-9 w-9 flex-shrink-0">
            <FiX aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {isLoading ? (
            <div className="space-y-3" role="status" aria-label={t('loading')}>
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-4/5" />
              <Sk className="h-16 w-full !rounded-2xl" />
              <Sk className="h-16 w-full !rounded-2xl" />
            </div>
          ) : offer ? (
            <>
              {offer.description && <p className="nb-muted text-sm leading-relaxed">{offer.description}</p>}
              <InfoRow Icon={FiTag} tone="em" label={t('youSave')} value={meta.amount} />
              {meta.range && <InfoRow Icon={FiCalendar} tone="sky" label={t('validPeriod')} value={<span dir="ltr">{meta.range}</span>} />}
              {meta.remaining && <InfoRow Icon={FiClock} tone="am" label={meta.isActive ? t('active') : t('inactive')} value={meta.remaining} />}
              {offer.shopName && <InfoRow Icon={RiStoreLine} tone="vi" label={t('shop')} value={offer.shopName} />}
            </>
          ) : (
            <p className="nb-muted py-10 text-center text-sm font-bold">{t('notFound')}</p>
          )}
        </div>

        <footer className={`nb-line grid flex-shrink-0 gap-3 border-t px-4 py-3.5 sm:px-5 ${shopLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button type="button" onClick={requestClose} className={BTN_CLS}>{t('close')}</button>
          {shopLink && (
            <Link to={shopLink} onClick={onClose} className={`nb-btn-a ${BTN_CLS}`}>
              <RiStoreLine aria-hidden="true" className="h-4 w-4" />{t('visitShop')}
            </Link>
          )}
        </footer>
      </div>
    </div>
  );
});

const OffersContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const t = useCallback((key) => tr(language, key), [language]);
  const token = useAuthGuard();
  const isDesktop = useIsDesktop();
  useScrollTopOnEnter();

  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef(null);
  const gid = useId().replace(/:/g, '');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const typeParam = params.get('type');
  const type = FILTER_FN[typeParam] ? typeParam : DEFAULTS.type;
  const sortParam = params.get('sort');
  const sort = SORTS.some(([k]) => k === sortParam) ? sortParam : DEFAULTS.sort;
  const shop = safeParam(params.get('shop'));
  const page = Math.min(PAGE_MAX, Math.max(1, parseInt(params.get('page'), 10) || 1));

  useEffect(() => { document.title = 'Exclusive Offers | Tech-Restore'; }, []);
  useEffect(() => { if (isDesktop) setDrawerOpen(false); }, [isDesktop]);

  const update = useCallback((patch) => {
    startTransition(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!('page' in patch)) next.delete('page');
        for (const [k, v] of Object.entries(patch)) {
          if (v == null || v === '' || DEFAULTS[k] === String(v)) next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      }, { replace: true });
    });
  }, [setParams]);

  const { data: offers = EMPTY_LIST, isPending: offersPending, isError, isFetching, error, refetch } = useQuery({
    queryKey: ['offers'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/offers', { headers: authHeaders(), signal });
      const raw = res.data?.content || res.data || [];
      return (Array.isArray(raw) ? raw : []).filter((o) => o && o.id != null).slice(0, OFFERS_CAP).map(normalizeOffer);
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  const loading = !token || offersPending;
  const idle = useIdleFlag(!loading);

  const { data: latest = EMPTY_LIST, isPending: latestPending } = useQuery({
    queryKey: ['latestProducts'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/products', { signal });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const p of list) if (p && p.id != null && !p.deleted && (Number(p.stock) || 0) > 0) out.push(normalizeLatest(p));
      out.sort((a, b) => b.ts - a.ts || b.num - a.num);
      return out.slice(0, LATEST_LIMIT);
    },
    enabled: idle,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isError && isUnauthorized(error)) expireSession(navigate);
  }, [isError, error, navigate]);

  const prepared = useMemo(
    () => offers.map((o) => ({ ...o, days: daysLeftNum(o.endDate), hay: `${o.name} ${o.description} ${o.shopName}`.toLowerCase() })),
    [offers],
  );

  const searched = useMemo(
    () => (deferredQuery ? prepared.filter((o) => o.hay.includes(deferredQuery)) : prepared),
    [prepared, deferredQuery],
  );

  const typeCounts = useMemo(() => {
    const src = shop ? searched.filter((o) => o.shopId === shop) : searched;
    const out = {};
    for (const [key, , fn] of FILTERS) out[key] = src.reduce((n, o) => n + (fn(o) ? 1 : 0), 0);
    return out;
  }, [searched, shop]);

  const shopOptions = useMemo(() => {
    const map = new Map();
    const fn = FILTER_FN[type];
    for (const o of searched) {
      if (!o.shopId || !o.shopName || !fn(o)) continue;
      const cur = map.get(o.shopId);
      if (cur) cur.count += 1;
      else map.set(o.shopId, { id: o.shopId, name: o.shopName, count: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, language));
  }, [searched, type, language]);

  const filtered = useMemo(() => {
    let list = searched.filter(FILTER_FN[type]);
    if (shop) list = list.filter((o) => o.shopId === shop);
    return sortOffers(list, sort, language);
  }, [searched, type, shop, sort, language]);

  const soonCount = useMemo(() => prepared.reduce((n, o) => n + (isSoon(o) ? 1 : 0), 0), [prepared]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

  const hasFilters = type !== DEFAULTS.type || !!shop || !!query;
  const activeCount = (type !== DEFAULTS.type ? 1 : 0) + (shop ? 1 : 0);

  const changePage = useCallback((p) => {
    update({ page: Math.min(Math.max(1, p), totalPages) });
    listRef.current?.scrollIntoView({ block: 'start', behavior: prefersReduced() ? 'auto' : 'smooth' });
  }, [update, totalPages]);
  const changeType = useCallback((v) => update({ type: v, shop, sort }), [update, shop, sort]);
  const changeShop = useCallback((v) => update({ shop: v, type, sort }), [update, type, sort]);
  const changeSort = useCallback((v) => update({ sort: v, type, shop }), [update, type, shop]);
  const sortOptions = useMemo(() => SORTS.map(([k, labelKey]) => [k, t(labelKey)]), [t]);
  const onQuery = useCallback((e) => {
    setQuery(e.target.value.slice(0, QUERY_MAX));
    setParams((prev) => { const n = new URLSearchParams(prev); n.delete('page'); return n; }, { replace: true });
  }, [setParams]);
  const clearAll = useCallback(() => { setQuery(''); startTransition(() => setParams({}, { replace: true })); }, [setParams]);
  const openDetail = useCallback((id) => setDetailId(id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const showError = isError && !isUnauthorized(error);
  const hasOffers = offers.length > 0;
  const showTools = !loading && !showError && hasOffers;
  const showSidebar = isDesktop && (loading || (!showError && hasOffers));
  const showFilterButton = !isDesktop && showTools;
  const showLatest = latest.length > 0 || (idle && latestPending);

  const panel = (
    <FilterPanel
      type={type} typeCounts={typeCounts} onType={changeType}
      shop={shop} shops={shopOptions} onShop={changeShop} t={t}
    />
  );

  return (
    <div
      dir={languageDirection(language)}
      lang={language}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-clip [--dx:1] rtl:[--dx:-1] ${language === 'ar' ? 'font-cairo' : 'font-jakarta'}`}
    >
      <Toaster darkMode={darkMode} />
      <OfferDefs gid={gid} />

      <main className="mx-auto max-w-[88rem] px-4 pb-14 pt-32 sm:px-6 lg:px-8" aria-busy={loading || isPending}>
        <header className="nb-rise mb-8" style={RISE[0]}>
          <Crumbs t={t} />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 max-w-2xl">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{t('activeOffers')}</h1>
              <p className="nb-muted mt-2 text-sm font-medium leading-relaxed sm:text-base">{t('pageSub')}</p>
            </div>
            {!loading && hasOffers && (
              <div className="nb-in flex flex-wrap gap-2 text-xs font-bold">
                <span className="nb-gray rounded-full px-3 py-1.5"><span dir="ltr" className="tabular-nums">{offers.length}</span> {t('available')}</span>
                {soonCount > 0 && (
                  <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-white"><span dir="ltr" className="tabular-nums">{soonCount}</span> {t('filterSoon')}</span>
                )}
              </div>
            )}
          </div>
        </header>

        <div className={`nb-rise grid gap-8 ${showSidebar ? 'lg:grid-cols-[16rem_minmax(0,1fr)]' : ''}`} style={RISE[1]}>
          {showSidebar && (
            <aside className="self-start lg:sticky lg:top-28" aria-label={t('filterLabel')}>
              {loading ? <FilterSkeleton /> : <div className="nb-card nb-in p-4">{panel}</div>}
            </aside>
          )}

          <section ref={listRef} className="min-w-0 scroll-mt-28" aria-label={t('activeOffers')}>
            {loading && <ToolbarSkeleton />}
            {showTools && (
              <div className="nb-in mb-5 flex flex-wrap items-center gap-3">
                <div className="nb-field relative flex h-11 min-w-0 flex-1 basis-60 items-center gap-2 px-4">
                  <FiSearch aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />
                  <input
                    type="search" value={query} onChange={onQuery} placeholder={t('search')} aria-label={t('search')}
                    maxLength={QUERY_MAX} autoComplete="off" spellCheck={false} enterKeyHint="search"
                    className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-medium placeholder:opacity-60 sm:text-sm"
                  />
                </div>
                <SortDropdown value={sort} onChange={changeSort} options={sortOptions} label={t('sortBy')} />
                {showFilterButton && (
                  <button type="button" onClick={openDrawer} aria-haspopup="dialog" className="nb-btn h-11 gap-2 px-4 text-sm">
                    <FiSliders aria-hidden="true" className="h-4 w-4" />{t('filters')}
                    {activeCount > 0 && (
                      <span dir="ltr" className="of-pop inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[color:var(--nb-btn)] px-1 text-[11px] font-extrabold tabular-nums text-[color:var(--nb-on)]">{activeCount}</span>
                    )}
                  </button>
                )}
              </div>
            )}

            {showTools && (
              <div className="mb-4 flex items-center justify-between gap-3">
                <p role="status" className="nb-muted text-sm font-medium">
                  <span dir="ltr" className="font-extrabold tabular-nums text-[color:var(--nb-ink)]">{filtered.length}</span> {t('results')}
                </p>
                {hasFilters && (
                  <button type="button" onClick={clearAll} className="nb-ic nb-focus rounded text-sm font-bold underline underline-offset-4 transition-opacity hover:opacity-80">{t('clearAll')}</button>
                )}
              </div>
            )}

            <div className={`transition-opacity duration-200 ${isPending ? 'opacity-60' : ''}`}>
              {loading ? (
                <Skeletons label={t('loading')} />
              ) : showError ? (
                <StateBox darkMode={darkMode} label={t('loadFail')} onRetry={refetch} fetching={isFetching} retryLabel={t('tryAgain')} />
              ) : !hasOffers ? (
                <StateBox darkMode={darkMode} label={t('noActive')} hint={t('checkBack')} />
              ) : paged.length === 0 ? (
                <StateBox darkMode={darkMode} label={t('noMatch')} onRetry={clearAll} retryLabel={t('clearAll')} />
              ) : (
                <>
                  <div className={`${GRID} of-grid`}>
                    {paged.map((o, i) => (
                      <OfferCard key={o.id} offer={o} index={(safePage - 1) * PAGE_SIZE + i} gid={gid} language={language} onViewDetail={openDetail} t={t} />
                    ))}
                  </div>
                  <Pager page={safePage} totalPages={totalPages} onChange={changePage} pending={isPending} t={t} />
                </>
              )}
            </div>
          </section>
        </div>

        {showLatest && (
          <section className="mt-14 [content-visibility:auto] [contain-intrinsic-size:auto_480px]" aria-label={t('newArrivals')}>
            <header className="mb-5">
              <p className="flex items-center gap-2 text-xs font-extrabold tracking-wide rtl:tracking-normal">
                <span className="nb-bar" aria-hidden="true" />{t('newArrivalsHint')}
              </p>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl"><AccentTitle text={t('newArrivals')} /></h2>
            </header>
            {latest.length === 0 ? <LatestSkeleton /> : (
              <div className="nb-in grid grid-cols-2 gap-4 lg:grid-cols-4">
                {latest.map((p) => (
                  <ProductCard key={p.id} product={p} darkMode={darkMode} language={language} t={t} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {drawerOpen && !isDesktop && (
        <FilterDrawer onClose={closeDrawer} t={t} total={filtered.length} onClear={clearAll} hasFilters={hasFilters}>
          {panel}
        </FilterDrawer>
      )}
      {detailId && <OfferDetailModal key={detailId} offerId={detailId} language={language} onClose={closeDetail} t={t} />}
    </div>
  );
});

export { queryClient };
export default function Offers(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <OffersContent {...props} />
    </QueryClientProvider>
  );
}