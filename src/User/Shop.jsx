import React, {
  useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback, useId, memo, lazy, Suspense, useDeferredValue, useTransition,
} from "react";
import { Link, useNavigate, useNavigationType, useParams } from "react-router-dom";
import {
  FiSearch, FiTrash2, FiEdit3, FiMessageCircle, FiCheckCircle, FiShoppingCart, FiX, FiSliders,
  FiChevronLeft, FiChevronRight, FiArrowRight, FiCheck, FiChevronDown,
  FiShield, FiTruck, FiRefreshCw, FiTag, FiPackage, FiAward, FiExternalLink, FiArrowUp,
  FiCalendar, FiClock, FiHeart, FiCornerDownRight, FiPlus, FiMapPin, FiPhone, FiAlertCircle, FiShoppingBag,
} from "react-icons/fi";
import { RiStarFill } from "react-icons/ri";
import { LazyMotion, MotionConfig, domAnimation, m, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import api from "../common/api/api";
import useAuthStore from "../common/store/Auth";
import { parseAccessToken } from "../common/utils/authSession";
import { recoverGoogleSession } from "../common/utils/googleSession";
import { resolveImageSrc } from "../common/utils/productutils";
import { useAppLanguage, languageDirection } from "../common/utils/useAppLanguage";
import { UI3D_CSS, Defs3D } from "../components/user/Ui3D";
import { EXTRAS_CSS, Toaster, toast } from "../components/user/UiExtras";
import {
  CONDITIONS, safeImageUrl, priceStep, clamp, clean, loadSwal,
  useBackToTop, useModalLock, useHScroll,
} from "../components/user/ListingKit";
import { IsoIllustration, isoCatKey } from "../components/user/IsoIllustrations";
import enTranslations from "../locales/en/translation.json";
import arTranslations from "../locales/ar/translation.json";
import frTranslations from "../locales/fr/translation.json";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } },
});

const SAVED_KEY = "nb_saved_products";
const SAVED_MAX = 500;
const MOBILE_BATCH = 8;
const HISTOGRAM_BINS = 16;
const LOW_STOCK = 5;
const PRODUCT_PAGE_SIZES = [10, 15, 20, 30];

const HL = (hex) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23${hex}' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")`;

const PG_CSS = `
.pg-root{--dx:1;--ink:#022c22;--sh:#022c22;--acc:#34d399;--tx:#022c22;--mu:#4b5563;--sf:#ffffff;--sf2:#f3f4f6;--pg:#f9fafb;--sale:#c2410c;--pos:#15803d;background:var(--pg);color:var(--tx)}
.pg-root[dir=rtl]{--dx:-1}
.pg-dark{--ink:#000000;--sh:#000000;--acc:#39ff88;--tx:#ffffff;--mu:#a3a3a3;--sf:#2a2a2a;--sf2:#1e1e1e;--pg:#141414;--sale:#fb923c;--pos:#4ade80}
.pg-hl{padding-bottom:.2em;background-position:left bottom;background-repeat:no-repeat;background-size:100% .3em;-webkit-box-decoration-break:clone;box-decoration-break:clone;background-image:${HL("10b981")}}
.pg-dark .pg-hl{background-image:${HL("39ff88")}}
.pg-glow{background-image:radial-gradient(circle at 6% 0%,rgba(52,211,153,.2),transparent 38%),radial-gradient(circle at 96% 100%,rgba(249,115,22,.1),transparent 36%)}
.pg-dark .pg-glow{background-image:radial-gradient(circle at 6% 0%,rgba(57,255,136,.09),transparent 38%),radial-gradient(circle at 96% 100%,rgba(249,115,22,.07),transparent 36%)}
.pg-pattern{--p1:rgba(4,38,26,.13);--p2:rgba(16,185,129,.12);background-image:radial-gradient(circle at 2px 2px,var(--p1) 1.6px,transparent 1.8px),repeating-linear-gradient(135deg,var(--p2) 0 2px,transparent 2px 18px);background-size:22px 22px,auto}
.pg-dark .pg-pattern{--p1:rgba(57,255,136,.14);--p2:rgba(57,255,136,.06)}
.pg-hero{background-color:#d1fae5}
.pg-dark .pg-hero{background-color:#141414}
.pg-rise{animation:pgRise .24s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*22ms)}
@keyframes pgRise{from{opacity:0;transform:translate3d(0,12px,0)}to{opacity:1;transform:none}}
.pg-hero-in{animation:pgHeroIn .5s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*70ms)}
@keyframes pgHeroIn{from{opacity:0;transform:translate3d(0,18px,0)}to{opacity:1;transform:none}}
.pg-pop{animation:pgPop .12s ease-out both;transform-origin:top}
@keyframes pgPop{from{opacity:0;transform:translate3d(0,-6px,0) scale(.98)}to{opacity:1;transform:none}}
.pg-fade{animation:pgFade .16s ease both}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
.pg-spin{animation:pgSpin .7s linear infinite}
@keyframes pgSpin{to{transform:rotate(360deg)}}
.pg-nosb{scrollbar-width:none}
.pg-nosb::-webkit-scrollbar{display:none}
.pg-sb{scrollbar-width:thin;scrollbar-color:var(--acc) var(--sf2)}
.pg-bin{background:var(--sf2);box-shadow:inset 0 0 0 1px rgba(128,128,128,.35)}
.pg-bin-on{background:var(--acc);box-shadow:inset 0 0 0 1.5px var(--ink)}
.pg-range{position:absolute;inset:0;width:100%;height:20px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none}
.pg-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;box-sizing:border-box;pointer-events:auto;width:20px;height:20px;border-radius:6px;background:var(--acc);border:2px solid var(--ink);box-shadow:2px 2px 0 var(--sh);cursor:grab}
.pg-range::-moz-range-thumb{box-sizing:border-box;pointer-events:auto;width:20px;height:20px;border-radius:6px;background:var(--acc);border:2px solid var(--ink);box-shadow:2px 2px 0 var(--sh);cursor:grab}
@media (prefers-reduced-motion:reduce){.pg-rise,.pg-hero-in,.pg-pop,.pg-fade,.pg-spin{animation:none}}
`;

let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === "undefined") return;
  if (document.getElementById("shop-page-styles")) { stylesInjected = true; return; }
  const tag = document.createElement("style");
  tag.id = "shop-page-styles";
  tag.textContent = `${UI3D_CSS}${EXTRAS_CSS}${PG_CSS}`;
  document.head.appendChild(tag);
  stylesInjected = true;
};
injectStyles();

