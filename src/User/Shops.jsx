import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  FiSearch, FiMapPin, FiPhone, FiTruck, FiZap,
  FiFilter, FiUsers, FiSliders, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiX, FiStar,
} from 'react-icons/fi';
import { RiStore2Line, RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';




const WaveBottom = ({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-16 md:h-24" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z"
        fill={darkMode ? '#111827' : '#f9fafb'} />
    </svg>
  </div>
);

const WaveTop = ({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-12 md:h-20" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z"
        fill={darkMode ? '#111827' : '#f9fafb'} />
    </svg>
  </div>
);




const StatCard = ({ icon, value, label, accent, delay, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 28, scale: 0.93 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -5, scale: 1.03 }}
    className={`relative group overflow-hidden rounded-2xl p-5 shadow-xl border transition-all duration-300 ${
      darkMode ? 'bg-gray-800/80 border-gray-700/60 backdrop-blur-md' : 'bg-white/90 border-gray-100 backdrop-blur-md'
    }`}
  >
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
    <div className="flex items-center justify-center flex-wrap gap-3 mb-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
        {icon}
      </div>
      <span className="text-2xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
    </div>
    <p className={`text-xs font-semibold leading-snug pl-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
  </motion.div>
);




const FilterSection = ({ title, isOpen, onToggle, darkMode, children }) => (
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
);




const ShopCard = memo(({ shop, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`group flex flex-col rounded-2xl shadow-md transition-all duration-300 hover:shadow-2xl overflow-hidden cursor-pointer border h-full ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}
  >
    
    
    <div className="relative flex-shrink-0">
      <div className="w-full h-40 sm:h-44 bg-gradient-to-br from-lime-500 via-emerald-500 to-teal-600 flex items-center justify-center text-white text-7xl font-black select-none">
        {shop.name?.charAt(0).toUpperCase() || 'S'}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
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
      <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
        {shop.shopType || 'Electronics Repair'}
      </p>
      {shop.shopAddress && (
        <p className={`text-sm flex items-start gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FiMapPin className="text-lime-500 mt-0.5 flex-shrink-0 w-3.5 h-3.5" />
          <span className="line-clamp-1">{shop.shopAddress.street}, {shop.shopAddress.city}</span>
        </p>
      )}
      <p className={`text-sm line-clamp-2 flex-grow ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {shop.description || 'Professional repair services with genuine parts and 6-month warranty.'}
      </p>
      {shop.phone && (
        <p className={`text-sm flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FiPhone className="text-lime-500 flex-shrink-0 w-3.5 h-3.5" />
          {shop.phone}
        </p>
      )}

     
     
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => (window.location.href = `/shops/${shop.id}`)}
        className="mt-auto relative w-full py-2.5 px-4 rounded-xl font-bold text-sm overflow-hidden
          flex items-center justify-center gap-2 group/btn border-2 border-lime-500
          transition-colors duration-300"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-lime-500 to-emerald-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out rounded-[10px]" />
        <FiTruck className="relative z-10 w-4 h-4 text-lime-500 group-hover/btn:text-white transition-colors duration-300" />
        <span className="relative z-10 text-lime-600 dark:text-lime-400 group-hover/btn:text-white transition-colors duration-300">
          Visit Shop
        </span>
      </motion.button>
    </div>
  </motion.div>
));



const ShopSkeleton = ({ darkMode }) => (
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
);




const Shops = memo(({ darkMode }) => {
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => { document.title = 'Verified Shops | TechBazaar'; }, []);

  const fetchShops = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    try {
      const res = await api.get('/api/users/shops/all', { signal: controller.signal });
      setShops(res.data.content || res.data || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setShops([
          { id: 1, name: 'TechFix Pro', shopType: 'Mobile & Laptop Repair', shopAddress: { street: '123 Main St', city: 'Cairo' }, phone: '+20 123 456 7890', description: 'Professional repair services for all devices with 6-month warranty.', rating: 4.8, verified: true },
          { id: 2, name: 'Gadget Hub', shopType: 'Electronics Store', shopAddress: { street: '456 Nile Ave', city: 'Alexandria' }, phone: '+20 987 654 3210', description: 'New & refurbished phones, tablets, and accessories at best prices.', rating: 4.6, verified: true },
          { id: 3, name: 'Quick Repair', shopType: 'Express Service', shopAddress: { street: '789 Tech Rd', city: 'Giza' }, phone: '+20 555 123 4567', description: 'Same-day repair for screens, batteries, and software issues.', rating: 4.5, verified: false },
          { id: 4, name: 'Smart Solutions', shopType: 'Repair & Sales', shopAddress: { street: '321 Smart St', city: 'Mansoura' }, phone: '+20 101 222 3334', description: 'Full-service electronics repair and genuine parts supplier.', rating: 4.9, verified: true },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const shopTypes = useMemo(() => [...new Set(shops.map(s => s.shopType).filter(Boolean))], [shops]);
  const cities = useMemo(() => [...new Set(shops.map(s => s.shopAddress?.city).filter(Boolean))], [shops]);

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

  const toggleShopType = (type) => {
    setCurrentPage(1);
    setSelectedShopTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  const toggleCity = (city) => {
    setCurrentPage(1);
    setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
  };

  const clearFilters = () => {
    setSearchTerm(''); setSelectedShopTypes([]); setSelectedCities([]);
    setMinRating(0); setShowVerifiedOnly(false); setSortBy('relevance'); setCurrentPage(1);
  };

  const activeFiltersCount = [
    searchTerm,
    ...selectedShopTypes,
    ...selectedCities,
    minRating > 0 ? minRating : null,
    showVerifiedOnly ? 'verified' : null,
    sortBy !== 'relevance' ? sortBy : null,
  ].filter(Boolean).length;

  const sortLabels = { relevance: 'Relevance', ratingHighToLow: 'Rating: High to Low', nameAZ: 'Name: A to Z' };

  
  
  const RadioOption = ({ value, label, selected, onSelect, icon }) => (
    <label className="flex items-center gap-3 cursor-pointer group py-0.5">
      <div
        onClick={() => onSelect(value)}
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          selected ? 'border-lime-500 bg-lime-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
        }`}
      >
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <span
        onClick={() => onSelect(value)}
        className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
          selected ? 'text-lime-500' : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
        }`}
      >
        {icon && icon}
        {label}
      </span>
    </label>
  );

 
  
  const PillButton = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all duration-200 ${
        isActive
          ? 'bg-lime-500 border-lime-500 text-white shadow-sm shadow-lime-200'
          : darkMode
            ? 'border-gray-700 text-gray-300 hover:border-lime-500 hover:text-lime-400 bg-gray-800/60'
            : 'border-gray-200 text-gray-600 hover:border-lime-400 hover:text-lime-600 bg-white'
      }`}
    >
      {label}
    </button>
  );


  
  const SidebarContent = () => (
    <div className="py-6 space-y-5">
     
     
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <FiFilter className="text-lime-500" /> Filters
        </h3>
        {activeFiltersCount > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-lime-500 text-white text-xs font-bold">
            {activeFiltersCount}
          </span>
        )}
      </div>

     
     
      <div className="relative">
        <FiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <input
          type="text"
          placeholder="Search shops..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className={`w-full pl-11 pr-10 py-3 rounded-xl border text-sm ${
            darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
          } focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition`}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gray-600 transition">
            <FiX className="text-gray-400 w-4 h-4" />
          </button>
        )}
      </div>

      
      
      <FilterSection title="Sort By" isOpen={isSortSectionOpen} onToggle={() => setIsSortSectionOpen(!isSortSectionOpen)} darkMode={darkMode}>
        <div className="space-y-2">
          {Object.entries(sortLabels).map(([value, label]) => (
            <RadioOption key={value} value={value} label={label} selected={sortBy === value} onSelect={setSortBy} />
          ))}
        </div>
      </FilterSection>

     
     
      <FilterSection title="Shop Type" isOpen={isShopTypeSectionOpen} onToggle={() => setIsShopTypeSectionOpen(!isShopTypeSectionOpen)} darkMode={darkMode}>
        <div className="flex flex-wrap gap-2">
          {shopTypes.length === 0
            ? <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No types available</p>
            : shopTypes.map(type => (
              <PillButton key={type} label={type} isActive={selectedShopTypes.includes(type)} onClick={() => toggleShopType(type)} />
            ))}
        </div>
      </FilterSection>

      
      
      {cities.length > 0 && (
        <FilterSection title="City" isOpen={isCitySectionOpen} onToggle={() => setIsCitySectionOpen(!isCitySectionOpen)} darkMode={darkMode}>
          <div className="flex flex-wrap gap-2">
            {cities.map(city => (
              <PillButton key={city} label={city} isActive={selectedCities.includes(city)} onClick={() => toggleCity(city)} />
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
            <RadioOption key={opt.value} value={opt.value} label={opt.label} icon={opt.icon} selected={minRating === opt.value} onSelect={setMinRating} />
          ))}
        </div>
      </FilterSection>

      
      
      <FilterSection title="Verified Only" isOpen={isVerifiedSectionOpen} onToggle={() => setIsVerifiedSectionOpen(!isVerifiedSectionOpen)} darkMode={darkMode}>
        <button
          onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
            showVerifiedOnly
              ? 'bg-lime-500/10 border-lime-500 text-lime-600 dark:text-lime-400'
              : darkMode ? 'border-gray-700 text-gray-300 hover:border-lime-500 bg-gray-800/60' : 'border-gray-200 text-gray-600 hover:border-lime-500 bg-white'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            showVerifiedOnly ? 'bg-lime-500 border-lime-500' : darkMode ? 'border-gray-500' : 'border-gray-300'
          }`}>
            {showVerifiedOnly && <RiVerifiedBadgeLine className="text-white w-3 h-3" />}
          </div>
          <span className="text-sm font-semibold">Show only verified shops</span>
          {showVerifiedOnly && (
            <span className="ml-auto text-xs bg-lime-500 text-white px-2 py-0.5 rounded-full font-bold">ON</span>
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
  );

  const heroStats = [
    { icon: <FiZap size={18} />, value: '98.9%', label: 'Customer satisfaction', accent: '#f97316', delay: 0.1 },
    { icon: <FiUsers size={18} />, value: '500+', label: 'Verified shops nationwide', accent: '#6366f1', delay: 0.2 },
    { icon: <RiStarFill size={18} />, value: '4.9★', label: 'Average shop rating', accent: '#f59e0b', delay: 0.3 },
  ];

  
  

  const PaginationButton = ({ children, onClick, disabled, active }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[40px] h-10 sm:min-w-[44px] sm:h-11 px-2 rounded-xl font-bold text-sm transition-all duration-200 border flex items-center justify-center ${
        active
          ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-white border-transparent shadow-lg shadow-lime-500/30 scale-105'
          : disabled
            ? 'opacity-40 cursor-not-allowed ' + (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-400')
            : darkMode
              ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-lime-500'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-lime-50 hover:border-lime-300'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>

     
     

      <section className={`relative overflow-hidden pt-20 pb-32 md:pt-24 md:pb-40 ${
        darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-lime-50 via-white to-emerald-50'
      }`}>
        <div className="absolute w-[500px] h-[500px] -top-40 -left-32 rounded-full blur-3xl opacity-20 bg-lime-400 animate-pulse pointer-events-none" style={{ animationDuration: '5s' }} />
        <div className="absolute w-[400px] h-[400px] top-10 -right-20 rounded-full blur-3xl opacity-15 bg-emerald-500 animate-pulse pointer-events-none" style={{ animationDuration: '7s' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,#000 39px,#000 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#000 39px,#000 40px)' }} />
        <WaveTop darkMode={darkMode} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400"
              >
                <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
                Verified by our team
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl  sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08]"
              >
                <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">Find Trusted</span>
                <br />
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Shops Near</span>
                <br />
                <span style={{ WebkitTextStroke: darkMode ? '2px #84cc16' : '2px #16a34a', color: 'transparent' }}>You</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className={`text-base sm:text-xl md:text-2xl leading-relaxed max-w-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Verified repair centers and electronics stores near you. Fast, reliable, and rated by real customers.
              </motion.p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 pt-1 sm:pt-2">
                {heroStats.map(s => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
              </div>
            </div>

            
            

            <div className="relative h-96 lg:h-[580px]">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-125" />
              <div className="relative w-full h-full">
                <motion.div
                  initial={{ opacity: 0, rotate: 8, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 4, scale: 1.04 }}
                  className={`absolute top-10 left-10 w-48 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
                  <div className="p-4 space-y-3">
                    <div className={`h-3 rounded w-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-3 rounded w-32 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className="h-8 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-xl w-16" />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, rotate: -4, y: 20 }} animate={{ opacity: 1, rotate: -6, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.35 }} whileHover={{ rotate: -2, scale: 1.04 }}
                  className={`absolute bottom-10 right-10 w-56 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="h-1 bg-gradient-to-r from-indigo-400 to-purple-500" />
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className={`h-4 rounded w-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <RiStarFill key={i} className={i < 4 ? 'text-amber-400 w-4 h-4' : 'text-gray-300 w-4 h-4'} />
                      ))}
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.07, y: -4 }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-40 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="h-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
                  <div className="p-4">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <RiStore2Line className="text-lime-400 text-3xl" />
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-xs font-bold text-lime-500">Verified ✓</span>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-1/4 right-4 z-20 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-xl"
                >
                  🏪 500+ Shops
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <WaveBottom darkMode={darkMode} />
      </section>

     
     
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex gap-6 lg:gap-8">

          
          
          <aside className={`hidden lg:block w-72 xl:w-64 flex-shrink-0 sticky top-20 self-start h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border shadow-lg ${
            darkMode ? 'bg-gray-800/60 border-gray-700 backdrop-blur-md' : 'bg-white border-gray-200'
          }`}>
            <div className="px-5">
              <SidebarContent />
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
                  <span key={t} className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 text-lime-600 dark:text-lime-400 text-xs font-semibold border border-lime-500/30">
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
                    ? 'border-lime-500 bg-lime-500/10 text-lime-600 dark:text-lime-400'
                    : darkMode ? 'bg-gray-800 border-gray-700 text-white hover:border-lime-500' : 'bg-white border-gray-200 text-gray-700 hover:border-lime-400'
                }`}
              >
                <FiSliders className="w-4 h-4 text-lime-500" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-lime-500 text-white text-xs font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </motion.button>
            </div>

            
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(9)].map((_, i) => <ShopSkeleton key={i} darkMode={darkMode} />)}
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
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-white font-bold transition-all shadow-md hover:shadow-lg"
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                {paginatedShops.map(shop => <ShopCard key={shop.id} shop={shop} darkMode={darkMode} />)}
              </div>
            )}

            
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-10 sm:mt-14 gap-1.5 sm:gap-2 flex-wrap">
                <PaginationButton onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <FiChevronLeft className="w-4 h-4" />
                </PaginationButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationButton key={page} onClick={() => setCurrentPage(page)} active={currentPage === page}>
                    {page}
                  </PaginationButton>
                ))}
                <PaginationButton onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
              <div className={`flex items-center justify-between p-4 sm:p-5 border-b sticky top-0 z-10 ${
                darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
              }`}>
                <span className={`text-base sm:text-lg font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FiFilter className="text-lime-500" /> Filters
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-lime-500 text-white text-xs font-bold">{activeFiltersCount}</span>
                  )}
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={`p-2 rounded-xl transition ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 sm:px-5">
                <SidebarContent />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

Shops.displayName = 'Shops';
export default Shops;