import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiStar,
  FiTool,
  FiShoppingBag,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingCart,
  FiSmartphone,
  FiMapPin,
  FiMonitor,
  FiPhone,
  FiTag,
  FiDollarSign,
  FiShield,
  FiClock,
  FiX,
  FiSearch,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import Service from './Service';
import '../styles/style.css';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { OffersSlider } from '../components';

const Homepage = memo(({ darkMode }) => {
  /* ------------------------------------------------------------------ */
  /*  STATE & REFS                                                     */
  /* ------------------------------------------------------------------ */
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [imageLoading, setImageLoading] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const navigate = useNavigate();
  const shopScrollRef = useRef(null);

  /* ------------------------------------------------------------------ */
  /*  SAFE JWT DECODE                                                  */
  /* ------------------------------------------------------------------ */
  const safeDecodeJwt = useCallback((token) => {
    if (!token || typeof token !== 'string' || token.trim() === '') return null;
    try { return jwtDecode(token); } catch (error) {
      console.warn('Invalid JWT token:', error.message);
      return null;
    }
  }, []);

  const isTokenExpired = useCallback((token) => {
    const decoded = safeDecodeJwt(token);
    if (!decoded) return true;
    return !decoded.exp || decoded.exp < Date.now() / 1000;
  }, [safeDecodeJwt]);

  /* ------------------------------------------------------------------ */
  /*  AUTH CHECK                                                       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || token.trim() === '') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(!isTokenExpired(token));
  }, [isTokenExpired]);

  /* ------------------------------------------------------------------ */
  /*  FETCH SHOPS & PRODUCTS                                           */
  /* ------------------------------------------------------------------ */
  const fetchShopsAndProducts = useCallback(async () => {
    const controller = new AbortController();
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token || isTokenExpired(token)) throw new Error('Unauthorized');

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
      const allProducts = productResults.flatMap((r) => r.products);
      setProducts(allProducts.slice(0, 6));

      setShops((prev) =>
        prev.map((shop) => {
          const shopProducts = productResults.find((r) => r.shopId === shop.id)?.products || [];
          return { ...shop, devices: shopProducts };
        })
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching shops/products:', err.response?.data || err.message);
        if (err.response?.status === 401 || err.message === 'Unauthorized') {
          localStorage.clear();
          setIsAuthenticated(false);
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Please log in again',
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
          }).then(() => navigate('/login'));
        }
      }
    } finally {
      setProductsLoading(false);
    }
    return () => controller.abort();
  }, [navigate, darkMode, isTokenExpired]);

  useEffect(() => { fetchShopsAndProducts(); }, [fetchShopsAndProducts]);

  /* ------------------------------------------------------------------ */
  /*  IMAGE LOADING                                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (products.length) {
      const init = {};
      products.forEach((p) => (init[p.id] = true));
      setImageLoading(init);
    }
  }, [products]);

  const handleImageLoad = (id) => setImageLoading((prev) => ({ ...prev, [id]: false }));
  const handleImageError = (id) => setImageLoading((prev) => ({ ...prev, [id]: false }));

  /* ------------------------------------------------------------------ */
  /*  ADD TO CART                                                      */
  /* ------------------------------------------------------------------ */
  const handleAddToCart = useCallback(async (product) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || isTokenExpired(token)) {
        Swal.fire({ icon: 'warning', title: 'Please log in' });
        navigate('/login');
        return;
      }

      await api.post('/api/cart/items', {
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        imageUrl: product.image,
      }, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: `${product.name} added to cart!`,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to add to cart!', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [darkMode, navigate, isTokenExpired]);

  /* ------------------------------------------------------------------ */
  /*  SCROLL SHOPS                                                     */
  /* ------------------------------------------------------------------ */
  const scrollShops = useCallback((direction) => {
    if (shopScrollRef.current) {
      const { scrollLeft, clientWidth } = shopScrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      shopScrollRef.current.scrollTo({ left: scrollLeft + scrollAmount, behavior: 'smooth' });
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  SEARCH LOGIC                                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!heroSearchQuery.trim()) {
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
        ...shops
          .filter((shop) =>
            shop.name.toLowerCase().includes(heroSearchQuery.toLowerCase()) ||
            (shop.location || '').toLowerCase().includes(heroSearchQuery.toLowerCase())
          )
          .map((shop) => ({ ...shop, type: 'shop' })),
        ...devices.filter((device) =>
          device.name.toLowerCase().includes(heroSearchQuery.toLowerCase()) ||
          (device.category || '').toLowerCase().includes(heroSearchQuery.toLowerCase())
        ),
      ];

      setSearchResults(results);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [heroSearchQuery, shops]);

  const heroHandleSearch = useCallback((e) => { e.preventDefault(); }, []);

  /* ------------------------------------------------------------------ */
  /*  STARS & STOCK                                                    */
  /* ------------------------------------------------------------------ */
  const renderStars = useCallback((rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={`text-yellow-500 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
      />
    ));
  }, []);

  const stockStatus = (stock) => {
    if (stock === 0) return { class: 'bg-red-100 text-red-700', label: 'Out of Stock' };
    if (stock <= 5) return { class: 'bg-yellow-100 text-yellow-700', label: `Low: ${stock}` };
    return { class: 'bg-green-100 text-green-700', label: 'In Stock' };
  };

  /* ------------------------------------------------------------------ */
  /*  OFFERS DATA                                                      */
  /* ------------------------------------------------------------------ */
  const offers = [
    { icon: <FiMonitor className="h-5 w-5" />, title: '20% off iPhone screen repair' },
    { icon: <FiShield className="h-5 w-5" />, title: 'Laptop battery replacement EGP 499' },
    { icon: <FiSmartphone className="h-5 w-5" />, title: 'Free diagnostics on any device' },
    { icon: <FiDollarSign className="h-5 w-5" />, title: 'Buy 2 accessories, get 10% off' },
  ];

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                           */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* ==================== HERO - MONOTREE STYLE ==================== */}
      <section className="relative overflow-hidden py-32">
        {/* Gradient Background */}
        <div
          className={`absolute inset-0 ${
            darkMode
              ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700"
              : "bg-gradient-to-br from-white via-lime-50 to-gray-100"
          }`}
        />

        {/* Wave */}
        <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320" aria-hidden="true">
          <path
            fill={darkMode ? "#1f2937" : "#f3f4f6"}
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Floating Repair Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FiSmartphone className={`absolute top-16 left-12 w-14 h-14 ${darkMode ? 'text-lime-400' : 'text-lime-600'} animate-float-slow opacity-70`} />
          <FiTool className={`absolute top-24 right-16 w-12 h-12 ${darkMode ? 'text-lime-500' : 'text-lime-700'} animate-float-medium opacity-60`} />
          <FiShoppingBag className={`absolute bottom-32 left-20 w-10 h-10 ${darkMode ? 'text-gray-400' : 'text-gray-700'} animate-float-fast opacity-60`} />
          <FiMonitor className={`absolute bottom-24 right-20 w-16 h-16 ${darkMode ? 'text-lime-400' : 'text-lime-600'} animate-float-slow opacity-70`} />
          {/* <FiShield className={`absolute top-1/3 left-1/4 w-11 h-11 ${darkMode ? 'text-gray-300' : 'text-gray-600'} animate-float-medium opacity-60`} /> */}
        
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
          {/* Left: Text */}
          <div>
            <h1 className={`text-5xl sm:text-6xl font-extrabold drop-shadow-md ${darkMode ? 'text-lime-400' : 'text-lime-700'}`}>
              Repair & Buy Devices with Confidence
            </h1>
            <p className={`mt-6 text-xl max-w-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Find trusted repair shops and purchase refurbished devices at great prices.
            </p>

            {/* CTA Form */}
            {/* <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className={`px-5 py-3 rounded-full border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-lime-500`}
              />
              <button className="px-6 py-3 bg-lime-600 text-white font-semibold rounded-full hover:bg-lime-700 transition shadow-lg">
                Get Started
              </button>
            </div> */}

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-8 text-center">
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>75.2%</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average repair success rate</p>
              </div>
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>~20k</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Repairs completed monthly</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={i < 4 ? (darkMode ? 'text-lime-400' : 'text-lime-600') : 'text-gray-400'} />
              ))}
              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>4.5 Average user rating</span>
            </div>
          </div>

          {/* Right: 3D Floating Devices */}
          <div className="relative h-96 lg:h-full flex justify-center items-center">
            <div className="relative w-72 h-96">
              {/* Main Phone */}
              <div className="absolute top-10 left-12 w-44 h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl shadow-2xl transform rotate-12 animate-float-slow border border-gray-300 dark:border-gray-600">
                <div className="p-5">
                  <div className="bg-gray-300 dark:bg-gray-600 h-5 rounded mb-3"></div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-4/5 mb-2"></div>
                  <div className="bg-lime-500 h-10 rounded-lg mt-6 flex items-center justify-center text-white font-bold text-sm">
                    Repair Now
                  </div>
                </div>
              </div>

              {/* Tablet */}
              <div className="absolute bottom-8 right-8 w-52 h-40 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl transform -rotate-6 animate-float-medium border border-gray-200 dark:border-gray-700">
                <div className="p-4 text-xs text-gray-600 dark:text-gray-300">
                  <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded mb-1"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded w-1/2"></div>
                </div>
              </div>

              {/* Fixed Badge */}
              <div className="absolute top-32 left-0 w-28 h-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform -rotate-12 animate-float-fast border border-lime-500">
                <div className="p-3 text-center">
                  <FiTool className="text-lime-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-lime-600">Fixed!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== REPAIR & OFFERS CARDS ==================== */}
      <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-5xl font-extrabold text-center mb-12 ${darkMode ? 'text-lime-400' : 'text-lime-700'}`}
          >
            What would you like to repair today?
          </motion.h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Repair Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={`rounded-2xl p-8 shadow-xl transition-all duration-500 transform hover:scale-105 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <Link to="/repair" className="block">
                  <div className="bg-lime-500/20 p-5 rounded-full w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                    <FiTool className="w-10 h-10 text-lime-500" />
                  </div>
                  <h2 className={`text-2xl font-bold mb-3 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Repair Device
                  </h2>
                  <p className={`text-sm mb-6 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Get your device fixed by <strong>expert technicians</strong> quickly.
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                    {['Screen', 'Battery', 'Water Damage', 'Software'].map((s, i) => (
                      <div key={i} className="flex items-center justify-center gap-2">
                        <div className="bg-lime-100 dark:bg-lime-900/30 p-2 rounded-full">
                          {i === 0 && <FiMonitor className="w-4 h-4 text-lime-600 dark:text-lime-400" />}
                          {i === 1 && <FiShield className="w-4 h-4 text-lime-600 dark:text-lime-400" />}
                          {i === 2 && <FiDollarSign className="w-4 h-4 text-lime-600 dark:text-lime-400" />}
                          {i === 3 && <FiSmartphone className="w-4 h-4 text-lime-600 dark:text-lime-400" />}
                        </div>
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{s}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 rounded-xl transition shadow-lg">
                    Book a Repair
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Offers Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={`rounded-2xl p-8 shadow-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="text-center mb-6">
                  <div className="bg-lime-500/20 p-5 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FiTag className="w-10 h-10 text-lime-500" />
                  </div>
                  <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Latest Offers
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Exclusive discounts on devices & services.
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {offers.map((o, i) => (
                    <li key={i} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="text-lime-500">{o.icon}</div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{o.title}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/offers"
                  className="block text-center bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
                >
                  View Deals
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== OTHER SECTIONS ==================== */}
      <Service darkMode={darkMode} />
      <OffersSlider darkMode={darkMode} />
    </>
  );
});

export default Homepage;