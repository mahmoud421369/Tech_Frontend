import React, { useState, useEffect, useCallback, memo, useTransition } from 'react';
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
import Hero from '../components/Hero';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
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
  .add-cart-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,#34d399,#0d9488); transform: translateY(100%); transition: transform 0.3s cubic-bezier(.16,1,.3,1); border-radius: inherit; }
  .add-cart-btn:hover::after { transform: translateY(0); }
  .add-cart-btn span, .add-cart-btn svg { position: relative; z-index: 1; transition: color 0.3s; }
  .add-cart-btn:hover span, .add-cart-btn:hover svg { color: #fff !important; }
  .grid-texture {
    background-image:
      repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(0,0,0,0.03) 39px,rgba(0,0,0,0.03) 40px),
      repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(0,0,0,0.03) 39px,rgba(0,0,0,0.03) 40px);
  }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  .skeleton-shimmer { background: linear-gradient(90deg, transparent 25%, rgba(16,185,129,0.08) 50%, transparent 75%); background-size: 200% auto; animation: shimmer 1.8s linear infinite; }
`;

const categoryIcons = {
  Smartphone: FiSmartphone, Laptop: FiMonitor, Tablet: FiTablet,
  Headphones: FiHeadphones, Watch: FiWatch, Accessories: FiTool, default: FiPackage,
};

const ProductBackdropIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
    <circle cx="176" cy="20" r="34" fill={darkMode ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)'} />
    <circle cx="14" cy="180" r="26" fill={darkMode ? 'rgba(52,211,153,0.06)' : 'rgba(16,185,129,0.05)'} />
    <circle cx="22" cy="18" r="3" fill={darkMode ? 'rgba(110,231,183,0.4)' : 'rgba(16,185,129,0.25)'} />
    <circle cx="184" cy="150" r="2.4" fill={darkMode ? 'rgba(110,231,183,0.4)' : 'rgba(16,185,129,0.25)'} />
    <circle cx="10" cy="90" r="2" fill={darkMode ? 'rgba(110,231,183,0.35)' : 'rgba(16,185,129,0.2)'} />
  </svg>
));

const QualityBadgeIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M32 10 L48 16 V30 C48 41.5 40.5 49.5 32 53.5 C23.5 49.5 16 41.5 16 30 V16 Z" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.5" />
    <path d="M23 30 L29 36 L42 22" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="10" r="2.4" fill="#fbbf24" />
  </svg>
));

const NotFoundIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 120 100" className="w-24 h-20 sm:w-28 sm:h-24 mx-auto">
    <ellipse cx="60" cy="86" rx="38" ry="6" fill={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
    <path d="M20 40 L60 24 L100 40 L100 74 L60 90 L20 74 Z" fill={darkMode ? '#1f2937' : '#f3f4f6'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M20 40 L60 56 L100 40" fill="none" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M60 56 L60 90" fill="none" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M42 32 L82 48" fill="none" stroke={darkMode ? '#4b5563' : '#d1d5db'} strokeWidth="2" />
    <circle cx="60" cy="16" r="8" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.4" />
    <text x="60" y="20.5" textAnchor="middle" fontSize="11" fontWeight="700" fill={darkMode ? '#34d399' : '#10b981'}>?</text>
  </svg>
));

const DeviceDetailSkeleton = ({ darkMode }) => (
  <div className={`detail-root min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pt-24">
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
);

