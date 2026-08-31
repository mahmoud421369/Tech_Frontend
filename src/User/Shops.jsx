import React, { useState, useEffect, useCallback, useRef, useMemo, memo, Suspense, lazy, useDeferredValue } from 'react';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiMapPin, FiPhone, FiTruck, FiFilter, FiSliders, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiX, FiArrowRight, FiRefreshCw, FiGrid, FiList,
} from 'react-icons/fi';
import { RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const Hero = lazy(() => import('../components/Hero'));

const queryClient = new QueryClient();

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, delay: Math.min(i, 8) * 0.03, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const GLASS = 'backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10';
const GLASS_STRONG = 'backdrop-blur-2xl bg-white/70 dark:bg-gray-900/50 border border-black/10 dark:border-white/10';

const HeroSkeleton = memo(({ darkMode }) => (
  <div className={`h-[420px] sm:h-[480px] w-full ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'} animate-pulse`} />
));

const StoreIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.10)'} />
    <path d="M14 27 L18 15 H46 L50 27" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.5" strokeLinejoin="round" />
    <rect x="16" y="27" width="32" height="23" fill={darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.06)'} stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.5" />
    <rect x="27" y="37" width="10" height="13" fill={darkMode ? '#111827' : '#ffffff'} stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2" />
    <path d="M16 27 V23 M24 27 V23 M32 27 V23 M40 27 V23 M48 27 V23" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2" strokeLinecap="round" />
    <circle cx="50" cy="14" r="2.4" fill="#fbbf24" />
    <circle cx="12" cy="42" r="1.8" fill="#6ee7b7" />
  </svg>
));

const EmptyBoxIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 120 100" className="w-full h-full">
    <ellipse cx="60" cy="86" rx="36" ry="6" fill={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} />
    <path d="M20 40 L60 24 L100 40 L100 72 L60 88 L20 72 Z" fill={darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.08)'} stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2" strokeLinejoin="round" />
    <path d="M20 40 L60 56 L100 40" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2" strokeLinejoin="round" />
    <path d="M60 56 L60 88" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2" />
    <path d="M38 29 L60 40 L82 29" fill="none" stroke={darkMode ? '#6ee7b7' : '#34d399'} strokeWidth="2" strokeLinejoin="round" strokeDasharray="4 5" />
    <circle cx="96" cy="18" r="2.4" fill="#fbbf24" />
    <circle cx="24" cy="16" r="1.8" fill="#fbbf24" />
  </svg>
));

