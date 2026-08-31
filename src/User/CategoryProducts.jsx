import React, { useState, useEffect, useCallback, useMemo, memo, useTransition, useDeferredValue } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiFilter, FiShoppingCart, FiChevronLeft, FiChevronRight,
  FiX, FiChevronDown, FiPackage, FiSliders, FiEye, FiCheck, FiArrowLeft,
} from 'react-icons/fi';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import api from '../api';
import Hero from '../components/Hero';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const queryClient = new QueryClient();

// `sweetalert2` is only needed for the add-to-cart success/error toast, never
// on first paint — loaded on demand and cached, same pattern as the rest of
// the app's pages.
let swalPromise;
const loadSwal = () => {
  if (!swalPromise) swalPromise = import('sweetalert2').then((mod) => mod.default || mod);
  return swalPromise;
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, delay: i * 0.025, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

const hoverScale = { y: -6, transition: { duration: 0.12, ease: 'easeOut' } };

const ACCENT_BAR = 'h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500';

const conditionConfig = {
  New:         { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Used:        { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
  Refurbished: { badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300', dot: 'bg-sky-500' },
};

const SkeletonProducts = memo(({ darkMode }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className={`h-[280px] sm:h-[380px] md:h-[420px] rounded-2xl sm:rounded-3xl animate-pulse shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
    ))}
  </div>
));

// FIX: previously navigated with `window.location.href`, forcing a full page
// reload for every card click in this grid — the single most common
// interaction on this page. Using the router's `navigate()` keeps it a fast
// client-side transition instead of re-downloading and re-booting the app.
const ProductCard = memo(({ product, darkMode, onAddToCart, index = 0 }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const navigate = useNavigate();

  const discountedPrice = useMemo(() =>
    product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null
  , [product.price, product.discount]);

  const cond = conditionConfig[product.condition] || { badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' };

  const handleCart = useCallback((e) => {
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart(product);
    const t = setTimeout(() => setCartAdded(false), 1600);
    return () => clearTimeout(t);
  }, [onAddToCart, product]);

  const navigateToDetail = useCallback(() => {
    navigate(`/device/${product.id}`);
  }, [navigate, product.id]);

  return (
    <m.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '50px' }}
      whileHover={hoverScale}
      onClick={navigateToDetail}
      className={`group relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer
        ring-1 transition-shadow duration-200 h-full ${
          darkMode
            ? 'bg-gray-800 ring-white/10 shadow-md shadow-black/20 hover:ring-emerald-400/30 hover:shadow-xl hover:shadow-emerald-500/10'
            : 'bg-white ring-black/5 shadow-sm hover:ring-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/10'
        }`}
    >
      {product.discount && (
        <m.span initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.05 + index * 0.02 }}
          className="absolute top-2.5 left-2.5 z-10 inline-flex bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md shadow-rose-500/30">
          -{product.discount}%
        </m.span>
      )}
      <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-1 group-hover:translate-y-0">
        <button onClick={(e) => { e.stopPropagation(); navigateToDetail(); }}
          className={`p-1.5 sm:p-2 rounded-xl shadow-lg backdrop-blur-md transition-colors duration-150 ${
            darkMode ? 'bg-gray-900/80 text-gray-200 hover:text-emerald-400' : 'bg-white/90 text-gray-600 hover:text-emerald-600'
          }`}>
          <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className={`relative w-full aspect-square overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-750 to-gray-800' : 'bg-gradient-to-br from-emerald-50/60 to-gray-100'}`}>
        <AnimatePresence>
          {!imgLoaded && !imgError && (
            <m.div exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
              className={`absolute inset-0 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          )}
        </AnimatePresence>
        <m.img
          src={imgError ? '/placeholder.png' : (product.imageUrl || '/placeholder.png')}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0 }}
          animate={imgLoaded ? { opacity: 1 } : {}}
          transition={{ duration: 0.18 }}
          className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-[1.06] transition-transform duration-300 ease-out"
        />
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5 sm:gap-2">
        <h3 className={`font-semibold text-xs sm:text-[15px] leading-snug line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {product.name}
        </h3>
        <div className="flex flex-wrap gap-1">
          <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${cond.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
            {product.condition || 'Unknown'}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-auto pt-1">
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
        <m.button whileTap={{ scale: 0.96 }} onClick={handleCart}
          className={`mt-1.5 sm:mt-2 w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm
            flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-150 ${
              cartAdded
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/30 hover:brightness-105'
            }`}>
          <AnimatePresence mode="wait">
            {cartAdded
              ? <m.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex items-center gap-1">✓ Added!</m.span>
              : <m.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex items-center gap-1.5"><FiShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add to Cart</m.span>
            }
          </AnimatePresence>
        </m.button>
      </div>
    </m.div>
  );
});

const FilterSection = memo(({ title, isOpen, onToggle, darkMode, children }) => (
  <div className={`border-b pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
    <button onClick={onToggle}
      className={`w-full flex justify-between items-center text-sm sm:text-base font-bold py-1 transition-colors duration-150 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      {title}
      <FiChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    </button>
    <m.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }} className="overflow-hidden">
      <div className="pt-3">{children}</div>
    </m.div>
  </div>
));

const SelectableRow = memo(({ active, label, onClick, darkMode }) => (
  <button onClick={onClick}
    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-150 ${
      active
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/30'
        : darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-100'
    }`}>
    <span>{label}</span>
    {active && <FiCheck className="flex-shrink-0 text-emerald-500" size={14} />}
  </button>
));

const PriceRangeSlider = memo(({ priceRange, setPriceRange, darkMode }) => {
  const MIN = 0, MAX = 100000, STEP = 1000;
  const leftPct = (priceRange[0] / MAX) * 100;
  const rightPct = (priceRange[1] / MAX) * 100;
  const thumbCls = "absolute inset-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 " +
    "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full " +
    "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer";

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-between text-xs sm:text-sm font-bold">
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[0].toLocaleString()}</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[1].toLocaleString()}</span>
      </div>
      <div className="relative h-4 flex items-center">
        <div className={`absolute inset-x-0 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="absolute h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={priceRange[0]}
          onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - STEP), priceRange[1]])}
          className={thumbCls} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + STEP)])}
          className={thumbCls} />
      </div>
    </div>
  );
});

