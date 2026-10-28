import React, {
  useState, useEffect, useCallback, useMemo, useRef, useId, memo, Suspense, lazy, useDeferredValue,
} from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiShoppingCart, FiChevronLeft, FiChevronRight, FiChevronDown, FiX, FiSliders, FiGrid, FiList,
  FiArrowRight, FiArrowUp, FiArrowLeft, FiShield, FiTool, FiRefreshCw, FiCheck, FiHeart,
} from 'react-icons/fi';
import { RiVerifiedBadgeLine } from 'react-icons/ri';
import { LazyMotion, domAnimation, m, AnimatePresence, MotionConfig } from 'framer-motion';
import api from '../common/api/api';
import Navbar from '../components/user/Navbar';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import {
  LISTING_CSS, PAGE_SIZES, CONDITIONS, readStorage, safeImageUrl, kindOfCategory, priceStep, finalPrice, clamp, loadSwal,
  useLangFont, useBackToTop, useModalLock, useHScroll, PriceRangeSlider,
} from '../components/user/ListingKit';
import { IsoIllustration, isoCatKey, isoCondKey } from '../components/user/IsoIllustrations';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const Footer = lazy(() => import('../components/user/Footer'));
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } },
});

const DEALS_LIMIT = 8;
const CARD_IMG_W = 600;
const CARD_IMG_H = 400;
const SAVED_KEY = 'nb_saved_devices';

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const scrollBehavior = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const EXTRA = {
  en: { save: 'Save', saved: 'Saved', savedOnly: 'Saved only', inStockOnly: 'In stock only', inStock: 'In stock', moreFilters: 'More filters', sortDiscount: 'Biggest discount' },
  ar: { save: 'حفظ', saved: 'تم الحفظ', savedOnly: 'المحفوظة فقط', inStockOnly: 'المتوفر فقط', inStock: 'متوفر', moreFilters: 'فلاتر إضافية', sortDiscount: 'أكبر خصم' },
  fr: { save: 'Enregistrer', saved: 'Enregistré', savedOnly: 'Enregistrés uniquement', inStockOnly: 'En stock uniquement', inStock: 'En stock', moreFilters: 'Plus de filtres', sortDiscount: 'Plus grande remise' },
};

const NS = {
  en: { ...EXTRA.en, ...enTranslations.devices, ...enTranslations.categoryProducts },
  ar: { ...EXTRA.ar, ...arTranslations.devices, ...arTranslations.categoryProducts },
  fr: { ...EXTRA.fr, ...frTranslations.devices, ...frTranslations.categoryProducts },
};
const tr = (lang, key, vars) => {
  let s = NS[lang]?.[key] ?? NS.en?.[key] ?? key;
  if (vars && typeof vars === 'object') for (const k in vars) s = s.split(`{{${k}}}`).join(vars[k]);
  return s;
};

