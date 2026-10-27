import React, {
  useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo, useTransition, lazy, Suspense,
} from 'react';
import { useNavigate, useNavigationType, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiTool, FiInfo, FiX, FiMail, FiPhone, FiCalendar, FiMapPin, FiCheck, FiCheckCircle, FiFileText,
  FiTag, FiXCircle, FiPackage, FiTruck, FiSlash, FiShield, FiChevronLeft, FiChevronRight, FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  RiStoreLine, RiStarFill, RiVerifiedBadgeLine, RiSmartphoneLine, RiMacbookLine, RiTabletLine,
  RiTv2Line, RiComputerLine, RiGamepadLine, RiDeviceLine,
} from 'react-icons/ri';
import { LazyMotion, MotionConfig, domAnimation, m, AnimatePresence } from 'framer-motion';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { LISTING_CSS, useLangFont, useModalLock, clean } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { authHeaders, cleanText, expireSession, isUnauthorized, useAuthGuard } from '../common/utils/auth';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const LatestRepairs = lazy(() => import('./Account').then((mod) => ({ default: mod.LatestRepairs })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } },
});

const REPAIR_TRANSLATIONS = {
  en: enTranslations.repair,
  ar: arTranslations.repair || arTranslations.hero?.repair,
  fr: frTranslations.repair || frTranslations.hero?.repair,
};
const LOCAL_TEXT = {
  en: { crumbHome: 'Home', crumbRepair: 'Repair' },
  ar: { crumbHome: 'الرئيسية', crumbRepair: 'إصلاح' },
  fr: { crumbHome: 'Accueil', crumbRepair: 'Réparation' },
};
const tr = (language, key) =>
  REPAIR_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  REPAIR_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };
const ensureNbFont = () => {
  if (typeof document === 'undefined' || document.getElementById('nb-font')) return;
  [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
    const l = document.createElement('link');
    l.rel = 'preconnect'; l.href = href; if (cors) l.crossOrigin = '';
    document.head.appendChild(l);
  });
  const link = document.createElement('link');
  link.id = 'nb-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
};

const NB_CSS = `
.nb{--nb-bg:#eef9f3;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-media{background:var(--nb-gray)}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:2px dotted var(--nb-line);cursor:pointer;transition:transform .15s ease,background-color .15s ease}
.nb-dark .nb-dot{border-color:#525252}
.nb-dot:hover,.nb-dot-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-dark .nb-dot-on{border-color:#000}
.nb-dot:hover{transform:translateY(-3px)}
.nb-dot:focus-visible{outline:3px solid var(--nb-accent);outline-offset:3px}
.nb-sel{background:var(--nb-btn);color:var(--nb-on)}
.nb-sel .nb-chip{background:#fff;color:#04261a;border-color:#04261a}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
@keyframes pgIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.pg-enter{animation:pgIn 180ms cubic-bezier(.16,1,.3,1) backwards}
.pg-step{animation:pgIn 140ms ease-out backwards}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-dot{transition:none}.pg-enter,.pg-step{animation:none}}
`;
const STYLE_EL = <style>{`${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}${NB_CSS}`}</style>;

const EASE = [0.16, 1, 0.3, 1];
const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};
const PANEL_MOTION = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: EASE } },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' } },
};
const GPU = { willChange: 'transform, opacity' };

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

const useNearViewport = (rootMargin = '300px') => {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); io.disconnect(); }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [near, rootMargin]);
  return [ref, near];
};

const pick = (obj, key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined);

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
const SUGGESTIONS = ['Screen cracked', 'Battery issue', 'Not charging', 'Overheating', 'Software crash', 'Water damage'];

const CATEGORY_ICONS = { phone: RiSmartphoneLine, laptop: RiMacbookLine, tablet: RiTabletLine, tv: RiTv2Line, desktop: RiComputerLine, gaming: RiGamepadLine };
const categoryIcon = (name) => pick(CATEGORY_ICONS, String(name || '').toLowerCase()) || RiDeviceLine;

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

