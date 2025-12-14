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
  FiZap,
  FiUsers,
  FiHome,
  FiCheck,
} from 'react-icons/fi';
import api from '../api';
import Swal from 'sweetalert2';
import { RiStore2Line } from 'react-icons/ri';

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
      const res = await api.get('/api/users/shops/all', { signal: controller.signal });
      setShops(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Shops fetch failed, using fallback data');
        setShops([
          { id: 1, name: "TechFix Pro", shopType: "Mobile & Laptop Repair", shopAddress: { street: "123 Main St", city: "Cairo", state: "Cairo" }, phone: "+20 123 456 7890", description: "Professional repair services for all devices with 6-month warranty.", rating: 4.8, verified: true },
          { id: 2, name: "Gadget Hub", shopType: "Electronics Store", shopAddress: { street: "456 Nile Ave", city: "Alexandria", state: "Alexandria" }, phone: "+20 987 654 3210", description: "New & refurbished phones, tablets, and accessories at best prices.", rating: 4.6, verified: true },
          { id: 3, name: "Quick Repair", shopType: "Express Service", shopAddress: { street: "789 Tech Rd", city: "Giza", state: "Giza" }, phone: "+20 555 123 4567", description: "Same-day repair for screens, batteries, and software issues.", rating: 4.5, verified: false },
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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-white via-lime-50 to-gray-100'} pt-16`}>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
          
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-md text-lime-700 font-bold leading-tight">
                Find Trusted <span className="underline decoration-lime-500 decoration-4">Shops</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                Verified repair centers & stores near you. Fast, reliable, and rated by real customers.
              </p>

           
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiZap /> 98.9%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer satisfaction</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiUsers /> 500+
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Verified shops</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">4.9 Avg rating PPG</p>
                </div>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="relative w-full h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-teal-100 dark:from-lime-900 dark:to-teal-900 rounded-3xl blur-3xl opacity-50"></div>

                <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 transform-gpu overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-8 bg-lime-500 rounded w-16"></div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="w-8 h-8 bg-lime-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 transform-gpu overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
                        <FiCheck className="text-white text-lg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-3 bg-lime-500 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
                  <div className="p-4">
                    <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <RiStore2Line className="text-white text-2xl" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-10">
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-lime-600 dark:text-lime-400" />
              <input
                type="text"
                placeholder="Search shops by name, location, service, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-5 rounded-2xl text-lg bg-white dark:bg-gray-700 border-2 border-transparent focus:border-lime-500 outline-none transition-all shadow-inner"
              />
            </div>
            {/* <button className="px-10 py-5 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-2xl transition-all hover:scale-105 shadow-lg flex items-center gap-3">
              <FiSearch /> Search
            </button> */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 shadow-xl animate-pulse">
                <div className="flex gap-6">
                  <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-20">
            <FiMapPin className="mx-auto text-7xl text-gray-400 mb-6" />
            <p className="text-2xl text-gray-600 dark:text-gray-300">No shops found matching your search.</p>
            <a href="/explore" className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-lime-600 text-white rounded-2xl font-bold hover:bg-lime-700 transition hover:scale-105">
              <FiHome /> Explore All Shops
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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