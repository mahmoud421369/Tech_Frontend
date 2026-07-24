import React, { useState, useEffect, useCallback, useMemo, memo, useTransition, startTransition } from 'react';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiMapPin, FiPhone, FiTruck,
  FiFilter, FiSliders, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiX,
  FiShield, FiClock, FiThumbsUp, FiArrowRight,
} from 'react-icons/fi';
import { RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import Hero from '../components/Hero';

const queryClient = new QueryClient();

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.05,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
};

const hoverScale = {
  y: -5,
  scale: 1.02,
  transition: { duration: 0.2, ease: "easeOut" }
};

const ShopBannerIllustration = memo(({ initial }) => (
  <svg viewBox="0 0 200 140" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id={`glow-${initial}`} cx="50%" cy="35%" r="70%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>
    <rect width="200" height="140" fill={`url(#glow-${initial})`} />
    <circle cx="30" cy="115" r="46" fill="rgba(255,255,255,0.08)" />
    <circle cx="178" cy="20" r="30" fill="rgba(255,255,255,0.08)" />
    <g transform="translate(70,28)">
      <rect x="0" y="0" width="44" height="70" rx="8" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      <rect x="7" y="9" width="30" height="46" rx="2" fill="rgba(255,255,255,0.35)" />
      <circle cx="22" cy="61" r="3" fill="rgba(255,255,255,0.6)" />
    </g>
    <g transform="translate(104,44) rotate(28)">
      <rect x="-4" y="-24" width="8" height="34" rx="3" fill="#ffffff" fillOpacity="0.85" />
      <circle cx="0" cy="-24" r="10" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="5" />
      <circle cx="0" cy="-24" r="10" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="5" strokeDasharray="6 100" />
    </g>
    <g transform="translate(120,80)">
      <path d="M0 10 L8 -8 L4 -8 L12 -26 L2 -6 L6 -6 Z" fill="#fde68a" fillOpacity="0.9" />
    </g>
    <circle cx="140" cy="100" r="3" fill="rgba(255,255,255,0.6)" />
    <circle cx="150" cy="92" r="2" fill="rgba(255,255,255,0.5)" />
    <circle cx="46" cy="30" r="2.5" fill="rgba(255,255,255,0.5)" />
  </svg>
));

