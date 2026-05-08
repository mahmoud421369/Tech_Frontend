import React, { useState, useEffect, useCallback, useRef, useMemo, memo, Suspense, useTransition } from 'react';
import {
  FiSearch, FiFilter, FiShoppingCart, FiChevronLeft, FiChevronRight,
  FiX, FiChevronDown, FiPackage, FiUsers, FiZap, FiSliders, FiEye,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { RiStarFill } from 'react-icons/ri';
import api from '../api';
import Swal from 'sweetalert2';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const SkeletonProducts = ({ darkMode }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className={`h-[280px] sm:h-[380px] md:h-[420px] rounded-2xl animate-pulse shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
    ))}
  </div>
);
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      delay: i * 0.04,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
};

const hoverScale = {
  y: -5,
  transition: { duration: 0.2, ease: "easeOut" }
};

const WaveBottom = memo(({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-16 md:h-24" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z"
        fill={darkMode ? '#111827' : '#f9fafb'} />
    </svg>
  </div>
));

const WaveTop = memo(({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-12 md:h-20" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z"
        fill={darkMode ? '#111827' : '#f9fafb'} />
    </svg>
  </div>
));

const StatCard = memo(({ icon, value, label, accent, delay, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true, margin: "-50px" }}
    whileHover={hoverScale}
    className={`relative group overflow-hidden rounded-2xl p-4 sm:p-5 shadow-xl border transition-all duration-300 ${
      darkMode ? 'bg-gray-800/80 border-gray-700/60 backdrop-blur-md' : 'bg-white/90 border-gray-100 backdrop-blur-md'
    }`}
  >
    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ boxShadow: `0 0 32px ${accent}44` }} />
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
    <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>{icon}</div>
      <span className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
    </div>
    <p className={`text-xs font-semibold leading-snug pl-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
  </motion.div>
));

const conditionConfig = {
  New:         'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Used:        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Refurbished: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
};

const ProductCard = memo(({ product, darkMode, onAddToCart, index = 0 }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const discountedPrice = useMemo(() => 
    product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null
  , [product.price, product.discount]);

  const handleCart = useCallback((e) => {
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 2000);
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
      viewport={{ once: true, margin: "50px" }}
      whileHover={hoverScale}
      onClick={navigateToDetail}
      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer
        transition-shadow duration-300 hover:shadow-2xl h-full ${
          darkMode ? 'bg-gray-800 border border-gray-700/80 shadow-lg shadow-black/20'
                   : 'bg-white border border-gray-100 shadow-md shadow-gray-200/60'
        }`}
    >
      {product.discount && (
        <motion.span initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, delay: 0.1 + index * 0.03 }}
          className="absolute top-2.5 left-2.5 z-10 inline-flex bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md">
          -{product.discount}%
        </motion.span>
      )}
      <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
        <button onClick={(e) => { e.stopPropagation(); navigateToDetail(); }}
          className={`p-1.5 sm:p-2 rounded-xl shadow-lg backdrop-blur-sm transition-colors ${
            darkMode ? 'bg-gray-900/80 text-gray-200 hover:text-lime-400' : 'bg-white/90 text-gray-600 hover:text-lime-600'
          }`}>
          <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className={`relative w-full aspect-square overflow-hidden ${darkMode ? 'bg-gray-750/50' : 'bg-gray-50'}`}>
        <AnimatePresence>
          {!imgLoaded && !imgError && (
            <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className={`absolute inset-0 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          )}
        </AnimatePresence>
        <motion.img
          src={imgError ? '/placeholder.png' : (product.imageUrl || '/placeholder.png')}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          loading="lazy"
          initial={{ opacity: 0 }}
          animate={imgLoaded ? { opacity: 1 } : {}}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-[1.05] transition-transform duration-500 ease-out"
        />
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5 sm:gap-2">
        <h3 className={`font-semibold text-xs sm:text-[15px] leading-snug line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {product.name}
        </h3>
        <div className="flex flex-wrap gap-1">
          <span className={`text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
            conditionConfig[product.condition] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>{product.condition || 'Unknown'}</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-auto pt-1">
          <span className={`text-base sm:text-lg font-extrabold tracking-tight ${darkMode ? 'text-lime-400' : 'text-lime-700'}`}>
            EGP {discountedPrice ?? product.price?.toFixed(2)}
          </span>
          {discountedPrice && (
            <span className={`text-xs line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              EGP {product.price?.toFixed(2)}
            </span>
          )}
        </div>
        <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {product.description || 'No description available.'}
        </p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleCart}
          className={`mt-1.5 sm:mt-2 w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm
            flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-lime-500
            transition-all duration-200 ${
              cartAdded ? 'bg-lime-500 text-white border-lime-500'
                : darkMode ? 'text-lime-400 hover:bg-lime-500 hover:text-white'
                           : 'text-lime-600 hover:bg-lime-500 hover:text-white'
            }`}>
          <AnimatePresence mode="wait">
            {cartAdded
              ? <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">✓ Added!</motion.span>
              : <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5"><FiShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add to Cart</motion.span>
            }
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
});

const FilterSection = memo(({ title, isOpen, onToggle, darkMode, children }) => (
  <div className={`border-b pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
    <button onClick={onToggle}
      className={`w-full flex justify-between items-center text-sm sm:text-base font-bold py-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      {title}
      <FiChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    </button>
    <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.25 }} className="overflow-hidden">
      <div className="pt-3">{children}</div>
    </motion.div>
  </div>
));

const SidebarContent = memo(({ darkMode, searchTerm, setSearchTerm, sortBy, setSortBy, selectedCategoryId, setSelectedCategoryId, categories, isSortOpen, setIsSortOpen, isCatOpen, setIsCatOpen, isCondOpen, setIsCondOpen, isPriceOpen, setIsPriceOpen, selectedConditions, toggleCondition, priceRange, setPriceRange, clearFilters, activeFiltersCount }) => (
  <div className="py-4 sm:py-6 space-y-4 sm:space-y-5">
    <div className="flex items-center justify-between">
      <h3 className={`text-lg sm:text-xl font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <FiFilter className="text-lime-500" /> Filters
      </h3>
      {activeFiltersCount > 0 && (
        <span className="px-2.5 py-0.5 rounded-full bg-lime-500 text-white text-xs font-bold">{activeFiltersCount}</span>
      )}
    </div>

    <div className="relative">
      <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={14} />
      <input type="text" placeholder="Search products..." value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm ${
          darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                   : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
        } focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition`}
      />
      {searchTerm && (
        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
          <FiX className="text-gray-400 hover:text-gray-600" size={14} />
        </button>
      )}
    </div>

    <FilterSection title="Sort By" isOpen={isSortOpen} onToggle={() => setIsSortOpen(!isSortOpen)} darkMode={darkMode}>
      <div className="space-y-2">
        {[
          { value: 'relevance',      label: 'Relevance'           },
          { value: 'priceLowToHigh', label: 'Price: Low to High'  },
          { value: 'priceHighToLow', label: 'Price: High to Low'  },
          { value: 'newest',         label: 'Newest Arrivals'     },
        ].map((opt) => (
          <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
            <div onClick={() => setSortBy(opt.value)}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                sortBy === opt.value ? 'border-lime-500 bg-lime-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
              {sortBy === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span onClick={() => setSortBy(opt.value)}
              className={`text-sm font-medium transition-colors ${
                sortBy === opt.value ? 'text-lime-500'
                  : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
              }`}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Category" isOpen={isCatOpen} onToggle={() => setIsCatOpen(!isCatOpen)} darkMode={darkMode}>
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div onClick={() => setSelectedCategoryId('all')}
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              selectedCategoryId === 'all' ? 'border-lime-500 bg-lime-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
            }`}>
            {selectedCategoryId === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <span onClick={() => setSelectedCategoryId('all')}
            className={`text-sm font-medium capitalize transition-colors ${
              selectedCategoryId === 'all' ? 'text-lime-500'
                : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
            }`}>
            All Categories
          </span>
        </label>
        
        {categories.map((cat) => (
          <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
            <div onClick={() => setSelectedCategoryId(cat.id)}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                selectedCategoryId === cat.id ? 'border-lime-500 bg-lime-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
              {selectedCategoryId === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span onClick={() => setSelectedCategoryId(cat.id)}
              className={`text-sm font-medium capitalize transition-colors truncate ${
                selectedCategoryId === cat.id ? 'text-lime-500'
                  : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
              }`}>
              {cat.name}
            </span>
          </label>
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Condition" isOpen={isCondOpen} onToggle={() => setIsCondOpen(!isCondOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2">
        {['New', 'Used', 'Refurbished'].map((cond) => (
          <button key={cond} onClick={() => toggleCondition(cond)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border-2 transition-all duration-200 ${
              selectedConditions.includes(cond) ? 'bg-lime-500 border-lime-500 text-white'
                : darkMode ? 'border-gray-700 text-gray-300 hover:border-lime-500 hover:text-lime-400'
                           : 'border-gray-200 text-gray-600 hover:border-lime-500 hover:text-lime-600'
            }`}>
            {cond}
          </button>
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Price Range (EGP)" isOpen={isPriceOpen} onToggle={() => setIsPriceOpen(!isPriceOpen)} darkMode={darkMode}>
      <div className="space-y-3 sm:space-y-4">
        <div className={`flex justify-between text-xs sm:text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <span className="px-2 py-1 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400">EGP {priceRange[0].toLocaleString()}</span>
          <span className="px-2 py-1 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400">EGP {priceRange[1].toLocaleString()}</span>
        </div>
        <input type="range" min="0" max="100000" step="1000" value={priceRange[0]}
          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
          className="w-full accent-lime-600 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700" />
        <input type="range" min="0" max="100000" step="1000" value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-lime-600 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700" />
      </div>
    </FilterSection>

    <motion.button whileTap={{ scale: 0.97 }} onClick={clearFilters}
      className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all">
      <FiX /> Clear All Filters
    </motion.button>
  </div>
));

const ProductsContent = memo(({ darkMode }) => {
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [priceRange, setPriceRange]         = useState([0, 50000]);
  const [currentPage, setCurrentPage]       = useState(1);
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [sortBy, setSortBy]                 = useState('relevance');

  const [isSortOpen, setIsSortOpen]   = useState(true);
  const [isCatOpen, setIsCatOpen]     = useState(true);
  const [isCondOpen, setIsCondOpen]   = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  const [isPending, startTransition] = useTransition();

  const pageSize    = 12;
  const sliderRef   = useRef(null);
  const token       = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId]);

  const handleAddToCart = useCallback(async (product) => {
    startTransition(async () => {
      try {
        await api.post('/api/cart/items',
          { productId: product.id, quantity: 1, price: product.price, name: product.name, imageUrl: product.image || '/placeholder.png' },
          { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ title: 'Added!', text: `${product.name} added to cart`, icon: 'success', toast: true, position: 'top-end', timer: 1500, timerProgressBar: true });
      } catch {
        Swal.fire({ title: 'Error', text: 'Failed to add to cart', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      }
    });
  }, [token]);

  const latestProducts = useMemo(() =>
    [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice  = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesCond   = selectedConditions.length === 0 || selectedConditions.includes(p.condition);
      return matchesSearch && matchesPrice && matchesCond;
    });
    if (sortBy === 'priceLowToHigh') filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'priceHighToLow') filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [products, searchTerm, priceRange, selectedConditions, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const scrollSlider = useCallback((dir) => {
    if (!sliderRef.current) return;
    startTransition(() => {
      sliderRef.current.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    let timeout;
    const check = () => {
      if (timeout) return;
      timeout = setTimeout(() => {
        startTransition(() => {
          setCanScrollLeft(slider.scrollLeft > 2);
          setCanScrollRight(slider.scrollLeft + slider.clientWidth < slider.scrollWidth - 5);
        });
        timeout = null;
      }, 100);
    };
    check();
    slider.addEventListener('scroll', check);
    window.addEventListener('resize', check);
    return () => { slider.removeEventListener('scroll', check); window.removeEventListener('resize', check); clearTimeout(timeout); };
  }, [latestProducts]);

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearchTerm(''); setPriceRange([0, 50000]); setSelectedCategoryId('all');
      setSelectedConditions([]); setSortBy('relevance'); setCurrentPage(1);
    });
  }, []);

  const toggleCondition = useCallback((c) =>
    startTransition(() => {
      setSelectedConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
    }), []);

  const showSliderArrows = useMemo(() => latestProducts.length > 3 && (canScrollLeft || canScrollRight), [latestProducts.length, canScrollLeft, canScrollRight]);

  const activeFiltersCount = useMemo(() => [
    searchTerm,
    selectedCategoryId !== 'all' ? selectedCategoryId : null,
    ...selectedConditions,
    priceRange[0] !== 0 || priceRange[1] !== 50000 ? 'price' : null,
    sortBy !== 'relevance' ? sortBy : null,
  ].filter(Boolean).length, [searchTerm, selectedCategoryId, selectedConditions, priceRange, sortBy]);

  const heroStats = useMemo(() => [
    { icon: <FiPackage size={16} />, value: '1,200+', label: 'Products in stock', accent: '#0d9488', delay: 0.1 },
    { icon: <FiUsers size={16} />,   value: '~50K',   label: 'Happy customers',   accent: '#3b82f6', delay: 0.2 },
    { icon: <RiStarFill size={16} />, value: '4.9★',  label: 'Average rating',    accent: '#f59e0b', delay: 0.3 },
  ], []);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <section className={`relative overflow-hidden pt-16 sm:pt-20 pb-28 sm:pb-32 md:pb-40 ${
        darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
                 : 'bg-gradient-to-br from-lime-50 via-white to-emerald-50'
      }`}>
        <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] -top-32 sm:-top-40 -left-16 sm:-left-32 rounded-full blur-3xl opacity-20 bg-lime-400 animate-pulse pointer-events-none" style={{ animationDuration: '5s' }} />
        <div className="absolute w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] top-8 sm:top-10 -right-12 sm:-right-20 rounded-full blur-3xl opacity-15 bg-emerald-500 animate-pulse pointer-events-none" style={{ animationDuration: '7s' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,#000 39px,#000 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#000 39px,#000 40px)' }} />
        <WaveTop darkMode={darkMode} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center  gap-2 mt-6 px-4 py-1.5 rounded-full border text-sm font-semibold bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400">
                <span className="w-2 h-2 rounded-full  bg-lime-500 animate-ping" /> New arrivals added daily
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-5xl  md:text-6xl lg:text-7xl font-extrabold leading-[1.08]">
                <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">Shop Premium</span><br />
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Devices at</span><br />
                <span style={{ WebkitTextStroke: darkMode ? '2px #84cc16' : '2px #16a34a', color: 'transparent' }}>Best Prices</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className={`text-base sm:text-xl md:text-2xl leading-relaxed max-w-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Discover new & refurbished phones, laptops, tablets, and accessories — all verified and ready to ship.
              </motion.p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 pt-1 sm:pt-2">
                {heroStats.map((s) => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
              </div>
            </div>

            <div className="relative h-56 sm:h-80 lg:h-[520px] hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-300/20 to-emerald-300/20 dark:from-lime-900/15 dark:to-emerald-900/15 rounded-full blur-3xl scale-125" />
              <div className="relative w-full h-full">
                <motion.div initial={{ opacity: 0, rotate: 10, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 5, scale: 1.04 }}
                  className={`absolute top-8 left-6 w-44 sm:w-52 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
                  <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                    <div className={`h-3 sm:h-4 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-3 sm:h-4 rounded w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className="h-8 sm:h-10 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-xl w-2/3" />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, rotate: -8, y: 20 }} animate={{ opacity: 1, rotate: -10, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.35 }} whileHover={{ rotate: -4, scale: 1.04 }}
                  className={`absolute bottom-12 right-8 w-52 sm:w-60 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-5">
                    <div className="flex justify-between items-center">
                      <div className={`h-4 sm:h-5 rounded w-28 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <FiPackage className="text-cyan-500 text-xl sm:text-2xl" />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className={`h-3 sm:h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className={`h-3 sm:h-4 rounded w-5/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      <div className="h-3 sm:h-4 rounded bg-gradient-to-r from-lime-400 to-emerald-400 w-1/2" />
                    </div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.07, y: -4 }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-40 sm:w-48 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
                  <div className="p-4 sm:p-5 flex flex-col items-center">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                      <FiZap className="text-lime-400 text-3xl sm:text-4xl" />
                    </div>
                    <div className={`h-3 sm:h-4 rounded w-5/6 mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-3 sm:h-4 rounded w-4/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className="mt-3"><span className="text-xs font-bold text-lime-500">In Stock ✓</span></div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-1/4 right-4 z-20 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-xl">
                  📦 Fast Delivery
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <WaveBottom darkMode={darkMode} />
      </section>

      {!isLoading && latestProducts.length > 0 && (
        <div className={`py-10 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-10">
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className={`text-2xl sm:text-4xl font-extrabold tracking-wide relative inline-block ${
                  darkMode ? 'text-lime-400' : 'text-lime-600'
                } after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-lime-600 after:to-emerald-500`}>
                Latest Arrivals
              </motion.h2>
              {showSliderArrows && (
                <div className="flex gap-2 sm:gap-3">
                  <button onClick={() => scrollSlider('left')} disabled={!canScrollLeft}
                    className={`p-2 sm:p-3 rounded-full shadow-lg transition-all ${canScrollLeft ? 'bg-white dark:bg-gray-800 hover:bg-lime-50 dark:hover:bg-lime-900 text-lime-700 dark:text-lime-400' : 'bg-gray-100 dark:bg-gray-800 opacity-30 cursor-not-allowed'}`}>
                    <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={() => scrollSlider('right')} disabled={!canScrollRight}
                    className={`p-2 sm:p-3 rounded-full shadow-lg transition-all ${canScrollRight ? 'bg-white dark:bg-gray-800 hover:bg-lime-50 dark:hover:bg-lime-900 text-lime-700 dark:text-lime-400' : 'bg-gray-100 dark:bg-gray-800 opacity-30 cursor-not-allowed'}`}>
                    <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              )}
            </div>
            <div ref={sliderRef} className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-6 snap-x snap-mandatory scroll-smooth pb-4 sm:pb-6 hide-scrollbar">
              {latestProducts.map((p, i) => (
                <div key={p.id} className="snap-start flex-shrink-0 w-[180px] sm:w-[250px] md:w-[280px] lg:w-[300px]">
                  <ProductCard product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex gap-5 lg:gap-8">
          <aside className={`hidden lg:block w-60 xl:w-64 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border shadow-lg ${
            darkMode ? 'bg-gray-800/60 border-gray-700 backdrop-blur-md' : 'bg-white border-gray-200'
          }`}>
            <div className="px-4 xl:px-5">
              <SidebarContent 
                darkMode={darkMode}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                sortBy={sortBy} setSortBy={setSortBy}
                selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId}
                categories={categories}
                isSortOpen={isSortOpen} setIsSortOpen={setIsSortOpen}
                isCatOpen={isCatOpen} setIsCatOpen={setIsCatOpen}
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
                <span className={`ml-2 text-sm sm:text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>products found</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {selectedConditions.map((c) => (
                  <span key={c} className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 text-lime-600 dark:text-lime-400 text-xs font-semibold border border-lime-500/30">
                    {c}<button onClick={() => toggleCondition(c)}><FiX className="w-3 h-3" /></button>
                  </span>
                ))}
                
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`lg:hidden flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl border font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                  <FiSliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lime-500" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-lime-500 text-white text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>
                  )}
                </motion.button>
              </div>
            </div>

            {isLoading ? (
              <SkeletonProducts darkMode={darkMode} />
            ) : filteredProducts.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 sm:py-32">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FiPackage className="text-2xl sm:text-4xl text-gray-400" />
                </div>
                <p className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>No products found</p>
                <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold transition-all text-sm sm:text-base">
                  Clear Filters
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {paginatedProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 sm:mt-14 gap-1.5 sm:gap-2 flex-wrap">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className={`p-2 sm:p-2.5 rounded-xl border transition-all ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 border ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-white border-transparent shadow-lg shadow-lime-500/30 scale-105'
                        : darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                                   : 'bg-white border-gray-200 text-gray-700 hover:bg-lime-50 hover:border-lime-300'
                    }`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className={`p-2 sm:p-2.5 rounded-xl border transition-all ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`absolute left-0 top-0 bottom-0 w-72 sm:w-80 shadow-2xl overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <span className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filters</span>
                <button onClick={() => setIsSidebarOpen(false)}
                  className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="px-4 sm:px-5">
                <SidebarContent 
                  darkMode={darkMode}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  sortBy={sortBy} setSortBy={setSortBy}
                  selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId}
                  categories={categories}
                  isSortOpen={isSortOpen} setIsSortOpen={setIsSortOpen}
                  isCatOpen={isCatOpen} setIsCatOpen={setIsCatOpen}
                  isCondOpen={isCondOpen} setIsCondOpen={setIsCondOpen}
                  isPriceOpen={isPriceOpen} setIsPriceOpen={setIsPriceOpen}
                  selectedConditions={selectedConditions} toggleCondition={toggleCondition}
                  priceRange={priceRange} setPriceRange={setPriceRange}
                  clearFilters={clearFilters} activeFiltersCount={activeFiltersCount}
                />
              </div>
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