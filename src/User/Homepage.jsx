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
  FiSmartphone,
  FiMonitor,
  FiTag,
  FiDollarSign,
  FiShield,
  FiCheckCircle,
  FiBattery,
  FiRewind,
  FiRefreshCw,
  FiBatteryCharging,
  FiDroplet,
  FiSettings,
  FiZap,
  FiCamera,
  FiHeadphones,
} from 'react-icons/fi';
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
  const [imageLoading, setImageLoading] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const navigate = useNavigate();
  const shopScrollRef = useRef(null);

 
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

  
  useEffect(() => {
    if (products.length) {
      const init = {};
      products.forEach((p) => (init[p.id] = true));
      setImageLoading(init);
    }
  }, [products]);

  const handleImageLoad = (id) => setImageLoading((prev) => ({ ...prev, [id]: false }));
  const handleImageError = (id) => setImageLoading((prev) => ({ ...prev, [id]: false }));


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


  const scrollShops = useCallback((direction) => {
    if (shopScrollRef.current) {
      const { scrollLeft, clientWidth } = shopScrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      shopScrollRef.current.scrollTo({ left: scrollLeft + scrollAmount, behavior: 'smooth' });
    }
  }, []);


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


  const offers = [
    { icon: <FiMonitor className="h-5 w-5" />, title: '20% off iPhone screen repair' },
    { icon: <FiShield className="h-5 w-5" />, title: 'Laptop battery replacement EGP 499' },
    { icon: <FiSmartphone className="h-5 w-5" />, title: 'Free diagnostics on any device' },
    { icon: <FiDollarSign className="h-5 w-5" />, title: 'Buy 2 accessories, get 10% off' },
  ];


  return (
    <>
 
     <section className={`relative overflow-hidden ${darkMode ? 'dark:bg-gray-900' : 'bg-gradient-to-br from-white via-lime-50 to-gray-100'} mt-5 dark:text-white`}>
  <div className="max-w-7xl mx-auto px-6 py-20 mt-6 md:py-24">
    <div className="grid md:grid-cols-2 gap-12 mt-5 items-center">

     
      <div className="space-y-6 mb-6">
        <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-md text-lime-700 dark:text-lime-400 font-bold leading-tight">
          Repair & Buy Devices with <span className="underline decoration-lime-500 decoration-4">Confidence</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
          Find trusted repair shops and purchase refurbished devices at great prices.
        </p>


        <div className="grid grid-cols-3 gap-6 pt-8">
          <div className=' p-4 rounded-xl bg-white dark:bg-gray-950'>
            <div className="text-3xl font-bold text-lime-600 text-center dark:text-lime-400 flex items-center justify-center gap-1">
              <FiTool /> 75.2%
            </div>
            <p className="text-sm text-gray-600 text-center dark:text-gray-400">Average repair success rate</p>
          </div>

          <div className=' p-4 rounded-xl bg-white dark:bg-gray-950'>
            <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-1">
              <FiCheckCircle /> ~20k
            </div>
            <p className="text-sm text-gray-600 text-center dark:text-gray-400">Repairs completed monthly</p>
          </div>

          <div className=' p-4 rounded-xl bg-white dark:bg-gray-950'>
            <div className="flex items-center justify-center gap-3 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <FiStar 
                  key={i} 
                  fill={i < 4.5 ? "currentColor" : "none"} 
                  className={i < 4.5 ? "text-yellow-500" : "text-gray-400"}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 text-center dark:text-gray-400">4.5 Average user rating</p>
          </div>
        </div>
      </div>

      
      <div className="relative hidden md:block">
        <div className="relative w-full h-96">
         
          <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-teal-100 dark:from-lime-900 dark:to-teal-900 rounded-3xl blur-3xl opacity-50"></div>

          
          <div className="absolute top-10 left-12 w-44 h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl shadow-2xl transform rotate-12 animate-float-slow border border-gray-300 dark:border-gray-600">
            <div className="p-5">
              <div className="bg-gray-300 dark:bg-gray-600 h-5 rounded mb-3"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-4/5 mb-2"></div>
              <div className="bg-lime-500 h-10 rounded-lg mt-6 flex items-center justify-center text-white font-bold text-sm">
                Repair Now
              </div>
            </div>
          </div>

         
          <div className="absolute bottom-8 right-8 w-52 h-40 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl transform -rotate-6 animate-float-medium border border-gray-200 dark:border-gray-700">
            <div className="p-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded mb-1"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded w-1/2"></div>
            </div>
          </div>

          
          <div className="absolute top-32 left-0 w-28 h-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform -rotate-12 animate-float-fast border border-lime-500">
            <div className="p-3 text-center">
              <FiTool className="text-lime-600 mx-auto mb-1 text-xl" />
              <p className="text-xs font-bold text-lime-600">Fixed!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
  <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`text-3xl md:text-4xl font-bold text-center mb-12 ${
            darkMode ? 'text-lime-400' : 'text-lime-700'
          }`}
        >
          What would you like to repair today?
        </motion.h1>

    <div className="grid md:grid-cols-2 gap-8">
  
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    viewport={{ once: true }}
    className="h-full"
  >
    <div className={`h-full rounded-2xl p-8 shadow-lg flex flex-col transition-all ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    }`}>
      <Link to="/repair" className="flex flex-col h-full">
        <div className="text-center mb-8">
          <div className="inline-flex p-5 rounded-full bg-lime-100 dark:bg-lime-900/30 mb-5">
            <FiTool className="w-12 h-12 text-lime-600 dark:text-lime-400" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Repair Device
          </h2>
          <p className={`text-base leading-relaxed ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Fast and reliable repairs by expert technicians.
          </p>
        </div>

        
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-lime-50 to-lime-100 dark:from-lime-900/40 dark:to-lime-800/30 rounded-2xl mb-3 flex items-center justify-center transition-transform group-hover:scale-110">
              <FiSmartphone className="w-10 h-10 text-lime-600 dark:text-lime-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Screen Replacement</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/30 rounded-2xl mb-3 flex items-center justify-center transition-transform group-hover:scale-110">
              <FiBatteryCharging className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Battery Replacement</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/40 dark:to-cyan-800/30 rounded-2xl mb-3 flex items-center justify-center transition-transform group-hover:scale-110">
              <FiDroplet className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Water Damage</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/30 rounded-2xl mb-3 flex items-center justify-center transition-transform group-hover:scale-110">
              <FiSettings className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Software Issues</p>
          </div>
        </div>

        <button className="mt-auto w-full bg-lime-600 hover:bg-lime-700 focus:ring-4 focus:ring-lime-300 dark:focus:ring-lime-800 text-white font-bold py-4 rounded-xl transition-all transform hover:translate-y-[-2px] shadow-md">
          Book a Repair Now
        </button>
      </Link>
    </div>
  </motion.div>


  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    viewport={{ once: true }}
    className="h-full"
  >
    <div className={`h-full rounded-2xl p-8 shadow-lg flex flex-col transition-all ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    }`}>
      <div className="text-center mb-8">
        <div className="inline-flex p-5 rounded-full bg-lime-100 dark:bg-lime-900/30 mb-5">
          <FiTag className="w-12 h-12 text-lime-600 dark:text-lime-400" />
        </div>
        <h2 className={`text-2xl font-bold mb-3 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Latest Offers
        </h2>
        <p className={`text-base leading-relaxed ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Exclusive deals on repairs and premium devices.
        </p>
      </div>

      <ul className="space-y-4 flex-1 mb-10">
        {offers.map((offer, i) => (
          <li
            key={i}
            className={`p-4 rounded-xl flex items-center gap-4 transition-all hover:translate-x-2 ${
              darkMode 
                ? 'bg-gray-700/60 text-gray-100 hover:bg-gray-600/70' 
                : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
            }`}
          >
            <div className="p-3 rounded-lg bg-lime-100 dark:bg-lime-900/40">
              {i === 0 && <FiZap className="w-6 h-6 text-lime-600 dark:text-lime-400" />}
              {i === 1 && <FiShield className="w-6 h-6 text-lime-600 dark:text-lime-400" />}
              {i === 2 && <FiHeadphones className="w-6 h-6 text-lime-600 dark:text-lime-400" />}
              {i >= 3 && <FiCamera className="w-6 h-6 text-lime-600 dark:text-lime-400" />}
            </div>
            <div>
              <p className="font-semibold">{offer.title}</p>
              <p className="text-sm opacity-80">{offer.description || 'Limited time offer'}</p>
            </div>
          </li>
        ))}
      </ul>

      <Link
        to="/offers"
        className="block text-center w-full bg-lime-600 hover:bg-lime-700 focus:ring-4 focus:ring-lime-300 dark:focus:ring-lime-800 text-white font-bold py-4 rounded-xl transition-all transform hover:translate-y-[-2px] shadow-md"
      >
        View All Offers
      </Link>
    </div>
  </motion.div>
</div>
      </div>
    </section>

     
      <Service darkMode={darkMode} />
      <OffersSlider darkMode={darkMode} />
    </>
  );
});

export default Homepage;