import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiMapPin, FiStar, FiFilter, FiPhone, FiMail, FiCheckCircle, FiTruck } from 'react-icons/fi';
import api from '../api';
import Swal from 'sweetalert2';
import { RiCarLine, RiMotorbikeLine } from 'react-icons/ri';

const ShopCard = ({ shop, darkMode }) => (
  <div className={`group p-6 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
    darkMode ? 'bg-gray-800/40 border border-gray-700/50' : 'bg-white/40 border border-gray-200/50'
  }`}>
    <div className="flex items-start gap-4">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
        {shop.name.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{shop.name}</h3>
          {shop.verified && (
            <FiCheckCircle className="text-green-500" title="Verified Shop" />
          )}
          {/* {!shop.activate && (
            <span className="text-sm text-red-500 font-medium">[Inactive]</span>
          )} */}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{shop.shopType}</p>


       
                  {shop.shopAddress && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                              <FiMapPin />  {shop.shopAddress.street}, {shop.shopAddress.city}, {shop.shopAddress.state}
                            </div>
                          )}
       
        {/* <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
          <FiMail /> {shop.email}
        </p> */}
        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
          <FiPhone /> {shop.phone}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{shop.description}</p>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} className={`w-4 h-4 ${i < Math.floor(shop.rating || 4) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
          ))}
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">({shop.rating})</span>
        </div>
        {/* <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Created: {new Date(shop.createdAt).toLocaleDateString()}
        </p> */}
      </div>
    </div>
    <button
      onClick={() => window.location.href = `/shops/${shop.id}`}
      className="mt-4 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
    >
      Visit Shop
    </button>
  </div>
);

const Shops = ({ darkMode }) => {
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/users/shops/all');
      setShops(res.data.content || []);
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to load shops', icon: 'error', toast: true, position: 'top-end', timer: 2000 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.shopAddress?.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.shopAddress?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.shopType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
      

<section className="relative overflow-hidden pb-6">
              <div
                className={`absolute inset-0 ${darkMode ? "bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900" : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"}`}
              >
                <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320">
                  <path
                    fill={darkMode ? "#111827" : "#ffffff"}
                    d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                  />
                </svg>
              </div>
      
         
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <FiTruck className="absolute top-16 left-10 w-16 h-16 text-white animate-bounce" />
                <RiCarLine className="absolute bottom-20 right-20 w-20 h-20 text-white animate-pulse" />
                <RiMotorbikeLine className="absolute top-1/3 right-1/4 w-14 h-14 text-white animate-ping" />
              </div>
      
              <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
                <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg">
                   Shops 
                </h1>
                <p className="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
         Discover trusted repair shops near you
                </p>
              </div>
            </section>


  
      <div className="max-w-7xl mx-auto px-6 py-8 -mt-16 relative z-10">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search shops by name, location, email, type, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
            {/* <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md">
              <FiFilter /> Filter
            </button> */}
          </div>
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-16">
            <FiMapPin className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No shops found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map(shop => (
              <ShopCard key={shop.id} shop={shop} darkMode={darkMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shops;