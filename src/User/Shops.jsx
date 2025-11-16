import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiMapPin,
  FiStar,
  FiFilter,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiTruck,
  FiClock,
  FiTag,
  FiDollarSign,
} from 'react-icons/fi';
import { RiCarLine, RiMotorbikeLine } from 'react-icons/ri';
import api from '../api';
import Swal from 'sweetalert2';

const ShopCard = ({ shop, darkMode, index }) => (
  <div
    className={`group p-7 rounded-2xl shadow-lg transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    } animate-slideIn`}
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <div className="flex items-start gap-5">
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-br from-lime-500 to-lime-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
          {shop.name.charAt(0)}
        </div>
        {shop.verified && (
          <FiCheckCircle className="absolute -top-2 -right-2 text-lime-500 text-xl bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {shop.name}
          </h3>
        </div>
        <p className={`text-sm font-medium ${darkMode ? 'text-lime-400' : 'text-lime-600'} mt-1`}>
          {shop.shopType}
        </p>

        {shop.shopAddress && (
          <div className={`flex items-center gap-2 text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <FiMapPin className="text-lime-500" />
            {shop.shopAddress.street}, {shop.shopAddress.city}, {shop.shopAddress.state}
          </div>
        )}

        <p className={`text-sm flex items-center gap-1 mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <FiPhone className="text-lime-500" /> {shop.phone}
        </p>

        <p className={`text-sm mt-2 line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {shop.description || 'No description available.'}
        </p>

        <div className="flex items-center gap-1 mt-3">
          {[...Array(5)].map((_, i) => (
            <FiStar
              key={i}
              className={`w-4 h-4 ${i < Math.floor(shop.rating || 4) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
            />
          ))}
          <span className={`text-sm ml-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            ({shop.rating || 'N/A'})
          </span>
        </div>
      </div>
    </div>

    <button
      onClick={() => window.location.href = `/shops/${shop.id}`}
      className="mt-5 w-full py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition shadow-md font-semibold flex items-center justify-center gap-2 group"
    >
      Visit Shop
      <FiTruck className="group-hover:animate-pulse" />
    </button>
  </div>
);

const Shops = ({ darkMode }) => {
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    try {
      const res = await api.get('/api/users/shops/all', {
        signal: controller.signal,
      });
      setShops(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Shops fetch failed, using fallback data');
        // Silently use fallback – no Swal error
        setShops([
          {
            id: 1,
            name: "TechFix Pro",
            shopType: "Mobile & Laptop Repair",
            shopAddress: { street: "123 Main St", city: "Cairo", state: "Cairo" },
            phone: "+20 123 456 7890",
            description: "Professional repair services for all devices with 6-month warranty.",
            rating: 4.8,
            verified: true,
          },
          {
            id: 2,
            name: "Gadget Hub",
            shopType: "Electronics Store",
            shopAddress: { street: "456 Nile Ave", city: "Alexandria", state: "Alexandria" },
            phone: "+20 987 654 3210",
            description: "New & refurbished phones, tablets, and accessories at best prices.",
            rating: 4.6,
            verified: true,
          },
          {
            id: 3,
            name: "Quick Repair",
            shopType: "Express Service",
            shopAddress: { street: "789 Tech Rd", city: "Giza", state: "Giza" },
            phone: "+20 555 123 4567",
            description: "Same-day repair for screens, batteries, and software issues.",
            rating: 4.5,
            verified: false,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const filteredShops = shops.filter(shop =>
    shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.shopAddress?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.shopAddress?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.shopType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* ────── HERO – MONOTREE STYLE ────── */}
      <section className="relative overflow-hidden py-32">
        <div
          className={`absolute inset-0 ${
            darkMode
              ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700'
              : 'bg-gradient-to-br from-white via-lime-50 to-gray-100'
          }`}
        />

        {/* Wave */}
        <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320" aria-hidden="true">
          <path
            fill={darkMode ? '#1f2937' : '#f3f4f6'}
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Floating Shop Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FiTruck className={`absolute top-16 left-12 w-14 h-14 ${darkMode ? 'text-lime-400' : 'text-lime-600'} animate-float-slow opacity-70`} />
       
          <FiPhone className={`absolute top-1/3 left-1/4 w-11 h-11 ${darkMode ? 'text-gray-300' : 'text-gray-600'} animate-float-medium opacity-60`} />
        
          <FiClock className={`absolute top-20 right-1/4 w-12 h-12 ${darkMode ? 'text-lime-400' : 'text-lime-600'} animate-float-medium opacity-70`} />
          <FiDollarSign className={`absolute top-10 right-1/3 w-10 h-10 ${darkMode ? 'text-lime-300' : 'text-lime-500'} animate-spin-slow opacity-60`} />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
          {/* Left */}
          <div>
            <h1 className={`text-5xl sm:text-6xl font-extrabold drop-shadow-md ${darkMode ? 'text-lime-400' : 'text-lime-700'}`}>
              Find Trusted Shops
            </h1>
            <p className={`mt-6 text-xl max-w-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Discover verified repair shops and service centers near you with expert technicians.
            </p>

            {/* CTA */}
            {/* <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md">
              <input
                type="text"
                placeholder="Enter your city or area"
                className={`px-5 py-3 rounded-full border ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-lime-500`}
              />
              <button className="px-6 py-3 bg-lime-600 text-white font-semibold rounded-full hover:bg-lime-700 transition shadow-lg">
                Search Nearby
              </button>
            </div> */}

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-8 text-center">
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>500+</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Verified shops</p>
              </div>
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>98%</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Customer satisfaction</p>
              </div>
            </div>
          </div>

          {/* Right: 3D Shop Animation */}
          <div className="relative h-96 lg:h-full flex justify-center items-center">
            <div className="relative w-80 h-96 perspective-1000">
              {/* Main Shop Card */}
              <div
                className="absolute top-12 left-16 w-48 h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl shadow-2xl transform rotate-y-12 rotate-x-6 animate-float-3d border border-gray-300 dark:border-gray-600"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="p-6 h-full flex flex-col justify-between" style={{ transform: 'translateZ(20px)' }}>
                  <div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-6 rounded mb-3 w-3/4"></div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-full mb-2"></div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-2/3"></div>
                  </div>
                  <div className="bg-lime-500 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    Open Now
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div
                className="absolute bottom-10 right-10 w-56 h-44 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl transform rotate-y--15 rotate-x-8 animate-float-3d-delay border border-gray-200 dark:border-gray-700"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="p-5" style={{ transform: 'translateZ(15px)' }}>
                  <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-4/5"></div>
                </div>
              </div>

              {/* Verified Badge */}
              <div
                className="absolute top-32 left-4 w-32 h-28 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform rotate-y-20 rotate-x-10 animate-float-3d-fast border-2 border-lime-500"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="p-4 text-center" style={{ transform: 'translateZ(10px)' }}>
                  <FiCheckCircle className="text-lime-600 text-3xl mx-auto mb-1" />
                  <p className="text-sm font-bold text-lime-600">Verified</p>
                </div>
              </div>

              {/* Spinning Truck */}
              <div className="absolute top-20 right-20 w-12 h-12 animate-spin-slow opacity-70">
                <FiTruck className="text-lime-500 text-5xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────── SEARCH BAR ────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 -mt-20 relative z-10">
        <div className={`rounded-3xl shadow-2xl p-6 transition-all duration-300 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, location, type, phone, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                } focus:outline-none focus:ring-2 focus:ring-lime-500 transition`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ────── SHOPS GRID ────── */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl p-7 ${darkMode ? 'bg-gray-800' : 'bg-white'} animate-pulse`}
              >
                <div className="flex gap-5">
                  <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-16">
            <FiMapPin className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No shops found matching your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop, index) => (
              <ShopCard key={shop.id} shop={shop} darkMode={darkMode} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shops;