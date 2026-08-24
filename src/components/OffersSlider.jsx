import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiPercent } from 'react-icons/fi';
import { RiStore2Line } from 'react-icons/ri';
import api from '../api';

const STATUS_STYLES = {
  active:  'bg-emerald-500 text-white',
  expired: 'bg-red-500 text-white',
  pending: 'bg-amber-400 text-amber-900',
};

const CARD_ACCENTS = [
  { hex: '#059669', soft: 'rgba(5,150,105,0.12)' },
  { hex: '#7c3aed', soft: 'rgba(124,58,237,0.12)' },
  { hex: '#e11d48', soft: 'rgba(225,29,72,0.12)' },
  { hex: '#2563eb', soft: 'rgba(37,99,235,0.12)' },
  { hex: '#dc2626', soft: 'rgba(220,38,38,0.12)' },
];

const palette = (darkMode) => ({
  line: darkMode ? '#34d399' : '#059669',
  lineSoft: darkMode ? '#6ee7b7' : '#10b981',
  fillSoft: darkMode ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.1)',
  fillCard: darkMode ? '#0b1a12' : '#ffffff',
  cardBorder: darkMode ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.18)',
  accent: '#f59e0b',
});

const MascotIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle cx="100" cy="102" r="70" fill={c.fillSoft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="62" y="68" width="76" height="66" rx="18" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
        <motion.circle cx="84" cy="98" r="7" fill={c.line}
          animate={{ scaleY: [1, 0.15, 1] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.4 }} />
        <motion.circle cx="116" cy="98" r="7" fill={c.line}
          animate={{ scaleY: [1, 0.15, 1] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.4 }} />
        <path d="M84,114 Q100,124 116,114" fill="none" stroke={c.line} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="50" y="90" width="12" height="26" rx="6" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
        <rect x="138" y="90" width="12" height="26" rx="6" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
      </motion.g>
      <motion.rect x="86" y="40" width="28" height="8" rx="4" fill={c.accent}
        animate={{ rotate: [-4, 4, -4] }} style={{ transformOrigin: '100px 44px' }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="100" cy="34" r="6" fill={c.accent} />
      {[
        { x: 40, y: 44, d: 0 }, { x: 160, y: 56, d: 0.4 }, { x: 150, y: 150, d: 0.8 }, { x: 48, y: 152, d: 1.2 },
      ].map((sp, i) => (
        <motion.circle key={i} cx={sp.x} cy={sp.y} r="4" fill={c.accent}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.2, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: sp.d }} />
      ))}
    </svg>
  );
});

const OfferCardIllustration = memo(({ hex }) => (
  <svg viewBox="0 0 100 100" className="absolute -bottom-4 -right-4 w-28 h-28 opacity-[0.08] pointer-events-none select-none">
    <circle cx="50" cy="50" r="42" fill="none" stroke={hex} strokeWidth="3" strokeDasharray="4 7" />
    <path d="M32 40 Q50 20 68 40 Q80 55 68 70 Q50 85 32 70 Q20 55 32 40 Z"
      fill="none" stroke={hex} strokeWidth="4" strokeLinejoin="round" />
    <circle cx="50" cy="52" r="10" fill={hex} opacity="0.5" />
  </svg>
));

