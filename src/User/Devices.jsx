import React, {
  useState, useEffect, useCallback, useRef, useMemo, memo,
  Suspense, lazy, useDeferredValue,
} from 'react';
import {
  FiSearch, FiShoppingCart, FiChevronLeft, FiChevronRight,
  FiX, FiChevronDown, FiSliders, FiEye, FiArrowRight, FiCheck, FiPlus,
  FiShield, FiTruck, FiRefreshCw, FiGrid, FiList,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const Hero = lazy(() => import('../components/Hero'));
const loadSwal = () => import('sweetalert2').then((m) => m.default);

const queryClient = new QueryClient();

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, delay: Math.min(i, 8) * 0.02, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const GLASS = 'backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10';
const GLASS_STRONG = 'backdrop-blur-2xl bg-white/70 dark:bg-gray-900/50 border border-black/10 dark:border-white/10';

const HeroSkeleton = memo(({ darkMode }) => (
  <div className={`h-[420px] sm:h-[480px] w-full ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'} animate-pulse`} />
));

const conditionConfig = {
  New:         { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', label: 'New' },
  Used:        { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', label: 'Used' },
  Refurbished: { dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300', label: 'Refurbished' },
};

const TrustRow = memo(({ darkMode }) => (
  <div className={`flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide pt-2 mt-2 border-t ${
    darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
  }`}>
    <span className="flex items-center gap-1"><FiShield className="w-3 h-3" /> Verified</span>
    <span className="flex items-center gap-1"><FiTruck className="w-3 h-3" /> Fast ship</span>
    <span className="flex items-center gap-1"><FiRefreshCw className="w-3 h-3" /> Returns</span>
  </div>
));

const ProductCard = memo(({ product, darkMode, onAddToCart, index = 0 }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const discountedPrice = useMemo(() =>
    product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null
  , [product.price, product.discount]);

  const cond = conditionConfig[product.condition] || { dot: 'bg-gray-400', text: 'text-gray-500', label: product.condition || 'Unknown' };

  const handleCart = useCallback((e) => {
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 1600);
  }, [onAddToCart, product]);

  const navigateToDetail = useCallback(() => {
    window.location.href = `/device/${product.id}`;
  }, [product.id]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '60px' }}
      onClick={navigateToDetail}
      className={`group relative flex flex-col overflow-hidden cursor-pointer h-full border-l-[3px] transition-colors duration-150 ${
        darkMode
          ? 'bg-gray-800 border border-gray-700 border-l-emerald-400 hover:border-l-emerald-300'
          : 'bg-white border border-gray-200 border-l-emerald-500 hover:border-l-emerald-600'
      }`}
    >
      {product.discount && (
        <span className="absolute top-0 left-0 z-10 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-1 tracking-wide"
          style={{ clipPath: 'polygon(0 0, 100% 0, 86% 100%, 0% 100%)' }}>
          -{product.discount}%
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); navigateToDetail(); }}
        className={`absolute top-2 right-2 z-10 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
          darkMode ? 'bg-gray-900/90 text-gray-200' : 'bg-white/90 text-gray-600'
        } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <FiEye className="w-3.5 h-3.5" />
      </button>

      <div className={`relative w-full aspect-square overflow-hidden border-b ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        {!imgLoaded && !imgError && (
          <div className={`absolute inset-0 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        )}
        <img
          src={imgError ? '/placeholder.png' : (product.imageUrl || '/placeholder.png')}
          alt={product.name}
          width={400}
          height={400}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-contain p-3 sm:p-4 transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5">
        <h3 className={`font-semibold text-xs sm:text-[15px] leading-snug line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {product.name}
        </h3>

        <div className={`flex items-center justify-between text-[11px] font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 ${cond.dot}`} />
            <span className={cond.text}>{cond.label}</span>
          </span>
        </div>

        <div className={`flex items-baseline gap-1.5 pt-1 border-t mt-1 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <span className={`text-base sm:text-lg font-extrabold tracking-tight tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            EGP {discountedPrice ?? product.price?.toFixed(2)}
          </span>
          {discountedPrice && (
            <span className={`text-xs line-through tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              EGP {product.price?.toFixed(2)}
            </span>
          )}
        </div>

        <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {product.description || 'No description available.'}
        </p>

        <TrustRow darkMode={darkMode} />

        <button
          onClick={handleCart}
          className={`mt-2 w-full py-2 sm:py-2.5 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors duration-150 border ${
            cartAdded
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : darkMode
                ? 'border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-gray-900'
                : 'border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white'
          }`}
        >
          {cartAdded ? <><FiCheck className="w-4 h-4" /> Added</> : <><FiShoppingCart className="w-4 h-4" /> Add to Cart</>}
        </button>
      </div>
    </motion.div>
  );
});

const PosterProductCard = memo(({ product, darkMode, onAddToCart, index = 0 }) => {
  const [cartAdded, setCartAdded] = useState(false);
  const discountedPrice = useMemo(() =>
    product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null
  , [product.price, product.discount]);

  const handleCart = useCallback((e) => {
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 1400);
  }, [onAddToCart, product]);

  const navigateToDetail = useCallback(() => {
    window.location.href = `/device/${product.id}`;
  }, [product.id]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '60px' }}
      onClick={navigateToDetail}
      className="relative flex-shrink-0 w-[148px] sm:w-[190px] h-[210px] sm:h-[260px] overflow-hidden cursor-pointer snap-start border border-black/10 group"
    >
      <img
        src={product.imageUrl || '/placeholder.png'}
        alt={product.name}
        loading="lazy"
        decoding="async"
        width={190}
        height={260}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      {product.discount && (
        <span className="absolute top-0 left-0 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-1"
          style={{ clipPath: 'polygon(0 0, 100% 0, 86% 100%, 0% 100%)' }}>
          -{product.discount}%
        </span>
      )}
      <button
        onClick={handleCart}
        className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center backdrop-blur-md border transition-colors duration-150 ${
          cartAdded ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/15 border-white/30 text-white hover:bg-emerald-500 hover:border-emerald-500'
        }`}
      >
        {cartAdded ? <FiCheck className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
      </button>
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <p className="font-bold text-xs sm:text-sm leading-snug line-clamp-2 mb-1">{product.name}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm sm:text-base font-extrabold text-emerald-300 tabular-nums">
            EGP {discountedPrice ?? product.price?.toFixed(2)}
          </span>
          {discountedPrice && <span className="text-[10px] line-through text-white/50 tabular-nums">EGP {product.price?.toFixed(2)}</span>}
        </div>
      </div>
    </motion.div>
  );
});

const CategoryTag = memo(({ darkMode, children }) => (
  <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider border-l-2 ${
    darkMode ? 'border-emerald-400 text-emerald-300 bg-emerald-400/5' : 'border-emerald-600 text-emerald-700 bg-emerald-50'
  }`}>
    {children}
  </span>
));

const CategorySlider = memo(({ category, items, darkMode, onAddToCart }) => {
  const sliderRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => {
    check();
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [check, items.length]);

  const scroll = useCallback((dir) => {
    sliderRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  }, []);

  if (!items.length) return null;

  return (
    <div className="mb-10 sm:mb-14">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <CategoryTag darkMode={darkMode}>{category.name}</CategoryTag>
          <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/products/category/${category.id}`}
            className={`hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${
              darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
            }`}>
            View all <FiArrowRight className="w-3 h-3" />
          </a>
          <button onClick={() => scroll('left')} disabled={!canLeft}
            className={`p-1.5 sm:p-2 border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
              darkMode ? 'bg-gray-800 border-gray-700 hover:border-emerald-400 text-emerald-400' : 'bg-white border-gray-200 hover:border-emerald-500 text-emerald-700'
            }`}>
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')} disabled={!canRight}
            className={`p-1.5 sm:p-2 border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
              darkMode ? 'bg-gray-800 border-gray-700 hover:border-emerald-400 text-emerald-400' : 'bg-white border-gray-200 hover:border-emerald-500 text-emerald-700'
            }`}>
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={sliderRef} className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 hide-scrollbar">
        {items.map((p, i) => (
          <PosterProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={onAddToCart} index={i} />
        ))}
      </div>
    </div>
  );
});

const FilterSection = memo(({ title, isOpen, onToggle, darkMode, children }) => (
  <div className={`border-b py-3 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
    <button onClick={onToggle}
      className={`w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider py-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
      {title}
      <FiChevronDown className={`transition-transform duration-200 w-3.5 h-3.5 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    </button>
    <div className={`grid transition-all duration-150 ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  </div>
));

const RadioOption = memo(({ value, label, selected, onSelect, darkMode }) => (
  <label className="flex items-center gap-3 cursor-pointer group py-1">
    <div onClick={() => onSelect(value)}
      className={`w-3.5 h-3.5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'border-emerald-500 bg-emerald-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
      }`}>
      {selected && <div className="w-1.5 h-1.5 bg-white" />}
    </div>
    <span onClick={() => onSelect(value)}
      className={`text-sm font-medium truncate ${selected ? 'text-emerald-500' : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
      {label}
    </span>
  </label>
));

const PillButton = memo(({ label, isActive, onClick, darkMode }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 text-xs font-semibold border transition-colors duration-150 ${
      isActive
        ? 'bg-emerald-500 border-emerald-500 text-white'
        : darkMode
          ? 'border-gray-700 text-gray-300 hover:border-emerald-400 hover:text-emerald-400 bg-gray-800/60'
          : 'border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-700 bg-white'
    }`}>
    {label}
  </button>
));

const PriceRangeSlider = memo(({ priceRange, setPriceRange, darkMode }) => {
  const MIN = 0, MAX = 100000, STEP = 1000;
  const leftPct = (priceRange[0] / MAX) * 100;
  const rightPct = (priceRange[1] / MAX) * 100;
  const thumbCls = "absolute inset-0 w-full h-1 appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 " +
    "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 " +
    "[&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 " +
    "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:cursor-pointer";

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-bold">
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[0].toLocaleString()}</span>
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[1].toLocaleString()}</span>
      </div>
      <div className="relative h-4 flex items-center">
        <div className={`absolute inset-x-0 h-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="absolute h-1 bg-emerald-500" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={priceRange[0]}
          onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - STEP), priceRange[1]])} className={thumbCls} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + STEP)])} className={thumbCls} />
      </div>
    </div>
  );
});

const FilterPanel = memo(({ darkMode, sortBy, setSortBy, sortLabels, selectedCategoryId, setSelectedCategoryId, categories,
  isSortOpen, setIsSortOpen, isCatOpen, setIsCatOpen, isCondOpen, setIsCondOpen, isPriceOpen, setIsPriceOpen,
  selectedConditions, toggleCondition, priceRange, setPriceRange, clearFilters, activeFiltersCount }) => (
  <div className={`${GLASS_STRONG} p-4 sm:p-5`}>
    <div className="flex items-center justify-between mb-1">
      <h3 className={`text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <FiSliders className="w-4 h-4 text-emerald-500" /> Filters
      </h3>
      {activeFiltersCount > 0 && (
        <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold">{activeFiltersCount}</span>
      )}
    </div>

    <FilterSection title="Sort By" isOpen={isSortOpen} onToggle={() => setIsSortOpen(!isSortOpen)} darkMode={darkMode}>
      <div className="space-y-1">
        {Object.entries(sortLabels).map(([value, label]) => (
          <RadioOption key={value} value={value} label={label} selected={sortBy === value} onSelect={setSortBy} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Category" isOpen={isCatOpen} onToggle={() => setIsCatOpen(!isCatOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2">
        <PillButton label="All" isActive={selectedCategoryId === 'all'} onClick={() => setSelectedCategoryId('all')} darkMode={darkMode} />
        {categories.map((cat) => (
          <PillButton key={cat.id} label={cat.name} isActive={selectedCategoryId === cat.id} onClick={() => setSelectedCategoryId(cat.id)} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Condition" isOpen={isCondOpen} onToggle={() => setIsCondOpen(!isCondOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2">
        {['New', 'Used', 'Refurbished'].map((c) => (
          <PillButton key={c} label={c} isActive={selectedConditions.includes(c)} onClick={() => toggleCondition(c)} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Price Range (EGP)" isOpen={isPriceOpen} onToggle={() => setIsPriceOpen(!isPriceOpen)} darkMode={darkMode}>
      <PriceRangeSlider priceRange={priceRange} setPriceRange={setPriceRange} darkMode={darkMode} />
    </FilterSection>

    <button onClick={clearFilters}
      className="w-full mt-4 py-2.5 border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-xs uppercase tracking-wide transition-colors duration-150 flex items-center justify-center gap-2">
      <FiX /> Clear All Filters
    </button>
  </div>
));

const PaginationButton = memo(({ children, onClick, disabled, active, darkMode }) => (
  <button onClick={onClick} disabled={disabled}
    className={`min-w-[38px] h-10 px-2 font-bold text-sm border flex items-center justify-center transition-colors duration-150 ${
      active
        ? 'bg-emerald-500 text-white border-emerald-500'
        : disabled
          ? `opacity-40 cursor-not-allowed ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-400'}`
          : darkMode
            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-400 hover:text-emerald-400'
            : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-500 hover:text-emerald-700'
    }`}>
    {children}
  </button>
));

const ProductsContent = memo(({ darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');

  const [isSortOpen, setIsSortOpen] = useState(true);
  const [isCatOpen, setIsCatOpen] = useState(true);
  const [isCondOpen, setIsCondOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  const [token] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null));
  const sliderRef = useRef(null);

  useEffect(() => { document.title = 'Our Products | Tech-Restore'; }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/api/categories', { headers: { Authorization: `Bearer ${token}` } });
      const cats = res.data.content || res.data || [];
      return cats.map((c) => ({ id: c.id, name: c.name || String(c.id) }));
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategoryId],
    queryFn: async () => {
      const url = selectedCategoryId === 'all' ? '/api/products' : `/api/products/category/${selectedCategoryId}`;
      const res = await api.get(url);
      return res.data.content || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { setCurrentPage(1); }, [selectedCategoryId, pageSize]);

  const handleAddToCart = useCallback(async (product) => {
    try {
      await api.post('/api/cart/items',
        { productId: product.id, quantity: 1, price: product.price, name: product.name, imageUrl: product.image || '/placeholder.png' },
        { headers: { Authorization: `Bearer ${token}` } });
      const Swal = await loadSwal();
      Swal.fire({ title: 'Added!', text: `${product.name} added to cart`, icon: 'success', toast: true, position: 'top-end', timer: 1500, timerProgressBar: true });
    } catch {
      const Swal = await loadSwal();
      Swal.fire({ title: 'Error', text: 'Failed to add to cart', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [token]);

  const latestProducts = useMemo(() =>
    [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [products]
  );

  const productsByCategory = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const catId = p.categoryId ?? p.category?.id ?? p.category;
      if (catId === undefined || catId === null) return;
      if (!map[catId]) map[catId] = [];
      map[catId].push(p);
    });
    return map;
  }, [products]);

  const categorySections = useMemo(() => (
    categories
      .map((cat) => ({ category: cat, items: (productsByCategory[cat.id] || []).slice(0, 10) }))
      .filter((sec) => sec.items.length > 0)
      .slice(0, 6)
  ), [categories, productsByCategory]);

  const sortLabels = useMemo(() => ({
    relevance: 'Relevance',
    priceLowToHigh: 'Price: Low to High',
    priceHighToLow: 'Price: High to Low',
    newest: 'Newest Arrivals',
  }), []);

  const filteredProducts = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    let filtered = products.filter((p) => {
      const matchesSearch = (p.name || '').toLowerCase().includes(term);
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesCond = selectedConditions.length === 0 || selectedConditions.includes(p.condition);
      return matchesSearch && matchesPrice && matchesCond;
    });
    if (sortBy === 'priceLowToHigh') filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'priceHighToLow') filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [products, deferredSearch, priceRange, selectedConditions, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const scrollSlider = useCallback((dir) => {
    sliderRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    let raf;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setCanScrollLeft(slider.scrollLeft > 2);
        setCanScrollRight(slider.scrollLeft + slider.clientWidth < slider.scrollWidth - 5);
      });
    };
    check();
    slider.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { slider.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [latestProducts]);

  const clearFilters = useCallback(() => {
    setSearchTerm(''); setPriceRange([0, 50000]); setSelectedCategoryId('all');
    setSelectedConditions([]); setSortBy('relevance'); setCurrentPage(1);
  }, []);

  const toggleCondition = useCallback((c) => {
    setSelectedConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }, []);

  const showSliderArrows = useMemo(() => latestProducts.length > 3 && (canScrollLeft || canScrollRight), [latestProducts.length, canScrollLeft, canScrollRight]);

  const activeFiltersCount = useMemo(() => [
    searchTerm,
    selectedCategoryId !== 'all' ? selectedCategoryId : null,
    ...selectedConditions,
    priceRange[0] !== 0 || priceRange[1] !== 50000 ? 'price' : null,
    sortBy !== 'relevance' ? sortBy : null,
  ].filter(Boolean).length, [searchTerm, selectedCategoryId, selectedConditions, priceRange, sortBy]);

  const filterPanelProps = {
    darkMode, sortBy, setSortBy, sortLabels, selectedCategoryId, setSelectedCategoryId, categories,
    isSortOpen, setIsSortOpen, isCatOpen, setIsCatOpen, isCondOpen, setIsCondOpen, isPriceOpen, setIsPriceOpen,
    selectedConditions, toggleCondition, priceRange, setPriceRange, clearFilters, activeFiltersCount,
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <Suspense fallback={<HeroSkeleton darkMode={darkMode} />}>
        <Hero
          variant="devices"
          darkMode={darkMode}
          badge="New arrivals added daily"
          headingLine1="Shop premium"
          headingAccent="devices"
          headingLine2="for less"
          description="New & refurbished phones, laptops, tablets, and accessories — all verified and ready to ship."
          buttons={[
            { label: 'Browse Products', href: '#products-grid', primary: true },
            { label: 'View Filters', onClick: () => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' }), primary: false },
          ]}
          stats={[
            { value: '1,200+', label: 'Products in stock' },
            { value: '~50K', label: 'Happy customers' },
            { value: '4.9 ★', label: 'Average rating' },
          ]}
        >
          <div className={`w-full max-w-xl ${GLASS} flex items-center gap-3 px-4 py-3.5`}>
            <FiSearch className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name..."
              className={`flex-1 outline-none text-sm bg-transparent font-medium placeholder:font-normal ${
                darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'
              }`}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </Hero>
      </Suspense>

      {!isLoading && latestProducts.length > 0 && (
        <div className={`py-10 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-emerald-50/30'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-10">
              <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight relative inline-block ${darkMode ? 'text-emerald-400' : 'text-emerald-800'} after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-12 after:h-1 after:bg-emerald-500`}>
                Latest Arrivals
              </h2>
              {showSliderArrows && (
                <div className="flex gap-2 sm:gap-3">
                  <button onClick={() => scrollSlider('left')} disabled={!canScrollLeft}
                    className={`p-2 sm:p-3 border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${darkMode ? 'bg-gray-800/80 border-gray-700 hover:border-emerald-400 text-emerald-400' : 'bg-white/80 border-gray-200 hover:border-emerald-500 text-emerald-700'}`}>
                    <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={() => scrollSlider('right')} disabled={!canScrollRight}
                    className={`p-2 sm:p-3 border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${darkMode ? 'bg-gray-800/80 border-gray-700 hover:border-emerald-400 text-emerald-400' : 'bg-white/80 border-gray-200 hover:border-emerald-500 text-emerald-700'}`}>
                    <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <div className={`pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-14 z-[5] bg-gradient-to-r ${darkMode ? 'from-gray-900' : 'from-emerald-50/30'} to-transparent`} />
              <div className={`pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-14 z-[5] bg-gradient-to-l ${darkMode ? 'from-gray-900' : 'from-emerald-50/30'} to-transparent`} />
              <div ref={sliderRef} className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-6 snap-x snap-mandatory scroll-smooth pb-4 sm:pb-6 hide-scrollbar">
                {latestProducts.map((p, i) => (
                  <div key={p.id} className="snap-start flex-shrink-0 w-[180px] sm:w-[250px] md:w-[280px] lg:w-[300px]">
                    <ProductCard product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && categorySections.length > 0 && (
        <div className={`py-10 sm:py-16 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
              <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Shop by category</span>
              <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight mt-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Explore our collections</h2>
            </div>
            {categorySections.map(({ category, items }) => (
              <CategorySlider key={category.id} category={category} items={items} darkMode={darkMode} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </div>
      )}

      <div id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex gap-5 lg:gap-8">
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
            <FilterPanel {...filterPanelProps} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className={`${GLASS} flex items-center justify-between mb-6 flex-wrap gap-3 px-4 py-3`}>
              <div>
                <span className={`text-xl sm:text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{filteredProducts.length}</span>
                <span className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>products found</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {selectedConditions.map((c) => (
                  <span key={c} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    {c}<button onClick={() => toggleCondition(c)}><FiX className="w-3 h-3" /></button>
                  </span>
                ))}

                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
                  className={`text-xs font-semibold border px-2 py-1.5 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {[12, 24, 48].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>

                <div className={`flex border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}><FiGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}><FiList className="w-4 h-4" /></button>
                </div>

                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`lg:hidden flex items-center gap-1.5 px-3 py-2 border font-semibold text-xs transition-colors duration-150 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
                  <FiSliders className="w-3.5 h-3.5 text-emerald-500" /> Filters
                  {activeFiltersCount > 0 && <span className="w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className={`grid gap-3 sm:gap-5 lg:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`h-[280px] sm:h-[380px] md:h-[420px] animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 sm:py-32">
                <p className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>No products found</p>
                <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors duration-150 text-sm sm:text-base">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-3 sm:gap-5 lg:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {paginatedProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 sm:mt-14 gap-1.5 sm:gap-2 flex-wrap">
                <PaginationButton onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} darkMode={darkMode}>
                  <FiChevronLeft className="w-4 h-4" />
                </PaginationButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationButton key={page} onClick={() => setCurrentPage(page)} active={currentPage === page} darkMode={darkMode}>
                    {page}
                  </PaginationButton>
                ))}
                <PaginationButton onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} darkMode={darkMode}>
                  <FiChevronRight className="w-4 h-4" />
                </PaginationButton>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className={`absolute left-0 top-0 bottom-0 w-72 sm:w-80 overflow-y-auto p-4 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <FilterPanel {...filterPanelProps} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

const Products = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <ProductsContent {...props} />
  </QueryClientProvider>
));

export default Products;