import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiTag } from 'react-icons/fi';
import api from '../api';
import Swal from 'sweetalert2';
import { RiStore2Line } from 'react-icons/ri';

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`backdrop-blur-xl bg-white/10 dark:bg-black/20 border-2 border-gray-200/70 dark:border-gray-700/70 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const OfferCard = ({ offer, darkMode }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-lime-500';
      case 'expired': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <GlassCard className="h-60 flex flex-col justify-between min-w-[280px] sm:min-w-[320px] mx-2">
      {/* Discount Badge */}
      {offer.discountValue && (
        <div className="absolute top-3 -left-3 bg-gradient-to-r from-lime-500 to-lime-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
          <FiTag className="w-3 h-3" />
          {offer.discountValue}{offer.discountType === 'PERCENTAGE' ? '%' : ' EGP'}
        </div>
      )}

      <div>
        <h3 className={`font-bold text-sm line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {offer.name}
        </h3>
        <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {offer.description || 'No description'}
        </p>
        <div className="flex items-center gap-1 text-xs mt-2">
          <RiStore2Line className={darkMode ? 'text-lime-400' : 'text-lime-600'} />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-700'}>{offer.shopName}</span>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <div>
          <span className="font-medium text-gray-500 dark:text-gray-300">End:</span>{' '}
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{formatDate(offer.endDate)}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${getStatusColor(offer.status)}`}>
          {offer.status}
        </span>
      </div>
    </GlassCard>
  );
};

const OffersSlider = ({ darkMode }) => {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const sliderRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchOffers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/api/users/offers');
      const latest = (data.content || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);
      setOffers(latest);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to load offers',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 3000
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const scrollToIndex = (index) => {
    if (!sliderRef.current || offers.length === 0) return;
    const cardWidth = sliderRef.current.offsetWidth / 3 + 16; // including gap
    const targetScroll = index * cardWidth;
    sliderRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setCurrentIndex(index);
  };

  const goNext = () => {
    const maxIndex = Math.max(0, offers.length - 3);
    const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    scrollToIndex(nextIndex);
  };

  const goPrev = () => {
    const prevIndex = currentIndex <= 0 ? Math.max(0, offers.length - 3) : currentIndex - 1;
    scrollToIndex(prevIndex);
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (isLoading || offers.length === 0) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, isLoading, offers.length]);

  // Sync currentIndex with scroll position
  useEffect(() => {
    if (!sliderRef.current) return;
    const handleScroll = () => {
      const scrollLeft = sliderRef.current.scrollLeft;
      const cardWidth = sliderRef.current.offsetWidth / 3 + 16;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(Math.min(newIndex, Math.max(0, offers.length - 3)));
    };

    const slider = sliderRef.current;
    slider.addEventListener('scroll', handleScroll);
    return () => slider.removeEventListener('scroll', handleScroll);
  }, [offers.length]);

  if (isLoading) {
    return (
      <section className={`py-16 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return (
      <section className={`py-16 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <FiTag className={`mx-auto text-5xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No offers available.</p>
        </div>
      </section>
    );
  }

  const totalSlides = Math.max(1, offers.length - 2); // 3 cards visible → slides = total - 2

  return (
    <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className={`text-3xl sm:text-4xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Exclusive Offers
          </h2>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Latest deals on devices and repair services
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative overflow-hidden">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {offers.map((offer, i) => (
              <div
                key={offer.id}
                className="flex-shrink-0 snap-start"
                style={{ width: 'calc(33.333% - 1rem)' }}
              >
                <OfferCard offer={offer} darkMode={darkMode} />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goPrev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full backdrop-blur-xl transition-all ${
              darkMode
                ? 'bg-black/50 text-lime-400 hover:bg-black/70'
                : 'bg-white/90 text-lime-600 hover:bg-white'
            } shadow-xl`}
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full backdrop-blur-xl transition-all ${
              darkMode
                ? 'bg-black/50 text-lime-400 hover:bg-black/70'
                : 'bg-white/90 text-lime-600 hover:bg-white'
            } shadow-xl`}
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Pagination Dots - Large & Active Wider */}
        <div className="flex justify-center gap-3 mt-8">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === i
                  ? 'bg-lime-500 w-12 h-3'
                  : darkMode
                  ? 'bg-gray-600 w-3 h-3'
                  : 'bg-gray-400 w-3 h-3'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OffersSlider;