const CategoryBadge = memo(({ darkMode, children }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
    darkMode ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/30' : 'bg-emerald-400 text-white ring-1 ring-inset ring-emerald-500/25'
  }`}>
    <span className="w-1.5 h-1.5 rounded-full bg-white" />
    {children}
  </span>
));

const FilterSection = memo(({ title, isOpen, onToggle, darkMode, children }) => (
  <div className={`border-b pb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
    <button
      onClick={onToggle}
      className={`w-full flex justify-between items-center text-base font-bold py-1 ${
        darkMode ? 'text-gray-100' : 'text-gray-800'
      }`}
    >
      {title}
      <FiChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`} />
    </button>
    <motion.div
      initial={false}
      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="pt-3">{children}</div>
    </motion.div>
  </div>
));

const ShopCard = memo(({ shop, darkMode, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    whileHover={hoverScale}
    className={`group flex flex-col rounded-md shadow-md transition-all duration-300 hover:shadow-2xl overflow-hidden cursor-pointer border h-full ${
      darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200'
    }`}
  >
    <div className="relative flex-shrink-0">
      <div className="relative w-full h-40 sm:h-44 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 overflow-hidden">
        <ShopBannerIllustration initial={shop.id} />
        <span className="absolute bottom-3 right-3 w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/40 flex items-center justify-center text-white text-lg font-black select-none">
          {shop.name?.charAt(0).toUpperCase() || 'S'}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
      {shop.verified && (
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
          <RiVerifiedBadgeLine className="w-3.5 h-3.5" /> Verified
        </span>
      )}
      <span className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
        <RiStarFill className="text-amber-400 w-3.5 h-3.5" />
        {shop.rating?.toFixed(1) || '4.8'}
      </span>
    </div>

    <div className="flex flex-col flex-grow p-4 gap-2">
      <h3 className={`font-bold text-base sm:text-lg line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {shop.name || 'Unnamed Shop'}
      </h3>
      <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
        {shop.shopType || 'Electronics Repair'}
      </p>
      {shop.shopAddress && (
        <p className={`text-sm flex items-start gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FiMapPin className="text-emerald-500 mt-0.5 flex-shrink-0 w-3.5 h-3.5" />
          <span className="line-clamp-1">{shop.shopAddress.street}, {shop.shopAddress.city}</span>
        </p>
      )}
      <p className={`text-sm line-clamp-2 flex-grow ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {shop.description || 'Professional repair services with genuine parts and 6-month warranty.'}
      </p>
      {shop.phone && (
        <p className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FiPhone className="text-emerald-500 flex-shrink-0 w-3.5 h-3.5" />
          {shop.phone}
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => (window.location.href = `/shops/${shop.id}`)}
        className="mt-auto relative w-full py-2.5 px-4 rounded-xl font-bold text-sm overflow-hidden
          flex items-center justify-center gap-2 group/btn border-2 border-emerald-500
          transition-colors duration-300"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out rounded-[10px]" />
        <FiTruck className="relative z-10 w-4 h-4 text-emerald-500 group-hover/btn:text-white transition-colors duration-300" />
        <span className="relative z-10 text-emerald-600 dark:text-emerald-400 group-hover/btn:text-white transition-colors duration-300">
          Visit Shop
        </span>
      </motion.button>
    </div>
  </motion.div>
));

const ShopStripCard = memo(({ shop, darkMode, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "60px" }}
    whileHover={{ y: -4 }}
    onClick={() => (window.location.href = `/shops/${shop.id}`)}
    className={`relative flex-shrink-0 w-[260px] sm:w-[300px] flex flex-col rounded-lg overflow-hidden cursor-pointer snap-start border shadow-md ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}
  >
    <div className="relative h-28 sm:h-32 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 overflow-hidden flex-shrink-0">
      <ShopBannerIllustration initial={`strip-${shop.id}`} />
      <span className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm ring-1 ring-white/40 flex items-center justify-center text-white text-sm font-black select-none">
        {shop.name?.charAt(0).toUpperCase() || 'S'}
      </span>
      {shop.verified && (
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          <RiVerifiedBadgeLine className="w-3 h-3" /> Verified
        </span>
      )}
      <span className="absolute top-2 right-2 flex items-center gap-1 bg-black/45 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        <RiStarFill className="text-amber-400 w-3 h-3" />
        {shop.rating?.toFixed(1) || '4.8'}
      </span>
    </div>

    <div className="flex flex-col flex-grow p-3.5 gap-1.5">
      <h4 className={`font-bold text-sm line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {shop.name || 'Unnamed Shop'}
      </h4>
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
      <hr className="border border-gray-200 mt-3  dark:border-gray-800" />
      <span className={`mt-auto p-3 flex items-center justify-start  gap-2   rounded-lg  text-xs font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>
      <FiArrowRight className='w-3.5 h-3.5'/>  Visit Shop 
      </span>
    </div>
  </motion.div>
));

const ShopTypeSlider = memo(({ shopType, shops, darkMode }) => {
  const sliderRef = React.useRef(null);
  if (!shops.length) return null;
  const scroll = (dir) => sliderRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  return (
    <div className="mb-10 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <CategoryBadge darkMode={darkMode}>{shopType}</CategoryBadge>
          <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {shops.length} {shops.length === 1 ? 'shop' : 'shops'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')}
            className={`p-1.5 sm:p-2 rounded-full ring-1 transition-all duration-150 ${
              darkMode ? 'bg-gray-800 ring-white/10 hover:bg-emerald-900/40 text-emerald-400' : 'bg-white ring-black/5 hover:bg-emerald-50 text-emerald-700 shadow-sm'
            }`}>
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')}
            className={`p-1.5 sm:p-2 rounded-full ring-1 transition-all duration-150 ${
              darkMode ? 'bg-gray-800 ring-white/10 hover:bg-emerald-900/40 text-emerald-400' : 'bg-white ring-black/5 hover:bg-emerald-50 text-emerald-700 shadow-sm'
            }`}>
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

const ShieldIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <path d="M32 4 L54 12 V30 C54 45 44 55 32 60 C20 55 10 45 10 30 V12 Z" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M32 10 L48 16 V30 C48 41.5 40.5 49.5 32 53.5 C23.5 49.5 16 41.5 16 30 V16 Z" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.5" />
    <path d="M23 30 L29 36 L42 22" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="10" r="3" fill={darkMode ? '#6ee7b7' : '#34d399'} />
    <circle cx="9" cy="46" r="2.2" fill={darkMode ? '#6ee7b7' : '#34d399'} />
  </svg>
));

const RatingIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(251,191,36,0.14)' : 'rgba(245,158,11,0.12)'} />
    <path d="M32 14 L37 25.5 L49.5 27 L40.5 35 L43 47.5 L32 41 L21 47.5 L23.5 35 L14.5 27 L27 25.5 Z" fill="#f59e0b" />
    <circle cx="50" cy="16" r="2.4" fill="#fbbf24" />
    <circle cx="12" cy="20" r="1.8" fill="#fbbf24" />
    <circle cx="14" cy="46" r="2" fill="#fbbf24" />
  </svg>
));

const ClockIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="30" cy="34" r="24" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <circle cx="30" cy="34" r="18" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.5" />
    <path d="M30 24 V34 L38 39" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M44 12 L48 6 L52 12 L47 12 Z" fill="#fbbf24" />
    <rect x="24" y="4" width="12" height="4" rx="2" fill={darkMode ? '#34d399' : '#10b981'} />
  </svg>
));

const ThumbsIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M22 30 H16 V50 H22 Z" fill={darkMode ? '#34d399' : '#10b981'} />
    <path d="M24 30 L30 14 C31.5 12 34.5 12.5 34.5 15.5 L33.5 24 H44 C46.5 24 48 26.5 47 28.5 L42 46 C41.3 47.5 39.8 48.5 38 48.5 H24 V30 Z" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.6" strokeLinejoin="round" />
    <circle cx="48" cy="14" r="2.2" fill="#fbbf24" />
  </svg>
));




const RadioOption = memo(({ value, label, selected, onSelect, icon, darkMode }) => (
  <label className="flex items-center gap-3 cursor-pointer group py-0.5">
    <div
      onClick={() => onSelect(value)}
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
        selected ? 'border-emerald-500 bg-emerald-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
      }`}
    >
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
    <span
      onClick={() => onSelect(value)}
      className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
        selected ? 'text-emerald-500' : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
      }`}
    >
      {icon && icon}
      {label}
    </span>
  </label>
));

const PillButton = memo(({ label, isActive, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all duration-200 ${
      isActive
        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200'
        : darkMode
          ? 'border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-400 bg-gray-800/60'
          : 'border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600 bg-white'
    }`}
  >
    {label}
  </button>
));

const SidebarContent = memo(({ 
  darkMode, searchTerm, setSearchTerm, setCurrentPage, sortBy, setSortBy, sortLabels,
  shopTypes, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
  minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly, clearFilters,
  isSortSectionOpen, setIsSortSectionOpen, isShopTypeSectionOpen, setIsShopTypeSectionOpen,
  isCitySectionOpen, setIsCitySectionOpen, isRatingSectionOpen, setIsRatingSectionOpen,
  isVerifiedSectionOpen, setIsVerifiedSectionOpen, activeFiltersCount
}) => (
  <div className="py-6 space-y-5">
    <div className="flex items-center justify-between">
      <h3 className={`text-xl font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <FiFilter className="text-emerald-500" /> Filters
      </h3>
      {activeFiltersCount > 0 && (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
          {activeFiltersCount}
        </span>
      )}
    </div>

    <div className="relative ">
      <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      <input
        type="text"
        placeholder="Search shops..."
        value={searchTerm}
        onChange={(e) => { startTransition(() => { setSearchTerm(e.target.value); setCurrentPage(1); }); }}
        className={`w-full pl-11 pr-10 py-3 rounded-xl border text-sm ${
          darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
        } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
      />
      {searchTerm && (
        <button onClick={() => startTransition(() => setSearchTerm(''))} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-600 transition">
          <FiX className="text-gray-400 w-4 h-4" />
        </button>
      )}
    </div>

    <FilterSection title="Sort By" isOpen={isSortSectionOpen} onToggle={() => setIsSortSectionOpen(!isSortSectionOpen)} darkMode={darkMode}>
      <div className="space-y-2">
        {Object.entries(sortLabels).map(([value, label]) => (
          <RadioOption key={value} value={value} label={label} selected={sortBy === value} onSelect={(val) => startTransition(() => setSortBy(val))} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Shop Type" isOpen={isShopTypeSectionOpen} onToggle={() => setIsShopTypeSectionOpen(!isShopTypeSectionOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2">
        {shopTypes.length === 0
          ? <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No types available</p>
          : shopTypes.map(type => (
            <PillButton key={type} label={type} isActive={selectedShopTypes.includes(type)} onClick={() => toggleShopType(type)} darkMode={darkMode} />
          ))}
      </div>
    </FilterSection>

    {cities.length > 0 && (
      <FilterSection title="City" isOpen={isCitySectionOpen} onToggle={() => setIsCitySectionOpen(!isCitySectionOpen)} darkMode={darkMode}>
        <div className="flex flex-wrap gap-2">
          {cities.map(city => (
            <PillButton key={city} label={city} isActive={selectedCities.includes(city)} onClick={() => toggleCity(city)} darkMode={darkMode} />
          ))}
        </div>
      </FilterSection>
    )}

    <FilterSection title="Minimum Rating" isOpen={isRatingSectionOpen} onToggle={() => setIsRatingSectionOpen(!isRatingSectionOpen)} darkMode={darkMode}>
      <div className="space-y-2">
        {[
          { value: 0, label: 'Any rating', icon: null },
          { value: 4, label: '4+ Stars', icon: <RiStarFill className="text-amber-400 w-3.5 h-3.5" /> },
          { value: 4.5, label: '4.5+ Stars', icon: <RiStarFill className="text-amber-400 w-3.5 h-3.5" /> },
          { value: 4.8, label: '4.8+ Stars', icon: <RiStarFill className="text-amber-400 w-3.5 h-3.5" /> },
        ].map(opt => (
          <RadioOption key={opt.value} value={opt.value} label={opt.label} icon={opt.icon} selected={minRating === opt.value} onSelect={(val) => startTransition(() => setMinRating(val))} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Verified Only" isOpen={isVerifiedSectionOpen} onToggle={() => setIsVerifiedSectionOpen(!isVerifiedSectionOpen)} darkMode={darkMode}>
      <button
        onClick={() => startTransition(() => setShowVerifiedOnly(!showVerifiedOnly))}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
          showVerifiedOnly
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : darkMode ? 'border-gray-700 text-gray-300 hover:border-emerald-500 bg-gray-800/60' : 'border-gray-200 text-gray-600 hover:border-emerald-500 bg-white'
        }`}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          showVerifiedOnly ? 'bg-emerald-500 border-emerald-500' : darkMode ? 'border-gray-500' : 'border-gray-300'
        }`}>
          {showVerifiedOnly && <RiVerifiedBadgeLine className="text-white w-3 h-3" />}
        </div>
        <span className="text-sm font-semibold">Show only verified shops</span>
        {showVerifiedOnly && (
          <span className="ml-auto text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">ON</span>
        )}
      </button>
    </FilterSection>

    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={clearFilters}
      className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600
        text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
    >
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
        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30 scale-105'
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

const ShopsContent = ({ darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  const pageSize = 9;

  useEffect(() => { document.title = 'Verified Shops | Tech-Restore'; }, []);

  const [isPending, startTransition] = useTransition();

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['shopsList'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/users/shops/all');
        return res.data.content || res.data || [];
      } catch (err) {
        return [
          { id: 1, name: 'TechFix Pro', shopType: 'Mobile & Laptop Repair', shopAddress: { street: '123 Main St', city: 'Cairo' }, phone: '+20 123 456 7890', description: 'Professional repair services for all devices with 6-month warranty.', rating: 4.8, verified: true },
          { id: 2, name: 'Gadget Hub', shopType: 'Electronics Store', shopAddress: { street: '456 Nile Ave', city: 'Alexandria' }, phone: '+20 987 654 3210', description: 'New & refurbished phones, tablets, and accessories at best prices.', rating: 4.6, verified: true },
          { id: 3, name: 'Quick Repair', shopType: 'Express Service', shopAddress: { street: '789 Tech Rd', city: 'Giza' }, phone: '+20 555 123 4567', description: 'Same-day repair for screens, batteries, and software issues.', rating: 4.5, verified: false },
          { id: 4, name: 'Smart Solutions', shopType: 'Repair & Sales', shopAddress: { street: '321 Smart St', city: 'Mansoura' }, phone: '+20 101 222 3334', description: 'Full-service electronics repair and genuine parts supplier.', rating: 4.9, verified: true },
        ];
      }
    },
    staleTime: 5 * 60 * 1000
  });

  const shopTypes = useMemo(() => [...new Set(shops.map(s => s.shopType).filter(Boolean))], [shops]);
  const cities = useMemo(() => [...new Set(shops.map(s => s.shopAddress?.city).filter(Boolean))], [shops]);

  const shopsByType = useMemo(() => {
    const map = {};
    shops.forEach((s) => {
      const type = s.shopType;
      if (!type) return;
      if (!map[type]) map[type] = [];
      map[type].push(s);
    });
    return map;
  }, [shops]);

  const shopsByCity = useMemo(() => {
    const map = {};
    shops.forEach((s) => {
      const city = s.shopAddress?.city;
      if (!city) return;
      if (!map[city]) map[city] = [];
      map[city].push(s);
    });
    return map;
  }, [shops]);

  const typeSections = useMemo(() =>
    shopTypes
      .map((type) => ({ type, shops: (shopsByType[type] || []).slice(0, 10) }))
      .filter((sec) => sec.shops.length > 0)
      .slice(0, 6),
    [shopTypes, shopsByType]
  );

  const filteredShops = useMemo(() => {
    let filtered = shops.filter(shop => {
      const lowerTerm = searchTerm.toLowerCase();
      const matchesSearch =
        shop.name?.toLowerCase().includes(lowerTerm) ||
        shop.shopAddress?.city?.toLowerCase().includes(lowerTerm) ||
        shop.shopAddress?.street?.toLowerCase().includes(lowerTerm) ||
        shop.description?.toLowerCase().includes(lowerTerm) ||
        shop.shopType?.toLowerCase().includes(lowerTerm) ||
        shop.phone?.includes(searchTerm);
      const matchesType = selectedShopTypes.length === 0 || selectedShopTypes.includes(shop.shopType);
      const matchesCity = selectedCities.length === 0 || selectedCities.includes(shop.shopAddress?.city);
      const matchesRating = (shop.rating || 0) >= minRating;
      const matchesVerified = !showVerifiedOnly || shop.verified;
      return matchesSearch && matchesType && matchesCity && matchesRating && matchesVerified;
    });
    if (sortBy === 'ratingHighToLow') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'nameAZ') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return filtered;
  }, [shops, searchTerm, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, sortBy]);

  const paginatedShops = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShops.slice(start, start + pageSize);
  }, [filteredShops, currentPage]);

  const totalPages = Math.ceil(filteredShops.length / pageSize);

  const toggleShopType = useCallback((type) => {
    startTransition(() => {
      setCurrentPage(1);
      setSelectedShopTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    });
  }, []);
  
  const toggleCity = useCallback((city) => {
    startTransition(() => {
      setCurrentPage(1);
      setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
    });
  }, []);

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearchTerm(''); setSelectedShopTypes([]); setSelectedCities([]);
      setMinRating(0); setShowVerifiedOnly(false); setSortBy('relevance'); setCurrentPage(1);
    });
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

  const scrollToResults = useCallback(() => {
    document.getElementById('shop-results')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const heroButtons = useMemo(() => [
    { label: 'Browse Shops', onClick: scrollToResults, primary: true },
    { label: 'Browse Devices', to: '/devices', primary: false },
  ], [scrollToResults]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
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
        <div className="relative w-full border rounded-2xl dark:border-gray-800 max-w-xl">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-200 shadow-lg ${
            darkMode ? 'border-white/15 bg-white/5' : ' bg-white'
          }`}>
            <FiSearch className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => startTransition(() => { setSearchTerm(e.target.value); setCurrentPage(1); })}
              placeholder="Search shops by name, city, or specialty..."
              className={`flex-1 outline-none text-sm bg-transparent font-medium placeholder:font-normal ${
                darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'
              }`}
            />
            {searchTerm && (
              <button onClick={() => startTransition(() => setSearchTerm(''))} className={`p-0.5 rounded-full ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Hero>

      

      {!isLoading && typeSections.length > 0 && (
        <div className={`py-10 sm:py-16 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
              <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Browse by specialty
              </span>
              <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight mt-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Find the right expert
              </h2>
            </div>
            {typeSections.map(({ type, shops: typeShops }) => (
              <ShopTypeSlider key={type} shopType={type} shops={typeShops} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}

      

      <div id="shop-results" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex gap-6 lg:gap-8">
          <aside className={`hidden lg:block w-72 xl:w-64 flex-shrink-0 sticky top-20 self-start h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border shadow-lg ${
            darkMode ? 'bg-gray-800/60 border-gray-700 backdrop-blur-md' : 'bg-white border-gray-200'
          }`}>
            <div className="px-5">
              <SidebarContent 
                darkMode={darkMode} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                setCurrentPage={setCurrentPage} sortBy={sortBy} setSortBy={setSortBy}
                sortLabels={sortLabels} shopTypes={shopTypes} selectedShopTypes={selectedShopTypes}
                toggleShopType={toggleShopType} cities={cities} selectedCities={selectedCities}
                toggleCity={toggleCity} minRating={minRating} setMinRating={setMinRating}
                showVerifiedOnly={showVerifiedOnly} setShowVerifiedOnly={setShowVerifiedOnly}
                clearFilters={clearFilters} isSortSectionOpen={isSortSectionOpen}
                setIsSortSectionOpen={setIsSortSectionOpen} isShopTypeSectionOpen={isShopTypeSectionOpen}
                setIsShopTypeSectionOpen={setIsShopTypeSectionOpen} isCitySectionOpen={isCitySectionOpen}
                setIsCitySectionOpen={setIsCitySectionOpen} isRatingSectionOpen={isRatingSectionOpen}
                setIsRatingSectionOpen={setIsRatingSectionOpen} isVerifiedSectionOpen={isVerifiedSectionOpen}
                setIsVerifiedSectionOpen={setIsVerifiedSectionOpen} activeFiltersCount={activeFiltersCount}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
              <div className="flex items-center flex-wrap gap-2">
                <div>
                  <span className={`text-xl sm:text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {filteredShops.length}
                  </span>
                  <span className={`ml-2 text-sm sm:text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    shops found
                  </span>
                </div>
                {selectedShopTypes.map(t => (
                  <span key={t} className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    {t}
                    <button onClick={() => toggleShopType(t)} className="hover:text-red-400 transition">
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`lg:hidden flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all shadow-sm hover:shadow-md ${
                  activeFiltersCount > 0
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : darkMode ? 'bg-gray-800 border-gray-700 text-white hover:border-emerald-500' : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400'
                }`}
              >
                <FiSliders className="w-4 h-4 text-emerald-500" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </motion.button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 9 }).map((_, i) => <ShopSkeleton key={i} darkMode={darkMode} />)}
              </div>
            ) : filteredShops.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24 sm:py-32">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <FiMapPin className="text-3xl sm:text-4xl text-gray-400" />
                </div>
                <p className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>No shops found</p>
                <p className={`text-sm sm:text-base mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your filters or search terms</p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={clearFilters}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold transition-all shadow-md hover:shadow-lg"
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                {paginatedShops.map((shop, i) => <ShopCard key={shop.id} shop={shop} darkMode={darkMode} index={i} />)}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-10 sm:mt-14 gap-1.5 sm:gap-2 flex-wrap">
                <PaginationButton onClick={() => startTransition(() => setCurrentPage(p => Math.max(1, p - 1)))} disabled={currentPage === 1} darkMode={darkMode}>
                  <FiChevronLeft className="w-4 h-4" />
                </PaginationButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationButton key={page} onClick={() => startTransition(() => setCurrentPage(page))} active={currentPage === page} darkMode={darkMode}>
                    {page}
                  </PaginationButton>
                ))}
                <PaginationButton onClick={() => startTransition(() => setCurrentPage(p => Math.min(totalPages, p + 1)))} disabled={currentPage === totalPages} darkMode={darkMode}>
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
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`absolute left-0 top-0 bottom-0 w-[min(320px,90vw)] shadow-2xl overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            >
             
              <div className="px-4 sm:px-5">
                <SidebarContent 
                  darkMode={darkMode} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  setCurrentPage={setCurrentPage} sortBy={sortBy} setSortBy={setSortBy}
                  sortLabels={sortLabels} shopTypes={shopTypes} selectedShopTypes={selectedShopTypes}
                  toggleShopType={toggleShopType} cities={cities} selectedCities={selectedCities}
                  toggleCity={toggleCity} minRating={minRating} setMinRating={setMinRating}
                  showVerifiedOnly={showVerifiedOnly} setShowVerifiedOnly={setShowVerifiedOnly}
                  clearFilters={clearFilters} isSortSectionOpen={isSortSectionOpen}
                  setIsSortSectionOpen={setIsSortSectionOpen} isShopTypeSectionOpen={isShopTypeSectionOpen}
                  setIsShopTypeSectionOpen={setIsShopTypeSectionOpen} isCitySectionOpen={isCitySectionOpen}
                  setIsCitySectionOpen={setIsCitySectionOpen} isRatingSectionOpen={isRatingSectionOpen}
                  setIsRatingSectionOpen={setIsRatingSectionOpen} isVerifiedSectionOpen={isVerifiedSectionOpen}
                  setIsVerifiedSectionOpen={setIsVerifiedSectionOpen} activeFiltersCount={activeFiltersCount}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShopSkeleton = memo(({ darkMode }) => (
  <div className={`rounded-2xl overflow-hidden animate-pulse shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
    <div className={`h-40 sm:h-44 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    <div className="p-4 space-y-3">
      <div className={`h-4 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 rounded w-1/2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 rounded w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 rounded w-5/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-10 rounded-xl w-full mt-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  </div>
));

export default function Shops(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopsContent {...props} />
    </QueryClientProvider>
  );
}