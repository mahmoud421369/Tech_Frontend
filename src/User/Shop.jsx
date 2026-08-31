import React, {
  useEffect, useState, useRef, useMemo,
  useCallback, memo, lazy, Suspense, useTransition, useDeferredValue,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiSearch, FiStar, FiTrash2, FiEdit3, FiMessageCircle,
  FiCheckCircle, FiShoppingCart, FiX, FiSliders, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiArrowRight, FiCheck, FiPlus,
  FiShield, FiTruck, FiRefreshCw, FiEye,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { RiStarFill, RiPhoneLine, RiMapPinLine } from "react-icons/ri";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const Hero = lazy(() => import("../components/Hero"));
const ChatModal = lazy(() => import("../components/UserChatModal"));
const loadSwal = () => import("sweetalert2").then((m) => m.default);
const prefetchChatModal = () => import("../components/UserChatModal");

const sanitizeText = (str) =>
  typeof str === "string"
    ? str.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]))
    : str;

const GLASS = "backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10";
const GLASS_STRONG = "backdrop-blur-2xl bg-white/70 dark:bg-gray-900/50 border border-black/10 dark:border-white/10";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, delay: Math.min(i, 8) * 0.02, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const conditionConfig = {
  New: { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", label: "New" },
  Used: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", label: "Used" },
  Refurbished: { dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-300", label: "Refurbished" },
};

const HeroSkeleton = memo(({ darkMode }) => (
  <div className={`h-[420px] sm:h-[480px] w-full ${darkMode ? "bg-gray-900" : "bg-emerald-50"} animate-pulse`} />
));

const ChatModalSkeleton = memo(({ darkMode }) => (
  <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    <div className={`relative w-full sm:max-w-lg h-[75vh] sm:h-[560px] border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} animate-pulse`} />
  </div>
));

const EmptyBoxIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 120 100" className="w-24 h-20 sm:w-28 sm:h-24 mx-auto">
    <ellipse cx="60" cy="86" rx="38" ry="6" fill={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
    <path d="M20 40 L60 24 L100 40 L100 74 L60 90 L20 74 Z" fill={darkMode ? "#1f2937" : "#f3f4f6"} stroke={darkMode ? "#374151" : "#e5e7eb"} strokeWidth="2" />
    <path d="M20 40 L60 56 L100 40" fill="none" stroke={darkMode ? "#374151" : "#e5e7eb"} strokeWidth="2" />
    <path d="M60 56 L60 90" fill="none" stroke={darkMode ? "#374151" : "#e5e7eb"} strokeWidth="2" />
    <path d="M42 32 L82 48" fill="none" stroke={darkMode ? "#4b5563" : "#d1d5db"} strokeWidth="2" />
    <circle cx="60" cy="18" r="7" fill="none" stroke={darkMode ? "#34d399" : "#10b981"} strokeWidth="2.4" />
    <path d="M57 18 L59.5 20.5 L64 15.5" fill="none" stroke={darkMode ? "#34d399" : "#10b981"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const EmptyChatIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 120 100" className="w-24 h-20 sm:w-28 sm:h-24 mx-auto">
    <ellipse cx="60" cy="86" rx="34" ry="5" fill={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
    <path d="M22 20 H98 C101 20 103 22 103 25 V58 C103 61 101 63 98 63 H50 L34 76 V63 H22 C19 63 17 61 17 58 V25 C17 22 19 20 22 20 Z"
      fill={darkMode ? "#1f2937" : "#f3f4f6"} stroke={darkMode ? "#374151" : "#e5e7eb"} strokeWidth="2" />
    <path d="M52 34 L58 44 L70 26" fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-8,4)" />
    <circle cx="34" cy="42" r="3" fill={darkMode ? "#4b5563" : "#d1d5db"} />
    <circle cx="46" cy="42" r="3" fill={darkMode ? "#4b5563" : "#d1d5db"} />
    <circle cx="58" cy="42" r="3" fill={darkMode ? "#4b5563" : "#d1d5db"} />
  </svg>
));

const TrustRow = memo(({ darkMode }) => (
  <div className={`flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide pt-2 mt-2 border-t ${
    darkMode ? "border-gray-700 text-gray-500" : "border-gray-200 text-gray-400"
  }`}>
    <span className="flex items-center gap-1"><FiShield className="w-3 h-3" /> Verified</span>
    <span className="flex items-center gap-1"><FiTruck className="w-3 h-3" /> Fast ship</span>
    <span className="flex items-center gap-1"><FiRefreshCw className="w-3 h-3" /> Returns</span>
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
        <RiStarFill className={`${size} transition-all duration-200 ${value >= star ? "text-amber-400 drop-shadow-md" : "text-gray-300 dark:text-gray-600"}`} />
      </motion.button>
    ))}
  </div>
));