const EmptyState = memo(({ darkMode, title, subtitle, actionLabel, onAction, compact }) => (
  <div className={`text-center ${compact ? 'py-12 sm:py-14' : 'py-20 sm:py-28'}`}>
    <div className={`${compact ? 'w-20 h-20' : 'w-28 h-28 sm:w-32 sm:h-32'} mx-auto mb-5`}>
      <EmptyBoxIllustration darkMode={darkMode} />
    </div>
    <p className={`${compact ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold mb-1.5 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</p>
    <p className={`text-sm sm:text-base mb-6 max-w-sm mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
    {actionLabel && (
      <button onClick={onAction} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors duration-150">
        {actionLabel}
      </button>
    )}
  </div>
));

const CategoryTag = memo(({ darkMode, children }) => (
  <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider border-l-2 ${
    darkMode ? 'border-emerald-400 text-emerald-300 bg-emerald-400/5' : 'border-emerald-600 text-emerald-700 bg-emerald-50'
  }`}>
    {children}
  </span>
));

const FilterSection = memo(({ title, isOpen, onToggle, darkMode, children }) => (
  <div className={`border-b py-3 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
    <button onClick={onToggle} className={`w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider py-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
      {title}
      <FiChevronDown className={`transition-transform duration-200 w-3.5 h-3.5 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    </button>
    <div className={`grid transition-all duration-150 ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  </div>
));

const ShieldIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <path d="M32 4 L54 12 V30 C54 45 44 55 32 60 C20 55 10 45 10 30 V12 Z" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M32 10 L48 16 V30 C48 41.5 40.5 49.5 32 53.5 C23.5 49.5 16 41.5 16 30 V16 Z" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.5" />
    <path d="M23 30 L29 36 L42 22" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const ClockIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="30" cy="34" r="24" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <circle cx="30" cy="34" r="18" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.5" />
    <path d="M30 24 V34 L38 39" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const ThumbsIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M22 30 H16 V50 H22 Z" fill={darkMode ? '#34d399' : '#10b981'} />
    <path d="M24 30 L30 14 C31.5 12 34.5 12.5 34.5 15.5 L33.5 24 H44 C46.5 24 48 26.5 47 28.5 L42 46 C41.3 47.5 39.8 48.5 38 48.5 H24 V30 Z" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.6" strokeLinejoin="round" />
  </svg>
));

const CARD_HIGHLIGHTS = [
  { key: 'warranty', label: 'Warranty', Illustration: ShieldIllustration },
  { key: 'fast', label: 'Fast Service', Illustration: ClockIllustration },
  { key: 'rated', label: 'Top Rated', Illustration: ThumbsIllustration },
];

const ShopCard = memo(({ shop, darkMode, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '60px' }}
    onClick={() => (window.location.href = `/shops/${shop.id}`)}
    className={`group flex flex-col overflow-hidden cursor-pointer h-full border-l-[3px] transition-colors duration-150 ${
      darkMode
        ? 'bg-gray-800 border border-gray-700 border-l-emerald-400 hover:border-l-emerald-300'
        : 'bg-white border border-gray-200 border-l-emerald-500 hover:border-l-emerald-600'
    }`}
  >
    <div className={`relative h-36 sm:h-40 flex-shrink-0 flex items-center justify-center border-b ${
      darkMode ? 'bg-gradient-to-br from-emerald-900/25 to-teal-900/10 border-gray-700' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-gray-200'
    }`}>
      <div className="w-20 h-20 sm:w-24 sm:h-24">
        <StoreIllustration darkMode={darkMode} />
      </div>
      {shop.verified && (
        <span className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2 py-1 border ${
          darkMode ? 'bg-gray-900/90 border-gray-700 text-emerald-300' : 'bg-white border-gray-200 text-emerald-600'
        }`}>
          <RiVerifiedBadgeLine className="w-3.5 h-3.5" /> Verified
        </span>
      )}
      <span className={`absolute bottom-3 left-3 flex items-center gap-1 text-xs font-bold px-2 py-1 border ${
        darkMode ? 'bg-gray-900/90 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-700'
      }`}>
        <RiStarFill className="text-amber-400 w-3.5 h-3.5" />
        {shop.rating?.toFixed(1) || '4.8'}
      </span>
    </div>

    <div className={`px-4 pt-4 pb-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <h3 className={`font-bold text-base sm:text-lg line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {shop.name || 'Unnamed Shop'}
      </h3>
      <p className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
        {shop.shopType || 'Electronics Repair'}
      </p>
    </div>

    {(shop.shopAddress || shop.phone) && (
      <div className={`px-4 py-3 space-y-1.5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        {shop.shopAddress && (
          <p className={`text-sm flex items-start gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <FiMapPin className="text-emerald-500 mt-0.5 flex-shrink-0 w-3.5 h-3.5" />
            <span className="line-clamp-1">{shop.shopAddress.street}, {shop.shopAddress.city}</span>
          </p>
        )}
        {shop.phone && (
          <p className={`text-sm flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <FiPhone className="text-emerald-500 flex-shrink-0 w-3.5 h-3.5" />
            {shop.phone}
          </p>
        )}
      </div>
    )}

    <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {shop.description || 'Professional repair services with genuine parts and 6-month warranty.'}
      </p>
    </div>

    <div className="px-4 py-3 grid grid-cols-3 gap-2">
      {CARD_HIGHLIGHTS.map(({ key, label, Illustration }) => (
        <div key={key} className="flex flex-col items-center gap-1 text-center">
          <div className="w-7 h-7"><Illustration darkMode={darkMode} /></div>
          <span className={`text-[10px] font-semibold leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
        </div>
      ))}
    </div>

    <div className="px-4 pb-4 pt-1 mt-auto">
      <button
        onClick={(e) => { e.stopPropagation(); window.location.href = `/shops/${shop.id}`; }}
        className={`w-full py-2.5 px-4 font-bold text-sm flex items-center justify-center gap-2 border transition-colors duration-150 ${
          darkMode ? 'border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-gray-900' : 'border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white'
        }`}
      >
        <FiTruck className="w-4 h-4" /> Visit Shop
      </button>
    </div>
  </motion.div>
));

const ShopStripCard = memo(({ shop, darkMode, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '60px' }}
    onClick={() => (window.location.href = `/shops/${shop.id}`)}
    className={`relative flex-shrink-0 w-[260px] sm:w-[300px] flex flex-col overflow-hidden cursor-pointer snap-start border transition-colors duration-150 ${
      darkMode ? 'bg-gray-800 border-gray-700 hover:border-emerald-400' : 'bg-white border-gray-200 hover:border-emerald-500'
    }`}
  >
    <div className={`relative h-24 sm:h-28 flex-shrink-0 flex items-center justify-center border-b ${
      darkMode ? 'bg-gradient-to-br from-emerald-900/25 to-teal-900/10 border-gray-700' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-gray-200'
    }`}>
      <div className="w-14 h-14 sm:w-16 sm:h-16"><StoreIllustration darkMode={darkMode} /></div>
      {shop.verified && (
        <span className={`absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 border ${
          darkMode ? 'bg-gray-900/90 border-gray-700 text-emerald-300' : 'bg-white border-gray-200 text-emerald-700'
        }`}>
          <RiVerifiedBadgeLine className="w-3 h-3" /> Verified
        </span>
      )}
      <span className={`absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 border ${
        darkMode ? 'bg-gray-900/90 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-700'
      }`}>
        <RiStarFill className="text-amber-400 w-3 h-3" />
        {shop.rating?.toFixed(1) || '4.8'}
      </span>
    </div>

    <div className="flex flex-col flex-grow p-3.5 gap-1.5">
      <h4 className={`font-bold text-sm line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{shop.name || 'Unnamed Shop'}</h4>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
        {shop.shopType || 'Electronics Repair'}
      </p>
      {shop.shopAddress && (
        <p className={`text-xs flex items-start gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FiMapPin className="text-emerald-500 mt-0.5 flex-shrink-0 w-3 h-3" />
          <span className="line-clamp-1">{shop.shopAddress.street}, {shop.shopAddress.city}</span>
        </p>
      )}
      <p className={`text-xs line-clamp-2 flex-grow ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {shop.description || 'Professional repair services with genuine parts and 6-month warranty.'}
      </p>
      {shop.phone && (
        <p className={`text-xs flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FiPhone className="text-emerald-500 flex-shrink-0 w-3 h-3" />
          {shop.phone}
        </p>
      )}
      <hr className={darkMode ? 'border-gray-700 mt-3' : 'border-gray-100 mt-3'} />
      <span className={`mt-auto pt-3 flex items-center justify-start gap-2 text-xs font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
        <FiArrowRight className="w-3.5 h-3.5" /> Visit Shop
      </span>
    </div>
  </motion.div>
));

const ShopTypeSlider = memo(({ shopType, shops, darkMode }) => {
  const sliderRef = useRef(null);
  const scroll = useCallback((dir) => sliderRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' }), []);
  if (!shops.length) return null;
  return (
    <div className="mb-10 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <CategoryTag darkMode={darkMode}>{shopType}</CategoryTag>
          <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {shops.length} {shops.length === 1 ? 'shop' : 'shops'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')} className={`p-1.5 sm:p-2 border transition-colors duration-150 ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-emerald-400 text-emerald-400' : 'bg-white border-gray-200 hover:border-emerald-500 text-emerald-700'}`}>
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')} className={`p-1.5 sm:p-2 border transition-colors duration-150 ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-emerald-400 text-emerald-400' : 'bg-white border-gray-200 hover:border-emerald-500 text-emerald-700'}`}>
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={sliderRef} className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 hide-scrollbar items-stretch">
        {shops.map((s, i) => <ShopStripCard key={s.id} shop={s} darkMode={darkMode} index={i} />)}
      </div>
    </div>
  );
});

const RadioOption = memo(({ value, label, selected, onSelect, icon, darkMode }) => (
  <label className="flex items-center gap-3 cursor-pointer group py-1">
    <div onClick={() => onSelect(value)}
      className={`w-3.5 h-3.5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'border-emerald-500 bg-emerald-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
      }`}>
      {selected && <div className="w-1.5 h-1.5 bg-white" />}
    </div>
    <span onClick={() => onSelect(value)}
      className={`text-sm font-medium flex items-center gap-1.5 truncate ${selected ? 'text-emerald-500' : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
      {icon}{label}
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

const FilterPanel = memo(({
  darkMode, searchTerm, setSearchTerm, sortBy, setSortBy, sortLabels,
  shopTypes, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
  minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly, clearFilters,
  isSortSectionOpen, setIsSortSectionOpen, isShopTypeSectionOpen, setIsShopTypeSectionOpen,
  isCitySectionOpen, setIsCitySectionOpen, isRatingSectionOpen, setIsRatingSectionOpen,
  isVerifiedSectionOpen, setIsVerifiedSectionOpen, activeFiltersCount,
}) => (
  <div className={`${GLASS_STRONG} p-4 sm:p-5`}>
    <div className="flex items-center justify-between mb-1">
      <h3 className={`text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <FiFilter className="w-4 h-4 text-emerald-500" /> Filters
      </h3>
      {activeFiltersCount > 0 && <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold">{activeFiltersCount}</span>}
    </div>

    <div className="relative mt-4">
      <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      <input
        type="text"
        placeholder="Search shops..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`w-full pl-9 pr-8 py-2.5 border text-sm outline-none focus:border-emerald-500 ${
          darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
        }`}
      />
      {searchTerm && (
        <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <FiX className="text-gray-400 w-3.5 h-3.5" />
        </button>
      )}
    </div>

    <FilterSection title="Sort By" isOpen={isSortSectionOpen} onToggle={() => setIsSortSectionOpen(!isSortSectionOpen)} darkMode={darkMode}>
      <div className="space-y-1">
        {Object.entries(sortLabels).map(([value, label]) => (
          <RadioOption key={value} value={value} label={label} selected={sortBy === value} onSelect={setSortBy} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Shop Type" isOpen={isShopTypeSectionOpen} onToggle={() => setIsShopTypeSectionOpen(!isShopTypeSectionOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2">
        {shopTypes.length === 0
          ? <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No types available</p>
          : shopTypes.map((type) => (
            <PillButton key={type} label={type} isActive={selectedShopTypes.includes(type)} onClick={() => toggleShopType(type)} darkMode={darkMode} />
          ))}
      </div>
    </FilterSection>

    {cities.length > 0 && (
      <FilterSection title="City" isOpen={isCitySectionOpen} onToggle={() => setIsCitySectionOpen(!isCitySectionOpen)} darkMode={darkMode}>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <PillButton key={city} label={city} isActive={selectedCities.includes(city)} onClick={() => toggleCity(city)} darkMode={darkMode} />
          ))}
        </div>
      </FilterSection>
    )}

    <FilterSection title="Minimum Rating" isOpen={isRatingSectionOpen} onToggle={() => setIsRatingSectionOpen(!isRatingSectionOpen)} darkMode={darkMode}>
      <div className="space-y-1">
        {[
          { value: 0, label: 'Any rating', icon: null },
          { value: 4, label: '4+ Stars', icon: <RiStarFill className="text-amber-400 w-3.5 h-3.5" /> },
          { value: 4.5, label: '4.5+ Stars', icon: <RiStarFill className="text-amber-400 w-3.5 h-3.5" /> },
          { value: 4.8, label: '4.8+ Stars', icon: <RiStarFill className="text-amber-400 w-3.5 h-3.5" /> },
        ].map((opt) => (
          <RadioOption key={opt.value} value={opt.value} label={opt.label} icon={opt.icon} selected={minRating === opt.value} onSelect={setMinRating} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Verified Only" isOpen={isVerifiedSectionOpen} onToggle={() => setIsVerifiedSectionOpen(!isVerifiedSectionOpen)} darkMode={darkMode}>
      <button
        onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 border transition-colors duration-150 ${
          showVerifiedOnly
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : darkMode ? 'border-gray-700 text-gray-300 hover:border-emerald-500 bg-gray-800/60' : 'border-gray-200 text-gray-600 hover:border-emerald-500 bg-white'
        }`}
      >
        <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 ${showVerifiedOnly ? 'bg-emerald-500 border-emerald-500' : darkMode ? 'border-gray-500' : 'border-gray-300'}`}>
          {showVerifiedOnly && <RiVerifiedBadgeLine className="text-white w-2.5 h-2.5" />}
        </div>
        <span className="text-sm font-semibold">Show only verified shops</span>
        {showVerifiedOnly && <span className="ml-auto text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 font-bold">ON</span>}
      </button>
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

const ShopSkeleton = memo(({ darkMode }) => (
  <div className={`overflow-hidden animate-pulse border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
    <div className={`h-36 sm:h-40 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-100'}`} />
    <div className={`p-4 space-y-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className={`h-4 w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-1/3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
    <div className={`p-4 space-y-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className={`h-3 w-5/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-2/3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
    <div className="p-4">
      <div className={`h-10 w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  </div>
));

const ShopsContent = memo(({ darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedShopTypes, setSelectedShopTypes] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isSortSectionOpen, setIsSortSectionOpen] = useState(true);
  const [isShopTypeSectionOpen, setIsShopTypeSectionOpen] = useState(true);
  const [isCitySectionOpen, setIsCitySectionOpen] = useState(true);
  const [isRatingSectionOpen, setIsRatingSectionOpen] = useState(true);
  const [isVerifiedSectionOpen, setIsVerifiedSectionOpen] = useState(true);

  useEffect(() => { document.title = 'Verified Shops | Tech-Restore'; }, []);

  const qc = useQueryClient();

  const { data: shops = [], isLoading, isFetching } = useQuery({
    queryKey: ['shopsList'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/users/shops/all');
        return res.data.content || res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = useCallback(() => { qc.invalidateQueries({ queryKey: ['shopsList'] }); }, [qc]);

  useEffect(() => { setCurrentPage(1); }, [pageSize]);

  const shopTypes = useMemo(() => [...new Set(shops.map((s) => s.shopType).filter(Boolean))], [shops]);
  const cities = useMemo(() => [...new Set(shops.map((s) => s.shopAddress?.city).filter(Boolean))], [shops]);

  const shopsByType = useMemo(() => {
    const map = {};
    shops.forEach((s) => {
      if (!s.shopType) return;
      if (!map[s.shopType]) map[s.shopType] = [];
      map[s.shopType].push(s);
    });
    return map;
  }, [shops]);

  const typeSections = useMemo(() => (
    shopTypes
      .map((type) => ({ type, shops: (shopsByType[type] || []).slice(0, 10) }))
      .filter((sec) => sec.shops.length > 0)
      .slice(0, 6)
  ), [shopTypes, shopsByType]);

  const filteredShops = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    let filtered = shops.filter((shop) => {
      const matchesSearch =
        shop.name?.toLowerCase().includes(term) ||
        shop.shopAddress?.city?.toLowerCase().includes(term) ||
        shop.shopAddress?.street?.toLowerCase().includes(term) ||
        shop.description?.toLowerCase().includes(term) ||
        shop.shopType?.toLowerCase().includes(term) ||
        shop.phone?.includes(deferredSearch);
      const matchesType = selectedShopTypes.length === 0 || selectedShopTypes.includes(shop.shopType);
      const matchesCity = selectedCities.length === 0 || selectedCities.includes(shop.shopAddress?.city);
      const matchesRating = (shop.rating || 0) >= minRating;
      const matchesVerified = !showVerifiedOnly || shop.verified;
      return matchesSearch && matchesType && matchesCity && matchesRating && matchesVerified;
    });
    if (sortBy === 'ratingHighToLow') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'nameAZ') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return filtered;
  }, [shops, deferredSearch, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, sortBy]);

  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShops.slice(start, start + pageSize);
  }, [filteredShops, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / pageSize));

  const toggleShopType = useCallback((type) => {
    setCurrentPage(1);
    setSelectedShopTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }, []);

  const toggleCity = useCallback((city) => {
    setCurrentPage(1);
    setSelectedCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm(''); setSelectedShopTypes([]); setSelectedCities([]);
    setMinRating(0); setShowVerifiedOnly(false); setSortBy('relevance'); setCurrentPage(1);
  }, []);

  const activeFiltersCount = useMemo(() => [
    searchTerm,
    ...selectedShopTypes,
    ...selectedCities,
    minRating > 0 ? minRating : null,
    showVerifiedOnly ? 'verified' : null,
    sortBy !== 'relevance' ? sortBy : null,
  ].filter(Boolean).length, [searchTerm, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, sortBy]);

  const sortLabels = useMemo(() => ({ relevance: 'Relevance', ratingHighToLow: 'Rating: High to Low', nameAZ: 'Name: A to Z' }), []);

  const heroStats = useMemo(() => [
    { value: '98.9%', label: 'Customer satisfaction' },
    { value: '500+', label: 'Verified shops nationwide' },
    { value: '4.9★', label: 'Average shop rating' },
  ], []);

  const scrollToResults = useCallback(() => { document.getElementById('shop-results')?.scrollIntoView({ behavior: 'smooth' }); }, []);

  const heroButtons = useMemo(() => [
    { label: 'Browse Shops', onClick: scrollToResults, primary: true },
    { label: 'Browse Devices', to: '/devices', primary: false },
  ], [scrollToResults]);

  const hasAnyShops = shops.length > 0;

  const filterPanelProps = {
    darkMode, searchTerm, setSearchTerm, sortBy, setSortBy, sortLabels,
    shopTypes, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly, clearFilters,
    isSortSectionOpen, setIsSortSectionOpen, isShopTypeSectionOpen, setIsShopTypeSectionOpen,
    isCitySectionOpen, setIsCitySectionOpen, isRatingSectionOpen, setIsRatingSectionOpen,
    isVerifiedSectionOpen, setIsVerifiedSectionOpen, activeFiltersCount,
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <Suspense fallback={<HeroSkeleton darkMode={darkMode} />}>
        <Hero
          variant="shop"
          darkMode={darkMode}
          badge="Verified by our team"
          headingLine1="Find trusted"
          headingAccent="shops"
          headingLine2="near you"
          description="Verified repair centers and electronics stores, rated by real customers — search by name, city, or specialty."
          buttons={heroButtons}
          stats={heroStats}
        >
          <div className={`w-full max-w-xl ${GLASS} flex items-center gap-3 px-4 py-3.5`}>
            <FiSearch className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shops by name, city, or specialty..."
              className={`flex-1 outline-none text-sm bg-transparent font-medium placeholder:font-normal ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'}`}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </Hero>
      </Suspense>

      {!isLoading && hasAnyShops && (
        <div className={`py-10 sm:py-16 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
              <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Browse by specialty</span>
              <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight mt-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Find the right expert</h2>
            </div>
            {typeSections.length > 0 ? (
              typeSections.map(({ type, shops: typeShops }) => (
                <ShopTypeSlider key={type} shopType={type} shops={typeShops} darkMode={darkMode} />
              ))
            ) : (
              <EmptyState darkMode={darkMode} compact title="No categories available yet" subtitle="Shop specialties will appear here once shops set up their profiles." />
            )}
          </div>
        </div>
      )}

      <div id="shop-results" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!isLoading && !hasAnyShops ? (
          <EmptyState
            darkMode={darkMode}
            title="No shops available right now"
            subtitle="We're onboarding new shops in your area. Check back soon or refresh to see the latest listings."
            actionLabel={<span className="inline-flex items-center gap-2"><FiRefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh</span>}
            onAction={handleRefresh}
          />
        ) : (
          <div className="flex gap-5 lg:gap-8">
            <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
              <FilterPanel {...filterPanelProps} />
            </aside>

            <div className="flex-1 min-w-0">
              <div className={`${GLASS} flex items-center justify-between mb-6 flex-wrap gap-3 px-4 py-3`}>
                <div className="flex items-center flex-wrap gap-2">
                  <div>
                    <span className={`text-xl sm:text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{filteredShops.length}</span>
                    <span className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>shops found</span>
                  </div>
                  {selectedShopTypes.map((t) => (
                    <span key={t} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                      {t}<button onClick={() => toggleShopType(t)}><FiX className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
                    className={`text-xs font-semibold border px-2 py-1.5 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {[9, 18, 36].map((n) => <option key={n} value={n}>{n} / page</option>)}
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
                <div className={`grid gap-3 sm:gap-5 lg:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {Array.from({ length: 9 }).map((_, i) => <ShopSkeleton key={i} darkMode={darkMode} />)}
                </div>
              ) : filteredShops.length === 0 ? (
                <EmptyState darkMode={darkMode} compact title="No shops match your filters" subtitle="Try adjusting your filters or search terms to see more results." actionLabel="Clear Filters" onAction={clearFilters} />
              ) : (
                <div className={`grid gap-3 sm:gap-5 lg:gap-6 items-start ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {paginatedShops.map((shop, i) => <ShopCard key={shop.id} shop={shop} darkMode={darkMode} index={i} />)}
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
        )}
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className={`absolute left-0 top-0 bottom-0 w-[min(320px,90vw)] overflow-y-auto p-4 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <FilterPanel {...filterPanelProps} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default function Shops(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopsContent {...props} />
    </QueryClientProvider>
  );
}