const SidebarContent = memo(({
  darkMode, searchTerm, setSearchTerm, sortBy, setSortBy,
  isSortOpen, setIsSortOpen, isCondOpen, setIsCondOpen, isPriceOpen, setIsPriceOpen,
  selectedConditions, toggleCondition, priceRange, setPriceRange, clearFilters, activeFiltersCount
}) => (
  <div className="py-4 sm:py-6 space-y-4 sm:space-y-5">
    <div className="flex items-center justify-between">
      <h3 className={`text-lg sm:text-xl font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <FiFilter className="text-emerald-500" /> Filters
      </h3>
      {activeFiltersCount > 0 && (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">{activeFiltersCount}</span>
      )}
    </div>

    <div className="relative">
      <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={14} />
      <input type="text" placeholder="Search in this category..." value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-colors duration-150 ${
          darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                   : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
        } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
      />
      {searchTerm && (
        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
          <FiX className="text-gray-400 hover:text-gray-600 transition-colors duration-150" size={14} />
        </button>
      )}
    </div>

    <FilterSection title="Sort By" isOpen={isSortOpen} onToggle={() => setIsSortOpen(!isSortOpen)} darkMode={darkMode}>
      <div className="space-y-1">
        {[
          { value: 'relevance',      label: 'Relevance'           },
          { value: 'priceLowToHigh', label: 'Price: Low to High'  },
          { value: 'priceHighToLow', label: 'Price: High to Low'  },
          { value: 'newest',         label: 'Newest Arrivals'     },
        ].map((opt) => (
          <SelectableRow key={opt.value} active={sortBy === opt.value} label={opt.label}
            onClick={() => setSortBy(opt.value)} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Condition" isOpen={isCondOpen} onToggle={() => setIsCondOpen(!isCondOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2">
        {['New', 'Used', 'Refurbished'].map((cond) => {
          const active = selectedConditions.includes(cond);
          return (
            <button key={cond} onClick={() => toggleCondition(cond)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border-2 transition-all duration-150 ${
                active ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : darkMode ? 'border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'
                             : 'border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600'
              }`}>
              {active && <FiCheck size={12} />}
              {cond}
            </button>
          );
        })}
      </div>
    </FilterSection>

    <FilterSection title="Price Range (EGP)" isOpen={isPriceOpen} onToggle={() => setIsPriceOpen(!isPriceOpen)} darkMode={darkMode}>
      <PriceRangeSlider priceRange={priceRange} setPriceRange={setPriceRange} darkMode={darkMode} />
    </FilterSection>

    <m.button whileTap={{ scale: 0.97 }} onClick={clearFilters}
      className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm border-2 flex items-center justify-center gap-2 transition-all duration-150 ${
        darkMode ? 'border-red-900/40 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500'
                 : 'border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500'
      }`}>
      <FiX /> Clear All Filters
    </m.button>
  </div>
));

const CategoryProductsContent = memo(({ darkMode, toggleDarkMode }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm]         = useState('');
  const [priceRange, setPriceRange]         = useState([0, 50000]);
  const [currentPage, setCurrentPage]       = useState(1);
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [sortBy, setSortBy]                 = useState('relevance');

  const [isSortOpen, setIsSortOpen]   = useState(true);
  const [isCondOpen, setIsCondOpen]   = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  const [isPending, startTransition] = useTransition();

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredPriceRange = useDeferredValue(priceRange);
  const deferredConditions = useDeferredValue(selectedConditions);
  const deferredSortBy     = useDeferredValue(sortBy);

  const pageSize = 12;
  // Read once instead of a synchronous localStorage.getItem() call on every render.
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null), []);

  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const res = await api.get(`/api/categories/${categoryId}`, { headers: { Authorization: `Bearer ${token}` } });
      const c = res.data.content || res.data || {};
      return { id: c.id ?? categoryId, name: c.name || 'Category' };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: async () => {
      const res = await api.get(`/api/products/category/${categoryId}`);
      return res.data.content || res.data || [];
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { document.title = category?.name ? `${category.name} | Tech-Restore` : 'Category | Tech-Restore'; }, [category]);
  useEffect(() => { setCurrentPage(1); }, [categoryId]);

  // FIX: no longer wraps the whole async network call in `startTransition` —
  // that's a misuse of the API (see DeviceDetail.jsx for the full explanation):
  // only synchronous updates before an `await` are actually treated as
  // low-priority, so wrapping an async function here didn't do what it looked
  // like it did.
  const handleAddToCart = useCallback(async (product) => {
    try {
      await api.post('/api/cart/items',
        { productId: product.id, quantity: 1, price: product.price, name: product.name, imageUrl: product.image || '/placeholder.png' },
        { headers: { Authorization: `Bearer ${token}` } });
      loadSwal().then((Swal) =>
        Swal.fire({ title: 'Added!', text: `${product.name} added to cart`, icon: 'success', toast: true, position: 'top-end', timer: 1500, timerProgressBar: true })
      );
    } catch {
      loadSwal().then((Swal) =>
        Swal.fire({ title: 'Error', text: 'Failed to add to cart', icon: 'error', toast: true, position: 'top-end', timer: 1500 })
      );
    }
  }, [token]);

  const handleCartClick = useCallback(() => {
    navigate('/cart');
  }, [navigate]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(deferredSearchTerm.toLowerCase());
      const matchesPrice  = p.price >= deferredPriceRange[0] && p.price <= deferredPriceRange[1];
      const matchesCond   = deferredConditions.length === 0 || deferredConditions.includes(p.condition);
      return matchesSearch && matchesPrice && matchesCond;
    });
    if (deferredSortBy === 'priceLowToHigh') filtered.sort((a, b) => a.price - b.price);
    else if (deferredSortBy === 'priceHighToLow') filtered.sort((a, b) => b.price - a.price);
    else if (deferredSortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [products, deferredSearchTerm, deferredPriceRange, deferredConditions, deferredSortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearchTerm(''); setPriceRange([0, 50000]);
      setSelectedConditions([]); setSortBy('relevance'); setCurrentPage(1);
    });
  }, []);

  const toggleCondition = useCallback((c) =>
    startTransition(() => {
      setSelectedConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
    }), []);

  const goToPage = useCallback((page) => {
    startTransition(() => setCurrentPage(page));
  }, []);

  const activeFiltersCount = useMemo(() => [
    searchTerm,
    ...selectedConditions,
    priceRange[0] !== 0 || priceRange[1] !== 50000 ? 'price' : null,
    sortBy !== 'relevance' ? sortBy : null,
  ].filter(Boolean).length, [searchTerm, selectedConditions, priceRange, sortBy]);

  const categoryName = category?.name || 'This Category';

  const heroStats = useMemo(() => [
    { value: `${products.length}`, label: 'Products available' },
    { value: '100%', label: 'Quality checked' },
    { value: '4.8 ★', label: 'Avg category rating' },
  ], [products.length]);

  const heroButtons = useMemo(() => [
    { label: 'View Products', href: '#category-products', primary: true },
    { label: 'All Categories', to: '/devices', primary: false },
  ], []);

  return (
    <LazyMotion features={domAnimation}>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} onCartClick={handleCartClick} />

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          <Link to="/devices" className={`inline-flex items-center gap-2 text-sm font-semibold ${
            darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
          }`}>
            <FiArrowLeft className="w-4 h-4" /> Back to all products
          </Link>
        </div>

        <div id="category-products" aria-busy={isPending} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 transition-opacity duration-150 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
          <div className="flex gap-5 lg:gap-8">
            <aside className={`hidden lg:block w-60 xl:w-64 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border shadow-lg overflow-hidden ${
              darkMode ? 'bg-gray-800/60 border-gray-700 backdrop-blur-md' : 'bg-white border-emerald-100'
            }`}>
              <div className={ACCENT_BAR} />
              <div className="px-4 xl:px-5">
                <SidebarContent
                  darkMode={darkMode}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  sortBy={sortBy} setSortBy={setSortBy}
                  isSortOpen={isSortOpen} setIsSortOpen={setIsSortOpen}
                  isCondOpen={isCondOpen} setIsCondOpen={setIsCondOpen}
                  isPriceOpen={isPriceOpen} setIsPriceOpen={setIsPriceOpen}
                  selectedConditions={selectedConditions} toggleCondition={toggleCondition}
                  priceRange={priceRange} setPriceRange={setPriceRange}
                  clearFilters={clearFilters} activeFiltersCount={activeFiltersCount}
                />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-5 sm:mb-8 flex-wrap gap-2 sm:gap-3">
                <div>
                  <span className={`text-xl sm:text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{filteredProducts.length}</span>
                  <span className={`ml-2 text-sm sm:text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>products in {categoryName}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {selectedConditions.map((c) => (
                    <span key={c} className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                      {c}<button onClick={() => toggleCondition(c)} className="transition-transform duration-150 hover:scale-110"><FiX className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <m.button whileTap={{ scale: 0.96 }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`lg:hidden flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl border font-semibold text-xs sm:text-sm transition-all duration-150 shadow-sm hover:shadow-md ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-emerald-100 text-gray-700'
                    }`}>
                    <FiSliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>
                    )}
                  </m.button>
                </div>
              </div>

              {isLoading ? (
                <SkeletonProducts darkMode={darkMode} />
              ) : filteredProducts.length === 0 ? (
                <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="text-center py-20 sm:py-32">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-emerald-100 dark:bg-gray-800 flex items-center justify-center">
                    <FiPackage className="text-2xl sm:text-4xl text-emerald-400" />
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>No products found</p>
                  <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your filters or search terms</p>
                  <button onClick={clearFilters} className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors duration-150 text-sm sm:text-base">
                    Clear Filters
                  </button>
                </m.div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                  {paginatedProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center mt-8 sm:mt-14 gap-1.5 sm:gap-2 flex-wrap">
                  <button onClick={() => goToPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-150 ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-emerald-100 text-gray-700 hover:bg-emerald-50'}`}>
                    <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => goToPage(page)}
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 border ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30 scale-105'
                          : darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                                     : 'bg-white border-emerald-100 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => goToPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-150 ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-emerald-100 text-gray-700 hover:bg-emerald-50'}`}>
                    <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
              <m.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className={`absolute left-0 top-0 bottom-0 w-72 sm:w-80 shadow-2xl overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className={ACCENT_BAR} />
                <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <span className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filters</span>
                  <button onClick={() => setIsSidebarOpen(false)}
                    className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="px-4 sm:px-5">
                  <SidebarContent
                    darkMode={darkMode}
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    sortBy={sortBy} setSortBy={setSortBy}
                    isSortOpen={isSortOpen} setIsSortOpen={setIsSortOpen}
                    isCondOpen={isCondOpen} setIsCondOpen={setIsCondOpen}
                    isPriceOpen={isPriceOpen} setIsPriceOpen={setIsPriceOpen}
                    selectedConditions={selectedConditions} toggleCondition={toggleCondition}
                    priceRange={priceRange} setPriceRange={setPriceRange}
                    clearFilters={clearFilters} activeFiltersCount={activeFiltersCount}
                  />
                </div>
              </m.div>
            </div>
          )}
        </AnimatePresence>

        <Footer darkMode={darkMode} />
      </div>
    </LazyMotion>
  );
});

const CategoryProducts = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <CategoryProductsContent {...props} />
  </QueryClientProvider>
));

export default CategoryProducts;