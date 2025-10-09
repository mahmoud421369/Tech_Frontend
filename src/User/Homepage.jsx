
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiStar, FiTool, FiShoppingBag, FiChevronLeft, FiChevronRight, FiShoppingCart, FiSmartphone, FiMapPin, FiMonitor, FiPhone, FiTag, FiDollarSign, FiShield, FiClock, FiX, FiXSquare } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Service from './Service';
import '../styles/style.css';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

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
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Could not load shops or products',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    } finally {
      setProductsLoading(false);
    }
    return () => controller.abort();
  }, [navigate, darkMode]);

  useEffect(() => {
    fetchShopsAndProducts();
  }, [fetchShopsAndProducts]);


  const handleImageLoad = useCallback((id) => {
    setImageLoadStatus((prev) => ({ ...prev, [id]: true }));
  }, []);


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
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to add item to cart',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
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
        className={`relative mt-10 min-h-80 overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 border-gray-800 text-white'
            : 'bg-white text-gray-900'
        }`}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <FiTool className="absolute w-20 h-20 bottom-1/3 right-1/5 animate-float-medium dark:text-blue-500" />
          <FiShoppingBag className="absolute w-24 h-24 top-1/3 right-1/4 animate-float-slow dark:text-blue-500" />
          <FiShoppingBag className="absolute w-16 h-16 bottom-1/4 left-1/3 animate-float-fast dark:text-blue-500" />
          <FiSmartphone className="absolute w-20 h-20 top-10 left-10 animate-float-medium dark:text-blue-500" />
          <FiSmartphone className="absolute w-28 h-28 bottom-20 right-20 animate-float-slow dark:text-blue-500" />
          <FiMonitor className="absolute w-18 h-18 top-1/2 left-1/4 animate-float-fast dark:text-blue-500" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-32 min-h-screen relative z-10">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Repair & Buy Devices with Confidence
            </h1>
            <p className="text-xl mb-8 text-blue-700 dark:text-blue-100">
              Find trusted repair shops and purchase refurbished devices at great prices
            </p>

            <div className="relative">
              <form
                onSubmit={heroHandleSearch}
                className="bg-white border  dark:border-gray-700 rounded-lg dark:bg-gray-800 shadow-lg p-2 flex flex-wrap justify-center items-center mb-10"
              >
                <input
                  type="text"
                  placeholder="Search for devices, shops, or services..."
                  className="flex-grow px-4 py-3 text-gray-800 dark:text-white dark:bg-gray-800 focus:outline-none cursor-pointer pr-10"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                />
                {heroSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHeroSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <FiX />
                  </button>
                )}
              </form>

              {heroSearchQuery && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {searchResults.map((item) => (
                        <li
                          key={item.id}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Link
                            to={`/${item.type}/${item.id}`}
                            className="p-4 flex justify-between items-center"
                          >
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {item.category || item.shopName}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {item.type}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No results found for "{heroSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-white/10 bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
                <FiTool className="text-3xl mr-3 text-blue-600 dark:text-white" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Expert Repairs</h3>
                  <p className="text-blue-700 dark:text-blue-100">Certified technicians</p>
                </div>
              </div>

              <div className="bg-white dark:bg-white/10 bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
                <FiShoppingBag className="text-3xl mr-3 text-blue-600 dark:text-white" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Quality Devices</h3>
                  <p className="text-blue-700 dark:text-blue-100">Tested and guaranteed</p>
                </div>
              </div>

              <div className="bg-white dark:bg-white/10 bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
                <FiClock className="text-3xl mr-3 text-blue-600 dark:text-white" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">6 Months Warranty</h3>
                  <p className="text-blue-700 dark:text-blue-100">On all repairs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="p-6 bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-center text-blue-500 dark:text-white mb-8">
            What would you like to repair today?
          </h1>
        </motion.div>

        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.3 }}
              className="relative group rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
            >
              <Link
                to="/repair"
                className="p-6 h-auto bg-white dark:bg-gray-950 dark:border-none rounded-2xl border shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-center mb-5">
                  <div className="bg-blue-500 dark:bg-blue-600 text-white p-5 rounded-full shadow-md">
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

                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 text-center mb-3">
                  Repair Device
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-300 text-center max-w-xs mx-auto leading-relaxed">
                  Get your device fixed by our{' '}
                  <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                    expert technicians
                  </span>{' '}
                  quickly and reliably.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm">
                  {[
                    { name: 'Screen Replacement', icon: <FiMonitor className="h-5 w-5" /> },
                    { name: 'Battery Replacement', icon: <FiShield className="h-5 w-5" /> },
                    { name: 'Water Damage Fix', icon: <FiDollarSign className="h-5 w-5" /> },
                    { name: 'Software Issues', icon: <FiSmartphone className="h-5 w-5" /> },
                  ].map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center flex-wrap text-center justify-center dark:text-white gap-2"
                    >
                      <span className="bg-green-100 text-green-600 dark:bg-blue-500 dark:text-white p-2 rounded-full">
                        {service.icon}
                      </span>
                      {service.name}
                    </div>
                  ))}
                </div>

                <button className="mt-6 bg-blue-600 dark:bg-black/80 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700 dark:hover:bg-black transition transform hover:-translate-y-1">
                  Book a Repair
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.3 }}
              className="relative group rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
            >
              <div className="p-6 h-auto bg-white dark:bg-gray-950 dark:border-none rounded-2xl shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-center gap-2 mb-5">
                  <div className="bg-blue-500 dark:bg-blue-600 dark:text-white text-white p-5 rounded-full shadow-md">
                    <FiTag size={50} />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl text-blue-500 dark:text-blue-400 font-bold">
                    Latest Offers
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-300 text-center max-w-xs mx-auto leading-relaxed">
                    Check out exclusive discounts on devices & services.
                  </p>
                </div>

                <ul className="mt-4 space-y-2">
                  <li className="bg-gray-100 dark:bg-black/40 dark:text-white text-gray-800 p-2 rounded">
                    📱 20% off iPhone screen repair
                  </li>
                  <li className="bg-gray-100 dark:bg-black/40 dark:text-white text-gray-800 p-2 rounded">
                    💻 Laptop battery replacement EGP 499
                  </li>
                </ul>

                <Link
                  to="/offers"
                  className="mt-8 bg-transparent border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 text-center font-bold py-3 px-5 rounded-lg hover:bg-blue-700 hover:text-white transition transform hover:-translate-y-1"
                >
                  View Deals
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Service darkMode={darkMode} />

      <section
        id="latest-devices"
        className="py-16 bg-gray-100 dark:bg-gray-900"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
              Latest Devices
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-2xl mx-auto">
              Browse the newest arrivals in refurbished and pre-owned devices
            </p>
          </motion.div>

          {!isAuthenticated ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Please Sign In
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
                Sign in to view our latest collection of refurbished devices and exclusive offers.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all duration-200 transform hover:-translate-y-1"
              >
                Sign In
              </button>
            </div>
          ) : productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
                  <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div className="mt-4 space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                No Devices Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
                Our inventory is currently empty. Check back soon for new arrivals!
              </p>
              <button
                onClick={() => navigate('/shop')}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all duration-200 transform hover:-translate-y-1"
              >
                Explore Shop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const { class: stockClass, label: stockLabel } = stockStatus(product.stock || 0);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    viewport={{ once: true }}
                    onClick={() => navigate(`/device/${product.id}`)}
                    className="group rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                      <div className="relative w-full h-48">
                                      {!imageLoading[product.id] ? null : (
                                        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />
                                      )}
                                      <img
                                        src={product.imageUrl || "https://via.placeholder.com/400x250"}
                                        alt={product.name}
                                        loading="lazy"
                                        className={`w-full h-48 object-cover rounded-t-2xl transition-opacity duration-500 ${
                                          imageLoading[product.id] ? "opacity-0" : "opacity-100"
                                        }`}
                                        onLoad={() => setImageLoading((prev) => ({ ...prev, [product.id]: false }))}
                                      />
                                      <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${stockClass}`}>
                                        {stockLabel}
                                      </span>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1 justify-between">
                                      <div className='flex justify-between items-center'>
                                      <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2 line-clamp-1">
                                        {product.name}
                                      </h2>
                                      <span>{product.categoryName}</span>
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                                        {product.description || "No description available"}
                                      </p>
                                      <div className="flex justify-between items-center mb-3">
                                        <span className="text-lg font-bold text-white bg-indigo-600 px-4 py-1 rounded-full">
                                          {product.price.toFixed(2)} EGP
                                        </span>
                                        <span
                                          className={`px-2 py-1 text-xs flex items-center gap-2 rounded ${
                                            product.condition === "NEW"
                                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
                                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400"
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
                                              handleAddToCart(product);
                                            }}
                                            className="flex-1 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                          >
                                            <FiShoppingCart /> Add to Cart
                                          </button>
                                        ) : (
                                          <button
                                            disabled
                                            className="flex-1 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      </section>
    </>
  );
});

export default Homepage;