const LOCALES = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR' };
const FMT_CACHE = {};
const getMoney = (language, currency) => {
  const fmt = (FMT_CACHE[language] ||= new Intl.NumberFormat(LOCALES[language] || LOCALES.en, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  return (n) => `${currency} ${fmt.format(Number(n || 0))}`;
};

const nameOf = (v, lang) => {
  if (!v) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim().slice(0, 120);
  if (typeof v === 'object') return nameOf(v[lang] ?? v.name ?? v.en ?? v.categoryName ?? v.title, lang);
  return '';
};

const COND_DOT = { New: 'bg-emerald-500', Refurbished: 'bg-sky-500', Used: 'bg-amber-500' };
const SORT_KEYS = [
  ['relevance', 'sortRelevance'],
  ['priceLowToHigh', 'sortPriceLow'],
  ['priceHighToLow', 'sortPriceHigh'],
  ['newest', 'sortNewest'],
  ['discount', 'sortDiscount'],
];
const TRUST_KEYS = [
  [RiVerifiedBadgeLine, 'trustVerified', 'trustVerifiedText'],
  [FiTool, 'trustQuality', 'trustQualityText'],
  [FiRefreshCw, 'trustEwaste', 'trustEwasteText'],
  [FiShield, 'trustSecure', 'trustSecureText'],
];
const VIEW_MODES = [['grid', FiGrid], ['list', FiList]];

const STAGGER = Array.from({ length: 9 }, (_, i) => ({ '--i': i }));

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
.nb{--nb-bg:#f3f4f6;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e2e5e9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#121212;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#212121;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-dark .border-dotted,.nb-dark .nb-dot{border-color:#3f3f3f}
.nb-dark .nb-bg.nb-line{border-color:#3a3a3a}
.nb-seq>section:nth-of-type(odd){background:var(--nb-bg)}
.nb-seq>section:nth-of-type(even){background:var(--nb-gray)}
.nb-seq>section+section{border-top:2px solid var(--nb-line)}
.nb-bg{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow);transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s cubic-bezier(.16,1,.3,1)}
.nb-lift{contain:layout style;backface-visibility:hidden}
.nb-lift:hover{transform:translate3d(-2px,-2px,0);box-shadow:7px 7px 0 var(--nb-shadow)}
.nb-in{animation:nbIn .34s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--i,0)*32ms)}
@keyframes nbIn{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-rule{display:block;width:100%;height:4px;margin-top:8px;background:var(--nb-accent)}
.nb-divider{display:block;height:8px;background:var(--nb-accent);border-block:2px solid var(--nb-line)}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-chip-w{background:#fbbf24;color:#04261a;border-color:#04261a}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt-active{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-media{background:var(--nb-gray)}
.nb-media-b{border-radius:1rem;contain:layout paint}
.nb-box{display:flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;border:2px solid var(--nb-line);background:var(--nb-card);color:var(--nb-on)}
.nb-box-on{background:var(--nb-btn)}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:2px dotted var(--nb-line);cursor:pointer;transition:transform .15s ease,background-color .15s ease}
.nb-dot:hover,.nb-dot-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-dot:hover{transform:translateY(-3px)}
.nb-dot:hover .nb-chip,.nb-dot-on .nb-chip{background:#ffffff;color:#04261a;border-color:#04261a}
.nb-dot:focus-visible{outline:3px solid var(--nb-accent);outline-offset:3px}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-dot{transition:none}.nb-in{animation:none}}
`;
const STYLE_EL = <style>{`${UI3D_CSS}${LISTING_CSS}${NB_CSS}`}</style>;

const EASE = [0.16, 1, 0.3, 1];
const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};
const DRAWER_MOTION = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { y: '100%', transition: { duration: 0.2, ease: 'easeIn' } },
};
const GPU = { willChange: 'transform, opacity' };

const useIsMobile = (query = '(max-width: 1023.98px)') => {
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

const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || '');
  const i = s.lastIndexOf(' ');
  const head = i > 0 ? s.slice(0, i + 1) : '';
  const tail = i > 0 ? s.slice(i + 1) : s;
  return (
    <>
      {head}
      <span className="relative inline-block">
        {tail}
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 10" preserveAspectRatio="none" className="nb-squig pointer-events-none absolute inset-x-0 -bottom-2 h-2.5 w-full">
          <path d="M1 6 C 20 2, 40 9, 60 5 S 90 3, 99 6" fill="none" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </>
  );
});

const SectionHead = memo(({ eyebrow, title, subtitle, action }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
    <div className="min-w-0 max-w-2xl">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl"><UnderlinedTitle text={title} /></h2>
      {subtitle && <p className="nb-muted mt-4 text-base sm:text-lg">{subtitle}</p>}
    </div>
    {action}
  </header>
));

const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = '', align = 'start' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();
  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[selectedIdx];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);
  useEffect(() => { if (isOpen) setActive(selectedIdx); }, [isOpen, selectedIdx]);
  useEffect(() => { if (isOpen) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [isOpen, active]);

  const choose = (i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setIsOpen(false);
    btnRef.current?.focus();
  };
  const onKeyDown = (e) => {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.min(i + 1, last)); break;
      case 'ArrowUp': e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.max(i - 1, 0)); break;
      case 'Home': if (isOpen) { e.preventDefault(); setActive(0); } break;
      case 'End': if (isOpen) { e.preventDefault(); setActive(last); } break;
      case 'Enter': case ' ': e.preventDefault(); if (isOpen) choose(active); else setIsOpen(true); break;
      case 'Escape': if (isOpen) { e.preventDefault(); e.stopPropagation(); setIsOpen(false); } break;
      case 'Tab': setIsOpen(false); break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${isOpen ? 'z-30' : ''} ${className}`}>
      <button
        ref={btnRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={`${uid}-list`}
        aria-activedescendant={isOpen ? `${uid}-o${active}` : undefined}
        onClick={() => setIsOpen((o) => !o)} onKeyDown={onKeyDown}
        className="nb-field flex h-10 w-full items-center justify-between gap-2 ps-3 pe-3 text-start text-xs font-bold uppercase"
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul ref={listRef} id={`${uid}-list`} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className={`nb-menu absolute top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1 ${align === 'end' ? 'end-0' : 'start-0'}`}>
          {options.map((o, i) => (
            <li key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
              className={`nb-opt whitespace-nowrap ${i === active ? 'nb-opt-active' : ''}`}>
              <span>{o.label}</span>
              {o.value === value && <FiCheck aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const FilterChip = memo(({ label, onRemove }) => (
  <button type="button" onClick={onRemove} className="nb-btn gap-1.5 px-2.5 py-1 text-xs">
    <span className="max-w-[10rem] truncate">{label}</span><FiX className="h-3 w-3 flex-shrink-0" />
  </button>
));

const OptionRow = memo(({ label, count, selected, onClick }) => (
  <button type="button" role="checkbox" aria-checked={selected} onClick={onClick}
    className="flex w-full items-center gap-2.5 py-1.5 text-start text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--nb-accent)]">
    <span className={`nb-box ${selected ? 'nb-box-on' : ''}`}>{selected && <FiCheck className="h-3 w-3" strokeWidth={3} />}</span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className="nb-muted text-xs tabular-nums" dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ title, isOpen, onToggle, children }) => (
  <section className="nb-line border-t-2">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center gap-2.5 py-3 text-start">
      <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold uppercase"><span className="nb-ul">{title}</span></span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="min-w-0 pb-4">{children}</div>}
  </section>
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

const Pagination = memo(({ page, total, onChange, t }) => {
  const items = useMemo(() => pageWindow(page, total), [page, total]);
  if (total <= 1) return null;
  return (
    <nav aria-label={t('paginationLabel')} className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" className="nb-btn h-10 w-10" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}><FiChevronLeft className="nb-flip h-4 w-4" /></button>
      {items.map((x) => (typeof x === 'number' ? (
        <button key={x} type="button" onClick={() => onChange(x)} aria-label={`${x}`} aria-current={x === page ? 'page' : undefined}
          className={`nb-btn h-10 min-w-[2.5rem] px-2 text-sm tabular-nums ${x === page ? 'nb-btn-on' : ''}`}>{x}</button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-extrabold">…</span>))}
      <button type="button" className="nb-btn h-10 w-10" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}><FiChevronRight className="nb-flip h-4 w-4" /></button>
    </nav>
  );
});

const CategoryBanner = memo(({ darkMode, catKey, name, loading, count, t }) => (
  <section className="nb-gray nb-line mt-20 overflow-hidden border-b-2">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="min-w-0 max-w-2xl flex-1">
        <Link to="/devices" className="nb-btn mb-5 inline-flex px-3 py-1.5 text-xs uppercase">
          <FiArrowLeft className="nb-flip h-3.5 w-3.5" /> {t('backToAll')}
        </Link>
        {name ? (
          <h1 className="break-words text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl"><UnderlinedTitle text={name} /></h1>
        ) : (
          <>
            <h1 className="sr-only">{t('categoryTitle')}</h1>
            {loading && <div className="nb-line h-10 w-56 animate-pulse border-2 bg-[color:var(--nb-card)] motion-reduce:animate-none sm:h-14 sm:w-72" aria-hidden="true" />}
          </>
        )}
        {!loading && (
          <p className="mt-5 flex items-center gap-2 text-base opacity-80 sm:text-lg">
            <span className="nb-chip nb-chip-a" dir="ltr">{count}</span> {count === 1 ? t('productFromSellers') : t('productsFromSellers')}
          </p>
        )}
      </div>
      <IsoIllustration type={catKey} tone="emerald" darkMode={darkMode} onGreen={false} className="lk-float-slow pointer-events-none h-32 w-32 flex-shrink-0 sm:h-52 sm:w-52 lg:h-72 lg:w-72" />
    </div>
  </section>
));

const TrustStrip = memo(({ items }) => (
  <section aria-label="Trust">
    <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3">
          <span className="nb-chip nb-chip-a !p-2"><Icon aria-hidden="true" className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase">{title}</p>
            <p className="nb-muted text-xs">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
));

const ProductCard = memo(({ product, darkMode, index = 0, layout = 'grid', isSaved = false, onSave, onAddToCart, onOpen, t, money, condLabel, catKey }) => {
  const resolved = safeImageUrl(product.image || product.imageUrl);
  const [imgState, setImgState] = useState(resolved ? 'loading' : 'error');
  const [btn, setBtn] = useState('idle');
  const imgRef = useRef(null);
  const timer = useRef();
  const mounted = useRef(true);
  const isList = layout === 'list';
  const hasDiscount = product.discount > 0;

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  useEffect(() => {
    setImgState(resolved ? 'loading' : 'error');
    if (resolved && imgRef.current?.complete && imgRef.current.naturalWidth) setImgState('ok');
  }, [resolved]);

  const open = useCallback(() => onOpen(product.id), [onOpen, product.id]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(product.id); }, [onSave, product.id]);
  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (btn === 'adding') return;
    setBtn('adding');
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setBtn(ok ? 'added' : 'idle');
    if (ok) timer.current = setTimeout(() => mounted.current && setBtn('idle'), 1600);
  }, [btn, onAddToCart, product]);

  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={product.name}
      style={STAGGER[Math.min(index, 8)]}
      className={`nb-in nb-card nb-lift group relative flex h-full cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nb-accent)] ${isList ? 'flex-row' : 'flex-col'}`}
    >
      <div className={isList ? 'flex w-28 flex-shrink-0 self-stretch p-2.5 pe-0 sm:w-44' : 'p-2.5 pb-0'}>
        <div className={`nb-media nb-media-b relative overflow-hidden ${isList ? 'min-h-[6rem] flex-1' : 'aspect-[3/2] w-full'}`}>
          {hasDiscount && <span className="nb-chip nb-chip-w absolute start-2 top-2 z-10" dir="ltr">-{product.discount}%</span>}
          <button
            type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
            className={`nb-btn absolute end-2 top-2 z-10 h-8 w-8 ${isSaved ? 'nb-btn-on' : ''}`}
          >
            <FiHeart className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          {imgState === 'loading' && <div className="absolute inset-0 animate-pulse bg-[color:var(--nb-gray)] motion-reduce:animate-none" />}
          {imgState === 'error' ? (
            <IsoIllustration type={catKey} tone="emerald" darkMode={darkMode} onGreen={false} hoverOnly
              className="absolute inset-0 m-auto aspect-square h-[88%] transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />
          ) : (
            <img
              ref={imgRef} src={resolved} alt={product.name} width={CARD_IMG_W} height={CARD_IMG_H}
              loading="lazy" decoding="async" referrerPolicy="no-referrer"
              onLoad={() => setImgState((s) => (s === 'error' ? s : 'ok'))}
              onError={() => setImgState('error')}
              className={`absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${imgState === 'loading' ? 'opacity-0' : 'opacity-100'}`}
            />
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug">{product.name}</h3>
          <span className="nb-rule" aria-hidden="true" />
        </div>

        {product.condition && (
          <span className="nb-chip w-fit"><span className={`h-2 w-2 ${COND_DOT[product.condition] || 'bg-gray-400'}`} />{condLabel(product.condition)}</span>
        )}

        {isList && <p className="line-clamp-2 text-xs leading-relaxed opacity-90">{product.description || t('noDescription')}</p>}

        <div className={`nb-line mt-auto flex gap-2 border-t-2 pt-3 ${isList ? 'items-center justify-between' : 'flex-col sm:flex-row sm:items-center sm:justify-between'}`}>
          <div className={`flex min-w-0 flex-col leading-tight ${isList ? '' : 'max-sm:rtl:items-end'}`} dir="ltr">
            <span className="truncate text-sm font-extrabold tabular-nums">{money(product._final)}</span>
            {hasDiscount && <span className="nb-muted text-[10px] tabular-nums line-through">{money(product.price)}</span>}
          </div>
          <button type="button" onClick={handleCart} disabled={btn === 'adding'} aria-label={t('addToCart')}
            className={`nb-btn nb-btn-a h-9 flex-shrink-0 ${isList ? 'w-9' : 'w-full sm:w-9'}`}>
            {btn === 'adding' ? <span className="h-3.5 w-3.5 animate-spin border-2 border-current border-t-transparent motion-reduce:animate-none" />
              : btn === 'added' ? <FiCheck className="h-4 w-4" />
              : <FiShoppingCart className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
});

const ConditionGrid = memo(({ counts, selected, onToggle, onReset, darkMode, title, subtitle, t, condLabel }) => {
  const items = CONDITIONS.filter((c) => counts[c] > 0);
  if (!items.length) return null;
  return (
    <section aria-label={title} className="lk-cv py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow={t('condition')} title={title} subtitle={subtitle}
          action={<button type="button" onClick={onReset} className="nb-btn nb-btn-a px-4 py-2 text-xs uppercase sm:text-sm">{t('allProducts')} <FiArrowRight className="nb-flip h-4 w-4" /></button>} />
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {items.map((c) => {
            const active = selected.includes(c);
            return (
              <button key={c} type="button" onClick={() => onToggle(c)} aria-pressed={active}
                className={`nb-dot group flex flex-col items-center gap-2 p-3 text-center sm:gap-2.5 sm:p-4 ${active ? 'nb-dot-on' : ''}`}>
                <IsoIllustration type={isoCondKey(c)} darkMode={darkMode} onGreen={false} hoverOnly
                  className="h-16 w-16 transition-transform duration-200 group-hover:scale-110 sm:h-20 sm:w-20" />
                <span className="text-sm font-extrabold uppercase">{condLabel(c)}</span>
                <span className="nb-chip"><span dir="ltr">{counts[c]}</span> {counts[c] === 1 ? t('itemSingular') : t('itemPlural')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

const StateCard = memo(({ illustration, title, subtitle, darkMode, children }) => (
  <div className="nb-card px-4 py-14 text-center sm:py-20">
    <IsoIllustration type={illustration} tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
    <p className="mb-2 text-lg font-extrabold uppercase sm:text-2xl">{title}</p>
    <p className="mb-6 text-sm opacity-80 sm:text-base">{subtitle}</p>
    {children}
  </div>
));

const FilterPanel = memo((p) => {
  const { t, flat, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, setOnSaleOnly, onSaleCount,
    inStockOnly, setInStockOnly, savedOnly, setSavedOnly,
    priceRange, setPriceRange, maxPrice, open, setOpen, clearFilters, activeFiltersCount, darkMode } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const step = priceStep(maxPrice);
  return (
    <div className={flat ? 'w-full min-w-0 max-w-full overflow-x-hidden' : 'nb-card w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4'}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold uppercase">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="nb-ul truncate">{t('filters')}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className="flex-shrink-0 text-xs font-bold underline underline-offset-4">{t('resetAll')}</button>}
      </div>

      <FilterBlock title={t('condition')} isOpen={open.cond} onToggle={() => toggle('cond')}>
        {CONDITIONS.map((c) => <OptionRow key={c} label={condLabel(c)} count={countsByCondition[c] || 0} selected={conditions.includes(c)} onClick={() => toggleCondition(c)} />)}
      </FilterBlock>

      {maxPrice > 0 && (
        <FilterBlock title={t('priceRange')} isOpen={open.price} onToggle={() => toggle('price')}>
          <PriceRangeSlider range={priceRange || [0, maxPrice]} max={maxPrice} step={step} onChange={setPriceRange} darkMode={darkMode} />
        </FilterBlock>
      )}

      <FilterBlock title={t('offersFilter')} isOpen={open.offers} onToggle={() => toggle('offers')}>
        <OptionRow label={t('onSaleOnly')} count={onSaleCount} selected={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} />
      </FilterBlock>

      <FilterBlock title={t('moreFilters')} isOpen={open.more} onToggle={() => toggle('more')}>
        <OptionRow label={t('inStockOnly')} selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)} />
        <OptionRow label={t('savedOnly')} selected={savedOnly} onClick={() => setSavedOnly((v) => !v)} />
      </FilterBlock>
    </div>
  );
});

function CategoryProductsContent({ darkMode, toggleDarkMode }) {
  const language = useAppLanguage();
  const t = useCallback((k, vars) => tr(language, k, vars), [language]);
  const currency = t('currency');
  const money = useMemo(() => getMoney(language, currency), [language, currency]);
  const numLocale = LOCALES[language] || LOCALES.en;
  const dir = languageDirection(language);
  const isRTL = dir === 'rtl';
  const font = useLangFont(language);
  const isAr = language === 'ar';
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const condLabel = useCallback((c) => {
    const k = `condition${c}`;
    const s = t(k);
    return s === k ? c : s;
  }, [t]);
  const sortOptions = useMemo(() => SORT_KEYS.map(([value, k]) => ({ value, label: t(k) })), [t]);
  const perPageRaw = t('perPage');
  const rowOptions = useMemo(() => PAGE_SIZES.map((n) => ({
    value: n,
    label: perPageRaw.includes('{{count}}') ? perPageRaw.split('{{count}}').join(n) : `${n} ${perPageRaw}`,
  })), [perPageRaw]);
  const perPageAria = useMemo(() => perPageRaw.split('{{count}}').join('').trim(), [perPageRaw]);
  const trustItems = useMemo(() => TRUST_KEYS.map(([icon, title, text]) => ({ icon, title: t(title), text: t(text) })), [t]);

  const [saved, toggleSaved] = useSavedProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRangeState] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [open, setOpen] = useState({ cond: true, price: true, offers: true, more: true });
  const gridRef = useRef(null);
  const showTop = useBackToTop();
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const drawerOpen = isMobile && isSidebarOpen;
  useModalLock(drawerOpen, closeSidebar);
  useEffect(() => { if (!isMobile) setIsSidebarOpen(false); }, [isMobile]);
  useEffect(() => { ensureNbFont(); }, []);

  const filters = useMemo(
    () => ({ searchTerm, priceRange, conditions, onSaleOnly, inStockOnly, savedOnly, sortBy }),
    [searchTerm, priceRange, conditions, onSaleOnly, inStockOnly, savedOnly, sortBy]
  );
  const deferred = useDeferredValue(filters);
  const isStale = deferred !== filters;

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async ({ signal }) => {
      const token = readStorage('authToken');
      const res = await api.get(
        `/api/categories/${encodeURIComponent(categoryId)}`,
        token ? { signal, headers: { Authorization: `Bearer ${token}` } } : { signal }
      );
      const body = res.data?.content ?? res.data?.data ?? res.data ?? {};
      const c = Array.isArray(body) ? body.find((x) => String(x?.id) === String(categoryId)) || {} : body;
      return { id: c.id ?? categoryId, name: c.name ?? c.categoryName ?? c.title ?? null };
    },
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
    retry: shouldRetry,
  });

  const { data: products = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: async ({ signal }) => {
      const res = await api.get(`/api/products/category/${encodeURIComponent(categoryId)}`, { signal });
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list.filter(Boolean) : [];
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
  });

  const categoryName = useMemo(() => {
    const direct = nameOf(category?.name, language);
    if (direct) return direct;
    for (const p of products) {
      const n = nameOf(p.category ?? p.categoryName, language);
      if (n) return n;
    }
    return '';
  }, [category, products, language]);
  const nameLoading = !categoryName && (categoryLoading || isLoading);

  useEffect(() => {
    document.title = categoryName ? `${categoryName} | ${t('titleSuffix')}` : t('titleSuffix');
  }, [categoryName, t]);

  const clearFilters = useCallback(() => {
    setSearchTerm(''); setPriceRangeState(null); setConditions([]); setOnSaleOnly(false); setInStockOnly(false); setSavedOnly(false); setSortBy('relevance'); setCurrentPage(1);
  }, []);
  useEffect(() => { clearFilters(); }, [categoryId, clearFilters]);

  const enriched = useMemo(() => products.map((p) => {
    const price = Number(p.price) || 0;
    const discount = clamp(Number(p.discount) || 0, 0, 100);
    const base = { ...p, price, discount };
    return { ...base, _final: finalPrice(base), _name: (p.name || '').toLowerCase(), _ts: Date.parse(p.createdAt) || 0 };
  }), [products]);

  const maxPrice = useMemo(() => {
    const top = enriched.reduce((mx, p) => Math.max(mx, p._final), 0);
    const step = priceStep(top);
    return top ? Math.ceil(top / step) * step : 0;
  }, [enriched]);
  const setPriceRange = useCallback((r) => setPriceRangeState(r[0] <= 0 && r[1] >= maxPrice ? null : r), [maxPrice]);

  const { countsByCondition, onSaleCount, deals } = useMemo(() => {
    const c = {};
    let sale = 0;
    const discounted = [];
    for (const p of enriched) {
      if (p.condition) c[p.condition] = (c[p.condition] || 0) + 1;
      if (p.discount > 0) { sale++; discounted.push(p); }
    }
    discounted.sort((a, b) => b.discount - a.discount);
    return { countsByCondition: c, onSaleCount: sale, deals: discounted.slice(0, DEALS_LIMIT) };
  }, [enriched]);

  const filteredProducts = useMemo(() => {
    const { searchTerm: s, priceRange: pr, conditions: cs, onSaleOnly: os, inStockOnly: st, savedOnly: sv, sortBy: sb } = deferred;
    const term = s.trim().toLowerCase();
    const lo = pr ? pr[0] : 0;
    const hi = pr ? pr[1] : Infinity;
    const list = enriched.filter((p) => {
      if (p._final < lo || p._final > hi) return false;
      if (cs.length && !cs.includes(p.condition)) return false;
      if (os && !(p.discount > 0)) return false;
      if (st && p.stock === 0) return false;
      if (sv && !saved.has(p.id)) return false;
      if (term && !p._name.includes(term)) return false;
      return true;
    });
    if (sb === 'priceLowToHigh') list.sort((a, b) => a._final - b._final);
    else if (sb === 'priceHighToLow') list.sort((a, b) => b._final - a._final);
    else if (sb === 'newest') list.sort((a, b) => b._ts - a._ts);
    else if (sb === 'discount') list.sort((a, b) => b.discount - a.discount);
    return list;
  }, [enriched, deferred, saved]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [pageSize, deferred]);
  useEffect(() => { setCurrentPage((p) => Math.min(p, totalPages)); }, [totalPages]);

  const paginated = useMemo(() => filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredProducts, currentPage, pageSize]);
  const startItem = filteredProducts.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, filteredProducts.length);
  const activeFiltersCount = (searchTerm ? 1 : 0) + conditions.length + (priceRange ? 1 : 0) + (onSaleOnly ? 1 : 0) + (inStockOnly ? 1 : 0) + (savedOnly ? 1 : 0);

  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: scrollBehavior() }), []);
  const goToPage = useCallback((pg) => { setCurrentPage(pg); scrollToGrid(); }, [scrollToGrid]);
  const toggleCondition = useCallback((c) => setConditions((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const pickCondition = useCallback((c) => { toggleCondition(c); scrollToGrid(); }, [toggleCondition, scrollToGrid]);
  const resetCondition = useCallback(() => { setConditions([]); scrollToGrid(); }, [scrollToGrid]);
  const openProduct = useCallback((id) => navigate(`/device/${encodeURIComponent(id)}`), [navigate]);
  const handleCartClick = useCallback(() => navigate('/cart'), [navigate]);

  const handleAddToCart = useCallback(async (product) => {
    const token = readStorage('authToken');
    if (!token) {
      const Swal = await loadSwal();
      const result = await Swal.fire({
        title: t('loginRequiredTitle'), text: t('loginRequiredText'),
        icon: 'info', showCancelButton: true, confirmButtonText: t('goToLogin'), cancelButtonText: t('cancel'),
      });
      if (result.isConfirmed) navigate('/login');
      return false;
    }
    try {
      const res = await api.post('/api/cart/items', { productId: product.id, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status < 200 || res.status >= 300) throw new Error('Unexpected response');
      window.dispatchEvent(new Event('cart:updated'));
      const Swal = await loadSwal();
      Swal.fire({ title: t('addedToCartTitle'), text: t('addedToCartText', { name: String(product.name || '').slice(0, 60) }), icon: 'success', toast: true, position: 'top-end', timer: 1500, timerProgressBar: true, showConfirmButton: false });
      return true;
    } catch {
      const Swal = await loadSwal();
      Swal.fire({ title: t('errorTitle'), text: t('addToCartFailedTitle'), icon: 'error', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      return false;
    }
  }, [navigate, t]);

  const { ref: sliderRef, edge, scroll: scrollSlider } = useHScroll(deals, isRTL);

  const categoryKind = useMemo(() => kindOfCategory(categoryName), [categoryName]);
  const catKey = useMemo(() => isoCatKey(categoryKind), [categoryKind]);

  const filterPanelProps = useMemo(() => ({
    darkMode, t, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, setOnSaleOnly, onSaleCount,
    inStockOnly, setInStockOnly, savedOnly, setSavedOnly,
    priceRange, setPriceRange, maxPrice, open, setOpen, clearFilters, activeFiltersCount,
  }), [darkMode, t, condLabel, countsByCondition, conditions, toggleCondition, onSaleOnly, onSaleCount,
    inStockOnly, savedOnly, priceRange, setPriceRange, maxPrice, open, clearFilters, activeFiltersCount]);

  const layout = isMobile ? 'grid' : viewMode;
  const gridCols = layout === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1';
  const showArrows = deals.length > 3 && (edge.l || edge.r);
  const arrowBtn = (d, disabled) => (
    <button type="button" className="nb-btn h-10 w-10" onClick={() => scrollSlider(d)} disabled={disabled} aria-label={d === 'back' ? t('scrollBack') : t('scrollForward')}>
      {d === 'back' ? <FiChevronLeft className="nb-flip h-5 w-5" /> : <FiChevronRight className="nb-flip h-5 w-5" />}
    </button>
  );
  const viewLabels = { grid: t('gridView'), list: t('listView') };

  return (
    <div
      dir={dir} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-hidden ${isAr ? font.className : ''}`}
    >
      {STYLE_EL}
      <Defs3D />
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} onCartClick={handleCartClick} />

      <CategoryBanner darkMode={darkMode} catKey={catKey} name={categoryName} loading={nameLoading} count={products.length} t={t} />

      <div className="nb-seq">
        <TrustStrip items={trustItems} />

        {!isLoading && !isError && (
          <ConditionGrid counts={countsByCondition} selected={conditions} onToggle={pickCondition} onReset={resetCondition}
            darkMode={darkMode} title={t('shopByCondition')} subtitle={t('shopByConditionSub')} t={t} condLabel={condLabel} />
        )}

        {!isLoading && deals.length > 0 && (
          <section aria-label={t('biggestDiscounts')} className="lk-cv py-10 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHead
                eyebrow={t('dealsBadge')} title={t('biggestDiscounts')}
                subtitle={categoryName ? t('bestSavings', { name: categoryName }) : undefined}
                action={showArrows ? <div className="flex gap-2">{arrowBtn('back', !edge.l)}{arrowBtn('forward', !edge.r)}</div> : null}
              />
              <div ref={sliderRef} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-4 pe-2 pt-1 motion-reduce:scroll-auto sm:gap-6">
                {deals.map((p, i) => (
                  <div key={p.id} className="w-[200px] flex-shrink-0 snap-start sm:w-[250px]">
                    <ProductCard product={p} darkMode={darkMode} index={i} isSaved={saved.has(p.id)} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct} t={t} money={money} condLabel={condLabel} catKey={catKey} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section aria-label={categoryName || t('categoryTitle')}>
          <span className="nb-divider" aria-hidden="true" />
          <div id="category-products" ref={gridRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
            <div className="flex items-stretch gap-5 lg:gap-8">
              {!isMobile && (
                <aside className="flex w-[17rem] min-w-0 flex-shrink-0 xl:w-[19rem]">
                  <div className="nb-card min-w-0 flex-1 p-3 sm:p-4">
                    <div className="sticky top-20">
                      <FilterPanel {...filterPanelProps} flat />
                    </div>
                  </div>
                </aside>
              )}

              <div className="w-full min-w-0 flex-1">
                <SectionHead eyebrow={t('productsLabel')} title={categoryName || t('categoryTitle')} />

                <div className="nb-card mb-6 flex flex-col gap-3 p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm opacity-80" aria-live="polite">
                      <b dir="ltr">{startItem}–{endItem}</b> / <b dir="ltr">{filteredProducts.length}</b> {t('productsLabel')}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {!isMobile && (
                        <>
                          <NbDropdown ariaLabel={perPageAria} value={pageSize} onChange={setPageSize} options={rowOptions} align="end" className="w-36 flex-shrink-0" />
                          {VIEW_MODES.map(([mode, Icon]) => (
                            <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-label={viewLabels[mode]} title={viewLabels[mode]} aria-pressed={viewMode === mode}
                              className={`nb-btn h-10 w-10 ${viewMode === mode ? 'nb-btn-on' : ''}`}><Icon className="h-4 w-4" /></button>
                          ))}
                        </>
                      )}
                      {isMobile && (
                        <button type="button" onClick={() => setIsSidebarOpen(true)} className="nb-btn nb-btn-a h-10 px-3 text-xs uppercase">
                          <FiSliders className="h-3.5 w-3.5" /> {t('filters')}
                          {activeFiltersCount > 0 && <span className="flex h-4 min-w-[1rem] items-center justify-center bg-white px-1 text-[10px] font-bold text-[#04261a]">{activeFiltersCount}</span>}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="nb-field relative flex h-10 min-w-0 flex-1 items-center gap-2 px-3">
                      <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
                      <input type="search" autoComplete="off" value={searchTerm} maxLength={80} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search')} aria-label={t('searchAria')}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60" />
                      {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label={t('clearSearch')}><FiX className="h-4 w-4" /></button>}
                    </div>
                    <NbDropdown ariaLabel={t('sortBy')} value={sortBy} onChange={setSortBy} options={sortOptions} align="end" className="w-full sm:w-52" />
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    {conditions.map((c) => <FilterChip key={c} label={condLabel(c)} onRemove={() => toggleCondition(c)} />)}
                    {priceRange && <FilterChip label={`${currency} ${priceRange[0].toLocaleString(numLocale)} – ${priceRange[1].toLocaleString(numLocale)}`} onRemove={() => setPriceRangeState(null)} />}
                    {onSaleOnly && <FilterChip label={t('onSale')} onRemove={() => setOnSaleOnly(false)} />}
                    {inStockOnly && <FilterChip label={t('inStock')} onRemove={() => setInStockOnly(false)} />}
                    {savedOnly && <FilterChip label={t('savedOnly')} onRemove={() => setSavedOnly(false)} />}
                    {searchTerm && <FilterChip label={`“${searchTerm.slice(0, 20)}”`} onRemove={() => setSearchTerm('')} />}
                    <button type="button" onClick={clearFilters} className="text-xs font-bold underline underline-offset-4">{t('clearAll')}</button>
                  </div>
                )}

                <div aria-busy={isStale} className={`transition-opacity duration-150 ${isStale ? 'opacity-70' : 'opacity-100'}`}>
                  {isLoading ? (
                    <div className={`grid gap-4 sm:gap-6 ${gridCols}`} role="status" aria-label="Loading">
                      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="nb-gray nb-line h-[300px] animate-pulse border-2 motion-reduce:animate-none" />)}
                    </div>
                  ) : isError ? (
                    <StateCard illustration="shopsEmpty" title={t('loadErrorTitle')} subtitle={t('loadErrorText')} darkMode={darkMode}>
                      <button type="button" onClick={() => refetch()} className="nb-btn nb-btn-a px-6 py-3 text-sm uppercase"><FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} /> {t('tryAgain')}</button>
                    </StateCard>
                  ) : filteredProducts.length === 0 ? (
                    <StateCard illustration="shopEmpty" title={products.length ? t('noProducts') : t('nothingHere')} subtitle={products.length ? t('removeFilter') : t('checkBackSoon')} darkMode={darkMode}>
                      {products.length > 0 && <button type="button" onClick={clearFilters} className="nb-btn nb-btn-a px-6 py-3 text-sm uppercase">{t('clearFilters')}</button>}
                    </StateCard>
                  ) : (
                    <div className={`grid gap-4 sm:gap-6 ${gridCols}`}>
                      {paginated.map((p, i) => (
                        <ProductCard key={p.id} product={p} darkMode={darkMode} index={i} layout={layout} isSaved={saved.has(p.id)} onSave={toggleSaved} onAddToCart={handleAddToCart} onOpen={openProduct} t={t} money={money} condLabel={condLabel} catKey={catKey} />
                      ))}
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-3 pt-8">
                    <Pagination page={currentPage} total={totalPages} onChange={goToPage} t={t} />
                    <p className="nb-muted text-xs"><span dir="ltr">{startItem}–{endItem}</span> / <span dir="ltr">{filteredProducts.length}</span> {t('productsLabel')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {showTop && (
        <div className="fixed bottom-5 end-5 z-40">
          <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} className="nb-btn nb-btn-a h-11 w-11"><FiArrowUp className="h-5 w-5" /></button>
        </div>
      )}

      <LazyMotion features={domAnimation}>
        <MotionConfig reducedMotion="user">
          <AnimatePresence>
            {drawerOpen && (
              <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t('filters')}>
                <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={closeSidebar} aria-hidden="true" />
                <m.div {...DRAWER_MOTION} style={GPU}
                  className="nb-bg nb-line absolute inset-x-0 bottom-0 flex max-h-[88vh] min-w-0 transform-gpu flex-col border-t-2 sm:inset-y-0 sm:end-auto sm:start-0 sm:max-h-none sm:w-[22rem] sm:max-w-[90vw] sm:border-e-2 sm:border-t-0 md:w-96">
                  <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-4">
                    <h3 className="text-base font-extrabold uppercase"><span className="nb-ul">{t('filters')}</span></h3>
                    <button type="button" onClick={closeSidebar} aria-label={t('closeFilters')} className="nb-btn h-9 w-9"><FiX className="h-5 w-5" /></button>
                  </div>
                  <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pe-4 sm:px-4 sm:pe-5"><FilterPanel {...filterPanelProps} /></div>
                  <div className="nb-line border-t-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                    <button type="button" onClick={() => { closeSidebar(); scrollToGrid(); }} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">{t('showItems', { count: filteredProducts.length })}</button>
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>
        </MotionConfig>
      </LazyMotion>

      <Suspense fallback={null}><Footer darkMode={darkMode} /></Suspense>
    </div>
  );
}

export { queryClient };
export default function CategoryProducts(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <CategoryProductsContent {...props} />
    </QueryClientProvider>
  );
}