const RepairBanner = memo(({ darkMode, eyebrow, title, subtitle, t }) => (
  <section className="nb-gray nb-line relative mt-20 overflow-hidden border-b-2">
    <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-36 sm:pt-12 lg:px-8 lg:pb-44">
      <nav aria-label="Breadcrumb" className="relative z-10 flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase sm:text-sm">
        <Link to="/" className="underline underline-offset-4 hover:no-underline">{t('crumbHome')}</Link>
        <FiChevronRight className="h-3 w-3 flex-shrink-0 rtl:rotate-180" />
        <span className="nb-muted max-w-[14rem] truncate" aria-current="page">{t('crumbRepair')}</span>
      </nav>
      <p className="relative z-10 mt-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide rtl:tracking-normal"><span className="nb-bar" aria-hidden="true" />{eyebrow}</p>
      <h1 className="relative z-10 mt-3 max-w-xl text-2xl font-extrabold uppercase leading-tight sm:text-4xl lg:text-5xl"><span className="nb-ul">{title}</span></h1>
      {subtitle && <p className="relative z-10 mt-4 max-w-xl text-sm font-medium opacity-80 sm:text-base">{subtitle}</p>}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-24 end-4 hidden h-40 w-40 sm:block lg:bottom-32 lg:end-16 lg:h-56 lg:w-56">
        <IsoIllustration type="repair" tone="emerald" darkMode={darkMode} onGreen={false} className="h-full w-full" />
      </div>
    </div>
  </section>
));

