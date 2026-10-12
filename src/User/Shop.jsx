import React, {
  useEffect, useState, useRef, useMemo,
  useCallback, memo, lazy, Suspense, useTransition, useDeferredValue,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiSearch, FiStar, FiTrash2, FiEdit3, FiMessageCircle,
  FiCheckCircle, FiShoppingCart, FiX, FiSliders, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiArrowRight, FiArrowLeft, FiCheck, FiPlus,
  FiShield, FiTruck, FiRefreshCw, FiTag, FiPackage, FiAward, FiInfo, FiExternalLink,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { RiStarFill, RiPhoneLine, RiMapPinLine } from "react-icons/ri";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppLanguage, languageDirection } from "../utils/useAppLanguage";
import enTranslations from "../locales/en/translation.json";
import arTranslations from "../locales/ar/translation.json";
import frTranslations from "../locales/fr/translation.json";

const queryClient = new QueryClient();
const SHOP_TRANSLATIONS = {
  en: enTranslations.shop,
  ar: arTranslations.shop || arTranslations.hero?.shopPage,
  fr: frTranslations.shop || frTranslations.hero?.shopPage,
};
const getShopTranslation = (language, key) => SHOP_TRANSLATIONS[language]?.[key] || SHOP_TRANSLATIONS.en[key] || key;

// Locale used for number/date formatting per language, kept as a static lookup
// so it never gets rebuilt on render.
const LOCALE_MAP = { en: "en-GB", ar: "ar-EG", fr: "fr-FR" };

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

const getDiscounted = (product) =>
  product.discount ? (product.price * (1 - product.discount / 100)).toFixed(2) : null;

const goToProduct = (product) => { window.location.href = `/device/${product.id}`; };

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

// Accepts an optional translated label template ("Rate {star} stars"); falls
// back to a plain English label so the component still works if a caller
// forgets to pass `t` (e.g. in isolated tests).
const StarRating = memo(({ value, onChange, size = "w-7 h-7 sm:w-9 sm:h-9", t }) => (
  <div className="flex gap-1.5 sm:gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <motion.button
        key={star} type="button"
        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
        onClick={() => onChange(star)}
        aria-label={t ? t("rateStars").replace("{star}", star) : `Rate ${star} stars`}
      >
        <RiStarFill className={`${size} transition-all duration-200 ${value >= star ? "text-amber-400 drop-shadow-md" : "text-gray-300 dark:text-gray-600"}`} />
      </motion.button>
    ))}
  </div>
));