const OfferCard = memo(({ offer, darkMode, accentIndex = 0 }) => {
  const { hex, soft } = CARD_ACCENTS[accentIndex % CARD_ACCENTS.length];
  const isPercentage = offer.discountType === 'PERCENTAGE';

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col h-full rounded-3xl overflow-hidden border transition-shadow duration-300 hover:shadow-2xl ${
        darkMode ? 'bg-gray-800/80 border-gray-700 backdrop-blur-xl' : 'bg-white/90 border-gray-100 backdrop-blur-xl'
      }`}
      style={{ boxShadow: `0 12px 32px -18px ${hex}55` }}
    >
      <OfferCardIllustration hex={hex} />

      {offer.discountValue && (
        <div className="absolute top-4 right-4 z-10">
          <div className="text-white font-extrabold text-sm px-3 py-1.5 rounded-2xl shadow-md flex items-center gap-1.5"
            style={{ background: hex }}>
            {isPercentage ? <FiPercent className="w-3.5 h-3.5" /> : <span className="text-xs">EGP</span>}
            {offer.discountValue}{isPercentage ? '%' : ''} OFF
          </div>
        </div>
      )}

      <div className="relative flex flex-col flex-1 p-5 pt-5 gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: hex }}>
          <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: soft }}>
            <RiStore2Line className="w-4 h-4" />
          </span>
          <span className="line-clamp-1">{offer.shopName || 'Partner Shop'}</span>
        </div>

        <h3 className={`font-bold text-base sm:text-lg leading-snug line-clamp-2 pr-16 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {offer.name}
        </h3>

        <p className={`text-sm leading-relaxed line-clamp-3 flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {offer.description || 'Limited time offer on selected devices and services.'}
        </p>

        <div className={`flex items-center justify-between pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: hex }} />
            Ends {formatDate(offer.endDate)}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            STATUS_STYLES[offer.status?.toLowerCase()] || 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {offer.status?.toUpperCase() || 'ACTIVE'}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

const SkeletonCard = memo(({ darkMode }) => (
  <div className={`rounded-3xl overflow-hidden border animate-pulse ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
    <div className="p-5 space-y-3">
      <div className={`h-3 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-5 w-3/4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-full rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-5/6 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className="flex justify-between pt-3">
        <div className={`h-3 w-28 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-5 w-16 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
    </div>
  </div>
));

const useVisibleCount = () => {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCount(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return count;
};

const OffersSlider = ({ darkMode }) => {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef(null);
  const visibleCount = useVisibleCount();

  const maxIndex = Math.max(0, offers.length - visibleCount);

  const showDots   = offers.length > 3;
  const showArrows = offers.length > visibleCount;

  const fetchOffers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/api/users/offers');
      const latest = (data.content || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
      setOffers(latest);
    } catch {
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const goTo = useCallback((idx) => {
    setCurrentIndex(Math.max(0, Math.min(idx, maxIndex)));
  }, [maxIndex]);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const startAutoPlay = useCallback(() => {
    clearInterval(autoPlayRef.current);
    if (offers.length > visibleCount) {
      autoPlayRef.current = setInterval(next, 5500);
    }
  }, [offers.length, visibleCount, next]);

  useEffect(() => {
    if (!isLoading) startAutoPlay();
    return () => clearInterval(autoPlayRef.current);
  }, [isLoading, startAutoPlay]);

  const pauseAutoPlay = () => clearInterval(autoPlayRef.current);
  const resumeAutoPlay = () => startAutoPlay();

  if (isLoading) {
    return (
      <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="h-8 w-52 rounded-xl mx-auto mb-10 animate-pulse bg-emerald-500/20" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} darkMode={darkMode} />)}
          </div>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return (
      <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-5 text-center">
          <div className="w-40 h-40 mx-auto mb-2">
            <MascotIllustration darkMode={darkMode} />
          </div>
          <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>No Offers Available</p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Check back soon for exciting deals!</p>
        </div>
      </section>
    );
  }

  const cardWidthPct = 100 / visibleCount;
  const translateX   = -(currentIndex * cardWidthPct);
  const progressPct  = maxIndex === 0 ? 100 : ((currentIndex / maxIndex) * 100);

  return (
    <section className={`py-16 relative overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
      <div className="absolute -bottom-16 -right-10 w-72 h-72 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              className="hidden sm:block w-20 h-20 flex-shrink-0"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MascotIllustration darkMode={darkMode} />
            </motion.div>
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-extrabold text-emerald-400"
              >
                Exclusive Offers
              </motion.h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Grab the best deals on devices and repair services
              </p>
            </div>
          </div>

          {showArrows && (
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.05 }}
                onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}
                onClick={prev}
                disabled={currentIndex === 0 && maxIndex !== 0}
                className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all ${
                  currentIndex === 0 && maxIndex !== 0
                    ? 'opacity-30 cursor-not-allowed'
                    : darkMode ? 'bg-gray-800/70 border-gray-700 text-white hover:border-emerald-500'
                               : 'bg-white/70 border-gray-200 text-gray-700 hover:border-emerald-500'
                }`}>
                <FiChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.05 }}
                onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}
                onClick={next}
                disabled={currentIndex >= maxIndex && maxIndex !== 0}
                className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all ${
                  currentIndex >= maxIndex && maxIndex !== 0
                    ? 'opacity-30 cursor-not-allowed'
                    : darkMode ? 'bg-gray-800/70 border-gray-700 text-white hover:border-emerald-500'
                               : 'bg-white/70 border-gray-200 text-gray-700 hover:border-emerald-500'
                }`}>
                <FiChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl" onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}>
          <motion.div
            className="flex"
            animate={{ x: `${translateX}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            {offers.map((offer, i) => (
              <div key={offer.id}
                style={{ minWidth: `${cardWidthPct}%` }}
                className="px-2.5 box-border"
              >
                <OfferCard offer={offer} darkMode={darkMode} accentIndex={i} />
              </div>
            ))}
          </motion.div>
        </div>

        {showDots && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className={`w-40 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              />
            </div>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex justify-center gap-2"
              >
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => goTo(i)}
                    whileHover={{ scale: 1.2 }}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'w-8 h-2 bg-emerald-500'
                        : darkMode ? 'w-2 h-2 bg-gray-600 hover:bg-gray-400'
                                   : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(OffersSlider);