const ProductCard = memo(({ product, darkMode, onAddToCart, index = 0 }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const discountedPrice = useMemo(() =>
    product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null
  , [product.price, product.discount]);

  const cond = conditionConfig[product.condition] || { dot: "bg-gray-400", text: "text-gray-500", label: product.condition || "Unknown" };

  const handleCart = useCallback((e) => {
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 1600);
  }, [onAddToCart, product]);

  const navigateToDetail = useCallback(() => {
    window.location.href = `/device/${product.id}`;
  }, [product.id]);

  const safeName = useMemo(() => sanitizeText(product.name) || "Product", [product.name]);
  const safeCategory = useMemo(() => sanitizeText(product.categoryName || product.category) || "Uncategorized", [product.categoryName, product.category]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "60px" }}
      onClick={navigateToDetail}
      className={`group relative flex flex-col overflow-hidden cursor-pointer h-full border-l-[3px] transition-colors duration-150 ${
        darkMode
          ? "bg-gray-800 border border-gray-700 border-l-emerald-400 hover:border-l-emerald-300"
          : "bg-white border border-gray-200 border-l-emerald-500 hover:border-l-emerald-600"
      }`}
    >
      {product.discount && (
        <span className="absolute top-0 left-0 z-10 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-1 tracking-wide"
          style={{ clipPath: "polygon(0 0, 100% 0, 86% 100%, 0% 100%)" }}>
          -{product.discount}%
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); navigateToDetail(); }}
        className={`absolute top-2 right-2 z-10 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
          darkMode ? "bg-gray-900/90 text-gray-200" : "bg-white/90 text-gray-600"
        } border ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <FiEye className="w-3.5 h-3.5" />
      </button>

      <div className={`relative w-full aspect-square overflow-hidden border-b ${darkMode ? "bg-gray-750 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        {!imgLoaded && !imgError && (
          <div className={`absolute inset-0 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        )}
        <img
          src={imgError ? "/placeholder.png" : (product.imageUrl || "/placeholder.png")}
          alt={safeName}
          width={400}
          height={400}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-contain p-3 sm:p-4 transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        {product.condition === "New" && (
          <span className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-1.5 py-0.5">New</span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5">
        <h3 className={`font-semibold text-xs sm:text-[15px] leading-snug line-clamp-2 min-h-[2.4rem] ${darkMode ? "text-white" : "text-gray-900"}`}>
          {safeName}
        </h3>

        <div className={`flex items-center justify-between text-[11px] font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 ${cond.dot}`} />
            <span className={cond.text}>{cond.label}</span>
          </span>
          <span className={`truncate max-w-[90px] px-1.5 py-0.5 ${darkMode ? "bg-gray-700/70 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
            {safeCategory}
          </span>
        </div>

        <div className={`flex items-baseline gap-1.5 pt-1 border-t mt-1 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <span className={`text-base sm:text-lg font-extrabold tracking-tight tabular-nums ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
            EGP {discountedPrice ?? Number(product.price || 0).toFixed(2)}
          </span>
          {discountedPrice && (
            <span className={`text-xs line-through tabular-nums ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              EGP {Number(product.price || 0).toFixed(2)}
            </span>
          )}
        </div>

        <TrustRow darkMode={darkMode} />

        <button
          onClick={handleCart}
          className={`mt-2 w-full py-2 sm:py-2.5 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors duration-150 border ${
            cartAdded
              ? "bg-emerald-500 border-emerald-500 text-white"
              : darkMode
                ? "border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-gray-900"
                : "border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
          }`}
        >
          {cartAdded ? <><FiCheck className="w-4 h-4" /> Added</> : <><FiShoppingCart className="w-4 h-4" /> Add to Cart</>}
        </button>
      </div>
    </motion.div>
  );
});

const ProductSkeleton = memo(({ darkMode }) => (
  <div className={`h-[280px] sm:h-[380px] md:h-[420px] animate-pulse border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`} />
));

const PosterProductCard = memo(({ product, darkMode, onAddToCart, index = 0 }) => {
  const [cartAdded, setCartAdded] = useState(false);
  const discountedPrice = useMemo(() =>
    product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null
  , [product.price, product.discount]);

  const handleCart = useCallback((e) => {
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 1400);
  }, [onAddToCart, product]);

  const navigateToDetail = useCallback(() => {
    window.location.href = `/device/${product.id}`;
  }, [product.id]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "60px" }}
      onClick={navigateToDetail}
      className="relative flex-shrink-0 w-[148px] sm:w-[190px] h-[210px] sm:h-[260px] overflow-hidden cursor-pointer snap-start border border-black/10 group"
    >
      <img
        src={product.imageUrl || "/placeholder.png"}
        alt={product.name}
        loading="lazy"
        decoding="async"
        width={190}
        height={260}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      {product.discount && (
        <span className="absolute top-0 left-0 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-1"
          style={{ clipPath: "polygon(0 0, 100% 0, 86% 100%, 0% 100%)" }}>
          -{product.discount}%
        </span>
      )}
      <button
        onClick={handleCart}
        className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center backdrop-blur-md border transition-colors duration-150 ${
          cartAdded ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white/15 border-white/30 text-white hover:bg-emerald-500 hover:border-emerald-500"
        }`}
      >
        {cartAdded ? <FiCheck className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
      </button>
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <p className="font-bold text-xs sm:text-sm leading-snug line-clamp-2 mb-1">{product.name}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm sm:text-base font-extrabold text-emerald-300 tabular-nums">
            EGP {discountedPrice ?? Number(product.price || 0).toFixed(2)}
          </span>
          {discountedPrice && <span className="text-[10px] line-through text-white/50 tabular-nums">EGP {Number(product.price || 0).toFixed(2)}</span>}
        </div>
      </div>
    </motion.div>
  );
});

const CategoryTag = memo(({ darkMode, children }) => (
  <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider border-l-2 ${
    darkMode ? "border-emerald-400 text-emerald-300 bg-emerald-400/5" : "border-emerald-600 text-emerald-700 bg-emerald-50"
  }`}>
    {children}
  </span>
));

const CategorySlider = memo(({ category, items, darkMode, onAddToCart }) => {
  const sliderRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const navigate = useNavigate();

  const check = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => {
    check();
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [check, items.length]);

  const scroll = useCallback((dir) => {
    sliderRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  }, []);

  const goToCategory = useCallback(() => {
    navigate(`/products/category/${category.id}`);
  }, [navigate, category.id]);

  if (!items.length) return null;

  return (
    <div className="mb-10 sm:mb-14">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <button onClick={goToCategory} className="flex items-center gap-3 flex-wrap text-left">
          <CategoryTag darkMode={darkMode}>{category.name}</CategoryTag>
          <span className={`text-xs sm:text-sm font-medium ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={goToCategory}
            className={`hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${
              darkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"
            }`}>
            View all <FiArrowRight className="w-3 h-3" />
          </button>
          <button onClick={() => scroll("left")} disabled={!canLeft}
            className={`p-1.5 sm:p-2 border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
              darkMode ? "bg-gray-800 border-gray-700 hover:border-emerald-400 text-emerald-400" : "bg-white border-gray-200 hover:border-emerald-500 text-emerald-700"
            }`}>
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} disabled={!canRight}
            className={`p-1.5 sm:p-2 border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
              darkMode ? "bg-gray-800 border-gray-700 hover:border-emerald-400 text-emerald-400" : "bg-white border-gray-200 hover:border-emerald-500 text-emerald-700"
            }`}>
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={sliderRef} className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 hide-scrollbar">
        {items.map((p, i) => (
          <PosterProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={onAddToCart} index={i} />
        ))}
      </div>
    </div>
  );
});

const FilterSection = memo(({ title, isOpen, onToggle, darkMode, children }) => (
  <div className={`border-b py-3 ${darkMode ? "border-white/10" : "border-black/10"}`}>
    <button onClick={onToggle}
      className={`w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider py-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
      {title}
      <FiChevronDown className={`transition-transform duration-200 w-3.5 h-3.5 ${isOpen ? "rotate-180" : ""} ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
    </button>
    <div className={`grid transition-all duration-150 ${isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  </div>
));

const RadioOption = memo(({ value, label, selected, onSelect, darkMode }) => (
  <label className="flex items-center gap-3 cursor-pointer group py-1">
    <div onClick={() => onSelect(value)}
      className={`w-3.5 h-3.5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? "border-emerald-500 bg-emerald-500" : darkMode ? "border-gray-600" : "border-gray-300"
      }`}>
      {selected && <div className="w-1.5 h-1.5 bg-white" />}
    </div>
    <span onClick={() => onSelect(value)}
      className={`text-sm font-medium truncate ${selected ? "text-emerald-500" : darkMode ? "text-gray-300 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"}`}>
      {label}
    </span>
  </label>
));

const PillButton = memo(({ label, isActive, onClick, darkMode }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 text-xs font-semibold border transition-colors duration-150 ${
      isActive
        ? "bg-emerald-500 border-emerald-500 text-white"
        : darkMode
          ? "border-gray-700 text-gray-300 hover:border-emerald-400 hover:text-emerald-400 bg-gray-800/60"
          : "border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-700 bg-white"
    }`}>
    {label}
  </button>
));

const PriceRangeSlider = memo(({ priceRange, setPriceRange, darkMode }) => {
  const MIN = 0, MAX = 100000, STEP = 1000;
  const leftPct = (priceRange[0] / MAX) * 100;
  const rightPct = (priceRange[1] / MAX) * 100;
  const thumbCls = "absolute inset-0 w-full h-1 appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 " +
    "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 " +
    "[&::-webkit-slider-thumb]:cursor-pointer " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 " +
    "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:cursor-pointer";

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-bold">
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[0].toLocaleString()}</span>
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[1].toLocaleString()}</span>
      </div>
      <div className="relative h-4 flex items-center">
        <div className={`absolute inset-x-0 h-1 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        <div className="absolute h-1 bg-emerald-500" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={priceRange[0]}
          onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - STEP), priceRange[1]])} className={thumbCls} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + STEP)])} className={thumbCls} />
      </div>
    </div>
  );
});

const FilterPanel = memo(({ darkMode, sortBy, setSortBy, sortLabels, selectedCategories, toggleCategory, categories,
  isSortOpen, setIsSortOpen, isCatOpen, setIsCatOpen, isCondOpen, setIsCondOpen, isPriceOpen, setIsPriceOpen,
  selectedCondition, setSelectedCondition, priceRange, setPriceRange, inStockOnly, setInStockOnly,
  clearFilters, activeFiltersCount }) => (
  <div className={`${GLASS_STRONG} p-4 sm:p-5`}>
    <div className="flex items-center justify-between mb-1">
      <h3 className={`text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
        <FiSliders className="w-4 h-4 text-emerald-500" /> Filters
      </h3>
      {activeFiltersCount > 0 && (
        <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold">{activeFiltersCount}</span>
      )}
    </div>

    <FilterSection title="Sort By" isOpen={isSortOpen} onToggle={() => setIsSortOpen(!isSortOpen)} darkMode={darkMode}>
      <div className="space-y-1">
        {Object.entries(sortLabels).map(([value, label]) => (
          <RadioOption key={value} value={value} label={label} selected={sortBy === value} onSelect={setSortBy} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Condition" isOpen={isCondOpen} onToggle={() => setIsCondOpen(!isCondOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2">
        {["all", "New", "Used"].map((c) => (
          <PillButton key={c} label={c === "all" ? "All" : c} isActive={selectedCondition === c} onClick={() => setSelectedCondition(c)} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Category" isOpen={isCatOpen} onToggle={() => setIsCatOpen(!isCatOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
        {categories.map((cat) => (
          <PillButton key={cat.id} label={cat.name} isActive={selectedCategories.includes(cat.name)} onClick={() => toggleCategory(cat.name)} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title="Price Range (EGP)" isOpen={isPriceOpen} onToggle={() => setIsPriceOpen(!isPriceOpen)} darkMode={darkMode}>
      <PriceRangeSlider priceRange={priceRange} setPriceRange={setPriceRange} darkMode={darkMode} />
    </FilterSection>

    <div className={`py-3 border-b ${darkMode ? "border-white/10" : "border-black/10"}`}>
      <button
        onClick={() => setInStockOnly((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 border text-sm font-semibold transition-colors duration-150 ${
          inStockOnly
            ? "bg-emerald-500 border-emerald-500 text-white"
            : darkMode ? "border-gray-700 text-gray-300 hover:border-emerald-400" : "border-gray-200 text-gray-600 hover:border-emerald-500"
        }`}
      >
        <FiCheckCircle className="w-4 h-4" /> In Stock Only
      </button>
    </div>

    <button onClick={clearFilters}
      className="w-full mt-4 py-2.5 border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-xs uppercase tracking-wide transition-colors duration-150 flex items-center justify-center gap-2">
      <FiX /> Clear All Filters
    </button>
  </div>
));

const PaginationButton = memo(({ children, onClick, disabled, active, darkMode }) => (
  <button onClick={onClick} disabled={disabled}
    className={`min-w-[38px] h-10 px-2 font-bold text-sm border flex items-center justify-center transition-colors duration-150 ${
      active
        ? "bg-emerald-500 text-white border-emerald-500"
        : disabled
          ? `opacity-40 cursor-not-allowed ${darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`
          : darkMode
            ? "bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-400 hover:text-emerald-400"
            : "bg-white border-gray-200 text-gray-700 hover:border-emerald-500 hover:text-emerald-700"
    }`}>
    {children}
  </button>
));

const HeroIconRow = memo(({ darkMode, shop }) => (
  <div className="flex flex-col gap-2 sm:gap-3">
    {shop?.phone && (
      <div className={`flex items-center gap-3 px-3 py-2.5 border-l-2 ${darkMode ? "border-emerald-400 bg-white/5" : "border-emerald-600 bg-white/60"}`}>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-900/40" : "bg-emerald-500"}`}>
          <RiPhoneLine className="text-white w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span className={`text-sm sm:text-base font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          {sanitizeText(shop.phone)}
        </span>
      </div>
    )}
    {shop?.shopAddress && (
      <div className={`flex items-start gap-3 px-3 py-2.5 border-l-2 ${darkMode ? "border-teal-400 bg-white/5" : "border-teal-600 bg-white/60"}`}>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 mt-0.5 ${darkMode ? "bg-teal-900/40" : "bg-teal-500"}`}>
          <RiMapPinLine className="text-white w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span className={`text-sm sm:text-base font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          {sanitizeText(shop.shopAddress.fullAddress || `${shop.shopAddress.street || ""}, ${shop.shopAddress.city || ""}`)}
        </span>
      </div>
    )}
  </div>
));

const ChatCTABanner = memo(({ darkMode, onOpenChat }) => (
  <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden border flex flex-col sm:flex-row items-center gap-5 sm:gap-8 p-6 sm:p-10 ${GLASS_STRONG}`}
      onMouseEnter={prefetchChatModal}
    >
      <div className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0 border-l-2 ${darkMode ? "border-emerald-400 bg-emerald-900/20" : "border-emerald-600 bg-emerald-50"}`}>
        <FiMessageCircle className={`w-7 h-7 sm:w-9 sm:h-9 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`} />
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
        className="relative flex-shrink-0 px-6 py-3 font-bold text-sm overflow-hidden flex items-center justify-center gap-2 group border-2 border-emerald-400"
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
  const deferredSearch = useDeferredValue(search);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [editingReview, setEditingReview] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [chatPrefetched, setChatPrefetched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClientLocal = useQueryClient();

  const [isSortOpen, setIsSortOpen] = useState(true);
  const [isCatOpen, setIsCatOpen] = useState(true);
  const [isCondOpen, setIsCondOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  useEffect(() => {
    const id = ("requestIdleCallback" in window)
      ? window.requestIdleCallback(() => { prefetchChatModal(); setChatPrefetched(true); })
      : setTimeout(() => { prefetchChatModal(); setChatPrefetched(true); }, 1500);
    return () => {
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  const handleOpenChat = useCallback(() => {
    if (!chatPrefetched) prefetchChatModal();
    setOpenChat(true);
  }, [chatPrefetched]);

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["shop", shopId],
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
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/api/categories");
        return (data.content || data || []).map((c) => ({ id: c.id, name: c.name || String(c.id) }));
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", shopId],
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
    queryKey: ["reviews", shopId],
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

  const handleAddToCart = useCallback(async (product) => {
    if (!token) {
      const Swal = await loadSwal();
      Swal.fire({ title: "Login Required", text: "Please log in to add items to cart", icon: "warning", confirmButtonText: "Login" })
        .then((r) => { if (r.isConfirmed) navigate("/login"); });
      return;
    }
    try {
      await api.post("/api/cart/items", {
        productId: product.id, quantity: 1, price: Number(product.price),
        name: sanitizeText(product.name), imageUrl: product.imageUrl,
      });
      addToCart?.({ ...product, quantity: 1 });
      const Swal = await loadSwal();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Added to cart!", timer: 1500, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || "Failed to add to cart" });
    }
  }, [addToCart, token, navigate]);

  const submitReview = useCallback(async () => {
    const comment = newReview.comment?.trim();
    if (!comment || newReview.rating === 0) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: "Incomplete", text: "Please provide a rating and comment" });
      return;
    }
    if (comment.length > 1000) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: "Too long", text: "Comment must be under 1000 characters" });
      return;
    }
    try {
      await api.post(`/api/reviews/${encodeURIComponent(shopId)}`, { rating: newReview.rating, comment: sanitizeText(comment) });
      setNewReview({ rating: 0, comment: "" });
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      const Swal = await loadSwal();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Review added!", timer: 1500, timerProgressBar: true, showConfirmButton: false });
    } catch {
      const Swal = await loadSwal();
      Swal.fire({ icon: "error", toast: true, position: "top-end", timer: 1500, title: "Failed to submit review", showConfirmButton: false });
    }
  }, [newReview, shopId, queryClientLocal]);

  const updateReview = useCallback(async () => {
    const comment = editingReview?.comment?.trim();
    if (!comment || editingReview.rating === 0) return;
    if (comment.length > 1000) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: "Too long", text: "Comment must be under 1000 characters" });
      return;
    }
    try {
      await api.put(`/api/reviews/${encodeURIComponent(editingReview.id)}`, { rating: editingReview.rating, comment: sanitizeText(comment) });
      setEditingReview(null);
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      const Swal = await loadSwal();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Review updated!", timer: 1500, timerProgressBar: true, showConfirmButton: false });
    } catch {
      const Swal = await loadSwal();
      Swal.fire("Error", "Could not update review", "error");
    }
  }, [editingReview, queryClientLocal, shopId]);

  const deleteReview = useCallback(async (reviewId) => {
    const Swal = await loadSwal();
    const result = await Swal.fire({ title: "Delete Review?", text: "This action cannot be undone", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Yes, delete" });
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/reviews/cancel/${encodeURIComponent(reviewId)}`);
        queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Review removed!", timer: 1500, timerProgressBar: true, showConfirmButton: false });
      } catch {
        Swal.fire("Error", "Could not delete review", "error");
      }
    }
  }, [queryClientLocal, shopId]);

  const toggleCategory = useCallback((catName) => {
    startTransition(() => {
      setSelectedCategories((prev) => prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]);
    });
  }, []);

  const sortLabels = useMemo(() => ({
    relevance: "Relevance",
    priceLowToHigh: "Price: Low to High",
    priceHighToLow: "Price: High to Low",
    nameAsc: "Name: A–Z",
    discount: "Best Discount",
    newest: "Newest First",
  }), []);

  const productsByCategory = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const catId = p.categoryId ?? p.category?.id ?? p.category;
      if (catId === undefined || catId === null) return;
      if (!map[catId]) map[catId] = [];
      map[catId].push(p);
    });
    return map;
  }, [products]);

  const categorySections = useMemo(() => (
    categories
      .map((cat) => ({ category: cat, items: (productsByCategory[cat.id] || []).slice(0, 10) }))
      .filter((sec) => sec.items.length > 0)
      .slice(0, 6)
  ), [categories, productsByCategory]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    const term = deferredSearch.trim().toLowerCase();
    if (term) {
      result = result.filter((p) => p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term) || p.brand?.toLowerCase().includes(term));
    }
    if (selectedCondition !== "all") result = result.filter((p) => p.condition === selectedCondition);
    if (selectedCategories.length > 0) result = result.filter((p) => selectedCategories.includes(p.categoryName || p.category || ""));
    if (inStockOnly) result = result.filter((p) => p.stock == null || p.stock > 0);
    result = result.filter((p) => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);

    if (sortBy === "priceLowToHigh") result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "priceHighToLow") result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "nameAsc") result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "discount") result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return result;
  }, [products, deferredSearch, selectedCondition, selectedCategories, priceRange, sortBy, inStockOnly]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  useEffect(() => { setCurrentPage(1); }, [deferredSearch, selectedCondition, selectedCategories, priceRange, inStockOnly]);

  const activeFiltersCount = useMemo(() => [
    search,
    selectedCondition !== "all" ? selectedCondition : null,
    ...selectedCategories,
    priceRange[0] !== 0 || priceRange[1] !== 100000 ? "price" : null,
    inStockOnly ? "stock" : null,
    sortBy !== "relevance" ? sortBy : null,
  ].filter(Boolean).length, [search, selectedCondition, selectedCategories, priceRange, inStockOnly, sortBy]);

  const resetFilters = useCallback(() => {
    startTransition(() => {
      setSearch(""); setSelectedCategories([]); setSelectedCondition("all");
      setPriceRange([0, 100000]); setSortBy("relevance"); setInStockOnly(false); setIsSidebarOpen(false);
    });
  }, []);

  const heroStats = useMemo(() => [
    { value: "98.9%", label: "Customer satisfaction" },
    { value: "24h", label: "Avg delivery time" },
    { value: "4.9★", label: "Avg shop rating" },
  ], []);

  const scrollToProducts = useCallback(() => {
    document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const avgRating = useMemo(() => reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "–", [reviews]);

  const filterPanelProps = {
    darkMode, sortBy, setSortBy: (v) => startTransition(() => setSortBy(v)), sortLabels,
    selectedCategories, toggleCategory, categories,
    isSortOpen, setIsSortOpen, isCatOpen, setIsCatOpen, isCondOpen, setIsCondOpen, isPriceOpen, setIsPriceOpen,
    selectedCondition, setSelectedCondition: (v) => startTransition(() => setSelectedCondition(v)),
    priceRange, setPriceRange, inStockOnly, setInStockOnly,
    clearFilters: resetFilters, activeFiltersCount,
  };

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
    <div className={`min-h-screen overflow-x-hidden ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>

      <Suspense fallback={<HeroSkeleton darkMode={darkMode} />}>
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
            { label: "Chat with Shop", onClick: handleOpenChat, primary: false },
          ]}
          stats={heroStats}
        >
          <HeroIconRow darkMode={darkMode} shop={shop} />
        </Hero>
      </Suspense>

      {!productsLoading && categorySections.length > 0 && (
        <div className={`py-10 sm:py-16 ${darkMode ? "bg-gray-950" : "bg-white"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
              <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Shop by category</span>
              <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight mt-1.5 ${darkMode ? "text-white" : "text-gray-900"}`}>Browse this shop's collections</h2>
            </div>
            {categorySections.map(({ category, items }) => (
              <CategorySlider key={category.id} category={category} items={items} darkMode={darkMode} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </div>
      )}

      <div id="shop-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex gap-5 lg:gap-8">
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
            <FilterPanel {...filterPanelProps} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className={`${GLASS} flex items-center justify-between mb-6 flex-wrap gap-3 px-4 py-3`}>
              <div>
                <span className={`text-xl sm:text-2xl font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>{filteredProducts.length}</span>
                <span className={`ml-2 text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>products found</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="relative">
                  <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                  <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..." maxLength={100}
                    className={`w-40 sm:w-56 pl-9 pr-8 py-2 border text-sm outline-none focus:border-emerald-400 transition-colors ${
                      darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition" aria-label="Clear">
                      <FiX size={14} />
                    </button>
                  )}
                </div>

                <button onClick={() => setIsSidebarOpen(true)}
                  className={`lg:hidden flex items-center gap-1.5 px-3 py-2 border font-semibold text-xs transition-colors duration-150 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-700"}`}>
                  <FiSliders className="w-3.5 h-3.5 text-emerald-500" /> Filters
                  {activeFiltersCount > 0 && <span className="w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>}
                </button>
              </div>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {[...Array(9)].map((_, i) => <ProductSkeleton key={i} darkMode={darkMode} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
                {paginatedProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
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
                  <button onClick={resetFilters}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors duration-150">
                    Clear all filters
                  </button>
                )}
              </motion.div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 sm:mt-14 gap-1.5 sm:gap-2 flex-wrap">
                <PaginationButton onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} darkMode={darkMode}>
                  <FiChevronLeft className="w-4 h-4" />
                </PaginationButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationButton key={page} onClick={() => setCurrentPage(page)} active={currentPage === page} darkMode={darkMode}>
                    {page}
                  </PaginationButton>
                ))}
                <PaginationButton onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} darkMode={darkMode}>
                  <FiChevronRight className="w-4 h-4" />
                </PaginationButton>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatCTABanner darkMode={darkMode} onOpenChat={handleOpenChat} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 xl:gap-16 items-start">
          <div className="space-y-5 sm:space-y-6 md:space-y-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center border-l-2 ${darkMode ? "border-emerald-400 bg-emerald-900/20" : "border-emerald-600 bg-emerald-50"}`}>
                <FiStar className={`w-5 h-5 sm:w-7 sm:h-7 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`} />
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

            <div className={`p-4 sm:p-6 md:p-7 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-base sm:text-lg font-extrabold mb-3 sm:mb-5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                Share Your Experience
              </h3>
              <StarRating value={newReview.rating} onChange={(star) => setNewReview((p) => ({ ...p, rating: star }))} />
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview((p) => ({ ...p, comment: e.target.value }))}
                placeholder="How was your experience with this shop?..."
                maxLength={1000}
                className={`mt-3 sm:mt-4 w-full p-3 sm:p-4 border-2 resize-none text-sm leading-relaxed outline-none focus:border-emerald-400 transition-colors ${
                  darkMode ? "bg-gray-900/70 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
                rows={3}
              />
              <span className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{newReview.comment.length}/1000</span>
              <button
                onClick={submitReview}
                disabled={!newReview.comment?.trim() || newReview.rating === 0}
                className="relative mt-3 w-full py-2.5 sm:py-3 font-bold text-sm flex items-center justify-center gap-2 border-2 border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 hover:text-gray-900 transition-colors duration-150 text-emerald-600 dark:text-emerald-400"
              >
                Submit Review
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {reviewsLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className={`h-24 sm:h-28 animate-pulse ${darkMode ? "bg-gray-800" : "bg-white"}`} />
                ))
              ) : reviews.length > 0 ? reviews.map((r) => (
                <div key={r.id}
                  className={`p-4 sm:p-5 border-l-[3px] border transition-colors duration-150 ${darkMode ? "bg-gray-800 border-gray-700 border-l-emerald-400" : "bg-white border-gray-200 border-l-emerald-500"}`}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0 bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
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
                        <button onClick={() => setEditingReview(r)} className="p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                          <FiEdit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button onClick={() => deleteReview(r.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                          <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
            <div className={`relative w-72 sm:w-80 overflow-hidden shadow-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
              <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-3xl" />
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
                  {[5, 4, 3, 2, 1].map((n) => {
                    const count = reviews.filter((r) => r.rating === n).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={n} className="flex items-center gap-2">
                        <span className={`text-xs font-semibold w-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{n}</span>
                        <RiStarFill className="text-amber-400 w-3 h-3 flex-shrink-0" />
                        <div className={`flex-1 h-1.5 overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[10px] w-6 text-right ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className={`absolute left-0 top-0 bottom-0 w-72 sm:w-80 overflow-y-auto p-4 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
              <FilterPanel {...filterPanelProps} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        onMouseEnter={prefetchChatModal}
        onClick={handleOpenChat}
        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 lg:bottom-8 lg:right-8 bg-gradient-to-br from-emerald-400 to-teal-500 text-white p-4 sm:p-5 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow duration-200 z-40"
      >
        <FiMessageCircle className="text-xl sm:text-2xl" />
      </motion.button>

      <AnimatePresence>
        {editingReview && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={`w-full max-w-lg p-6 sm:p-8 shadow-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <h3 className={`text-xl sm:text-2xl font-extrabold mb-5 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Edit Review
              </h3>
              <StarRating value={editingReview.rating} onChange={(star) => setEditingReview((p) => ({ ...p, rating: star }))} />
              <textarea
                value={editingReview.comment}
                onChange={(e) => setEditingReview((p) => ({ ...p, comment: e.target.value }))}
                maxLength={1000}
                className={`mt-4 w-full p-3 sm:p-4 border-2 focus:border-emerald-400 outline-none resize-none text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"}`}
                rows={4}
              />
              <div className="mt-5 flex justify-end gap-2 sm:gap-3">
                <button onClick={() => setEditingReview(null)}
                  className={`px-5 sm:px-6 py-2.5 font-bold text-sm ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"} transition`}>
                  Cancel
                </button>
                <button onClick={updateReview}
                  className="px-6 sm:px-8 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-sm shadow-lg hover:from-emerald-500 hover:to-teal-600 transition">
                  Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Suspense fallback={openChat ? <ChatModalSkeleton darkMode={darkMode} /> : null}>
        <AnimatePresence>
          {openChat && (
            <ChatModal shopId={shopId} shopName={shop?.name} open={openChat} onClose={() => setOpenChat(false)} />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
};

const Shop = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <ShopContent {...props} />
  </QueryClientProvider>
));

Shop.displayName = "Shop";

export default Shop;