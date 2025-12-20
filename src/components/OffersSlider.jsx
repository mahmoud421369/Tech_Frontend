import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiTag, FiCalendar, FiPercent } from 'react-icons/fi';
import { RiStore2Line } from 'react-icons/ri';
import api from '../api';
import Swal from 'sweetalert2';

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`relative backdrop-blur-xl bg-white/80 dark:bg-black/30 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${className}`}
  >
    {children}
  </div>
);

const OfferCard = ({ offer, darkMode }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-500 text-white';
      case 'expired': return 'bg-red-500 text-white';
      case 'pending': return 'bg-amber-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const isPercentage = offer.discountType === 'PERCENTAGE';

  return (
    <GlassCard className="h-80 flex flex-col justify-between">
     
      {offer.discountValue && (
        <div className="absolute -top-4 -left-4 z-10">
          <div className="bg-gradient-to-br from-emerald-500 to-lime-600 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-lg">
            {isPercentage ? <FiPercent className="w-5 h-5" /> : <span className="text-sm">EGP</span>}
            <span>{offer.discountValue}{isPercentage ? '%' : ''}</span>
            <span className="text-xs font-normal">OFF</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h3 className={`font-bold text-lg line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {offer.name}
        </h3>
        <p className={`text-sm mt-2 line-clamp-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {offer.description || 'Limited time offer on selected devices and services.'}
        </p>

        <div className="flex items-center gap-2 mt-4 text-sm">
          <RiStore2Line className="w-5 h-5 text-emerald-500" />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-700'}>{offer.shopName}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2 text-sm">
          <FiCalendar className="w-4 h-4 text-emerald-500" />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Ends {formatDate(offer.endDate)}
          </span>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(offer.status)}`}>
          {offer.status?.toUpperCase()}
        </span>
      </div>
    </GlassCard>
  );
};

const OffersSlider = ({ darkMode }) => {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const sliderRef = useRef(null);

  const fetchOffers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/api/users/offers');
      const latest = (data.content || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10); 
      setOffers(latest);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to load offers',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 3000,
        background: darkMode ? '#1f2937' : '#fff',
        color: darkMode ? '#fff' : '#000',
      });
    } finally {
      setIsLoading(false);
    }
  }, [darkMode]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const scrollNext = () => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.offsetWidth * 0.8;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const scrollPrev = () => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.offsetWidth * 0.8;
    sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  // Auto-play
  useEffect(() => {
    if (isLoading || offers.length <= 3) return;
    const interval = setInterval(scrollNext, 6000);
    return () => clearInterval(interval);
  }, [isLoading, offers.length]);

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading exclusive offers...</p>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <FiTag className="mx-auto text-6xl mb-4 text-gray-400 dark:text-gray-600" />
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">No Offers Available</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Check back soon for exciting deals!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">

       <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #84cc16;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #65a30d;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
   
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent">
            Exclusive Offers
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Grab the best deals on devices and repair services
          </p>
        </div>

        
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto custom-scrollbar snap-x snap-mandatory scrollbar-hide scroll-smooth pb-4"
          >
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 snap-start"
              >
                <OfferCard offer={offer} darkMode={darkMode} />
              </div>
            ))}
          </div>

 
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-4 rounded-full bg-white/90 dark:bg-black/70 shadow-2xl hover:scale-110 transition-all backdrop-blur-md"
            aria-label="Previous offers"
          >
            <FiChevronLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-4 rounded-full bg-white/90 dark:bg-black/70 shadow-2xl hover:scale-110 transition-all backdrop-blur-md"
            aria-label="Next offers"
          >
            <FiChevronRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>

 
        {/* <div className="flex justify-center gap-2 mt-10">
          {[...Array(Math.ceil(offers.length / 3))].map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentGroup ? 'w-10 bg-emerald-500' : 'w-2 bg-gray-400'
              }`}
            />
          ))}
        </div> */}
      </div>
    </section>
  );
};

export default OffersSlider;