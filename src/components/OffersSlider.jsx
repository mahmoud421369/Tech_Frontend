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

const CARD_GRADIENTS = [
  { from: 'from-lime-500',   to: 'to-emerald-600', hex: '#059669' },
  { from: 'from-violet-500', to: 'to-purple-600',  hex: '#7c3aed' },
  { from: 'from-orange-500', to: 'to-rose-600',    hex: '#e11d48' },
  { from: 'from-cyan-500',   to: 'to-blue-600',    hex: '#2563eb' },
  { from: 'from-pink-500',   to: 'to-red-600',     hex: '#dc2626' },
];

const palette = (darkMode) => ({
  line: darkMode ? '#34d399' : '#059669',
  lineSoft: darkMode ? '#6ee7b7' : '#10b981',
  fillSoft: darkMode ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.1)',
  fillCard: darkMode ? '#0b1a12' : '#ffffff',
  cardBorder: darkMode ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.18)',
  accent: '#f59e0b',
});

const OffersIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle cx="100" cy="102" r="70" fill={c.fillSoft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.g
        animate={{ rotate: [-4, 4, -4] }}
        style={{ transformOrigin: '100px 100px' }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M70,52 L120,52 L148,86 L110,138 L70,138 Z" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
        <circle cx="86" cy="72" r="6" fill={c.accent} />
        <text x="100" y="104" textAnchor="middle" fontSize="26" fontWeight="800" fill={c.line}>%</text>
      </motion.g>
      {[
        { x: 44, y: 44, s: 6, d: 0 },
        { x: 158, y: 58, s: 8, d: 0.4 },
        { x: 162, y: 128, s: 5, d: 0.8 },
        { x: 48, y: 148, s: 7, d: 1.2 },
      ].map((sp, i) => (
        <motion.path key={i}
          d={`M${sp.x} ${sp.y - sp.s} L${sp.x + sp.s * 0.3} ${sp.y - sp.s * 0.3} L${sp.x + sp.s} ${sp.y} L${sp.x + sp.s * 0.3} ${sp.y + sp.s * 0.3} L${sp.x} ${sp.y + sp.s} L${sp.x - sp.s * 0.3} ${sp.y + sp.s * 0.3} L${sp.x - sp.s} ${sp.y} L${sp.x - sp.s * 0.3} ${sp.y - sp.s * 0.3} Z`}
          fill={c.accent}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: sp.d }}
        />
      ))}
    </svg>
  );
});

const OfferCardIllustration = memo(({ hex, isPercentage }) => (
  <svg viewBox="0 0 100 100" className="absolute -bottom-3 -right-3 w-24 h-24 opacity-[0.09] pointer-events-none select-none">
    <circle cx="50" cy="50" r="46" fill="none" stroke={hex} strokeWidth="3" strokeDasharray="5 8" />
    {isPercentage ? (
      <>
        <circle cx="34" cy="34" r="9" fill="none" stroke={hex} strokeWidth="5" />
        <circle cx="66" cy="66" r="9" fill="none" stroke={hex} strokeWidth="5" />
        <line x1="68" y1="32" x2="32" y2="68" stroke={hex} strokeWidth="5" strokeLinecap="round" />
      </>
    ) : (
      <path d="M30 30 H62 C67 30 70 33 70 37 V42 C64 42 60 46 60 50 C60 54 64 58 70 58 V63 C70 67 67 70 62 70 H30 C25 70 22 67 22 63 V58 C28 58 32 54 32 50 C32 46 28 42 22 42 V37 C22 33 25 30 30 30 Z"
        fill="none" stroke={hex} strokeWidth="3.5" strokeLinejoin="round" />
    )}
  </svg>
));

const OfferCard = ({ offer, darkMode, gradientIndex = 0 }) => {
  const { from, to, hex } = CARD_GRADIENTS[gradientIndex % CARD_GRADIENTS.length];
  const isPercentage = offer.discountType === 'PERCENTAGE';

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col h-full rounded-md overflow-hidden shadow-lg
        transition-shadow duration-300 hover:shadow-2xl hover:-translate-y-1 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
        }`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${from} ${to} flex-shrink-0`} />

      <OfferCardIllustration hex={hex} isPercentage={isPercentage} />

      {offer.discountValue && (
        <div className="absolute top-4 right-4 z-10">
          <div className={`bg-gradient-to-r ${from} ${to} text-white font-extrabold text-sm
            px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5`}>
            {isPercentage ? <FiPercent className="w-3.5 h-3.5" /> : <span className="text-xs">EGP</span>}
            {offer.discountValue}{isPercentage ? '%' : ''} OFF
          </div>
        </div>
      )}

      <div className="relative flex flex-col flex-1 p-5 pt-4 gap-3">
        <div className={`flex items-center gap-2 text-xs font-semibold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
          <RiStore2Line className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{offer.shopName || 'Partner Shop'}</span>
        </div>

        <h3 className={`font-bold text-base sm:text-lg leading-snug line-clamp-2 pr-20 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {offer.name}
        </h3>

        <p className={`text-sm leading-relaxed line-clamp-3 flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {offer.description || 'Limited time offer on selected devices and services.'}
        </p>

        <div className={`flex items-center justify-between pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <FiCalendar className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
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
};

const SkeletonCard = ({ darkMode }) => (
  <div className={`rounded-2xl overflow-hidden border animate-pulse ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
    <div className={`h-1.5 w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
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
);

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
    } catch { }
    finally { setIsLoading(false); }
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
          <div className="h-8 w-52 rounded-xl mx-auto mb-10 animate-pulse bg-lime-500/20" />
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
            <OffersIllustration darkMode={darkMode} />
          </div>
          <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>No Offers Available</p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Check back soon for exciting deals!</p>
        </div>
      </section>
    );
  }

  const cardWidthPct = 100 / visibleCount;
  const translateX   = -(currentIndex * cardWidthPct);

  return (
    <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              className="hidden sm:block w-20 h-20 flex-shrink-0"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <OffersIllustration darkMode={darkMode} />
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
              <motion.button whileTap={{ scale: 0.93 }}
                onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}
                onClick={prev}
                disabled={currentIndex === 0 && maxIndex !== 0}
                className={`p-2.5 rounded-xl border transition-all ${
                  currentIndex === 0 && maxIndex !== 0
                    ? 'opacity-30 cursor-not-allowed'
                    : darkMode ? 'bg-gray-800 border-gray-700 text-white hover:border-lime-500'
                               : 'bg-white border-gray-200 text-gray-700 hover:border-lime-500'
                }`}>
                <FiChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.93 }}
                onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}
                onClick={next}
                disabled={currentIndex >= maxIndex && maxIndex !== 0}
                className={`p-2.5 rounded-xl border transition-all ${
                  currentIndex >= maxIndex && maxIndex !== 0
                    ? 'opacity-30 cursor-not-allowed'
                    : darkMode ? 'bg-gray-800 border-gray-700 text-white hover:border-lime-500'
                               : 'bg-white border-gray-200 text-gray-700 hover:border-lime-500'
                }`}>
                <FiChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </div>

        <div className="overflow-hidden" onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}>
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
                <OfferCard offer={offer} darkMode={darkMode} gradientIndex={i} />
              </div>
            ))}
          </motion.div>
        </div>

        <AnimatePresence>
          {showDots && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex justify-center gap-2 mt-8"
            >
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => goTo(i)}
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
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default memo(OffersSlider);