const FOCUS = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]";
const BOX_LG = "rounded-2xl border-[3px] border-[color:var(--ink)] bg-[color:var(--sf)] text-[color:var(--tx)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]";
const BOX_SM = "rounded-2xl border-[3px] border-[color:var(--ink)] bg-[color:var(--sf)] text-[color:var(--tx)] [box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--sh)]";
const PRESS = `transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*8px)_10px_0_0_var(--sh)] active:translate-y-[2px] active:translate-x-[calc(var(--dx)*2px)] active:[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] ${FOCUS}`;
const BTN = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold uppercase [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-100 motion-reduce:transition-none active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const BTN_ON = "bg-[color:var(--acc)] text-emerald-950";
const BTN_OFF = "bg-[color:var(--sf)] text-[color:var(--tx)]";
const BTN_SM = "!min-h-9 !px-3 !py-1.5 text-xs";
const ICON = `inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-[color:var(--ink)] [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-100 motion-reduce:transition-none active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:none] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const FIELD = "rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--sf2)] text-[color:var(--tx)] focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[color:var(--acc)]";
const WRAP = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const SECTION = "py-14 sm:py-20";
const LAZY = "[content-visibility:auto] [contain-intrinsic-size:auto_760px]";
const GRID = "grid grid-cols-2 gap-4 pb-2 pe-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5";
const MUTED = "text-[color:var(--mu)]";

const LOGO_DIR = "/uploads/shop-logos/";
const ABSOLUTE_SRC = /^(https?:)?\/\/|^data:image\/|^blob:/i;
const shopLogoSrc = (s) => {
  const found = [s?.logoUrl, s?.logo, s?.logoPath, s?.shopLogo].find((v) => typeof v === "string" && v.trim());
  const raw = found ? found.trim() : "";
  if (!raw || raw.includes("..")) return null;
  if (ABSOLUTE_SRC.test(raw)) return raw;
  const path = raw.includes("/") ? (raw.startsWith("/") ? raw : `/${raw}`) : `${LOGO_DIR}${encodeURIComponent(raw)}`;
  return resolveImageSrc(path) || path;
};

const SHOP_TRANSLATIONS = {
  en: enTranslations.shop,
  ar: arTranslations.shop || arTranslations.hero?.shopPage,
  fr: frTranslations.shop || frTranslations.hero?.shopPage,
};
const OFFER_TRANSLATIONS = {
  en: enTranslations.offersPage,
  ar: arTranslations.offersPage || arTranslations.hero?.offersPage,
  fr: frTranslations.offersPage || frTranslations.hero?.offersPage,
};
const EXTRA = {
  en: {
    crumbHome: "Home", crumbBreadcrumb: "Breadcrumb", shopBadge: "Shop profile",
    shopBannerTagline: "Browse products, check offers and chat directly with the shop.",
    perPage: "per page", prevPage: "Previous page", nextPage: "Next page",
    pageN: "Page {n}", pagination: "Pagination", productDetails: "Details", imageUnavailable: "Image unavailable", noAddress: "No address listed",
    addressLabel: "Address", phoneLabel: "Phone", shopReply: "Shop reply",
    shopOffers: "Shop Offers", shopOffersSubtitle: "Current deals from this shop", viewAllOffers: "View all offers",
    save: "Save product", saved: "Saved", savedOnly: "Saved only", loadingMore: "Loading more products", endOfList: "You have seen all products",
    all: "All", moreFilters: "More filters", priceMin: "Min", priceMax: "Max", minPriceAria: "Minimum price", maxPriceAria: "Maximum price",
    errorInvalidNumber: "Enter a valid number", errorNegative: "Price can't be negative", errorMinGreater: "Min can't be above max",
    errorMaxLess: "Max can't be below min", errorMaxPrice: "Max price is {{max}}",
    youSave: "Save {{value}}", originalPrice: "Original price", discountedPrice: "Price after discount", discountValue: "Discount",
    onlyLeft: "Only {{count}} left in stock",
  },
  ar: {
    crumbHome: "الرئيسية", crumbBreadcrumb: "مسار التنقل", shopBadge: "ملف المتجر",
    shopBannerTagline: "تصفح المنتجات واطلع على العروض وتحدث مع المتجر مباشرة.",
    perPage: "لكل صفحة", prevPage: "الصفحة السابقة", nextPage: "الصفحة التالية",
    pageN: "صفحة {n}", pagination: "التنقل بين الصفحات", productDetails: "التفاصيل", imageUnavailable: "الصورة غير متاحة", noAddress: "لا يوجد عنوان مسجل",
    addressLabel: "العنوان", phoneLabel: "الهاتف", shopReply: "رد المتجر",
    shopOffers: "عروض المتجر", shopOffersSubtitle: "أحدث العروض الحالية من هذا المتجر", viewAllOffers: "عرض كل العروض",
    save: "حفظ المنتج", saved: "تم الحفظ", savedOnly: "المحفوظة فقط", loadingMore: "جارٍ تحميل المزيد من المنتجات", endOfList: "لقد شاهدت جميع المنتجات",
    all: "الكل", moreFilters: "فلاتر إضافية", priceMin: "الأدنى", priceMax: "الأقصى", minPriceAria: "السعر الأدنى", maxPriceAria: "السعر الأقصى",
    errorInvalidNumber: "أدخل رقمًا صحيحًا", errorNegative: "لا يمكن أن يكون السعر سالبًا", errorMinGreater: "الحد الأدنى لا يمكن أن يتجاوز الأقصى",
    errorMaxLess: "الحد الأقصى لا يمكن أن يقل عن الأدنى", errorMaxPrice: "أقصى سعر هو {{max}}",
    youSave: "وفّر {{value}}", originalPrice: "السعر الأصلي", discountedPrice: "السعر بعد الخصم", discountValue: "الخصم",
    onlyLeft: "متبقي {{count}} فقط في المخزون",
  },
  fr: {
    crumbHome: "Accueil", crumbBreadcrumb: "Fil d'Ariane", shopBadge: "Profil de la boutique",
    shopBannerTagline: "Parcourez les produits, consultez les offres et discutez directement avec la boutique.",
    perPage: "par page", prevPage: "Page précédente", nextPage: "Page suivante",
    pageN: "Page {n}", pagination: "Pagination", productDetails: "Détails", imageUnavailable: "Image indisponible", noAddress: "Aucune adresse indiquée",
    addressLabel: "Adresse", phoneLabel: "Téléphone", shopReply: "Réponse de la boutique",
    shopOffers: "Offres de la boutique", shopOffersSubtitle: "Les offres du moment de cette boutique", viewAllOffers: "Voir toutes les offres",
    save: "Enregistrer le produit", saved: "Enregistré", savedOnly: "Enregistrés uniquement", loadingMore: "Chargement d'autres produits", endOfList: "Vous avez vu tous les produits",
    all: "Tous", moreFilters: "Plus de filtres", priceMin: "Min", priceMax: "Max", minPriceAria: "Prix minimum", maxPriceAria: "Prix maximum",
    errorInvalidNumber: "Saisissez un nombre valide", errorNegative: "Le prix ne peut pas être négatif", errorMinGreater: "Le min ne peut pas dépasser le max",
    errorMaxLess: "Le max ne peut pas être inférieur au min", errorMaxPrice: "Le prix max est {{max}}",
    youSave: "Économisez {{value}}", originalPrice: "Prix d'origine", discountedPrice: "Prix après remise", discountValue: "Remise",
    onlyLeft: "Plus que {{count}} en stock",
  },
};
const getShopTranslation = (language, key, fallbackOrParams) => {
  const fallback = typeof fallbackOrParams === "string" ? fallbackOrParams : undefined;
  const raw = SHOP_TRANSLATIONS[language]?.[key] || EXTRA[language]?.[key] || SHOP_TRANSLATIONS.en?.[key] || EXTRA.en[key] || fallback || key;
  if (fallbackOrParams && typeof fallbackOrParams === "object" && typeof raw === "string") {
    return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => (fallbackOrParams[k] !== undefined ? fallbackOrParams[k] : ""));
  }
  return raw;
};
const getOfferTranslation = (language, key) => OFFER_TRANSLATIONS[language]?.[key] || OFFER_TRANSLATIONS.en?.[key] || key;

const LOCALE_MAP = { en: "en-GB", ar: "ar-EG", fr: "fr-FR" };

const ChatModal = lazy(() => import("../components/user/UserChatModal"));
const prefetchChatModal = () => import("../components/user/UserChatModal");

const conditionLabel = (t, value) => (value ? t(`condition${value}`, String(value)) : t("conditionUnknown"));

const NUMBER_FORMAT = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const COMPACT_FORMAT = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const money = (n, currency) => `${currency} ${NUMBER_FORMAT.format(Number(n) || 0)}`;
const round2 = (n) => Math.round(n * 100) / 100;

const computeFinal = (price, type, value) => {
  if (!(price > 0) || !(value > 0) || !type) return price;
  if (type === "PERCENTAGE") return value < 100 ? round2(price - (price * value) / 100) : price;
  return value < price ? round2(price - value) : price;
};

const normalizeProduct = (p) => {
  const price = Math.max(0, Number(p.price) || 0);
  const legacy = clamp(Number(p.discount) || 0, 0, 100);
  const apiFinal = Number(p.finalPrice);
  const discountValue = Number(p.discountValue) || 0;
  const apiType = p.discountType || null;
  let finalPrice = price;
  if (apiFinal > 0 && apiFinal < price) finalPrice = apiFinal;
  else if (discountValue > 0 && apiType) finalPrice = computeFinal(price, apiType, discountValue);
  else if (legacy) finalPrice = round2(price * (1 - legacy / 100));
  const saving = round2(Math.max(0, price - finalPrice));
  const discount = price > 0 ? (saving / price) * 100 : 0;
  return {
    ...p,
    price,
    finalPrice,
    saving,
    discount,
    discountType: saving > 0 ? (apiType || "PERCENTAGE") : null,
    discountValue: saving > 0 && discountValue > 0 ? discountValue : 0,
    imageUrl: safeImageUrl(p.imageUrl || p.image) || "",
    _final: finalPrice,
    _desc: clean(p.description, 140),
    _rating: clamp(Number(p.rating ?? p.averageRating) || 0, 0, 5),
    _reviews: Math.max(0, Number(p.reviewCount ?? p.reviewsCount ?? p.ratingCount) || 0),
    _text: `${p.name || ""} ${p.description || ""} ${p.brand || ""}`.toLowerCase(),
    _cat: p.categoryName || p.category || "",
    _ts: Date.parse(p.createdAt) || 0,
  };
};

const kindOf = (name = "") => {
  const k = String(name).toLowerCase();
  if (k.includes("laptop") || k.includes("notebook") || k.includes("computer")) return "laptop";
  if (k.includes("phone") || k.includes("mobile")) return "phone";
  if (k.includes("tablet") || k.includes("ipad")) return "tablet";
  if (k.includes("audio") || k.includes("headphone") || k.includes("earbud")) return "audio";
  if (k.includes("watch") || k.includes("wear")) return "watch";
  if (k.includes("monitor") || k.includes("screen") || k.includes("tv") || k.includes("display")) return "monitor";
  if (k.includes("game") || k.includes("console")) return "gaming";
  if (k.includes("camera") || k.includes("photo")) return "camera";
  return "box";
};

const REVIEWS_PER_PAGE = 6;
const TOAST_MS = 2800;
const STARS = [1, 2, 3, 4, 5];
const RATING_BARS = [5, 4, 3, 2, 1];
const SOON_DAYS = 3;
const OFFERS_SHOWN = 6;
const EMPTY_LIST = [];
const STAGGER = Array.from({ length: 10 }, (_, i) => ({ "--i": i }));

const fmtCache = {};
const dateFmt = (language, withYear) => {
  const loc = LOCALE_MAP[language] || "en-GB";
  const k = `${loc}:${withYear}`;
  fmtCache[k] ||= new Intl.DateTimeFormat(loc, withYear ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
  return fmtCache[k];
};
const rtfCache = {};
const rtf = (language) => {
  const loc = LOCALE_MAP[language] || "en-GB";
  rtfCache[loc] ||= new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
  return rtfCache[loc];
};
const toDate = (v) => {
  if (v == null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const daysLeftNum = (end) => {
  const e = toDate(end);
  if (!e) return null;
  const diff = Math.ceil((e - new Date()) / 86400000);
  return diff < 0 ? null : diff;
};
const formatRange = (start, end, language) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return "";
  return `${dateFmt(language, false).format(s)} — ${dateFmt(language, true).format(e)}`;
};
const normType = (type) => {
  const s = String(type ?? "").toUpperCase();
  if (s === "PERCENTAGE" || s === "PERCENT") return "PERCENTAGE";
  if (s === "FIXED_AMOUNT" || s === "FIXED_VALUE" || s === "FIXED") return "FIXED_AMOUNT";
  return "";
};
const normalizeOffer = (o) => {
  const type = normType(o.discountType);
  const isPct = type === "PERCENTAGE";
  const raw = Math.max(0, Number(o.discountValue) || 0);
  return {
    id: String(o.id),
    name: clean(String(o.name ?? ""), 120),
    description: o.description ? clean(String(o.description), 600) : "",
    discountType: type,
    discountValue: isPct ? Math.min(raw, 100) : raw,
    startDate: o.startDate || null,
    endDate: o.endDate || null,
    status: o.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    shopId: o.shopId != null ? String(o.shopId) : "",
    shopName: o.shopName ? clean(String(o.shopName), 80) : "",
  };
};
const EMPTY_OFFER = { discountType: "", discountValue: 0, status: "INACTIVE" };
const useOfferMeta = (offer, language, currency) =>
  useMemo(() => {
    const days = daysLeftNum(offer.endDate);
    const isPct = offer.discountType === "PERCENTAGE";
    const isFixed = offer.discountType === "FIXED_AMOUNT";
    return {
      isPct,
      isFixed,
      remaining: days === null ? null : rtf(language).format(days, "day"),
      urgent: days !== null && days <= SOON_DAYS,
      range: formatRange(offer.startDate, offer.endDate, language),
      amount: isPct ? `${offer.discountValue}%` : isFixed ? money(offer.discountValue, currency) : String(offer.discountValue),
    };
  }, [offer, language, currency]);

const useIsMobile = (query = "(max-width: 1023.98px)") => {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
};

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    if (!Array.isArray(v)) return [];
    return v.filter((x) => (typeof x === "string" && x.length <= 64) || Number.isFinite(x)).slice(-SAVED_MAX);
  } catch {
    return [];
  }
};

const useSavedProducts = () => {
  const [ids, setIds] = useState(readSaved);
  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-SAVED_MAX);
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);
  const set = useMemo(() => new Set(ids), [ids]);
  return [set, toggle];
};

const EASE = [0.16, 1, 0.3, 1];
const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.14, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: "easeIn" } },
};
const PANEL_MOTION = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: EASE } },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.1, ease: "easeIn" } },
};
const drawerMotion = (rtl) => {
  const off = rtl ? "100%" : "-100%";
  return {
    initial: { x: off },
    animate: { x: 0, transition: { duration: 0.2, ease: EASE } },
    exit: { x: off, transition: { duration: 0.13, ease: "easeIn" } },
  };
};
const GPU = { willChange: "transform, opacity" };

const useScrollTopOnEnter = (key) => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [key]);
};

const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "").slice(0, 20)}`;

const isDuplicateReview = (err) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const text = `${data.message || ""} ${data.error_code || data.code || ""}`;
  return status === 409 || /already (submitted|reviewed)|duplicate/i.test(text);
};

const reviewError = (err, fallback, ctx, t) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const raw = String(data.message || "");
  const code = String(data.error_code || data.code || "");
  if (isDuplicateReview(err)) return t("alreadyReviewed");
  if (/only review a shop after delivery/i.test(raw)) return t("reviewAfterDelivery");
  if (/value too long|varying\(255\)/i.test(raw)) return t("commentSaveTooLong");
  if (/shop not found/i.test(raw)) return t("shopNotFoundRefresh");
  if (/only (update|delete) your review/i.test(raw)) return t("onlyOwnReviews");
  if (status === 403) return ctx === "create" ? t("reviewAfterDelivery") : t("onlyOwnReviews");
  if (status === 404) return t("reviewNotFoundRefresh");
  if (/intCompact|rating/i.test(raw)) return t("selectRatingFirst");
  if (status >= 500 || /RUNTIME_ERROR|RT_001/i.test(`${raw} ${code}`) || !raw) return fallback;
  return raw;
};

const splitHeading = (text) => {
  const str = String(text ?? "");
  if (str.includes("**")) return str.split("**").map((part, i) => ({ part, hl: i % 2 === 1 }));
  const mt = str.match(/^(.*[,،]\s*)([^,،]+)$/);
  if (mt) return [{ part: mt[1], hl: false }, { part: mt[2], hl: true }];
  const words = str.split(" ");
  if (words.length < 2) return [{ part: str, hl: true }];
  const n = words.length <= 3 ? 1 : 2;
  return [{ part: `${words.slice(0, -n).join(" ")} `, hl: false }, { part: words.slice(-n).join(" "), hl: true }];
};

