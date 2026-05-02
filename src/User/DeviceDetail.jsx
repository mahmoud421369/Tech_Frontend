import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaShoppingCart } from 'react-icons/fa';
import {
  FiTag, FiStar, FiUsers, FiZap, FiPackage,
  FiSmartphone, FiMonitor, FiTablet, FiHeadphones,
  FiWatch, FiTool, FiChevronLeft as FiChevLeft,
  FiChevronRight as FiChevRight, FiBox, FiRefreshCw, FiShoppingCart,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../api';


const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  .detail-root * { box-sizing: border-box; }
  .detail-root { font-family: 'Outfit', sans-serif; overflow-x: hidden; }
  @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-30px) scale(1.08)} 66%{transform:translate(-15px,20px) scale(0.95)} }
  @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,15px) scale(1.06)} 66%{transform:translate(20px,-20px) scale(0.96)} }
  .blob1 { animation: blob1 9s ease-in-out infinite; }
  .blob2 { animation: blob2 11s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .float-badge { animation: float 3s ease-in-out infinite; }
  .img-thumb { transition: border-color 0.2s, transform 0.2s; }
  .img-thumb:hover { transform: scale(1.04); }
  .add-cart-btn { position: relative; overflow: hidden; transition: all 0.2s; }
  .add-cart-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,#84cc16,#10b981); transform: translateY(100%); transition: transform 0.3s cubic-bezier(.16,1,.3,1); border-radius: inherit; }
  .add-cart-btn:hover::after { transform: translateY(0); }
  .add-cart-btn span, .add-cart-btn svg { position: relative; z-index: 1; transition: color 0.3s; }
  .add-cart-btn:hover span, .add-cart-btn:hover svg { color: #fff !important; }
  .grid-texture {
    background-image:
      repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(0,0,0,0.03) 39px,rgba(0,0,0,0.03) 40px),
      repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(0,0,0,0.03) 39px,rgba(0,0,0,0.03) 40px);
  }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  .skeleton-shimmer { background: linear-gradient(90deg, transparent 25%, rgba(132,204,22,0.08) 50%, transparent 75%); background-size: 200% auto; animation: shimmer 1.8s linear infinite; }
`;




const categoryIcons = {
  Smartphone: FiSmartphone, Laptop: FiMonitor, Tablet: FiTablet,
  Headphones: FiHeadphones, Watch: FiWatch, Accessories: FiTool, default: FiPackage,
};




const WaveBottom = memo(({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="relative block w-full h-12 md:h-20" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z" fill={darkMode ? '#111827' : '#f9fafb'} />
    </svg>
  </div>
));
const WaveTop = memo(({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="relative block w-full h-10 md:h-16" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z" fill={darkMode ? '#111827' : '#f9fafb'} />
    </svg>
  </div>
));




const StatCard = memo(({ icon, value, label, accent, delay, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.45, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -4, scale: 1.03 }}
    className={`relative group overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border transition-all duration-300 ${
      darkMode ? 'bg-gray-800/80 border-gray-700/60 backdrop-blur-md' : 'bg-white/90 border-gray-100 backdrop-blur-md'
    }`}
  >
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
    <div className="flex items-center gap-2 mb-1">
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
        {icon}
      </div>
      <span className="text-base sm:text-xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
    </div>
    <p className={`text-[10px] sm:text-xs font-semibold pl-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
  </motion.div>
));