/* ───────────── Compact product card ───────────── */
const MetaRow = ({ icon: Icon, children, darkMode }) => (
  <span className={`flex items-center gap-1.5 text-[11px] font-medium min-w-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
    <Icon className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
    <span className="truncate">{children}</span>
  </span>
);

const ProductCard = memo(({ product, darkMode, onAddToCart, onDetails, index = 0, t }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const discountedPrice = useMemo(() => getDiscounted(product), [product.price, product.discount]);
  const cond = conditionConfig[product.condition] || { dot: "bg-gray-400", text: "text-gray-500", label: product.condition || "Unknown" };

  const handleCart = useCallback((e) => {
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 1600);
  }, [onAddToCart, product]);

  const safeName = useMemo(() => sanitizeText(product.name) || "Product", [product.name]);
  const safeCategory = useMemo(() => sanitizeText(product.categoryName || product.category) || "Uncategorized", [product.categoryName, product.category]);
  const hasStock = product.stock != null;
  const inStock = !hasStock || product.stock > 0;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "60px" }}
      onClick={() => goToProduct(product)}
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

      <div className={`relative w-full aspect-[4/3] overflow-hidden border-b ${darkMode ? "bg-gray-750 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
        {!imgLoaded && !imgError && (
          <div className={`absolute inset-0 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        )}
        <img
          src={imgError ? "/placeholder.png" : (product.imageUrl || "/placeholder.png")}
          alt={safeName}
          width={400}
          height={300}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-contain p-2.5 transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        {product.condition === "New" && (
          <span className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-1.5 py-0.5">{t("new")}</span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 gap-2">
        <h3 className={`font-semibold text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.3rem] ${darkMode ? "text-white" : "text-gray-900"}`}>
          {safeName}
        </h3>

        {/* key details with icons */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <MetaRow icon={FiTag} darkMode={darkMode}>{safeCategory}</MetaRow>
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold min-w-0 ${cond.text}`}>
            <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{cond.label}</span>
          </span>
          {product.brand && <MetaRow icon={FiAward} darkMode={darkMode}>{sanitizeText(product.brand)}</MetaRow>}
          {hasStock && <MetaRow icon={FiPackage} darkMode={darkMode}>{inStock ? "In stock" : "Out of stock"}</MetaRow>}
        </div>

        {/* dir="ltr" keeps "EGP 123.45" in a fixed left-to-right order even
           when the surrounding page is rendered right-to-left. */}
        <div className={`flex items-center justify-between gap-2 pt-2 border-t mt-auto ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="flex items-baseline gap-1.5 min-w-0" dir="ltr">
            <span className={`text-sm sm:text-base font-extrabold tracking-tight tabular-nums ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
              EGP {discountedPrice ?? Number(product.price || 0).toFixed(2)}
            </span>
            {discountedPrice && (
              <span className={`text-[11px] line-through tabular-nums ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {Number(product.price || 0).toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleCart}
            aria-label={t("addToCart")}
            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border transition-colors duration-150 ${
              cartAdded
                ? "bg-emerald-500 border-emerald-500 text-white"
                : darkMode
                  ? "border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-gray-900"
                  : "border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
            }`}
          >
            {cartAdded ? <FiCheck className="w-4 h-4" /> : <FiShoppingCart className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDetails(product); }}
            className={`py-2 text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors duration-150 ${
              darkMode ? "border-gray-600 text-gray-200 hover:border-emerald-400 hover:text-emerald-400" : "border-gray-200 text-gray-700 hover:border-emerald-500 hover:text-emerald-700"
            }`}
          >
            <FiInfo className="w-3.5 h-3.5" /> Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToProduct(product); }}
            className="py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-150"
          >
            <FiExternalLink className="w-3.5 h-3.5" /> View product
          </button>
        </div>
      </div>
    </motion.div>
  );
});

const ProductSkeleton = memo(({ darkMode }) => (
  <div className={`h-[300px] sm:h-[340px] animate-pulse border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`} />
));

/* ───────────── Product details modal ───────────── */
const ProductDetailsModal = memo(({ product, darkMode, onClose, onAddToCart, t }) => {
  const discountedPrice = getDiscounted(product);
  const cond = conditionConfig[product.condition] || { text: "text-gray-500", label: product.condition || "Unknown" };
  const hasStock = product.stock != null;
  const inStock = !hasStock || product.stock > 0;
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const muted = darkMode ? "text-gray-400" : "text-gray-500";
  const strong = darkMode ? "text-white" : "text-gray-900";

  const offers = [
    { icon: FiShield, label: t("verified") },
    { icon: FiTruck, label: t("fastShip") },
    { icon: FiRefreshCw, label: t("returns") },
  ];
  const specs = [
    { icon: FiTag, label: "Category", value: sanitizeText(product.categoryName || product.category) || "Uncategorized" },
    { icon: FiCheckCircle, label: "Condition", value: cond.label },
    product.brand && { icon: FiAward, label: "Brand", value: sanitizeText(product.brand) },
    hasStock && { icon: FiPackage, label: "Availability", value: inStock ? "In stock" : "Out of stock" },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={product.name}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto border shadow-2xl ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <button onClick={onClose} aria-label={t("clear")}
          className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>
          <FiX className="w-4 h-4" />
        </button>

        <div className={`relative aspect-[16/10] border-b ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <img
            src={imgError ? "/placeholder.png" : (product.imageUrl || "/placeholder.png")}
            alt={sanitizeText(product.name) || "Product"}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain p-4"
          />
          {product.discount && (
            <span className="absolute top-0 left-0 bg-rose-600 text-white text-xs font-extrabold px-2.5 py-1"
              style={{ clipPath: "polygon(0 0, 100% 0, 88% 100%, 0% 100%)" }}>
              -{product.discount}%
            </span>
          )}
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h2 className={`text-lg sm:text-xl font-extrabold leading-snug ${strong}`}>{sanitizeText(product.name) || "Product"}</h2>
            <div className="flex items-baseline gap-2 mt-1.5" dir="ltr">
              <span className={`text-xl font-extrabold tabular-nums ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                EGP {discountedPrice ?? Number(product.price || 0).toFixed(2)}
              </span>
              {discountedPrice && (
                <span className={`text-sm line-through tabular-nums ${darkMode ? "text-gray-500" : "text-gray-400"}`}>EGP {Number(product.price || 0).toFixed(2)}</span>
              )}
            </div>
          </div>

          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${muted}`}>About this product</h3>
            <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {sanitizeText(product.description) || "No description has been added for this product yet."}
            </p>
          </section>

          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>Details</h3>
            <div className="grid grid-cols-2 gap-2">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className={`flex items-center gap-2.5 p-2.5 border ${darkMode ? "border-gray-700 bg-gray-800/60" : "border-gray-200 bg-gray-50"}`}>
                  <Icon className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <div className="min-w-0">
                    <p className={`text-[10px] uppercase tracking-wide ${muted}`}>{label}</p>
                    <p className={`text-xs font-semibold truncate ${strong}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>What you get</h3>
            <ul className="flex flex-wrap gap-2">
              {offers.map(({ icon: Icon, label }) => (
                <li key={label} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border-l-2 ${darkMode ? "border-emerald-400 bg-emerald-400/5 text-emerald-300" : "border-emerald-600 bg-emerald-50 text-emerald-700"}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </li>
              ))}
            </ul>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setAdded(true); onAddToCart(product); setTimeout(() => setAdded(false), 1600); }}
              disabled={!inStock}
              className={`py-2.5 text-sm font-bold flex items-center justify-center gap-2 border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                added ? "bg-emerald-500 border-emerald-500 text-white" : darkMode ? "border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-gray-900" : "border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
              }`}
            >
              {added ? <><FiCheck className="w-4 h-4" /> {t("added")}</> : <><FiShoppingCart className="w-4 h-4" /> {t("addToCart")}</>}
            </button>
            <button onClick={() => goToProduct(product)}
              className="py-2.5 text-sm font-bold flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-500 transition-colors">
              <FiExternalLink className="w-4 h-4" /> View product
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

/* ───────────── White category card ───────────── */
const PosterProductCard = memo(({ product, onAddToCart, onDetails, index = 0 }) => {
  const [cartAdded, setCartAdded] = useState(false);
  const discountedPrice = useMemo(() => getDiscounted(product), [product.price, product.discount]);

  const handleCart = useCallback((e) => {
    e.stopPropagation();
    setCartAdded(true);
    onAddToCart(product);
    setTimeout(() => setCartAdded(false), 1400);
  }, [onAddToCart, product]);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "60px" }}
      onClick={() => goToProduct(product)}
      className="relative flex flex-col flex-shrink-0 w-[150px] sm:w-[190px] overflow-hidden cursor-pointer snap-start bg-white border border-gray-200 border-l-[3px] border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="relative aspect-square bg-white">
        <img
          src={product.imageUrl || "/placeholder.png"}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={190}
          height={190}
          className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300 ease-out"
        />
        {product.discount && (
          <span className="absolute top-0 left-0 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-1"
            style={{ clipPath: "polygon(0 0, 100% 0, 86% 100%, 0% 100%)" }}>
            -{product.discount}%
          </span>
        )}
        <button
          onClick={handleCart}
          aria-label="Add to cart"
          className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center border transition-colors duration-150 ${
            cartAdded ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
          }`}
        >
          {cartAdded ? <FiCheck className="w-3.5 h-3.5" /> : <FiPlus className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="p-2.5 border-t border-gray-100 flex flex-col gap-1.5">
        <p className="font-semibold text-xs leading-snug line-clamp-2 min-h-[2rem] text-gray-900">{product.name}</p>
        <div className="flex items-baseline gap-1.5" dir="ltr">
          <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
            EGP {discountedPrice ?? Number(product.price || 0).toFixed(2)}
          </span>
          {discountedPrice && <span className="text-[10px] line-through text-gray-400 tabular-nums">{Number(product.price || 0).toFixed(2)}</span>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDetails(product); }}
          className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold border border-gray-200 text-gray-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
        >
          <FiInfo className="w-3 h-3" /> Details
        </button>
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

const CategorySlider = memo(({ category, items, darkMode, onAddToCart, onDetails, t, isRTL }) => {
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

  // In RTL, "back towards the start" reads as a right-pointing chevron and
  // "forward" as a left-pointing one, so the icons (only) are mirrored while
  // the underlying scroll direction stays tied to the button's screen position.
  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;
  const ViewAllIcon = isRTL ? FiArrowLeft : FiArrowRight;

  if (!items.length) return null;

  return (
    <div className="mb-10 sm:mb-14">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <button onClick={goToCategory} className="flex items-center gap-3 flex-wrap text-left">
          <CategoryTag darkMode={darkMode}>{category.name}</CategoryTag>
          <span className={`text-xs sm:text-sm font-medium ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {items.length} {items.length === 1 ? t("item") : t("items")}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={goToCategory}
            className={`hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${
              darkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"
            }`}>
            {t("viewAll")} <ViewAllIcon className="w-3 h-3" />
          </button>
          <button onClick={() => scroll("left")} disabled={!canLeft}
            className={`p-1.5 sm:p-2 border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
              darkMode ? "bg-gray-800 border-gray-700 hover:border-emerald-400 text-emerald-400" : "bg-white border-gray-200 hover:border-emerald-500 text-emerald-700"
            }`}>
            <BackIcon className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} disabled={!canRight}
            className={`p-1.5 sm:p-2 border transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
              darkMode ? "bg-gray-800 border-gray-700 hover:border-emerald-400 text-emerald-400" : "bg-white border-gray-200 hover:border-emerald-500 text-emerald-700"
            }`}>
            <ForwardIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={sliderRef} className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 hide-scrollbar">
        {items.map((p, i) => (
          <PosterProductCard key={p.id} product={p} onAddToCart={onAddToCart} onDetails={onDetails} index={i} />
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
      <div className="flex justify-between text-xs font-bold" dir="ltr">
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[0].toLocaleString()}</span>
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">EGP {priceRange[1].toLocaleString()}</span>
      </div>
      <div className="relative h-4 flex items-center" dir="ltr">
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
  selectedCondition, setSelectedCondition, priceRange, setPriceRange, inStockOnly, setInStockOnly, t,
  clearFilters, activeFiltersCount }) => (
  <div className={`${GLASS_STRONG} p-4 sm:p-5`}>
    <div className="flex items-center justify-between mb-1">
      <h3 className={`text-sm font-extrabold uppercase tracking-widest flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
        <FiSliders className="w-4 h-4 text-emerald-500" /> {t("filters")}
      </h3>
      {activeFiltersCount > 0 && (
        <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold">{activeFiltersCount}</span>
      )}
    </div>

    <FilterSection title={t("sortBy")} isOpen={isSortOpen} onToggle={() => setIsSortOpen(!isSortOpen)} darkMode={darkMode}>
      <div className="space-y-1">
        {Object.entries(sortLabels).map(([value, label]) => (
          <RadioOption key={value} value={value} label={label} selected={sortBy === value} onSelect={setSortBy} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title={t("condition")} isOpen={isCondOpen} onToggle={() => setIsCondOpen(!isCondOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2">
        {["all", "New", "Used"].map((c) => (
          <PillButton key={c} label={c === "all" ? t("all") : c} isActive={selectedCondition === c} onClick={() => setSelectedCondition(c)} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title={t("category")} isOpen={isCatOpen} onToggle={() => setIsCatOpen(!isCatOpen)} darkMode={darkMode}>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
        {categories.map((cat) => (
          <PillButton key={cat.id} label={cat.name} isActive={selectedCategories.includes(cat.name)} onClick={() => toggleCategory(cat.name)} darkMode={darkMode} />
        ))}
      </div>
    </FilterSection>

    <FilterSection title={t("priceRange")} isOpen={isPriceOpen} onToggle={() => setIsPriceOpen(!isPriceOpen)} darkMode={darkMode}>
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
        <FiCheckCircle className="w-4 h-4" /> {t("inStockOnly")}
      </button>
    </div>

    <button onClick={clearFilters}
      className="w-full mt-4 py-2.5 border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white font-bold text-xs uppercase tracking-wide transition-colors duration-150 flex items-center justify-center gap-2">
      <FiX /> {t("clearAllFilters")}
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
        <span className={`text-sm sm:text-base font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`} dir="ltr">
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

const ChatCTABanner = memo(({ darkMode, onOpenChat, t }) => (
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
          {t("chatBannerTitle")}
        </h3>
        <p className={`text-sm sm:text-base ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {t("chatBannerDescription")}
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
          {t("startChat")}
        </span>
      </motion.button>
    </motion.div>
  </section>
));

const ShopContent = ({ darkMode, addToCart }) => {
  const language = useAppLanguage();
  const t = useCallback((key) => getShopTranslation(language, key), [language]);
  const { shopId } = useParams();
  const token = localStorage.getItem("authToken");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Computed once per language change: drives icon mirroring and locale-correct
  // date formatting throughout the page.
  const dir = languageDirection(language);
  const isRTL = dir === "rtl";
  const dateLocale = useMemo(() => LOCALE_MAP[language] || "en-GB", [language]);

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
  const [detailsProduct, setDetailsProduct] = useState(null);
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

  const openDetails = useCallback((product) => setDetailsProduct(product), []);
  const closeDetails = useCallback(() => setDetailsProduct(null), []);

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
    document.title = shop?.name ? `${sanitizeText(shop.name)} | Tech-Restore` : t("loadingShop");
  }, [shop?.name, t]);

  const handleAddToCart = useCallback(async (product) => {
    if (!token) {
      const Swal = await loadSwal();
      Swal.fire({ title: t("loginRequiredTitle"), text: t("loginRequiredText"), icon: "warning", confirmButtonText: t("loginButton") })
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
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: t("addedToCartToast"), timer: 1500, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "error", title: t("errorTitle"), text: err?.response?.data?.message || t("addToCartFailed") });
    }
  }, [addToCart, token, navigate, t]);

  const submitReview = useCallback(async () => {
    const comment = newReview.comment?.trim();
    if (!comment || newReview.rating === 0) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("incompleteTitle"), text: t("provideRatingComment") });
      return;
    }
    if (comment.length > 1000) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("tooLongTitle"), text: t("commentTooLong") });
      return;
    }
    try {
      await api.post(`/api/reviews/${encodeURIComponent(shopId)}`, { rating: newReview.rating, comment: sanitizeText(comment) });
      setNewReview({ rating: 0, comment: "" });
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      const Swal = await loadSwal();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: t("reviewAddedToast"), timer: 1500, timerProgressBar: true, showConfirmButton: false });
    } catch {
      const Swal = await loadSwal();
      Swal.fire({ icon: "error", toast: true, position: "top-end", timer: 1500, title: t("submitReviewFailed"), showConfirmButton: false });
    }
  }, [newReview, shopId, queryClientLocal, t]);

  const updateReview = useCallback(async () => {
    const comment = editingReview?.comment?.trim();
    if (!comment || editingReview.rating === 0) return;
    if (comment.length > 1000) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("tooLongTitle"), text: t("commentTooLong") });
      return;
    }
    try {
      await api.put(`/api/reviews/${encodeURIComponent(editingReview.id)}`, { rating: editingReview.rating, comment: sanitizeText(comment) });
      setEditingReview(null);
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      const Swal = await loadSwal();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: t("reviewUpdatedToast"), timer: 1500, timerProgressBar: true, showConfirmButton: false });
    } catch {
      const Swal = await loadSwal();
      Swal.fire(t("errorTitle"), t("updateReviewFailed"), "error");
    }
  }, [editingReview, queryClientLocal, shopId, t]);

  const deleteReview = useCallback(async (reviewId) => {
    const Swal = await loadSwal();
    const result = await Swal.fire({ title: t("deleteReviewTitle"), text: t("deleteReviewText"), icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: t("deleteConfirmButton") });
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/reviews/cancel/${encodeURIComponent(reviewId)}`);
        queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: t("reviewRemovedToast"), timer: 1500, timerProgressBar: true, showConfirmButton: false });
      } catch {
        Swal.fire(t("errorTitle"), t("deleteReviewFailed"), "error");
      }
    }
  }, [queryClientLocal, shopId, t]);

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
    { value: "98.9%", label: t("customerSatisfaction") },
    { value: "24h", label: t("avgDelivery") },
    { value: "4.9★", label: t("avgRating") },
  ], [t]);

  const scrollToProducts = useCallback(() => {
    document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const avgRating = useMemo(() => reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "–", [reviews]);

  // "1 review" vs "3 reviews" — a simple two-form pluralization. Good enough for
  // en/fr/ar in this UI; a full ICU plural set isn't needed for a count label.
  const reviewWord = useCallback((count) => (count === 1 ? t("reviewSingular") : t("reviewPlural")), [t]);

  const filterPanelProps = {
    darkMode, t, sortBy, setSortBy: (v) => startTransition(() => setSortBy(v)), sortLabels,
    selectedCategories, toggleCategory, categories,
    isSortOpen, setIsSortOpen, isCatOpen, setIsCatOpen, isCondOpen, setIsCondOpen, isPriceOpen, setIsPriceOpen,
    selectedCondition, setSelectedCondition: (v) => startTransition(() => setSelectedCondition(v)),
    priceRange, setPriceRange, inStockOnly, setInStockOnly,
    clearFilters: resetFilters, activeFiltersCount,
  };

  // Mirrored chevrons for the bottom pagination bar, same rationale as CategorySlider.
  const PrevIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const NextIcon = isRTL ? FiChevronLeft : FiChevronRight;

  if (shopLoading) return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center`}>
      <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!shop) return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex flex-col items-center justify-center gap-4`}>
      <EmptyBoxIllustration darkMode={darkMode} />
      <p className={`text-xl font-bold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("shopNotFound")}</p>
    </div>
  );

  return (
    <div dir={dir} key={language} className={`min-h-screen overflow-x-hidden transition-all duration-500 ${language === "ar" ? "font-cairo" : "font-poppins"} ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>

      <Suspense fallback={<HeroSkeleton darkMode={darkMode} />}>
        <Hero
          variant="shop"
          darkMode={darkMode}
          badge={shop?.verified ? t("verifiedShop") : t("officialShop")}
          headingLine1=""
          headingAccent={sanitizeText(shop?.name) || "Shop Name"}
          headingLine2=""
          description={
            shop?.description
              ? sanitizeText(shop.description)
              : t("shopDescription")
          }
          buttons={[
            { label: t("viewProducts"), onClick: scrollToProducts, primary: true },
            { label: t("chatWithShop"), onClick: handleOpenChat, primary: false },
          ]}
          stats={heroStats}
        >
          <HeroIconRow darkMode={darkMode} shop={shop} />
        </Hero>
      </Suspense>

      {!productsLoading && categorySections.length > 0 && (
        <div className={`py-10 sm:py-16 ${darkMode ? "bg-gray-950" : "bg-emerald-50/70"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
              <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{t("browseCategory")}</span>
              <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight mt-1.5 ${darkMode ? "text-white" : "text-gray-900"}`}>{t("browseCollections")}</h2>
            </div>
            {categorySections.map(({ category, items }) => (
              <CategorySlider key={category.id} category={category} items={items} darkMode={darkMode} onAddToCart={handleAddToCart} onDetails={openDetails} t={t} isRTL={isRTL} />
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
                <span className={`ml-2 text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("productsFound")}</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="relative">
                  <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                  <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchProducts")} maxLength={100}
                    className={`w-40 sm:w-56 pl-9 pr-8 py-2 border text-sm outline-none focus:border-emerald-400 transition-colors ${
                      darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition" aria-label={t("clear")}>
                      <FiX size={14} />
                    </button>
                  )}
                </div>

                <button onClick={() => setIsSidebarOpen(true)}
                  className={`lg:hidden flex items-center gap-1.5 px-3 py-2 border font-semibold text-xs transition-colors duration-150 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-700"}`}>
                  <FiSliders className="w-3.5 h-3.5 text-emerald-500" /> {t("filters")}
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
                  <ProductCard key={product.id} product={product} darkMode={darkMode} onAddToCart={handleAddToCart} onDetails={openDetails} index={i} t={t} />
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 sm:py-24">
                <div className="mb-4">
                  <EmptyBoxIllustration darkMode={darkMode} />
                </div>
                <p className={`text-base sm:text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>{t("noProducts")}</p>
                <p className={`text-sm mb-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("adjustFilters")}</p>
                {activeFiltersCount > 0 && (
                  <button onClick={resetFilters}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors duration-150">
                    {t("clearFilters")}
                  </button>
                )}
              </motion.div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8 sm:mt-14 gap-1.5 sm:gap-2 flex-wrap">
                <PaginationButton onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} darkMode={darkMode}>
                  <PrevIcon className="w-4 h-4" />
                </PaginationButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationButton key={page} onClick={() => setCurrentPage(page)} active={currentPage === page} darkMode={darkMode}>
                    <span dir="ltr">{page}</span>
                  </PaginationButton>
                ))}
                <PaginationButton onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} darkMode={darkMode}>
                  <NextIcon className="w-4 h-4" />
                </PaginationButton>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatCTABanner darkMode={darkMode} onOpenChat={handleOpenChat} t={t} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 xl:gap-16 items-start">
          <div className="space-y-5 sm:space-y-6 md:space-y-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center border-l-2 ${darkMode ? "border-emerald-400 bg-emerald-900/20" : "border-emerald-600 bg-emerald-50"}`}>
                <FiStar className={`w-5 h-5 sm:w-7 sm:h-7 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`} />
              </div>
              <div>
                <h2 className={`text-xl sm:text-2xl md:text-3xl font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {t("customerReviews")}
                </h2>
                <span className={`text-xs sm:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}
                  {reviews.length > 0 && <> · {t("avgLabel")} <span dir="ltr">{avgRating}</span> ★</>}
                </span>
              </div>
            </div>

            <div className={`p-4 sm:p-6 md:p-7 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-base sm:text-lg font-extrabold mb-3 sm:mb-5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                {t("shareYourExperience")}
              </h3>
              <StarRating value={newReview.rating} onChange={(star) => setNewReview((p) => ({ ...p, rating: star }))} t={t} />
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview((p) => ({ ...p, comment: e.target.value }))}
                placeholder={t("reviewPlaceholder")}
                maxLength={1000}
                className={`mt-3 sm:mt-4 w-full p-3 sm:p-4 border-2 resize-none text-sm leading-relaxed outline-none focus:border-emerald-400 transition-colors ${
                  darkMode ? "bg-gray-900/70 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
                rows={3}
              />
              <span className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`} dir="ltr">{newReview.comment.length}/1000</span>
              <button
                onClick={submitReview}
                disabled={!newReview.comment?.trim() || newReview.rating === 0}
                className="relative mt-3 w-full py-2.5 sm:py-3 font-bold text-sm flex items-center justify-center gap-2 border-2 border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 hover:text-gray-900 transition-colors duration-150 text-emerald-600 dark:text-emerald-400"
              >
                {t("submitReview")}
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
                          <span className={`text-[10px] sm:text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`} dir="ltr">
                            {new Date(r.createdAt).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {sanitizeText(r.comment)}
                        </p>
                        <p className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-semibold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                          — {sanitizeText(r.userName) || t("anonymous")}
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
                  <p className={`text-base sm:text-lg font-semibold mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t("noReviewsYet")}</p>
                  <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{t("beFirstReview")}</p>
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
                <h3 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-2 sm:mb-3" dir="ltr">
                  {avgRating} / 5
                </h3>
                <p className={`text-base sm:text-lg font-bold mb-1.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {reviews.length > 0 ? t("lovedByCustomers") : t("noReviewsYet")}
                </p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {t("basedOn")} <span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}
                </p>
                <div className="w-full mt-6 sm:mt-8 space-y-2">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const count = reviews.filter((r) => r.rating === n).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={n} className="flex items-center gap-2" dir="ltr">
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
                {t("editReview")}
              </h3>
              <StarRating value={editingReview.rating} onChange={(star) => setEditingReview((p) => ({ ...p, rating: star }))} t={t} />
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
                  {t("cancel")}
                </button>
                <button onClick={updateReview}
                  className="px-6 sm:px-8 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-sm shadow-lg hover:from-emerald-500 hover:to-teal-600 transition">
                  {t("update")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailsProduct && (
          <ProductDetailsModal key={detailsProduct.id} product={detailsProduct} darkMode={darkMode} onClose={closeDetails} onAddToCart={handleAddToCart} t={t} />
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