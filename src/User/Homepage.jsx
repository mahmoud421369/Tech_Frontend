import React, { useState, useRef, useEffect, useCallback, memo, useMemo, Suspense, useTransition, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
   FiStar, FiTool, FiMonitor, FiDollarSign,
   FiShield, FiCheckCircle, FiShoppingCart,
   FiChevronLeft, FiChevronRight, FiMapPin, FiPhone, FiTruck,
   FiArrowRight, FiSearch, FiX, FiHeart,
   FiInfo, FiZap,
} from 'react-icons/fi';
import '../styles/style.css';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { Hero } from '../components';
import {
   RiBattery2ChargeLine,
   RiDeviceLine, RiPriceTagLine, RiSettings3Line, RiStarFill, RiVerifiedBadgeLine, RiWaterFlashLine,
   RiStoreLine, RiCameraLine, RiPlugLine, RiHardDrive2Line, RiVolumeUpLine
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

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

const HOMEPAGE_STYLES = `
   @keyframes heroStageTilt { 0%, 100% { transform: rotateX(8deg) rotateY(-12deg) rotateZ(0deg); } 50% { transform: rotateX(3deg) rotateY(-5deg) rotateZ(0.5deg); } }
   @keyframes heroStageChip { 0%, 100% { transform: translateZ(var(--tz, 70px)) translateY(0px); } 50% { transform: translateZ(var(--tz, 70px)) translateY(-8px); } }
   @keyframes heroStageRing { from { transform: translateZ(-30px) rotate(0deg); } to { transform: translateZ(-30px) rotate(360deg); } }
   .hero-stage-tilt { animation: heroStageTilt 8s ease-in-out infinite; will-change: transform; }
   .hero-stage-chip { animation: heroStageChip 4.2s ease-in-out infinite; will-change: transform; }
   .hero-stage-ring { animation: heroStageRing 14s linear infinite; will-change: transform; }

   @keyframes pulseScale { 0%, 100% { transform: scale(1); } 50% { transform: scale(var(--s-peak, 1.05)); } }
   .pulse-scale { animation: pulseScale var(--fdur, 5s) ease-in-out infinite; transform-origin: center; will-change: transform; }

   @keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--fy, -10px)); } }
   .float-y { animation: floatY var(--fdur, 5s) ease-in-out infinite; will-change: transform; }

   @keyframes twinkleOpacity { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
   .twinkle-opacity { animation: twinkleOpacity var(--fdur, 1.8s) ease-in-out infinite; }

   @keyframes spin360 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
   .spin-360 { animation: spin360 var(--fdur, 20s) linear infinite; will-change: transform; }

   @keyframes bobRotate { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
   .bob-rotate { animation: bobRotate 5s ease-in-out infinite; will-change: transform; }

   @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
   .pop-in { animation: popIn 0.8s ${EASE} both; }

   @keyframes popRotateIn { from { opacity: 0; transform: scale(0.7) rotate(-8deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
   .pop-rotate-in { animation: popRotateIn 0.7s ${EASE} both; }

   @keyframes starWobble { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(12deg); } 75% { transform: rotate(-12deg); } }
   .star-wobble { animation: starWobble var(--fdur, 6s) ease-in-out infinite; will-change: transform; }

   @keyframes toolWobbleC { 0%, 100% { transform: rotate(-18deg); } 50% { transform: rotate(10deg); } }
   .tool-wobble-c { animation: toolWobbleC 2.6s ease-in-out infinite; will-change: transform; }

   @keyframes toolWobbleD { 0%, 100% { transform: rotate(10deg); } 50% { transform: rotate(42deg); } }
   .tool-wobble-d { animation: toolWobbleD 2.2s ease-in-out infinite; will-change: transform; }

   @keyframes flickerSpark { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
   .flicker-spark { animation: flickerSpark 1.6s ease-in-out infinite; }

   @keyframes gentleWobble { 0%, 100% { transform: rotate(calc(var(--a, 4) * -1deg)); } 50% { transform: rotate(var(--a, 4)deg); } }
   .gentle-wobble { animation: gentleWobble var(--fdur, 4s) ease-in-out infinite; will-change: transform; }

   @keyframes starSpin { 0%, 100% { transform: scale(0.85) rotate(0deg); } 50% { transform: scale(1.15) rotate(20deg); } }
   .star-spin { animation: starSpin 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

   @keyframes dropIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
   .drop-in { animation: dropIn 0.16s ease-out both; }

   @keyframes fadeUpEnter { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
   .fade-up-enter { animation: fadeUpEnter 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both; }

   @keyframes scaleFadeIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
   .scale-fade-in { animation: scaleFadeIn 0.22s ${EASE} both; }

   @keyframes simpleFadeIn { from { opacity: 0; } to { opacity: 1; } }
   .simple-fade-in { animation: simpleFadeIn 0.12s ease-out both; }

   @keyframes blobPulse {
      0%, 100% { transform: translate(var(--tx, 0), var(--ty2, 0)) scale(var(--s-from, 1)); opacity: var(--o-from, 0.12); }
      50%      { transform: translate(var(--tx, 0), var(--ty2, 0)) scale(var(--s-to, 1.08)); opacity: var(--o-to, 0.18); }
   }
   .blob-pulse { animation: blobPulse var(--fdur, 8s) ease-in-out infinite; will-change: transform, opacity; }

   .hover-lift { transition: transform 0.2s ${EASE}, box-shadow 0.2s ${EASE}; }
   .hover-lift:hover { transform: translateY(-5px); }

   /* Pauses any nested CSS animation when the element scrolls out of view - saves CPU/GPU */
   .anim-offscreen * { animation-play-state: paused !important; }

   /* Lightweight pseudo-3D tilt wrapper used for illustration cards */
   .tilt-3d { perspective: 900px; }
   .tilt-3d-inner {
      transform-style: preserve-3d;
      transform: rotateX(6deg) rotateY(-8deg);
      transition: transform 0.25s ${EASE};
      filter: drop-shadow(0 18px 28px rgba(16,185,129,0.18));
   }
   .tilt-3d:hover .tilt-3d-inner { transform: rotateX(2deg) rotateY(-2deg) scale(1.02); }

   @media (prefers-reduced-motion: reduce) {
      .hero-stage-tilt, .hero-stage-chip, .hero-stage-ring, .pulse-scale, .float-y,
      .twinkle-opacity, .spin-360, .bob-rotate, .pop-in, .pop-rotate-in, .star-wobble,
      .tool-wobble-c, .tool-wobble-d, .flicker-spark, .gentle-wobble, .star-spin,
      .drop-in, .fade-up-enter, .scale-fade-in, .simple-fade-in, .blob-pulse, .hover-lift,
      .tilt-3d-inner {
         animation-duration: 0.001s !important;
         transition-duration: 0.001s !important;
      }
   }
`;

let homepageStylesInjected = false;
const injectHomepageStylesOnce = () => {
   if (homepageStylesInjected || typeof document === 'undefined') return;
   const tag = document.createElement('style');
   tag.setAttribute('data-homepage-styles', 'true');
   tag.textContent = HOMEPAGE_STYLES;
   document.head.appendChild(tag);
   homepageStylesInjected = true;
};

const useInView = (options) => {
   const ref = useRef(null);
   const [inView, setInView] = useState(false);
   useEffect(() => {
      if (!ref.current || inView) return;
      const node = ref.current;
      const obs = new IntersectionObserver(([entry]) => {
         if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      }, options || { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
      obs.observe(node);
      return () => obs.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [inView]);
   return [ref, inView];
};


const useVisibilityToggle = () => {
   const ref = useRef(null);
   const [visible, setVisible] = useState(true);
   useEffect(() => {
      if (!ref.current || typeof IntersectionObserver === 'undefined') return;
      const node = ref.current;
      const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
      obs.observe(node);
      return () => obs.disconnect();
   }, []);
   return [ref, visible];
};

const Stage3DStyles = memo(() => {
   useEffect(() => { injectHomepageStylesOnce(); }, []);
   return null;
});

const BrandMark = memo(({ darkMode }) => (
   <div className="pop-rotate-in relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16">
      <svg viewBox="0 0 100 100" className="w-full h-full">
         <defs>
            <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#34d399" />
               <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
         </defs>
         <circle
            className="spin-360" style={{ '--fdur': '18s', transformOrigin: '50px 50px' }}
            cx="50" cy="50" r="46" fill="url(#brandGrad)"
         />
         <path d="M38 26 L38 74 M62 26 L62 74" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity="0.95" />
         <path
            className="twinkle-opacity" style={{ '--fdur': '2s' }}
            d="M30 50 L46 50" stroke="#ffffff" strokeWidth="7" strokeLinecap="round"
         />
      </svg>
   </div>
));

const HeroIllustrationCore = memo(({ darkMode }) => {
   const stroke = darkMode ? '#6ee7b7' : '#ffffff';
   const soft = darkMode ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.18)';
   const accent = '#fbbf24';

   return (
      <svg viewBox="0 0 480 220" className="w-full h-full">
         <circle className="pulse-scale" style={{ '--fdur': '4.5s', '--s-peak': 1.05 }} cx="240" cy="112" r="96" fill={soft} />

         <circle className="spin-360" style={{ '--fdur': '26s', transformOrigin: '240px 112px' }} cx="240" cy="112" r="130" fill="none" stroke={soft} strokeWidth="1.5" strokeDasharray="2 10" />

         <g className="bob-rotate" style={{ transformOrigin: '206px 112px' }}>
            <rect x="176" y="60" width="60" height="104" rx="14" fill="rgba(255,255,255,0.14)" stroke={stroke} strokeWidth="2.5" />
            <rect x="186" y="74" width="40" height="66" rx="4" fill="rgba(255,255,255,0.22)" />
            <circle cx="206" cy="150" r="3.4" fill={stroke} />
         </g>

         <g className="pop-in" style={{ animationDelay: '0.4s' }}>
            <path
               className="star-wobble" style={{ '--fdur': '6s', transformOrigin: '244px 93px' }}
               d="M244 40 L262 76 L300 82 L272 108 L280 146 L244 128 L208 146 L216 108 L188 82 L226 76 Z"
               fill={accent} opacity="0.95"
            />
         </g>

         <g className="tool-wobble-c" style={{ transformOrigin: '316px 66px' }}>
            <rect x="310" y="40" width="12" height="50" rx="4" fill="rgba(255,255,255,0.16)" stroke={stroke} strokeWidth="2.5" />
            <path d="M302 40 L330 40 L325 26 L307 26 Z" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
         </g>

         <g className="spin-360" style={{ '--fdur': '8s', transformOrigin: '346px 150px' }}>
            <circle cx="346" cy="150" r="20" fill="none" stroke={stroke} strokeWidth="3" strokeDasharray="6 5" />
            <circle cx="346" cy="150" r="6" fill={stroke} />
         </g>

         <g className="twinkle-opacity" style={{ '--fdur': '1.8s', animationDelay: '0.3s' }}>
            <circle cx="128" cy="52" r="4" fill={accent} />
         </g>
         <g className="twinkle-opacity" style={{ '--fdur': '1.8s', animationDelay: '0.9s' }}>
            <circle cx="392" cy="172" r="3" fill={stroke} />
         </g>
         <g className="twinkle-opacity" style={{ '--fdur': '2.2s', animationDelay: '1.4s' }}>
            <circle cx="108" cy="164" r="3" fill={stroke} />
         </g>
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

const RepairIllustration = memo(({ darkMode }) => {
   const [wrapRef, visible] = useVisibilityToggle();
   const g1 = darkMode ? '#34d399' : '#10b981';
   const g2 = darkMode ? '#0891b2' : '#0d9488';
   return (
      <div ref={wrapRef} className={`tilt-3d w-full h-full ${visible ? '' : 'anim-offscreen'}`}>
         <div className="tilt-3d-inner w-full h-full">
            <svg viewBox="0 0 200 160" className="w-full h-full">
               <defs>
                  <linearGradient id="repairPhoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor={darkMode ? '#1f2937' : '#ffffff'} />
                     <stop offset="100%" stopColor={darkMode ? '#111827' : '#eef2f3'} />
                  </linearGradient>
                  <linearGradient id="repairToolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor={g1} />
                     <stop offset="100%" stopColor={g2} />
                  </linearGradient>
               </defs>
               <circle className="pulse-scale" style={{ '--fdur': '4s', '--s-peak': 1.08 }} cx="150" cy="35" r="42" fill={darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.08)'} />
               <circle cx="24" cy="130" r="30" fill={darkMode ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)'} />
               <g transform="translate(72,30)">
                  <rect x="3" y="4" width="56" height="92" rx="10" fill="rgba(0,0,0,0.12)" />
                  <rect x="0" y="0" width="56" height="92" rx="10" fill="url(#repairPhoneGrad)" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2.5" />
                  <rect x="8" y="10" width="40" height="62" rx="3" fill={darkMode ? '#111827' : '#dfeeee'} />
                  <circle cx="28" cy="80" r="3.4" fill={darkMode ? '#4b5563' : '#d1d5db'} />
               </g>
               <g className="tool-wobble-d" transform="translate(118,54)" style={{ transformOrigin: '118px 54px' }}>
                  <rect x="-4.5" y="-30" width="9" height="40" rx="3" fill="url(#repairToolGrad)" />
                  <circle cx="0" cy="-30" r="12" fill="none" stroke="url(#repairToolGrad)" strokeWidth="6" />
               </g>
               <g transform="translate(150,86) rotate(-18)">
                  <rect x="-3" y="-22" width="6" height="30" rx="2.5" fill={darkMode ? '#6ee7b7' : '#34d399'} />
                  <rect x="-8" y="-30" width="16" height="10" rx="2" fill={darkMode ? '#6ee7b7' : '#34d399'} />
               </g>
               <path className="flicker-spark" d="M40 40 L46 26 L42 26 L48 12 L40 24 L44 24 Z" fill="#fbbf24" />
               <circle cx="170" cy="110" r="3" fill={g1} />
               <circle cx="182" cy="98" r="2" fill={darkMode ? '#6ee7b7' : '#34d399'} />
               <circle cx="14" cy="60" r="2.4" fill={darkMode ? '#6ee7b7' : '#34d399'} />
            </svg>
         </div>
      </div>
   );
});

const OfferIllustration = memo(({ darkMode }) => {
   const [wrapRef, visible] = useVisibilityToggle();
   return (
      <div ref={wrapRef} className={`tilt-3d w-full h-full ${visible ? '' : 'anim-offscreen'}`}>
         <div className="tilt-3d-inner w-full h-full">
            <svg viewBox="0 0 200 160" className="w-full h-full">
               <defs>
                  <linearGradient id="offerTagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor={darkMode ? '#1f2937' : '#ffffff'} />
                     <stop offset="100%" stopColor={darkMode ? '#111827' : '#f3f4f6'} />
                  </linearGradient>
               </defs>
               <circle className="pulse-scale" style={{ '--fdur': '4s', '--s-peak': 1.08, animationDelay: '0.3s' }} cx="150" cy="40" r="42" fill={darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.08)'} />
               <circle cx="26" cy="122" r="28" fill={darkMode ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)'} />
               <g className="gentle-wobble" transform="translate(60,36)" style={{ '--fdur': '3.4s', '--a': 4, transformOrigin: '94px 64px' }}>
                  <path d="M3 37 L37 3 L77 3 C81.5 3 85 6.5 85 11 L85 51 C85 55.5 81.5 59 77 59 L37 59 Z" fill="rgba(0,0,0,0.1)" />
                  <path d="M0 34 L34 0 L74 0 C78.5 0 82 3.5 82 8 L82 48 C82 52.5 78.5 56 74 56 L34 56 Z" fill="url(#offerTagGrad)" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2.5" />
                  <circle cx="34" cy="0" r="7" fill={darkMode ? '#111827' : '#ffffff'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2.5" />
                  <path d="M8 44 L44 8" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
               </g>
               <path className="flicker-spark" style={{ animationDelay: '0.5s' }} d="M138 30 L144 16 L140 16 L146 2 L138 14 L142 14 Z" fill="#fbbf24" />
               <circle cx="168" cy="70" r="3" fill={darkMode ? '#34d399' : '#10b981'} />
               <circle cx="178" cy="58" r="2" fill={darkMode ? '#6ee7b7' : '#34d399'} />
               <circle cx="20" cy="70" r="2.4" fill={darkMode ? '#6ee7b7' : '#34d399'} />
               <path className="star-spin" d="M96 100 L100 108 L109 109 L102.5 115 L104 124 L96 119.5 L88 124 L89.5 115 L83 109 L92 108 Z" fill="#fbbf24" fillOpacity="0.9" style={{ transformOrigin: '96px 112px' }} />
            </svg>
         </div>
      </div>
   );
});

const ShopBannerIllustration = memo(({ shopKey, darkMode }) => {
   const [wrapRef, visible] = useVisibilityToggle();
   return (
      <div ref={wrapRef} className={`absolute inset-0 ${visible ? '' : 'anim-offscreen'}`}>
         <svg viewBox="0 0 200 140" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
               <radialGradient id={`home-glow-${shopKey}`} cx="50%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
               </radialGradient>
               <linearGradient id={`home-card-${shopKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
               </linearGradient>
            </defs>
            <rect width="200" height="140" fill={`url(#home-glow-${shopKey})`} />
            <circle cx="26" cy="112" r="42" fill="rgba(16,185,129,0.10)" />
            <circle cx="176" cy="18" r="28" fill="rgba(16,185,129,0.10)" />
            <g className="float-y" style={{ '--fdur': '5s', '--fy': '-6px' }} transform="translate(72,26)">
               <rect x="3" y="4" width="42" height="66" rx="8" fill="rgba(6,95,70,0.10)" />
               <rect x="0" y="0" width="42" height="66" rx="8" fill={`url(#home-card-${shopKey})`} stroke="rgba(16,185,129,0.45)" strokeWidth="2" />
               <rect x="7" y="9" width="28" height="42" rx="2" fill="rgba(16,185,129,0.30)" />
               <circle cx="21" cy="57" r="2.8" fill="rgba(5,150,105,0.5)" />
            </g>
            <g className="tool-wobble-c" style={{ transformOrigin: '106px 42px' }} transform="translate(106,42) rotate(28)">
               <rect x="-4" y="-22" width="8" height="30" rx="3" fill="#059669" fillOpacity="0.85" />
               <circle cx="0" cy="-22" r="9" fill="none" stroke="#059669" strokeOpacity="0.85" strokeWidth="4.5" />
            </g>
            <path className="flicker-spark" d="M0 8 L6 -6 L3 -6 L9 -20 L1 -4 L4 -4 Z" fill="#f59e0b" fillOpacity="0.9" transform="translate(122,78)" />
            <circle cx="142" cy="96" r="2.6" fill="rgba(5,150,105,0.5)" />
            <circle cx="152" cy="88" r="1.8" fill="rgba(5,150,105,0.4)" />
            <circle cx="46" cy="28" r="2.2" fill="rgba(5,150,105,0.4)" />
         </svg>
      </div>
   );
});

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
      <div className="relative z-40 w-full max-w-xl border rounded-md shadow-md dark:border-gray-800" ref={dropRef}>
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

         {showDrop && (
            <div
               className={`drop-in absolute top-full left-0 right-0 mt-2 rounded-2xl border backdrop-blur-2xl shadow-2xl overflow-hidden z-[999] ${
                  darkMode ? 'bg-gray-900/85 border-white/10' : 'bg-white/85 border-emerald-100'
               }`}
            >
               {showDefault && (
                  <div className="p-4 z-50">
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
                  <div className="max-h-[420px] z-50 overflow-y-auto">
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
            </div>
         )}
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
   const [ref, inView] = useInView();

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
      <div
         ref={ref}
         onClick={navigateToProduct}
         className={`${inView ? 'fade-up-enter' : 'opacity-0'} group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer border
        transition-colors duration-200 hover:shadow-xl h-full ${darkMode
               ? 'bg-gray-900 border-gray-800 hover:border-emerald-500/40'
               : 'bg-white border-gray-200 hover:border-emerald-300'
            }`}
         style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
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

            {!imgLoaded && !imgError && (
               <div className={`absolute inset-0 animate-pulse transition-opacity duration-200 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
            )}
            <img
               src={imgError ? resolveAsset(null) : resolveAsset(product.imageUrl)}
               alt={product.name}
               onLoad={() => setImgLoaded(true)}
               onError={() => { setImgError(true); setImgLoaded(true); }}
               loading="lazy"
               decoding="async"
               style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s ease' }}
               className="relative z-[1] w-full h-full object-contain p-4 group-hover:scale-[1.03]
            transition-transform duration-300 ease-out"
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

            <button
               onClick={handleCart}
               className={`mt-2 w-full py-2 rounded-lg font-bold text-[11px] sm:text-xs
            flex items-center justify-center gap-1.5 transition-colors duration-150 active:scale-[0.97] ${cartAdded
                     ? 'bg-emerald-500 text-white'
                     : darkMode
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                  }`}
            >
               {cartAdded ? (
                  <span className="simple-fade-in flex items-center gap-1">✓ Added!</span>
               ) : (
                  <span className="simple-fade-in flex items-center gap-1.5">
                     <FiShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </span>
               )}
            </button>
         </div>
      </div>
   );
});

const ShopCardSection = memo(({ label, icon, children, dashed = false }) => (
   <div className={`px-3 sm:px-4 py-2.5 sm:py-3 ${dashed ? 'border-t border-dashed' : 'border-t'} border-emerald-100/70 dark:border-gray-800/80`}>
      {label && (
         <p className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-700/60 dark:text-gray-500 mb-1.5">
            {icon}{label}
         </p>
      )}
      {children}
   </div>
));

const ShopCard = memo(({ shop, darkMode, index = 0 }) => {
   const [ref, inView] = useInView();
   return (
      <div
         ref={ref}
         className={`${inView ? 'fade-up-enter' : 'opacity-0'} hover-lift group flex flex-col rounded-3xl overflow-hidden h-full
      transition-shadow duration-200 hover:shadow-2xl ${darkMode
               ? 'bg-gray-800 border border-gray-700/80 shadow-lg shadow-black/20'
               : 'bg-white border border-emerald-100 shadow-md shadow-emerald-900/5'
            }`}
         style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
      >
         <div className="relative overflow-hidden flex-shrink-0">
            <div className={`relative w-full h-32 sm:h-36 md:h-40 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50
        flex items-center justify-center select-none overflow-hidden
        group-hover:scale-[1.03] transition-transform duration-300`}>
               <ShopBannerIllustration shopKey={shop.id ?? shop.name} darkMode={darkMode} />
               <span className="relative z-[1] text-emerald-700 text-4xl sm:text-5xl font-black drop-shadow-sm">
                  {shop.name?.charAt(0).toUpperCase() || 'S'}
               </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent pointer-events-none" />
            {shop.verified && (
               <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-emerald-500 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md">
                  <RiVerifiedBadgeLine className="w-3 h-3" /> Verified
               </span>
            )}
            {shop.shopType && (
               <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm bg-white/85 text-emerald-800">
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

            <div className="mt-auto px-3 sm:px-4 pt-3 pb-3 sm:pb-4 border-t border-emerald-100/70 dark:border-gray-800/80">
               <button
                  onClick={() => (window.location.href = `/shops/${shop.id}`)}
                  className={`w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm
            flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-emerald-400
            transition-colors duration-150 active:scale-[0.97] ${darkMode
                        ? 'text-emerald-400 hover:bg-emerald-500 hover:text-white'
                        : 'text-emerald-600 hover:bg-emerald-400 hover:text-white'
                     }`}
               >
                  <FiArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Visit Shop
               </button>
            </div>
         </div>
      </div>
   );
});

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
         <circle className="pulse-scale" style={{ '--fdur': '4s', '--s-peak': 1.06 }} cx="100" cy="86" r="56" fill={c.fillSoft} />
         <g className="float-y" style={{ '--fdur': '4s', '--fy': '-8px' }}>
            <rect x="60" y="66" width="80" height="56" rx="10" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
            <path d="M60 84 L90 84 L98 96 L102 96 L110 84 L140 84" fill="none" stroke={c.cardBorder} strokeWidth="2.5" />
         </g>
         <g className="star-wobble" style={{ '--fdur': '3.5s', transformOrigin: '100px 46px' }}>
            <circle cx="100" cy="46" r="16" fill="none" stroke={c.accent} strokeWidth="3" />
            <line x1="111" y1="57" x2="122" y2="68" stroke={c.accent} strokeWidth="4" strokeLinecap="round" />
         </g>
         <circle className="twinkle-opacity" style={{ '--fdur': '1.8s', animationDelay: '0.4s' }} cx="150" cy="110" r="3" fill={c.line} />
         <circle className="twinkle-opacity" style={{ '--fdur': '1.8s', animationDelay: '0.9s' }} cx="46" cy="118" r="2.6" fill={c.line} />
      </svg>
   );
});

const HScrollSection = memo(({ title, items, darkMode, renderCard, loading, emptyLabel = 'Nothing here yet', skeletonH = 'h-80 sm:h-[380px]', scrollRef, onLeft, onRight, showLeft, showRight, showArrows }) => {
   const [headingRef, headingInView] = useInView();
   const [emptyRef, emptyInView] = useInView();
   return (
      <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-10">
               <h2
                  ref={headingRef}
                  className={`${headingInView ? 'fade-up-enter' : 'opacity-0'} text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}
               >
                  {title}
               </h2>
               {showArrows && (
                  <div className="flex gap-2 sm:gap-3">
                     <button onClick={onLeft} disabled={!showLeft}
                        className={`p-2 sm:p-3 rounded-full shadow-lg transition-colors duration-150 ${showLeft
                              ? 'bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400'
                              : 'bg-gray-100 dark:bg-gray-800 opacity-30 cursor-not-allowed'
                           }`}>
                        <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                     </button>
                     <button onClick={onRight} disabled={!showRight}
                        className={`p-2 sm:p-3 rounded-full shadow-lg transition-colors duration-150 ${showRight
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
               <div
                  ref={emptyRef}
                  className={`${emptyInView ? 'fade-up-enter' : 'opacity-0'} flex flex-col items-center justify-center text-center gap-3 py-10 sm:py-14 rounded-3xl border-2 border-dashed ${
                     darkMode ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
                  }`}
               >
                  <div className="w-32 h-28 sm:w-40 sm:h-32">
                     <EmptyStateIllustration darkMode={darkMode} />
                  </div>
                  <p className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                     {emptyLabel}
                  </p>
               </div>
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
   );
});

const REPAIR_FEATURES = [
   { icon: RiDeviceLine, label: 'Screen Replacement' },
   { icon: RiBattery2ChargeLine, label: 'Battery Replacement' },
   { icon: RiWaterFlashLine, label: 'Water Damage' },
   { icon: RiSettings3Line, label: 'Software Issues' },
   { icon: RiCameraLine, label: 'Camera Repair' },
   { icon: RiPlugLine, label: 'Charging Port' },
   { icon: RiHardDrive2Line, label: 'Data Recovery' },
   { icon: RiVolumeUpLine, label: 'Speaker & Mic' },
];

const ActionCard = memo(({ darkMode, accent, eyebrow, title, description, to, ctaLabel, Illustration, children }) => {
   const [ref, inView] = useInView();
   return (
      <div ref={ref} className={inView ? 'fade-up-enter' : 'opacity-0'}>
         <Link
            to={to}
            className={`group relative flex flex-col h-full rounded-[28px] p-6 sm:p-8 overflow-hidden border transition-colors duration-200 hover-lift
               ${darkMode
                  ? 'bg-gray-900/70 border-white/10 hover:border-emerald-400/40'
                  : 'bg-white border-gray-100 hover:border-emerald-300 shadow-[0_20px_50px_-25px_rgba(16,185,129,0.25)]'
               }`}
         >
            <div
               className="absolute -inset-px rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -z-10"
               style={{ background: `linear-gradient(135deg, ${accent}33, transparent 60%)` }}
            />
            <div className="absolute -top-6 -right-6 w-44 h-36 sm:w-56 sm:h-44 opacity-90 pointer-events-none">
               <Illustration darkMode={darkMode} />
            </div>

            <div className="relative z-[1] flex flex-col h-full">
               <span
                  className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-5"
                  style={{ color: accent, background: `${accent}1a` }}
               >
                   {eyebrow}
               </span>

               <h2 className={`text-2xl sm:text-3xl font-extrabold mb-2.5 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {title}
               </h2>
               <p className={`text-sm sm:text-base leading-relaxed max-w-sm mb-6 sm:mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {description}
               </p>

               <div className="flex-1 mb-6 sm:mb-8">{children}</div>

               <span
                  className="mt-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base text-white transition-transform duration-200"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 12px 30px -12px ${accent}80` }}
               >
                  {ctaLabel}
                  <FiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
               </span>
            </div>
         </Link>
      </div>
   );
});


const RepairOfferSection = memo(({ darkMode, offers }) => (

   
   <section className={`relative py-14 sm:py-20 overflow-hidden ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-b from-emerald-50/60 to-white'}`}>
      <div
         className="blob-pulse absolute top-10 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
         style={{ '--fdur': '9s', '--o-from': darkMode ? 0.08 : 0.14, '--o-to': darkMode ? 0.14 : 0.2, '--s-to': 1.1, background: darkMode ? '#10b981' : '#34d399' }}
      />
      <div
         className="blob-pulse absolute bottom-0 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
         style={{ '--fdur': '10s', animationDelay: '0.5s', '--o-from': darkMode ? 0.06 : 0.1, '--o-to': darkMode ? 0.12 : 0.16, '--s-to': 1.12, background: darkMode ? '#0891b2' : '#7c3aed' }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
         <div className="text-center mb-10 sm:mb-14">
            <span className={`inline-block text-xs font-bold uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
               Get started
            </span>
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
               What would you like to do today?
            </h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
            <ActionCard
               darkMode={darkMode}
               accent="#10b981"
               eyebrow="Repair"
               title="Repair Device"
               description="Fast and reliable repairs by expert technicians, with genuine parts every time."
               to="/repair"
               ctaLabel="Book a Repair"
               Illustration={RepairIllustration}
            >
               <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-h-[220px] sm:max-h-none overflow-y-auto sm:overflow-visible pr-1 sm:pr-0">
                  {REPAIR_FEATURES.map(({ icon: Icon, label }) => (
                     <div
                        key={label}
                        className={`group/item flex items-center gap-2.5 p-3 rounded-2xl border transition-colors duration-150 ${
                           darkMode ? 'bg-gray-900/40 border-gray-700 hover:border-emerald-500/50' : 'bg-gray-50 border-gray-100 hover:border-emerald-300'
                        }`}
                     >
                        <div className="w-9 h-9 flex-shrink-0 bg-gray-100 dark:bg-gray-900 text-white rounded-xl flex items-center justify-center transition-transform duration-150 group-hover/item:scale-110">
                           <Icon className="w-5 h-5 text-gray-700 dark:text-white" />
                        </div>
                        <p className={`text-xs font-semibold leading-snug ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</p>
                     </div>
                  ))}
               </div>
               <p className={`mt-3 text-[11px] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>...and more — get a free diagnostic to see exactly what your device needs.</p>
            </ActionCard>

            <ActionCard
               darkMode={darkMode}
               accent="#7c3aed"
               eyebrow="Offers"
               title="Latest Offers"
               description="A taste of the kind of deals you'll find — real offers rotate in the app and can vary by shop."
               to="/offers"
               ctaLabel="View Offers"
               Illustration={OfferIllustration}
            >
             
            </ActionCard>
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
   const [, startTransition] = useTransition();

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
      { icon: <FiMonitor className="h-5 w-5" />, title: 'Example: 20% off iPhone screen repair' },
      { icon: <FiShield className="h-5 w-5" />, title: 'Example: Laptop battery replacement EGP 499' },
      { icon: <FiCheckCircle className="h-5 w-5" />, title: 'Example: Free diagnostics on any device' },
      { icon: <FiDollarSign className="h-5 w-5" />, title: 'Example: Buy 2 accessories, get 10% off' },
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
               <SearchBar darkMode={darkMode} products={products} shops={shops} />
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