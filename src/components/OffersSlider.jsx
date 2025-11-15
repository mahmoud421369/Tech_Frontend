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
    <GlassCard className="h-60 flex flex-col justify-between">
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
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchOffers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/api/users/offers');
      const latest = (data.content || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
      setOffers(latest);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load offers', icon: 'error', toast: true, position: 'top-end', timer: 3000 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const scrollSlider = (direction) => {
    if (!sliderRef.current || offers.length === 0) return;
    const slideWidth = sliderRef.current.offsetWidth / 3;
    const maxSlide = Math.max(0, offers.length - 3);
    const newIndex = direction === 'next'
      ? Math.min(currentSlide + 1, maxSlide)
      : Math.max(currentSlide - 1, 0);
    sliderRef.current.scrollTo({ left: newIndex * slideWidth, behavior: 'smooth' });
    setCurrentSlide(newIndex);
  };

  const goToSlide = (index) => {
    if (!sliderRef.current) return;
    const slideWidth = sliderRef.current.offsetWidth / 3;
    sliderRef.current.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (offers.length === 0 || isLoading) return;
    const interval = setInterval(() => scrollSlider('next'), 5000);
    return () => clearInterval(interval);
  }, [currentSlide, offers.length, isLoading]);

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

  return (
    <section className={`py-16 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className={`text-3xl sm:text-4xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Exclusive Offers
          </h2>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Latest deals on devices and repair services
          </p>
        </div>

        {/* Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden"
          >
            {offers.map((offer, i) => (
              <div key={offer.id} className="snap-start">
                <OfferCard offer={offer} darkMode={darkMode} />
              </div>
            ))}
          </div>

          {/* Navigation */}
          <button
            onClick={() => scrollSlider('prev')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 rounded-full backdrop-blur-xl ${
              darkMode ? 'bg-black/40 text-lime-400 hover:bg-black/60' : 'bg-white/80 text-lime-600 hover:bg-white'
            } shadow-lg transition`}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollSlider('next')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 rounded-full backdrop-blur-xl ${
              darkMode ? 'bg-black/40 text-lime-400 hover:bg-black/60' : 'bg-white/80 text-lime-600 hover:bg-white'
            } shadow-lg transition`}
          >
            <FiChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {Array(Math.ceil(offers.length / 3)).fill().map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`w-2 h-2 rounded-full transition ${
                  currentSlide === i
                    ? 'bg-lime-500 w-8'
                    : darkMode ? 'bg-gray-600' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OffersSlider;