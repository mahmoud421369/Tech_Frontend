import React, { useState, useRef, useEffect, useCallback, memo, useMemo, Suspense, useTransition, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
   FiStar, FiTool, FiMonitor, FiTag, FiDollarSign,
   FiShield, FiCheckCircle, FiShoppingCart,
   FiChevronLeft, FiChevronRight, FiMapPin, FiPhone, FiTruck, FiEye,
   FiArrowRight, FiSearch, FiX, FiHeart,
   FiInfo, FiZap,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/style.css';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { Hero } from '../components';
import {
   RiBattery2ChargeLine, RiCamera2Line, RiCheckFill, RiCheckLine,
   RiDeviceLine, RiHeadphoneLine, RiPriceTagLine, RiSettings3Line,
   RiShieldCheckLine, RiStarFill, RiVerifiedBadgeLine, RiWaterFlashLine,
   RiStoreLine, RiRecycleLine, RiFlashlightLine,
} from 'react-icons/ri';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const Service = lazy(() => import('./Service'));
const OffersSlider = lazy(() => import('../components').then(module => ({ default: module.OffersSlider })));

const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         refetchOnWindowFocus: false,
         retry: false,
      },
   },
});

const CDN_BASE = 'https://cdn.tech-restore.com';

const resolveAsset = (path) => {
   if (!path) return `${CDN_BASE}/assets/products/placeholder.webp`;
   if (path.startsWith('http') || path.startsWith('data:')) return path;
   return `${CDN_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

const SkeletonScreen = ({ darkMode }) => (
   <div className={`w-full py-12 px-4 animate-pulse flex flex-col items-center gap-6 ${darkMode ? 'bg-gray-950' : 'bg-emerald-50/40'}`}>
      <div className={`h-8 sm:h-12 w-64 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-emerald-100'}`} />
      <div className={`h-48 sm:h-64 w-full max-w-6xl rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-emerald-100'}`} />
   </div>
);

const cardVariants = {
   hidden: { opacity: 0, y: 24 },
   visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
         delay: i * 0.05,
         duration: 0.5,
         ease: [0.25, 0.46, 0.45, 0.94]
      }
   })
};

const hoverScale = {
   y: -6,
   transition: { duration: 0.2, ease: "easeOut" }
};

const EASE = [0.16, 1, 0.3, 1];

const Stage3DStyles = memo(() => (
   <style>{`
      @keyframes heroStageTilt { 0%, 100% { transform: rotateX(8deg) rotateY(-12deg) rotateZ(0deg); } 50% { transform: rotateX(3deg) rotateY(-5deg) rotateZ(0.5deg); } }
      @keyframes heroStageChip { 0%, 100% { transform: translateZ(var(--tz, 70px)) translateY(0px); } 50% { transform: translateZ(var(--tz, 70px)) translateY(-8px); } }
      @keyframes heroStageRing { from { transform: translateZ(-30px) rotate(0deg); } to { transform: translateZ(-30px) rotate(360deg); } }
      .hero-stage-tilt { animation: heroStageTilt 8s ease-in-out infinite; }
      .hero-stage-chip { animation: heroStageChip 4.2s ease-in-out infinite; }
      .hero-stage-ring { animation: heroStageRing 14s linear infinite; }
   `}</style>
));

const BrandMark = memo(({ darkMode }) => (
   <motion.div
      initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16"
   >
      <svg viewBox="0 0 100 100" className="w-full h-full">
         <defs>
            <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#34d399" />
               <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
         </defs>
         <motion.circle
            cx="50" cy="50" r="46" fill="url(#brandGrad)"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
         />
         <path d="M38 26 L38 74 M62 26 L62 74" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity="0.95" />
         <motion.path
            d="M30 50 L46 50"
            stroke="#ffffff" strokeWidth="7" strokeLinecap="round"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
         />
      </svg>
   </motion.div>
));

