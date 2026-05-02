import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
   FiStar, FiTool, FiMonitor, FiTag, FiDollarSign,
   FiShield, FiCheckCircle, FiShoppingCart,
   FiChevronLeft, FiChevronRight, FiMapPin, FiPhone, FiTruck, FiEye,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Service from './Service';
import '../styles/style.css';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { OffersSlider } from '../components';
import {
   RiBattery2ChargeLine, RiCamera2Line, RiCheckFill, RiCheckLine,
   RiDeviceLine, RiHeadphoneLine, RiPriceTagLine, RiSettings3Line,
   RiShieldCheckLine, RiStarFill, RiVerifiedBadgeLine, RiWaterFlashLine,
   RiStoreLine,
} from 'react-icons/ri';




const WaveBottom = ({ darkMode }) => (
   <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
      <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg"
         className="relative block w-full h-16 md:h-24" preserveAspectRatio="none">
         <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z"
            fill={darkMode ? '#111827' : '#f9fafb'} />
      </svg>
   </div>
);
const WaveTop = ({ darkMode }) => (
   <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
         className="relative block w-full h-12 md:h-20" preserveAspectRatio="none">
         <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z"
            fill={darkMode ? '#111827' : '#f9fafb'} />
      </svg>
   </div>
);




const StatCard = ({ icon, value, label, accent, delay, darkMode }) => (
   <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.93 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.03 }}
      className={`relative group overflow-hidden rounded-2xl p-4 sm:p-5 shadow-xl border transition-all duration-300 ${darkMode ? 'bg-gray-800/80 border-gray-700/60 backdrop-blur-md' : 'bg-white/90 border-gray-100 backdrop-blur-md'
         }`}
   >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
         style={{ boxShadow: `0 0 32px ${accent}44` }} />
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
         style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
         <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
            {icon}
         </div>
         <span className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
      </div>
      <p className={`text-xs font-semibold leading-snug pl-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
   </motion.div>
);




const conditionConfig = {
   New: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
   Used: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
   Refurbished: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
};




const ProductCard = ({ product, darkMode, onAddToCart, index = 0 }) => {
   const [imgLoaded, setImgLoaded] = useState(false);
   const [imgError, setImgError] = useState(false);
   const [cartAdded, setCartAdded] = useState(false);

   const discountedPrice = product.discount
      ? (product.price * (1 - product.discount / 100)).toFixed(2) : null;

   const handleCart = (e) => {
      e.stopPropagation();
      setCartAdded(true);
      onAddToCart(product);
      setTimeout(() => setCartAdded(false), 2000);
   };

   return (
      <motion.div
         initial={{ opacity: 0, y: 28 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
         whileHover={{ y: -5, transition: { duration: 0.22 } }}
         onClick={() => (window.location.href = `/device/${product.id}`)}
         className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer
        transition-shadow duration-300 hover:shadow-2xl h-full ${darkMode
               ? 'bg-gray-800 border border-gray-700/80 shadow-lg shadow-black/20'
               : 'bg-white border border-gray-100 shadow-md shadow-gray-200/60'
            }`}
      >
        
        
        
         {product.discount && (
            <motion.span
               initial={{ scale: 0, rotate: -12 }}
               animate={{ scale: 1, rotate: 0 }}
               transition={{ type: 'spring', stiffness: 400, delay: 0.15 + index * 0.06 }}
               className="absolute top-2.5 left-2.5 z-10 inline-flex items-center
            bg-gradient-to-r from-orange-500 to-rose-500 text-white
            text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md"
            >
               -{product.discount}%
            </motion.span>
         )}

         
         
         <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100
        transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            <button
               onClick={(e) => { e.stopPropagation(); window.location.href = `/device/${product.id}`; }}
               className={`p-1.5 sm:p-2 rounded-xl shadow-lg backdrop-blur-sm transition-colors ${darkMode ? 'bg-gray-900/80 text-gray-200 hover:text-lime-400'
                     : 'bg-white/90 text-gray-600 hover:text-lime-600'
                  }`}
            >
               <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
         </div>

         
         
         <div className={`relative w-full aspect-square overflow-hidden ${darkMode ? 'bg-gray-750/50' : 'bg-gray-50'}`}>
            <AnimatePresence>
               {!imgLoaded && !imgError && (
                  <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                     className={`absolute inset-0 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
               )}
            </AnimatePresence>
            <motion.img
               src={imgError ? '/placeholder.png' : (product.imageUrl || '/placeholder.png')}
               alt={product.name}
               onLoad={() => setImgLoaded(true)}
               onError={() => { setImgError(true); setImgLoaded(true); }}
               initial={{ scale: 1.08, opacity: 0 }}
               animate={imgLoaded ? { scale: 1, opacity: 1 } : {}}
               transition={{ duration: 0.45 }}
               className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-[1.07]
            transition-transform duration-500 ease-out"
            />
         </div>

        
        

         <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5 sm:gap-2">
            <h3 className={`font-semibold text-xs sm:text-sm leading-snug line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'
               }`}>
               {product.name}
            </h3>

            <div className="flex flex-wrap gap-1">
               <span className={`text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${conditionConfig[product.condition] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                  {product.condition || 'Unknown'}
               </span>
               <span className="text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300">
                  {product.categoryName || product.category || 'General'}
               </span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-auto pt-1">
               <span className={`text-base sm:text-lg font-extrabold tracking-tight ${darkMode ? 'text-lime-400' : 'text-lime-700'
                  }`}>
                  EGP {discountedPrice ?? product.price?.toFixed(2)}
               </span>
               {discountedPrice && (
                  <span className={`text-xs line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                     EGP {product.price?.toFixed(2)}
                  </span>
               )}
            </div>

            <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
               {product.description || 'No description available.'}
            </p>

            <motion.button
               whileTap={{ scale: 0.97 }}
               onClick={handleCart}
               className={`mt-1.5 sm:mt-2 w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm
            flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-lime-500
            transition-all duration-200 ${cartAdded
                     ? 'bg-lime-500 text-white border-lime-500'
                     : darkMode
                        ? 'text-lime-400 hover:bg-lime-500 hover:text-white'
                        : 'text-lime-600 hover:bg-lime-500 hover:text-white'
                  }`}
            >
               <AnimatePresence mode="wait">
                  {cartAdded ? (
                     <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1">✓ Added!</motion.span>
                  ) : (
                     <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5">
                        <FiShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add to Cart
                     </motion.span>
                  )}
               </AnimatePresence>
            </motion.button>
         </div>
      </motion.div>
   );
};




const GRADIENTS = [
   'from-lime-500 via-emerald-500 to-teal-600',
   'from-violet-500 via-purple-500 to-indigo-600',
   'from-orange-500 via-amber-500 to-yellow-500',
   'from-pink-500 via-rose-500 to-red-500',
   'from-cyan-500 via-sky-500 to-blue-500',
];
const getGradient = (name = '') => GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];




const ShopCard = memo(({ shop, darkMode, index = 0 }) => (
   <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -5, transition: { duration: 0.22 } }}
      className={`group flex flex-col rounded-2xl overflow-hidden h-full
      transition-shadow duration-300 hover:shadow-2xl ${darkMode
            ? 'bg-gray-800 border border-gray-700/80 shadow-lg shadow-black/20'
            : 'bg-white border border-gray-100 shadow-md shadow-gray-200/60'
         }`}
   >
      
      
      
      <div className="relative overflow-hidden flex-shrink-0">
         <div className={`w-full h-32 sm:h-36 md:h-40 bg-gradient-to-br ${getGradient(shop.name)}
        flex items-center justify-center select-none
        group-hover:scale-105 transition-transform duration-500`}>
            <span className="text-white text-5xl sm:text-6xl font-black drop-shadow-lg">
               {shop.name?.charAt(0).toUpperCase() || 'S'}
            </span>
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
         {shop.verified && (
            <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-emerald-500 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md">
               <RiVerifiedBadgeLine className="w-3 h-3" /> Verified
            </span>
         )}
         <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
            <RiStarFill className="w-3 h-3 text-amber-400" />
            {shop.rating?.toFixed(1) || '4.8'}
         </div>
         {shop.shopType && (
            <div className={`absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm ${darkMode ? 'bg-gray-900/70 text-gray-200' : 'bg-white/80 text-gray-700'
               }`}>
               <RiStoreLine className="w-3 h-3" />{shop.shopType}
            </div>
         )}
      </div>

     
     
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
         <h3 className={`font-bold text-sm sm:text-base leading-tight line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'
            }`}>
            {shop.name || 'Unnamed Shop'}
         </h3>

         {shop.shopAddress && (
            <div className={`flex items-start gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
               <FiMapPin className="w-3.5 h-3.5 text-lime-500 mt-0.5 flex-shrink-0" />
               <span className="line-clamp-1">{[shop.shopAddress.street, shop.shopAddress.city].filter(Boolean).join(', ')}</span>
            </div>
         )}

         <p className={`text-xs leading-relaxed line-clamp-2 flex-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {shop.description || 'Professional repair services with genuine parts and 6-month warranty.'}
         </p>

         {shop.phone && (
            <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
               <FiPhone className="w-3.5 h-3.5 text-lime-500 flex-shrink-0" />
               <a href={`tel:${shop.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-lime-500 transition-colors truncate">
                  {shop.phone}
               </a>
            </div>
         )}

         <div className={`border-t pt-2.5 mt-auto ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <motion.button
               whileTap={{ scale: 0.97 }}
               onClick={() => (window.location.href = `/shops/${shop.id}`)}
               className={`w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm
            flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-lime-500
            transition-colors duration-200 ${darkMode
                     ? 'text-lime-400 hover:bg-lime-500 hover:text-white'
                     : 'text-lime-600 hover:bg-lime-500 hover:text-white'
                  }`}
            >
               <FiTruck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Visit Shop
            </motion.button>
         </div>
      </div>
   </motion.div>
));




const HScrollSection = ({ title, items, darkMode, renderCard, loading, skeletonH = 'h-80 sm:h-[380px]', scrollRef, onLeft, onRight, showLeft, showRight, showArrows }) => (
   <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-10">
            <motion.h2
               initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
               className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide relative inline-block ${darkMode ? 'text-lime-400' : 'text-lime-700'
                  } after:content-[''] after:absolute after:bottom-[-6px] after:left-0
            after:w-full after:h-1 after:bg-gradient-to-r after:from-lime-600 after:to-emerald-500`}
            >
               {title}
            </motion.h2>
            {showArrows && (
               <div className="flex gap-2 sm:gap-3">
                  <button onClick={onLeft} disabled={!showLeft}
                     className={`p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 ${showLeft
                           ? 'bg-white dark:bg-gray-800 hover:bg-lime-50 dark:hover:bg-lime-900 text-lime-700 dark:text-lime-400'
                           : 'bg-gray-100 dark:bg-gray-800 opacity-30 cursor-not-allowed'
                        }`}>
                     <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={onRight} disabled={!showRight}
                     className={`p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 ${showRight
                           ? 'bg-white dark:bg-gray-800 hover:bg-lime-50 dark:hover:bg-lime-900 text-lime-700 dark:text-lime-400'
                           : 'bg-gray-100 dark:bg-gray-800 opacity-30 cursor-not-allowed'
                        }`}>
                     <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
               </div>
            )}
         </div>

         
         

         <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-5 snap-x snap-mandatory scroll-smooth pb-4 sm:pb-6 hide-scrollbar"
         >
            {loading
               ? [...Array(4)].map((_, i) => (
                  <div key={i}
                     className={`snap-start flex-shrink-0 w-[200px] sm:w-[260px] md:w-[280px] lg:w-[300px] ${skeletonH}
                  rounded-2xl animate-pulse shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
               ))
               : items.map((item, i) => (
                  <div key={item.id}
                     className="snap-start flex-shrink-0 w-[200px] sm:w-[260px] md:w-[280px] lg:w-[300px]">
                     {renderCard(item, i)}
                  </div>
               ))
            }
         </div>
      </div>
   </section>
);




const Homepage = memo(({ darkMode }) => {
   const [shops, setShops] = useState([]);
   const [products, setProducts] = useState([]);
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [productsLoading, setProductsLoading] = useState(false);

   const [canScrollLeftShops, setCanScrollLeftShops] = useState(false);
   const [canScrollRightShops, setCanScrollRightShops] = useState(false);
   const [canScrollLeftProds, setCanScrollLeftProds] = useState(false);
   const [canScrollRightProds, setCanScrollRightProds] = useState(false);

   const navigate = useNavigate();
   const shopScrollRef = useRef(null);
   const prodScrollRef = useRef(null);

   useEffect(() => { document.title = 'Home'; }, []);

   const safeDecodeJwt = useCallback((token) => {
      if (!token || typeof token !== 'string' || token.trim() === '') return null;
      try { return jwtDecode(token); } catch { return null; }
   }, []);

   const isTokenExpired = useCallback((token) => {
      const decoded = safeDecodeJwt(token);
      return !decoded || !decoded.exp || decoded.exp < Date.now() / 1000;
   }, [safeDecodeJwt]);

   useEffect(() => {
      const token = localStorage.getItem('authToken');
      if (!token || token.trim() === '') { localStorage.removeItem('authToken'); setIsAuthenticated(false); return; }
      setIsAuthenticated(!isTokenExpired(token));
   }, [isTokenExpired]);

   const fetchShopsAndProducts = useCallback(async () => {
      const controller = new AbortController();
      setProductsLoading(true);
      try {
         const token = localStorage.getItem('authToken');
         if (!token || isTokenExpired(token)) throw new Error('Unauthorized');

         const shopRes = await api.get('/api/users/shops/all', {
            headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
         });
         const shopsWithDevices = (shopRes.data.content || []).map((shop) => ({ ...shop, devices: [], services: shop.services || [] }));
         setShops(shopsWithDevices);

         const productPromises = shopsWithDevices.map((shop) =>
            api.get(`/api/products/shop/${shop.id}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
               .then((res) => ({ shopId: shop.id, products: res.data.content || [] }))
         );
         const productResults = await Promise.all(productPromises);
         const allProducts = productResults.flatMap((r) => r.products);
         setProducts(allProducts.slice(0, 12));

         setShops((prev) => prev.map((shop) => {
            const shopProducts = productResults.find((r) => r.shopId === shop.id)?.products || [];
            return { ...shop, devices: shopProducts };
         }));
      } catch (err) {
         if (err.name !== 'AbortError') {
            if (err.response?.status === 401 || err.message === 'Unauthorized') {
               localStorage.clear(); setIsAuthenticated(false);
               Swal.fire({ icon: 'warning', title: 'Session Expired', text: 'Please log in again', position: 'top-end', toast: true, timer: 2000 })
                  .then(() => navigate('/login'));
            }
         }
      } finally { setProductsLoading(false); }
      return () => controller.abort();
   }, [navigate, isTokenExpired]);

   useEffect(() => { fetchShopsAndProducts(); }, [fetchShopsAndProducts]);

   const handleAddToCart = useCallback(async (product) => {
      try {
         const token = localStorage.getItem('authToken');
         if (!token || isTokenExpired(token)) { Swal.fire({ icon: 'warning', title: 'Please log in' }); navigate('/login'); return; }
         await api.post('/api/cart/items',
            { productId: product.id, quantity: 1, price: product.price, name: product.name, imageUrl: product.image },
            { headers: { Authorization: `Bearer ${token}` } }
         );
         Swal.fire({ icon: 'success', title: 'Added!', text: `${product.name} added to cart!`, toast: true, position: 'top-end', timer: 1500 });
      } catch {
         Swal.fire({ title: 'Error', text: 'Failed to add to cart!', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      }
   }, [navigate, isTokenExpired]);

   
   

   const makeHandler = (ref, setLeft, setRight) => () => {
      if (!ref.current) return;
      const { scrollLeft, clientWidth, scrollWidth } = ref.current;
      setLeft(scrollLeft > 0);
      setRight(scrollLeft + clientWidth < scrollWidth - 2);
   };

   useEffect(() => {
      const ref = prodScrollRef.current;
      if (!ref) return;
      const h = makeHandler(prodScrollRef, setCanScrollLeftProds, setCanScrollRightProds);
      h(); ref.addEventListener('scroll', h); return () => ref.removeEventListener('scroll', h);
   }, [products]);

   useEffect(() => {
      const ref = shopScrollRef.current;
      if (!ref) return;
      const h = makeHandler(shopScrollRef, setCanScrollLeftShops, setCanScrollRightShops);
      h(); ref.addEventListener('scroll', h); return () => ref.removeEventListener('scroll', h);
   }, [shops]);

   const scrollBy = (ref, dir) => {
      if (!ref.current) return;
      const step = ref.current.clientWidth * 0.75;
      ref.current.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
   };

   const showProdArrows = products.length > 3 && (canScrollLeftProds || canScrollRightProds);
   const showShopArrows = shops.length > 3 && (canScrollLeftShops || canScrollRightShops);

   const offers = [
      { icon: <FiMonitor className="h-5 w-5" />, title: '20% off iPhone screen repair' },
      { icon: <FiShield className="h-5 w-5" />, title: 'Laptop battery replacement EGP 499' },
      { icon: <FiCheckCircle className="h-5 w-5" />, title: 'Free diagnostics on any device' },
      { icon: <FiDollarSign className="h-5 w-5" />, title: 'Buy 2 accessories, get 10% off' },
   ];

   const heroStats = [
      { icon: <FiTool size={16} />, value: '75.2%', label: 'Average repair success rate', accent: '#16a34a', delay: 0.15 },
      { icon: <RiCheckLine size={16} />, value: '~20k', label: 'Repairs completed monthly', accent: '#6366f1', delay: 0.25 },
      { icon: <RiStarFill size={16} />, value: '4.5★', label: 'Average user rating', accent: '#f59e0b', delay: 0.35 },
   ];

   return (
      <>
        
        
         <section className={`relative overflow-hidden pt-16 sm:pt-20 pb-28 sm:pb-32 md:pb-40 ${darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
               : 'bg-gradient-to-br from-lime-50 via-white to-emerald-50'
            }`}>
            <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] -top-32 sm:-top-40 -left-16 sm:-left-32 rounded-full blur-3xl opacity-20 bg-lime-400 animate-pulse pointer-events-none" style={{ animationDuration: '5s' }} />
            <div className="absolute w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] top-8 sm:top-10 -right-12 sm:-right-20 rounded-full blur-3xl opacity-15 bg-emerald-500 animate-pulse pointer-events-none" style={{ animationDuration: '7s' }} />
            <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
               style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,#000 39px,#000 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#000 39px,#000 40px)' }} />
            <WaveTop darkMode={darkMode} />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

                 
                  <div className="space-y-6 sm:space-y-8 order-1 lg:order-1 text-center lg:text-left">
                     <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 mt-6 px-4 py-1.5 rounded-full border text-sm font-semibold bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400">
                        <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
                        Trusted by thousands across Egypt
                     </motion.div>

                     <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08]">
                        <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">Repair & Buy</span><br />
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>Devices with</span><br />
                        <span className="relative inline-block" style={{ WebkitTextStroke: darkMode ? '2px #84cc16' : '2px #16a34a', color: 'transparent' }}>Confidence</span>
                     </motion.h1>

                     <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                        className={`text-base sm:text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Find trusted repair shops and purchase refurbished devices at great prices — all in one place.
                     </motion.p>

                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
                        <Link to="/repair" className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-bold text-white text-sm
                  bg-gradient-to-r from-lime-500 to-emerald-600 shadow-lg shadow-lime-500/30 hover:shadow-lime-500/50 hover:-translate-y-0.5 transition-all duration-300">
                           Book a Repair
                        </Link>
                        <Link to="/devices" className={`px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-bold text-sm border-2 transition-all duration-300 hover:-translate-y-0.5 ${darkMode ? 'border-gray-600 text-gray-300 hover:border-lime-500 hover:text-lime-400'
                              : 'border-gray-300 text-gray-700 hover:border-lime-500 hover:text-lime-600'
                           }`}>
                           Browse Devices
                        </Link>
                     </motion.div>

                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 pt-1 sm:pt-2">
                        {heroStats.map((s) => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
                     </div>
                  </div>

                 
                 
                  <div className="relative h-56 sm:h-80 lg:h-[600px] order-1 lg:order-2">
                     <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-125" />
                     <div className="relative w-full h-full">
                        <motion.div initial={{ opacity: 0, rotate: 8, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }}
                           transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 4, scale: 1.04 }}
                           className={`absolute top-2 sm:top-10 left-2 sm:left-10 w-28 sm:w-44 md:w-52 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                              }`}>
                           <div className="h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
                           <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
                              <div className={`h-2 sm:h-3 rounded w-12 sm:w-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                              <div className={`h-2 sm:h-3 rounded w-20 sm:w-32 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                              <div className="h-5 sm:h-8 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-lg sm:rounded-xl w-10 sm:w-16" />
                              <div className="flex gap-1.5 sm:gap-2">
                                 <div className={`w-5 sm:w-8 h-5 sm:h-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                                 <div className="w-5 sm:w-8 h-5 sm:h-8 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full" />
                              </div>
                           </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, rotate: -4, y: 20 }} animate={{ opacity: 1, rotate: -6, y: 0 }}
                           transition={{ duration: 0.8, delay: 0.35 }} whileHover={{ rotate: -2, scale: 1.04 }}
                           className={`absolute bottom-2 sm:bottom-10 right-2 sm:right-10 w-32 sm:w-48 md:w-56 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                              }`}>
                           <div className="h-1 bg-gradient-to-r from-indigo-400 to-purple-500" />
                           <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-4">
                              <div className="flex justify-between items-center">
                                 <div className={`h-2.5 sm:h-4 rounded w-16 sm:w-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                 <div className="w-7 sm:w-10 h-7 sm:h-10  rounded-full sm:rounded-xl flex items-center justify-center">
                                    <FiTool className="text-purple-500 text-xs sm:text-lg" />
                                 </div>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                 <div className={`h-2 sm:h-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                 <div className={`h-2 sm:h-3 rounded w-5/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                 <div className="h-2 sm:h-3 rounded bg-gradient-to-r from-lime-400 to-emerald-400 w-1/2" />
                              </div>
                              <div className="flex gap-0.5 sm:gap-1">
                                 {[...Array(5)].map((_, i) => (
                                    <RiStarFill key={i} className={i < 4 ? 'text-amber-400 w-3 h-3 sm:w-4 sm:h-4' : 'text-gray-300 w-3 h-3 sm:w-4 sm:h-4'} />
                                 ))}
                              </div>
                           </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                           transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.07, y: -4 }}
                           className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-24 sm:w-36 md:w-44 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                              }`}>
                           <div className="h-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
                           <div className="p-2.5 sm:p-4">
                              <div className="w-10 sm:w-14 h-10 sm:h-14 rounded-xl sm:rounded-2xl mx-auto mb-2 sm:mb-3 flex items-center justify-center ">
                                 <RiCheckFill className="text-emerald-500 text-base sm:text-2xl" />
                              </div>
                              <div className={`h-2 sm:h-3 rounded w-full mb-1.5 sm:mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                              <div className={`h-2 sm:h-3 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                              <div className="mt-2 sm:mt-3 text-center"><span className="text-[10px] sm:text-xs font-bold text-emerald-500">Verified</span></div>
                           </div>
                        </motion.div>

                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                           className="absolute top-1/4 right-2 sm:right-4 z-20 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl">
                           🔧 Expert Certified
                        </motion.div>
                     </div>
                  </div>
               </div>
            </div>
            <WaveBottom darkMode={darkMode} />
         </section>

         
         
         <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
               <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }} viewport={{ once: true }}
                  className="text-xl sm:text-2xl md:text-4xl text-center mb-8 sm:mb-10 font-extrabold bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent">
                  What would you like to do today?
               </motion.h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
                  
                  
                  <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }} viewport={{ once: true }}>
                     <div className={`h-full rounded-2xl p-5 sm:p-8 shadow-lg flex flex-col transition-all ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border-2'
                        }`}>
                        <Link to="/repair" className="flex flex-col h-full">
                           <div className="text-center mb-6 sm:mb-8">
                              <div className="inline-flex p-4 sm:p-5 rounded-full bg-gray-50 dark:bg-gray-900/30 mb-4 sm:mb-5">
                                 <FiTool className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600 dark:text-white" />
                              </div>
                              <h2 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Repair Device</h2>
                              <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                 Fast and reliable repairs by expert technicians.
                              </p>
                           </div>
                           <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-10">
                              {[
                                 { icon: <RiDeviceLine className="w-7 h-7 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-400" />, label: 'Screen Replacement', from: 'from-emerald-50', to: 'to-emerald-50', dfrom: 'dark:from-emerald-900/40', dto: 'dark:to-emerald-800/30' },
                                 { icon: <RiBattery2ChargeLine className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />, label: 'Battery Replacement', from: 'from-blue-50', to: 'to-blue-100', dfrom: 'dark:from-blue-900/40', dto: 'dark:to-blue-800/30' },
                                 { icon: <RiWaterFlashLine className="w-7 h-7 sm:w-10 sm:h-10 text-cyan-600 dark:text-cyan-400" />, label: 'Water Damage', from: 'from-cyan-50', to: 'to-cyan-100', dfrom: 'dark:from-cyan-900/40', dto: 'dark:to-cyan-800/30' },
                                 { icon: <RiSettings3Line className="w-7 h-7 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />, label: 'Software Issues', from: 'from-purple-50', to: 'to-purple-100', dfrom: 'dark:from-purple-900/40', dto: 'dark:to-purple-800/30' },
                              ].map(({ icon, label, from, to, dfrom, dto }) => (
                                 <div key={label} className="flex flex-col items-center text-center group">
                                    <div className={`w-14 h-14 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br ${from} ${to} ${dfrom} ${dto} rounded-xl sm:rounded-2xl mb-2 sm:mb-3 flex items-center justify-center transition-transform group-hover:scale-110`}>
                                       {icon}
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                                 </div>
                              ))}
                           </div>
                           <button className="mt-auto  px-6 sm:px-8 py-3 sm:py-4 font-bold text-center text-gray-800 bg-white/60 backdrop-blur-xl border-2  rounded-xl sm:rounded-2xl  hover:shadow-lg transition-all duration-300 dark:text-gray-100 dark:bg-gray-900/40 dark:border-gray-700/40 text-sm sm:text-base">
                              Book a Repair
                           </button>
                        </Link>
                     </div>
                  </motion.div>

                
                

                  <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }} viewport={{ once: true }}>
                     <div className={`h-full rounded-2xl p-5 sm:p-8 shadow-lg flex flex-col transition-all ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border-2'
                        }`}>
                        <div className="text-center mb-6 sm:mb-8">
                           <div className="inline-flex p-4 sm:p-5 rounded-full bg-gray-50 dark:bg-gray-900/30 mb-4 sm:mb-5">
                              <RiPriceTagLine className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600 dark:text-white" />
                           </div>
                           <h2 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Latest Offers</h2>
                           <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Exclusive deals on repairs and premium devices.
                           </p>
                        </div>
                        <ul className="space-y-3 flex-1 mb-6 sm:mb-10">
                           {offers.map((offer, i) => (
                              <li key={i} className={`p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4 transition-all hover:translate-x-2 ${darkMode ? 'bg-gray-700/60 text-gray-100 hover:bg-gray-600/70' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                                 }`}>
                                 <div className="p-2 sm:p-3 rounded-lg bg-gray-200 dark:bg-lime-900/40 flex-shrink-0">
                                    {React.cloneElement(offer.icon, { className: 'w-4 h-4 sm:w-6 sm:h-6 text-gray-600 dark:text-lime-400' })}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="font-semibold text-sm sm:text-base truncate">{offer.title}</p>
                                    <p className="text-xs opacity-70">Limited time offer</p>
                                 </div>
                              </li>
                           ))}
                        </ul>
                        <Link to="/offers" className="px-6 sm:px-8 py-3 sm:py-4 font-bold text-gray-800 text-center bg-white/60 backdrop-blur-xl border-2 rounded-xl sm:rounded-2xl  hover:shadow-lg transition-all duration-300 dark:text-gray-100 dark:bg-gray-900/40 dark:border-gray-700/40 text-sm sm:text-base">
                           View Offers
                        </Link>
                     </div>
                  </motion.div>
               </div>
            </div>
         </section>

       
       

         <Service darkMode={darkMode} />

   
   

         <HScrollSection
            title="Featured Products"
            items={products}
            darkMode={darkMode}
            loading={productsLoading}
            skeletonH="h-[340px] sm:h-[400px] md:h-[430px]"
            scrollRef={prodScrollRef}
            onLeft={() => scrollBy(prodScrollRef, 'left')}
            onRight={() => scrollBy(prodScrollRef, 'right')}
            showLeft={canScrollLeftProds}
            showRight={canScrollRightProds}
            showArrows={showProdArrows}
            renderCard={(p, i) => (
               <ProductCard product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
            )}
         />

        
        
        
         <HScrollSection
            title="Top Shops"
            items={shops}
            darkMode={darkMode}
            loading={productsLoading}
            skeletonH="h-[280px] sm:h-[340px] md:h-[360px]"
            scrollRef={shopScrollRef}
            onLeft={() => scrollBy(shopScrollRef, 'left')}
            onRight={() => scrollBy(shopScrollRef, 'right')}
            showLeft={canScrollLeftShops}
            showRight={canScrollRightShops}
            showArrows={showShopArrows}
            renderCard={(shop, i) => (
               <ShopCard shop={shop} darkMode={darkMode} index={i} />
            )}
         />

         <OffersSlider darkMode={darkMode} />
      </>
   );
});

export default Homepage;