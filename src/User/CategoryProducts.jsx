import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo, Suspense, lazy, useDeferredValue,
} from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiShoppingCart, FiChevronLeft, FiChevronRight, FiX, FiSliders, FiGrid, FiList,
  FiArrowRight, FiArrowUp, FiArrowLeft, FiInfo, FiShield, FiTool, FiRefreshCw, FiCheck, FiPackage,
} from 'react-icons/fi';
import { RiVerifiedBadgeLine } from 'react-icons/ri';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import api from '../api';
import Navbar from '../components/Navbar';
import {
  UI3D_CSS, Defs3D, Glyph3D, Scene3D, Btn3D, Chip3D, TrustStrip,
  FilterSection, OptionRow, PageBtn, getPaginationRange,
} from '../components/Ui3D';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

/* Heavy / below-the-fold pieces load on demand (same approach as Shops) */
const Hero = lazy(() => import('../components/Hero'));
const Footer = lazy(() => import('../components/Footer'));
const queryClient = new QueryClient();

/* ───────────── helpers ───────────── */
const CATEGORY_TRANSLATIONS = {
  en: enTranslations.devices,
  ar: arTranslations.devices || arTranslations.hero?.devices,
  fr: frTranslations.devices || frTranslations.hero?.devices,
};
const tr = (lang, key, fallback) => CATEGORY_TRANSLATIONS[lang]?.[key] || CATEGORY_TRANSLATIONS.en?.[key] || fallback || key;

const PAGE_SIZES = [12, 24, 48];
const CONDITIONS = ['New', 'Refurbished', 'Used'];
const CONDITION_META = {
  New: { kind: 'box', dot: 'bg-emerald-500', light: 'bg-emerald-100 text-emerald-800', dark: 'bg-emerald-900/40 text-emerald-300' },
  Refurbished: { kind: 'wrench', dot: 'bg-sky-500', light: 'bg-sky-100 text-sky-800', dark: 'bg-sky-900/40 text-sky-300' },
  Used: { kind: 'phone', dot: 'bg-amber-500', light: 'bg-amber-100 text-amber-800', dark: 'bg-amber-900/40 text-amber-300' },
};
const SORT_LABELS = {
  relevance: 'Relevance',
  priceLowToHigh: 'Price: low to high',
  priceHighToLow: 'Price: high to low',
  newest: 'Newest arrivals',
};
const TRUST_ITEMS = [
  { icon: RiVerifiedBadgeLine, title: 'Verified sellers', text: 'Checked by our team' },
  { icon: FiTool, title: 'Quality checked', text: 'Tested before listing' },
  { icon: FiRefreshCw, title: 'Less e-waste', text: 'Give devices a second life' },
  { icon: FiShield, title: 'Secure checkout', text: 'Protected payments' },
];