const RelatedProductCard = memo(({ product, darkMode }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const Icon = categoryIcons[product.categoryName] || categoryIcons.default;

  return (
    <div onClick={() => (window.location.href = `/device/${product.id}`)}
      className={`group rounded-xl sm:rounded-2xl shadow-md cursor-pointer border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${
        darkMode ? 'bg-gray-800 border-gray-700/80' : 'bg-white border-gray-200'
      }`}>
      <div className={`relative p-3 sm:p-4 ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50'}`}>
        {!imgLoaded && (
          <div className={`absolute inset-3 sm:inset-4 flex items-center justify-center rounded-lg sm:rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <Icon className={`w-10 h-10 ${darkMode ? 'text-lime-400' : 'text-lime-600'} opacity-40`} />
          </div>
        )}
        <img src={product.imageUrl || '/placeholder.png'} alt={product.name}
          onLoad={() => setImgLoaded(true)} loading="lazy"
          className={`w-full h-32 sm:h-40 object-contain rounded-lg sm:rounded-xl transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
      </div>
      <div className="p-3 sm:p-4 space-y-1.5">
        <h3 className={`font-bold text-xs sm:text-sm line-clamp-2 leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
        <p className={`text-[10px] sm:text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.brand || product.categoryName}</p>
        <div className="flex items-center justify-between pt-1">
          <span className={`text-sm sm:text-base font-extrabold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>EGP {product.price?.toLocaleString()}</span>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold ${
            product.condition === 'NEW' ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300'
          }`}>{product.condition}</span>
        </div>
      </div>
    </div>
  );
});




const RelatedSection = memo(({ title, icon: Icon, products, darkMode, currentPage, setCurrentPage, totalPages }) => {
  if (!products.length) return null;
  return (
    <div className="mt-10 sm:mt-16">
      <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div className={`p-2.5 sm:p-3 rounded-xl shadow-md ${darkMode ? 'bg-lime-900/30' : 'bg-lime-50'}`}>
          <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${darkMode ? 'text-lime-400' : 'text-lime-600'}`} />
        </div>
        <h2 className={`text-lg sm:text-2xl font-extrabold relative inline-block ${darkMode ? 'text-lime-400' : 'text-lime-600'} after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-lime-600 after:to-emerald-500`}>
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => <RelatedProductCard key={p.id} product={p} darkMode={darkMode} />)}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-3 mt-6 sm:mt-8">
          <button onClick={() => setCurrentPage((v) => Math.max(1, v - 1))} disabled={currentPage === 1}
            className={`p-2 sm:p-2.5 rounded-xl border shadow-sm disabled:opacity-40 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-lime-50'}`}>
            <FiChevLeft className="w-4 h-4 sm:w-5 sm:h-5 text-lime-600" />
          </button>
          <span className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => setCurrentPage((v) => Math.min(totalPages, v + 1))} disabled={currentPage === totalPages}
            className={`p-2 sm:p-2.5 rounded-xl border shadow-sm disabled:opacity-40 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-lime-50'}`}>
            <FiChevRight className="w-4 h-4 sm:w-5 sm:h-5 text-lime-600" />
          </button>
        </div>
      )}
    </div>
  );
});




