import React, { useState, useEffect, useCallback, memo } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiPercent, FiTag } from 'react-icons/fi';
import { RiStore2Line } from 'react-icons/ri';
import api from '../api';
import { Defs3D, Device3DStyles, DeviceScene, Btn3D, Chip3D, useOnScreen } from './Device3D';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';

const STATUS_STYLES = {
  active: 'bg-emerald-500 text-white',
  expired: 'bg-rose-600 text-white',
  pending: 'bg-amber-400 text-amber-950',
};
const SHOP_TONES = ['em', 'sky', 'am', 'vi'];

const formatDate = (d) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/* ───────────── Offer card (same card language as ProductCard) ───────────── */
const OfferCard = memo(({ offer, darkMode, index }) => {
  const isPercentage = offer.discountType === 'PERCENTAGE';
  const hasDiscount = offer.discountValue != null && offer.discountValue !== '';
  const status = (offer.status || 'active').toLowerCase();

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
        darkMode ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30' : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'
      }`}
    >
      {/* top panel: the discount is the hero */}
      <div className={`relative flex h-28 items-center overflow-hidden px-5 ${darkMode ? 'bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-950' : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100'}`}>
        <div className={`absolute -left-6 -top-10 h-32 w-32 rounded-full blur-2xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-300/40'}`} />
        <DeviceScene compact className="absolute -bottom-3 end-0 h-24 w-28 opacity-60" />
        <span className={`absolute start-3 top-3 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-[0_2px_0_0_rgba(0,0,0,0.25)] ${STATUS_STYLES[status] || 'bg-gray-500 text-white'}`}>
          {offer.status || 'Active'}
        </span>
        {hasDiscount ? (
          <div className="relative mt-5 flex items-baseline gap-1.5" dir="ltr">
            {!isPercentage && <span className={`text-sm font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>EGP</span>}
            <span className={`text-4xl font-black tabular-nums tracking-tight ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{offer.discountValue}</span>
            {isPercentage && <FiPercent className={`h-5 w-5 self-center ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />}
            <span className={`ms-1 text-xs font-extrabold ${darkMode ? 'text-emerald-200/70' : 'text-emerald-800/70'}`}>OFF</span>
          </div>
        ) : (
          <Chip3D tone="am" className="relative mt-5 h-12 w-12"><FiTag className="h-6 w-6" /></Chip3D>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <Chip3D tone={SHOP_TONES[index % SHOP_TONES.length]} className="h-7 w-7 flex-shrink-0"><RiStore2Line className="h-3.5 w-3.5" /></Chip3D>
          <span className={`line-clamp-1 text-[11px] font-bold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{offer.shopName || 'Partner shop'}</span>
        </div>
        <h3 className={`line-clamp-2 text-sm font-semibold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{offer.name}</h3>
        <p className={`line-clamp-3 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {offer.description || 'Limited time offer on selected devices and services.'}
        </p>
        <div className={`mt-auto flex items-center gap-1.5 border-t pt-3 text-xs ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
          <FiCalendar className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
          Ends {formatDate(offer.endDate)}
        </div>
      </div>
    </article>
  );
});

const SkeletonCard = memo(({ darkMode }) => (
  <div className={`h-[300px] animate-pulse rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
));

const useVisibleCount = () => {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const update = () => { const w = window.innerWidth; setCount(w < 640 ? 1 : w < 1024 ? 2 : 3); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return count;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Props: darkMode, standalone (true only if rendered on a page that has no <Defs3D />).
 */
const OffersSlider = ({ darkMode = false, standalone = false }) => {
  const language = useAppLanguage();
  const isRtl = languageDirection(language) === 'rtl';
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [wrapRef, onScreen] = useOnScreen();
  const visibleCount = useVisibleCount();

  const maxIndex = Math.max(0, offers.length - visibleCount);
  const showArrows = offers.length > visibleCount;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/users/offers');
        const list = Array.isArray(data?.content) ? data.content : [];
        const latest = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
        if (!cancelled) setOffers(latest);
      } catch {
        if (!cancelled) setOffers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // keep the index valid when the viewport (cards per view) changes
  useEffect(() => { setCurrentIndex((i) => Math.min(i, maxIndex)); }, [maxIndex]);

  const next = useCallback(() => setCurrentIndex((i) => (i >= maxIndex ? 0 : i + 1)), [maxIndex]);
  const goPrev = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setCurrentIndex((i) => Math.min(maxIndex, i + 1)), [maxIndex]);

  // autoplay: only while visible, not hovered/focused, and motion is allowed
  useEffect(() => {
    if (isLoading || !showArrows || hovered || !onScreen || prefersReducedMotion()) return undefined;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [isLoading, showArrows, hovered, onScreen, next]);

  const atStart = currentIndex === 0;
  const atEnd = currentIndex >= maxIndex;
  const cardPct = 100 / visibleCount;
  const offset = currentIndex * cardPct * (isRtl ? 1 : -1);

  return (
    <section
      ref={wrapRef}
      dir={languageDirection(language)}
      className={`relative overflow-hidden py-12 sm:py-16 ${onScreen ? '' : 'anim-paused'} ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-[#04120b]' : 'bg-emerald-50/70'}`}
    >
      {standalone && <Defs3D />}
      <Device3DStyles />
      <div className={`pointer-events-none absolute -top-24 h-72 w-72 rounded-full blur-3xl ${isRtl ? '-left-24' : '-right-24'} ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-300/30'}`} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* banner */}
        <div className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 ring-1 ring-emerald-500/20' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'}`}>
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white"><FiTag className="h-3 w-3" /> Deals</span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Exclusive offers</h2>
              <p className="mt-1 text-sm text-emerald-50/80">Grab the best deals on devices and repair services.</p>
              {showArrows && (
                <div className="mt-4 flex gap-2">
                  <Btn3D tone="soft" darkMode={darkMode} onClick={goPrev} disabled={atStart} aria-label="Previous offers" className="h-10 w-10">
                    <FiChevronLeft className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
                  </Btn3D>
                  <Btn3D tone="soft" darkMode={darkMode} onClick={goNext} disabled={atEnd} aria-label="Next offers" className="h-10 w-10">
                    <FiChevronRight className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
                  </Btn3D>
                </div>
              )}
            </div>
            <DeviceScene className="hidden h-32 w-48 sm:block lg:h-36 lg:w-56" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} darkMode={darkMode} />)}
          </div>
        ) : offers.length === 0 ? (
          <div className={`flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed py-12 text-center ${darkMode ? 'border-gray-800 bg-gray-900/40' : 'border-emerald-200 bg-white/60'}`}>
            <DeviceScene compact className="h-24 w-32" />
            <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>No offers available</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Check back soon for new deals.</p>
          </div>
        ) : (
          <>
            <div
              className="overflow-hidden"
              role="region"
              aria-roledescription="carousel"
              aria-label="Exclusive offers"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onFocus={() => setHovered(true)}
              onBlur={() => setHovered(false)}
            >
              <div
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                style={{ transform: `translateX(${offset}%)` }}
              >
                {offers.map((offer, i) => (
                  <div key={offer.id ?? i} style={{ minWidth: `${cardPct}%` }} className="box-border px-2.5" aria-hidden={i < currentIndex || i >= currentIndex + visibleCount}>
                    <OfferCard offer={offer} darkMode={darkMode} index={i} />
                  </div>
                ))}
              </div>
            </div>

            {maxIndex > 0 && (
              <div className="mt-8 flex justify-center gap-2" role="group" aria-label="Choose slide">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === currentIndex}
                    className={`h-2 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                      i === currentIndex
                        ? 'w-8 bg-emerald-500 shadow-[0_2px_0_0_#047857]'
                        : `w-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-500' : 'bg-emerald-200 hover:bg-emerald-300'}`
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default memo(OffersSlider);