const money = (n) => `EGP ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const finalPrice = (p) => (p.discount > 0 ? p.price * (1 - p.discount / 100) : Number(p.price) || 0);
const priceStep = (max) => (max > 50000 ? 1000 : max > 5000 ? 100 : 10);

let swalPromise;
const loadSwal = () => {
  if (!swalPromise) swalPromise = import('sweetalert2').then((mod) => mod.default || mod);
  return swalPromise;
};

const pageStyles = `${UI3D_CSS}
  .pr-range { -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; }
  .pr-range::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 18px; height: 18px; border-radius: 9999px; background: #fff; border: 2px solid #10b981; box-shadow: 0 2px 0 0 #047857; cursor: grab; }
  .pr-range::-moz-range-thumb { pointer-events: auto; width: 14px; height: 14px; border-radius: 9999px; background: #fff; border: 2px solid #10b981; box-shadow: 0 2px 0 0 #047857; cursor: grab; }
  .pr-range:focus-visible::-webkit-slider-thumb { outline: 2px solid #34d399; outline-offset: 2px; }
`;

/* horizontal slider edge detection (no re-render unless the edge state changes) */
const useHScroll = (dep) => {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ l: false, r: false });
  const scroll = useCallback((dir) => ref.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' }), []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = Math.abs(el.scrollLeft);
        const l = x > 2, r = x + el.clientWidth < el.scrollWidth - 5;
        setEdge((p) => (p.l === l && p.r === r ? p : { l, r }));
      });
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [dep]);
  return { ref, edge, scroll };
};

/* ───────────── Product card ───────────── */
const ProductCard = memo(({ product, darkMode, index = 0, layout = 'grid', onAddToCart, onOpen }) => {
  const [imgState, setImgState] = useState('loading'); // loading | ok | error
  const [btn, setBtn] = useState('idle'); // idle | adding | added
  const imgRef = useRef(null);
  const timer = useRef();
  const isList = layout === 'list';
  const hasDiscount = product.discount > 0;
  const cond = CONDITION_META[product.condition];

  useEffect(() => { if (imgRef.current?.complete && imgRef.current.naturalWidth) setImgState('ok'); }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const open = useCallback(() => onOpen(product.id), [onOpen, product.id]);
  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (btn === 'adding') return;
    setBtn('adding');
    const ok = await onAddToCart(product);
    setBtn(ok ? 'added' : 'idle');
    if (ok) timer.current = setTimeout(() => setBtn('idle'), 1600);
  }, [btn, onAddToCart, product]);

  const src = imgState === 'error' ? '/placeholder.png' : (product.image || product.imageUrl || '/placeholder.png');

  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={product.name}
      style={{ '--i': Math.min(index, 8) }}
      className={`anim-fade-up group relative flex h-full cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
        isList ? 'flex-row' : 'flex-col'
      } ${darkMode ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30' : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'}`}
    >
      {hasDiscount && (
        <span className="absolute start-2.5 top-2.5 z-10 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-md shadow-rose-500/30">
          -{product.discount}%
        </span>
      )}

      <div className={`relative flex-shrink-0 overflow-hidden ${isList ? 'w-32 sm:w-44' : 'w-full'} aspect-square ${darkMode ? 'bg-emerald-900/20' : 'bg-gradient-to-br from-emerald-50 to-emerald-100/60'}`}>
        {imgState === 'loading' && <div className={`absolute inset-0 animate-pulse ${darkMode ? 'bg-gray-700/60' : 'bg-emerald-100/70'}`} />}
        <img
          ref={imgRef} src={src} alt={product.name} width={400} height={400}
          loading="lazy" decoding="async"
          onLoad={() => setImgState((s) => (s === 'error' ? s : 'ok'))}
          onError={() => setImgState('error')}
          className={`h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105 ${imgState === 'loading' ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5">
        <h3 className={`line-clamp-2 text-sm font-bold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>

        {cond && (
          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${darkMode ? cond.dark : cond.light}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cond.dot}`} />{product.condition}
          </span>
        )}

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-lg font-extrabold tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{money(product._final)}</span>
          {hasDiscount && <span className={`text-xs tabular-nums line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{money(product.price)}</span>}
        </div>

        <p className={`line-clamp-2 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {product.description || 'No description available.'}
        </p>

        <div className={`mt-auto grid grid-cols-2 gap-2 border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <Btn3D tone="soft" darkMode={darkMode} onClick={(e) => { e.stopPropagation(); open(); }} className="py-2 text-xs">
            <FiInfo className="h-3.5 w-3.5" /> Details
          </Btn3D>
          <Btn3D onClick={handleCart} disabled={btn === 'adding'} className="py-2 text-xs">
            {btn === 'adding' ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Adding</>
              : btn === 'added' ? <><FiCheck className="h-3.5 w-3.5" /> Added</>
              : <><FiShoppingCart className="h-3.5 w-3.5" /> Add</>}
          </Btn3D>
        </div>
      </div>
    </article>
  );
});

/* ───────────── Condition spotlight (mirrors Shops' SpecialtyGrid) ───────────── */
const ConditionGrid = memo(({ counts, selected, onToggle, onReset, darkMode, title, subtitle }) => {
  const items = CONDITIONS.filter((c) => counts[c] > 0);
  if (!items.length) return null;
  return (
    <section className={`relative overflow-hidden py-12 sm:py-16 ${darkMode ? 'bg-[#04120b]' : 'bg-emerald-50/70'}`}>
      <div className={`pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full blur-3xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-300/30'}`} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
          <div className="flex items-center gap-6">
            <div>
              <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{title}</h2>
              <p className={`mt-1.5 text-sm sm:text-base ${darkMode ? 'text-emerald-200/60' : 'text-emerald-800/70'}`}>{subtitle}</p>
            </div>
            <Scene3D className="hidden h-28 w-40 lg:block" main="laptop" float="phone" extra="box" />
          </div>
          <Btn3D onClick={onReset} className="px-4 py-2 text-sm">All products <FiArrowRight className="h-4 w-4 rtl:rotate-180" /></Btn3D>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {items.map((c) => {
            const active = selected.includes(c);
            return (
              <button key={c} type="button" onClick={() => onToggle(c)} aria-pressed={active}
                className={`group flex flex-col items-center gap-2.5 rounded-3xl border p-3 text-center transition-all duration-150 hover:-translate-y-1 active:translate-y-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 sm:p-5 ${
                  active
                    ? `border-emerald-500 ring-2 ring-emerald-500 shadow-[0_6px_0_0_#047857,0_16px_24px_-10px_rgba(5,150,105,0.5)] ${darkMode ? 'bg-gray-800' : 'bg-white'}`
                    : darkMode ? 'border-gray-700 bg-gray-800 shadow-[0_6px_0_0_#064e3b] hover:border-emerald-500' : 'border-gray-200 bg-white shadow-[0_6px_0_0_#d1fae5] hover:border-emerald-400'
                }`}>
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 sm:h-20 sm:w-20 ${
                  active ? (darkMode ? 'bg-emerald-900/60 ring-emerald-500/40' : 'bg-emerald-100 ring-emerald-300') : (darkMode ? 'bg-emerald-900/30 ring-emerald-900/50' : 'bg-emerald-50 ring-emerald-100')}`}>
                  <Glyph3D kind={CONDITION_META[c].kind} className="h-9 w-9 transition-transform duration-200 group-hover:scale-110 sm:h-14 sm:w-14" />
                </span>
                <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{c}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${active ? 'bg-emerald-500 text-white' : darkMode ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-600/10 text-emerald-700'}`}>
                  {counts[c]} {counts[c] === 1 ? 'item' : 'items'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

/* ───────────── Price slider ───────────── */
const PriceRangeSlider = memo(({ range, max, step, onChange, darkMode }) => {
  const [lo, hi] = range;
  const leftPct = (lo / max) * 100;
  const rightPct = (hi / max) * 100;
  const pill = `rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${darkMode ? 'bg-emerald-400/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
  return (
    <div className="space-y-4 pb-1">
      <div className="flex justify-between gap-2">
        <span className={pill}>EGP {lo.toLocaleString()}</span>
        <span className={pill}>EGP {hi.toLocaleString()}</span>
      </div>
      <div className="relative h-5">
        <div className={`absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-500" style={{ insetInlineStart: `${leftPct}%`, insetInlineEnd: `${100 - rightPct}%` }} />
        <input type="range" aria-label="Minimum price" className="pr-range" min={0} max={max} step={step} value={lo}
          style={{ zIndex: lo > max / 2 ? 5 : 3 }}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])} />
        <input type="range" aria-label="Maximum price" className="pr-range" min={0} max={max} step={step} value={hi}
          style={{ zIndex: 4 }}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])} />
      </div>
    </div>
  );
});

/* ───────────── Filter panel ───────────── */
const FilterPanel = memo((p) => {
  const { darkMode, t, countsByCondition, conditions, toggleCondition, onSaleOnly, setOnSaleOnly, onSaleCount,
    priceRange, setPriceRange, maxPrice, open, setOpen, clearFilters, activeFiltersCount } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const step = priceStep(maxPrice);
  return (
    <div className={`rounded-2xl border p-5 ${darkMode ? 'border-emerald-900/60 bg-gray-900' : 'border-emerald-100 bg-white'}`}>
      <div className="mb-1 flex items-center justify-between">
        <h3 className={`flex items-center gap-2 text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Chip3D className="h-7 w-7"><FiSliders className="h-3.5 w-3.5" /></Chip3D> {t('filters')}
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400">Reset all</button>}
      </div>

      <FilterSection title={t('condition')} isOpen={open.cond} onToggle={() => toggle('cond')} darkMode={darkMode}>
        {CONDITIONS.map((c) => (
          <OptionRow key={c} type="check" label={c} count={countsByCondition[c] || 0} selected={conditions.includes(c)} onClick={() => toggleCondition(c)} darkMode={darkMode} />
        ))}
      </FilterSection>

      {maxPrice > 0 && (
        <FilterSection title={t('priceRange')} isOpen={open.price} onToggle={() => toggle('price')} darkMode={darkMode}>
          <PriceRangeSlider range={priceRange || [0, maxPrice]} max={maxPrice} step={step} onChange={setPriceRange} darkMode={darkMode} />
        </FilterSection>
      )}

      <FilterSection title="Offers" isOpen={open.offers} onToggle={() => toggle('offers')} darkMode={darkMode}>
        <OptionRow type="check" label="On sale only" count={onSaleCount} selected={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} darkMode={darkMode} />
      </FilterSection>
    </div>
  );
});

/* ───────────── Page ───────────── */
const CategoryProductsContent = memo(({ darkMode, toggleDarkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k, fb) => tr(language, k, fb), [language]);
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState(null); // null = full range (no filter)
  const [conditions, setConditions] = useState([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [open, setOpen] = useState({ cond: true, price: true, offers: true });
  const [showTop, setShowTop] = useState(false);
  const gridRef = useRef(null);

  /* one deferred object → typing / dragging stays responsive, list recomputes at low priority */
  const filters = useMemo(() => ({ searchTerm, priceRange, conditions, onSaleOnly, sortBy }), [searchTerm, priceRange, conditions, onSaleOnly, sortBy]);
  const deferred = useDeferredValue(filters);
  const isStale = deferred !== filters;

  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const res = await api.get(`/api/categories/${categoryId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const c = res.data?.content || res.data || {};
      return { id: c.id ?? categoryId, name: c.name || 'Category' };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: products = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: async () => {
      const res = await api.get(`/api/products/category/${categoryId}`);
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list.filter(Boolean) : [];
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { document.title = category?.name ? `${category.name} | Tech-Restore` : 'Category | Tech-Restore'; }, [category]);
  useEffect(() => {
    setSearchTerm(''); setPriceRange(null); setConditions([]); setOnSaleOnly(false); setSortBy('relevance'); setCurrentPage(1);
  }, [categoryId]);

  /* derived data – computed once per fetch, not per keystroke */
  const enriched = useMemo(() => products.map((p) => ({
    ...p, _final: finalPrice(p), _name: (p.name || '').toLowerCase(), _ts: Date.parse(p.createdAt) || 0,
  })), [products]);

  const maxPrice = useMemo(() => {
    const top = enriched.reduce((mx, p) => Math.max(mx, p._final), 0);
    const step = priceStep(top);
    return top ? Math.ceil(top / step) * step : 0;
  }, [enriched]);

  const countsByCondition = useMemo(() => {
    const c = {};
    enriched.forEach((p) => { if (p.condition) c[p.condition] = (c[p.condition] || 0) + 1; });
    return c;
  }, [enriched]);
  const onSaleCount = useMemo(() => enriched.filter((p) => p.discount > 0).length, [enriched]);
  const deals = useMemo(() => enriched.filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 8), [enriched]);

  const filteredProducts = useMemo(() => {
    const { searchTerm: s, priceRange: pr, conditions: cs, onSaleOnly: os, sortBy: sb } = deferred;
    const term = s.trim().toLowerCase();
    const lo = pr ? pr[0] : 0;
    const hi = pr ? pr[1] : Infinity;
    const list = enriched.filter((p) => {
      if (p._final < lo || p._final > hi) return false;
      if (cs.length && !cs.includes(p.condition)) return false;
      if (os && !(p.discount > 0)) return false;
      if (term && !p._name.includes(term)) return false;
      return true;
    });
    if (sb === 'priceLowToHigh') list.sort((a, b) => a._final - b._final);
    else if (sb === 'priceHighToLow') list.sort((a, b) => b._final - a._final);
    else if (sb === 'newest') list.sort((a, b) => b._ts - a._ts);
    return list;
  }, [enriched, deferred]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [pageSize, deferred]);
  useEffect(() => { setCurrentPage((p) => Math.min(p, totalPages)); }, [totalPages]);

  const paginated = useMemo(() => filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredProducts, currentPage, pageSize]);
  const startItem = filteredProducts.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, filteredProducts.length);

  const activeFiltersCount = (searchTerm ? 1 : 0) + conditions.length + (priceRange ? 1 : 0) + (onSaleOnly ? 1 : 0);

  /* actions (all stable so memoised cards never re-render because of them) */
  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);
  const toggleCondition = useCallback((c) => setConditions((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const pickCondition = useCallback((c) => { toggleCondition(c); scrollToGrid(); }, [toggleCondition, scrollToGrid]);
  const resetCondition = useCallback(() => { setConditions([]); scrollToGrid(); }, [scrollToGrid]);
  const clearFilters = useCallback(() => {
    setSearchTerm(''); setPriceRange(null); setConditions([]); setOnSaleOnly(false); setSortBy('relevance'); setCurrentPage(1);
  }, []);
  const openProduct = useCallback((id) => navigate(`/device/${id}`), [navigate]);
  const handleCartClick = useCallback(() => navigate('/cart'), [navigate]);

  const handleAddToCart = useCallback(async (product) => {
    const token = localStorage.getItem('authToken'); // read at click time so login state is never stale
    if (!token) {
      const Swal = await loadSwal();
      const result = await Swal.fire({
        title: 'Please log in', text: 'You need to log in before adding items to your cart.',
        icon: 'info', showCancelButton: true, confirmButtonText: 'Go to login',
      });
      if (result.isConfirmed) navigate('/login');
      return false;
    }
    try {
      const res = await api.post('/api/cart/items',
        { productId: product.id, quantity: 1, price: product.price, name: product.name, imageUrl: product.image || product.imageUrl || '/placeholder.png' },
        { headers: { Authorization: `Bearer ${token}` } });
      if (res.status < 200 || res.status >= 300) throw new Error('Unexpected response');
      window.dispatchEvent(new Event('cart:updated'));
      const Swal = await loadSwal();
      Swal.fire({ title: 'Added!', text: `${product.name} added to cart`, icon: 'success', toast: true, position: 'top-end', timer: 1500, timerProgressBar: true });
      return true;
    } catch {
      const Swal = await loadSwal();
      Swal.fire({ title: 'Error', text: 'Failed to add to cart', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      return false;
    }
  }, [navigate]);

  /* deals slider + back-to-top + drawer lock */
  const { ref: sliderRef, edge, scroll: scrollSlider } = useHScroll(deals);
  useEffect(() => {
    let raf;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setShowTop(window.scrollY > 700)); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setIsSidebarOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [isSidebarOpen]);

  const categoryName = category?.name || 'This Category';
  const heroStats = useMemo(() => [
    { value: `${products.length}`, label: 'Products available' },
    { value: '100%', label: 'Quality checked' },
    { value: '4.8 ★', label: 'Avg category rating' },
  ], [products.length]);
  const heroButtons = useMemo(() => [
    { label: 'View Products', onClick: scrollToGrid, primary: true },
    { label: 'All Categories', to: '/devices', primary: false },
  ], [scrollToGrid]);

  const filterPanelProps = {
    darkMode, t, countsByCondition, conditions, toggleCondition, onSaleOnly, setOnSaleOnly, onSaleCount,
    priceRange, setPriceRange, maxPrice, open, setOpen, clearFilters, activeFiltersCount,
  };

  const gridCols = viewMode === 'grid' ? 'grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1';
  const showArrows = deals.length > 3 && (edge.l || edge.r);
  const arrowBtn = (dir, disabled) => (
    <Btn3D tone="soft" darkMode={darkMode} onClick={() => scrollSlider(dir)} disabled={disabled} aria-label={`Scroll ${dir}`} className="h-10 w-10">
      {dir === 'left' ? <FiChevronLeft className="h-5 w-5 rtl:rotate-180" /> : <FiChevronRight className="h-5 w-5 rtl:rotate-180" />}
    </Btn3D>
  );
  const chip = (label, onRemove) => (
    <span key={label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? 'bg-emerald-400/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}><FiX className="h-3 w-3" /></button>
    </span>
  );
  const selectCls = `rounded-xl border px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`;
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const strong = darkMode ? 'text-white' : 'text-gray-900';

  return (
    <div dir={languageDirection(language)} className={`min-h-screen ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <style>{pageStyles}</style>
      <Defs3D />
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} onCartClick={handleCartClick} />

      <Suspense fallback={<div className={`h-[420px] w-full animate-pulse sm:h-[480px] ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'}`} />}>
        <Hero
          variant="category"
          darkMode={darkMode}
          badge={`Browsing ${categoryName}`}
          headingLine1="Everything in"
          headingAccent={categoryName}
          headingLine2=""
          description={`Verified ${categoryName.toLowerCase()} listings from trusted sellers — filter by price and condition to find the right fit.`}
          buttons={heroButtons}
          stats={heroStats}
        />
      </Suspense>

      <TrustStrip items={TRUST_ITEMS} darkMode={darkMode} />

      {!isLoading && !isError && (
        <ConditionGrid counts={countsByCondition} selected={conditions} onToggle={pickCondition} onReset={resetCondition}
          darkMode={darkMode} title="Shop by condition" subtitle="Pick the condition that fits your budget." />
      )}

      {!isLoading && deals.length > 0 && (
        <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 ring-1 ring-emerald-500/20' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'}`}>
              <div className="pointer-events-none absolute -end-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-md">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white"><FiPackage className="h-3 w-3" /> Deals</span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Biggest discounts</h2>
                  <p className="mt-1 text-sm text-emerald-50/80">Best savings in {categoryName} right now.</p>
                  {showArrows && <div className="mt-4 flex gap-2">{arrowBtn('left', !edge.l)}{arrowBtn('right', !edge.r)}</div>}
                </div>
                <Scene3D className="hidden h-32 w-48 sm:block lg:h-36 lg:w-56" main="box" float="phone" extra="laptop" />
              </div>
            </div>
            <div ref={sliderRef} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 sm:gap-5">
              {deals.map((p, i) => (
                <div key={p.id} className="w-[260px] flex-shrink-0 snap-start sm:w-[280px]">
                  <ProductCard product={p} darkMode={darkMode} index={i} onAddToCart={handleAddToCart} onOpen={openProduct} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div id="category-products" ref={gridRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link to="/devices" className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}>
          <FiArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to all products
        </Link>

        <div className="flex items-start gap-6 lg:gap-8">
          <aside className="sticky top-20 hidden max-h-[calc(100vh-5rem)] w-64 flex-shrink-0 self-start overflow-y-auto lg:block xl:w-72">
            <FilterPanel {...filterPanelProps} />
          </aside>

          <div className="w-full min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <p className={`whitespace-nowrap text-sm ${muted}`} aria-live="polite">
                  <b className={strong}>{startItem}–{endItem}</b> / <b className={strong}>{filteredProducts.length}</b> products
                </p>
                <div className={`flex min-w-[160px] max-w-xs flex-1 items-center gap-2 rounded-xl border px-3 py-2 focus-within:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <FiSearch className={`h-4 w-4 flex-shrink-0 ${muted}`} />
                  <input type="search" value={searchTerm} maxLength={80} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search')} aria-label="Search products"
                    className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'}`} />
                  {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}><FiX className="h-3.5 w-3.5" /></button>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex gap-1.5">
                  {[['grid', FiGrid], ['list', FiList]].map(([mode, Icon]) => (
                    <Btn3D key={mode} tone={viewMode === mode ? 'em' : 'soft'} darkMode={darkMode} onClick={() => setViewMode(mode)} aria-label={`${mode} view`} aria-pressed={viewMode === mode} className="h-9 w-9">
                      <Icon className="h-4 w-4" />
                    </Btn3D>
                  ))}
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label={t('sortBy')} className={selectCls}>
                  {Object.entries(SORT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Items per page" className={`hidden sm:block ${selectCls}`}>
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
                <Btn3D tone="soft" darkMode={darkMode} onClick={() => setIsSidebarOpen(true)} className="px-3 py-2 text-xs lg:hidden">
                  <FiSliders className="h-3.5 w-3.5 text-emerald-500" /> {t('filters')}
                  {activeFiltersCount > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">{activeFiltersCount}</span>}
                </Btn3D>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {conditions.map((c) => chip(c, () => toggleCondition(c)))}
                {priceRange && chip(`EGP ${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}`, () => setPriceRange(null))}
                {onSaleOnly && chip('On sale', () => setOnSaleOnly(false))}
                {searchTerm && chip(`“${searchTerm.slice(0, 20)}”`, () => setSearchTerm(''))}
                <button type="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400">Clear all</button>
              </div>
            )}

            <div aria-busy={isStale} className={`transition-opacity duration-150 ${isStale ? 'opacity-70' : 'opacity-100'}`}>
              {isLoading ? (
                <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${gridCols}`}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`h-[360px] animate-pulse rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}
                </div>
              ) : isError ? (
                <div className="py-20 text-center">
                  <Scene3D compact className="mx-auto mb-4 h-24 w-32" />
                  <p className={`mb-2 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>We couldn’t load the products</p>
                  <p className={`mb-6 text-sm ${muted}`}>Check your connection and try again.</p>
                  <Btn3D onClick={() => refetch()} className="px-6 py-3 text-sm"><FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Try again</Btn3D>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-20 text-center sm:py-28">
                  <Scene3D compact className="mx-auto mb-4 h-24 w-32" main="box" />
                  <p className={`mb-2 text-xl font-bold sm:text-2xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>{products.length ? 'No products found' : 'Nothing listed here yet'}</p>
                  <p className={`mb-6 text-sm sm:text-base ${muted}`}>{products.length ? 'Try removing a filter or searching a different word.' : 'New listings are added often. Check back soon.'}</p>
                  {products.length > 0 && <Btn3D onClick={clearFilters} className="px-6 py-3 text-sm sm:text-base">{t('clearFilters')}</Btn3D>}
                </div>
              ) : (
                <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${gridCols}`}>
                  {paginated.map((p, i) => (
                    <ProductCard key={p.id} product={p} darkMode={darkMode} index={i} layout={viewMode} onAddToCart={handleAddToCart} onOpen={openProduct} />
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-14">
                <PageBtn darkMode={darkMode} aria-label="Previous page" onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); scrollToGrid(); }} disabled={currentPage === 1}><FiChevronLeft className="h-4 w-4 rtl:rotate-180" /></PageBtn>
                {getPaginationRange(currentPage, totalPages).map((pg, i) =>
                  pg === '…'
                    ? <span key={`d${i}`} className={`w-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>…</span>
                    : <PageBtn key={pg} darkMode={darkMode} active={currentPage === pg} onClick={() => { setCurrentPage(pg); scrollToGrid(); }}>{pg}</PageBtn>
                )}
                <PageBtn darkMode={darkMode} aria-label="Next page" onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); scrollToGrid(); }} disabled={currentPage === totalPages}><FiChevronRight className="h-4 w-4 rtl:rotate-180" /></PageBtn>
              </nav>
            )}
          </div>
        </div>
      </div>

      {showTop && (
        <div className="fixed bottom-5 end-5 z-40">
          <Btn3D onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" className="h-11 w-11"><FiArrowUp className="h-5 w-5" /></Btn3D>
        </div>
      )}

      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('filters')}>
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
              <m.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.2 }}
                className={`absolute bottom-0 start-0 top-0 w-80 max-w-[90vw] overflow-y-auto p-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="mb-3 flex justify-end">
                  <Btn3D tone="soft" darkMode={darkMode} onClick={() => setIsSidebarOpen(false)} aria-label="Close filters" className="h-9 w-9"><FiX className="h-5 w-5" /></Btn3D>
                </div>
                <FilterPanel {...filterPanelProps} />
                <Btn3D onClick={() => { setIsSidebarOpen(false); scrollToGrid(); }} className="mt-4 w-full py-3 text-sm">Show {filteredProducts.length} products</Btn3D>
              </m.div>
            </div>
          )}
        </AnimatePresence>
      </LazyMotion>

      <Suspense fallback={null}><Footer darkMode={darkMode} /></Suspense>
    </div>
  );
});

export default function CategoryProducts(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <CategoryProductsContent {...props} />
    </QueryClientProvider>
  );
}