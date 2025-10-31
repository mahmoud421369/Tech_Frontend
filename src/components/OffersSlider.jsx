
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiTag } from 'react-icons/fi';
import api from '../api';
import Swal from 'sweetalert2';

const OfferCard = ({ offer, darkMode }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'expired':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`relative w-full h-[28rem] rounded-3xl overflow-hidden shadow-2xl group backdrop-blur-xl border ${
      darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
    }`}>
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        darkMode
          ? 'from-indigo-900 via-purple-900 to-gray-900'
          : 'from-indigo-500 via-purple-500 to-pink-500'
      } opacity-80`}></div>
      
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md"></div>

      {/* Discount Badge */}
      {offer.discountValue && (
        <div className={`absolute top-4 left-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg`}>
          <FiTag className="w-4 h-4" />
          {offer.discountValue}{offer.discountType === 'PERCENTAGE' ? '%' : ' EGP'} OFF
        </div>
      )}

      {/* Content */}
      <div className="relative h-full p-6 mt-7 flex flex-col justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg mb-2 line-clamp-2">{offer.name}</h3>
          <p className="text-gray-200 text-sm sm:text-base mb-4 line-clamp-3">{offer.description || 'No description available'}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-200 pb-6">
          <div>
            <span className="font-medium text-white">Start:</span> {formatDate(offer.startDate)}
          </div>
          <div>
            <span className="font-medium text-white">End:</span> {formatDate(offer.endDate)}
          </div>
          <div>
            <span className="font-medium text-white">Type:</span> {offer.discountType || 'N/A'}
          </div>
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)} text-white`}>
              {offer.status || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-3xl"></div>
    </div>
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
      const response = await api.get('/api/users/offers');
      const latestOffers = (response.data.content || response.data || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8); // Get latest 8 offers
      setOffers(latestOffers);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to load offers',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Slider Controls
  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const slideWidth = sliderRef.current.offsetWidth;
    const newIndex = direction === 'next'
      ? Math.min(currentSlide + 1, offers.length - 1)
      : Math.max(currentSlide - 1, 0);
    
    sliderRef.current.scrollTo({
      left: newIndex * slideWidth,
      behavior: 'smooth',
    });
    setCurrentSlide(newIndex);
  };

  const goToSlide = (index) => {
    if (!sliderRef.current) return;
    const slideWidth = sliderRef.current.offsetWidth;
    sliderRef.current.scrollTo({
      left: index * slideWidth,
      behavior: 'smooth',
    });
    setCurrentSlide(index);
  };

  // Auto-play
  useEffect(() => {
    if (offers.length === 0 || isLoading) return;
    const interval = setInterval(() => {
      scrollSlider('next');
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide, offers.length, isLoading]);

  if (isLoading) {
    return (
      <div className="relative py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-96">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="relative py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <FiTag className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No offers available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={`relative overflow-hidden ${
      darkMode
        ? 'bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900'
        : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
    }`}>
      {/* Floating Devices */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <img src="/devices/laptop.png" alt="" className="absolute top-10 left-20 w-32 animate-float" />
        <img src="/devices/phone.png" alt="" className="absolute bottom-20 right-20 w-24 animate-float animation-delay-1000" />
        <img src="/devices/tablet.png" alt="" className="absolute top-20 right-40 w-28 animate-float animation-delay-500" />
        <img src="/devices/accessory.png" alt="" className="absolute bottom-10 left-40 w-20 animate-float animation-delay-1500" />
      </div>

      {/* Wave SVG */}
      <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320">
        <path fill={darkMode ? '#111827' : '#ffffff'} d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
            Exclusive Offers
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            Discover our latest deals on devices and repair services
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {offers.map((offer) => (
              <div key={offer.id} className="snap-start flex-shrink-0 w-full max-w-md mx-auto">
                <OfferCard offer={offer} darkMode={darkMode} />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => scrollSlider('prev')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition z-20 group"
          >
            <FiChevronLeft className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
          </button>
          <button
            onClick={() => scrollSlider('next')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition z-20 group"
          >
            <FiChevronRight className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-8">
            {offers.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === index
                    ? 'w-12 h-3 bg-indigo-600 shadow-lg'
                    : 'w-3 h-3 bg-gray-400 dark:bg-gray-600 hover:bg-indigo-400 dark:hover:bg-indigo-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1500 { animation-delay: 1.5s; }
      `}</style>
    </section>
  );
};

export default OffersSlider;