const SectionTitle = memo(({ title, subtitle, children }) => {
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-12">
      <div className="min-w-0 max-w-3xl">
        <h2 className="text-3xl font-extrabold leading-[1.18] tracking-[-0.04em] [text-wrap:balance] rtl:leading-[1.4] rtl:tracking-normal sm:text-5xl lg:text-6xl">
          {parts.map(({ part, hl }, i) => (hl ? <span key={i} className="pg-hl">{part}</span> : part))}
        </h2>
        {subtitle && <p className={`mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${MUTED}`}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
});

const CardFooter = memo(({ label }) => (
  <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-[color:var(--ink)] pt-3">
    <span className="truncate text-sm font-extrabold uppercase tracking-wide rtl:tracking-normal">{label}</span>
    <span aria-hidden="true" className={`${ICON} h-9 w-9 bg-[color:var(--acc)] text-emerald-950`}><FiArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
  </div>
));

const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = "", align = "start" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[selectedIdx];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [isOpen]);
  useEffect(() => { if (isOpen) setActive(selectedIdx); }, [isOpen, selectedIdx]);
  useEffect(() => { if (isOpen) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [isOpen, active]);

  const choose = (i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setIsOpen(false);
    btnRef.current?.focus();
  };
  const onKeyDown = (e) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.min(i + 1, last)); break;
      case "ArrowUp": e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.max(i - 1, 0)); break;
      case "Home": if (isOpen) { e.preventDefault(); setActive(0); } break;
      case "End": if (isOpen) { e.preventDefault(); setActive(last); } break;
      case "Enter": case " ": e.preventDefault(); if (isOpen) choose(active); else setIsOpen(true); break;
      case "Escape": if (isOpen) { e.preventDefault(); e.stopPropagation(); setIsOpen(false); } break;
      case "Tab": setIsOpen(false); break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${isOpen ? "z-30" : ""} ${className}`}>
      <button
        ref={btnRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listId}
        aria-activedescendant={isOpen ? `${uid}-o${active}` : undefined}
        onClick={() => setIsOpen((o) => !o)} onKeyDown={onKeyDown}
        className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 px-3 text-start text-sm font-semibold outline-none ${FIELD} ${FOCUS}`}
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className={`pg-pop pg-sb absolute top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1 ${BOX_SM} !rounded-xl ${align === "end" ? "end-0" : "start-0"}`}>
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={selected}
                onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-sm font-bold ${selected ? "bg-[color:var(--acc)] text-emerald-950" : i === active ? "bg-[color:var(--sf2)]" : ""}`}>
                <span className="truncate">{o.label}</span>
                {selected && <FiCheck aria-hidden="true" className="h-4 w-4 flex-shrink-0" strokeWidth={3} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

const FilterChip = memo(({ label, onRemove }) => (
  <button type="button" onClick={onRemove} className={`${BTN} ${BTN_OFF} ${BTN_SM} normal-case`}>
    <span className="max-w-[10rem] truncate">{label}</span><FiX aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
  </button>
));

const pageWindow = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 3) [2, 3, 4].forEach((x) => set.add(x));
  if (cur >= total - 2) [total - 1, total - 2, total - 3].forEach((x) => set.add(x));
  const nums = [...set].filter((x) => x >= 1 && x <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((x, i) => { if (i && x - nums[i - 1] > 1) out.push(`gap-${x}`); out.push(x); });
  return out;
};

const PAGE_BTN = `${BTN} !min-h-10 !min-w-[2.5rem] !px-2 tabular-nums`;

const Pagination = memo(({ page, total, onChange, label, t }) => {
  const items = useMemo(() => pageWindow(page, total), [page, total]);
  if (total <= 1) return null;
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap items-center justify-center gap-2 pe-1 pb-1">
        <li>
          <button type="button" className={`${PAGE_BTN} ${BTN_OFF}`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t("prevPage")}>
            <FiChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
          </button>
        </li>
        {items.map((x) => (typeof x === "number" ? (
          <li key={x}>
            <button type="button" onClick={() => onChange(x)} aria-label={t("pageN").replace("{n}", x)} aria-current={x === page ? "page" : undefined}
              className={`${PAGE_BTN} ${x === page ? BTN_ON : BTN_OFF}`}>{x}</button>
          </li>
        ) : <li key={x} aria-hidden="true" className="px-1 font-extrabold">…</li>))}
        <li>
          <button type="button" className={`${PAGE_BTN} ${BTN_OFF}`} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t("nextPage")}>
            <FiChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
          </button>
        </li>
      </ul>
    </nav>
  );
});

const InfiniteSentinel = memo(({ hasMore, shown, total, onMore, t }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return undefined;
    if (typeof IntersectionObserver === "undefined") { onMore(); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onMore(); }, { rootMargin: "700px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown, onMore]);
  return (
    <div ref={ref} className="flex min-h-[3.5rem] items-center justify-center pt-8" role="status" aria-live="polite">
      {hasMore ? (
        <span className="flex items-center gap-2 text-xs font-extrabold uppercase">
          <span aria-hidden="true" className="pg-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
          {t("loadingMore")}
        </span>
      ) : total > MOBILE_BATCH ? (
        <span className={`flex items-center gap-1.5 text-xs font-extrabold uppercase ${MUTED}`}><FiCheck aria-hidden="true" className="h-3.5 w-3.5" />{t("endOfList")}</span>
      ) : null}
    </div>
  );
});

const Frame = ({ darkMode, dir, language, isAr, children }) => (
  <div dir={dir} lang={language} className={`pg-root ${darkMode ? "pg-dark" : ""} min-h-screen overflow-x-clip ${isAr ? "font-cairo" : "font-jakarta"}`}>
    {children}
  </div>
);

const ShopLogo = memo(({ src, name, children }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  const onError = useCallback(() => setFailed(true), []);
  if (!src || failed) return children;
  return (
    <img
      src={src} alt={name || ""} width={200} height={200}
      decoding="async" fetchPriority="high" referrerPolicy="no-referrer" onError={onError}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
});

const DeviceArt = memo(({ name, categoryName, darkMode, label }) => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden bg-[color:var(--sf2)]"
    role="img" aria-label={name ? `${name} – ${label}` : label}
  >
    <IsoIllustration
      type={isoCatKey(kindOf(categoryName || name))} tone="emerald" darkMode={darkMode} onGreen={false}
      className="h-[64%] w-[64%] transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105"
    />
    <span className={`max-w-full truncate px-2 text-[9px] font-extrabold uppercase tracking-widest ${MUTED}`}>{label}</span>
  </div>
));

const ShopBanner = memo(({ darkMode, title, onViewProducts, onChat, t }) => {
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <section className="pg-pattern pg-hero relative isolate overflow-hidden border-b-[3px] border-[color:var(--ink)]">
      <div aria-hidden="true" className="pg-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-28 pt-32 sm:px-6 sm:pb-36 sm:pt-40 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 lg:px-8 lg:pb-44">
        <div className="min-w-0">
          <nav aria-label={t("crumbBreadcrumb")} className="pg-hero-in flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase sm:text-sm" style={STAGGER[0]}>
            <Link to="/" className={`rounded underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 hover:no-underline ${FOCUS}`}>{t("crumbHome")}</Link>
            <FiChevronRight aria-hidden="true" className="h-3 w-3 flex-shrink-0 rtl:rotate-180" />
            <span className={`max-w-[14rem] truncate ${MUTED}`} aria-current="page">{title}</span>
          </nav>

          <p
            className="pg-hero-in mt-6 inline-flex items-center gap-2 rounded-full border-[3px] border-[color:var(--ink)] bg-[color:var(--acc)] px-4 py-1.5 text-xs font-extrabold uppercase text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] rtl:tracking-normal"
            style={STAGGER[1]}
          >
            <FiShoppingBag aria-hidden="true" className="h-3.5 w-3.5" />{t("shopBadge")}
          </p>

          <h1
            className="pg-hero-in mt-6 max-w-3xl break-words text-4xl font-extrabold leading-[1.15] tracking-[-0.04em] [text-wrap:balance] rtl:leading-[1.4] rtl:tracking-normal sm:text-6xl lg:text-7xl"
            style={STAGGER[2]}
          >
            {parts.map(({ part, hl }, i) => (hl ? <span key={i} className="pg-hl">{part}</span> : part))}
          </h1>

          <p className={`pg-hero-in mt-6 max-w-xl text-base font-medium leading-relaxed sm:text-lg ${MUTED}`} style={STAGGER[3]}>{t("shopBannerTagline")}</p>

          <div className="pg-hero-in mt-8 flex flex-wrap items-center gap-4 pb-1 pe-1" style={STAGGER[4]}>
            <button type="button" onClick={onViewProducts} className={`${BTN} ${BTN_ON}`}>
              <FiShoppingCart aria-hidden="true" className="h-4 w-4" />{t("viewProducts")}
            </button>
            <button type="button" onClick={onChat} onMouseEnter={prefetchChatModal} onFocus={prefetchChatModal} className={`${BTN} ${BTN_OFF}`}>
              <FiMessageCircle aria-hidden="true" className="h-4 w-4" />{t("chatWithShop")}
            </button>
          </div>
        </div>

        <div aria-hidden="true" className="pg-hero-in pointer-events-none hidden h-56 w-56 lg:block xl:h-72 xl:w-72" style={STAGGER[3]}>
          <IsoIllustration type="shop_store" tone="emerald" darkMode={darkMode} onGreen={false} className="h-full w-full" />
        </div>
      </div>
    </section>
  );
});

const ContactTile = memo(({ icon: Icon, label, href, children }) => {
  const cls = "flex w-full min-w-0 items-center gap-3 rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--sf2)] px-3 py-2.5 text-start";
  const body = (
    <>
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[10px] font-bold uppercase ${MUTED}`}>{label}</span>
        <span className="block text-sm font-extrabold">{children}</span>
      </span>
    </>
  );
  return href
    ? <a href={href} className={`${cls} transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none ${FOCUS}`}>{body}</a>
    : <div className={cls}>{body}</div>;
});