const DeviceDetail = memo(({ addToCart, darkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [catPage, setCatPage] = useState(1);
  const [condPage, setCondPage] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const itemsPerPage = 8;

  useEffect(() => {
    if (product?.name) document.title = `${product.name} | TechBazaar`;
  }, [product?.name]);

  const fetchProductAndAll = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, allRes] = await Promise.all([
        api.get(`/api/products/${id}`),
        api.get('/api/products'),
      ]);
      const cur = prodRes.data;
      setProduct(cur);
      const all = allRes.data.content || allRes.data || [];
      setAllProducts(all.filter((p) => p.id !== cur.id));
    } catch {
      setProduct(null);
      Swal.fire({ title: 'Error', text: 'Product not found', icon: 'error', toast: true, position: 'top-end', timer: 2000 });
    } finally { setLoading(false); }
  }, [id]);

  const handleAddToCart = useCallback(async () => {
    setAddingToCart(true);
    try {
      await api.post('/api/cart/items', {
        productId: product.id, quantity,
        price: product.price, name: product.name,
        imageUrl: product.imageUrl || product.imageUrls?.[0],
      });
      addToCart?.({ ...product, quantity });
      Swal.fire({ icon: 'success', title: 'Added to cart!', toast: true, position: 'top-end', timer: 1800, timerProgressBar: true });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to add to cart', toast: true, position: 'top-end', timer: 2000 });
    } finally { setAddingToCart(false); }
  }, [addToCart, product, quantity]);

  const handleQuantityChange = useCallback((delta) => {
    const n = quantity + delta;
    if (n >= 1 && n <= (product?.stock || 1)) setQuantity(n);
  }, [quantity, product?.stock]);

  useEffect(() => { fetchProductAndAll(); }, [fetchProductAndAll]);

  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className={`detail-root min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <section className={`relative overflow-hidden pt-14 sm:pt-16 pb-24 sm:pb-28 ${darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-lime-50 via-white to-emerald-50'}`}>
          <WaveTop darkMode={darkMode} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-center">
              <div className="space-y-4">
                <div className={`h-10 sm:h-12 w-3/4 rounded-2xl animate-pulse skeleton-shimmer ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className={`h-5 sm:h-6 w-1/2 rounded-xl animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[...Array(3)].map((_, i) => <div key={i} className={`h-16 sm:h-20 rounded-xl sm:rounded-2xl animate-pulse skeleton-shimmer ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />)}
                </div>
              </div>
              <div className={`hidden md:block h-56 sm:h-72 rounded-2xl sm:rounded-3xl animate-pulse skeleton-shimmer ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
            </div>
          </div>
          <WaveBottom darkMode={darkMode} />
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className={`rounded-xl sm:rounded-2xl border shadow-xl p-5 sm:p-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className={`h-56 sm:h-72 sm:h-80 rounded-xl sm:rounded-2xl animate-pulse skeleton-shimmer ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
              <div className="space-y-3 sm:space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className={`h-5 sm:h-6 rounded-xl animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${[80, 50, 70, 40, 90][i]}%` }} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!product) return (
    <>
      <style>{STYLES}</style>
      <div className={`detail-root min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} px-4`}>
        <div className={`text-center space-y-5 p-8 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border max-w-sm sm:max-w-md w-full ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
          <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FiPackage className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Product Not Found</h2>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg text-sm">
            <FaChevronLeft size={11} /> Go Back
          </button>
        </div>
      </div>
    </>
  );

  const sameCategory = allProducts.filter((p) => p.categoryName === product.categoryName || p.categoryId === product.categoryId);
  const sameCondition = allProducts.filter((p) => p.condition === product.condition);
  const paginatedCategory = sameCategory.slice((catPage - 1) * itemsPerPage, catPage * itemsPerPage);
  const paginatedCondition = sameCondition.slice((condPage - 1) * itemsPerPage, condPage * itemsPerPage);
  const catPages = Math.ceil(sameCategory.length / itemsPerPage);
  const condPages = Math.ceil(sameCondition.length / itemsPerPage);
  const CategoryIcon = categoryIcons[product.categoryName] || FiBox;
  const ConditionIcon = product.condition === 'NEW' ? FiPackage : FiRefreshCw;

  const heroStats = [
    { icon: <FiZap size={13} />, value: '99.9%', label: 'Quality assured', accent: '#0d9488', delay: 0.1 },
    { icon: <FiUsers size={13} />, value: '10K+', label: 'Happy buyers', accent: '#3b82f6', delay: 0.2 },
    { icon: <FiStar size={13} />, value: '4.9★', label: 'Avg rating', accent: '#f59e0b', delay: 0.3 },
  ];

  const stockStatus = product.stock > 10
    ? { label: 'In Stock', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' }
    : product.stock > 0
    ? { label: `Only ${product.stock} left`, cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' }
    : { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };

  return (
    <>
      <style>{STYLES}</style>
      <div className={`detail-root min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} pb-12 sm:pb-16`}>

       
        <section className={`relative overflow-hidden pt-14 sm:pt-16 pb-24 sm:pb-32 ${
          darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-lime-50 via-white to-emerald-50'
        }`}>
          <div className="blob1 absolute w-64 h-64 sm:w-[400px] sm:h-[400px] -top-24 -left-16 rounded-full blur-3xl opacity-20 bg-lime-400 pointer-events-none" />
          <div className="blob2 absolute w-52 h-52 sm:w-[350px] sm:h-[350px] top-8 -right-12 rounded-full blur-3xl opacity-15 bg-emerald-500 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none grid-texture" />
          <WaveTop darkMode={darkMode} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="space-y-5 sm:space-y-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400">
                  <CategoryIcon size={13} /> {product.categoryName || 'Device'} · {product.condition}
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">{product.name}</span>
                </motion.h1>
                {product.brand && (
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                    className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    by {product.brand} · Premium quality verified
                  </motion.p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pt-1">
                  {heroStats.map((s) => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
                </div>
              </div>

              
              <div className="relative h-52 sm:h-64 lg:h-[360px] hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-300/20 to-emerald-300/20 dark:from-lime-900/15 dark:to-emerald-900/15 rounded-full blur-3xl scale-125" />
                <div className="relative w-full h-full">
                  <motion.div initial={{ opacity: 0, rotate: 10, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 5, scale: 1.04 }}
                    className={`absolute top-6 left-4 w-32 sm:w-40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
                    <div className="p-4 flex flex-col items-center">
                      <CategoryIcon className={`w-12 h-12 mb-2 ${darkMode ? 'text-lime-400' : 'text-lime-600'} opacity-70`} />
                      <div className={`h-2 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.06, y: -4 }}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-28 sm:w-36 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="h-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
                    <div className="p-3 sm:p-4 flex flex-col items-center">
                      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FiZap className="text-lime-400 text-xl" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-lime-500">In Stock ✓</span>
                    </div>
                  </motion.div>
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="float-badge absolute top-1/4 right-4 z-20 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl">
                    📦 Fast Delivery
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
          <WaveBottom darkMode={darkMode} />
        </section>

        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <button onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold mb-5 sm:mb-6 transition-colors ${darkMode ? 'text-gray-400 hover:text-lime-400' : 'text-gray-500 hover:text-lime-600'}`}>
            <FaChevronLeft size={10} /> Back to products
          </button>

          <div className={`rounded-xl sm:rounded-2xl border shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">

               
                <div className="space-y-3 sm:space-y-4">
                  <div className={`rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-4 sm:p-8 min-h-[220px] sm:min-h-[280px] border ${darkMode ? 'bg-gray-900/60 border-gray-700/50' : 'bg-gray-50 border-gray-100'}`}>
                    <img
                      src={product.imageUrls?.[selectedImage] || product.imageUrl || '/placeholder.png'}
                      alt={product.name}
                      className="max-h-[200px] sm:max-h-[260px] max-w-full object-contain rounded-lg sm:rounded-xl hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {product.imageUrls && product.imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {product.imageUrls.map((img, i) => (
                        <button key={i} onClick={() => setSelectedImage(i)}
                          className={`img-thumb flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 ${selectedImage === i ? 'border-lime-500 shadow-md' : darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

               
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h1 className={`text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight mb-2 sm:mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {product.name}
                    </h1>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${stockStatus.cls}`}>{stockStatus.label}</span>
                      <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        <FiTag size={10} /> {product.condition}
                      </span>
                      {product.categoryName && (
                        <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300">
                          {product.categoryName}
                        </span>
                      )}
                    </div>
                  </div>

                  
                  <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-lime-50/60 border-lime-100'}`}>
                    {product.discount ? (
                      <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                        <span className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
                          EGP {(product.price * (1 - product.discount / 100)).toLocaleString()}
                        </span>
                        <span className={`text-sm line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>EGP {product.price?.toLocaleString()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] sm:text-xs font-bold">{product.discount}% OFF</span>
                      </div>
                    ) : (
                      <span className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
                        EGP {product.price?.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{product.description}</p>
                  )}

                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className={`inline-flex items-center rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-900/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition min-w-[40px] sm:min-w-[44px] ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        −
                      </button>
                      <span className={`px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-bold min-w-[44px] sm:min-w-[48px] text-center border-x ${darkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>
                        {quantity}
                      </span>
                      <button onClick={() => handleQuantityChange(1)} disabled={quantity >= (product.stock || 1)}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition min-w-[40px] sm:min-w-[44px] ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        +
                      </button>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddToCart}
                      disabled={product.stock === 0 || addingToCart}
                      className={`add-cart-btn flex-1 w-full sm:w-auto py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl font-bold text-sm border-2 border-lime-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
                      <FiShoppingCart className="w-4 h-4" />
                      <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          <RelatedSection title={`More ${product.categoryName || 'devices'} like this`} icon={CategoryIcon}
            products={paginatedCategory} darkMode={darkMode} currentPage={catPage} setCurrentPage={setCatPage} totalPages={catPages} />
          <RelatedSection title={`Other ${product.condition === 'NEW' ? 'Brand New' : 'Pre-owned'} devices`} icon={ConditionIcon}
            products={paginatedCondition} darkMode={darkMode} currentPage={condPage} setCurrentPage={setCondPage} totalPages={condPages} />
        </div>
      </div>
    </>
  );
});

export default DeviceDetail;