
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiStar, FiTool, FiShoppingBag, FiChevronLeft, FiChevronRight, FiShoppingCart, FiSmartphone, FiMapPin, FiMonitor, FiPhone, FiTag, FiDollarSign, FiShield, FiClock, FiX, FiXSquare, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Service from './Service';
import '../styles/style.css';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { OffersSlider } from '../components';

const Homepage = memo(({ darkMode }) => {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [imageLoadStatus, setImageLoadStatus] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedShop, setExpandedShop] = useState(null);
  const [productsLoading, setProductsLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState({});
  const navigate = useNavigate();
  const shopScrollRef = useRef(null);


  const isTokenExpired = useCallback((token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }, []);


  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  }, [isTokenExpired]);


  const fetchShopsAndProducts = useCallback(async () => {
    const controller = new AbortController();
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const shopRes = await api.get('/api/users/shops/all', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      const shopsWithDevices = (shopRes.data.content || []).map((shop) => ({
        ...shop,
        devices: [],
        services: shop.services || [],
      }));
      setShops(shopsWithDevices);



      const productPromises = shopsWithDevices.map((shop) =>
        api.get(`/api/products/shop/${shop.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }).then((res) => ({
          shopId: shop.id,
          products: res.data.content || [],
        }))
      );

      const productResults = await Promise.all(productPromises);
      const allProducts = productResults.flatMap((result) => result.products);
      setProducts(allProducts.slice(0, 6)); 

      setShops((prev) =>
        prev.map((shop) => {
          const shopProducts = productResults.find((result) => result.shopId === shop.id)?.products || [];
          return { ...shop, devices: shopProducts };
        })
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching shops/products:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Please log in again',
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
          }).then(() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            navigate('/login');
          });
          return;
        }
          Swal.fire({
                         title: 'Error',
                         text: 'could not load shops or products!',
                         icon: 'error',
                         toast: true,
                         position: 'top-end',
                         showConfirmButton: false,
                         timer: 1500,
                       })
      }
    } finally {
      setProductsLoading(false);
    }
    return () => controller.abort();
  }, [navigate, darkMode]);

  useEffect(() => {
    fetchShopsAndProducts();
  }, [fetchShopsAndProducts]);


  // Initialize image loading state for all products
  useEffect(() => {
    if (products && products.length > 0) {
      const initialLoadingState = {};
      products.forEach(product => {
        initialLoadingState[product.id] = true;
      });
      setImageLoading(initialLoadingState);
    }
  }, [products]);

  const handleImageLoad = (productId) => {
    setImageLoading(prev => ({
      ...prev,
      [productId]: false
    }));
  };

  const handleImageError = (productId) => {
    // On error, hide loading and show placeholder or error state
    setImageLoading(prev => ({
      ...prev,
      [productId]: false
    }));
  };
  const handleAddToCart = useCallback(async (product) => {
    try {
      const token = localStorage.getItem('authToken');
      await api.post('/api/cart/items', {
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        imageUrl: product.image,
      }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `${product.name} added to cart!`,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    } catch (error) {
      console.error('Error adding to cart:', error.response?.data || error.message);
        Swal.fire({
                         title: 'Error',
                         text: 'failed to add item to product!',
                         icon: 'error',
                         toast: true,
                         position: 'top-end',
                         showConfirmButton: false,
                         timer: 1500,
                       })
    }
  }, [darkMode]);


  const scrollShops = useCallback((direction) => {
    if (shopScrollRef.current) {
      const { scrollLeft, clientWidth } = shopScrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      shopScrollRef.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

 
  const filteredShops = shops.filter((shop) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      shop.name.toLowerCase().includes(query) ||
      shop.services.some((service) => service.toLowerCase().includes(query)) ||
      shop.devices.some((device) => device.name.toLowerCase().includes(query))
    );
  });

 
  useEffect(() => {
    if (heroSearchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      const devices = shops.flatMap((shop) =>
        (shop.devices || []).map((device) => ({
          ...device,
          shopName: shop.name,
          type: 'device',
        }))
      );

      const results = [
        ...shops.filter(
          (shop) =>
            shop.name.toLowerCase().includes(heroSearchQuery.toLowerCase()) ||
            (shop.location || '').toLowerCase().includes(heroSearchQuery.toLowerCase())
        ).map((shop) => ({ ...shop, type: 'shop' })),
        ...devices.filter(
          (device) =>
            device.name.toLowerCase().includes(heroSearchQuery.toLowerCase()) ||
            (device.category || '').toLowerCase().includes(heroSearchQuery.toLowerCase())
        ),
      ];

      setSearchResults(results);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [heroSearchQuery, shops]);

  const heroHandleSearch = useCallback((e) => {
    e.preventDefault();
    console.log('Final search:', heroSearchQuery, searchResults);
  }, [heroSearchQuery, searchResults]);

 
  const renderStars = useCallback((rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar key={i} className="text-yellow-500" fill={i < Math.floor(rating) ? 'currentColor' : 'none'} />
    ));
  }, []);


  const stockStatus = (stock) => {
    if (stock === 0) return { class: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400', label: 'Out of Stock' };
    if (stock <= 5) return { class: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400', label: `Low Stock: ${stock} left` };
    return { class: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400', label: 'In Stock' };
  };

  return (
    <>
     <section
  className={`relative overflow-hidden mt-10 pb-20 ${
    darkMode
      ? 'bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900'
      : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
  }`}
>
  {/* Floating Icons */}
  <div className="absolute inset-0 opacity-20 pointer-events-none">
    <FiTool className="absolute w-16 h-16 sm:w-20 sm:h-20 bottom-1/3 right-1/5 animate-float-medium text-indigo-300 dark:text-indigo-500" />
    <FiShoppingBag className="absolute w-20 h-20 sm:w-24 sm:h-24 top-1/3 right-1/4 animate-float-slow text-indigo-300 dark:text-indigo-500" />
    <FiShoppingBag className="absolute w-12 h-12 sm:w-16 sm:h-16 bottom-1/4 left-1/3 animate-float-fast text-indigo-300 dark:text-indigo-500" />
    <FiSmartphone className="absolute w-16 h-16 sm:w-20 sm:h-20 top-10 left-10 animate-float-medium text-indigo-300 dark:text-indigo-500" />
    <FiSmartphone className="absolute w-24 h-24 sm:w-28 sm:h-28 bottom-20 right-12 sm:right-20 animate-float-slow text-indigo-300 dark:text-indigo-500" />
    <FiShield className="absolute w-14 h-14 sm:w-18 sm:h-18 top-1/2 left-1/4 animate-float-fast text-indigo-300 dark:text-indigo-500" />
  </div>

  {/* Wave Bottom */}
  <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320">
    <path fill={darkMode ? '#111827' : '#ffffff'} d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z" />
  </svg>

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 z-10">
    <div className="text-center">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
        Repair & Buy Devices with Confidence
      </h1>
      <p className="mt-4 text-base sm:text-lg text-white/90 max-w-xl sm:max-w-2xl mx-auto">
        Find trusted repair shops and purchase refurbished devices at great prices.
      </p>
    </div>

    <div className="relative mt-8 max-w-3xl mx-auto">
      <form
        onSubmit={heroHandleSearch}
        className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl p-2 flex flex-wrap justify-center items-center border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search for devices, shops, or services..."
            className="w-full pl-12 pr-12 py-3 bg-transparent text-gray-900 dark:text-white placeholder-white dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl transition"
            value={heroSearchQuery}
            onChange={(e) => setHeroSearchQuery(e.target.value)}
          />
          {heroSearchQuery && (
            <button
              type="button"
              onClick={() => setHeroSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="ml-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition font-medium"
        >
          Search
        </button>
      </form>

      {heroSearchQuery && (
        <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl shadow-2xl max-h-96 overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-300">
              Loading...
            </div>
          ) : searchResults.length > 0 ? (
            <ul className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {searchResults.map((item) => (
                <li
                  key={item.id}
                  className="hover:bg-indigo-100/50 dark:hover:bg-indigo-700/30 transition-colors"
                >
                  <Link
                    to={`/${item.type}/${item.id}`}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {item.category || item.shopName}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500 text-white">
                      {item.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-600 dark:text-gray-300">
              No results found for "{heroSearchQuery}"
            </div>
          )}
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-12">
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-4 sm:p-5 rounded-2xl flex items-center border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <FiTool className="text-2xl sm:text-3xl mr-3 text-white/60 dark:text-indigo-300" />
        <div>
          <h3 className="font-bold text-white dark:text-white">Expert Repairs</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Certified technicians</p>
        </div>
      </div>

      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-4 sm:p-5 rounded-2xl flex items-center border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <FiSmartphone className="text-2xl sm:text-3xl mr-3 text-indigo-400 dark:text-indigo-300" />
        <div>
          <h3 className="font-bold text-white dark:text-white">Quality Devices</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Tested and guaranteed</p>
        </div>
      </div>

      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-4 sm:p-5 rounded-2xl flex items-center border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <FiClock className="text-2xl sm:text-3xl mr-3 text-indigo-400 dark:text-indigo-300" />
        <div>
          <h3 className="font-bold text-white dark:text-white">6 Months Warranty</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">On all repairs</p>
        </div>
      </div>
    </div>
  </div>

  {/* Inline Animations */}
  <style jsx>{`
    @keyframes float {
      0%, 100% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-15px) translateX(8px); }
    }
    @keyframes float-slow {
      0%, 100% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-10px) translateX(-8px); }
    }
    @keyframes float-medium {
      0%, 100% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-12px) translateX(5px); }
    }
    @keyframes float-fast {
      0%, 100% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-8px) translateX(10px); }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
    .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
    .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
  `}</style>
</section>

    <div className={`relative py-16 bg-gradient-to-br ${darkMode ? 'from-indigo-900 via-purple-900 to-gray-900' : 'bg-gray-50'} overflow-hidden`}>
  {/* Subtle Background Pattern */}
  <div className="absolute inset-0 opacity-5 pointer-events-none">
    <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-300 rounded-full blur-3xl"></div>
    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
  </div>

  <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 dark:text-white mb-8">
        What would you like to repair today?
      </h1>
    </motion.div>

    <section className="py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Repair Device Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="group rounded-3xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
        >
          <Link
            to="/repair"
            className={`p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border ${
              darkMode ? 'border-gray-700/30' : 'border-gray-200/50'
            } shadow-xl flex flex-col justify-between h-full hover:bg-white dark:hover:bg-gray-800 transition`}
          >
            <div className="flex items-center justify-center mb-5">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-full shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-14 w-14 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
              Repair Device
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center max-w-xs mx-auto leading-relaxed">
              Get your device fixed by our{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                expert technicians
              </span>{" "}
              quickly and reliably.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm">
              {[
                { name: "Screen Replacement", icon: <FiMonitor className="h-5 w-5" /> },
                { name: "Battery Replacement", icon: <FiShield className="h-5 w-5" /> },
                { name: "Water Damage Fix", icon: <FiDollarSign className="h-5 w-5" /> },
                { name: "Software Issues", icon: <FiSmartphone className="h-5 w-5" /> },
              ].map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <span className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full text-indigo-600 dark:text-indigo-300">
                    {service.icon}
                  </span>
                  <span className="text-xs font-medium">{service.name}</span>
                </div>
              ))}
            </div>

            <button className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition transform hover:-translate-y-1 shadow-md">
              Book a Repair
            </button>
          </Link>
        </motion.div>

        {/* Latest Offers Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="group rounded-3xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
        >
          <div className={`p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border ${
            darkMode ? 'border-gray-700/30' : 'border-gray-200/50'
          } shadow-xl flex flex-col justify-between h-full`}>
            <div className="flex items-center justify-center mb-5">
              <div className="bg-gradient-to-br from-pink-500 to-orange-500 p-5 rounded-full shadow-lg">
                <FiTag size={50} className="text-white" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest Offers
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center max-w-xs mx-auto leading-relaxed mt-2">
                Check out exclusive discounts on devices & services.
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              <li className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-gray-800 dark:text-gray-200 p-3 rounded-xl flex items-center gap-3">
                {/* <span className="text-2xl">Phone</span> */}
                <span className="text-sm font-medium">20% off iPhone screen repair</span>
              </li>
              <li className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-gray-800 dark:text-gray-200 p-3 rounded-xl flex items-center gap-3">
                {/* <span className="text-2xl">Laptop</span> */}
                <span className="text-sm font-medium">Laptop battery replacement EGP 499</span>
              </li>
            </ul>

            <Link
              to="/offers"
              className="mt-8 bg-transparent border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 text-center font-bold py-3 px-5 rounded-xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition transform hover:-translate-y-1"
            >
              View Deals
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  </div>
</div>
      

      <Service darkMode={darkMode} />

<OffersSlider darkMode={darkMode}/>


 {/* <section
      id="latest-devices"
      className={`relative py-16 bg-gradient-to-b ${darkMode ? 'from-gray-900 to-indigo-900' : 'from-blue-600 to-indigo-600'} text-white overflow-hidden`}
    >
   
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-24 h-24 bg-indigo-400 opacity-20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-blue-400 opacity-20 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-10 left-1/3 w-16 h-16 bg-indigo-300 opacity-30 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-1/4 w-20 h-20 bg-blue-300 opacity-20 rounded-full animate-float-slow"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Latest Devices
          </h2>
          <p className="text-white/90 mt-3 max-w-2xl mx-auto text-lg">
            Discover the newest arrivals in refurbished and pre-owned devices
          </p>
        </motion.div>

        {!isAuthenticated ? (
          <div className="text-center py-12 bg-white/10 dark:bg-gray-800/10 rounded-3xl shadow-lg backdrop-blur-md border border-white/20 dark:border-gray-700/20">
            <h3 className="text-xl font-semibold text-white">
              Please Sign In
            </h3>
            <p className="text-white/80 mt-2 max-w-md mx-auto">
              Sign in to view our latest collection of refurbished devices and exclusive offers.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-500 transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </div>
        ) : productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white/10 dark:bg-gray-800/10 rounded-3xl shadow-lg p-6 animate-pulse backdrop-blur-md border border-white/20 dark:border-gray-700/20"
              >
                <div className="relative w-full h-48 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 animate-pulse"></div>
                <div className="mt-4 space-y-3">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white/10 dark:bg-gray-800/10 rounded-3xl shadow-lg backdrop-blur-md border border-white/20 dark:border-gray-700/20">
            <h3 className="text-xl font-semibold text-white">
              No Devices Available
            </h3>
            <p className="text-white/80 mt-2 max-w-md mx-auto">
              Our inventory is currently empty. Check back soon for new arrivals!
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-500 transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Explore Shop
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const { class: stockClass, label: stockLabel } = stockStatus(
                product.stock || 0
              );
              const isImageLoading = imageLoading[product.id] || false;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  viewport={{ once: true }}
                  onClick={() => !isImageLoading && navigate(`/device/${product.id}`)}
                  className="group rounded-3xl bg-white/10 dark:bg-gray-800/10 overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-md border border-white/20 dark:border-gray-700/20"
                >
                  <div className="relative w-full h-48">
          
                    {isImageLoading && (
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/80 to-blue-600/80 backdrop-blur-sm flex items-center justify-center rounded-t-3xl z-10 animate-pulse">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-white/20 rounded-full animate-spin border-2 border-white/30 border-t-white mb-2"></div>
                          <span className="text-white/80 text-sm"></span>
                        </div>
                      </div>
                    )}
                    
                 
                    <img
                      src={
                        product.imageUrl ||
                        "https://via.placeholder.com/400x250?text=Device+Image"
                      }
                      alt={product.name}
                      loading="lazy"
                      className={`w-full h-48 object-cover rounded-t-3xl transition-all duration-500 ${
                        isImageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={() => handleImageLoad(product.id)}
                      onError={() => handleImageError(product.id)}
                    />
                    
                    
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full z-20 ${stockClass}`}
                    >
                      {stockLabel}
                    </span>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1 justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-lg font-bold text-white line-clamp-1">
                        {product.name}
                      </h2>
                      <span className="text-sm text-white/80">
                        {product.categoryName}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 line-clamp-2 mb-4">
                      {product.description || "No description available"}
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-white bg-indigo-600 px-4 py-1 rounded-full">
                        {product.price.toFixed(2)} EGP
                      </span>
                      <span
                        className={`px-2 py-1 text-xs flex items-center gap-2 rounded-full ${
                          product.condition === "NEW"
                            ? "bg-green-100/20 dark:bg-green-900/20 text-green-300"
                            : "bg-yellow-100/20 dark:bg-yellow-900/20 text-yellow-300"
                        }`}
                      >
                        <FiTag /> {product.condition}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      {product.stock > 0 ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={isImageLoading}
                          className="flex-1 px-4 py-2 bg-white dark:bg-gray-950 dark:border-gray-700 text-indigo-600 font-semibold rounded-xl  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          <FiShoppingCart /> Add to Cart
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 px-4 py-2 bg-gray-400/50 text-white font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <FiXSquare /> Out of Stock
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

   
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-20px) translateX(10px); }
            100% { transform: translateY(0) translateX(0); }
          }
          @keyframes float-slow {
            0% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-15px) translateX(-10px); }
            100% { transform: translateY(0) translateX(0); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-float-slow {
            animation: float-slow 8s ease-in-out infinite;
          }
        `}</style>
      </div>
    </section> */}
    </>
  );
});

export default Homepage;