const ShopDetails = memo(({ shop, logo, darkMode, stats, t }) => {
  const address = clean(shop?.shopAddress?.fullAddress || [shop?.shopAddress?.street, shop?.shopAddress?.city].filter(Boolean).join(", "), 200);
  const phone = shop?.phone ? clean(String(shop.phone), 30) : "";
  return (
    <section aria-label={clean(shop?.name, 120) || t("shopFallback")} className="pg-glow relative z-20 bg-[color:var(--pg)]">
      <div className={`${WRAP} -mt-16 pb-14 sm:-mt-24 sm:pb-20`}>
        <div className={`${BOX_LG} p-4 sm:p-7`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-[3px] border-[color:var(--ink)] bg-[color:var(--sf2)] sm:h-24 sm:w-24">
                <ShopLogo src={logo} name={shop?.name}>
                  <IsoIllustration type="shop_store" darkMode={darkMode} onGreen={false} className="h-12 w-12 sm:h-20 sm:w-20" />
                </ShopLogo>
              </span>
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-extrabold uppercase leading-tight tracking-[-0.02em] rtl:tracking-normal sm:text-4xl">{clean(shop?.name, 120) || t("shopFallback")}</h2>
                <p className={`mt-4 max-w-2xl text-sm font-medium leading-relaxed sm:text-base ${MUTED}`}>{clean(shop?.description, 600) || t("shopDescription")}</p>
              </div>
            </div>

            <div className="grid w-full items-start gap-3 sm:grid-cols-2 lg:w-[24rem] lg:grid-cols-1">
              <ContactTile icon={FiMapPin} label={t("addressLabel")}>
                {address ? <span className="line-clamp-2 break-words">{address}</span> : <span className={`font-bold ${MUTED}`}>{t("noAddress")}</span>}
              </ContactTile>
              {phone && (
                <ContactTile icon={FiPhone} label={t("phoneLabel")} href={telHref(phone)}>
                  <span dir="ltr" className="block truncate text-start">{phone}</span>
                </ContactTile>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 border-t-2 border-dotted border-[color:var(--ink)] pt-4 text-center">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0 px-1">
                <p className="text-xl font-extrabold tabular-nums sm:text-3xl" dir="ltr">{s.value}</p>
                <p className={`truncate text-[11px] font-bold uppercase sm:text-xs ${MUTED}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

const OfferStatus = memo(({ remaining, urgent }) => (
  remaining ? (
    <p className={`flex items-center gap-1 text-xs font-extrabold uppercase ${urgent ? "text-[color:var(--sale)]" : MUTED}`}>
      <FiClock aria-hidden="true" className="h-3 w-3" />{remaining}
    </p>
  ) : null
));

const ShopOfferCard = memo(({ offer, index, language, currency, onOpen, ot }) => {
  const meta = useOfferMeta(offer, language, currency);
  const open = useCallback(() => onOpen(offer), [onOpen, offer]);
  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={offer.name}
      style={STAGGER[index % 10]}
      className={`pg-rise group relative flex h-full cursor-pointer flex-col overflow-hidden ${BOX_SM} ${PRESS}`}
    >
      <div className="flex h-28 items-baseline justify-center gap-2 border-b-[3px] border-[color:var(--ink)] bg-[color:var(--acc)] pt-7 text-emerald-950">
        <span dir="ltr" className="text-5xl font-black leading-none tabular-nums">{offer.discountValue}{meta.isPct ? "%" : ""}</span>
        <span className="text-xs font-extrabold uppercase">{meta.isFixed ? `${currency} ` : ""}{ot("off")}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <OfferStatus remaining={meta.remaining} urgent={meta.urgent} />
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-base font-extrabold uppercase leading-snug">{offer.name}</h3>
          <p className={`mt-2 line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-5 ${MUTED}`}>{offer.description || ot("descriptionFallback")}</p>
        </div>
        {meta.range && (
          <p className="flex items-center gap-1.5 text-xs font-bold">
            <FiCalendar aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--pos)]" />
            <span dir="ltr" className="truncate">{meta.range}</span>
          </p>
        )}
        <CardFooter label={meta.isPct ? ot("percentageDiscount") : ot("off")} />
      </div>
    </article>
  );
});

const OfferInfoRow = ({ Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border-2 border-dotted border-[color:var(--ink)] bg-[color:var(--sf2)] p-3">
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950"><Icon aria-hidden="true" className="h-4 w-4" /></span>
    <div className="min-w-0 flex-1">
      <p className={`text-[10px] font-extrabold uppercase ${MUTED}`}>{label}</p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  </div>
);

const ShopOfferModal = memo(({ offer, language, currency, onClose, onViewProducts, ot, t }) => {
  useModalLock(true, onClose);
  const meta = useOfferMeta(offer || EMPTY_OFFER, language, currency);
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={offer?.name || ot("offerDetails")}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className={`pg-sb relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain sm:max-w-md ${BOX_LG}`}>
        <div className="relative border-b-[3px] border-[color:var(--ink)] bg-[color:var(--sf2)] p-4 pe-16 sm:p-5">
          <h2 className="line-clamp-2 text-base font-extrabold uppercase sm:text-lg"><span className="pg-hl">{offer?.name || ot("offerDetails")}</span></h2>
          <button type="button" onClick={onClose} aria-label={t("close")} className={`${ICON} ${BTN_OFF} absolute end-3 top-3 h-10 w-10`}><FiX aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <OfferStatus remaining={meta.remaining} urgent={meta.urgent} />
          {offer?.description && <p className={`text-sm font-medium leading-relaxed ${MUTED}`}>{offer.description}</p>}
          <OfferInfoRow Icon={FiTag} label={ot("youSave")} value={meta.amount} />
          {meta.range && <OfferInfoRow Icon={FiCalendar} label={ot("validPeriod")} value={meta.range} />}
          <div className="grid grid-cols-2 gap-3 pb-2 pe-1 pt-2">
            <button type="button" onClick={onClose} className={`${BTN} ${BTN_OFF}`}>{t("close")}</button>
            <button type="button" onClick={() => { onClose(); onViewProducts(); }} className={`${BTN} ${BTN_ON}`}><FiShoppingCart aria-hidden="true" className="h-4 w-4" />{t("viewProducts")}</button>
          </div>
        </div>
      </m.div>
    </div>
  );
});

const Price = memo(({ product, currency, t, large = false }) => {
  const d = product.saving > 0;
  return (
    <div className="min-w-0" dir="ltr">
      {d && (
        <p className={`tabular-nums line-through ${MUTED} ${large ? "text-sm" : "text-[11px]"}`}>
          <span className="sr-only">{t("originalPrice")}: </span>{money(product.price, currency)}
        </p>
      )}
      <p className={`truncate font-extrabold leading-tight tabular-nums ${large ? "text-3xl" : "text-lg"} ${d ? "text-[color:var(--sale)]" : ""}`}>
        <span className="sr-only">{d ? `${t("discountedPrice")}: ` : ""}</span>{money(product._final, currency)}
      </p>
      {d && (
        <p dir="auto" className={`truncate font-bold text-[color:var(--sale)] ${large ? "mt-1 text-sm" : "text-[11px]"}`}>
          {t("youSave", { value: money(product.saving, currency) })}
        </p>
      )}
    </div>
  );
});

const ProductCard = memo(({ product: p, darkMode, isSaved = false, onSave, onAddToCart, onDetails, t }) => {
  const src = p.imageUrl;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(!src);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const mounted = useRef(true);
  const loadedRef = useRef(false);
  const timer = useRef();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    loadedRef.current = false;
    setImgLoaded(false);
    setImgError(!src);
    if (!src) return undefined;
    const id = setTimeout(() => { if (!loadedRef.current) setImgError(true); }, 8000);
    return () => clearTimeout(id);
  }, [src]);

  const inStock = p.stock == null || p.stock > 0;
  const low = p.stock != null && p.stock > 0 && p.stock <= LOW_STOCK;
  const name = clean(p.name, 120) || t("product");
  const currency = t("currency");
  const snippet = p._desc || t("noProductDescription");
  const open = useCallback(() => onDetails(p), [onDetails, p]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(p.id); }, [onSave, p.id]);
  const handleLoad = useCallback(() => { loadedRef.current = true; setImgLoaded(true); }, []);
  const handleImgError = useCallback(() => setImgError(true), []);

  const add = useCallback(async (e) => {
    e.stopPropagation();
    if (!inStock || adding) return;
    setAdding(true);
    const ok = await onAddToCart(p);
    if (!mounted.current) return;
    setAdding(false);
    if (ok) {
      setAdded(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { if (mounted.current) setAdded(false); }, 1400);
    }
  }, [onAddToCart, p, inStock, adding]);

  return (
    <article
      onClick={open} tabIndex={0} aria-label={name}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(); }}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden ${BOX_SM} ${PRESS}`}
    >
      <div className="relative aspect-[5/4] w-full flex-shrink-0 overflow-hidden border-b-[3px] border-[color:var(--ink)] bg-white [contain:layout_paint]">
        {imgError ? (
          <DeviceArt name={name} categoryName={p.categoryName || p._cat} darkMode={darkMode} label={t("imageUnavailable")} />
        ) : (
          <>
            {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/5 motion-reduce:animate-none" />}
            <img
              src={src} alt={name} width={480} height={384}
              loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
              onLoad={handleLoad} onError={handleImgError}
              className={`absolute inset-0 h-full w-full object-contain p-4 transition-[opacity,transform] duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"} ${inStock ? "" : "opacity-50"}`}
            />
          </>
        )}
        <button type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t("saved") : t("save")} title={isSaved ? t("saved") : t("save")}
          className={`${ICON} absolute end-2.5 top-2.5 z-10 h-10 w-10 bg-white text-emerald-950`}>
          <FiHeart aria-hidden="true" className={`h-4 w-4 ${isSaved ? "text-rose-500" : ""}`} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug">{name}</h3>
        <p className={`line-clamp-2 min-h-[2.5rem] text-xs leading-5 ${MUTED}`}>{snippet}</p>

        {p._rating > 0 && (
          <p className="flex items-center gap-1 text-xs font-bold" dir="ltr">
            <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
            <span className="tabular-nums">{p._rating.toFixed(1)}</span>
            {p._reviews > 0 && <span className={`font-medium tabular-nums ${MUTED}`}>({COMPACT_FORMAT.format(p._reviews)})</span>}
          </p>
        )}

        {!inStock ? (
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
            <FiAlertCircle aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />{t("outOfStock")}
          </p>
        ) : low ? (
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <FiAlertCircle aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" />{t("onlyLeft", { count: p.stock })}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 border-t-2 border-dotted border-[color:var(--ink)] pt-2.5">
          <Price product={p} currency={currency} t={t} />
          <button type="button" onClick={add} disabled={!inStock || adding} aria-label={t("addToCart")} title={t("addToCart")}
            className={`${ICON} h-11 w-11 rounded-xl bg-[color:var(--acc)] text-emerald-950`}>
            {adding ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
              : added ? <FiCheck aria-hidden="true" className="h-5 w-5" /> : <FiPlus aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </article>
  );
});

const ProductSkeleton = () => <div className="h-[380px] animate-pulse rounded-2xl bg-[color:var(--sf2)] motion-reduce:animate-none" />;

const StarRating = memo(({ value, onChange, size = "h-8 w-8 sm:h-9 sm:w-9", t }) => (
  <div className="flex gap-1 sm:gap-2" role="radiogroup" aria-label={t("rating")}>
    {STARS.map((star) => (
      <button key={star} type="button" role="radio" aria-checked={value === star} onClick={() => onChange(star)}
        aria-label={t("rateStars").replace("{star}", star)}
        className={`rounded-md transition-transform duration-100 hover:scale-110 active:scale-95 motion-reduce:transition-none ${FOCUS}`}>
        <RiStarFill className={`${size} ${value >= star ? "text-amber-500" : "text-[color:var(--mu)] opacity-35"}`} />
      </button>
    ))}
  </div>
));

const ReviewForm = memo(({ t, hasReview, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const send = async () => {
    if (sending) return;
    setSending(true);
    const ok = await onSubmit({ rating, comment });
    if (!mounted.current) return;
    setSending(false);
    if (ok) { setRating(0); setComment(""); }
  };

  return (
    <div className={`${BOX_LG} p-4 sm:p-6`}>
      <h3 className="mb-4 text-lg font-extrabold uppercase sm:text-xl"><span className="pg-hl">{t("shareYourExperience")}</span></h3>
      {hasReview && <p role="status" className="mb-3 rounded-lg border-2 border-dotted border-[color:var(--ink)] bg-[color:var(--sf2)] px-3 py-2 text-xs font-bold">{t("alreadyReviewedNote")}</p>}
      <StarRating value={rating} onChange={setRating} t={t} />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder={t("reviewPlaceholder")} maxLength={1000} rows={3} aria-label={t("shareYourExperience")}
        className={`mt-4 w-full resize-none p-3 text-sm font-medium leading-relaxed outline-none placeholder:opacity-60 sm:p-4 ${FIELD}`} />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`text-[11px] font-bold ${MUTED}`} dir="ltr">{comment.length}/1000</span>
      </div>
      <div className="mt-3 pe-1 pb-1">
        <button type="button" onClick={send} disabled={!comment.trim() || rating === 0 || hasReview || sending} className={`${BTN} ${BTN_ON} w-full`}>{t("submitReview")}</button>
      </div>
    </div>
  );
});

const EditReviewModal = memo(({ review, t, onClose, onSave }) => {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || "");
  useModalLock(true, onClose);
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t("editReview")}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className={`relative w-full max-w-lg transform-gpu p-5 sm:p-8 ${BOX_LG}`}>
        <h3 className="mb-5 text-xl font-extrabold uppercase sm:text-2xl"><span className="pg-hl">{t("editReview")}</span></h3>
        <StarRating value={rating} onChange={setRating} t={t} />
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={4} aria-label={t("editReview")}
          className={`mt-4 w-full resize-none p-3 text-sm font-medium outline-none sm:p-4 ${FIELD}`} />
        <div className="mt-5 flex justify-end gap-3 pe-1 pb-1">
          <button type="button" onClick={onClose} className={`${BTN} ${BTN_OFF}`}>{t("cancel")}</button>
          <button type="button" onClick={() => onSave({ ...review, rating, comment })} className={`${BTN} ${BTN_ON}`}>{t("update")}</button>
        </div>
      </m.div>
    </div>
  );
});

const ReviewCard = memo(({ review: r, mine, dateLocale, shopName, t, onEdit, onDelete }) => {
  const when = Date.parse(r.createdAt);
  const name = clean(r.userName, 60);
  const reply = r.reply ? clean(r.reply, 1000) : "";
  const replyWhen = Date.parse(r.repliedAt);
  return (
    <article className={`flex h-full min-w-0 flex-col gap-3 p-4 sm:p-5 ${BOX_SM}`}>
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-base font-extrabold text-emerald-950">
          {name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold uppercase">{name || t("anonymous")}</p>
          {Number.isFinite(when) && (
            <p className={`text-[11px] font-bold ${MUTED}`} dir="ltr">
              {new Date(when).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
      <div className="flex" role="img" aria-label={`${r.rating} / 5`}>
        {STARS.map((n) => <RiStarFill key={n} className={`h-4 w-4 ${n <= r.rating ? "text-amber-500" : "text-[color:var(--mu)] opacity-35"}`} />)}
      </div>
      <p className="flex-1 break-words text-sm leading-relaxed">{clean(r.comment, 1000)}</p>
      {mine && (
        <div className="flex flex-shrink-0 gap-2 pb-1 pe-1">
          <button type="button" onClick={() => onEdit(r)} aria-label={t("editReview")} title={t("editReview")} className={`${ICON} ${BTN_OFF} h-10 w-10`}><FiEdit3 aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(r.id)} aria-label={t("deleteReview")} title={t("deleteReview")} className={`${ICON} ${BTN_OFF} h-10 w-10 !text-red-500`}><FiTrash2 aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      )}
      {reply && (
        <div role="note" aria-label={t("shopReply")} className="ms-3 flex min-w-0 flex-col gap-2 rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--sf2)] p-3 [border-inline-start-width:5px] [border-inline-start-color:var(--acc)]">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase">
            <FiCornerDownRight aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--pos)] rtl:-scale-x-100" />
            <span>{t("shopReply")}</span>
            {shopName && <span className={`min-w-0 max-w-full truncate ${MUTED}`}>{shopName}</span>}
            {Number.isFinite(replyWhen) && (
              <span className={`font-bold ${MUTED}`} dir="ltr">
                {new Date(replyWhen).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <p className="break-words text-sm leading-relaxed">{reply}</p>
        </div>
      )}
    </article>
  );
});

const ProductDetailsModal = memo(({ product, darkMode, isSaved, onSave, onClose, onAddToCart, onView, t }) => {
  const hasStock = product.stock != null;
  const inStock = !hasStock || product.stock > 0;
  const currency = t("currency");
  const productName = clean(product.name, 120) || t("product");
  const [imgError, setImgError] = useState(!product.imageUrl);
  const [added, setAdded] = useState(false);
  const timer = useRef();
  useModalLock(true, onClose);
  useEffect(() => () => clearTimeout(timer.current), []);

  const perks = [
    { icon: FiShield, label: t("verified") },
    { icon: FiTruck, label: t("fastShip") },
    { icon: FiRefreshCw, label: t("returns") },
  ];
  const specs = [
    { icon: FiTag, label: t("category"), value: clean(product.categoryName || product.category, 80) || t("uncategorized") },
    { icon: FiCheckCircle, label: t("condition"), value: conditionLabel(t, product.condition) },
    product.brand && { icon: FiAward, label: t("brand"), value: clean(product.brand, 60) },
    hasStock && { icon: FiPackage, label: t("availability"), value: inStock ? t("inStock") : t("outOfStock") },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={productName}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className={`pg-sb relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain sm:max-w-lg ${BOX_LG}`}>
        <div className="absolute end-3 top-3 z-10 flex items-center gap-2">
          <button type="button" onClick={() => onSave(product.id)} aria-pressed={isSaved} aria-label={isSaved ? t("saved") : t("save")} title={isSaved ? t("saved") : t("save")}
            className={`${ICON} h-10 w-10 ${isSaved ? BTN_ON : "bg-white text-emerald-950"}`}>
            <FiHeart aria-hidden="true" className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button type="button" onClick={onClose} aria-label={t("close")} className={`${ICON} h-10 w-10 bg-white text-emerald-950`}><FiX aria-hidden="true" className="h-4 w-4" /></button>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden border-b-[3px] border-[color:var(--ink)] bg-white">
          {imgError ? (
            <DeviceArt name={productName} categoryName={product.categoryName || product._cat} darkMode={darkMode} label={t("imageUnavailable")} />
          ) : (
            <img src={product.imageUrl} alt={productName} referrerPolicy="no-referrer" decoding="async"
              onError={() => setImgError(true)} className="h-full w-full bg-white object-contain p-4" />
          )}
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-extrabold uppercase leading-snug sm:text-xl">{clean(product.name, 160) || t("product")}</h2>
            <div className="mt-3">
              <Price product={product} currency={currency} t={t} large />
            </div>
          </div>

          <section>
            <h3 className="mb-2 text-xs font-extrabold uppercase"><span className="pg-hl">{t("aboutProduct")}</span></h3>
            <p className={`text-sm leading-relaxed ${MUTED}`}>{clean(product.description, 1500) || t("noProductDescription")}</p>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-extrabold uppercase"><span className="pg-hl">{t("details")}</span></h3>
            <div className="grid grid-cols-1 gap-3 rounded-xl border-2 border-dotted border-[color:var(--ink)] bg-[color:var(--sf2)] p-3.5 min-[400px]:grid-cols-2">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex min-w-0 items-center gap-2.5">
                  <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--pos)]" />
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase ${MUTED}`}>{label}</p>
                    <p className="truncate text-xs font-extrabold">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-xs font-bold"><Icon aria-hidden="true" className="h-3.5 w-3.5 text-[color:var(--pos)]" />{label}</li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-3 pe-1 pb-1">
            <button type="button" disabled={!inStock} className={`${BTN} ${added ? BTN_ON : BTN_OFF}`}
              onClick={async () => {
                const ok = await onAddToCart(product);
                if (!ok) return;
                setAdded(true);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setAdded(false), 1600);
              }}>
              {added ? <><FiCheck aria-hidden="true" className="h-4 w-4" />{t("added")}</> : <><FiShoppingCart aria-hidden="true" className="h-4 w-4" />{t("addToCart")}</>}
            </button>
            <button type="button" onClick={() => onView(product)} className={`${BTN} ${BTN_ON}`}><FiExternalLink aria-hidden="true" className="h-4 w-4" />{t("viewProduct")}</button>
          </div>
        </div>
      </m.div>
    </div>
  );
});

const CategorySlider = memo(({ category, items, darkMode, saved, onSave, onAddToCart, onDetails, t, isRTL }) => {
  const { ref: sliderRef, edge, scroll } = useHScroll(items.length, isRTL);
  const navigate = useNavigate();
  const goToCategory = useCallback(() => navigate(`/products/category/${encodeURIComponent(category.id)}`), [navigate, category.id]);

  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;

  if (!items.length) return null;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
        <button type="button" onClick={goToCategory} className={`min-w-0 rounded-lg text-start ${FOCUS}`}>
          <span className="block truncate text-xl font-extrabold uppercase sm:text-2xl"><span className="pg-hl">{category.name}</span></span>
          <span className={`mt-1 block text-xs font-bold uppercase ${MUTED}`}><span dir="ltr">{items.length}</span> {items.length === 1 ? t("item") : t("items")}</span>
        </button>
        <div className="flex items-center gap-2 pe-1 pb-1">
          <button type="button" onClick={goToCategory} className={`${BTN} ${BTN_ON} ${BTN_SM}`}>
            {t("viewAll")} <FiArrowRight aria-hidden="true" className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
          <button type="button" onClick={() => scroll("back")} disabled={!edge.l} aria-label={t("scrollBack")} className={`${ICON} ${BTN_OFF} hidden h-10 w-10 sm:inline-flex`}><BackIcon aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" onClick={() => scroll("forward")} disabled={!edge.r} aria-label={t("scrollForward")} className={`${ICON} ${BTN_OFF} hidden h-10 w-10 sm:inline-flex`}><ForwardIcon aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={sliderRef} className="pg-nosb flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 pe-3 ps-1 pt-1 motion-reduce:scroll-auto sm:gap-6">
        {items.map((p) => (
          <div key={p.id} className="w-[210px] flex-shrink-0 snap-start sm:w-[240px]">
            <ProductCard product={p} darkMode={darkMode} isSaved={saved.has(p.id)} onSave={onSave} onAddToCart={onAddToCart} onDetails={onDetails} t={t} />
          </div>
        ))}
      </div>
    </div>
  );
});

const OptionRow = memo(({ type, label, count, selected, onClick }) => (
  <button
    type="button" role={type === "check" ? "checkbox" : "radio"} aria-checked={selected} onClick={onClick}
    className={`flex min-h-10 w-full items-center gap-2.5 rounded-md py-1.5 text-start text-sm font-semibold ${FOCUS}`}
  >
    <span className={`flex h-5 w-5 flex-none items-center justify-center border-2 border-[color:var(--ink)] text-emerald-950 ${type === "radio" ? "rounded-full" : "rounded-md"} ${selected ? "bg-[color:var(--acc)]" : "bg-[color:var(--sf2)]"}`}>
      {selected && (type === "check" ? <FiCheck aria-hidden="true" className="h-3 w-3" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-emerald-950" />)}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className={`text-xs tabular-nums ${MUTED}`} dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ num, title, isOpen, onToggle, children }) => (
  <section className="border-t-2 border-[color:var(--ink)]">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className={`flex min-h-11 w-full items-center gap-2.5 rounded-md py-3 text-start ${FOCUS}`}>
      <span aria-hidden="true" className="text-sm font-black tabular-nums text-[color:var(--pos)]">{num}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold uppercase"><span className="pg-hl">{title}</span></span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && <div className="min-w-0 pb-4">{children}</div>}
  </section>
));

const NumField = memo(({ value, onCommit, label, t }) => {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState("");
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(n)) { setError(t("errorInvalidNumber")); setDraft(String(value)); return; }
    const msg = onCommit(n);
    if (msg) { setError(msg); setDraft(String(value)); } else setError("");
  };
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1 block text-[11px] font-bold uppercase">{label}</span>
      <div className={`flex min-h-11 items-center px-2 py-2 text-xs font-bold ${FIELD} ${error ? "!border-rose-500" : ""}`} dir="ltr">
        <span className={`me-1 ${MUTED}`}>{t("currency")}</span>
        <input type="number" inputMode="numeric" min={0} value={draft} aria-invalid={!!error}
          onChange={(e) => { setDraft(e.target.value); setError(""); }} onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()} className="w-full min-w-0 bg-transparent tabular-nums outline-none" />
      </div>
      {error && <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-500">{error}</p>}
    </label>
  );
});

const PriceRangeFilter = memo(({ bounds, value, onChange, histogram, t }) => {
  const { max, step } = bounds;
  const [lo, hi] = value;
  const leftPct = (lo / max) * 100;
  const rightPct = (hi / max) * 100;
  const peak = Math.max(1, ...histogram);
  const presets = useMemo(() => {
    const snap = (v) => Math.round(v / step) * step;
    const a = snap(max / 3);
    const b = snap((max * 2) / 3);
    if (!(a > 0 && b > a && b < max)) return [];
    return [
      { label: `< ${COMPACT_FORMAT.format(a)}`, r: [0, a] },
      { label: `${COMPACT_FORMAT.format(a)} – ${COMPACT_FORMAT.format(b)}`, r: [a, b] },
      { label: `> ${COMPACT_FORMAT.format(b)}`, r: [b, max] },
    ];
  }, [max, step]);

  const commitMin = (n) => {
    if (n < 0) return t("errorNegative");
    if (n > hi) return t("errorMinGreater");
    onChange([n, hi]);
    return "";
  };
  const commitMax = (n) => {
    if (n < 0) return t("errorNegative");
    if (n < lo) return t("errorMaxLess");
    if (n > max) return t("errorMaxPrice", { max: max.toLocaleString() });
    onChange([lo, n]);
    return "";
  };

  return (
    <div className="min-w-0 space-y-4" dir="ltr">
      <div className="flex h-12 items-end gap-[3px]" aria-hidden="true">
        {histogram.map((c, i) => {
          const binStart = (i / histogram.length) * max;
          const binEnd = ((i + 1) / histogram.length) * max;
          const inRange = binEnd > lo && binStart < hi;
          return <div key={i} className={`flex-1 rounded-sm ${inRange ? "pg-bin-on" : "pg-bin"}`} style={{ height: `${Math.max(c ? 12 : 4, (c / peak) * 100)}%`, opacity: c ? 1 : 0.5 }} />;
        })}
      </div>
      <div className="relative flex h-5 items-center">
        <div className="absolute inset-x-0 h-2 rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--sf2)]" />
        <div className="absolute h-2 border-y-2 border-[color:var(--ink)] bg-[color:var(--acc)]" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        <input type="range" aria-label={t("minPriceAria")} min={0} max={max} step={step} value={lo}
          onChange={(e) => onChange([Math.max(0, Math.min(Number(e.target.value), hi - step)), hi])} className="pg-range" style={{ zIndex: lo > max - step * 3 ? 5 : 3 }} />
        <input type="range" aria-label={t("maxPriceAria")} min={0} max={max} step={step} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])} className="pg-range" style={{ zIndex: 4 }} />
      </div>
      <div className="flex flex-col gap-4 min-[380px]:flex-row min-[380px]:gap-6">
        <NumField label={t("priceMin")} value={lo} onCommit={commitMin} t={t} />
        <NumField label={t("priceMax")} value={hi} onCommit={commitMax} t={t} />
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 pe-1 pb-1">
          {presets.map((p) => {
            const on = lo === p.r[0] && hi === p.r[1];
            return (
              <button key={p.r.join("-")} type="button" onClick={() => onChange(p.r)} aria-pressed={on}
                className={`${BTN} ${BTN_SM} ${on ? BTN_ON : BTN_OFF}`}>
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

const FilterPanel = memo((p) => {
  const { t, conditionCounts, selectedConditions, toggleCondition, categoryOptions, selectedCategory, setSelectedCategory, totalCount,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, setInStockOnly, onSaleOnly, setOnSaleOnly, savedOnly, setSavedOnly,
    open, setOpen, clearFilters, activeFiltersCount } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className={`w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4 ${BOX_SM}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold uppercase">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{t("filters")}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className={`min-h-11 flex-shrink-0 rounded-md text-xs font-bold underline underline-offset-4 ${FOCUS}`}>{t("resetAll")}</button>}
      </div>

      {priceBounds.max > 0 && (
        <FilterBlock num="01" title={t("priceRange")} isOpen={open.price} onToggle={() => toggle("price")}>
          <div className="min-w-0 px-1">
            <PriceRangeFilter bounds={priceBounds} value={priceValue} onChange={setPriceRange} histogram={histogram} t={t} />
          </div>
        </FilterBlock>
      )}

      <FilterBlock num="02" title={t("condition")} isOpen={open.cond} onToggle={() => toggle("cond")}>
        <div className="min-w-0 break-words">
          {CONDITIONS.map((c) => (
            <OptionRow key={c} type="check" label={conditionLabel(t, c)} count={conditionCounts[c] || 0} selected={selectedConditions.includes(c)} onClick={() => toggleCondition(c)} />
          ))}
          <OptionRow type="check" label={t("inStockOnly")} selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)} />
        </div>
      </FilterBlock>

      {categoryOptions.length > 0 && (
        <FilterBlock num="03" title={t("category")} isOpen={open.cat} onToggle={() => toggle("cat")}>
          <div className="pg-sb max-h-44 min-w-0 overflow-y-auto overscroll-contain break-words pe-1 sm:max-h-52" role="radiogroup" aria-label={t("category")}>
            <OptionRow type="radio" label={t("all")} count={totalCount} selected={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} />
            {categoryOptions.map(({ name, count }) => (
              <OptionRow key={name} type="radio" label={name} count={count} selected={selectedCategory === name} onClick={() => setSelectedCategory(name)} />
            ))}
          </div>
        </FilterBlock>
      )}

      <FilterBlock num="04" title={t("moreFilters")} isOpen={open.more} onToggle={() => toggle("more")}>
        <div className="min-w-0 break-words">
          <OptionRow type="check" label={t("onSaleOnly")} selected={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} />
          <OptionRow type="check" label={t("savedOnly")} selected={savedOnly} onClick={() => setSavedOnly((v) => !v)} />
        </div>
      </FilterBlock>
    </div>
  );
});

const ChatCTABanner = memo(({ darkMode, onOpenChat, t }) => (
  <section aria-label={t("chatBannerTitle")} className={`pg-pattern bg-[color:var(--pg)] ${SECTION} ${LAZY}`}>
    <div className={WRAP}>
      <div onMouseEnter={prefetchChatModal} className={`group flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:gap-8 sm:p-10 sm:text-start ${BOX_LG}`}>
        <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-[3px] border-[color:var(--ink)] bg-[color:var(--sf2)] sm:h-24 sm:w-24">
          <IsoIllustration type="shopChat" darkMode={darkMode} onGreen={false} hoverOnly className="h-16 w-16 sm:h-20 sm:w-20" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-extrabold uppercase sm:text-3xl"><span className="pg-hl">{t("chatBannerTitle")}</span></h3>
          <p className={`mt-4 text-sm font-medium sm:text-base ${MUTED}`}>{t("chatBannerDescription")}</p>
        </div>
        <button type="button" onClick={onOpenChat} className={`${BTN} ${BTN_ON} w-full flex-shrink-0 sm:w-auto`}><FiMessageCircle aria-hidden="true" className="h-4 w-4" />{t("startChat")}</button>
      </div>
    </div>
  </section>
));

const EmptyState = memo(({ illustration, title, text, darkMode, children, compact = false }) => (
  <div className={`px-4 text-center ${BOX_SM} ${compact ? "py-10 sm:py-14" : "py-14 sm:py-24"}`}>
    <IsoIllustration type={illustration} darkMode={darkMode} onGreen={false} className={`mx-auto mb-4 ${compact ? "h-32 w-32 sm:h-36 sm:w-36" : "h-32 w-32 sm:h-40 sm:w-40"}`} />
    <p className="mb-2 text-lg font-extrabold uppercase sm:text-2xl">{title}</p>
    {text && <p className={`mb-6 text-sm font-medium sm:text-base ${MUTED}`}>{text}</p>}
    {children}
  </div>
));

const ShopContent = ({ darkMode, addToCart }) => {
  const language = useAppLanguage();
  const t = useCallback((key, fallback) => getShopTranslation(language, key, fallback), [language]);
  const ot = useCallback((key) => getOfferTranslation(language, key), [language]);
  const { shopId } = useParams();

  const accessToken = useAuthStore((s) => s.accessToken);
  const storeUserId = useAuthStore((s) => s.userId);
  const tokenClaims = useMemo(() => parseAccessToken(accessToken, { checkExpiry: false }), [accessToken]);
  const knownUserId = storeUserId ?? tokenClaims?.id ?? null;
  const { data: profileIdentity } = useQuery({
    queryKey: ["me", accessToken],
    queryFn: async ({ signal }) => {
      try { return (await api.get("/api/users/profile", { signal })).data; } catch { return null; }
    },
    enabled: !!accessToken && knownUserId == null,
    staleTime: Infinity,
  });
  const userId = knownUserId ?? (profileIdentity?.id != null ? profileIdentity.id : null);
  const isAuthenticated = !!accessToken;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();
  useScrollTopOnEnter(shopId);

  const dir = languageDirection(language);
  const isRTL = dir === "rtl";
  const isAr = language === "ar";
  const dateLocale = LOCALE_MAP[language] || "en-GB";

  const [saved, toggleSaved] = useSavedProducts();
  const [search, setSearch] = useState("");
  const [conditions, setConditions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRangeState] = useState(null);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [pageSize, setPageSize] = useState(PRODUCT_PAGE_SIZES[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(MOBILE_BATCH);
  const [reviewPage, setReviewPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [offerDetail, setOfferDetail] = useState(null);
  const [openChat, setOpenChat] = useState(false);
  const [open, setOpen] = useState({ price: true, cond: true, cat: true, more: true });
  const queryClientLocal = useQueryClient();

  const reviewBusyRef = useRef(false);
  const showTop = useBackToTop();
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  useModalLock(isSidebarOpen, closeSidebar);
  useEffect(() => {
    if (!useAuthStore.getState().accessToken) recoverGoogleSession();
  }, []);

  const filters = useMemo(
    () => ({ search, conditions, selectedCategory, priceRange, onSaleOnly, inStockOnly, savedOnly, sortBy }),
    [search, conditions, selectedCategory, priceRange, onSaleOnly, inStockOnly, savedOnly, sortBy]
  );
  const deferred = useDeferredValue(filters);
  const isStale = deferred !== filters;
  const {
    search: dSearch, conditions: dConds, selectedCategory: dCat, priceRange: dPrice,
    onSaleOnly: dSale, inStockOnly: dStock, savedOnly: dSaved, sortBy: dSort,
  } = deferred;

  useEffect(() => {
    const run = () => prefetchChatModal();
    const id = "requestIdleCallback" in window ? window.requestIdleCallback(run) : setTimeout(run, 1500);
    return () => { if ("cancelIdleCallback" in window) window.cancelIdleCallback(id); else clearTimeout(id); };
  }, []);

  const closeChat = useCallback(() => setOpenChat(false), []);
  const closeEdit = useCallback(() => setEditingReview(null), []);
  const openDetails = useCallback((product) => setDetailsProduct(product), []);
  const closeDetails = useCallback(() => setDetailsProduct(null), []);
  const openOfferDetail = useCallback((offer) => setOfferDetail(offer), []);
  const closeOfferDetail = useCallback(() => setOfferDetail(null), []);
  const goToOffers = useCallback(() => navigate("/offers"), [navigate]);
  const viewProduct = useCallback((product) => navigate(`/device/${encodeURIComponent(product.id)}`), [navigate]);

  const askLogin = useCallback(async () => {
    const Swal = await loadSwal();
    Swal.fire({ title: t("loginRequiredTitle"), text: t("loginRequiredText"), icon: "warning", confirmButtonText: t("loginButton") })
      .then((r) => { if (r.isConfirmed) navigate("/login"); });
  }, [navigate, t]);

  const handleOpenChat = useCallback(() => {
    if (!useAuthStore.getState().accessToken) { askLogin(); return; }
    setOpenChat(true);
  }, [askLogin]);

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: async ({ signal }) => {
      try { return (await api.get(`/api/shops/${encodeURIComponent(shopId)}`, { signal })).data; } catch { return null; }
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });

  const logo = useMemo(() => shopLogoSrc(shop), [shop]);
  const shopTitle = useMemo(() => clean(shop?.name, 120), [shop?.name]);

  const { data: categories = EMPTY_LIST } = useQuery({
    queryKey: ["categories"],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get("/api/categories", { signal });
        return (data.content || data || []).map((c) => ({ id: c.id, name: String(c.name || c.id) }));
      } catch { return []; }
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: products = EMPTY_LIST, isLoading: productsLoading } = useQuery({
    queryKey: ["products", shopId],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get(`/api/products/shop/${encodeURIComponent(shopId)}`, { signal });
        const list = data.content || data || [];
        if (!Array.isArray(list)) return [];
        return list.filter(Boolean).map(normalizeProduct);
      } catch { return []; }
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: shopOffers = EMPTY_LIST } = useQuery({
    queryKey: ["shopOffers", shopId, userId ?? "anon"],
    queryFn: async ({ signal }) => {
      try {
        const res = await api.get("/api/users/offers", { signal });
        const raw = res.data?.content || res.data || [];
        return (Array.isArray(raw) ? raw : [])
          .filter((o) => o && o.id != null && o.shopId != null && String(o.shopId) === String(shopId))
          .map(normalizeOffer)
          .sort((a, b) => (a.status === "ACTIVE" ? 0 : 1) - (b.status === "ACTIVE" ? 0 : 1));
      } catch { return []; }
    },
    enabled: !!shopId && isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const { data: reviews = EMPTY_LIST, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", shopId],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get(`/api/reviews/${encodeURIComponent(shopId)}/reviews`, { signal });
        const list = data.content || data || [];
        return Array.isArray(list) ? list : [];
      } catch { return []; }
    },
    enabled: !!shopId,
    staleTime: 60 * 1000,
  });

  const myReview = useMemo(
    () => (userId != null ? reviews.find((r) => String(r.userId) === String(userId)) || null : null),
    [reviews, userId]
  );

  useEffect(() => {
    document.title = shop?.name ? `${clean(shop.name, 80)} | Tech-Restore` : t("loadingShop");
  }, [shop?.name, t]);

  const handleAddToCart = useCallback(async (product) => {
    if (!useAuthStore.getState().accessToken) {
      askLogin();
      return false;
    }
    try {
      await api.post("/api/cart/items", { productId: product.id, quantity: 1 });
      addToCart?.({ ...product, price: product.finalPrice, quantity: 1 });
      window.dispatchEvent(new Event("cart:updated"));
      toast({ icon: "success", title: t("addedToCartToast"), text: clean(product.name, 60), timer: TOAST_MS });
      return true;
    } catch (err) {
      toast({ icon: "error", title: t("errorTitle"), text: err?.response?.data?.message || t("addToCartFailed"), timer: 3500 });
      return false;
    }
  }, [addToCart, askLogin, t]);

  const submitReview = useCallback(async ({ rating: rawRating, comment: rawComment }) => {
    if (!shop || reviewBusyRef.current) return false;
    if (!useAuthStore.getState().accessToken) {
      askLogin();
      return false;
    }
    if (myReview) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "info", title: t("errorTitle"), text: t("alreadyReviewed") });
      return false;
    }
    const comment = clean(rawComment, 1001);
    const rating = Number(rawRating);
    if (!comment || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("incompleteTitle"), text: t("provideRatingComment") });
      return false;
    }
    if (comment.length > 1000) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("tooLongTitle"), text: t("commentTooLong") });
      return false;
    }
    reviewBusyRef.current = true;
    try {
      await api.post(`/api/reviews/${encodeURIComponent(shopId)}`, { rating: clamp(rating, 1, 5), comment });
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      toast({ icon: "success", title: t("reviewAddedToast"), timer: TOAST_MS });
      return true;
    } catch (err) {
      const Swal = await loadSwal();
      const duplicate = isDuplicateReview(err);
      Swal.fire({ icon: duplicate ? "info" : "error", title: t("errorTitle"), text: reviewError(err, t("submitReviewFailed"), "create", t) });
      if (duplicate) queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      return false;
    } finally {
      reviewBusyRef.current = false;
    }
  }, [shop, myReview, shopId, queryClientLocal, askLogin, t]);

  const updateReview = useCallback(async (draft) => {
    const comment = clean(draft?.comment, 1001);
    if (!comment || !draft?.rating) return;
    if (reviewBusyRef.current) return;
    if (userId == null || String(draft.userId) !== String(userId)) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "error", title: t("errorTitle"), text: t("onlyOwnReviews") });
      setEditingReview(null);
      return;
    }
    if (comment.length > 1000) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("tooLongTitle"), text: t("commentTooLong") });
      return;
    }
    reviewBusyRef.current = true;
    try {
      await api.put(`/api/reviews/${encodeURIComponent(draft.id)}`, { rating: clamp(Number(draft.rating), 1, 5), comment });
      setEditingReview(null);
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      toast({ icon: "success", title: t("reviewUpdatedToast"), timer: TOAST_MS });
    } catch (err) {
      const Swal = await loadSwal();
      Swal.fire(t("errorTitle"), reviewError(err, t("updateReviewFailed"), "update", t), "error");
    } finally {
      reviewBusyRef.current = false;
    }
  }, [userId, queryClientLocal, shopId, t]);

  const deleteReview = useCallback(async (reviewId) => {
    if (reviewBusyRef.current) return;
    const Swal = await loadSwal();
    const target = reviews.find((r) => r.id === reviewId);
    if (!target || userId == null || String(target.userId) !== String(userId)) {
      Swal.fire(t("errorTitle"), t("onlyOwnReviews"), "error");
      return;
    }
    const result = await Swal.fire({ title: t("deleteReviewTitle"), text: t("deleteReviewText"), icon: "warning", showCancelButton: true, cancelButtonText: t("cancel"), confirmButtonColor: "#ef4444", confirmButtonText: t("deleteConfirmButton") });
    if (!result.isConfirmed) return;
    reviewBusyRef.current = true;
    try {
      await api.delete(`/api/reviews/cancel/${encodeURIComponent(reviewId)}`);
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      toast({ icon: "success", title: t("reviewRemovedToast"), timer: TOAST_MS });
    } catch (err) {
      Swal.fire(t("errorTitle"), reviewError(err, t("deleteReviewFailed"), "delete", t), "error");
    } finally {
      reviewBusyRef.current = false;
    }
  }, [reviews, userId, queryClientLocal, shopId, t]);

  const toggleCondition = useCallback((c) => setConditions((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);

  const clearFilters = useCallback(() => {
    setSearch(""); setConditions([]); setSelectedCategory("all"); setPriceRangeState(null);
    setOnSaleOnly(false); setInStockOnly(false); setSavedOnly(false); setSortBy("relevance"); setCurrentPage(1); setVisibleCount(MOBILE_BATCH);
  }, []);
  useEffect(() => { clearFilters(); }, [shopId, clearFilters]);
  useEffect(() => { setReviewPage(1); setOfferDetail(null); }, [shopId]);

  const priceBounds = useMemo(() => {
    const top = products.reduce((mx, p) => Math.max(mx, p._final), 0);
    if (!top) return { max: 0, step: 1 };
    const step = priceStep(top) || 1;
    return { max: Math.max(step * 10, Math.ceil(top / step) * step), step };
  }, [products]);
  const priceValue = useMemo(() => {
    if (!priceRange) return [0, priceBounds.max];
    const hi = clamp(Number(priceRange[1]) || 0, 0, priceBounds.max);
    const lo = Math.min(clamp(Number(priceRange[0]) || 0, 0, priceBounds.max), hi);
    return [lo, hi];
  }, [priceRange, priceBounds.max]);
  const setPriceRange = useCallback((r) => {
    const hi = clamp(Number(r[1]) || 0, 0, priceBounds.max);
    const lo = Math.min(clamp(Number(r[0]) || 0, 0, priceBounds.max), hi);
    setPriceRangeState(lo <= 0 && hi >= priceBounds.max ? null : [lo, hi]);
  }, [priceBounds.max]);

  const { categoryOptions, productsByCategory } = useMemo(() => {
    const cats = {}, byCat = {};
    for (const p of products) {
      if (p._cat) cats[p._cat] = (cats[p._cat] || 0) + 1;
      const catId = p.categoryId ?? p.category?.id ?? p.category;
      if (catId != null) (byCat[catId] ||= []).push(p);
    }
    return {
      categoryOptions: Object.entries(cats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      productsByCategory: byCat,
    };
  }, [products]);

  const categorySections = useMemo(() => categories
    .map((cat) => ({ category: cat, items: (productsByCategory[cat.id] || []).slice(0, 10) }))
    .filter((s) => s.items.length > 0)
    .slice(0, 6), [categories, productsByCategory]);

  const baseFiltered = useMemo(() => {
    const term = dSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (dCat !== "all" && p._cat !== dCat) return false;
      if (dSale && !(p.saving > 0)) return false;
      if (dStock && p.stock != null && p.stock <= 0) return false;
      if (dSaved && !saved.has(p.id)) return false;
      if (term && !p._text.includes(term)) return false;
      return true;
    });
  }, [products, saved, dSearch, dCat, dSale, dStock, dSaved]);

  const conditionCounts = useMemo(() => {
    const c = {};
    if (!isSidebarOpen) return c;
    for (const p of baseFiltered) if (p.condition) c[p.condition] = (c[p.condition] || 0) + 1;
    return c;
  }, [baseFiltered, isSidebarOpen]);

  const histogram = useMemo(() => {
    const bins = Array(HISTOGRAM_BINS).fill(0);
    if (!isSidebarOpen || !priceBounds.max) return bins;
    for (const p of baseFiltered) {
      if (dConds.length && !dConds.includes(p.condition)) continue;
      bins[Math.min(HISTOGRAM_BINS - 1, Math.floor((p._final / priceBounds.max) * HISTOGRAM_BINS))]++;
    }
    return bins;
  }, [baseFiltered, dConds, priceBounds.max, isSidebarOpen]);

  const filteredProducts = useMemo(() => {
    const lo = dPrice ? dPrice[0] : 0;
    const hi = dPrice ? dPrice[1] : Infinity;
    const result = baseFiltered.filter((p) => p._final >= lo && p._final <= hi && (!dConds.length || dConds.includes(p.condition)));
    if (dSort === "priceLowToHigh") result.sort((a, b) => a._final - b._final);
    else if (dSort === "priceHighToLow") result.sort((a, b) => b._final - a._final);
    else if (dSort === "nameAsc") result.sort((a, b) => (a.name || "").localeCompare(b.name || "", language));
    else if (dSort === "discount") result.sort((a, b) => b.discount - a.discount);
    else if (dSort === "newest") result.sort((a, b) => b._ts - a._ts);
    return result;
  }, [baseFiltered, dPrice, dConds, dSort, language]);

  const sortOptions = useMemo(() => [
    { value: "relevance", label: t("sortRelevance") },
    { value: "priceLowToHigh", label: t("sortPriceLow") },
    { value: "priceHighToLow", label: t("sortPriceHigh") },
    { value: "nameAsc", label: t("sortNameAsc") },
    { value: "discount", label: t("sortDiscount") },
    { value: "newest", label: t("sortNewest") },
  ], [t]);
  const rowOptions = useMemo(() => PRODUCT_PAGE_SIZES.map((n) => ({ value: n, label: `${n} ${t("perPage")}` })), [t]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  useEffect(() => { setCurrentPage(1); setVisibleCount(MOBILE_BATCH); }, [pageSize, deferred]);
  useEffect(() => { setCurrentPage((p) => Math.min(p, totalPages)); }, [totalPages]);
  const pageOffset = (currentPage - 1) * pageSize;
  const paginatedProducts = useMemo(() => filteredProducts.slice(pageOffset, pageOffset + pageSize), [filteredProducts, pageOffset, pageSize]);
  const infiniteProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);
  const listProducts = isMobile ? infiniteProducts : paginatedProducts;
  const hasMore = isMobile && visibleCount < filteredProducts.length;
  const startItem = filteredProducts.length ? (isMobile ? 1 : pageOffset + 1) : 0;
  const endItem = isMobile ? infiniteProducts.length : Math.min(pageOffset + pageSize, filteredProducts.length);
  const loadMore = useCallback(() => startTransition(() => setVisibleCount((c) => c + MOBILE_BATCH)), []);

  const reviewPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
  const safeReviewPage = Math.min(reviewPage, reviewPages);
  const pagedReviews = useMemo(
    () => reviews.slice((safeReviewPage - 1) * REVIEWS_PER_PAGE, safeReviewPage * REVIEWS_PER_PAGE),
    [reviews, safeReviewPage]
  );

  const activeFiltersCount = (search ? 1 : 0) + conditions.length + (selectedCategory !== "all" ? 1 : 0) + (priceRange ? 1 : 0) + (onSaleOnly ? 1 : 0) + (inStockOnly ? 1 : 0) + (savedOnly ? 1 : 0);

  const scrollToProducts = useCallback(() => document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth", block: "start" }), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);
  const goToPage = useCallback((pg) => { setCurrentPage(pg); scrollToProducts(); }, [scrollToProducts]);
  const goToReviewPage = useCallback((pg) => {
    setReviewPage(pg);
    document.getElementById("shop-reviews-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const { avgRating, ratingCounts } = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of reviews) {
      sum += Number(r.rating) || 0;
      if (c[r.rating] !== undefined) c[r.rating]++;
    }
    return { avgRating: reviews.length ? (sum / reviews.length).toFixed(1) : "–", ratingCounts: c };
  }, [reviews]);
  const reviewWord = useCallback((count) => (count === 1 ? t("reviewSingular") : t("reviewPlural")), [t]);

  const stats = useMemo(() => [
    { value: String(products.length), label: t("products") },
    { value: avgRating === "–" ? "–" : `${avgRating}★`, label: t("avgRating") },
    { value: String(reviews.length), label: reviewWord(reviews.length) },
  ], [products.length, avgRating, reviews.length, reviewWord, t]);

  const filterPanelProps = useMemo(() => (isSidebarOpen ? {
    t, conditionCounts, selectedConditions: conditions, toggleCondition, categoryOptions, selectedCategory, setSelectedCategory,
    totalCount: products.length, priceBounds, priceValue, setPriceRange, histogram,
    inStockOnly, setInStockOnly, onSaleOnly, setOnSaleOnly, savedOnly, setSavedOnly,
    open, setOpen, clearFilters, activeFiltersCount,
  } : null), [isSidebarOpen, t, conditionCounts, conditions, toggleCondition, categoryOptions, selectedCategory, products.length, priceBounds, priceValue,
    setPriceRange, histogram, inStockOnly, onSaleOnly, savedOnly, open, clearFilters, activeFiltersCount]);
  const frameProps = { darkMode, dir, language, isAr };
  const currency = t("currency");

  if (shopLoading) return (
    <Frame {...frameProps}>
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[color:var(--acc)] border-t-transparent motion-reduce:animate-none" role="status" aria-label={t("loading")} />
      </div>
    </Frame>
  );

  if (!shop) return (
    <Frame {...frameProps}>
      <div className="flex min-h-screen items-center justify-center px-4">
        <EmptyState illustration="shopEmpty" title={t("shopNotFound")} darkMode={darkMode} />
      </div>
    </Frame>
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Frame {...frameProps}>
          <Defs3D />
          <Toaster darkMode={darkMode} />

          <ShopBanner darkMode={darkMode} title={shopTitle || t("shopFallback")} onViewProducts={scrollToProducts} onChat={handleOpenChat} t={t} />
          <ShopDetails shop={shop} logo={logo} darkMode={darkMode} stats={stats} t={t} />

          {shopOffers.length > 0 && (
            <section id="shop-offers" aria-label={t("shopOffers")} className={`pg-pattern bg-[color:var(--pg)] ${SECTION} ${LAZY}`}>
              <div className={WRAP}>
                <SectionTitle title={t("shopOffers")} subtitle={t("shopOffersSubtitle")}>
                  <div aria-hidden="true" className="pointer-events-none hidden h-40 w-40 flex-shrink-0 sm:block lg:h-52 lg:w-52">
                    <IsoIllustration type="offersCard" tone="emerald" darkMode={darkMode} onGreen={false} className="h-full w-full" />
                  </div>
                </SectionTitle>
                <div className="grid grid-cols-1 gap-6 pb-2 pe-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                  {shopOffers.slice(0, OFFERS_SHOWN).map((o, i) => (
                    <ShopOfferCard key={o.id} offer={o} index={i} language={language} currency={currency} onOpen={openOfferDetail} ot={ot} />
                  ))}
                </div>
                {shopOffers.length > OFFERS_SHOWN && (
                  <div className="flex justify-center pe-1 pb-1 pt-8">
                    <button type="button" onClick={goToOffers} className={`${BTN} ${BTN_ON}`}>
                      {t("viewAllOffers")} <FiArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {!productsLoading && categorySections.length > 0 && (
            <section aria-label={t("browseCollections")} className={`pg-glow bg-[color:var(--pg)] ${SECTION} ${LAZY}`}>
              <div className={WRAP}>
                <SectionTitle title={t("browseCollections")} subtitle={t("browseCategory")} />
                <div className="space-y-12 sm:space-y-16">
                  {categorySections.map(({ category, items }) => (
                    <CategorySlider key={category.id} category={category} items={items} darkMode={darkMode} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onDetails={openDetails} t={t} isRTL={isRTL} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section aria-label={t("allProducts")} className="pg-pattern bg-[color:var(--pg)]">
            <div id="shop-products" className={`${WRAP} scroll-mt-20 ${SECTION}`}>
              <SectionTitle title={t("allProducts")} subtitle={t("allProductsSubtitle")} />

              <div className="w-full min-w-0">
                <div className={`mb-6 flex flex-col gap-3 p-3 sm:p-4 ${BOX_SM}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className={`text-sm font-medium ${MUTED}`} aria-live="polite">
                      <b dir="ltr" className="text-[color:var(--tx)]">{startItem}–{endItem}</b> / <b dir="ltr" className="text-[color:var(--tx)]">{filteredProducts.length}</b> {t("productsFound")}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pe-1 pb-1">
                      {!isMobile && (
                        <NbDropdown ariaLabel={t("rowsPerPage", "Rows per page")} value={pageSize} onChange={setPageSize} options={rowOptions} align="end" className="w-40 flex-shrink-0" />
                      )}
                      <button type="button" onClick={openSidebar} aria-haspopup="dialog" aria-expanded={isSidebarOpen} className={`${BTN} ${BTN_ON}`}>
                        <FiSliders aria-hidden="true" className="h-4 w-4" />{t("filters")}
                        {activeFiltersCount > 0 && <span dir="ltr" className="tabular-nums">({activeFiltersCount})</span>}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className={`relative flex h-11 min-w-0 flex-1 items-center gap-2 px-3 ${FIELD}`}>
                      <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
                      <input type="text" inputMode="search" autoComplete="off" value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("searchProducts")} aria-label={t("searchProducts")}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60" />
                      {isStale && <span aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />}
                      {search && <button type="button" onClick={() => setSearch("")} aria-label={t("clear")} className={`flex-shrink-0 rounded ${FOCUS}`}><FiX aria-hidden="true" className="h-4 w-4" /></button>}
                    </div>
                    <NbDropdown ariaLabel={t("sortBy")} value={sortBy} onChange={setSortBy} options={sortOptions} align="end" className="w-full sm:w-56" />
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="mb-6 flex flex-wrap items-center gap-2 pe-1 pb-1">
                    {selectedCategory !== "all" && <FilterChip label={selectedCategory} onRemove={() => setSelectedCategory("all")} />}
                    {conditions.map((c) => <FilterChip key={c} label={conditionLabel(t, c)} onRemove={() => toggleCondition(c)} />)}
                    {priceRange && <FilterChip label={`${money(priceValue[0], currency)} – ${money(priceValue[1], currency)}`} onRemove={() => setPriceRangeState(null)} />}
                    {onSaleOnly && <FilterChip label={t("onSaleOnly")} onRemove={() => setOnSaleOnly(false)} />}
                    {inStockOnly && <FilterChip label={t("inStockOnly")} onRemove={() => setInStockOnly(false)} />}
                    {savedOnly && <FilterChip label={t("savedOnly")} onRemove={() => setSavedOnly(false)} />}
                    {search && <FilterChip label={`“${search.slice(0, 20)}”`} onRemove={() => setSearch("")} />}
                    <button type="button" onClick={clearFilters} className={`min-h-11 rounded-md text-xs font-bold underline underline-offset-4 ${FOCUS}`}>{t("clearAllFilters")}</button>
                  </div>
                )}

                <div aria-busy={isStale} className={`transition-opacity duration-150 motion-reduce:transition-none ${isStale ? "opacity-70" : "opacity-100"}`}>
                  {productsLoading ? (
                    <div className={GRID} role="status" aria-label={t("loading")}>{Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}</div>
                  ) : filteredProducts.length > 0 ? (
                    <>
                      <div className={GRID}>
                        {listProducts.map((product, i) => (
                          <div key={product.id} className="pg-rise min-w-0" style={STAGGER[i % 10]}>
                            <ProductCard product={product} darkMode={darkMode} isSaved={saved.has(product.id)} onSave={toggleSaved} onAddToCart={handleAddToCart} onDetails={openDetails} t={t} />
                          </div>
                        ))}
                      </div>
                      {isMobile ? (
                        <InfiniteSentinel hasMore={hasMore} shown={visibleCount} total={filteredProducts.length} onMore={loadMore} t={t} />
                      ) : totalPages > 1 && (
                        <div className="flex flex-col items-center gap-3 pt-8">
                          <Pagination page={currentPage} total={totalPages} onChange={goToPage} label={t("pagination")} t={t} />
                          <p className={`text-xs font-medium ${MUTED}`}>
                            <span dir="ltr">{startItem}–{endItem}</span> / <span dir="ltr">{filteredProducts.length}</span> {t("productsFound")}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState illustration="shopEmpty" title={t("noProducts")} text={t("adjustFilters")} darkMode={darkMode}>
                      {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className={`${BTN} ${BTN_ON}`}>{t("clearFilters")}</button>}
                    </EmptyState>
                  )}
                </div>
              </div>
            </div>
          </section>

          <ChatCTABanner darkMode={darkMode} onOpenChat={handleOpenChat} t={t} />

          <section id="shop-reviews" aria-label={t("customerReviews")} className={`pg-glow bg-[color:var(--pg)] ${SECTION} ${LAZY}`}>
            <div className={WRAP}>
              <SectionTitle
                title={t("customerReviews")}
                subtitle={<><span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}{reviews.length > 0 && <> · {t("avgLabel")} <span dir="ltr">{avgRating}</span> ★</>}</>}
              />

              <div className="grid items-start gap-6 pb-2 pe-2 lg:grid-cols-[20rem_1fr] lg:gap-8 xl:grid-cols-[22rem_1fr]">
                <aside className={`p-5 sm:p-6 ${BOX_LG}`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 lg:flex-col">
                      <RiStarFill className="h-12 w-12 text-amber-500 sm:h-16 sm:w-16" aria-hidden="true" />
                      <div>
                        <p className="text-3xl font-extrabold tabular-nums sm:text-4xl" dir="ltr">{avgRating} / 5</p>
                        <p className="text-sm font-extrabold uppercase">{reviews.length > 0 ? t("lovedByCustomers") : t("noReviewsYet")}</p>
                        <p className={`text-xs font-bold ${MUTED}`}>{t("basedOn")} <span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}</p>
                      </div>
                    </div>
                    <div className="mt-5 w-full space-y-2">
                      {RATING_BARS.map((n) => {
                        const pct = reviews.length ? (ratingCounts[n] / reviews.length) * 100 : 0;
                        return (
                          <div key={n} className="flex items-center gap-2" dir="ltr">
                            <span className="w-3 text-xs font-bold">{n}</span>
                            <RiStarFill className="h-3 w-3 flex-shrink-0 text-amber-500" aria-hidden="true" />
                            <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--sf2)]">
                              <div className="h-full bg-[color:var(--acc)]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-end text-[10px] font-bold tabular-nums">{ratingCounts[n]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>

                <ReviewForm t={t} hasReview={!!myReview} onSubmit={submitReview} />
              </div>

              <div id="shop-reviews-list" className="mt-10 scroll-mt-24">
                {reviewsLoading ? (
                  <div className="grid grid-cols-1 gap-5 pb-2 pe-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-[color:var(--sf2)] motion-reduce:animate-none" />)}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 pb-2 pe-2 sm:grid-cols-2 lg:grid-cols-3">
                    {pagedReviews.map((r) => (
                      <ReviewCard key={r.id} review={r} mine={userId != null && String(r.userId) === String(userId)}
                        dateLocale={dateLocale} shopName={clean(shop?.name, 80)} t={t} onEdit={setEditingReview} onDelete={deleteReview} />
                    ))}
                  </div>
                ) : (
                  <EmptyState compact illustration="shopReviews" title={t("noReviewsYet")} text={t("beFirstReview")} darkMode={darkMode} />
                )}
              </div>

              {!reviewsLoading && reviews.length > REVIEWS_PER_PAGE && (
                <div className="flex flex-col items-center gap-3 pt-8">
                  <Pagination page={safeReviewPage} total={reviewPages} onChange={goToReviewPage} label={t("reviewsPagination")} t={t} />
                  <p className={`text-xs font-medium ${MUTED}`}>
                    <span dir="ltr">{(safeReviewPage - 1) * REVIEWS_PER_PAGE + 1}–{Math.min(safeReviewPage * REVIEWS_PER_PAGE, reviews.length)}</span> / <span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}
                  </p>
                </div>
              )}
            </div>
          </section>

          <AnimatePresence>
            {isSidebarOpen && filterPanelProps && (
              <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t("filters")}>
                <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={closeSidebar} />
                <m.div {...drawerMotion(isRTL)} style={GPU}
                  className="absolute inset-y-0 start-0 flex w-[22rem] min-w-0 max-w-[90vw] transform-gpu flex-col border-e-[3px] border-[color:var(--ink)] bg-[color:var(--pg)] text-[color:var(--tx)] md:w-96">
                  <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-4">
                    <h3 className="text-base font-extrabold uppercase"><span className="pg-hl">{t("filters")}</span></h3>
                    <button type="button" onClick={closeSidebar} aria-label={t("closeFilters")} className={`${ICON} ${BTN_OFF} h-11 w-11`}><FiX aria-hidden="true" className="h-5 w-5" /></button>
                  </div>
                  <div className="pg-sb min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pe-4 sm:px-4 sm:pe-5"><FilterPanel {...filterPanelProps} /></div>
                  <div className="border-t-[3px] border-[color:var(--ink)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                    <button type="button" onClick={() => { closeSidebar(); scrollToProducts(); }} className={`${BTN} ${BTN_ON} w-full`}>{t("showProducts").replace("{count}", filteredProducts.length)}</button>
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>

          <div className="fixed bottom-5 end-4 z-40 flex flex-col gap-3 sm:end-6 lg:bottom-8 lg:end-8">
            {showTop && <button type="button" onClick={scrollToTop} aria-label={t("backToTop")} title={t("backToTop")} className={`${BTN} ${BTN_OFF} !min-h-0 h-11 w-11 !px-0`}><FiArrowUp aria-hidden="true" className="h-5 w-5" /></button>}
            <button type="button" onClick={handleOpenChat} onMouseEnter={prefetchChatModal} aria-label={t("chatWithShop")} title={t("chatWithShop")} className={`${BTN} ${BTN_ON} !min-h-0 h-12 w-12 !px-0 sm:h-14 sm:w-14`}><FiMessageCircle aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" /></button>
          </div>

          <AnimatePresence>
            {editingReview && <EditReviewModal key={editingReview.id} review={editingReview} t={t} onClose={closeEdit} onSave={updateReview} />}
          </AnimatePresence>

          <AnimatePresence>
            {detailsProduct && (
              <ProductDetailsModal key={detailsProduct.id} product={detailsProduct} darkMode={darkMode} isSaved={saved.has(detailsProduct.id)} onSave={toggleSaved}
                onClose={closeDetails} onAddToCart={handleAddToCart} onView={viewProduct} t={t} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {offerDetail && (
              <ShopOfferModal key={offerDetail.id} offer={offerDetail} language={language} currency={currency} onClose={closeOfferDetail} onViewProducts={scrollToProducts} ot={ot} t={t} />
            )}
          </AnimatePresence>

          <Suspense fallback={null}>
            <AnimatePresence>
              {openChat && isAuthenticated && <ChatModal shopId={shopId} shopName={shop?.name} open={openChat} onClose={closeChat} darkMode={darkMode} />}
            </AnimatePresence>
          </Suspense>
        </Frame>
      </MotionConfig>
    </LazyMotion>
  );
};

const Shop = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <ShopContent {...props} />
  </QueryClientProvider>
));

Shop.displayName = "Shop";
export { queryClient };
export default Shop;