const RelatedProductCard = memo(({ product, darkMode }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const Icon = categoryIcons[product.categoryName] || categoryIcons.default;

  return (
    <div onClick={() => (window.location.href = `/device/${product.id}`)}
      className={`group rounded-xl sm:rounded-2xl shadow-md cursor-pointer border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700/80' : 'bg-white border-gray-200'
        }`}>
      <div className={`relative p-3 sm:p-4 ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50'}`}>
        {!imgLoaded && (
          <div className={`absolute inset-3 sm:inset-4 flex items-center justify-center rounded-lg sm:rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <Icon className={`w-10 h-10 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'} opacity-40`} />
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
          <span className={`text-sm sm:text-base font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>EGP {product.price?.toLocaleString()}</span>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold ${product.condition === 'NEW' ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
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
        <div className={`p-2.5 sm:p-3 rounded-xl`}>
          <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
        </div>
        <h2 className={`text-lg sm:text-2xl font-extrabold relative inline-block ${darkMode ? 'text-emerald-400' : 'text-emerald-600'} after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-emerald-400 after:to-teal-500`}>
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => <RelatedProductCard key={p.id} product={p} darkMode={darkMode} />)}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-3 mt-6 sm:mt-8">
          <button onClick={() => setCurrentPage((v) => Math.max(1, v - 1))} disabled={currentPage === 1}
            className={`p-2 sm:p-2.5 rounded-xl border shadow-sm disabled:opacity-40 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-emerald-50'}`}>
            <FiChevLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </button>
          <span className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => setCurrentPage((v) => Math.min(totalPages, v + 1))} disabled={currentPage === totalPages}
            className={`p-2 sm:p-2.5 rounded-xl border shadow-sm disabled:opacity-40 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-emerald-50'}`}>
            <FiChevRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </button>
        </div>
      )}
    </div>
  );
});

const DeviceDetailContent = memo(({ addToCart, darkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [catPage, setCatPage] = useState(1);
  const [condPage, setCondPage] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isPending, startTransition] = useTransition();

  const itemsPerPage = 8;

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: ['productDetail', id],
    queryFn: async () => {
      const [prodRes, allRes] = await Promise.all([
        api.get(`/api/products/${id}`),
        api.get('/api/products'),
      ]);
      const cur = prodRes.data;
      const all = allRes.data.content || allRes.data || [];
      return { product: cur, allProducts: all.filter((p) => p.id !== cur.id) };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const product = data?.product;
  const allProducts = data?.allProducts || [];

  useEffect(() => {
    if (product?.name) document.title = `${product.name} | Tech-Restore`;
  }, [product?.name]);

  useEffect(() => {
    if (isError) {
      Swal.fire({ title: 'Error', text: 'Product not found', icon: 'error', toast: true, position: 'top-end', timer: 2000 });
    }
  }, [isError]);

  const handleAddToCart = useCallback(async () => {
    startTransition(async () => {
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
    });
  }, [addToCart, product, quantity]);

  const handleQuantityChange = useCallback((delta) => {
    startTransition(() => {
      const n = quantity + delta;
      if (n >= 1 && n <= (product?.stock || 1)) setQuantity(n);
    });
  }, [quantity, product?.stock]);

  if (loading) return (
    <>
      <style>{STYLES}</style>
      <DeviceDetailSkeleton darkMode={darkMode} />
    </>
  );

  if (!product) return (
    <>
      <style>{STYLES}</style>
      <div className={`detail-root min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} px-4`}>
        <div className={`text-center space-y-5 p-8 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border max-w-sm sm:max-w-md w-full ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
          <NotFoundIllustration darkMode={darkMode} />
          <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Product Not Found</h2>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-xl transition-all shadow-lg text-sm">
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


  const stockStatus = product.stock > 10
    ? { label: 'In Stock', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' }
    : product.stock > 0
      ? { label: `Only ${product.stock} left`, cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' }
      : { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };

  return (
    <>
      <style>{STYLES}</style>
      <div className={`detail-root min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} pb-12 sm:pb-16`}>


        <Hero
          variant="home"
          darkMode={darkMode}
          badge={`${product.categoryName || 'Device'} · ${product.condition}`}
          headingLine1=""
          headingAccent={product.name}
          headingLine2=""
          description={product.brand ? `by ${product.brand} · Premium quality verified` : 'Premium quality verified'}
          buttons={[]}
          stats={[
            { value: '99.9%', label: 'Quality assured' },
            { value: '10K+', label: 'Happy buyers' },
            { value: '4.9 ★', label: 'Avg rating' },
          ]}
        />


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <button onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold mb-5 sm:mb-6 transition-colors ${darkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'}`}>
            <FaChevronLeft size={10} /> Back to products
          </button>

          <div className={`rounded-xl sm:rounded-md border shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
           
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">


                <div className="space-y-3 sm:space-y-4">
                  <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl flex items-center justify-center p-4 sm:p-8 min-h-[220px] sm:min-h-[280px] border ${darkMode ? 'bg-gray-900/60 border-gray-700/50' : 'bg-gray-50 border-gray-100'}`}>
                    <ProductBackdropIllustration darkMode={darkMode} />
                    <img
                      src={product.imageUrls?.[selectedImage] || product.imageUrl || '/placeholder.png'}
                      alt={product.name}
                      loading="lazy"
                      className="relative z-[1] max-h-[200px] sm:max-h-[260px] max-w-full object-contain rounded-lg sm:rounded-xl hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {product.imageUrls && product.imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {product.imageUrls.map((img, i) => (
                        <button key={i} onClick={() => setSelectedImage(i)}
                          className={`img-thumb flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 ${selectedImage === i ? 'border-emerald-400 shadow-md' : darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>


                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                      <h1 className={`text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {product.name}
                      </h1>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" title="Verified quality">
                        <QualityBadgeIllustration darkMode={darkMode} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${stockStatus.cls}`}>{stockStatus.label}</span>
                      <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        <FiTag size={10} /> {product.condition}
                      </span>
                      {product.categoryName && (
                        <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {product.categoryName}
                        </span>
                      )}
                    </div>
                  </div>


                  <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-emerald-50/60 border-emerald-100'}`}>
                    {product.discount ? (
                      <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                        <span className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          EGP {(product.price * (1 - product.discount / 100)).toLocaleString()}
                        </span>
                        <span className={`text-sm line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>EGP {product.price?.toLocaleString()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] sm:text-xs font-bold">{product.discount}% OFF</span>
                      </div>
                    ) : (
                      <span className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
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
                      className={`add-cart-btn flex-1 w-full sm:w-auto py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl font-bold text-sm border-2 border-emerald-400 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
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

const DeviceDetail = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <DeviceDetailContent {...props} />
  </QueryClientProvider>
));

export default DeviceDetail;