import React, { useState, useEffect, useCallback, useRef, useMemo, memo, Suspense, useTransition } from 'react';
import {
  FiSearch, FiFilter, FiShoppingCart, FiChevronLeft, FiChevronRight,
  FiX, FiChevronDown, FiPackage, FiUsers, FiZap, FiSliders, FiEye,
  FiArrowRight, FiMonitor, FiCheck, FiPlus, FiShield, FiTruck, FiRefreshCw,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { RiStarFill, RiDeviceLine, RiBattery2ChargeLine } from 'react-icons/ri';
import api from '../api';
import Hero from '../components/Hero';
import Swal from 'sweetalert2';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      delay: i * 0.025,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
};

const hoverScale = {
  y: -6,
  transition: { duration: 0.12, ease: "easeOut" }
};

const ACCENT_BAR = 'h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500';

const FunnelIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M16 18 H48 L36 34 V46 L28 50 V34 Z" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.6" strokeLinejoin="round" />
    <circle cx="50" cy="14" r="2.2" fill="#fbbf24" />
    <circle cx="14" cy="46" r="1.8" fill={darkMode ? '#6ee7b7' : '#34d399'} />
  </svg>
));

const PackageStackIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M18 24 L32 17 L46 24 L46 40 L32 47 L18 40 Z" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M18 24 L32 31 L46 24 M32 31 V47" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="48" cy="14" r="2.2" fill="#fbbf24" />
  </svg>
));

const SearchGlassIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <circle cx="28" cy="28" r="12" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.6" />
    <path d="M37 37 L46 46" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="48" cy="14" r="2.2" fill="#fbbf24" />
  </svg>
));

const EmptyBoxIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 120 100" className="w-24 h-20 sm:w-28 sm:h-24 mx-auto">
    <ellipse cx="60" cy="86" rx="38" ry="6" fill={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
    <path d="M20 40 L60 24 L100 40 L100 74 L60 90 L20 74 Z" fill={darkMode ? '#1f2937' : '#f3f4f6'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M20 40 L60 56 L100 40" fill="none" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M60 56 L60 90" fill="none" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M42 32 L82 48" fill="none" stroke={darkMode ? '#4b5563' : '#d1d5db'} strokeWidth="2" />
    <circle cx="60" cy="18" r="7" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.4" />
    <path d="M57 18 L59.5 20.5 L64 15.5" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const HeroSearchBar = memo(({ darkMode, value, onChange }) => (
  <div className="relative w-full border rounded-md dark:border-gray-800 max-w-xl">
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-md border backdrop-blur-xl transition-all duration-150 shadow-lg ${
      darkMode ? 'border-white/15 bg-white/5 focus-within:border-emerald-400/50' : 'border-white/60 bg-white/35 focus-within:border-emerald-400/60'
    }`}>
      <FiSearch className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products by name..."
        className={`flex-1 cursor-pointer outline-none text-sm bg-transparent font-medium placeholder:font-normal ${
          darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'
        }`}
      />
      {value && (
        <button onClick={() => onChange('')} className={`p-0.5 rounded-full transition-colors duration-150 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
));

const conditionConfig = {
  New:         { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Used:        { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
  Refurbished: { badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300', dot: 'bg-sky-500' },
};

const ProductCard = memo(({ product, darkMode, onAddToCart, index = 0 }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const discountedPrice = useMemo(() => 
    product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null
  , [product.price, product.discount]);

  const cond = conditionConfig[product.condition] || { badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' };

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
      viewport={{ once: true, margin: "50px" }}
      whileHover={hoverScale}
      onClick={navigateToDetail}
      className={`group relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer
        ring-1 transition-shadow duration-200 h-full ${
          darkMode
            ? 'bg-gray-800 ring-white/10 shadow-md shadow-black/20 hover:ring-emerald-400/30 hover:shadow-xl hover:shadow-emerald-400/10'
            : 'bg-white ring-black/5 shadow-sm hover:ring-emerald-400/40 hover:shadow-xl hover:shadow-emerald-400/10'
        }`}
    >
      {product.discount && (
        <motion.span initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.05 + index * 0.02 }}
          className="absolute top-2.5 left-2.5 z-10 inline-flex bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md shadow-rose-500/30">
          -{product.discount}%
        </motion.span>
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
            <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
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
        <motion.button whileTap={{ scale: 0.96 }} onClick={handleCart}
          className={`mt-1.5 sm:mt-2 w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm
            flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-150 ${
              cartAdded
                ? 'bg-emerald-400 text-white shadow-md shadow-emerald-400/30'
                : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-sm shadow-emerald-400/20 hover:shadow-md hover:shadow-emerald-400/30 hover:brightness-105'
            }`}>
          <AnimatePresence mode="wait">
            {cartAdded
              ? <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex items-center gap-1">✓ Added!</motion.span>
              : <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex items-center gap-1.5"><FiShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add to Cart</motion.span>
            }
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
});

const CategoryBadge = memo(({ darkMode, children }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
    darkMode ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/30' : 'bg-emerald-400 text-white ring-1 ring-inset ring-emerald-400/25'
  }`}>
    <span className="w-1.5 h-1.5 rounded-full bg-white" />
    {children}
  </span>
));

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
      viewport={{ once: true, margin: "60px" }}
      whileHover={{ y: -4 }}
      onClick={navigateToDetail}
      className="relative flex-shrink-0 w-[148px] sm:w-[190px] h-[210px] sm:h-[260px] rounded-2xl overflow-hidden cursor-pointer snap-start shadow-md ring-1 ring-black/5 group"
    >
      <img
        src={product.imageUrl || '/placeholder.png'}
        alt={product.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {product.discount && (
        <span className="absolute top-2.5 left-2.5 inline-flex bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
          -{product.discount}%
        </span>
      )}

      <button
        onClick={handleCart}
        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-150 ${
          cartAdded ? 'bg-emerald-400 text-white' : 'bg-white/20 text-white hover:bg-emerald-400'
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
          {discountedPrice && (
            <span className="text-[10px] line-through text-white/50 tabular-nums">EGP {product.price?.toFixed(2)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

const CategorySlider = memo(({ category, items, darkMode, onAddToCart }) => {
  const sliderRef = useRef(null);
  const [canLeft, setCanLeft]   = useState(false);
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
    el.addEventListener('scroll', check);
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
          <CategoryBadge darkMode={darkMode}>{category.name}</CategoryBadge>
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
            className={`p-1.5 sm:p-2 rounded-full ring-1 transition-all duration-150 ${canLeft
              ? darkMode ? 'bg-gray-800 ring-white/10 hover:bg-emerald-900/40 text-emerald-400' : 'bg-white ring-black/5 hover:bg-emerald-50 text-emerald-700 shadow-sm'
              : darkMode ? 'bg-gray-800/40 ring-white/5 opacity-30 cursor-not-allowed' : 'bg-gray-100/60 ring-black/5 opacity-30 cursor-not-allowed'}`}>
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')} disabled={!canRight}
            className={`p-1.5 sm:p-2 rounded-full ring-1 transition-all duration-150 ${canRight
              ? darkMode ? 'bg-gray-800 ring-white/10 hover:bg-emerald-900/40 text-emerald-400' : 'bg-white ring-black/5 hover:bg-emerald-50 text-emerald-700 shadow-sm'
              : darkMode ? 'bg-gray-800/40 ring-white/5 opacity-30 cursor-not-allowed' : 'bg-gray-100/60 ring-black/5 opacity-30 cursor-not-allowed'}`}>
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
  <div className={`border-b pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
    <button onClick={onToggle}
      className={`w-full flex justify-between items-center text-sm sm:text-base font-bold py-1 transition-colors duration-150 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      {title}
      <FiChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    </button>
    <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }} className="overflow-hidden">
      <div className="pt-3">{children}</div>
    </motion.div>
  </div>
));

const RadioOption = memo(({ value, label, selected, onSelect, darkMode }) => (
  <label className="flex items-center gap-3 cursor-pointer group py-0.5">
    <div
      onClick={() => onSelect(value)}
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
        selected ? 'border-emerald-400 bg-emerald-400' : darkMode ? 'border-gray-600' : 'border-gray-300'
      }`}
    >
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
    <span
      onClick={() => onSelect(value)}
      className={`text-sm font-medium flex items-center gap-1.5 transition-colors truncate ${
        selected ? 'text-emerald-500' : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
      }`}
    >
      {label}
    </span>
  </label>
));

const PillButton = memo(({ label, isActive, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all duration-200 ${
      isActive
        ? 'bg-emerald-400 border-emerald-400 text-white shadow-sm shadow-emerald-200'
        : darkMode
          ? 'border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-400 bg-gray-800/60'
          : 'border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600 bg-white'
    }`}
  >
    {label}
  </button>
));

const PriceRangeSlider = memo(({ priceRange, setPriceRange, darkMode }) => {
  const MIN = 0, MAX = 100000, STEP = 1000;
  const leftPct = (priceRange[0] / MAX) * 100;
  const rightPct = (priceRange[1] / MAX) * 100;
  const thumbCls = "absolute inset-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-400 " +
    "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full " +
    "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-400 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer";

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-between text-xs sm:text-sm font-bold">
        <span className="px-2.5 py-1 rounded-lg bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[0].toLocaleString()}</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[1].toLocaleString()}</span>
      </div>
      <div className="relative h-4 flex items-center">
        <div className={`absolute inset-x-0 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="absolute h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
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

const SidebarContent = memo(({ darkMode, searchTerm, setSearchTerm, sortBy, setSortBy, sortLabels, selectedCategoryId, setSelectedCategoryId, categories, isSortOpen, setIsSortOpen, isCatOpen, setIsCatOpen, isCondOpen, setIsCondOpen, isPriceOpen, setIsPriceOpen, selectedConditions, toggleCondition, priceRange, setPriceRange, clearFilters, activeFiltersCount }) => (
  <div className="py-4 sm:py-6 space-y-4 sm:space-y-5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 flex-shrink-0">
        <FunnelIllustration darkMode={darkMode} />
      </div>
      <div className="flex-1 flex items-center justify-between">
        <h3 className={`text-lg sm:text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Filters
        </h3>
        {activeFiltersCount > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-white text-xs font-bold">{activeFiltersCount}</span>
        )}
      </div>
    </div>

    <div className="relative border rounded-md dark:border-gray-800">
      <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={14} />
      <input type="text" placeholder="Search products..." value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-md border text-sm transition-colors duration-150 ${
          darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                   : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
        } focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent`}
      />
      {searchTerm && (
        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
          <FiX className="text-gray-400 hover:text-gray-600 transition-colors duration-150" size={14} />
        </button>
      )}
    </div>

    <FilterSection title="Sort By" isOpen={isSortOpen} onToggle={() => setIsSortOpen(!isSortOpen)} darkMode={darkMode}>
      <div className="space-y-2">
        {Object.entries(sortLabels).map(([value, label]) => (
          <RadioOption key={value} value={value} label={label} selected={sortBy === value}
            onSelect={(val) => setSortBy(val)} darkMode={darkMode} />
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
        {['New', 'Used', 'Refurbished'].map((cond) => (
          <PillButton key={cond} label={cond} isActive={selectedConditions.includes(cond)} onClick={() => toggleCondition(cond)} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Price Range (EGP)" isOpen={isPriceOpen} onToggle={() => setIsPriceOpen(!isPriceOpen)} darkMode={darkMode}>
      <PriceRangeSlider priceRange={priceRange} setPriceRange={setPriceRange} darkMode={darkMode} />
    </FilterSection>

    <motion.button whileTap={{ scale: 0.97 }} onClick={clearFilters}
      className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600
        text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
      <FiX /> Clear All Filters
    </motion.button>
  </div>
));

const PaginationButton = memo(({ children, onClick, disabled, active, darkMode }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`min-w-[40px] h-10 sm:min-w-[44px] sm:h-11 px-2 rounded-xl font-bold text-sm transition-all duration-200 border flex items-center justify-center ${
      active
        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-400/30 scale-105'
        : disabled
          ? 'opacity-40 cursor-not-allowed ' + (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-400')
          : darkMode
            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-emerald-500'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300'
    }`}
  >
    {children}
  </button>
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

  const categorySections = useMemo(() => {
    const sections = categories
      .map((cat) => ({ category: cat, items: (productsByCategory[cat.id] || []).slice(0, 10) }))
      .filter((sec) => sec.items.length > 0);
    return sections.slice(0, 6);
  }, [categories, productsByCategory]);

  const sortLabels = useMemo(() => ({
    relevance: 'Relevance',
    priceLowToHigh: 'Price: Low to High',
    priceHighToLow: 'Price: High to Low',
    newest: 'Newest Arrivals',
  }), []);

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


  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
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
          { label: 'View Filters', onClick: () => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' }), primary: false }
        ]}
        stats={[
          { value: '1,200+', label: 'Products in stock' },
          { value: '~50K',   label: 'Happy customers'   },
          { value: '4.9 ★',  label: 'Average rating'    },
        ]}
      >
        <HeroSearchBar darkMode={darkMode} value={searchTerm} onChange={(v) => startTransition(() => setSearchTerm(v))} />
      </Hero>

      {!isLoading && latestProducts.length > 0 && (
        <div className={`py-10 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-emerald-50/30'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-10">
              <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25 }}
                className={`text-2xl sm:text-4xl font-bold tracking-tight relative inline-block ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-800'
                } after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-12 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-emerald-400 after:to-teal-500`}>
                Latest Arrivals
              </motion.h2>
              {showSliderArrows && (
                <div className="flex gap-2 sm:gap-3">
                  <button onClick={() => scrollSlider('left')} disabled={!canScrollLeft}
                    className={`p-2 sm:p-3 rounded-full backdrop-blur-md ring-1 transition-all duration-150 ${canScrollLeft
                      ? darkMode ? 'bg-gray-800/80 ring-white/10 hover:bg-emerald-900/40 text-emerald-400 shadow-lg' : 'bg-white/80 ring-black/5 hover:bg-emerald-50 text-emerald-700 shadow-lg'
                      : darkMode ? 'bg-gray-800/40 ring-white/5 opacity-30 cursor-not-allowed' : 'bg-gray-100/60 ring-black/5 opacity-30 cursor-not-allowed'}`}>
                    <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={() => scrollSlider('right')} disabled={!canScrollRight}
                    className={`p-2 sm:p-3 rounded-full backdrop-blur-md ring-1 transition-all duration-150 ${canScrollRight
                      ? darkMode ? 'bg-gray-800/80 ring-white/10 hover:bg-emerald-900/40 text-emerald-400 shadow-lg' : 'bg-white/80 ring-black/5 hover:bg-emerald-50 text-emerald-700 shadow-lg'
                      : darkMode ? 'bg-gray-800/40 ring-white/5 opacity-30 cursor-not-allowed' : 'bg-gray-100/60 ring-black/5 opacity-30 cursor-not-allowed'}`}>
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
            <div className="flex items-center gap-4 sm:gap-5 mb-8 sm:mb-12">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
                <PackageStackIllustration darkMode={darkMode} />
              </div>
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  Shop by category
                </span>
                <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight mt-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Explore our collections
                </h2>
              </div>
            </div>
            {categorySections.map(({ category, items }) => (
              <CategorySlider key={category.id} category={category} items={items} darkMode={darkMode} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </div>
      )}

      <div id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex gap-5 lg:gap-8">
          <aside className={`hidden lg:block w-60 xl:w-64 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border shadow-lg overflow-hidden ${
            darkMode ? 'bg-gray-800/60 border-gray-700 backdrop-blur-md' : 'bg-white border-emerald-100'
          }`}>
            <div className={ACCENT_BAR} />
            <div className="px-4 xl:px-5">
              <SidebarContent 
                darkMode={darkMode}
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                sortBy={sortBy} setSortBy={setSortBy} sortLabels={sortLabels}
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
                  <span key={c} className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-400/30">
                    {c}<button onClick={() => toggleCondition(c)} className="transition-transform duration-150 hover:scale-110"><FiX className="w-3 h-3" /></button>
                  </span>
                ))}
                
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`lg:hidden flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl border font-semibold text-xs sm:text-sm transition-all duration-150 shadow-sm hover:shadow-md ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-emerald-100 text-gray-700'
                  }`}>
                  <FiSliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-400 text-white text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>
                  )}
                </motion.button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`h-[280px] sm:h-[380px] md:h-[420px] rounded-2xl sm:rounded-3xl animate-pulse shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="text-center py-20 sm:py-32">
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-6">
                  {searchTerm.trim() ? <SearchGlassIllustration darkMode={darkMode} /> : <EmptyBoxIllustration darkMode={darkMode} />}
                </div>
                <p className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>No products found</p>
                <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-bold transition-colors duration-150 text-sm sm:text-base">
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
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className={`absolute left-0 top-0 bottom-0 w-72 sm:w-80 shadow-2xl overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
             
             
              <div className="px-4 sm:px-5">
                <SidebarContent 
                  darkMode={darkMode}
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  sortBy={sortBy} setSortBy={setSortBy} sortLabels={sortLabels}
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