const ProgressSteps = memo(({ step, t }) => {
  const total = STEP_DEFS.length;
  const pct = ((step - 1) / (total - 1)) * 100;
  return (
    <div className="nb-card p-4 sm:p-6">
      <p className="sr-only">{t('step')} {step} {t('of')} {total}</p>
      <ol className="relative grid grid-cols-4" aria-label="Progress">
        <li aria-hidden="true" className="contents">
          <div className="nb-gray nb-line absolute inset-x-[12.5%] top-5 h-2 -translate-y-1/2 border-2">
            <div className="h-full bg-[color:var(--nb-accent)] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
          </div>
        </li>
        {STEP_DEFS.map(({ labelKey, hintKey }, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <li key={labelKey} aria-current={active ? 'step' : undefined} className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span className={`nb-line flex h-10 w-10 items-center justify-center border-2 text-base font-extrabold tabular-nums ${done || active ? 'nb-btn-on' : 'bg-[color:var(--nb-card)]'} ${active ? '[box-shadow:3px_3px_0_0_var(--nb-shadow)]' : ''}`}>
                {done ? <FiCheck className="h-5 w-5" /> : <span dir="ltr">{n}</span>}
              </span>
              <div className="min-w-0 px-0.5">
                <p className={`truncate text-[11px] font-extrabold uppercase sm:text-xs ${done || active ? '' : 'opacity-50'}`}>{t(labelKey)}</p>
                <p className="nb-muted mt-0.5 hidden truncate text-[11px] sm:block">{t(hintKey)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
});

const NavButtons = memo(({ onBack, onNext, nextLabel, nextDisabled, isLoading, showBack = true, t }) => (
  <div className={`mx-auto mt-8 flex max-w-md gap-3 ${showBack ? 'justify-between' : 'justify-center'}`}>
    {showBack && (
      <button type="button" className="nb-btn px-5 py-3 text-sm uppercase" onClick={onBack} disabled={isLoading}>
        <FiChevronLeft className="nb-flip h-4 w-4" /> {t('back')}
      </button>
    )}
    <button type="button" className="nb-btn nb-btn-a flex-1 px-6 py-3 text-sm uppercase sm:flex-none sm:px-10" onClick={onNext} disabled={nextDisabled || isLoading} aria-busy={isLoading}>
      {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {isLoading ? t('sending') : nextLabel || t('continue')}
      {!isLoading && <FiArrowRight className="nb-flip h-4 w-4" />}
    </button>
  </div>
));

const Skeletons = memo(({ count, className, itemClassName }) => (
  <div className={className} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => <div key={i} className={`nb-gray animate-pulse motion-reduce:animate-none ${itemClassName}`} />)}
  </div>
));

const StateBox = memo(({ darkMode, label, onRetry }) => (
  <div className="py-10 text-center">
    <IsoIllustration type="shop" tone="emerald" onGreen={false} darkMode={darkMode} className="mx-auto mb-3 h-32 w-32" />
    <p className="text-sm font-extrabold uppercase sm:text-base">{label}</p>
    {onRetry && <button type="button" onClick={() => onRetry()} className="nb-btn nb-btn-a mx-auto mt-4 px-5 py-2.5 text-sm uppercase"><FiRefreshCw className="h-4 w-4" /> Try again</button>}
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

const Pager = memo(({ page, totalPages, onChange, pending }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" aria-busy={pending} className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button type="button" className="nb-btn h-10 w-10" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><FiChevronLeft className="nb-flip h-4 w-4" /></button>
      {pageWindow(page, totalPages).map((x) => (typeof x === 'number' ? (
        <button key={x} type="button" onClick={() => onChange(x)} aria-label={`Page ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`nb-btn h-10 min-w-[2.5rem] px-2 text-sm tabular-nums ${x === page ? 'nb-btn-on' : ''}`}>{x}</button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-extrabold">…</span>))}
      <button type="button" className="nb-btn h-10 w-10" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><FiChevronRight className="nb-flip h-4 w-4" /></button>
    </nav>
  );
});

const HEADING = 'text-center text-xl font-extrabold uppercase sm:text-2xl';
const SUB = 'nb-muted mx-auto mt-3 mb-6 max-w-xl text-center text-xs font-medium sm:text-sm';

const DescribeStep = memo(({ initial, onChange, t }) => {
  const [value, setValue] = useState(initial);
  const update = useCallback((v) => { setValue(v); onChange(v); }, [onChange]);
  const handleChange = useCallback((e) => update(e.target.value), [update]);
  const addSuggestion = useCallback(
    (s) => update((value ? `${value}, ${s.toLowerCase()}` : s).slice(0, MAX_DESC)),
    [update, value],
  );
  const blank = value.length > 0 && !value.trim();
  return (
    <>
      <h2 className={HEADING}><span className="nb-ul">{t('describeProblem')}</span></h2>
      <p className={SUB}>{t('specificHelp')}</p>
      <div className="mx-auto max-w-2xl">
        <div className="nb-field" style={blank ? { borderColor: '#ef4444' } : undefined}>
          <label htmlFor="repair-description" className="sr-only">{t('describeProblem')}</label>
          <textarea
            id="repair-description" value={value} onChange={handleChange}
            maxLength={MAX_DESC} placeholder={t('issuePlaceholder')} aria-required="true"
            aria-invalid={blank} aria-describedby={blank ? 'repair-description-error' : undefined}
            className="min-h-[150px] w-full resize-none bg-transparent px-4 py-4 text-sm font-medium outline-none placeholder:opacity-60 sm:min-h-[180px] sm:px-5 sm:text-base"
          />
          <div className="nb-line flex items-center justify-between border-t-2 px-4 py-2 text-[11px] font-bold sm:px-5">
            <span className="nb-muted">{t('tip')}</span>
            <span dir="ltr" className={`tabular-nums ${value.length > 900 ? 'text-orange-500' : ''}`}>{value.length} / {MAX_DESC}</span>
          </div>
        </div>
        {blank && (
          <p id="repair-description-error" role="alert" className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-500">
            <FiXCircle className="h-3.5 w-3.5 flex-shrink-0" /> Description can't be blank. Please describe what's wrong with your device.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 pe-1 pb-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => addSuggestion(s)} className="nb-btn px-2.5 py-1 text-xs">+ {s}</button>
          ))}
        </div>
      </div>
    </>
  );
});

const CategoryTile = memo(({ cat, active, onSelect }) => {
  const Icon = categoryIcon(cat.name);
  return (
    <button type="button" aria-pressed={active} onClick={() => onSelect(cat)}
      className={`nb-dot flex flex-col items-center gap-3 p-4 text-center sm:p-5 ${active ? 'nb-dot-on' : ''}`}>
      <Icon aria-hidden="true" className="h-8 w-8" />
      <span className="line-clamp-1 w-full text-xs font-extrabold uppercase sm:text-sm">{cat.name}</span>
    </button>
  );
});

const ShopOption = memo(({ shop, active, onSelect, onInfo, t }) => {
  const select = useCallback(() => { if (shop.activate) onSelect(shop); }, [shop, onSelect]);
  const address = shop.shopAddress ? [shop.shopAddress.street, shop.shopAddress.city].filter(Boolean).join(', ') : '';
  return (
    <div
      role="radio" aria-checked={active} aria-disabled={!shop.activate} tabIndex={shop.activate ? 0 : -1}
      onClick={select}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); select(); } }}
      className={`nb-card relative flex flex-col gap-3 p-4 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[color:var(--nb-accent)] ${
        shop.activate ? 'nb-lift cursor-pointer' : 'cursor-not-allowed opacity-50 grayscale'} ${active ? 'nb-sel' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-extrabold uppercase leading-snug"><span className="nb-ul">{shop.name}</span></h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="nb-chip"><RiStarFill className="h-3 w-3 text-amber-500" /><span dir="ltr">{shop.rating ? shop.rating.toFixed(1) : t('newRating')}</span></span>
            {shop.verified && <span className="nb-chip"><RiVerifiedBadgeLine className="h-3 w-3 text-sky-500" /> Verified</span>}
          </div>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); onInfo(shop); }} aria-label={t('shopDetailsAria')} className="nb-btn h-8 w-8 flex-shrink-0 !text-[color:var(--nb-ink)]">
          <FiInfo className="h-4 w-4" />
        </button>
      </div>
      {address && <p className="flex items-center gap-1.5 text-xs font-medium"><FiMapPin aria-hidden="true" className={`h-3.5 w-3.5 flex-shrink-0 ${active ? '' : 'nb-ic'}`} /><span className="line-clamp-1">{address}</span></p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-current pt-3 text-xs">
        <span className="flex items-center gap-1.5 font-bold uppercase"><RiStoreLine className="h-3.5 w-3.5" />{shop.shopType || t('generalType')}</span>
        <span className="nb-chip">{shop.activate ? t('active') : t('inactive')}</span>
      </div>
      {active && <span className="flex items-center justify-center gap-2 border-2 border-current py-1.5 text-xs font-extrabold uppercase"><FiCheck className="h-4 w-4" />{t('selected')}</span>}
    </div>
  );
});

const ShopDetailModal = memo(({ shop, language, onClose, t }) => {
  useModalLock(true, onClose);
  const rows = [
    { Icon: FiMail, label: t('email'), value: shop.email },
    { Icon: FiPhone, label: t('phone'), value: shop.phone, ltr: true },
    { Icon: RiStoreLine, label: t('type'), value: shop.shopType },
    { Icon: FiMapPin, label: t('address'), value: shop.shopAddress ? [shop.shopAddress.street, shop.shopAddress.city, shop.shopAddress.state].filter(Boolean).join(', ') : '' },
    { Icon: FiCalendar, label: t('joined'), value: formatDate(shop.createdAt, language) },
  ].filter((r) => r.value);
  const tel = telHref(shop.phone);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/70" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className="nb-card relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain !transition-none sm:max-w-md">
        <div className="nb-gray nb-line relative border-b-2 p-4 pe-14 sm:p-5">
          <h2 className="line-clamp-2 text-base font-extrabold uppercase sm:text-lg"><span className="nb-ul">{shop.name}</span></h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="nb-chip"><RiStarFill className="h-3 w-3 text-amber-500" /><span dir="ltr">{shop.rating ? shop.rating.toFixed(1) : t('newRating')}</span></span>
            {shop.verified && <span className="nb-chip nb-chip-a"><RiVerifiedBadgeLine className="h-3 w-3" /> Verified</span>}
          </div>
          <button type="button" onClick={onClose} aria-label={t('close') || 'Close'} className="nb-btn absolute end-3 top-3 h-8 w-8"><FiX className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          {shop.description && <p className="text-sm font-medium leading-relaxed opacity-90">{shop.description}</p>}
          <ul className="space-y-2">
            {rows.map(({ Icon, label, value, ltr }) => (
              <li key={label} className="nb-gray nb-line flex items-center gap-3 border-2 border-dotted p-2.5">
                <span className="nb-chip nb-chip-a !p-1.5"><Icon aria-hidden="true" className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="nb-muted text-[10px] font-extrabold uppercase">{label}</p>
                  <p className="truncate text-xs font-bold" dir={ltr ? 'ltr' : undefined}>{value}</p>
                </div>
              </li>
            ))}
          </ul>
          {tel && <a href={tel} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase"><FiPhone className="h-4 w-4" /> {t('phone')}</a>}
        </div>
      </m.div>
    </div>
  );
});

const InfoPanel = memo(({ step, darkMode, t }) => {
  const head = STEP_HEAD[step - 1];
  return (
    <div className="nb-card overflow-hidden">
      <div className="nb-gray nb-line border-b-2 p-4">
        <IsoIllustration type={INFO_SCENES[step - 1]} tone="emerald" onGreen={false} darkMode={darkMode} className="mx-auto h-40 w-40" />
      </div>
      <div className="p-5">
        <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{t(head.infoTitle)}</span></h3>
        <p className="nb-muted mt-3 text-xs font-medium leading-relaxed">{t(head.infoBody)}</p>
      </div>
    </div>
  );
});

const JourneySection = memo(({ t }) => (
  <section className="nb-gray nb-line lk-cv border-y-2 py-12 sm:py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="mb-8 sm:mb-10">
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide rtl:tracking-normal"><span className="nb-bar" aria-hidden="true" />{t('step')}</p>
        <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight sm:text-4xl"><span className="nb-ul">{t('repairJourney')}</span></h2>
        <p className="nb-muted mt-4 max-w-2xl text-sm font-medium sm:text-base">Follow your device from request to delivery.</p>
      </header>
      <ol className="grid grid-cols-1 gap-6 pe-2 pb-2 ps-3 pt-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {STATUS_JOURNEY.map(({ key, labelKey, descKey, Icon, danger }, i) => (
          <li key={key} className="nb-card relative flex items-start gap-3 p-4">
            <span
              aria-hidden="true" dir="ltr"
              className={`nb-line absolute -start-3 -top-3 flex h-8 w-8 items-center justify-center border-2 text-sm font-extrabold tabular-nums ${danger ? 'bg-red-500 text-white' : 'nb-btn-on'}`}
            >
              {i + 1}
            </span>
            <span className={`nb-chip !p-2 ${danger ? '!border-black !bg-red-500 !text-white' : 'nb-chip-a'}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold uppercase">{t(labelKey)}</p>
              <p className="nb-muted mt-1 text-xs font-medium leading-snug">{t(descKey)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
));

function RepairRequestContent({ darkMode }) {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useCallback((key) => tr(language, key), [language]);
  const font = useLangFont(language);
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
  const [repairsRef, repairsNear] = useNearViewport();

  useEffect(() => { ensureNbFont(); }, []);
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

  const categories = categoriesQ.data || [];
  const shops = shopsQ.data || [];
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
      toast({ icon: 'success', title: 'Request sent', text: `Your repair request was sent to ${clean(vars.shop.name, 60)}.`, timer: 3500 });
    },
    onError: (err) => {
      if (isUnauthorized(err)) return expireSession(navigate);
      return toast({ icon: 'error', title: 'Failed to send', text: err.response?.data?.message || 'Something went wrong.', timer: 3500 });
    },
  });

  const goTo = useCallback((n) => startTransition(() => setStep(n)), []);
  const toStep1 = useCallback(() => goTo(1), [goTo]);
  const toStep2 = useCallback(() => goTo(2), [goTo]);
  const toAccount = useCallback(() => navigate('/account'), [navigate]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!cleanText(descRef.current)) return toast({ icon: 'warning', title: 'Description required', text: "Please describe what's wrong with your device" });
      return goTo(2);
    }
    if (step === 2) {
      if (!category) return toast({ icon: 'warning', title: 'Select device type' });
      return goTo(3);
    }
    return undefined;
  }, [step, category, goTo]);

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

  const head = STEP_HEAD[step - 1];

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div
          dir={languageDirection(language)} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
          className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-hidden ${isAr ? font.className : ''}`}
        >
          {STYLE_EL}
          <Defs3D />
          <Toaster darkMode={darkMode} />

          <div className="pg-enter">
            <RepairBanner
              darkMode={darkMode}
              eyebrow={`${t('step')} ${step} ${t('of')} ${STEP_DEFS.length}`}
              title={t(head.title)}
              subtitle={t(head.subtitle)}
              t={t}
            />

            <div className="relative z-20 mx-auto -mt-20 max-w-7xl px-4 sm:-mt-28 sm:px-6 lg:-mt-36 lg:px-8">
              <div className="pe-2 pb-2">
                <ProgressSteps step={step} t={t} />
              </div>

              <div className="mt-6 grid items-start gap-6 pe-2 pb-2 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
                <div aria-busy={isPending} className={`nb-card p-5 transition-opacity duration-150 sm:p-8 ${isPending ? 'opacity-70' : ''}`}>
                  <div key={step} className="pg-step">
                    {step === 1 && (
                      <>
                        <DescribeStep initial={descRef.current} onChange={onDescChange} t={t} />
                        <NavButtons showBack={false} onNext={handleNext} nextDisabled={!hasDesc} t={t} />
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <h2 className={HEADING}><span className="nb-ul">{t('deviceType')}</span></h2>
                        <p className={SUB}>{t('categorySubtitle')}</p>
                        {categoriesQ.isLoading ? (
                          <Skeletons count={6} className="grid grid-cols-2 gap-3 sm:grid-cols-3" itemClassName="h-28" />
                        ) : categoriesQ.isError ? (
                          <StateBox darkMode={darkMode} label="We couldn't load device types." onRetry={categoriesQ.refetch} />
                        ) : categories.length === 0 ? (
                          <StateBox darkMode={darkMode} label="No device types available yet." />
                        ) : (
                          <>
                            <div role="group" aria-label={t('deviceType')} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                              {pagedCategories.map((c) => <CategoryTile key={c.id} cat={c} active={category?.id === c.id} onSelect={setCategory} />)}
                            </div>
                            <Pager page={safeCatPage} totalPages={categoryPages} onChange={changeCatPage} pending={isPending} />
                            {!category && <p role="status" className="nb-muted mt-5 text-center text-xs font-bold">Select a device type to continue.</p>}
                          </>
                        )}
                        <NavButtons onBack={toStep1} onNext={handleNext} nextDisabled={!category} t={t} />
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <h2 className={HEADING}><span className="nb-ul">{t('chooseShopTitle')}</span></h2>
                        <p className={SUB}>{t('chooseShopSubtitle')}</p>
                        {shopsQ.isLoading ? (
                          <Skeletons count={4} className="grid grid-cols-1 gap-4 sm:grid-cols-2" itemClassName="h-44" />
                        ) : shopsQ.isError ? (
                          <StateBox darkMode={darkMode} label="We couldn't load repair shops." onRetry={shopsQ.refetch} />
                        ) : shops.length === 0 ? (
                          <StateBox darkMode={darkMode} label={t('noShops')} />
                        ) : (
                          <>
                            <div role="radiogroup" aria-label={t('chooseShopTitle')} className="grid grid-cols-1 gap-5 pe-2 pb-2 sm:grid-cols-2 sm:gap-6">
                              {pagedShops.map((s) => <ShopOption key={s.id} shop={s} active={shop?.id === s.id} onSelect={setShop} onInfo={openInfo} t={t} />)}
                            </div>
                            <Pager page={safeShopPage} totalPages={shopPages} onChange={changeShopPage} pending={isPending} />
                          </>
                        )}
                        <NavButtons onBack={toStep2} onNext={handleSend} nextLabel={t('sendRepairRequest')} nextDisabled={!shop} isLoading={submit.isPending} t={t} />
                      </>
                    )}

                    {step === 4 && (
                      <div className="flex flex-col items-center py-4 text-center" role="status">
                        <IsoIllustration type="marketplace" tone="emerald" onGreen={false} darkMode={darkMode} className="h-40 w-40" />
                        <span className="nb-chip nb-chip-a -mt-2 !p-3"><FiCheck className="h-7 w-7" /></span>
                        <h2 className="mt-4 text-2xl font-extrabold uppercase"><span className="nb-ul">{t('requestSent')}</span></h2>
                        <p className="mt-4 text-sm font-medium opacity-80">{t('requestSentTo')}</p>
                        <p className="mt-1 text-base font-extrabold uppercase">{submittedShop?.name || t('defaultShopName')}</p>
                        <p className="nb-muted text-xs font-medium">
                          {submittedShop?.shopAddress?.city || t('defaultCity')}{submittedShop?.shopAddress?.state ? `, ${submittedShop.shopAddress.state}` : ''}
                        </p>
                        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
                          <button type="button" onClick={reset} className="nb-btn flex-1 px-5 py-3 text-sm uppercase">{t('newRequest')}</button>
                          <button type="button" onClick={toAccount} className="nb-btn nb-btn-a flex-1 px-5 py-3 text-sm uppercase">{t('viewMyRequests')} <FiArrowRight className="nb-flip h-4 w-4" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <aside className="hidden lg:sticky lg:top-24 lg:block"><InfoPanel step={step} darkMode={darkMode} t={t} /></aside>
              </div>
            </div>

            {token && (
              <div ref={repairsRef} className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6 lg:px-8">
                {repairsNear && (
                  <Suspense fallback={null}>
                    <LatestRepairs token={token} />
                  </Suspense>
                )}
              </div>
            )}

            <div className="mt-10 sm:mt-14">
              <JourneySection t={t} />
            </div>
          </div>

          <AnimatePresence>
            {infoShop && <ShopDetailModal key={infoShop.id} shop={infoShop} language={language} onClose={closeInfo} t={t} />}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </LazyMotion>
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