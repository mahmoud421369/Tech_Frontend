import React, {
  useEffect, useState, useRef, useMemo,
  useCallback, memo, lazy, Suspense, useTransition
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiSearch, FiStar, FiTrash2, FiEdit3, FiMessageCircle,
  FiCheckCircle, FiShoppingCart,
  FiFilter, FiX, FiSliders, FiMessageSquare,
  FiTag, FiPackage, FiTrendingUp, FiAward, FiChevronDown,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import api from "../api";
import Hero from "../components/Hero";
import { RiStarFill, RiPhoneLine, RiMapPinLine } from "react-icons/ri";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const ChatModal = lazy(() => import("../components/UserChatModal"));

const sanitizeText = (str) =>
  typeof str === "string"
    ? str.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]))
    : str;

const GenuinePartsIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M24 20 H40 C42 20 43 21 43 23 V27 C41.5 27 40.5 28.2 40.5 29.5 C40.5 30.8 41.5 32 43 32 V36 C43 38 42 39 40 39 H24 C22 39 21 38 21 36 V32 C22.5 32 23.5 30.8 23.5 29.5 C23.5 28.2 22.5 27 21 27 V23 C21 21 22 20 24 20 Z" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="32" cy="29.5" r="3.2" fill={darkMode ? '#34d399' : '#10b981'} />
    <circle cx="48" cy="16" r="2.2" fill="#fbbf24" />
  </svg>
));

const WarrantyIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M32 10 L48 16 V30 C48 41.5 40.5 49.5 32 53.5 C23.5 49.5 16 41.5 16 30 V16 Z" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.5" />
    <path d="M23 30 L29 36 L42 22" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="10" r="2.4" fill="#fbbf24" />
  </svg>
));

const FastDeliveryIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <rect x="10" y="26" width="26" height="16" rx="2.5" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.4" />
    <path d="M36 30 H45 L50 36 V42 H36 Z" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="21" cy="44" r="3.4" fill={darkMode ? '#34d399' : '#10b981'} />
    <circle cx="43" cy="44" r="3.4" fill={darkMode ? '#34d399' : '#10b981'} />
    <path d="M45 12 L49 6 L53 12 L48 12 Z" fill="#fbbf24" />
  </svg>
));

const SupportIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill={darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)'} />
    <path d="M16 24 C16 19.5 21 16 28 16 C35 16 40 19.5 40 24 C40 28.5 35 32 28 32 C26.3 32 24.7 31.8 23.3 31.3 L17 34 L18.7 28.8 C17 27.5 16 25.9 16 24 Z" fill="none" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="23" cy="24" r="1.8" fill={darkMode ? '#34d399' : '#10b981'} />
    <circle cx="28" cy="24" r="1.8" fill={darkMode ? '#34d399' : '#10b981'} />
    <circle cx="33" cy="24" r="1.8" fill={darkMode ? '#34d399' : '#10b981'} />
    <circle cx="46" cy="42" r="2.2" fill="#fbbf24" />
  </svg>
));

const EmptyBoxIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 120 100" className="w-24 h-20 sm:w-28 sm:h-24 mx-auto">
    <ellipse cx="60" cy="86" rx="38" ry="6" fill={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
    <path d="M20 40 L60 24 L100 40 L100 74 L60 90 L20 74 Z" fill={darkMode ? '#1f2937' : '#f3f4f6'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M20 40 L60 56 L100 40" fill="none" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M60 56 L60 90" fill="none" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M42 32 L82 48" fill="none" stroke={darkMode ? '#4b5563' : '#d1d5db'} strokeWidth="2" />
    <circle cx="60" cy="18" r="7" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.4" />
    <path d="M57 18 L59.5 20.5 L64 15.5" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const EmptyChatIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 120 100" className="w-24 h-20 sm:w-28 sm:h-24 mx-auto">
    <ellipse cx="60" cy="86" rx="34" ry="5" fill={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
    <path d="M22 20 H98 C101 20 103 22 103 25 V58 C103 61 101 63 98 63 H50 L34 76 V63 H22 C19 63 17 61 17 58 V25 C17 22 19 20 22 20 Z"
      fill={darkMode ? '#1f2937' : '#f3f4f6'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M52 34 L58 44 L70 26" fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-8,4)" />
    <circle cx="34" cy="42" r="3" fill={darkMode ? '#4b5563' : '#d1d5db'} />
    <circle cx="46" cy="42" r="3" fill={darkMode ? '#4b5563' : '#d1d5db'} />
    <circle cx="58" cy="42" r="3" fill={darkMode ? '#4b5563' : '#d1d5db'} />
  </svg>
));

const SortDropdown = memo(({ value, onChange, darkMode, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative flex-1 sm:flex-none" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full sm:w-auto flex items-center justify-between gap-2.5 py-2.5 px-3.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 transition ${
          darkMode ? "bg-gray-800 border-gray-700 text-white hover:border-emerald-500" : "bg-white border-gray-200 text-gray-900 hover:border-emerald-300"
        }`}
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <FiTrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          {selected?.label || "Sort"}
        </span>
        <FiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-20 mt-2 w-full sm:w-56 rounded-xl border shadow-xl overflow-hidden ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center justify-between ${
                  value === opt.value
                    ? (darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                    : (darkMode ? "text-gray-300 hover:bg-gray-700/60" : "text-gray-600 hover:bg-gray-50")
                }`}
              >
                {opt.label}
                {value === opt.value && <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const ProductCard = memo(({ product, darkMode, onAddToCart }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discountedPrice = useMemo(() => product.discount
    ? product.price * (1 - product.discount / 100)
    : null, [product.price, product.discount]);

  const safeProduct = useMemo(() => ({
    name: sanitizeText(product.name) || "Product",
    brand: sanitizeText(product.brand) || "",
    condition: sanitizeText(product.condition) || "Unknown",
    categoryName: sanitizeText(product.categoryName || product.category) || "Uncategorized",
    price: Number(product.price) || 0,
  }), [product]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={() => (window.location.href = `/device/${product.id}`)}
      className={`group flex flex-col h-full rounded-md transition-all duration-300 cursor-pointer border overflow-hidden ${
        darkMode
          ? "bg-gray-800 border-gray-700 shadow-md hover:shadow-2xl hover:border-emerald-700/50"
          : "bg-white border-gray-200 shadow-sm hover:shadow-xl hover:border-emerald-200"
      }`}
    >
      <div className={`relative flex-shrink-0 h-40 sm:h-48 md:h-52 overflow-hidden ${darkMode ? "bg-gray-900/40" : "bg-gray-50"}`}>
        <AnimatePresence>
          {!imgLoaded && !imgError && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-t-transparent animate-spin ${darkMode ? 'border-emerald-500/40 border-t-emerald-400' : 'border-emerald-100 border-t-emerald-400'
                }`} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.img
          src={imgError ? "/placeholder.png" : (product.imageUrl || "/placeholder.png")}
          alt={safeProduct.name}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          loading="lazy"
          animate={{ opacity: imgLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
        />

        {product.discount && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow">
            {product.discount}% off
          </span>
        )}
        {safeProduct.condition === "New" && (
          <span className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow">
            New
          </span>
        )}
      </div>

      <div className={`flex flex-col flex-grow p-3 sm:p-4 gap-1.5 sm:gap-2 border-t ${darkMode ? "border-gray-700/60" : "border-gray-100"}`}>
        <h3 className={`font-bold text-sm sm:text-base line-clamp-2 leading-snug min-h-[2.5rem] sm:min-h-[3rem] ${darkMode ? "text-white" : "text-gray-900"
          }`}>
          {safeProduct.name}
        </h3>
      

        <div className="flex flex-wrap gap-1 text-xs">
          <span className={`px-2 py-0.5 rounded-full font-semibold ${safeProduct.condition === "New"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            }`}>
            {safeProduct.condition}
          </span>
          <span className={`px-2 py-0.5 rounded-full font-semibold truncate max-w-[110px] sm:max-w-[140px] ${
            darkMode ? "bg-gray-700/70 text-gray-300" : "bg-gray-100 text-gray-600"
          }`}>
            {safeProduct.categoryName}
          </span>
        </div>

        <div className={`mt-auto pt-2 border-t ${darkMode ? "border-gray-700/60" : "border-gray-100"}`}>
          {discountedPrice ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-sm sm:text-base font-extrabold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                EGP {discountedPrice.toFixed(2)}
              </span>
              <span className={`text-xs line-through ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                EGP {safeProduct.price.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className={`text-sm sm:text-base font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>
              EGP {safeProduct.price.toFixed(2)}
            </span>
          )}

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="relative mt-2 w-full py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm overflow-hidden flex items-center justify-center gap-1.5 group/btn border-2 border-emerald-400 transition-colors duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
            <FiShoppingCart className="relative z-10 w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 group-hover/btn:text-white transition-colors duration-300" />
            <span className="relative z-10 text-emerald-600 dark:text-emerald-400 group-hover/btn:text-white transition-colors duration-300">
              Add to Cart
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

const ProductSkeleton = memo(({ darkMode }) => (
  <div className={`rounded-2xl overflow-hidden animate-pulse border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
    <div className={`h-40 sm:h-48 md:h-52 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
      <div className={`h-4 rounded w-4/5 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      <div className={`h-3 rounded w-2/5 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      <div className="flex gap-1.5">
        <div className={`h-5 rounded-full w-12 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
        <div className={`h-5 rounded-full w-20 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      </div>
      <div className={`h-5 rounded w-1/2 mt-2 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      <div className={`h-9 rounded-lg w-full mt-2 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
    </div>
  </div>
));

const StarRating = memo(({ value, onChange, size = "w-7 h-7 sm:w-9 sm:h-9" }) => (
  <div className="flex gap-1.5 sm:gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <motion.button
        key={star} type="button"
        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
        onClick={() => onChange(star)} aria-label={`Rate ${star} stars`}
      >
        <RiStarFill className={`${size} transition-all duration-200 ${value >= star ? "text-amber-400 drop-shadow-md" : "text-gray-300 dark:text-gray-600"
          }`} />
      </motion.button>
    ))}
  </div>
));

const FilterPill = memo(({ label, isActive, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border-2 transition-all ${isActive
      ? "bg-emerald-400 border-emerald-400 text-white shadow-sm"
      : darkMode ? "border-gray-700 text-gray-300 hover:border-emerald-500 bg-gray-800/60" : "border-gray-200 text-gray-600 hover:border-emerald-300 bg-white"
      }`}
  >
    {label}
  </button>
));



const ChatCTABanner = memo(({ darkMode, onOpenChat }) => (
  <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border flex flex-col sm:flex-row items-center gap-5 sm:gap-8 p-6 sm:p-10 ${
        darkMode ? "bg-gradient-to-br from-emerald-900/30 via-gray-800 to-gray-800 border-gray-700" : "bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-100"
      }`}
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
        <SupportIllustration darkMode={darkMode} />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h3 className={`text-lg sm:text-2xl font-extrabold mb-1.5 ${darkMode ? "text-white" : "text-gray-900"}`}>
          Not sure which part fits your device?
        </h3>
        <p className={`text-sm sm:text-base ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Chat directly with this shop and get a personal recommendation before you buy.
        </p>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onOpenChat}
        className="relative flex-shrink-0 px-6 py-3 rounded-xl font-bold text-sm overflow-hidden flex items-center justify-center gap-2 group border-2 border-emerald-400"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        <FiMessageCircle className="relative z-10 w-4 h-4 text-emerald-500 group-hover:text-white transition-colors duration-300" />
        <span className="relative z-10 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors duration-300">
          Start Chat
        </span>
      </motion.button>
    </motion.div>
  </section>
));

const ShopContent = ({ darkMode, addToCart }) => {
  const { shopId } = useParams();
  const token = localStorage.getItem("authToken");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [editingReview, setEditingReview] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClientLocal = useQueryClient();

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/shops/${encodeURIComponent(shopId)}`);
        return data;
      } catch { return null; }
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/categories");
        return data.content || data || [];
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', shopId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/products/shop/${encodeURIComponent(shopId)}`);
        return data.content || data || [];
      } catch { return []; }
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', shopId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/reviews/${encodeURIComponent(shopId)}/reviews`);
        return data.content || data || [];
      } catch { return []; }
    },
    enabled: !!shopId,
    staleTime: 0,
  });

  useEffect(() => {
    document.title = shop?.name ? sanitizeText(shop.name) + " | Tech-Restore" : "Loading Shop...";
  }, [shop?.name]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedCondition !== "all") count++;
    if (priceMin !== "") count++;
    if (priceMax !== "") count++;
    if (sortBy !== "default") count++;
    if (inStockOnly) count++;
    return count;
  }, [selectedCategories, selectedCondition, priceMin, priceMax, sortBy, inStockOnly]);

  const handleAddToCart = useCallback(async (product) => {
    if (!token) {
      Swal.fire({ title: "Login Required", text: "Please log in to add items to cart", icon: "warning", confirmButtonText: "Login" })
        .then(r => { if (r.isConfirmed) navigate("/login"); });
      return;
    }
    try {
      await api.post("/api/cart/items", {
        productId: product.id, quantity: 1, price: Number(product.price),
        name: sanitizeText(product.name), imageUrl: product.imageUrl,
      });
      addToCart?.({ ...product, quantity: 1 });
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Added to cart!", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || "Failed to add to cart" });
    }
  }, [addToCart, token, navigate]);

  const submitReview = useCallback(async () => {
    const comment = newReview.comment?.trim();
    if (!comment || newReview.rating === 0) {
      Swal.fire({ icon: "warning", title: "Incomplete", text: "Please provide a rating and comment" });
      return;
    }
    if (comment.length > 1000) {
      Swal.fire({ icon: "warning", title: "Too long", text: "Comment must be under 1000 characters" });
      return;
    }
    try {
      await api.post(`/api/reviews/${encodeURIComponent(shopId)}`, { rating: newReview.rating, comment: sanitizeText(comment) });
      setNewReview({ rating: 0, comment: "" });
      queryClientLocal.invalidateQueries({ queryKey: ['reviews', shopId] });
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Review added!", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", toast: true, position: "top-end", timer: 2000, title: "Failed to submit review", showConfirmButton: false });
    }
  }, [newReview, shopId, queryClientLocal]);

  const updateReview = useCallback(async () => {
    const comment = editingReview?.comment?.trim();
    if (!comment || editingReview.rating === 0) return;
    if (comment.length > 1000) { Swal.fire({ icon: "warning", title: "Too long", text: "Comment must be under 1000 characters" }); return; }
    try {
      await api.put(`/api/reviews/${encodeURIComponent(editingReview.id)}`, { rating: editingReview.rating, comment: sanitizeText(comment) });
      setEditingReview(null);
      queryClientLocal.invalidateQueries({ queryKey: ['reviews', shopId] });
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Review updated!", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch { Swal.fire("Error", "Could not update review", "error"); }
  }, [editingReview, queryClientLocal, shopId]);

  const deleteReview = useCallback(async (reviewId) => {
    const result = await Swal.fire({ title: "Delete Review?", text: "This action cannot be undone", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Yes, delete" });
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/reviews/cancel/${encodeURIComponent(reviewId)}`);
        queryClientLocal.invalidateQueries({ queryKey: ['reviews', shopId] });
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Review removed!", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      } catch { Swal.fire("Error", "Could not delete review", "error"); }
    }
  }, [queryClientLocal, shopId]);

  const handleCategoryCheckbox = useCallback((catName) => {
    startTransition(() => {
      setSelectedCategories(prev => prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]);
    });
  }, []);

  const sortOptions = useMemo(() => ([
    { value: "default", label: "Sort: Default" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
    { value: "name-asc", label: "Name: A–Z" },
    { value: "discount", label: "Best Discount" },
    { value: "newest", label: "Newest First" },
  ]), []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term) || p.brand?.toLowerCase().includes(term));
    }
    if (selectedCondition !== "all") result = result.filter(p => p.condition === selectedCondition);
    if (selectedCategories.length > 0) result = result.filter(p => selectedCategories.includes(p.categoryName || p.category || ""));
    if (inStockOnly) result = result.filter(p => p.stock == null || p.stock > 0);
    const min = priceMin !== "" ? Number(priceMin) : -Infinity;
    const max = priceMax !== "" ? Number(priceMax) : Infinity;
    if (priceMin !== "" || priceMax !== "") result = result.filter(p => Number(p.price) >= min && Number(p.price) <= max);

    if (sortBy === "price-asc") result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price-desc") result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "name-asc") result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "discount") result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return result;
  }, [products, search, selectedCondition, selectedCategories, priceMin, priceMax, sortBy, inStockOnly]);

  const resetFilters = useCallback(() => {
    startTransition(() => {
      setSearch(""); setSelectedCategories([]); setSelectedCondition("all");
      setPriceMin(""); setPriceMax(""); setSortBy("default"); setInStockOnly(false); setIsFilterOpen(false);
    });
  }, []);

  
  const heroStats = useMemo(() => [
    { value: "98.9%", label: "Customer satisfaction" },
    { value: "24h",   label: "Avg delivery time" },
    { value: "4.9★",  label: "Avg shop rating" },
  ], []);

  const scrollToProducts = useCallback(() => {
    document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const avgRating = useMemo(() => reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "–", [reviews]);

  if (shopLoading) return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center`}>
      <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!shop) return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex flex-col items-center justify-center gap-4`}>
      <EmptyBoxIllustration darkMode={darkMode} />
      <p className={`text-xl font-bold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Shop not found</p>
    </div>
  );

  return (
    <>
      <div className={`min-h-screen overflow-x-hidden ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>

        <Hero
          variant="shop"
          darkMode={darkMode}
          badge={shop?.verified ? "Verified Shop" : "Official Shop"}
          headingLine1=""
          headingAccent={sanitizeText(shop?.name) || "Shop Name"}
          headingLine2=""
          description={
            shop?.description
              ? sanitizeText(shop.description)
              : "Professional repair services with genuine parts and a 6-month warranty."
          }
          buttons={[
            { label: "View Products", onClick: scrollToProducts, primary: true },
            { label: "Chat with Shop", onClick: () => setOpenChat(true), primary: false },
          ]}
          stats={heroStats}
        >
          <div className="flex flex-col gap-2 sm:gap-3">
            {shop?.phone && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-900/30" : "bg-emerald-400"}`}>
                  <RiPhoneLine className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className={`text-sm sm:text-base font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {sanitizeText(shop.phone)}
                </span>
              </div>
            )}
            {shop?.shopAddress && (
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${darkMode ? "bg-teal-900/30" : "bg-teal-500"}`}>
                  <RiMapPinLine className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className={`text-sm sm:text-base font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {sanitizeText(shop.shopAddress.fullAddress || `${shop.shopAddress.street || ""}, ${shop.shopAddress.city || ""}`)}
                </span>
              </div>
            )}
          </div>
        </Hero>

   

        <div id="shop-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <span className={`text-xl sm:text-2xl font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {filteredProducts.length}
                </span>
                <span className={`ml-2 text-sm sm:text-base font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  products found
                </span>
              </div>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-white text-xs font-bold">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <SortDropdown value={sortBy} onChange={(val) => startTransition(() => setSortBy(val))} darkMode={darkMode} options={sortOptions} />

              <div className="relative sm:flex-none">
                <FiSearch className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <input
                  type="text" value={search} onChange={e => startTransition(() => setSearch(e.target.value))}
                  placeholder="Search products..." maxLength={100}
                  className={`w-full sm:w-52 md:w-64 pl-9 sm:pl-11 pr-9 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                    }`}
                />
                {search && (
                  <button onClick={() => startTransition(() => setSearch(""))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition" aria-label="Clear">
                    <FiX size={14} />
                  </button>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsFilterOpen(true)}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl border-2 font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md flex-shrink-0 ${activeFiltersCount > 0
                  ? 'border-emerald-400 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400'
                  : darkMode ? "bg-gray-800 border-gray-700 text-white hover:border-emerald-500" : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300"
                  }`}
              >
                <FiSliders className="w-4 h-4 text-emerald-400" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => <ProductSkeleton key={i} darkMode={darkMode} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-start">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} darkMode={darkMode} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 sm:py-24">
              <div className="mb-4">
                <EmptyBoxIllustration darkMode={darkMode} />
              </div>
              <p className={`text-base sm:text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>No products found</p>
              <p className={`text-sm mb-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Try adjusting your filters or search term</p>
              {activeFiltersCount > 0 && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-sm hover:from-emerald-500 hover:to-teal-600 transition shadow-md">
                  Clear all filters
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        <ChatCTABanner darkMode={darkMode} onOpenChat={() => setOpenChat(true)} />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 xl:gap-16 items-start">
            <div className="space-y-5 sm:space-y-6 md:space-y-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${darkMode ? "bg-emerald-900/30" : "bg-emerald-50"}`}>
                  <FiStar className={`w-5 h-5 sm:w-7 sm:h-7 ${darkMode ? "text-emerald-400" : "text-emerald-500"}`} />
                </div>
                <div>
                  <h2 className={`text-xl sm:text-2xl md:text-3xl font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Customer Reviews
                  </h2>
                  <span className={`text-xs sm:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    {reviews.length > 0 && ` · avg ${avgRating} ★`}
                  </span>
                </div>
              </div>

              <div className={`p-4 sm:p-6 md:p-7 rounded-xl sm:rounded-2xl border-2 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <h3 className={`text-base sm:text-lg font-extrabold mb-3 sm:mb-5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                  Share Your Experience
                </h3>
                <StarRating value={newReview.rating} onChange={star => setNewReview(p => ({ ...p, rating: star }))} />
                <textarea
                  value={newReview.comment}
                  onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))}
                  placeholder="How was your experience with this shop?..."
                  maxLength={1000}
                  className={`mt-3 sm:mt-4 w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 resize-none text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all ${darkMode ? "bg-gray-900/70 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                    }`}
                  rows={3}
                />
                <span className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{newReview.comment.length}/1000</span>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={submitReview}
                  disabled={!newReview.comment?.trim() || newReview.rating === 0}
                  className="relative mt-3 w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm overflow-hidden flex items-center justify-center gap-2 group border-2 border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 translate-y-full group-hover:translate-y-0 group-disabled:translate-y-full transition-transform duration-300 ease-out rounded-[10px]" />
                  <span className="relative z-10 text-emerald-600 dark:text-emerald-400 group-hover:text-white group-disabled:text-emerald-600 transition-colors duration-300">
                    Submit Review
                  </span>
                </motion.button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {reviewsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className={`h-24 sm:h-28 rounded-xl sm:rounded-2xl animate-pulse ${darkMode ? "bg-gray-800" : "bg-white"}`} />
                  ))
                ) : reviews.length > 0 ? reviews.map(r => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 hover:shadow-lg ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base shadow-md flex-shrink-0 bg-gradient-to-br from-emerald-400 to-teal-500 text-white`}>
                          {sanitizeText(r.userName)?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <RiStarFill key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < r.rating ? "text-amber-400" : darkMode ? "text-gray-600" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <span className={`text-[10px] sm:text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {sanitizeText(r.comment)}
                          </p>
                          <p className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                            — {sanitizeText(r.userName) || "Anonymous"}
                          </p>
                        </div>
                      </div>
                      {r.userId === userId && (
                        <div className="flex gap-1.5 sm:gap-2 self-start flex-shrink-0">
                          <button onClick={() => setEditingReview(r)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                            <FiEdit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button onClick={() => deleteReview(r.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                            <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center py-12 sm:py-16">
                    <div className="mb-3 sm:mb-4">
                      <EmptyChatIllustration darkMode={darkMode} />
                    </div>
                    <p className={`text-base sm:text-lg font-semibold mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>No reviews yet</p>
                    <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:flex justify-center items-center min-h-[400px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
                className={`relative w-72 sm:w-80 rounded-3xl overflow-hidden shadow-2xl border-2 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
                <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
                    <RiStarFill className="w-24 h-24 sm:w-28 sm:h-28 text-amber-400 drop-shadow-2xl relative z-10" />
                  </div>
                  <h3 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-2 sm:mb-3">
                    {avgRating} / 5
                  </h3>
                  <p className={`text-base sm:text-lg font-bold mb-1.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    {reviews.length > 0 ? "Loved by Customers" : "No reviews yet"}
                  </p>
                  <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                  <div className="w-full mt-6 sm:mt-8 space-y-2">
                    {[5, 4, 3, 2, 1].map(n => {
                      const count = reviews.filter(r => r.rating === n).length;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={n} className="flex items-center gap-2">
                          <span className={`text-xs font-semibold w-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{n}</span>
                          <RiStarFill className="text-amber-400 w-3 h-3 flex-shrink-0" />
                          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-[10px] w-6 text-right ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {isFilterOpen && (
            <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsFilterOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`absolute left-0 top-0 bottom-0 w-[min(320px,90vw)] shadow-2xl overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"}`}
              >
                <div className={`flex items-center justify-between p-4 sm:p-5 border-b sticky top-0 z-10 ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
                  <span className={`text-base sm:text-lg font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    <FiFilter className="text-emerald-400" /> Filters
                    {activeFiltersCount > 0 && (
                      <span className="text-xs bg-emerald-400 text-white px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
                    )}
                  </span>
                  <button onClick={() => setIsFilterOpen(false)}
                    className={`p-2 rounded-xl transition ${darkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"}`}>
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
                  <div>
                    <label className={`flex items-center gap-2 text-sm font-bold mb-2 sm:mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      <FiTag className="text-emerald-400" /> Price Range (EGP)
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)}
                        placeholder="Min" min="0"
                        className={`w-full px-3 sm:px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`} />
                      <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                        placeholder="Max" min="0"
                        className={`w-full px-3 sm:px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`flex items-center gap-2 text-sm font-bold mb-2 sm:mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      <FiPackage className="text-emerald-400" /> Condition
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["all", "New", "Used"].map(cond => (
                        <FilterPill key={cond} label={cond === "all" ? "All" : cond} isActive={selectedCondition === cond} onClick={() => setSelectedCondition(cond)} darkMode={darkMode} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`flex items-center gap-2 text-sm font-bold mb-2 sm:mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      <FiTrendingUp className="text-emerald-400" /> Sort By
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {sortOptions.map(opt => (
                        <FilterPill key={opt.value} label={opt.label.replace('Sort: ', '')} isActive={sortBy === opt.value} onClick={() => setSortBy(opt.value)} darkMode={darkMode} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`flex items-center gap-2 text-sm font-bold mb-2 sm:mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      <FiAward className="text-emerald-400" /> Availability
                    </label>
                    <button
                      onClick={() => setInStockOnly(v => !v)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${inStockOnly
                        ? "bg-emerald-400 border-emerald-400 text-white"
                        : darkMode ? "border-gray-700 text-gray-300 hover:border-emerald-500 bg-gray-800/60" : "border-gray-200 text-gray-600 hover:border-emerald-300 bg-white"
                        }`}
                    >
                      <FiCheckCircle className="w-4 h-4" /> In Stock Only
                    </button>
                  </div>

                  <div>
                    <label className={`flex items-center gap-2 text-sm font-bold mb-2 sm:mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      <FiFilter className="text-emerald-400" /> Categories
                      {selectedCategories.length > 0 && (
                        <span className="text-[10px] bg-emerald-400 text-white px-1.5 py-0.5 rounded-full">{selectedCategories.length}</span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
                      {categories.map(cat => (
                        <FilterPill key={cat.id} label={sanitizeText(cat.name)} isActive={selectedCategories.includes(cat.name)} onClick={() => handleCategoryCheckbox(cat.name)} darkMode={darkMode} />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={resetFilters}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                      Reset All
                    </button>
                    <button onClick={() => setIsFilterOpen(false)}
                      className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-600 transition shadow-md">
                      Apply
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          onClick={() => setOpenChat(true)}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 lg:bottom-8 lg:right-8 bg-gradient-to-br from-emerald-400 to-teal-500 text-white p-4 sm:p-5 rounded-full shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 z-40"
        >
          <FiMessageCircle className="text-xl sm:text-2xl" />
        </motion.button>

        <AnimatePresence>
          {editingReview && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full max-w-lg p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
              >
                <h3 className={`text-xl sm:text-2xl font-extrabold mb-5 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Edit Review
                </h3>
                <StarRating value={editingReview.rating} onChange={star => setEditingReview(p => ({ ...p, rating: star }))} />
                <textarea
                  value={editingReview.comment}
                  onChange={e => setEditingReview(p => ({ ...p, comment: e.target.value }))}
                  maxLength={1000}
                  className={`mt-4 w-full p-3 sm:p-4 rounded-xl border-2 focus:border-emerald-400 focus:outline-none resize-none text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"}`}
                  rows={4}
                />
                <div className="mt-5 flex justify-end gap-2 sm:gap-3">
                  <button onClick={() => setEditingReview(null)}
                    className={`px-5 sm:px-6 py-2.5 rounded-xl font-bold text-sm ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"} transition`}>
                    Cancel
                  </button>
                  <button onClick={updateReview}
                    className="px-6 sm:px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-sm shadow-lg hover:from-emerald-500 hover:to-teal-600 transition">
                    Update
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Suspense fallback={null}>
          <AnimatePresence>
            {openChat && (
              <ChatModal shopId={shopId} shopName={shop?.name} open={openChat} onClose={() => setOpenChat(false)} />
            )}
          </AnimatePresence>
        </Suspense>
      </div>
    </>
  );
};

const Shop = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <ShopContent {...props} />
  </QueryClientProvider>
));

Shop.displayName = "Shop";

export default Shop;