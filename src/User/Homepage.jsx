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
  /*  GLASS MORPHISM BACKGROUND                                        */
  /* ------------------------------------------------------------------ */
  const GlassCard = ({ children, className = "" }) => (
    <div
      className={`backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg ${className}`}
    >
      {children}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                           */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* ==================== HERO ==================== */}
      <section
        className={`relative overflow-hidden mt-10 pb-20 ${
          darkMode
            ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900'
            : 'bg-gradient-to-br from-white via-gray-50 to-white'
        }`}
      >
        {/* Glass Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.03) 35px, rgba(255,255,255,.03) 70px),
                                repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255,255,255,.03) 35px, rgba(255,255,255,.03) 70px)`,
              backgroundSize: '70px 70px',
            }}
          />
        </div>

        {/* Floating Neon Icons */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <FiTool className="absolute w-16 h-16 bottom-1/3 right-1/5 animate-float-medium text-lime-400" />
          <FiShoppingBag className="absolute w-20 h-20 top-1/3 right-1/4 animate-float-slow text-lime-500" />
          <FiSmartphone className="absolute w-24 h-24 bottom-20 right-12 animate-float-slow text-lime-400" />
        </div>

        {/* Wave */}
        <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path
            fill={darkMode ? '#111827' : '#f9fafb'}
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z"
          />
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 z-10">
          <div className="text-center">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold drop-shadow-lg ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Repair & Buy Devices with Confidence
            </h1>
            <p className={`mt-4 text-base sm:text-lg max-w-2xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Find trusted repair shops and purchase refurbished devices at great prices.
            </p>
          </div>

          {/* Search Bar - Glass */}
          <div className="relative mt-8 max-w-3xl mx-auto">
            <form onSubmit={heroHandleSearch} className="relative">
              <GlassCard className="!p-2 flex items-center">
                <FiSearch className={`absolute left-6 top-1/2 -translate-y-1/2 ${
                  darkMode ? 'text-lime-400' : 'text-gray-600'
                }`} />
                <input
                  type="text"
                  placeholder="Search devices, shops, or services..."
                  className={`w-full pl-12 pr-12 py-3 bg-transparent ${
                    darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  } focus:outline-none`}
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                />
                {heroSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHeroSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </GlassCard>
            </form>

            {/* Search Dropdown */}
            {heroSearchQuery && (
              <div className="absolute top-full left-0 right-0 z-20 mt-2">
                <GlassCard className="!p-0 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : searchResults.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {searchResults.map((item) => (
                        <li key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                          <Link to={`/${item.type}/${item.id}`} className="p-4 flex justify-between items-center">
                            <div>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-500">{item.category || item.shopName}</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-lime-500 text-white">
                              {item.type}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No results for "{heroSearchQuery}"
                    </div>
                  )}
                </GlassCard>
              </div>
            )}
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {[
              { icon: <FiTool />, title: 'Expert Repairs', desc: 'Certified technicians' },
              { icon: <FiSmartphone />, title: 'Quality Devices', desc: 'Tested & guaranteed' },
              { icon: <FiClock />, title: '6 Months Warranty', desc: 'On all repairs' },
            ].map((f, i) => (
              <GlassCard key={i} className="flex items-center p-4 hover:shadow-xl transition">
                <div className={`p-3 rounded-full ${darkMode ? 'bg-lime-500/20 text-lime-400' : 'bg-lime-100 text-lime-600'}`}>
                  {React.cloneElement(f.icon, { className: 'w-6 h-6' })}
                </div>
                <div className="ml-4">
                  <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{f.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Floating Animations */}
        <style jsx>{`
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
          @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes float-medium { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        `}</style>
      </section>

      {/* ==================== REPAIR & OFFERS CARDS ==================== */}
      <section className={`py-16 ${darkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-5xl font-extrabold text-center mb-12 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
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
              <GlassCard className="!p-8 text-center group hover:scale-105 transition">
                <Link to="/repair" className="block">
                  <div className="bg-lime-500/20 p-5 rounded-full w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                    <FiTool className="w-10 h-10 text-lime-500" />
                  </div>
                  <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Repair Device
                  </h2>
                  <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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

                  <button className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold py-3 rounded-xl transition">
                    Book a Repair
                  </button>
                </Link>
              </GlassCard>
            </motion.div>

            {/* Offers Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="!p-8">
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
                    <li key={i} className="flex items-center gap-3 p-3 bg-white/5 dark:bg-black/20 rounded-xl">
                      <div className="text-lime-500">{o.icon}</div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{o.title}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/offers"
                  className="block text-center bg-lime-500 hover:bg-lime-600 text-white font-bold py-3 rounded-xl transition"
                >
                  View Deals
                </Link>
              </GlassCard>
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