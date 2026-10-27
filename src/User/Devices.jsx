import React, {
  useState, useEffect, useCallback, useRef, useMemo, memo, Suspense, lazy, useDeferredValue, useTransition,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiShoppingCart, FiX, FiSliders, FiCheck, FiGrid, FiList, FiArrowUp, FiRefreshCw,
  FiArrowRight, FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch,
} from 'react-icons/fi';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import api from '../common/api/api';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import { UI3D_CSS, Defs3D, Glyph3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  LISTING_CSS, PAGE_SIZES, readStorage, safeImageUrl, clamp, clean, loadSwal,
  useLangFont, useBackToTop, useModalLock,
} from '../components/user/ListingKit';
import { IsoIllustration, isoCatKey } from '../components/user/IsoIllustrations';

const Hero = lazy(() => import('../components/user/Hero'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

const LATEST_LIMIT = 8;
const CARD_IMG_W = 600;
const CARD_IMG_H = 400;
const MOBILE_QUERY = '(max-width: 1023px)';
const MOBILE_BATCH = 8;

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

const DEFAULT_TEXT = {
  en: { eyebrowCategories: 'Categories', eyebrowProducts: 'Shop', prevPage: 'Previous page', nextPage: 'Next page', pageN: 'Page {{n}}', loadingMore: 'Loading more devices', endOfList: 'You have seen all devices' },
  ar: { eyebrowCategories: 'التصنيفات', eyebrowProducts: 'المتجر', prevPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية', pageN: 'صفحة {{n}}', loadingMore: 'جارٍ تحميل المزيد من الأجهزة', endOfList: 'لقد شاهدت جميع الأجهزة' },
  fr: { eyebrowCategories: 'Catégories', eyebrowProducts: 'Boutique', prevPage: 'Page précédente', nextPage: 'Page suivante', pageN: 'Page {{n}}', loadingMore: "Chargement d'autres appareils", endOfList: 'Vous avez vu tous les appareils' },
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
const money = (n, currency) => `${currency} ${NUMBER_FORMAT.format(Number(n) || 0)}`;

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

const CONDITION_CONFIG = {
  NEW: { badge: 'bg-emerald-600', key: 'conditionNew' },
  USED: { badge: 'bg-amber-600', key: 'conditionUsed' },
  REFURBISHED: { badge: 'bg-sky-600', key: 'conditionRefurbished' },
};
const CONDITION_ENTRIES = Object.entries(CONDITION_CONFIG);
const condOf = (c) => (typeof c === 'string' && Object.prototype.hasOwnProperty.call(CONDITION_CONFIG, c) ? CONDITION_CONFIG[c] : null);
const condLabel = (t, c) => { const cfg = condOf(c); return cfg ? t(cfg.key) : clean(c, 30) || t('conditionUnknown'); };

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
];
const PRICE_STEP = (max) => (max >= 20000 ? 500 : max >= 2000 ? 100 : 10);
const HISTOGRAM_BINS = 16;
const EMPTY_LIST = [];

const STAGGER = Array.from({ length: 8 }, (_, i) => ({ '--i': i }));

const NB_CSS = `
.nb{--nb-bg:#eef9f3;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-soft:#e9ebed;--nb-accent:#10b981;--nb-on:#04261a;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-soft:#1e1e1e;--nb-accent:#39ff88;--nb-on:#022c22}
.nb-dark .nb-drawer{border-color:#3a3a3a}
.nb-bg{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-soft{background:var(--nb-soft)}
.nb-muted{color:var(--nb-muted)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--nb-shadow)}
.nb-num{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;background:var(--nb-accent);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1}
.nb-num-sm{width:24px;height:24px;font-size:10px;box-shadow:1px 1px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-rule{display:block;width:100%;height:4px;margin-top:8px;background:var(--nb-accent)}
.nb-divider{display:block;height:8px;background:var(--nb-accent);border-block:2px solid var(--nb-line)}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-accent);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-arrow{display:inline-flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;background:var(--nb-accent);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);transition:transform .15s ease}
.nb-lift:hover .nb-arrow{transform:translateX(3px)}
.nb[dir=rtl] .nb-lift:hover .nb-arrow{transform:translateX(-3px)}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-field option{background:var(--nb-card);color:var(--nb-ink)}
.nb-media{background:var(--nb-gray)}
.nb-media-b{border-radius:1rem;contain:layout paint}
.nb-search::-webkit-search-cancel-button,.nb-search::-webkit-search-decoration{display:none;-webkit-appearance:none}
.nb-box{display:flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;border:2px solid var(--nb-line);background:var(--nb-card);color:var(--nb-on)}
.nb-box-on{background:var(--nb-accent)}
.nb-bin{background:var(--nb-gray)}
.nb-bin-on{background:var(--nb-accent);box-shadow:inset 0 0 0 1.5px var(--nb-line)}
.nb-range{position:absolute;inset:0;width:100%;height:20px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none}
.nb-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;box-sizing:border-box;pointer-events:auto;width:20px;height:20px;border-radius:0;background:var(--nb-accent);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);cursor:grab}
.nb-range::-moz-range-thumb{box-sizing:border-box;pointer-events:auto;width:20px;height:20px;border-radius:0;background:var(--nb-accent);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);cursor:grab}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:2px dotted var(--nb-line);cursor:pointer;transition:transform .15s ease,background-color .15s ease}
.nb-dark .nb-dot{border-color:#3f3f3f}
.nb-dot:hover,.nb-dot-on{background:var(--nb-accent);color:var(--nb-on)}
.nb-dot:hover{transform:translateY(-3px)}
.nb-dot:hover .nb-chip,.nb-dot-on .nb-chip{background:var(--nb-on);color:#ecfdf5;border-color:var(--nb-on)}
.nb-dot:focus-visible{outline:3px solid var(--nb-accent);outline-offset:3px}
.nb-aside{scrollbar-width:thin;scrollbar-color:var(--nb-line) transparent}
@keyframes nbSpin{to{transform:rotate(360deg)}}
.nb-spin{animation:nbSpin .7s linear infinite}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-arrow,.nb-dot{transition:none}.nb-spin{animation:none}}
`;
const STYLE_EL = <style>{`${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}${NB_CSS}`}</style>;

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

const SectionHead = memo(({ eyebrow, title, subtitle }) => (
  <header className="mb-6 sm:mb-8">
    <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl"><UnderlinedTitle text={title} /></h2>
    {subtitle && <p className="nb-muted mt-4 max-w-2xl text-base sm:text-lg">{subtitle}</p>}
  </header>
));

const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = '' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-30' : ''} ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="nb-field flex h-10 w-full cursor-pointer items-center justify-between gap-2 px-3 text-xs font-bold uppercase"
      >
        <span className="min-w-0 truncate">{selected?.label || ''}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="nb-card absolute z-30 mt-2 max-h-60 w-full min-w-0 overflow-y-auto overscroll-contain p-1"
        >
          {options.map((o) => {
            const active = String(o.value) === String(value);
            return (
              <li key={String(o.value)} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-start text-xs font-bold uppercase transition-colors hover:bg-[color:var(--nb-gray)] ${active ? 'nb-btn-on' : ''}`}
                >
                  <span className="min-w-0 truncate">{o.label}</span>
                  {active && <FiCheck aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />}
                </button>
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
    <div className="nb-field relative flex h-10 min-w-0 flex-1 items-center gap-2 px-3" role="search">
      <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
      <input
        ref={inputRef}
        type="search" inputMode="search" enterKeyHint="search"
        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
        maxLength={MAX_QUERY}
        value={value} onChange={handleChange} placeholder={placeholder} aria-label={ariaLabel}
        className="nb-search min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
      />
      {pending && <span aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {value && (
        <button type="button" onClick={handleClear} aria-label={clearLabel} className="flex-shrink-0 focus-visible:outline focus-visible:outline-2">
          <FiX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

const FilterChip = memo(({ label, onRemove }) => (
  <button type="button" onClick={onRemove} className="nb-btn gap-1.5 px-2.5 py-1 text-xs">
    <span className="max-w-[10rem] truncate">{label}</span><FiX className="h-3 w-3 flex-shrink-0" />
  </button>
));

const DeviceArt = memo(({ name, categoryName, darkMode, label, tone = 'emerald' }) => (
  <div
    className="nb-gray absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden"
    role="img" aria-label={name ? `${name} – ${label}` : label}
  >
    <IsoIllustration
      type={isoCatKey(kindOf(categoryName || name))} tone={tone} darkMode={darkMode} onGreen={false}
      className="h-[64%] w-[64%] transition-transform duration-300 group-hover:scale-105"
    />
    <span className="nb-muted max-w-full truncate px-2 text-[9px] font-extrabold uppercase tracking-widest">{label}</span>
  </div>
));

const DeviceScene = memo(({ className = 'h-24 w-32' }) => (
  <div className={`relative flex-shrink-0 ${className}`} aria-hidden="true">
    <div className="absolute inset-x-3 bottom-0 h-4 rounded-full bg-black/20 blur-md" />
    <Glyph3D kind="laptop" className="absolute bottom-1 start-0 h-[78%] w-[62%]" />
    <Glyph3D kind="phone" className="lk-float absolute end-[10%] top-0 h-[72%] w-[28%]" />
  </div>
));

const ProductCard = memo(({ product, darkMode, onAddToCart, onOpen, number, layout = 'grid', variant = 'grid', tone = 'emerald', t, className = '' }) => {
  const src = useMemo(() => safeImageUrl(product.imageUrl), [product.imageUrl]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(!src);
  const [cartAdded, setCartAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const mounted = useRef(true);
  const loadedRef = useRef(false);
  const addedTimer = useRef();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(addedTimer.current); }; }, []);

  useEffect(() => {
    loadedRef.current = false;
    setImgLoaded(false);
    setImgError(!src);
    if (!src) return undefined;
    const timer = setTimeout(() => { if (!loadedRef.current) setImgError(true); }, 8000);
    return () => clearTimeout(timer);
  }, [src]);

  const outOfStock = product.stock === 0;
  const isList = layout === 'list';
  const hasDiscount = product.discount > 0;
  const currency = t('currency');
  const snippet = useMemo(() => clean(product.description, 140) || t('noDescription'), [product.description, t]);

  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setAdding(false);
    if (ok) {
      setCartAdded(true);
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => mounted.current && setCartAdded(false), 1400);
    }
  }, [onAddToCart, product, outOfStock, adding]);

  const go = useCallback(() => onOpen(product.id), [onOpen, product.id]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) go(); }, [go]);
  const handleLoad = useCallback(() => { loadedRef.current = true; setImgLoaded(true); }, []);
  const handleImgError = useCallback(() => setImgError(true), []);

  const media = (
    <div className={`nb-media nb-media-b relative overflow-hidden ${isList ? 'min-h-[8rem] flex-1' : 'aspect-[3/2] w-full'}`}>
      {imgError ? (
        <DeviceArt name={product.name} categoryName={product.categoryName} darkMode={darkMode} label={t('imageUnavailable')} tone={tone} />
      ) : (
        <>
          {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/5" />}
          <img
            src={src} alt={product.name} width={CARD_IMG_W} height={CARD_IMG_H}
            loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
            onLoad={handleLoad} onError={handleImgError}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      )}
    </div>
  );

  const head = (
    <div className="min-w-0">
      <h3 className={`text-[13px] font-extrabold uppercase leading-snug sm:text-sm ${isList ? 'line-clamp-2' : 'line-clamp-2 min-h-[2.4rem]'}`}>
        {product.name}
      </h3>
      <span className="nb-rule" aria-hidden="true" />
    </div>
  );

  const text = (
    <div className="min-w-0">
      <p className="nb-muted mb-1 truncate text-[10px] font-bold uppercase tracking-wide">{product.categoryName || t('uncategorized')}</p>
      <p className={`line-clamp-2 text-xs leading-5 opacity-90 ${isList ? '' : 'min-h-[2.5rem]'}`}>{snippet}</p>
    </div>
  );

  const footer = (
    <div
      className={`mt-auto flex gap-2 ${
        isList ? 'items-center justify-between' : 'flex-col sm:flex-row sm:items-center sm:justify-between'
      } ${variant === 'latest' && !isList ? 'border-t-2 nb-line pt-3' : ''}`}
    >
      <div className={`flex min-w-0 flex-col ${isList ? '' : 'max-sm:rtl:items-end'}`} dir="ltr">
        <span className="truncate text-base font-extrabold tabular-nums tracking-tight">{money(product.finalPrice, currency)}</span>
        {hasDiscount && <span className="nb-muted text-[11px] tabular-nums line-through">{money(product.price, currency)}</span>}
      </div>
      <div className={`flex items-center gap-2 ${isList ? 'flex-shrink-0' : 'w-full sm:w-auto sm:flex-shrink-0'}`}>
        <button
          type="button" onClick={handleCart} disabled={outOfStock || adding} aria-label={t('addToCart')}
          className={`nb-btn h-9 ${isList ? 'w-9' : 'flex-1 sm:w-9 sm:flex-none'} ${cartAdded ? 'nb-btn-on' : ''}`}
        >
          {adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            : cartAdded ? <FiCheck className="h-4 w-4" /> : <FiShoppingCart className="h-4 w-4" />}
        </button>
        <span className="nb-arrow" aria-hidden="true"><FiArrowRight className="nb-flip h-4 w-4" /></span>
      </div>
    </div>
  );

  return (
    <article
      onClick={go}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={product.name}
      style={STAGGER[(number - 1) % 8]}
      className={`anim-fade-up nb-card nb-lift group relative flex h-full cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nb-accent)] ${isList ? 'flex-row' : 'flex-col'} ${className}`}
    >
      {isList && <div className="flex w-28 flex-shrink-0 self-stretch p-2.5 pe-0 sm:w-44">{media}</div>}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        {head}
        {isList ? text : variant === 'latest' ? <>{media}{text}</> : <>{text}{media}</>}
        {footer}
        {outOfStock && <p className="text-[10px] font-extrabold uppercase text-rose-500">{t('outOfStock')}</p>}
      </div>
    </article>
  );
});

const ProductGrid = memo(({ products, offset, layout, darkMode, onAddToCart, onOpen, t }) => (
  <div className={`grid gap-4 sm:gap-6 ${layout === 'grid' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
    {products.map((p, i) => (
      <ProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={onAddToCart} onOpen={onOpen} number={offset + i + 1} layout={layout} t={t} />
    ))}
  </div>
));

const InfiniteSentinel = memo(({ hasMore, count, onMore, t }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return undefined;
    if (typeof IntersectionObserver === 'undefined') { onMore(); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onMore(); }, { rootMargin: '700px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, count, onMore]);
  return (
    <div ref={ref} className="flex min-h-[3.5rem] items-center justify-center pt-8" role="status" aria-live="polite">
      {hasMore ? (
        <span className="nb-chip !px-3 !py-1.5">
          <span aria-hidden="true" className="nb-spin h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />
          {t('loadingMore')}
        </span>
      ) : count > MOBILE_BATCH ? (
        <span className="nb-chip !px-3 !py-1.5"><FiCheck aria-hidden="true" className="h-3 w-3" />{t('endOfList')}</span>
      ) : null}
    </div>
  );
});

const LatestSection = memo(({ products, darkMode, onAddToCart, onOpen, t }) => (
  <section aria-label={t('latestArrivals')} className="lk-cv nb-soft nb-line border-y-2 py-12 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHead eyebrow={t('justIn')} title={t('latestArrivals')} subtitle={t('latestArrivalsSub')} />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={onAddToCart} onOpen={onOpen} number={i + 1} variant="latest" tone="emerald" t={t} />
        ))}
      </div>
    </div>
  </section>
));

const CategoryGrid = memo(({ categories, productsByCategory, selectedCategoryId, onSelect, darkMode, t }) => {
  const top = useMemo(
    () => [...categories].sort((a, b) => (productsByCategory[b.id]?.length || 0) - (productsByCategory[a.id]?.length || 0)).slice(0, 6),
    [categories, productsByCategory]
  );
  if (!top.length) return null;

  return (
    <section aria-label={t('browseCategories')} className="lk-cv nb-bg nb-line border-t-2 py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead eyebrow={t('eyebrowCategories')} title={t('browseCategories')} subtitle={t('browseCategoriesSub')} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {top.map((cat) => {
            const active = selectedCategoryId === cat.id;
            const count = productsByCategory[cat.id]?.length || 0;
            return (
              <button key={cat.id} type="button" onClick={() => onSelect(cat.id)} aria-pressed={active}
                className={`nb-dot group relative flex flex-col items-center gap-2 p-3 pt-9 text-center sm:gap-2.5 sm:p-4 sm:pt-10 ${active ? 'nb-dot-on' : ''}`}>
                <IsoIllustration
                  type={isoCatKey(kindOf(cat.name))} darkMode={darkMode} onGreen={false}
                  className="h-14 w-14 transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16"
                />
                <span className="line-clamp-1 w-full text-sm font-extrabold uppercase">{cat.name}</span>
                <span className="nb-chip">{t('itemsCount', { count })}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

const OptionRow = memo(({ type, label, count, selected, onClick }) => (
  <button
    type="button" role={type === 'check' ? 'checkbox' : 'radio'} aria-checked={selected} onClick={onClick}
    className="flex w-full items-center gap-2.5 py-1.5 text-start text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--nb-accent)]"
  >
    <span className={`nb-box ${type === 'radio' ? 'rounded-full' : ''} ${selected ? 'nb-box-on' : ''}`}>
      {selected && (type === 'check' ? <FiCheck className="h-3 w-3" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-[color:var(--nb-on)]" />)}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className="nb-muted text-xs tabular-nums" dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ num, title, isOpen, onToggle, children }) => (
  <section className="border-t-2 nb-line">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center gap-2.5 py-3 text-start">
      <span className="nb-num nb-num-sm">{num}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold uppercase"><span className="nb-ul">{title}</span></span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div className="min-w-0 pb-4">{children}</div>}
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
      <span className="mb-1 block text-[11px] font-bold uppercase">{label}</span>
      <div className={`nb-field flex items-center px-2 py-1.5 text-xs font-bold ${error ? '!border-rose-500' : ''}`} dir="ltr">
        <span className="nb-muted me-1">{t('currency')}</span>
        <input type="number" inputMode="numeric" min={0} value={draft} aria-invalid={!!error}
          onChange={(e) => { setDraft(e.target.value); setError(''); }} onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()} className="w-full min-w-0 bg-transparent tabular-nums outline-none" />
      </div>
      {error && <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-500">{error}</p>}
    </label>
  );
});

const PriceRangeFilter = memo(({ bounds, value, onChange, histogram, t }) => {
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
    <div className="min-w-0 space-y-4" dir="ltr">
      <div className="flex h-12 items-end gap-[3px]" aria-hidden="true">
        {histogram.map((c, i) => {
          const binStart = (i / histogram.length) * max;
          const binEnd = ((i + 1) / histogram.length) * max;
          const inRange = binEnd > lo && binStart < hi;
          return <div key={i} className={`flex-1 ${inRange ? 'nb-bin-on' : 'nb-bin'}`} style={{ height: `${Math.max(c ? 12 : 4, (c / peak) * 100)}%`, opacity: c ? 1 : 0.5 }} />;
        })}
      </div>
      <div className="relative flex h-5 items-center">
        <div className="nb-gray nb-line absolute inset-x-0 h-2 border-2" />
        <div className="absolute h-2 border-y-2 nb-line bg-[color:var(--nb-accent)]" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        <input type="range" aria-label={t('minPriceAria')} min={0} max={max} step={step} value={lo}
          onChange={(e) => onChange([Math.max(0, Math.min(Number(e.target.value), hi - step)), hi])} className="nb-range" style={{ zIndex: lo > max - step * 3 ? 5 : 3 }} />
        <input type="range" aria-label={t('maxPriceAria')} min={0} max={max} step={step} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])} className="nb-range" style={{ zIndex: 4 }} />
      </div>
      <div className="flex flex-col gap-4 min-[380px]:flex-row min-[380px]:gap-6">
        <NumField label={t('priceMin')} value={lo} onCommit={commitMin} t={t} />
        <NumField label={t('priceMax')} value={hi} onCommit={commitMax} t={t} />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const on = lo === p.r[0] && hi === p.r[1];
          return (
            <button key={p.r.join('-')} type="button" onClick={() => onChange(p.r)} aria-pressed={on}
              className={`nb-btn px-2.5 py-1 text-[11px] ${on ? 'nb-btn-on' : ''}`}>
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const FilterPanel = memo((p) => {
  const { t, categories, productsByCategory, selectedCategoryId, setSelectedCategoryId, selectedConditions, toggleCondition, conditionCounts,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, setInStockOnly, open, setOpen, clearFilters, activeFiltersCount, totalCount } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className="nb-card w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold uppercase">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="nb-ul truncate">{t('filters')}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className="flex-shrink-0 text-xs font-bold underline underline-offset-4">{t('resetAll')}</button>}
      </div>

      <FilterBlock num="01" title={t('priceRange')} isOpen={open.price} onToggle={() => toggle('price')}>
        <div className="min-w-0 px-1">
          <PriceRangeFilter bounds={priceBounds} value={priceValue} onChange={setPriceRange} histogram={histogram} t={t} />
        </div>
      </FilterBlock>

      <FilterBlock num="02" title={t('condition')} isOpen={open.cond} onToggle={() => toggle('cond')}>
        <div className="min-w-0 break-words">
          {CONDITION_ENTRIES.map(([value, cfg]) => (
            <OptionRow key={value} type="check" label={t(cfg.key)} count={conditionCounts[value] || 0} selected={selectedConditions.includes(value)} onClick={() => toggleCondition(value)} />
          ))}
          <OptionRow type="check" label={t('inStockOnly')} selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)} />
        </div>
      </FilterBlock>

      <FilterBlock num="03" title={t('category')} isOpen={open.cat} onToggle={() => toggle('cat')}>
        <div className="max-h-44 min-w-0 overflow-y-auto overscroll-contain break-words pe-1 sm:max-h-52" role="radiogroup" aria-label={t('category')}>
          <OptionRow type="radio" label={t('all')} count={totalCount} selected={selectedCategoryId === 'all'} onClick={() => setSelectedCategoryId('all')} />
          {categories.map((c) => (
            <OptionRow key={c.id} type="radio" label={c.name} count={productsByCategory[c.id]?.length || 0} selected={selectedCategoryId === c.id} onClick={() => setSelectedCategoryId(c.id)} />
          ))}
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

const Pagination = memo(({ page, total, onChange, t }) => {
  const items = useMemo(() => pageWindow(page, total), [page, total]);
  if (total <= 1) return null;
  return (
    <nav aria-label={t('pageN', { n: page })} className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button type="button" className="nb-btn h-10 w-10" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage')}>
        <FiChevronLeft className="nb-flip h-4 w-4" />
      </button>
      {items.map((n) => (typeof n === 'number' ? (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={t('pageN', { n })} aria-current={n === page ? 'page' : undefined}
          className={`nb-btn h-10 min-w-[2.5rem] px-2 text-sm tabular-nums ${n === page ? 'nb-btn-on' : ''}`}>{n}</button>
      ) : <span key={n} aria-hidden="true" className="px-1 font-extrabold">…</span>))}
      <button type="button" className="nb-btn h-10 w-10" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage')}>
        <FiChevronRight className="nb-flip h-4 w-4" />
      </button>
    </nav>
  );
});

const ProductsContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = getT(language);
  const dir = languageDirection(language);
  const font = useLangFont(language);
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const searchPending = searchTerm !== deferredSearch;
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [priceRange, setPriceRangeState] = useState(null);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(MOBILE_BATCH);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [viewMode, setViewMode] = useState('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [open, setOpen] = useState({ price: true, cond: true, cat: true });
  const [token] = useState(() => readStorage('authToken'));
  const gridRef = useRef(null);
  const showTop = useBackToTop();
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  useModalLock(isSidebarOpen, closeSidebar);

  useEffect(() => { ensureNbFont(); }, []);
  useEffect(() => { document.title = t('pageTitle'); }, [t]);

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
        const price = Number(p.price) || 0;
        const discount = clamp(Number(p.discount) || 0, 0, 100);
        out.push({
          ...p, price, discount,
          finalPrice: discount ? Math.round(price * (1 - discount / 100) * 100) / 100 : price,
          _text: fold(`${p.name || ''} ${p.categoryName || ''}`),
          _ts: Date.parse(p.createdAt) || 0,
        });
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

  const latestProducts = useMemo(() => [...products].sort((a, b) => b._ts - a._ts).slice(0, LATEST_LIMIT), [products]);

  const baseFiltered = useMemo(() => {
    const term = fold(deferredSearch).trim();
    return products.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (term && !p._text.includes(term)) return false;
      if (inStockOnly && p.stock === 0) return false;
      return true;
    });
  }, [products, deferredSearch, selectedCategoryId, inStockOnly]);

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
      (p) => p.finalPrice >= lo && p.finalPrice <= hi && (!selectedConditions.length || selectedConditions.includes(p.condition))
    );
    if (sortBy === 'priceLowToHigh') list.sort((a, b) => a.finalPrice - b.finalPrice);
    else if (sortBy === 'priceHighToLow') list.sort((a, b) => b.finalPrice - a.finalPrice);
    else if (sortBy === 'newest') list.sort((a, b) => b._ts - a._ts);
    return list;
  }, [baseFiltered, deferredPriceValue, selectedConditions, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  useEffect(() => {
    setPage(1);
    setVisibleCount(MOBILE_BATCH);
  }, [selectedCategoryId, pageSize, deferredSearch, deferredPriceValue, selectedConditions, inStockOnly, sortBy]);

  const pageOffset = (currentPage - 1) * pageSize;
  const paginatedProducts = useMemo(() => filteredProducts.slice(pageOffset, pageOffset + pageSize), [filteredProducts, pageOffset, pageSize]);
  const infiniteProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);
  const listProducts = isMobile ? infiniteProducts : paginatedProducts;
  const listOffset = isMobile ? 0 : pageOffset;
  const hasMore = isMobile && visibleCount < filteredProducts.length;
  const startItem = filteredProducts.length ? listOffset + 1 : 0;
  const endItem = isMobile ? infiniteProducts.length : Math.min(pageOffset + pageSize, filteredProducts.length);

  const loadMore = useCallback(() => startTransition(() => setVisibleCount((c) => c + MOBILE_BATCH)), []);

  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  const goToPage = useCallback((pg) => { setPage(pg); scrollToGrid(); }, [scrollToGrid]);
  const selectCategory = useCallback((id) => { setSelectedCategoryId(id); scrollToGrid(); }, [scrollToGrid]);
  const openProduct = useCallback((id) => navigate(`/device/${encodeURIComponent(id)}`), [navigate]);

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
    setSearchTerm(''); setPriceRangeState(null); setSelectedCategoryId('all'); setSelectedConditions([]); setInStockOnly(false); setSortBy('relevance'); setPage(1); setVisibleCount(MOBILE_BATCH);
  }, []);
  const toggleCondition = useCallback((c) => setSelectedConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])), []);
  const resetCategory = useCallback(() => setSelectedCategoryId('all'), []);
  const resetPrice = useCallback(() => setPriceRangeState(null), []);
  const resetStock = useCallback(() => setInStockOnly(false), []);
  const resetSearch = useCallback(() => setSearchTerm(''), []);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCategoryId !== 'all' ? 1 : 0) + selectedConditions.length + (priceRange ? 1 : 0) + (inStockOnly ? 1 : 0);
  const selectedCategoryName = useMemo(() => categories.find((c) => c.id === selectedCategoryId)?.name, [categories, selectedCategoryId]);
  const currency = t('currency');
  const totalCount = products.length;

  const filterPanelProps = useMemo(() => ({
    t, categories, productsByCategory, selectedCategoryId, setSelectedCategoryId, selectedConditions, toggleCondition, conditionCounts,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, setInStockOnly, open, setOpen, clearFilters, activeFiltersCount, totalCount,
  }), [t, categories, productsByCategory, selectedCategoryId, selectedConditions, toggleCondition, conditionCounts,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, open, clearFilters, activeFiltersCount, totalCount]);

  const layout = isMobile ? 'grid' : viewMode;
  const skeletonCols = layout === 'grid' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1';
  const stale = searchPending || deferredPriceValue !== priceValue;

  return (
    <div
      dir={dir} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-hidden ${isAr ? font.className : ''}`}
    >
      {STYLE_EL}
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <Suspense fallback={<div className="nb-gray h-[360px] w-full animate-pulse sm:h-[480px]" />}>
        <Hero variant="devices" darkMode={darkMode} />
      </Suspense>

      <CategoryGrid categories={categories} productsByCategory={productsByCategory} selectedCategoryId={selectedCategoryId} onSelect={selectCategory} darkMode={darkMode} t={t} />

      {!isLoading && latestProducts.length > 0 && (
        <LatestSection products={latestProducts} darkMode={darkMode} onAddToCart={handleAddToCart} onOpen={openProduct} t={t} />
      )}

      <section aria-label={t('allProducts')} className="nb-bg">
        <span className="nb-divider" aria-hidden="true" />
        <div id="products-grid" ref={gridRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <SectionHead eyebrow={t('eyebrowProducts')} title={t('allProducts')} subtitle={t('allProductsSubtitle')} />

          <div className="flex items-start gap-5 lg:gap-8">
            <aside className="nb-aside sticky top-20 hidden max-h-[calc(100vh-6rem)] w-[17rem] min-w-0 flex-shrink-0 self-start overflow-y-auto overscroll-contain pb-2 pe-2 lg:block xl:w-[19rem]">
              <FilterPanel {...filterPanelProps} />
            </aside>

            <div className="w-full min-w-0 flex-1">
              <div className="nb-card mb-6 flex flex-col gap-3 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm opacity-80" aria-live="polite">
                    {interpolateNodes(t('showing'), {
                      range: <b className="opacity-100" dir="ltr">{startItem}–{endItem}</b>,
                      total: <b dir="ltr">{filteredProducts.length}</b>,
                    })}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="hidden items-center gap-2 lg:flex">
                      <NbDropdown ariaLabel={t('rowsPerPage')} value={pageSize} onChange={setPageSize} options={rowOptions} className="w-36 flex-shrink-0" />
                      {[['grid', FiGrid, t('gridView')], ['list', FiList, t('listView')]].map(([mode, Icon, label]) => (
                        <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-label={label} aria-pressed={viewMode === mode}
                          className={`nb-btn h-10 w-10 ${viewMode === mode ? 'nb-btn-on' : ''}`}>
                          <Icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={openSidebar} className="nb-btn h-10 px-3 text-xs uppercase lg:hidden">
                      <FiSliders className="h-3.5 w-3.5" /> {t('filters')}
                      {activeFiltersCount > 0 && <span className="flex h-4 min-w-[1rem] items-center justify-center bg-[color:var(--nb-on)] px-1 text-[10px] font-bold text-white">{activeFiltersCount}</span>}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <SearchField value={searchTerm} onChange={setSearchTerm} placeholder={t('search')} ariaLabel={t('searchAria')} clearLabel={t('clearSearch')} pending={searchPending} />
                  <NbDropdown ariaLabel={t('sortProducts')} value={sortBy} onChange={setSortBy} options={sortOptions} className="w-full sm:w-52" />
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  {selectedCategoryId !== 'all' && <FilterChip label={selectedCategoryName || t('category')} onRemove={resetCategory} />}
                  {selectedConditions.map((c) => <FilterChip key={c} label={condLabel(t, c)} onRemove={() => toggleCondition(c)} />)}
                  {priceRange && <FilterChip label={`${money(priceValue[0], currency)} – ${money(priceValue[1], currency)}`} onRemove={resetPrice} />}
                  {inStockOnly && <FilterChip label={t('inStock')} onRemove={resetStock} />}
                  {searchTerm && <FilterChip label={`“${searchTerm.slice(0, 20)}”`} onRemove={resetSearch} />}
                  <button type="button" onClick={clearFilters} className="text-xs font-bold underline underline-offset-4">{t('clearAll')}</button>
                </div>
              )}

              {isLoading ? (
                <div className={`grid gap-4 sm:gap-6 ${skeletonCols}`} role="status" aria-busy="true">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="nb-gray nb-line h-[300px] animate-pulse border-2 motion-reduce:animate-none sm:h-[360px]" />)}
                </div>
              ) : isError ? (
                <div className="nb-card px-4 py-14 text-center sm:py-20">
                  <DeviceScene className="mx-auto mb-4 h-24 w-32" />
                  <p className="mb-2 text-lg font-extrabold uppercase sm:text-xl">{t('loadErrorTitle')}</p>
                  <p className="mb-6 text-sm opacity-80">{t('loadErrorText')}</p>
                  <button type="button" onClick={() => refetch()} className="nb-btn nb-btn-a px-6 py-3 text-sm uppercase"><FiRefreshCw className="h-4 w-4" /> {t('tryAgain')}</button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="nb-card px-4 py-14 text-center sm:py-24">
                  <DeviceScene className="mx-auto mb-4 h-24 w-32" />
                  <p className="mb-2 text-lg font-extrabold uppercase sm:text-2xl">{t('noProducts')}</p>
                  <p className="mb-6 text-sm opacity-80 sm:text-base">{t('adjustFilters')}</p>
                  <button type="button" onClick={clearFilters} className="nb-btn nb-btn-a px-6 py-3 text-sm uppercase sm:text-base">{t('clearFilters')}</button>
                </div>
              ) : (
                <div aria-busy={stale} className={`transition-opacity duration-150 motion-reduce:transition-none ${stale ? 'opacity-70' : 'opacity-100'}`}>
                  <ProductGrid products={listProducts} offset={listOffset} layout={layout} darkMode={darkMode} onAddToCart={handleAddToCart} onOpen={openProduct} t={t} />
                  {isMobile
                    ? <InfiniteSentinel hasMore={hasMore} count={filteredProducts.length} onMore={loadMore} t={t} />
                    : <Pagination page={currentPage} total={totalPages} onChange={goToPage} t={t} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {showTop && (
            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-5 end-5 z-40">
              <button type="button" onClick={scrollToTop} aria-label={t('backToTop')} className="nb-btn nb-btn-a h-11 w-11"><FiArrowUp className="h-5 w-5" /></button>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('filters')}>
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/60" onClick={closeSidebar} />
              <m.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.22 }}
                className="nb-bg nb-line nb-drawer absolute inset-x-0 bottom-0 flex max-h-[88vh] min-w-0 transform-gpu flex-col border-t-2 sm:inset-y-0 sm:end-auto sm:start-0 sm:max-h-none sm:w-[22rem] sm:max-w-[90vw] sm:border-e-2 sm:border-t-0 md:w-96">
                <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-4">
                  <h3 className="text-base font-extrabold uppercase"><span className="nb-ul">{t('filters')}</span></h3>
                  <button type="button" onClick={closeSidebar} aria-label={t('closeFilters')} className="nb-btn h-9 w-9"><FiX className="h-5 w-5" /></button>
                </div>
                <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pe-4 sm:px-4 sm:pe-5"><FilterPanel {...filterPanelProps} /></div>
                <div className="nb-line nb-drawer border-t-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                  <button type="button" onClick={() => { closeSidebar(); scrollToGrid(); }} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">{t('showItems', { count: filteredProducts.length })}</button>
                </div>
              </m.div>
            </div>
          )}
        </AnimatePresence>
      </LazyMotion>
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