const HeroIllustrationCore = memo(({ darkMode }) => {
   const stroke = darkMode ? '#6ee7b7' : '#ffffff';
   const soft = darkMode ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.18)';
   const accent = '#fbbf24';

   return (
      <svg viewBox="0 0 480 220" className="w-full h-full">
         <motion.circle cx="240" cy="112" r="96" fill={soft}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} />

         <motion.circle cx="240" cy="112" r="130" fill="none" stroke={soft} strokeWidth="1.5" strokeDasharray="2 10"
            animate={{ rotate: 360 }} style={{ transformOrigin: '240px 112px' }}
            transition={{ duration: 26, repeat: Infinity, ease: 'linear' }} />

         <motion.g
            animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '206px 112px' }}
         >
            <rect x="176" y="60" width="60" height="104" rx="14" fill="rgba(255,255,255,0.14)" stroke={stroke} strokeWidth="2.5" />
            <rect x="186" y="74" width="40" height="66" rx="4" fill="rgba(255,255,255,0.22)" />
            <circle cx="206" cy="150" r="3.4" fill={stroke} />
         </motion.g>

         <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [0, 1.2, 1] }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
         >
            <motion.path
               d="M244 40 L262 76 L300 82 L272 108 L280 146 L244 128 L208 146 L216 108 L188 82 L226 76 Z"
               fill={accent} opacity="0.95"
               animate={{ rotate: [0, 12, 0, -12, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
               style={{ transformOrigin: '244px 93px' }}
            />
         </motion.g>

         <motion.g
            animate={{ rotate: [-18, 10, -18] }}
            style={{ transformOrigin: '316px 66px' }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
         >
            <rect x="310" y="40" width="12" height="50" rx="4" fill="rgba(255,255,255,0.16)" stroke={stroke} strokeWidth="2.5" />
            <path d="M302 40 L330 40 L325 26 L307 26 Z" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
         </motion.g>

         <motion.g
            animate={{ rotate: 360 }}
            style={{ transformOrigin: '346px 150px' }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
         >
            <circle cx="346" cy="150" r="20" fill="none" stroke={stroke} strokeWidth="3" strokeDasharray="6 5" />
            <circle cx="346" cy="150" r="6" fill={stroke} />
         </motion.g>

         <motion.g
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
         >
            <circle cx="128" cy="52" r="4" fill={accent} />
         </motion.g>
         <motion.g
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
         >
            <circle cx="392" cy="172" r="3" fill={stroke} />
         </motion.g>
         <motion.g
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
         >
            <circle cx="108" cy="164" r="3" fill={stroke} />
         </motion.g>
      </svg>
   );
});

const HeroIllustration = memo(({ darkMode }) => (
   <div className="relative w-full max-w-2xl mx-auto h-48 sm:h-64 md:h-72" style={{ perspective: '1500px' }}>
      <div className="hero-stage-tilt relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
         <div
            className={`hero-stage-ring absolute inset-[10%] rounded-full border-[8px] ${darkMode ? 'border-emerald-400/15' : 'border-white/25'}`}
            style={{ transformStyle: 'preserve-3d' }}
         />
         <div
            className={`absolute inset-[16%] rounded-[3rem] ${darkMode ? 'bg-emerald-500/15' : 'bg-white/15'}`}
            style={{ transform: 'translateZ(-60px)', boxShadow: '0 40px 80px -30px rgba(0,0,0,0.35)' }}
         />
         <div className="absolute inset-0" style={{ transform: 'translateZ(30px)' }}>
            <HeroIllustrationCore darkMode={darkMode} />
         </div>
         <div
            className="hero-stage-chip absolute top-[6%] right-[6%]"
            style={{ '--tz': '110px', transform: 'translateZ(110px)' }}
         >
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${darkMode ? 'bg-gray-900/90 text-emerald-300' : 'bg-white/90 text-emerald-700'}`} style={{ boxShadow: '0 20px 35px -14px rgba(0,0,0,0.4)' }}>
               <FiShield className="w-3 h-3" /> Trusted repairs
            </div>
         </div>
         <div
            className="hero-stage-chip absolute bottom-[10%] left-[4%]"
            style={{ '--tz': '90px', transform: 'translateZ(90px)', animationDelay: '0.4s' }}
         >
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${darkMode ? 'bg-gray-900/90 text-amber-300' : 'bg-white/90 text-amber-600'}`} style={{ boxShadow: '0 20px 35px -14px rgba(0,0,0,0.4)' }}>
               <FiZap className="w-3 h-3" /> Fast turnaround
            </div>
         </div>
      </div>
   </div>
));

const RepairIllustration = memo(({ darkMode }) => (
   <svg viewBox="0 0 200 160" className="w-full h-full">
      <motion.circle cx="150" cy="35" r="42" fill={darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.08)'}
         animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="24" cy="130" r="30" fill={darkMode ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)'} />
      <g transform="translate(72,30)">
         <rect x="0" y="0" width="56" height="92" rx="10" fill={darkMode ? '#1f2937' : '#f9fafb'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2.5" />
         <rect x="8" y="10" width="40" height="62" rx="3" fill={darkMode ? '#111827' : '#eef2f3'} />
         <circle cx="28" cy="80" r="3.4" fill={darkMode ? '#4b5563' : '#d1d5db'} />
      </g>
      <motion.g
         transform="translate(118,54)"
         animate={{ rotate: [10, 42, 10] }}
         style={{ transformOrigin: '118px 54px' }}
         transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
         <rect x="-4.5" y="-30" width="9" height="40" rx="3" fill={darkMode ? '#34d399' : '#10b981'} />
         <circle cx="0" cy="-30" r="12" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="6" />
      </motion.g>
      <g transform="translate(150,86) rotate(-18)">
         <rect x="-3" y="-22" width="6" height="30" rx="2.5" fill={darkMode ? '#6ee7b7' : '#34d399'} />
         <rect x="-8" y="-30" width="16" height="10" rx="2" fill={darkMode ? '#6ee7b7' : '#34d399'} />
      </g>
      <motion.path d="M40 40 L46 26 L42 26 L48 12 L40 24 L44 24 Z" fill="#fbbf24"
         animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="170" cy="110" r="3" fill={darkMode ? '#34d399' : '#10b981'} />
      <circle cx="182" cy="98" r="2" fill={darkMode ? '#6ee7b7' : '#34d399'} />
      <circle cx="14" cy="60" r="2.4" fill={darkMode ? '#6ee7b7' : '#34d399'} />
   </svg>
));

const OfferIllustration = memo(({ darkMode }) => (
   <svg viewBox="0 0 200 160" className="w-full h-full">
      <motion.circle cx="150" cy="40" r="42" fill={darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.08)'}
         animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
      <circle cx="26" cy="122" r="28" fill={darkMode ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)'} />
      <motion.g
         transform="translate(60,36)"
         animate={{ rotate: [-4, 4, -4] }}
         style={{ transformOrigin: '94px 64px' }}
         transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      >
         <path d="M0 34 L34 0 L74 0 C78.5 0 82 3.5 82 8 L82 48 C82 52.5 78.5 56 74 56 L34 56 Z" fill={darkMode ? '#1f2937' : '#f9fafb'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2.5" />
         <circle cx="34" cy="0" r="7" fill={darkMode ? '#111827' : '#ffffff'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2.5" />
         <path d="M8 44 L44 8" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
      </motion.g>
      <motion.path d="M138 30 L144 16 L140 16 L146 2 L138 14 L142 14 Z" fill="#fbbf24"
         animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      <circle cx="168" cy="70" r="3" fill={darkMode ? '#34d399' : '#10b981'} />
      <circle cx="178" cy="58" r="2" fill={darkMode ? '#6ee7b7' : '#34d399'} />
      <circle cx="20" cy="70" r="2.4" fill={darkMode ? '#6ee7b7' : '#34d399'} />
      <motion.path d="M96 100 L100 108 L109 109 L102.5 115 L104 124 L96 119.5 L88 124 L89.5 115 L83 109 L92 108 Z" fill="#fbbf24" fillOpacity="0.9"
         animate={{ scale: [0.85, 1.15, 0.85], rotate: [0, 20, 0] }}
         style={{ transformOrigin: '96px 112px' }}
         transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
   </svg>
));

const ShopBannerIllustration = memo(({ shopKey }) => (
   <svg viewBox="0 0 200 140" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
         <radialGradient id={`home-glow-${shopKey}`} cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
         </radialGradient>
      </defs>
      <rect width="200" height="140" fill={`url(#home-glow-${shopKey})`} />
      <circle cx="26" cy="112" r="42" fill="rgba(255,255,255,0.08)" />
      <circle cx="176" cy="18" r="28" fill="rgba(255,255,255,0.08)" />
      <g transform="translate(72,26)">
         <rect x="0" y="0" width="42" height="66" rx="8" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
         <rect x="7" y="9" width="28" height="42" rx="2" fill="rgba(255,255,255,0.35)" />
         <circle cx="21" cy="57" r="2.8" fill="rgba(255,255,255,0.6)" />
      </g>
      <g transform="translate(106,42) rotate(28)">
         <rect x="-4" y="-22" width="8" height="30" rx="3" fill="#ffffff" fillOpacity="0.85" />
         <circle cx="0" cy="-22" r="9" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="4.5" />
      </g>
      <path d="M0 8 L6 -6 L3 -6 L9 -20 L1 -4 L4 -4 Z" fill="#fde68a" fillOpacity="0.9" transform="translate(122,78)" />
      <circle cx="142" cy="96" r="2.6" fill="rgba(255,255,255,0.6)" />
      <circle cx="152" cy="88" r="1.8" fill="rgba(255,255,255,0.5)" />
      <circle cx="46" cy="28" r="2.2" fill="rgba(255,255,255,0.5)" />
   </svg>
));

const ProductBackdropIllustration = memo(({ darkMode }) => (
   <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
      <circle cx="170" cy="24" r="34" fill={darkMode ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)'} />
      <circle cx="16" cy="176" r="26" fill={darkMode ? 'rgba(52,211,153,0.06)' : 'rgba(16,185,129,0.05)'} />
      <circle cx="24" cy="20" r="3" fill={darkMode ? 'rgba(110,231,183,0.4)' : 'rgba(16,185,129,0.25)'} />
      <circle cx="182" cy="150" r="2.4" fill={darkMode ? 'rgba(110,231,183,0.4)' : 'rgba(16,185,129,0.25)'} />
   </svg>
));

const SearchBar = memo(({ darkMode, products, shops }) => {
   const [query, setQuery] = useState('');
   const [focused, setFocused] = useState(false);
   const [results, setResults] = useState({ products: [], shops: [], offers: [] });
   const inputRef = useRef(null);
   const dropRef = useRef(null);

   const staticOffers = useMemo(() => [
      { id: 'o1', title: '20% off iPhone screen repair', icon: '🔧' },
      { id: 'o2', title: 'Battery replacement — EGP 499', icon: '🔋' },
      { id: 'o3', title: 'Free diagnostics on any device', icon: '🔍' },
      { id: 'o4', title: 'Buy 2 accessories, get 10% off', icon: '🎁' },
   ], []);

   useEffect(() => {
      if (!query.trim()) { setResults({ products: [], shops: [], offers: [] }); return; }
      const q = query.toLowerCase();
      setResults({
         products: (products || []).filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).slice(0, 4),
         shops: (shops || []).filter(s => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)).slice(0, 3),
         offers: staticOffers.filter(o => o.title.toLowerCase().includes(q)).slice(0, 3),
      });
   }, [query, products, shops, staticOffers]);

   useEffect(() => {
      const handler = (e) => {
         if (dropRef.current && !dropRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
            setFocused(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, []);

   const total = results.products.length + results.shops.length + results.offers.length;
   const showDrop = focused;
   const showResults = focused && query.trim().length > 0 && total > 0;
   const showEmpty = focused && query.trim().length > 0 && total === 0;
   const showDefault = focused && query.trim().length === 0;

   return (
      <div className="relative w-full max-w-xl border rounded-md shadow-md dark:border-gray-800" ref={dropRef}>
         <div className={`flex items-center gap-3 px-4 py-3.5 rounded-md border-2 backdrop-blur-xl transition-all duration-200  ${
            focused
               ? darkMode ? 'border-emerald-400/50 bg-white/10 shadow-emerald-500/20' : 'border-emerald-500/60 bg-white/60 shadow-emerald-500/20'
               : darkMode ? 'border-white/15 bg-white/5' : 'border-white/60 bg-white/40'
         }`}>
            <FiSearch className={`w-5 h-5 flex-shrink-0 transition-colors ${focused ? 'text-emerald-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
               ref={inputRef}
               type="text"
               value={query}
               onChange={e => setQuery(e.target.value)}
               onFocus={() => setFocused(true)}
               placeholder="Search products, shops, offers..."
               className={`flex-1 outline-none cursor-pointer text-sm bg-transparent  font-medium placeholder:font-normal ${
                  darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'
               }`}
            />
            {query && (
               <button onClick={() => setQuery('')} className={`p-0.5 rounded-full ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                  <FiX className="w-4 h-4" />
               </button>
            )}
         </div>

         <AnimatePresence>
            {showDrop && (
               <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border backdrop-blur-2xl shadow-2xl overflow-hidden z-50 ${
                     darkMode ? 'bg-gray-900/85 border-white/10' : 'bg-white/85 border-emerald-100'
                  }`}
               >
                  {showDefault && (
                     <div className="p-4">
                        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Quick Access</p>
                        <div className="grid grid-cols-2 gap-2">
                           {[
                              { label: 'Browse Products', icon: '📱', href: '/devices' },
                              { label: 'Find Shops', icon: '🏪', href: '/shops' },
                              { label: 'Book Repair', icon: '🔧', href: '/repair' },
                              { label: 'Latest Offers', icon: '🏷️', href: '/offers' },
                           ].map(item => (
                              <a key={item.label} href={item.href}
                                 className={`flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-emerald-50 text-gray-700'
                                 }`}>
                                 <span className="text-base">{item.icon}</span> {item.label}
                              </a>
                           ))}
                        </div>
                     </div>
                  )}

                  {showResults && (
                     <div className="max-h-[420px] overflow-y-auto">
                        {results.products.length > 0 && (
                           <div className={`px-4 pt-4 pb-1 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>📱 Products</p>
                              {results.products.map(p => (
                                 <a key={p.id} href={`/device/${p.id}`}
                                    className={`flex items-center gap-3 py-2.5 px-1 rounded-xl transition-colors group ${
                                       darkMode ? 'hover:bg-white/10' : 'hover:bg-emerald-50'
                                    }`}>
                                    <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                       {p.imageUrl && <img src={resolveAsset(p.imageUrl)} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-contain p-1" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                                       <p className="text-xs font-bold text-emerald-600">EGP {p.discount ? (p.price * (1 - p.discount / 100)).toFixed(0) : p.price?.toFixed(0)}</p>
                                    </div>
                                    <FiArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                                 </a>
                              ))}
                           </div>
                        )}

                        {results.shops.length > 0 && (
                           <div className={`px-4 pt-3 pb-1 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>🏪 Shops</p>
                              {results.shops.map(s => (
                                 <a key={s.id} href={`/shops/${s.id}`}
                                    className={`flex items-center gap-3 py-2.5 px-1 rounded-xl transition-colors group ${
                                       darkMode ? 'hover:bg-white/10' : 'hover:bg-emerald-50'
                                    }`}>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                                       <span className="text-white text-base font-bold">{s.name?.charAt(0)}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                                       {s.shopAddress && (
                                          <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.shopAddress.city}</p>
                                       )}
                                    </div>
                                    <FiArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                                 </a>
                              ))}
                           </div>
                        )}

                        {results.offers.length > 0 && (
                           <div className="px-4 pt-3 pb-4">
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>🏷️ Offers</p>
                              {results.offers.map(o => (
                                 <a key={o.id} href="/offers"
                                    className={`flex items-center gap-3 py-2.5 px-1 rounded-xl transition-colors group ${
                                       darkMode ? 'hover:bg-white/10' : 'hover:bg-emerald-50'
                                    }`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                       {o.icon}
                                    </div>
                                    <p className={`text-sm font-medium flex-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{o.title}</p>
                                    <FiArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                                 </a>
                              ))}
                           </div>
                        )}
                     </div>
                  )}

                  {showEmpty && (
                     <div className="p-6 text-center">
                        <p className="text-2xl mb-2">🔍</p>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No results for "{query}"</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Try a different search term</p>
                     </div>
                  )}
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
});

const conditionConfig = {
   New: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
   Used: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
   Refurbished: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
};

const StarRating = memo(({ rating = 4.5, count = 0, darkMode }) => {
   const rounded = Math.round(rating * 2) / 2;
   return (
      <div className="flex items-center gap-1">
         <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
               <FiStar
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                     i < Math.floor(rounded)
                        ? 'text-amber-400 fill-amber-400'
                        : i < rounded
                           ? 'text-amber-400 fill-amber-400 opacity-50'
                           : darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
               />
            ))}
         </div>
         <span className={`text-[10px] sm:text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ({count > 999 ? `${(count / 1000).toFixed(1)}k` : count})
         </span>
      </div>
   );
});

const ProductCard = memo(({ product, darkMode, onAddToCart, index = 0 }) => {
   const [imgLoaded, setImgLoaded] = useState(false);
   const [imgError, setImgError] = useState(false);
   const [cartAdded, setCartAdded] = useState(false);
   const [wished, setWished] = useState(false);

   const discountedPrice = useMemo(() =>
      product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null
   , [product.price, product.discount]);

   const rating = product.rating ?? 4.3;
   const reviewCount = product.reviewCount ?? 128;

   const handleCart = useCallback((e) => {
      e.stopPropagation();
      setCartAdded(true);
      onAddToCart(product);
      setTimeout(() => setCartAdded(false), 2000);
   }, [onAddToCart, product]);

   const handleWish = useCallback((e) => {
      e.stopPropagation();
      setWished(w => !w);
   }, []);

   const navigateToProduct = useCallback(() => {
      window.location.href = `/device/${product.id}`;
   }, [product.id]);

   return (
      <motion.div
         custom={index}
         variants={cardVariants}
         initial="hidden"
         whileInView="visible"
         viewport={{ once: true, margin: "50px" }}
         onClick={navigateToProduct}
         className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer border
        transition-all duration-300 hover:shadow-xl h-full ${darkMode
               ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/40'
               : 'bg-white border-gray-200 hover:border-emerald-300'
            }`}
      >
         <div className={`relative w-full aspect-[4/5] overflow-hidden ${darkMode ? 'bg-gray-850' : 'bg-gray-50'}`}>
            <ProductBackdropIllustration darkMode={darkMode} />

            {product.discount && (
               <span className="absolute top-2 left-2 z-10 inline-flex items-center bg-rose-600 text-white
                  text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  -{product.discount}%
               </span>
            )}

            <button
               onClick={handleWish}
               className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-colors ${
                  darkMode ? 'bg-gray-900/70 hover:bg-gray-900' : 'bg-white/90 hover:bg-white'
               } shadow-sm`}
            >
               <FiHeart className={`w-3.5 h-3.5 transition-colors ${wished ? 'text-rose-500 fill-rose-500' : darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </button>

            <AnimatePresence>
               {!imgLoaded && !imgError && (
                  <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                     className={`absolute inset-0 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
               )}
            </AnimatePresence>
            <motion.img
               src={imgError ? resolveAsset(null) : resolveAsset(product.imageUrl)}
               alt={product.name}
               onLoad={() => setImgLoaded(true)}
               onError={() => { setImgError(true); setImgLoaded(true); }}
               loading="lazy"
               decoding="async"
               initial={{ opacity: 0 }}
               animate={imgLoaded ? { opacity: 1 } : {}}
               transition={{ duration: 0.3 }}
               className="relative z-[1] w-full h-full object-contain p-4 group-hover:scale-[1.04]
            transition-transform duration-500 ease-out"
            />
         </div>

         <div className="flex flex-col flex-1 p-3 gap-1">
            <div className="flex flex-wrap items-center gap-1">
               <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${conditionConfig[product.condition] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {product.condition || 'Unknown'}
               </span>
               <span className={`text-[9px] sm:text-[10px] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {product.categoryName || product.category || 'General'}
               </span>
            </div>

            <h3 className={`font-medium text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.4em] ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
               {product.name}
            </h3>

            <StarRating rating={rating} count={reviewCount} darkMode={darkMode} />

            <div className="flex items-baseline gap-1.5 pt-0.5">
               <span className={`text-sm sm:text-base font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  EGP {discountedPrice ?? product.price?.toFixed(2)}
               </span>
               {discountedPrice && (
                  <span className={`text-[11px] line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                     EGP {product.price?.toFixed(2)}
                  </span>
               )}
            </div>

            <div className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
               <FiTruck className="w-3 h-3" /> Free delivery
            </div>

            <motion.button
               whileTap={{ scale: 0.97 }}
               onClick={handleCart}
               className={`mt-2 w-full py-2 rounded-lg font-bold text-[11px] sm:text-xs
            flex items-center justify-center gap-1.5 transition-all duration-200 ${cartAdded
                     ? 'bg-emerald-500 text-white'
                     : darkMode
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                  }`}
            >
               <AnimatePresence mode="wait">
                  {cartAdded ? (
                     <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1">✓ Added!</motion.span>
                  ) : (
                     <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5">
                        <FiShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                     </motion.span>
                  )}
               </AnimatePresence>
            </motion.button>
         </div>
      </motion.div>
   );
});

const ShopCardSection = memo(({ label, icon, children, dashed = false }) => (
   <div className={`px-3 sm:px-4 py-2.5 sm:py-3 ${dashed ? 'border-t border-dashed' : 'border-t'} border-gray-100 dark:border-gray-800/80`}>
      {label && (
         <p className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            {icon}{label}
         </p>
      )}
      {children}
   </div>
));

const ShopCard = memo(({ shop, darkMode, index = 0 }) => (
   <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "50px" }}
      whileHover={hoverScale}
      className={`group flex flex-col rounded-3xl overflow-hidden h-full
      transition-shadow duration-300 hover:shadow-2xl ${darkMode
            ? 'bg-gray-800 border border-gray-700/80 shadow-lg shadow-black/20'
            : 'bg-white border border-emerald-50 shadow-md shadow-emerald-900/5'
         }`}
   >
      <div className="relative overflow-hidden flex-shrink-0">
         <div className={`relative w-full h-32 sm:h-36 md:h-40 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600
        flex items-center justify-center select-none overflow-hidden
        group-hover:scale-105 transition-transform duration-500`}>
            <ShopBannerIllustration shopKey={shop.id ?? shop.name} />
            <span className="relative z-[1] text-white text-4xl sm:text-5xl font-black drop-shadow-lg">
               {shop.name?.charAt(0).toUpperCase() || 'S'}
            </span>
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
         {shop.verified && (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-emerald-500 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md">
               <RiVerifiedBadgeLine className="w-3 h-3" /> Verified
            </span>
         )}
         {shop.shopType && (
            <div className={`absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm ${darkMode ? 'bg-gray-900/70 text-gray-200' : 'bg-white/80 text-gray-700'}`}>
               <RiStoreLine className="w-3 h-3" />{shop.shopType}
            </div>
         )}
      </div>

      <div className="flex flex-col flex-1">
         <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2.5 sm:pb-3 flex items-start justify-between gap-2">
            <h3 className={`font-bold text-sm sm:text-base leading-tight line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
               {shop.name || 'Unnamed Shop'}
            </h3>
            <div className={`flex items-center gap-1 flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
               <RiStarFill className="w-3 h-3" />
               {shop.rating?.toFixed(1) || '4.8'}
            </div>
         </div>

         {shop.shopAddress && (
            <ShopCardSection label="Location" icon={<FiMapPin className="w-3 h-3 text-emerald-500" />}>
               <p className={`text-xs sm:text-[13px] line-clamp-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {[shop.shopAddress.street, shop.shopAddress.city].filter(Boolean).join(', ')}
               </p>
            </ShopCardSection>
         )}

         <ShopCardSection label="About" icon={<FiInfo className="w-3 h-3 text-emerald-500" />}>
            <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
               {shop.description || 'Professional repair services with genuine parts and 6-month warranty.'}
            </p>
         </ShopCardSection>

         {shop.phone && (
            <ShopCardSection label="Contact" icon={<FiPhone className="w-3 h-3 text-emerald-500" />}>
               <a href={`tel:${shop.phone}`} onClick={(e) => e.stopPropagation()}
                  className={`text-xs sm:text-[13px] font-medium hover:text-emerald-500 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {shop.phone}
               </a>
            </ShopCardSection>
         )}

         <div className="mt-auto px-3 sm:px-4 pt-3 pb-3 sm:pb-4 border-t border-gray-100 dark:border-gray-800/80">
            <motion.button
               whileTap={{ scale: 0.97 }}
               onClick={() => (window.location.href = `/shops/${shop.id}`)}
               className={`w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm
            flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-emerald-400
            transition-colors duration-200 ${darkMode
                     ? 'text-emerald-400 hover:bg-emerald-500 hover:text-white'
                     : 'text-emerald-400 hover:bg-emerald-400 hover:text-white'
                  }`}
            >
               <FiArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Visit Shop
            </motion.button>
         </div>
      </div>
   </motion.div>
));

const EmptyStateIllustration = memo(({ darkMode }) => {
   const c = {
      line: darkMode ? '#34d399' : '#059669',
      fillSoft: darkMode ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.1)',
      fillCard: darkMode ? '#0b1a12' : '#ffffff',
      cardBorder: darkMode ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.18)',
      accent: '#f59e0b',
   };
   return (
      <svg viewBox="0 0 200 160" className="w-full h-full">
         <motion.circle cx="100" cy="86" r="56" fill={c.fillSoft}
            animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
         <motion.g
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
         >
            <rect x="60" y="66" width="80" height="56" rx="10" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
            <path d="M60 84 L90 84 L98 96 L102 96 L110 84 L140 84" fill="none" stroke={c.cardBorder} strokeWidth="2.5" />
         </motion.g>
         <motion.g
            animate={{ rotate: [0, 12, 0, -12, 0] }}
            style={{ transformOrigin: '100px 46px' }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
         >
            <circle cx="100" cy="46" r="16" fill="none" stroke={c.accent} strokeWidth="3" />
            <line x1="111" y1="57" x2="122" y2="68" stroke={c.accent} strokeWidth="4" strokeLinecap="round" />
         </motion.g>
         <motion.circle cx="150" cy="110" r="3" fill={c.line}
            animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
         <motion.circle cx="46" cy="118" r="2.6" fill={c.line}
            animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }} />
      </svg>
   );
});

const HScrollSection = memo(({ title, items, darkMode, renderCard, loading, emptyLabel = 'Nothing here yet', skeletonH = 'h-80 sm:h-[380px]', scrollRef, onLeft, onRight, showLeft, showRight, showArrows }) => (
   <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-10">
            <motion.h2
               initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
               className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}
            >
               {title}
            </motion.h2>
            {showArrows && (
               <div className="flex gap-2 sm:gap-3">
                  <button onClick={onLeft} disabled={!showLeft}
                     className={`p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 ${showLeft
                           ? 'bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400'
                           : 'bg-gray-100 dark:bg-gray-800 opacity-30 cursor-not-allowed'
                        }`}>
                     <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={onRight} disabled={!showRight}
                     className={`p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 ${showRight
                           ? 'bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400'
                           : 'bg-gray-100 dark:bg-gray-800 opacity-30 cursor-not-allowed'
                        }`}>
                     <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
               </div>
            )}
         </div>
         {loading ? (
            <div className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-5 pb-4 sm:pb-6 hide-scrollbar">
               {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}
                     className={`snap-start flex-shrink-0 w-[200px] sm:w-[260px] md:w-[280px] lg:w-[300px] ${skeletonH}
                   rounded-3xl animate-pulse shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
               ))}
            </div>
         ) : items.length === 0 ? (
            <motion.div
               initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
               className={`flex flex-col items-center justify-center text-center gap-3 py-10 sm:py-14 rounded-3xl border-2 border-dashed ${
                  darkMode ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
               }`}
            >
               <div className="w-32 h-28 sm:w-40 sm:h-32">
                  <EmptyStateIllustration darkMode={darkMode} />
               </div>
               <p className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {emptyLabel}
               </p>
            </motion.div>
         ) : (
            <div
               ref={scrollRef}
               className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-5 snap-x snap-mandatory scroll-smooth pb-4 sm:pb-6 hide-scrollbar"
            >
               {items.map((item, i) => (
                  <div key={item.id}
                     className="snap-start flex-shrink-0 w-[200px] sm:w-[260px] md:w-[280px] lg:w-[300px]">
                     {renderCard(item, i)}
                  </div>
               ))}
            </div>
         )}
      </div>
   </section>
));

const RepairOfferSection = memo(({ darkMode, offers }) => (
   <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-950' : 'bg-emerald-50/30'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
         <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
            className="text-xl sm:text-2xl md:text-4xl text-center mb-8 sm:mb-10 font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
            What would you like to do today?
         </motion.h2>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }} viewport={{ once: true }}
               whileHover={{ y: -6 }}
               className="relative">
               <div className={`relative h-full rounded-2xl border-2 p-5 sm:p-8 shadow-xl overflow-hidden flex flex-col transition-all duration-300 ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-emerald-500/60' : 'bg-white border-gray-100 hover:border-emerald-300'
               }`}>
                  <div className="absolute -top-4 -right-4 w-40 h-32 sm:w-52 sm:h-40 opacity-90 pointer-events-none">
                     <RepairIllustration darkMode={darkMode} />
                  </div>
                  <Link to="/repair" className="relative z-[1] flex flex-col h-full">
                     <div className="mb-6 sm:mb-8">
                        <motion.div
                           whileHover={{ rotate: 12, scale: 1.08 }}
                           className={`inline-flex p-3.5 sm:p-4 rounded-2xl mb-4 sm:mb-5 ${darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}
                        >
                           <FiTool className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-400" />
                        </motion.div>
                        <h2 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Repair Device</h2>
                        <p className={`text-sm sm:text-base leading-relaxed max-w-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                           Fast and reliable repairs by expert technicians.
                        </p>
                     </div>
                     <div className="grid grid-cols- sm:grid-cols-1 gap-3 sm:gap-5 mb-6 sm:mb-10">
                        {[
                           { icon: <RiDeviceLine className="w-6 h-6 sm:w-7 sm:h-7" />, label: 'Screen Replacement' },
                           { icon: <RiBattery2ChargeLine className="w-6 h-6 sm:w-7 sm:h-7" />, label: 'Battery Replacement' },
                           { icon: <RiWaterFlashLine className="w-6 h-6 sm:w-7 sm:h-7" />, label: 'Water Damage' },
                           { icon: <RiSettings3Line className="w-6 h-6 sm:w-7 sm:h-7" />, label: 'Software Issues' },
                        ].map(({ icon, label }) => (
                           <motion.div key={label} whileHover={{ x: 4 }}
                              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all group ${
                                 darkMode ? 'bg-gray-900/40 border-gray-700 hover:border-emerald-500/50' : 'bg-gray-50 border-gray-100 hover:border-emerald-200'
                              }`}>
                              <div className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 bg-emerald-400 text-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                                 {icon}
                              </div>
                              <p className="text-xs  sm:text-sm font-semibold text-gray-700 dark:text-gray-200 leading-snug">{label}</p>
                           </motion.div>
                        ))}
                     </div>
                     <button className="mt-auto px-6 sm:px-8 py-3 sm:py-4 font-bold text-center text-emerald-500 bg-transparent rounded-xl border-2 border-emerald-400 hover:bg-emerald-400 hover:text-white hover:-translate-y-0.5 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2">
                        Book a Repair <FiArrowRight className="w-4 h-4" />
                     </button>
                  </Link>
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }} viewport={{ once: true }}
               whileHover={{ y: -6 }}
               className="relative">
               <div className={`relative h-full rounded-2xl border-2 p-5 sm:p-8 shadow-xl overflow-hidden flex flex-col transition-all duration-300 ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-emerald-500/60' : 'bg-white border-gray-100 hover:border-emerald-300'
               }`}>
                  <div className="absolute -top-4 -right-4 w-40 h-32 sm:w-52 sm:h-40 opacity-90 pointer-events-none">
                     <OfferIllustration darkMode={darkMode} />
                  </div>
                  <div className="relative z-[1] mb-6 sm:mb-8">
                     <motion.div
                        whileHover={{ rotate: -12, scale: 1.08 }}
                        className={`inline-flex p-3.5 sm:p-4 rounded-2xl mb-4 sm:mb-5 ${darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}
                     >
                        <RiPriceTagLine className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-400" />
                     </motion.div>
                     <h2 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Latest Offers</h2>
                     <p className={`text-sm sm:text-base leading-relaxed max-w-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Exclusive deals on repairs and premium devices.
                     </p>
                  </div>
                  <ul className="relative z-[1] space-y-2.5 sm:space-y-3 flex-1 mb-6 sm:mb-10">
                     {offers.map((offer, i) => (
                        <motion.li key={i} whileHover={{ x: 6 }}
                           className={`p-3 sm:p-4 rounded-2xl border flex items-center gap-3 sm:gap-4 transition-all ${
                           darkMode ? 'bg-gray-900/40 border-gray-700 text-gray-100 hover:border-emerald-500/50' : 'bg-gray-50 border-gray-100 text-gray-800 hover:border-emerald-200'
                        }`}>
                           <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${darkMode ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                              {React.cloneElement(offer.icon, { className: 'w-4 h-4 sm:w-5 sm:h-5 text-emerald-500' })}
                           </div>
                           <div className="min-w-0">
                              <p className="font-semibold text-sm sm:text-base truncate">{offer.title}</p>
                              <p className="text-xs opacity-60">Limited time offer</p>
                           </div>
                        </motion.li>
                     ))}
                  </ul>
                  <Link to="/offers" className="relative z-[1] px-6 sm:px-8 py-3 sm:py-4 font-bold text-white text-center bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl hover:from-emerald-500 hover:to-teal-600 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/20">
                     View Offers <FiArrowRight className="w-4 h-4" />
                  </Link>
               </div>
            </motion.div>
         </div>
      </div>
   </section>
));

const HomepageContent = memo(({ darkMode }) => {
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [canScrollLeftShops, setCanScrollLeftShops] = useState(false);
   const [canScrollRightShops, setCanScrollRightShops] = useState(false);
   const [canScrollLeftProds, setCanScrollLeftProds] = useState(false);
   const [canScrollRightProds, setCanScrollRightProds] = useState(false);
   const [isPending, startTransition] = useTransition();

   const navigate = useNavigate();
   const shopScrollRef = useRef(null);
   const prodScrollRef = useRef(null);

   useEffect(() => { document.title = 'Home | Tech-Restore'; }, []);

   useEffect(() => {
      const token = localStorage.getItem('authToken');
      if (!token || token.trim() === '') {
         localStorage.removeItem('authToken');
         setIsAuthenticated(false);
      } else {
         try {
            const decoded = jwtDecode(token);
            setIsAuthenticated(decoded && decoded.exp && decoded.exp > Date.now() / 1000);
         } catch {
            setIsAuthenticated(false);
         }
      }
   }, []);

   const { data, isLoading: productsLoading, isError, error } = useQuery({
      queryKey: ['homeData'],
      queryFn: async () => {
         const token = localStorage.getItem('authToken');
         if (!token) throw new Error('Unauthorized');
         let decoded;
         try { decoded = jwtDecode(token); } catch { throw new Error('Unauthorized'); }
         if (!decoded || !decoded.exp || decoded.exp < Date.now() / 1000) throw new Error('Unauthorized');

         const [shopRes, productRes] = await Promise.all([
            api.get('/api/users/shops/all', { headers: { Authorization: `Bearer ${token}` } }),
            api.get('/api/products', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { content: [] } }))
         ]);

         return {
            shops: (shopRes.data.content || []).map(shop => ({ ...shop, devices: [], services: shop.services || [] })),
            products: (productRes.data.content || []).slice(0, 12)
         };
      },
      retry: false,
      staleTime: 5 * 60 * 1000,
   });

   useEffect(() => {
      if (isError && (error?.response?.status === 401 || error?.message === 'Unauthorized')) {
         localStorage.clear();
         setIsAuthenticated(false);
         Swal.fire({ icon: 'warning', title: 'Session Expired', text: 'Please log in again', position: 'top-end', toast: true, timer: 2000 })
            .then(() => navigate('/login'));
      }
   }, [isError, error, navigate]);

   const shops = data?.shops || [];
   const products = data?.products || [];

   const handleAddToCart = useCallback(async (product) => {
      try {
         const token = localStorage.getItem('authToken');
         if (!token) { Swal.fire({ icon: 'warning', title: 'Please log in' }); navigate('/login'); return; }
         let decoded;
         try { decoded = jwtDecode(token); } catch { Swal.fire({ icon: 'warning', title: 'Please log in' }); navigate('/login'); return; }
         if (!decoded || !decoded.exp || decoded.exp < Date.now() / 1000) { Swal.fire({ icon: 'warning', title: 'Please log in' }); navigate('/login'); return; }

         await api.post('/api/cart/items',
            { productId: product.id, quantity: 1, price: product.price, name: product.name, imageUrl: product.image },
            { headers: { Authorization: `Bearer ${token}` } }
         );
         Swal.fire({ icon: 'success', title: 'Added!', text: `${product.name} added to cart!`, toast: true, position: 'top-end', timer: 1500 });
      } catch {
         Swal.fire({ title: 'Error', text: 'Failed to add to cart!', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      }
   }, [navigate]);

   const updateScrollState = useCallback((ref, setLeft, setRight) => {
      if (!ref.current) return;
      const { scrollLeft, clientWidth, scrollWidth } = ref.current;
      startTransition(() => {
         setLeft(scrollLeft > 2);
         setRight(scrollLeft + clientWidth < scrollWidth - 5);
      });
   }, []);

   useEffect(() => {
      const ref = prodScrollRef.current;
      if (!ref) return;
      let timeout;
      const h = () => {
         if (timeout) return;
         timeout = setTimeout(() => {
            updateScrollState(prodScrollRef, setCanScrollLeftProds, setCanScrollRightProds);
            timeout = null;
         }, 100);
      };
      h(); ref.addEventListener('scroll', h, { passive: true }); return () => ref.removeEventListener('scroll', h);
   }, [products, updateScrollState]);

   useEffect(() => {
      const ref = shopScrollRef.current;
      if (!ref) return;
      let timeout;
      const h = () => {
         if (timeout) return;
         timeout = setTimeout(() => {
            updateScrollState(shopScrollRef, setCanScrollLeftShops, setCanScrollRightShops);
            timeout = null;
         }, 100);
      };
      h(); ref.addEventListener('scroll', h, { passive: true }); return () => ref.removeEventListener('scroll', h);
   }, [shops, updateScrollState]);

   const scrollBy = useCallback((ref, dir) => {
      if (!ref.current) return;
      const step = ref.current.clientWidth * 0.75;
      ref.current.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
   }, []);

   const showProdArrows = useMemo(() => products.length > 3 && (canScrollLeftProds || canScrollRightProds), [products.length, canScrollLeftProds, canScrollRightProds]);
   const showShopArrows = useMemo(() => shops.length > 3 && (canScrollLeftShops || canScrollRightShops), [shops.length, canScrollLeftShops, canScrollRightShops]);

   const offers = useMemo(() => [
      { icon: <FiMonitor className="h-5 w-5" />, title: '20% off iPhone screen repair' },
      { icon: <FiShield className="h-5 w-5" />, title: 'Laptop battery replacement EGP 499' },
      { icon: <FiCheckCircle className="h-5 w-5" />, title: 'Free diagnostics on any device' },
      { icon: <FiDollarSign className="h-5 w-5" />, title: 'Buy 2 accessories, get 10% off' },
   ], []);

   const renderProductCard = useCallback((p, i) => (
      <ProductCard product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
   ), [darkMode, handleAddToCart]);

   const renderShopCard = useCallback((shop, i) => (
      <ShopCard shop={shop} darkMode={darkMode} index={i} />
   ), [darkMode]);

   return (
      <>
         <Stage3DStyles />

         <Hero variant="home" darkMode={darkMode}>
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-10 w-full">
               <div className="flex flex-col items-center lg:items-start gap-5 sm:gap-7 w-full lg:w-1/2">
                  <motion.div
                     initial={{ opacity: 0, y: -12 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, ease: EASE }}
                     className="flex items-center gap-3 sm:gap-4"
                  >
                     <BrandMark darkMode={darkMode} />
                     <div className="text-left">
                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                           Tech <span className="text-emerald-300">Restore</span>
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-white/80 font-medium tracking-wide">
                           Revive. Repair. Reimagine your devices.
                        </p>
                     </div>
                  </motion.div>

                  <SearchBar darkMode={darkMode} products={products} shops={shops} />
               </div>

               <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                  className="w-full lg:w-1/2 flex justify-center lg:justify-end"
               >
                  <HeroIllustration darkMode={darkMode} />
               </motion.div>
            </div>
         </Hero>

         <RepairOfferSection darkMode={darkMode} offers={offers} />

         <Suspense fallback={<SkeletonScreen darkMode={darkMode} />}>
            <Service darkMode={darkMode} />
         </Suspense>

         <HScrollSection
            title="Featured Products"
            items={products}
            darkMode={darkMode}
            loading={productsLoading}
            emptyLabel="No products available right now"
            skeletonH="h-[340px] sm:h-[400px] md:h-[430px]"
            scrollRef={prodScrollRef}
            onLeft={() => scrollBy(prodScrollRef, 'left')}
            onRight={() => scrollBy(prodScrollRef, 'right')}
            showLeft={canScrollLeftProds}
            showRight={canScrollRightProds}
            showArrows={showProdArrows}
            renderCard={renderProductCard}
         />

         <HScrollSection
            title="Top Shops"
            items={shops}
            darkMode={darkMode}
            loading={productsLoading}
            emptyLabel="No shops available right now"
            skeletonH="h-[280px] sm:h-[340px] md:h-[360px]"
            scrollRef={shopScrollRef}
            onLeft={() => scrollBy(shopScrollRef, 'left')}
            onRight={() => scrollBy(shopScrollRef, 'right')}
            showLeft={canScrollLeftShops}
            showRight={canScrollRightShops}
            showArrows={showShopArrows}
            renderCard={renderShopCard}
         />

         <Suspense fallback={<SkeletonScreen darkMode={darkMode} />}>
            <OffersSlider darkMode={darkMode} />
         </Suspense>
      </>
   );
});

const Homepage = memo((props) => (
   <QueryClientProvider client={queryClient}>
      <HomepageContent {...props} />
   </QueryClientProvider>
));

export default Homepage;