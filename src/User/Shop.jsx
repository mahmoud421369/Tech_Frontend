import React, {
  useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback, useId, memo, lazy, Suspense, useDeferredValue, useTransition,
} from "react";
import { Link, useNavigate, useNavigationType, useParams } from "react-router-dom";
import {
  FiSearch, FiTrash2, FiEdit3, FiMessageCircle, FiCheckCircle, FiShoppingCart, FiX, FiSliders,
  FiChevronLeft, FiChevronRight, FiCheck, FiChevronDown,
  FiShield, FiTruck, FiRefreshCw, FiTag, FiPackage, FiAward, FiExternalLink, FiArrowUp,
  FiCalendar, FiClock, FiHeart, FiCornerDownRight, FiPlus, FiMapPin, FiPhone, FiAlertCircle, FiShoppingBag, FiPercent,
} from "react-icons/fi";
import { RiStarFill, RiVerifiedBadgeLine } from "react-icons/ri";
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
const BATCH = 12;
const HISTOGRAM_BINS = 16;
const LOW_STOCK = 5;
const CATEGORY_CHIPS = 12;

const PG_CSS = `
.pg-root{--dx:1;--bg:#f3f4f6;--panel:#ffffff;--card:#ffffff;--card-hi:#f0fdf4;--line:#e5e7eb;--line2:#d1d5db;--txt:#022c22;--mut:#4b5563;--hov:rgba(5,150,105,.1);--fld:#ffffff;--chip:#ffffff;--tag:#d1fae5;--pill:rgba(255,255,255,.93);--acc:#047857;--ring:#059669;--overlay:rgba(2,44,34,.55);--sk:rgba(2,44,34,.07);--skhi:rgba(255,255,255,.75);--bar:rgba(255,255,255,.95);--sale:#c2410c;--pos:#047857;--tk-line:#022c22;--tk-shadow:#022c22;--tk-gray:#f3f4f6;--tk-acc:#34d399;--tk-on:#022c22;background:var(--bg);color:var(--txt)}
.pg-root[dir=rtl]{--dx:-1}
.pg-dark{color-scheme:dark;--bg:#022c22;--panel:#022c22;--card:rgba(6,78,59,.5);--card-hi:rgba(6,78,59,.8);--line:rgba(255,255,255,.1);--line2:rgba(255,255,255,.2);--txt:#ffffff;--mut:rgba(255,255,255,.8);--hov:rgba(255,255,255,.1);--fld:#064e3b;--chip:rgba(6,78,59,.7);--tag:rgba(6,95,70,.8);--pill:rgba(2,44,34,.85);--acc:#6ee7b7;--ring:#6ee7b7;--overlay:rgba(0,0,0,.7);--sk:rgba(255,255,255,.08);--skhi:rgba(255,255,255,.12);--bar:rgba(2,44,34,.95);--sale:#fb923c;--pos:#6ee7b7;--tk-line:#34d399;--tk-shadow:#000;--tk-gray:#064e3b;--tk-acc:#39ff88;--tk-on:#04261a}
.pg-cover{background-color:#047857;background-image:radial-gradient(circle at 2px 2px,rgba(255,255,255,.16) 1.4px,transparent 1.8px),linear-gradient(135deg,#059669 0%,#047857 45%,#022c22 100%);background-size:22px 22px,auto}
.pg-dark .pg-cover{background-image:radial-gradient(circle at 2px 2px,rgba(110,231,183,.14) 1.4px,transparent 1.8px),linear-gradient(135deg,#065f46 0%,#064e3b 45%,#022c22 100%)}
.pg-sk{position:relative;overflow:hidden;background:var(--sk)}
.pg-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--skhi),transparent);animation:pgShimmer 1.25s ease-in-out infinite}
.pg-root[dir=rtl] .pg-sk::after{animation-direction:reverse}
@keyframes pgShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.pg-rise{animation:pgRise .5s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0)*40ms)}
@keyframes pgRise{from{opacity:0;transform:translate3d(0,16px,0)}to{opacity:1;transform:none}}
.pg-hero-in{animation:pgHeroIn .6s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i,0)*80ms)}
@keyframes pgHeroIn{from{opacity:0;transform:translate3d(0,18px,0)}to{opacity:1;transform:none}}
.pg-pop{animation:pgPop .2s cubic-bezier(.22,1,.36,1) both;transform-origin:top}
@keyframes pgPop{from{opacity:0;transform:translate3d(0,-6px,0) scale(.98)}to{opacity:1;transform:none}}
.pg-heart{animation:pgHeart .3s ease-out}
@keyframes pgHeart{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
.pg-dot{animation:pgDot 1s ease-in-out infinite}
.pg-dot:nth-child(2){animation-delay:.15s}
.pg-dot:nth-child(3){animation-delay:.3s}
@keyframes pgDot{0%,80%,100%{transform:scale(.55);opacity:.4}40%{transform:scale(1);opacity:1}}
.pg-rv{opacity:0;transform:translate3d(0,24px,0);transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1);will-change:opacity,transform}
.pg-rv[data-shown="1"]{opacity:1;transform:none;will-change:auto}
.pg-nosb{scrollbar-width:none}
.pg-nosb::-webkit-scrollbar{display:none}
.pg-sb{scrollbar-width:thin;scrollbar-color:#34d399 transparent}
.pg-sb::-webkit-scrollbar{width:8px;height:8px}
.pg-sb::-webkit-scrollbar-thumb{background:#34d399;border-radius:999px}
.pg-sb::-webkit-scrollbar-track{background:transparent}
.pg-search::-webkit-search-cancel-button,.pg-search::-webkit-search-decoration{display:none;-webkit-appearance:none}
.pg-bin{background:var(--line2)}
.pg-bin-on{background:#10b981}
.pg-range{position:absolute;inset:0;width:100%;height:20px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none}
.pg-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;box-sizing:border-box;pointer-events:auto;width:22px;height:22px;border-radius:999px;background:#10b981;border:3px solid var(--panel);box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:grab}
.pg-range::-moz-range-thumb{box-sizing:border-box;pointer-events:auto;width:22px;height:22px;border-radius:999px;background:#10b981;border:3px solid var(--panel);box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:grab}
.pg-lazy{content-visibility:auto;contain-intrinsic-size:auto 520px}
.pg-ticket{--stub:6.5rem;position:relative;display:flex;width:100%;height:100%;min-height:190px;cursor:pointer;background:var(--panel);color:var(--txt);border:3px solid var(--tk-line);box-shadow:calc(var(--dx)*6px) 6px 0 var(--tk-shadow);transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s cubic-bezier(.22,1,.36,1)}
@media (hover:hover){.pg-ticket:hover{transform:translate(calc(var(--dx)*3px),3px);box-shadow:calc(var(--dx)*3px) 3px 0 var(--tk-shadow)}}
.pg-ticket:active{transform:translate(calc(var(--dx)*5px),5px);box-shadow:calc(var(--dx)*1px) 1px 0 var(--tk-shadow)}
.pg-ticket:focus-visible{outline:3px solid var(--tk-acc);outline-offset:3px}
@media (min-width:640px){.pg-ticket{--stub:8rem}}
.pg-stub{position:relative;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:var(--stub);background:var(--tk-gray);border-inline-end:3px dashed var(--tk-line)}
.pg-notch{position:absolute;z-index:2;width:24px;height:24px;border-radius:50%;background:var(--bg);border:3px solid var(--tk-line);inset-inline-start:calc(var(--stub) - 13.5px)}
.pg-notch-t{top:-15px;clip-path:inset(50% 0 0 0)}
.pg-notch-b{bottom:-15px;clip-path:inset(0 0 50% 0)}
.pg-code{flex:none;align-self:stretch;width:16px;margin-block:14px;margin-inline:4px 12px;opacity:.5;background:repeating-linear-gradient(to bottom,var(--txt) 0 2px,transparent 2px 4px,var(--txt) 4px 5px,transparent 5px 9px,var(--txt) 9px 12px,transparent 12px 14px)}
.pg-tknum{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;background:var(--tk-acc);color:var(--tk-on);border:2px solid var(--tk-line);box-shadow:calc(var(--dx)*2px) 2px 0 var(--tk-shadow);font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1}
.pg-tkchip{display:inline-flex;align-items:center;gap:4px;border:2px solid var(--tk-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5;color:#fff}
.pg-tk-on{background:#059669}
.pg-tk-off{background:#4b5563}
.pg-ul{text-decoration:underline;text-decoration-color:var(--tk-acc);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
@media (prefers-reduced-motion:no-preference){html:has(.pg-root){scroll-behavior:smooth}}
@media (prefers-reduced-motion:reduce){.pg-sk::after,.pg-rise,.pg-hero-in,.pg-pop,.pg-heart,.pg-dot{animation:none}.pg-rv{opacity:1;transform:none;transition:none;will-change:auto}.pg-ticket{transition:none}}
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

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]";
const SURFACE = "rounded-2xl border border-[color:var(--line)] bg-[color:var(--card)] text-[color:var(--txt)]";
const LIFT = "transition-[transform,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] active:scale-[.98] motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-emerald-500/60 [@media(hover:hover)]:hover:bg-[color:var(--card-hi)] [@media(hover:hover)]:hover:shadow-xl [@media(hover:hover)]:hover:shadow-black/10";
const BTN = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold transition-[transform,background-color,border-color,opacity] duration-200 ease-[cubic-bezier(.22,1,.36,1)] active:scale-95 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const BTN_ON = "bg-emerald-600 text-white hover:bg-emerald-500";
const BTN_OFF = "border border-[color:var(--line2)] bg-[color:var(--chip)] text-[color:var(--txt)] hover:border-emerald-500/70";
const BTN_SM = "!min-h-9 !px-3.5 !text-xs";
const ICON = `inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-[transform,background-color] duration-200 ease-[cubic-bezier(.22,1,.36,1)] active:scale-90 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const ICON_OFF = "border border-[color:var(--line2)] bg-[color:var(--fld)] text-[color:var(--txt)] hover:bg-emerald-600 hover:!text-white";
const ICON_PILL = "bg-[color:var(--pill)] text-[color:var(--txt)] hover:bg-emerald-600 hover:!text-white";
const FIELD = "rounded-xl border border-[color:var(--line2)] bg-[color:var(--fld)] text-[color:var(--txt)] transition-[border-color,box-shadow] duration-200 hover:border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30";
const PANEL = "border border-[color:var(--line)] bg-[color:var(--panel)]";
const WRAP = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5";
const MUTED = "text-[color:var(--mut)]";
const ACC = "text-[color:var(--acc)]";

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
    prevPage: "Previous page", nextPage: "Next page", pageN: "Page {n}", pagination: "Pagination",
    productDetails: "Details", imageUnavailable: "Image unavailable", noAddress: "No address listed",
    addressLabel: "Address", phoneLabel: "Phone", shopReply: "Shop reply",
    shopOffers: "Shop Offers", shopOffersSubtitle: "Current deals from this shop", viewAllOffers: "View all offers",
    save: "Save product", saved: "Saved", savedOnly: "Saved only", loadingMore: "Loading more products", endOfList: "You have seen all products",
    all: "All", moreFilters: "More filters", priceMin: "Min", priceMax: "Max", minPriceAria: "Minimum price", maxPriceAria: "Maximum price",
    errorInvalidNumber: "Enter a valid number", errorNegative: "Price can't be negative", errorMinGreater: "Min can't be above max",
    errorMaxLess: "Max can't be below min", errorMaxPrice: "Max price is {{max}}",
    youSave: "Save {{value}}", originalPrice: "Original price", discountedPrice: "Price after discount", discountValue: "Discount",
    onlyLeft: "Only {{count}} left in stock", scrollBack: "Scroll back", scrollForward: "Scroll forward",
    offerActive: "Active", offerInactive: "Inactive", offerEnds: "Ends {{date}}",
  },
  ar: {
    crumbHome: "الرئيسية", crumbBreadcrumb: "مسار التنقل", shopBadge: "ملف المتجر",
    prevPage: "الصفحة السابقة", nextPage: "الصفحة التالية", pageN: "صفحة {n}", pagination: "التنقل بين الصفحات",
    productDetails: "التفاصيل", imageUnavailable: "الصورة غير متاحة", noAddress: "لا يوجد عنوان مسجل",
    addressLabel: "العنوان", phoneLabel: "الهاتف", shopReply: "رد المتجر",
    shopOffers: "عروض المتجر", shopOffersSubtitle: "أحدث العروض الحالية من هذا المتجر", viewAllOffers: "عرض كل العروض",
    save: "حفظ المنتج", saved: "تم الحفظ", savedOnly: "المحفوظة فقط", loadingMore: "جارٍ تحميل المزيد من المنتجات", endOfList: "لقد شاهدت جميع المنتجات",
    all: "الكل", moreFilters: "فلاتر إضافية", priceMin: "الأدنى", priceMax: "الأقصى", minPriceAria: "السعر الأدنى", maxPriceAria: "السعر الأقصى",
    errorInvalidNumber: "أدخل رقمًا صحيحًا", errorNegative: "لا يمكن أن يكون السعر سالبًا", errorMinGreater: "الحد الأدنى لا يمكن أن يتجاوز الأقصى",
    errorMaxLess: "الحد الأقصى لا يمكن أن يقل عن الأدنى", errorMaxPrice: "أقصى سعر هو {{max}}",
    youSave: "وفّر {{value}}", originalPrice: "السعر الأصلي", discountedPrice: "السعر بعد الخصم", discountValue: "الخصم",
    onlyLeft: "متبقي {{count}} فقط في المخزون", scrollBack: "السابق", scrollForward: "التالي",
    offerActive: "نشط", offerInactive: "غير نشط", offerEnds: "ينتهي {{date}}",
  },
  fr: {
    crumbHome: "Accueil", crumbBreadcrumb: "Fil d'Ariane", shopBadge: "Profil de la boutique",
    prevPage: "Page précédente", nextPage: "Page suivante", pageN: "Page {n}", pagination: "Pagination",
    productDetails: "Détails", imageUnavailable: "Image indisponible", noAddress: "Aucune adresse indiquée",
    addressLabel: "Adresse", phoneLabel: "Téléphone", shopReply: "Réponse de la boutique",
    shopOffers: "Offres de la boutique", shopOffersSubtitle: "Les offres du moment de cette boutique", viewAllOffers: "Voir toutes les offres",
    save: "Enregistrer le produit", saved: "Enregistré", savedOnly: "Enregistrés uniquement", loadingMore: "Chargement d'autres produits", endOfList: "Vous avez vu tous les produits",
    all: "Tous", moreFilters: "Plus de filtres", priceMin: "Min", priceMax: "Max", minPriceAria: "Prix minimum", maxPriceAria: "Prix maximum",
    errorInvalidNumber: "Saisissez un nombre valide", errorNegative: "Le prix ne peut pas être négatif", errorMinGreater: "Le min ne peut pas dépasser le max",
    errorMaxLess: "Le max ne peut pas être inférieur au min", errorMaxPrice: "Le prix max est {{max}}",
    youSave: "Économisez {{value}}", originalPrice: "Prix d'origine", discountedPrice: "Prix après remise", discountValue: "Remise",
    onlyLeft: "Plus que {{count}} en stock", scrollBack: "Précédent", scrollForward: "Suivant",
    offerActive: "Actif", offerInactive: "Inactif", offerEnds: "Se termine le {{date}}",
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
const pad = (n) => String(n).padStart(2, "0");

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
const OFFERS_SHOWN = 12;
const EMPTY_LIST = [];
const STAGGER = Array.from({ length: 12 }, (_, i) => ({ "--i": i }));

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

const EASE = [0.22, 1, 0.36, 1];
const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: "easeIn" } },
};
const PANEL_MOTION = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: EASE } },
  exit: { opacity: 0, y: 14, scale: 0.98, transition: { duration: 0.16, ease: "easeIn" } },
};
const drawerMotion = (rtl) => {
  const off = rtl ? "100%" : "-100%";
  return {
    initial: { x: off },
    animate: { x: 0, transition: { duration: 0.32, ease: EASE } },
    exit: { x: off, transition: { duration: 0.2, ease: "easeIn" } },
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

const makeObserveOnce = (options) => {
  let io;
  const callbacks = new WeakMap();
  return (el, cb) => {
    if (typeof IntersectionObserver === "undefined") { cb(); return undefined; }
    io ||= new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const fn = callbacks.get(e.target);
        io.unobserve(e.target);
        callbacks.delete(e.target);
        fn?.();
      }
    }, options);
    callbacks.set(el, cb);
    io.observe(el);
    return () => { io.unobserve(el); callbacks.delete(el); };
  };
};
const observeReveal = makeObserveOnce({ rootMargin: "0px 0px -8% 0px", threshold: 0.01 });

const Reveal = memo(({ as: Tag = "div", className = "", children, ...rest }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (shown || !ref.current) return undefined;
    return observeReveal(ref.current, () => setShown(true));
  }, [shown]);
  return (
    <Tag ref={ref} data-shown={shown ? "1" : "0"} className={`pg-rv ${className}`} {...rest}>
      {children}
    </Tag>
  );
});

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
  const words = str.split(" ");
  if (words.length < 2) return [{ part: str, hl: true }];
  const n = words.length <= 3 ? 1 : 2;
  return [{ part: `${words.slice(0, -n).join(" ")} `, hl: false }, { part: words.slice(-n).join(" "), hl: true }];
};

const SectionTitle = memo(({ title, subtitle, children }) => {
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-6">
      <div className="min-w-0 max-w-3xl">
        <h2 className="text-xl font-extrabold leading-tight [text-wrap:balance] sm:text-3xl">
          {parts.map(({ part, hl }, i) => (hl ? <span key={i} className={ACC}>{part}</span> : part))}
        </h2>
        {subtitle && <p className={`mt-1.5 max-w-2xl text-sm font-medium leading-relaxed sm:text-base ${MUTED}`}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
});

const Sk = ({ className = "" }) => <div className={`pg-sk rounded-lg ${className}`} />;

const ProductSkeleton = memo(() => (
  <div aria-hidden="true" className={`overflow-hidden ${SURFACE}`}>
    <Sk className="aspect-[5/4] !rounded-none" />
    <div className="space-y-2.5 p-3.5">
      <Sk className="h-4 w-4/5" />
      <Sk className="h-3 w-3/5" />
      <Sk className="h-3 w-2/5" />
      <div className="flex items-end justify-between pt-3">
        <Sk className="h-6 w-20" />
        <Sk className="h-10 w-10 !rounded-full" />
      </div>
    </div>
  </div>
));

const ProductGridSkeleton = memo(({ count = 10, label }) => (
  <div className={GRID} role="status" aria-busy="true" aria-label={label}>
    {Array.from({ length: count }).map((_, i) => <ProductSkeleton key={i} />)}
  </div>
));

const ReviewSkeleton = memo(() => (
  <div aria-hidden="true" className={`space-y-3 p-5 ${SURFACE}`}>
    <div className="flex items-center gap-3">
      <Sk className="h-10 w-10 !rounded-full" />
      <div className="flex-1 space-y-2"><Sk className="h-3 w-1/2" /><Sk className="h-3 w-1/3" /></div>
    </div>
    <Sk className="h-3 w-24" />
    <Sk className="h-3 w-full" />
    <Sk className="h-3 w-4/5" />
  </div>
));

const OfferSkeleton = memo(() => (
  <div aria-hidden="true" className={`flex h-36 w-[78%] flex-shrink-0 overflow-hidden sm:w-80 ${SURFACE}`}>
    <Sk className="h-full w-28 !rounded-none" />
    <div className="flex-1 space-y-2.5 p-3.5"><Sk className="h-3 w-1/3" /><Sk className="h-4 w-4/5" /><Sk className="h-3 w-3/5" /></div>
  </div>
));

const PageSkeleton = memo(({ darkMode, dir, language, isAr, label }) => (
  <Frame darkMode={darkMode} dir={dir} language={language} isAr={isAr}>
    <div role="status" aria-busy="true" aria-label={label}>
      <div className="pg-cover h-52 sm:h-72" />
      <div className={`${WRAP} relative z-10 -mt-20 sm:-mt-24`}>
        <div className={`space-y-5 p-4 sm:p-6 ${SURFACE}`}>
          <div className="flex items-start gap-4">
            <Sk className="-mt-14 h-24 w-24 flex-shrink-0 !rounded-2xl sm:-mt-20 sm:h-28 sm:w-28" />
            <div className="min-w-0 flex-1 space-y-3 pt-1">
              <Sk className="h-7 w-2/3" />
              <Sk className="h-3 w-1/3" />
            </div>
          </div>
          <Sk className="h-3 w-full" />
          <Sk className="h-3 w-4/5" />
          <div className="grid grid-cols-3 gap-4 pt-2"><Sk className="h-12" /><Sk className="h-12" /><Sk className="h-12" /></div>
        </div>
      </div>
      <div className={`${WRAP} space-y-6 py-8`}>
        <div className="flex gap-3 overflow-hidden">{Array.from({ length: 4 }).map((_, i) => <OfferSkeleton key={i} />)}</div>
        <div className="flex gap-2 overflow-hidden">{Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-10 w-28 flex-shrink-0 !rounded-full" />)}</div>
        <ProductGridSkeleton count={10} label={label} />
      </div>
    </div>
  </Frame>
));

const Frame = ({ darkMode, dir, language, isAr, children }) => (
  <div dir={dir} lang={language} className={`pg-root ${darkMode ? "pg-dark" : ""} min-h-screen overflow-x-clip ${isAr ? "font-cairo" : "font-jakarta"}`}>
    {children}
  </div>
);

const ShopLogo = memo(({ src, name, children }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setFailed(false); setLoaded(false); }, [src]);
  const onError = useCallback(() => setFailed(true), []);
  const onLoad = useCallback(() => setLoaded(true), []);
  if (!src || failed) return children;
  return (
    <>
      {!loaded && <div aria-hidden="true" className="pg-sk absolute inset-0 !rounded-none" />}
      <img
        src={src} alt={name || ""} width={200} height={200}
        decoding="async" fetchPriority="high" referrerPolicy="no-referrer" onLoad={onLoad} onError={onError}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
});

const DeviceArt = memo(({ name, categoryName, darkMode, label }) => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100"
    role="img" aria-label={name ? `${name} – ${label}` : label}
  >
    <IsoIllustration
      type={isoCatKey(kindOf(categoryName || name))} tone="emerald" darkMode={false} onGreen={false}
      className="h-[64%] w-[64%] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none group-hover:scale-105"
    />
    <span className="max-w-full truncate px-2 text-[9px] font-extrabold uppercase tracking-widest text-emerald-900/70 rtl:tracking-normal">{label}</span>
  </div>
));

const ContactTile = memo(({ icon: Icon, label, href, children }) => {
  const cls = "flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--fld)] px-3 py-2.5 text-start";
  const body = (
    <>
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[10px] font-bold uppercase ${MUTED}`}>{label}</span>
        <span className="block text-sm font-extrabold">{children}</span>
      </span>
    </>
  );
  return href
    ? <a href={href} className={`${cls} transition-[transform,border-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 hover:border-emerald-500/60 motion-reduce:transition-none ${FOCUS}`}>{body}</a>
    : <div className={cls}>{body}</div>;
});

const ShopHeader = memo(({ shop, logo, darkMode, title, stats, avgRating, reviewCount, onViewProducts, onChat, t }) => {
  const address = clean(shop?.shopAddress?.fullAddress || [shop?.shopAddress?.street, shop?.shopAddress?.city].filter(Boolean).join(", "), 200);
  const phone = shop?.phone ? clean(String(shop.phone), 30) : "";
  const type = clean(shop?.shopType, 60);
  const hasReviews = reviewCount > 0 && avgRating !== "–";
  return (
    <header className="relative">
      <div className="pg-cover relative h-52 mt-16 overflow-hidden text-white sm:h-72">
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div aria-hidden="true" className="pg-hero-in pointer-events-none absolute bottom-0 end-6 hidden h-52 w-52 opacity-90 lg:block xl:end-16 xl:h-60 xl:w-60" style={STAGGER[2]}>
          <IsoIllustration type="shop_store" tone="emerald" darkMode onGreen={false} className="h-full w-full" />
        </div>
        <div className={`${WRAP} relative pt-24 sm:pt-28`}>
          <nav aria-label={t("crumbBreadcrumb")} className="pg-hero-in flex flex-wrap items-center gap-1.5 text-xs font-bold sm:text-sm" style={STAGGER[0]}>
            <Link to="/" className={`rounded underline decoration-white/60 decoration-2 underline-offset-4 hover:no-underline ${FOCUS}`}>{t("crumbHome")}</Link>
            <FiChevronRight aria-hidden="true" className="h-3 w-3 flex-shrink-0 rtl:rotate-180" />
            <span className="max-w-[14rem] truncate opacity-90" aria-current="page">{title}</span>
          </nav>
        </div>
      </div>

      <div className={`${WRAP} relative z-10 -mt-20 sm:-mt-24`}>
        <div className={`pg-hero-in p-4 sm:p-6 ${SURFACE}`} style={STAGGER[1]}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="relative -mt-14 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-[color:var(--panel)] bg-[color:var(--fld)] shadow-lg shadow-black/20 sm:-mt-20 sm:h-32 sm:w-32">
                <ShopLogo src={logo} name={shop?.name}>
                  <IsoIllustration type="shop_store" darkMode={darkMode} onGreen={false} className="h-16 w-16 sm:h-24 sm:w-24" />
                </ShopLogo>
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="flex min-w-0 items-center gap-2 break-words text-2xl font-extrabold leading-tight rtl:leading-snug sm:text-4xl">
                  <span className="min-w-0 break-words">{title}</span>
                  {shop?.verified && (
                    <span className="inline-flex flex-shrink-0" title={t("verified")}>
                      <RiVerifiedBadgeLine aria-hidden="true" className={`h-6 w-6 sm:h-7 sm:w-7 ${ACC}`} />
                      <span className="sr-only">{t("verified")}</span>
                    </span>
                  )}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {hasReviews && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--tag)] px-3 py-1 text-xs font-extrabold">
                      <RiStarFill aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
                      <span dir="ltr" className="tabular-nums">{avgRating}</span>
                      <span dir="ltr" className={`font-semibold tabular-nums ${MUTED}`}>({COMPACT_FORMAT.format(reviewCount)})</span>
                    </span>
                  )}
                  {type && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--tag)] px-3 py-1 text-xs font-bold">
                      <FiShoppingBag aria-hidden="true" className="h-3 w-3" />{type}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--tag)] px-3 py-1 text-xs font-bold">
                    <FiShield aria-hidden="true" className="h-3 w-3" />{t("shopBadge")}
                  </span>
                </div>
                <p className={`mt-3 max-w-2xl text-sm font-medium leading-relaxed sm:text-base ${MUTED}`}>{clean(shop?.description, 600) || t("shopDescription")}</p>
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

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onViewProducts} className={`${BTN} ${BTN_ON}`}>
              <FiShoppingCart aria-hidden="true" className="h-4 w-4" />{t("viewProducts")}
            </button>
            <button type="button" onClick={onChat} onMouseEnter={prefetchChatModal} onFocus={prefetchChatModal} className={`${BTN} ${BTN_OFF}`}>
              <FiMessageCircle aria-hidden="true" className="h-4 w-4" />{t("chatWithShop")}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 border-t border-[color:var(--line)] pt-4 text-center">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0 px-1">
                <p className="text-xl font-extrabold tabular-nums sm:text-3xl" dir="ltr">{s.value}</p>
                <p className={`truncate text-[11px] font-bold uppercase sm:text-xs ${MUTED}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
});

const HRail = memo(({ title, subtitle, count, onViewAll, viewAllLabel, itemCount, isRTL, t, children }) => {
  const { ref, edge, scroll } = useHScroll(itemCount, isRTL);
  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold sm:text-2xl">
            {title}
            {count != null && <span dir="ltr" className={`ms-2 text-sm font-bold tabular-nums ${MUTED}`}>({count})</span>}
          </h3>
          {subtitle && <p className={`mt-0.5 line-clamp-1 text-xs font-medium sm:text-sm ${MUTED}`}>{subtitle}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {onViewAll && (
            <button type="button" onClick={onViewAll} className={`inline-flex min-h-10 cursor-pointer items-center rounded-full px-3 text-sm font-extrabold transition-colors duration-200 hover:bg-[color:var(--hov)] ${ACC} ${FOCUS}`}>
              {viewAllLabel}
            </button>
          )}
          <button type="button" onClick={() => scroll("back")} disabled={!edge.l} aria-label={t("scrollBack")} className={`${ICON} ${ICON_OFF} hidden h-10 w-10 sm:inline-flex`}><BackIcon aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" onClick={() => scroll("forward")} disabled={!edge.r} aria-label={t("scrollForward")} className={`${ICON} ${ICON_OFF} hidden h-10 w-10 sm:inline-flex`}><ForwardIcon aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={ref} className="pg-nosb -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-3 pt-1 motion-reduce:scroll-auto sm:-mx-6 sm:gap-4 sm:px-6 lg:-mx-8 lg:px-8">
        {children}
      </div>
    </div>
  );
});

const OfferStatus = memo(({ remaining, urgent }) => (
  remaining ? (
    <p className={`flex items-center gap-1 text-xs font-extrabold ${urgent ? "text-[color:var(--sale)]" : MUTED}`}>
      <FiClock aria-hidden="true" className="h-3 w-3" />{remaining}
    </p>
  ) : null
));

const OfferDefs = memo(({ gid }) => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${gid}front`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#047857" /></linearGradient>
      <linearGradient id={`${gid}tag`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
    </defs>
  </svg>
));

const OfferArt = memo(({ gid, className = "" }) => (
  <svg viewBox="0 0 160 120" className={className} role="presentation" aria-hidden="true" focusable="false">
    <ellipse cx="78" cy="109" rx="56" ry="7" fill="#000" opacity=".28" />
    <polygon points="26,62 56,50 118,50 88,62" fill="#a7f3d0" />
    <rect x="26" y="62" width="62" height="44" rx="3" fill={`url(#${gid}front)`} />
    <polygon points="88,62 118,50 118,94 88,106" fill="#065f46" />
    <rect x="51" y="62" width="12" height="44" fill="#fbbf24" />
    <polygon points="51,62 63,62 93,50 81,50" fill="#fde68a" />
    <polygon points="88,78 118,66 118,74 88,86" fill="#d97706" />
    <path d="M72 52c-10-14-26-10-22-3 3 5 14 5 22 3zM72 52c10-14 26-10 22-3-3 5-14 5-22 3z" fill="#f59e0b" />
    <circle cx="72" cy="52" r="4" fill="#fbbf24" />
    <rect x="26" y="62" width="10" height="44" rx="3" fill="#fff" opacity=".16" />
    <g transform="translate(96 8) rotate(12)">
      <rect x="2" y="4" width="54" height="40" rx="9" fill="#b45309" opacity=".35" />
      <rect x="0" y="0" width="54" height="40" rx="9" fill={`url(#${gid}tag)`} />
      <rect x="0" y="0" width="54" height="12" rx="9" fill="#fff" opacity=".25" />
      <circle cx="8" cy="20" r="3.5" fill="#fff" opacity=".9" />
      <circle cx="25" cy="15" r="4.5" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="41" cy="28" r="4.5" fill="none" stroke="#fff" strokeWidth="3" />
      <line x1="43" y1="11" x2="24" y2="32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </g>
    <path d="M0-6 1.5-1.5 6 0 1.5 1.5 0 6-1.5 1.5-6 0-1.5-1.5z" fill="#34d399" transform="translate(16 36)" />
    <path d="M0-6 1.5-1.5 6 0 1.5 1.5 0 6-1.5 1.5-6 0-1.5-1.5z" fill="#fbbf24" transform="translate(146 76) scale(.8)" />
  </svg>
));

const ShopOfferTicket = memo(({ offer, index, language, currency, gid, onOpen, ot, t }) => {
  const meta = useOfferMeta(offer, language, currency);
  const open = useCallback(() => onOpen(offer), [onOpen, offer]);
  const active = offer.status === "ACTIVE";
  const end = toDate(offer.endDate);
  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={offer.name}
      className="pg-ticket"
    >
      <span className="pg-notch pg-notch-t" aria-hidden="true" />
      <span className="pg-notch pg-notch-b" aria-hidden="true" />

      <div className="pg-stub px-2 pb-1 pt-3">
        <div className="flex flex-col items-center leading-none" dir="ltr">
          <div className="flex items-baseline gap-0.5">
            {meta.isFixed && <span className="text-xs font-extrabold">{currency}</span>}
            <span className="text-3xl font-black tabular-nums tracking-tight">{NUMBER_FORMAT.format(offer.discountValue)}</span>
            {meta.isPct && <FiPercent aria-hidden="true" className="h-5 w-5 self-center" strokeWidth={3} />}
          </div>
          <span className="mt-1 text-[10px] font-extrabold uppercase tracking-widest">{ot("off")}</span>
        </div>
        <OfferArt gid={gid} className="h-14 w-full sm:h-16" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 py-3 pe-2 ps-4 sm:py-4 sm:ps-5">
        <div className="flex items-center justify-between gap-2">
          <span className="pg-tknum">{pad(index + 1)}</span>
          <span className={`pg-tkchip ${active ? "pg-tk-on" : "pg-tk-off"}`}>{active ? t("offerActive") : t("offerInactive")}</span>
        </div>
        <h3 className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug sm:text-sm">
          <span className="pg-ul">{offer.name}</span>
        </h3>
        <p className={`line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-5 ${MUTED}`}>{offer.description || ot("descriptionFallback")}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-2 border-dashed border-[color:var(--tk-line)] pt-2.5 text-[11px]">
          <OfferStatus remaining={meta.remaining} urgent={meta.urgent} />
          {end && (
            <span className={`flex items-center gap-1 font-semibold ${MUTED}`}>
              <FiCalendar aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
              <span dir="ltr">{t("offerEnds", { date: dateFmt(language, true).format(end) })}</span>
            </span>
          )}
        </div>
      </div>

      <span className="pg-code" aria-hidden="true" />
    </article>
  );
});

const OfferInfoRow = ({ Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--fld)] p-3">
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Icon aria-hidden="true" className="h-4 w-4" /></span>
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
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-[color:var(--overlay)]" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className="pg-sb relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain rounded-t-3xl border border-[color:var(--line)] bg-[color:var(--panel)] text-[color:var(--txt)] sm:max-w-md sm:rounded-3xl">
        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-800 p-5 pe-16 text-white">
          <p dir="ltr" className="text-4xl font-black leading-none tabular-nums">{offer?.discountValue}{meta.isPct ? "%" : ""} <span className="text-sm font-extrabold uppercase">{ot("off")}</span></p>
          <h2 className="mt-2 line-clamp-2 text-base font-extrabold sm:text-lg">{offer?.name || ot("offerDetails")}</h2>
          <button type="button" onClick={onClose} aria-label={t("close")} className={`${ICON} ${ICON_PILL} absolute end-3 top-3 h-10 w-10`}><FiX aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <OfferStatus remaining={meta.remaining} urgent={meta.urgent} />
          {offer?.description && <p className={`text-sm font-medium leading-relaxed ${MUTED}`}>{offer.description}</p>}
          <OfferInfoRow Icon={FiTag} label={ot("youSave")} value={meta.amount} />
          {meta.range && <OfferInfoRow Icon={FiCalendar} label={ot("validPeriod")} value={meta.range} />}
          <div className="grid grid-cols-2 gap-3 pt-2">
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
      <p className={`truncate font-extrabold leading-tight tabular-nums ${large ? "text-3xl" : "text-base sm:text-lg"} ${d ? "text-[color:var(--sale)]" : ""}`}>
        <span className="sr-only">{d ? `${t("discountedPrice")}: ` : ""}</span>{money(product._final, currency)}
      </p>
      {d && large && (
        <p dir="auto" className="mt-1 truncate text-sm font-bold text-[color:var(--sale)]">
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
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden ${SURFACE} ${LIFT} ${FOCUS}`}
    >
      <div className="relative aspect-[5/4] w-full flex-shrink-0 overflow-hidden bg-white [contain:layout_paint]">
        {imgError ? (
          <DeviceArt name={name} categoryName={p.categoryName || p._cat} darkMode={darkMode} label={t("imageUnavailable")} />
        ) : (
          <>
            {!imgLoaded && <div aria-hidden="true" className="pg-sk absolute inset-0 !rounded-none" />}
            <img
              src={src} alt={name} width={480} height={384}
              loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
              onLoad={handleLoad} onError={handleImgError}
              className={`absolute inset-0 h-full w-full object-contain p-4 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"} ${inStock ? "" : "grayscale"}`}
            />
          </>
        )}
        {p.saving > 0 && (
          <span dir="ltr" className="absolute start-2.5 top-2.5 z-10 rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-white">
            -{Math.round(p.discount)}%
          </span>
        )}
        <button type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t("saved") : t("save")} title={isSaved ? t("saved") : t("save")}
          className={`${ICON} absolute end-2.5 top-2.5 z-10 h-9 w-9 bg-white text-emerald-950 shadow-md shadow-black/10 hover:bg-emerald-50`}>
          <FiHeart key={String(isSaved)} aria-hidden="true" className={`h-4 w-4 ${isSaved ? "pg-heart text-rose-500" : ""}`} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <button type="button" onClick={add} disabled={!inStock || adding} aria-label={t("addToCart")} title={t("addToCart")}
          className={`${ICON} absolute bottom-2.5 end-2.5 z-10 h-10 w-10 bg-emerald-600 text-white shadow-lg shadow-black/25 hover:bg-emerald-500`}>
          {adding ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
            : added ? <FiCheck aria-hidden="true" className="h-5 w-5" /> : <FiPlus aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
        <Price product={p} currency={currency} t={t} />
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug">{name}</h3>
        <p className={`line-clamp-1 text-xs leading-5 ${MUTED}`}>{snippet}</p>

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
      </div>
    </article>
  );
});

const StarRating = memo(({ value, onChange, size = "h-8 w-8 sm:h-9 sm:w-9", t }) => (
  <div className="flex gap-1 sm:gap-2" role="radiogroup" aria-label={t("rating")}>
    {STARS.map((star) => (
      <button key={star} type="button" role="radio" aria-checked={value === star} onClick={() => onChange(star)}
        aria-label={t("rateStars").replace("{star}", star)}
        className={`rounded-md transition-transform duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:scale-110 active:scale-95 motion-reduce:transition-none ${FOCUS}`}>
        <RiStarFill className={`${size} transition-colors duration-200 ${value >= star ? "text-amber-500" : "text-[color:var(--mut)] opacity-35"}`} />
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
    <div className={`p-4 sm:p-6 ${SURFACE}`}>
      <h3 className="mb-4 text-lg font-extrabold sm:text-xl"><span className={ACC}>{t("shareYourExperience")}</span></h3>
      {hasReview && <p role="status" className="mb-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--fld)] px-3 py-2 text-xs font-bold">{t("alreadyReviewedNote")}</p>}
      <StarRating value={rating} onChange={setRating} t={t} />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder={t("reviewPlaceholder")} maxLength={1000} rows={3} aria-label={t("shareYourExperience")}
        className={`mt-4 w-full resize-none p-3 text-sm font-medium leading-relaxed outline-none placeholder:opacity-60 sm:p-4 ${FIELD}`} />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`text-[11px] font-bold ${MUTED}`} dir="ltr">{comment.length}/1000</span>
      </div>
      <div className="mt-3">
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
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-[color:var(--overlay)]" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className="relative w-full max-w-lg transform-gpu rounded-t-3xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5 text-[color:var(--txt)] sm:rounded-3xl sm:p-8">
        <h3 className="mb-5 text-xl font-extrabold sm:text-2xl"><span className={ACC}>{t("editReview")}</span></h3>
        <StarRating value={rating} onChange={setRating} t={t} />
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={4} aria-label={t("editReview")}
          className={`mt-4 w-full resize-none p-3 text-sm font-medium outline-none sm:p-4 ${FIELD}`} />
        <div className="mt-5 flex justify-end gap-3">
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
    <article className={`flex h-full min-w-0 flex-col gap-3 p-4 sm:p-5 ${SURFACE}`}>
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-base font-extrabold text-white">
          {name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold">{name || t("anonymous")}</p>
          {Number.isFinite(when) && (
            <p className={`text-[11px] font-bold ${MUTED}`} dir="ltr">
              {new Date(when).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
      <div className="flex" role="img" aria-label={`${r.rating} / 5`}>
        {STARS.map((n) => <RiStarFill key={n} className={`h-4 w-4 ${n <= r.rating ? "text-amber-500" : "text-[color:var(--mut)] opacity-35"}`} />)}
      </div>
      <p className="flex-1 break-words text-sm leading-relaxed">{clean(r.comment, 1000)}</p>
      {mine && (
        <div className="flex flex-shrink-0 gap-2">
          <button type="button" onClick={() => onEdit(r)} aria-label={t("editReview")} title={t("editReview")} className={`${ICON} ${ICON_OFF} h-10 w-10`}><FiEdit3 aria-hidden="true" className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(r.id)} aria-label={t("deleteReview")} title={t("deleteReview")} className={`${ICON} ${ICON_OFF} h-10 w-10 !text-red-500 hover:!text-white`}><FiTrash2 aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      )}
      {reply && (
        <div role="note" aria-label={t("shopReply")} className="ms-3 flex min-w-0 flex-col gap-2 rounded-xl bg-[color:var(--fld)] p-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-extrabold">
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
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-[color:var(--overlay)]" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className="pg-sb relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain rounded-t-3xl border border-[color:var(--line)] bg-[color:var(--panel)] text-[color:var(--txt)] sm:max-w-lg sm:rounded-3xl">
        <div className="absolute end-3 top-3 z-10 flex items-center gap-2">
          <button type="button" onClick={() => onSave(product.id)} aria-pressed={isSaved} aria-label={isSaved ? t("saved") : t("save")} title={isSaved ? t("saved") : t("save")}
            className={`${ICON} h-10 w-10 shadow-md shadow-black/10 ${isSaved ? "bg-emerald-600 text-white" : "bg-white text-emerald-950"}`}>
            <FiHeart aria-hidden="true" className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button type="button" onClick={onClose} aria-label={t("close")} className={`${ICON} h-10 w-10 bg-white text-emerald-950 shadow-md shadow-black/10 hover:bg-emerald-50`}><FiX aria-hidden="true" className="h-4 w-4" /></button>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden bg-white">
          {imgError ? (
            <DeviceArt name={productName} categoryName={product.categoryName || product._cat} darkMode={darkMode} label={t("imageUnavailable")} />
          ) : (
            <img src={product.imageUrl} alt={productName} referrerPolicy="no-referrer" decoding="async"
              onError={() => setImgError(true)} className="h-full w-full bg-white object-contain p-4" />
          )}
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-extrabold leading-snug sm:text-xl">{clean(product.name, 160) || t("product")}</h2>
            <div className="mt-3">
              <Price product={product} currency={currency} t={t} large />
            </div>
          </div>

          <section>
            <h3 className={`mb-2 text-xs font-extrabold uppercase ${ACC}`}>{t("aboutProduct")}</h3>
            <p className={`text-sm leading-relaxed ${MUTED}`}>{clean(product.description, 1500) || t("noProductDescription")}</p>
          </section>

          <section>
            <h3 className={`mb-3 text-xs font-extrabold uppercase ${ACC}`}>{t("details")}</h3>
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--fld)] p-3.5 min-[400px]:grid-cols-2">
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

          <div className="grid grid-cols-2 gap-3">
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
  const navigate = useNavigate();
  const goToCategory = useCallback(() => navigate(`/products/category/${encodeURIComponent(category.id)}`), [navigate, category.id]);
  if (!items.length) return null;
  return (
    <Reveal>
      <HRail
        title={category.name} count={items.length} onViewAll={goToCategory} viewAllLabel={t("viewAll")}
        itemCount={items.length} isRTL={isRTL} t={t}
      >
        {items.map((p, i) => (
          <div key={p.id} className="pg-rise w-[170px] flex-shrink-0 snap-start sm:w-[220px]" style={STAGGER[i % 12]}>
            <ProductCard product={p} darkMode={darkMode} isSaved={saved.has(p.id)} onSave={onSave} onAddToCart={onAddToCart} onDetails={onDetails} t={t} />
          </div>
        ))}
      </HRail>
    </Reveal>
  );
});

const OptionRow = memo(({ type, label, count, selected, onClick }) => (
  <button
    type="button" role={type === "check" ? "checkbox" : "radio"} aria-checked={selected} onClick={onClick}
    className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-start text-sm font-semibold transition-colors duration-200 hover:bg-[color:var(--hov)] ${FOCUS}`}
  >
    <span className={`flex h-5 w-5 flex-none items-center justify-center border-2 transition-colors duration-200 motion-reduce:transition-none ${type === "radio" ? "rounded-full" : "rounded-md"} ${selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-[color:var(--line2)] bg-transparent"}`}>
      {selected && (type === "check" ? <FiCheck aria-hidden="true" className="h-3 w-3" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-white" />)}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className={`text-xs tabular-nums ${MUTED}`} dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ title, isOpen, onToggle, children }) => (
  <section className="border-t border-[color:var(--line)]">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className={`flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-md py-3 text-start ${FOCUS}`}>
      <span className="min-w-0 flex-1 truncate text-sm font-extrabold">{title}</span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && <div className="pg-pop min-w-0 pb-4">{children}</div>}
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
      <div className={`flex min-h-11 items-center px-3 py-2 text-xs font-bold ${FIELD} ${error ? "!border-rose-500" : ""}`} dir="ltr">
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
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[color:var(--line2)]" />
        <div className="absolute h-1.5 rounded-full bg-emerald-500" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
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
        <div className="flex flex-wrap gap-2">
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
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold">
          <FiSliders aria-hidden="true" className={`h-4 w-4 flex-shrink-0 ${ACC}`} /> <span className="truncate">{t("filters")}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className={`min-h-10 flex-shrink-0 rounded-md text-xs font-extrabold underline underline-offset-4 ${ACC} ${FOCUS}`}>{t("resetAll")}</button>}
      </div>

      {priceBounds.max > 0 && (
        <FilterBlock title={t("priceRange")} isOpen={open.price} onToggle={() => toggle("price")}>
          <div className="min-w-0 px-1">
            <PriceRangeFilter bounds={priceBounds} value={priceValue} onChange={setPriceRange} histogram={histogram} t={t} />
          </div>
        </FilterBlock>
      )}

      <FilterBlock title={t("condition")} isOpen={open.cond} onToggle={() => toggle("cond")}>
        <div className="min-w-0 break-words">
          {CONDITIONS.map((c) => (
            <OptionRow key={c} type="check" label={conditionLabel(t, c)} count={conditionCounts[c] || 0} selected={selectedConditions.includes(c)} onClick={() => toggleCondition(c)} />
          ))}
          <OptionRow type="check" label={t("inStockOnly")} selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)} />
        </div>
      </FilterBlock>

      {categoryOptions.length > 0 && (
        <FilterBlock title={t("category")} isOpen={open.cat} onToggle={() => toggle("cat")}>
          <div className="pg-sb max-h-44 min-w-0 overflow-y-auto overscroll-contain break-words pe-1 sm:max-h-52" role="radiogroup" aria-label={t("category")}>
            <OptionRow type="radio" label={t("all")} count={totalCount} selected={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} />
            {categoryOptions.map(({ name, count }) => (
              <OptionRow key={name} type="radio" label={name} count={count} selected={selectedCategory === name} onClick={() => setSelectedCategory(name)} />
            ))}
          </div>
        </FilterBlock>
      )}

      <FilterBlock title={t("moreFilters")} isOpen={open.more} onToggle={() => toggle("more")}>
        <div className="min-w-0 break-words">
          <OptionRow type="check" label={t("onSaleOnly")} selected={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} />
          <OptionRow type="check" label={t("savedOnly")} selected={savedOnly} onClick={() => setSavedOnly((v) => !v)} />
        </div>
      </FilterBlock>
    </div>
  );
});

const Chip = memo(({ active, onClick, icon: Icon, onRemove, children }) => (
  <button
    type="button" onClick={onClick} aria-pressed={active}
    className={`inline-flex h-10 flex-shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition-[background-color,border-color,transform,color] duration-200 ease-[cubic-bezier(.22,1,.36,1)] active:scale-95 motion-reduce:transition-none ${FOCUS} ${
      active ? "border-emerald-500 bg-emerald-600 text-white" : "border-[color:var(--line2)] bg-[color:var(--chip)] text-[color:var(--txt)] hover:border-emerald-500/70"
    }`}
  >
    {Icon && <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0" />}
    <span className="max-w-[10rem] truncate">{children}</span>
    {onRemove && <FiX aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />}
  </button>
));

const Tabs = memo(({ items, value, onChange, ariaLabel, isRTL }) => {
  const listRef = useRef(null);
  const first = useRef(true);
  const [bar, setBar] = useState(null);

  const measure = useCallback(() => {
    const list = listRef.current;
    const el = list?.querySelector('[aria-selected="true"]');
    if (!list || !el) { setBar(null); return; }
    setBar({ x: el.offsetLeft, w: el.offsetWidth });
  }, []);

  useLayoutEffect(() => { measure(); }, [measure, value, items]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [value]);

  const onKey = useCallback((e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const idx = Math.max(0, items.findIndex((i) => i.value === value));
    let next = idx;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else {
      const step = (e.key === "ArrowRight" ? 1 : -1) * (isRTL ? -1 : 1);
      next = (idx + step + items.length) % items.length;
    }
    onChange(items[next].value);
    requestAnimationFrame(() => listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus());
  }, [items, value, isRTL, onChange]);

  return (
    <div
      ref={listRef} role="tablist" aria-label={ariaLabel} onKeyDown={onKey}
      className="relative inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-[color:var(--line2)] bg-[color:var(--chip)] p-1"
    >
      {bar && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-0 top-1 rounded-full bg-emerald-600 shadow-md shadow-emerald-900/30 transition-[transform,width] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
          style={{ width: bar.w, transform: `translateX(${bar.x}px)` }}
        />
      )}
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value} type="button" role="tab" aria-selected={active} tabIndex={active ? 0 : -1} onClick={() => onChange(it.value)}
            className={`relative z-10 h-9 flex-shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${FOCUS} ${
              active ? "text-white" : "text-[color:var(--txt)] hover:text-[color:var(--acc)]"
            }`}
          >
            <span className="block max-w-[10rem] truncate">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
});

const Dropdown = memo(({ value, onChange, options, ariaLabel }) => {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selectedIndex);
  const current = options[selectedIndex];

  const openMenu = useCallback(() => { setActive(selectedIndex); setOpen(true); }, [selectedIndex]);
  const closeMenu = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);
  const pick = useCallback((i) => {
    const o = options[i];
    if (o) onChange(o.value);
    closeMenu();
  }, [options, onChange, closeMenu]);

  useEffect(() => {
    if (!open) return undefined;
    listRef.current?.focus({ preventScroll: true });
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${uid}-o${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, uid]);

  const onButtonKey = useCallback((e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openMenu(); }
  }, [openMenu]);

  const onListKey = useCallback((e) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setActive((i) => Math.min(last, i + 1)); break;
      case "ArrowUp": e.preventDefault(); setActive((i) => Math.max(0, i - 1)); break;
      case "Home": e.preventDefault(); setActive(0); break;
      case "End": e.preventDefault(); setActive(last); break;
      case "Enter":
      case " ": e.preventDefault(); pick(active); break;
      case "Escape": e.preventDefault(); e.stopPropagation(); closeMenu(); break;
      case "Tab": closeMenu(false); break;
      default: break;
    }
  }, [options.length, active, pick, closeMenu]);

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        ref={btnRef} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${uid}-list`} aria-label={`${ariaLabel}: ${current?.label ?? ""}`}
        onClick={() => (open ? closeMenu(false) : openMenu())} onKeyDown={onButtonKey}
        className={`inline-flex h-11 w-44 cursor-pointer items-center justify-between gap-2 rounded-full border bg-[color:var(--chip)] ps-4 pe-3 text-sm font-bold text-[color:var(--txt)] transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(.22,1,.36,1)] hover:border-emerald-500/70 ${open ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.18)]" : "border-[color:var(--line2)]"} ${FOCUS}`}
      >
        <span className="min-w-0 flex-1 truncate text-start">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          id={`${uid}-list`} ref={listRef} role="listbox" tabIndex={-1} aria-label={ariaLabel} aria-activedescendant={`${uid}-o${active}`} onKeyDown={onListKey}
          className={`pg-pop pg-sb absolute start-0 top-full z-50 mt-2 max-h-72 w-60 overflow-y-auto overscroll-contain rounded-2xl p-1.5 text-[color:var(--txt)] shadow-xl shadow-black/30 outline-none ${PANEL}`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={selected}
                onPointerEnter={() => setActive(i)} onClick={() => pick(i)}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors duration-150 ${i === active ? "bg-[color:var(--hov)]" : ""} ${selected ? ACC : ""}`}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {selected && <FiCheck aria-hidden="true" className="h-4 w-4 flex-shrink-0" strokeWidth={3} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

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
      <ul className="flex flex-wrap items-center justify-center gap-2">
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
    <div ref={ref} className="flex min-h-[4rem] items-center justify-center gap-3 pt-8" role="status" aria-live="polite">
      {hasMore ? (
        <>
          <span aria-hidden="true" className="flex items-center gap-1.5">
            <span className="pg-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="pg-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="pg-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold">{t("loadingMore")}</span>
        </>
      ) : total > BATCH ? (
        <p className="pg-pop flex items-center gap-1.5 text-xs font-extrabold"><FiCheck aria-hidden="true" className={`h-3.5 w-3.5 ${ACC}`} />{t("endOfList")}</p>
      ) : null}
    </div>
  );
});

const ChatCTABanner = memo(({ darkMode, onOpenChat, t }) => (
  <Reveal as="section" aria-label={t("chatBannerTitle")} className="pg-lazy py-10 sm:py-14">
    <div className={WRAP}>
      <div onMouseEnter={prefetchChatModal} className="group relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-900 p-6 text-center text-white sm:flex-row sm:gap-8 sm:p-10 sm:text-start">
        <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:h-24 sm:w-24">
          <IsoIllustration type="shopChat" darkMode onGreen hoverOnly className="h-16 w-16 sm:h-20 sm:w-20" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-extrabold sm:text-3xl">{t("chatBannerTitle")}</h3>
          <p className="mt-3 text-sm font-medium opacity-90 sm:text-base">{t("chatBannerDescription")}</p>
        </div>
        <button type="button" onClick={onOpenChat} className={`${BTN} w-full flex-shrink-0 bg-white text-emerald-900 hover:bg-emerald-50 sm:w-auto`}><FiMessageCircle aria-hidden="true" className="h-4 w-4" />{t("startChat")}</button>
      </div>
    </div>
  </Reveal>
));

const EmptyState = memo(({ illustration, title, text, darkMode, children, compact = false }) => (
  <div className={`pg-pop flex flex-col items-center px-4 text-center ${SURFACE} ${compact ? "py-10 sm:py-14" : "py-14 sm:py-20"}`}>
    <IsoIllustration type={illustration} darkMode={darkMode} onGreen={false} className={`mx-auto mb-4 ${compact ? "h-32 w-32 sm:h-36 sm:w-36" : "h-32 w-32 sm:h-40 sm:w-40"}`} />
    <p className="mb-2 text-lg font-extrabold sm:text-2xl">{title}</p>
    {text && <p className={`mb-6 max-w-md text-sm font-medium sm:text-base ${MUTED}`}>{text}</p>}
    {children}
  </div>
));

const ShopContent = ({ darkMode, addToCart }) => {
  const language = useAppLanguage();
  const t = useCallback((key, fallback) => getShopTranslation(language, key, fallback), [language]);
  const ot = useCallback((key) => getOfferTranslation(language, key), [language]);
  const { shopId } = useParams();
  const gid = useId().replace(/:/g, "");

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
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [reviewPage, setReviewPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [offerDetail, setOfferDetail] = useState(null);
  const [openChat, setOpenChat] = useState(false);
  const [open, setOpen] = useState({ price: true, cond: true, cat: true, more: true });
  const queryClientLocal = useQueryClient();
  const searchRef = useRef(null);

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
    setOnSaleOnly(false); setInStockOnly(false); setSavedOnly(false); setSortBy("relevance"); setVisibleCount(BATCH);
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

  const tabItems = useMemo(() => [
    { value: "all", label: t("all") },
    ...categoryOptions.slice(0, CATEGORY_CHIPS).map(({ name }) => ({ value: name, label: name })),
  ], [categoryOptions, t]);

  useEffect(() => { setVisibleCount(BATCH); }, [deferred]);
  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);
  const hasMore = visibleCount < filteredProducts.length;
  const loadMore = useCallback(() => startTransition(() => setVisibleCount((c) => c + BATCH)), []);

  const reviewPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
  const safeReviewPage = Math.min(reviewPage, reviewPages);
  const pagedReviews = useMemo(
    () => reviews.slice((safeReviewPage - 1) * REVIEWS_PER_PAGE, safeReviewPage * REVIEWS_PER_PAGE),
    [reviews, safeReviewPage]
  );

  const activeFiltersCount = (search ? 1 : 0) + conditions.length + (selectedCategory !== "all" ? 1 : 0) + (priceRange ? 1 : 0) + (onSaleOnly ? 1 : 0) + (inStockOnly ? 1 : 0) + (savedOnly ? 1 : 0);
  const browsing = activeFiltersCount === 0 && sortBy === "relevance";

  const scrollToProducts = useCallback(() => document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth", block: "start" }), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);
  const selectTab = useCallback((v) => {
    setSelectedCategory(v);
    if (v !== "all") scrollToProducts();
  }, [scrollToProducts]);
  const goToReviewPage = useCallback((pg) => {
    setReviewPage(pg);
    document.getElementById("shop-reviews-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const clearSearch = useCallback(() => { setSearch(""); searchRef.current?.focus(); }, []);

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

  if (shopLoading) return <PageSkeleton {...frameProps} label={t("loading")} />;

  if (!shop) return (
    <Frame {...frameProps}>
      <Defs3D />
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
          <OfferDefs gid={gid} />
          <Toaster darkMode={darkMode} />

          <ShopHeader
            shop={shop} logo={logo} darkMode={darkMode} title={shopTitle || t("shopFallback")} stats={stats}
            avgRating={avgRating} reviewCount={reviews.length} onViewProducts={scrollToProducts} onChat={handleOpenChat} t={t}
          />

          {shopOffers.length > 0 && (
            <Reveal as="section" id="shop-offers" aria-label={t("shopOffers")} className={`pg-lazy ${WRAP} pt-8 sm:pt-10`}>
              <HRail
                title={t("shopOffers")} subtitle={t("shopOffersSubtitle")} count={shopOffers.length}
                onViewAll={goToOffers} viewAllLabel={t("viewAllOffers")} itemCount={shopOffers.length} isRTL={isRTL} t={t}
              >
                {shopOffers.slice(0, OFFERS_SHOWN).map((o, i) => (
                  <div key={o.id} className="pg-rise flex w-[88%] flex-shrink-0 snap-start pb-2 pe-2 sm:w-[23rem]" style={STAGGER[i % 12]}>
                    <ShopOfferTicket offer={o} index={i} language={language} currency={currency} gid={gid} onOpen={openOfferDetail} ot={ot} t={t} />
                  </div>
                ))}
              </HRail>
            </Reveal>
          )}

          <section aria-label={t("allProducts")} className="mt-6">
            <div className="sticky top-[var(--shop-sticky-top,0px)] z-30 border-y border-[color:var(--line)] bg-[color:var(--bar)]">
              <div className={`${WRAP} space-y-3 py-3`}>
                <div className="flex items-center gap-3">
                  <div
                    role="search"
                    className="group/search relative flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-[color:var(--line2)] bg-[color:var(--fld)] ps-1.5 pe-3 shadow-sm shadow-black/5 transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:border-emerald-500/60 focus-within:border-emerald-500 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,.18)]"
                  >
                    <span aria-hidden="true" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-focus-within/search:scale-105 motion-reduce:transition-none">
                      <FiSearch className="h-4 w-4" />
                    </span>
                    <input
                      ref={searchRef} type="search" inputMode="search" autoComplete="off" spellCheck={false} value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("searchProducts")} aria-label={t("searchProducts")}
                      className="pg-search min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
                    />
                    {isStale && <span aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />}
                    {search && (
                      <button type="button" onClick={clearSearch} aria-label={t("clear")} className={`pg-pop flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-[color:var(--hov)] ${FOCUS}`}>
                        <FiX aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={openSidebar} aria-haspopup="dialog" aria-expanded={isSidebarOpen} className={`${BTN} ${BTN_ON} !h-12 flex-shrink-0 !px-4 sm:!px-5`}>
                    <FiSliders aria-hidden="true" className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("filters")}</span>
                    {activeFiltersCount > 0 && <span dir="ltr" className="tabular-nums">({activeFiltersCount})</span>}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Dropdown value={sortBy} onChange={setSortBy} options={sortOptions} ariaLabel={t("sortBy")} />
                  <div className="pg-nosb flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
                    <Tabs items={tabItems} value={selectedCategory} onChange={selectTab} ariaLabel={t("category")} isRTL={isRTL} />
                    <span aria-hidden="true" className="h-6 w-px flex-shrink-0 bg-[color:var(--line2)]" />
                    <Chip active={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} icon={FiTag}>{t("onSaleOnly")}</Chip>
                    <Chip active={inStockOnly} onClick={() => setInStockOnly((v) => !v)} icon={FiPackage}>{t("inStockOnly")}</Chip>
                    <Chip active={savedOnly} onClick={() => setSavedOnly((v) => !v)} icon={FiHeart}>{t("savedOnly")}</Chip>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${WRAP} pb-10 pt-6`}>
              {browsing && !productsLoading && categorySections.length > 0 && (
                <div className="mb-10 space-y-6 sm:space-y-8">
                  {categorySections.map(({ category, items }) => (
                    <CategorySlider key={category.id} category={category} items={items} darkMode={darkMode} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onDetails={openDetails} t={t} isRTL={isRTL} />
                  ))}
                </div>
              )}

              <div id="shop-products" className="scroll-mt-36">
                <SectionTitle title={t("allProducts")} subtitle={t("allProductsSubtitle")}>
                  <p className={`pb-1 text-sm font-medium ${MUTED}`} aria-live="polite">
                    <b dir="ltr" className="tabular-nums text-[color:var(--txt)]">{filteredProducts.length}</b> {t("productsFound")}
                  </p>
                </SectionTitle>

                {activeFiltersCount > 0 && (
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    {selectedCategory !== "all" && <Chip active onClick={() => setSelectedCategory("all")} onRemove>{selectedCategory}</Chip>}
                    {conditions.map((c) => <Chip key={c} active onClick={() => toggleCondition(c)} onRemove>{conditionLabel(t, c)}</Chip>)}
                    {priceRange && <Chip active onClick={() => setPriceRangeState(null)} onRemove>{`${money(priceValue[0], currency)} – ${money(priceValue[1], currency)}`}</Chip>}
                    {onSaleOnly && <Chip active onClick={() => setOnSaleOnly(false)} onRemove>{t("onSaleOnly")}</Chip>}
                    {inStockOnly && <Chip active onClick={() => setInStockOnly(false)} onRemove>{t("inStockOnly")}</Chip>}
                    {savedOnly && <Chip active onClick={() => setSavedOnly(false)} onRemove>{t("savedOnly")}</Chip>}
                    {search && <Chip active onClick={() => setSearch("")} onRemove>{`“${search.slice(0, 20)}”`}</Chip>}
                    <button type="button" onClick={clearFilters} className={`min-h-10 rounded-full px-3 text-sm font-extrabold transition-colors duration-200 hover:bg-[color:var(--hov)] ${ACC} ${FOCUS}`}>{t("clearAllFilters")}</button>
                  </div>
                )}

                <div aria-busy={isStale} className={`transition-opacity duration-300 ease-out motion-reduce:transition-none ${isStale ? "opacity-70" : "opacity-100"}`}>
                  {productsLoading ? (
                    <ProductGridSkeleton count={10} label={t("loading")} />
                  ) : filteredProducts.length > 0 ? (
                    <>
                      <div className={GRID}>
                        {visibleProducts.map((product, i) => (
                          <div key={product.id} className="pg-rise min-w-0" style={STAGGER[i % 12]}>
                            <ProductCard product={product} darkMode={darkMode} isSaved={saved.has(product.id)} onSave={toggleSaved} onAddToCart={handleAddToCart} onDetails={openDetails} t={t} />
                          </div>
                        ))}
                      </div>
                      <InfiniteSentinel hasMore={hasMore} shown={visibleCount} total={filteredProducts.length} onMore={loadMore} t={t} />
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

          <Reveal as="section" id="shop-reviews" aria-label={t("customerReviews")} className="pg-lazy pb-16 pt-4 sm:pb-24">
            <div className={WRAP}>
              <SectionTitle
                title={t("customerReviews")}
                subtitle={<><span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}{reviews.length > 0 && <> · {t("avgLabel")} <span dir="ltr">{avgRating}</span> ★</>}</>}
              />

              <div className="grid items-start gap-5 lg:grid-cols-[20rem_1fr] lg:gap-6 xl:grid-cols-[22rem_1fr]">
                <aside className={`p-5 sm:p-6 ${SURFACE}`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 lg:flex-col">
                      <RiStarFill className="h-12 w-12 text-amber-500 sm:h-16 sm:w-16" aria-hidden="true" />
                      <div>
                        <p className="text-3xl font-extrabold tabular-nums sm:text-4xl" dir="ltr">{avgRating} / 5</p>
                        <p className="text-sm font-extrabold">{reviews.length > 0 ? t("lovedByCustomers") : t("noReviewsYet")}</p>
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
                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[color:var(--line2)]">
                              <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none" style={{ width: `${pct}%` }} />
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

              <div id="shop-reviews-list" className="mt-8 scroll-mt-24">
                {reviewsLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true" aria-label={t("loading")}>
                    {Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pagedReviews.map((r, i) => (
                      <div key={r.id} className="pg-rise min-w-0" style={STAGGER[i % 12]}>
                        <ReviewCard review={r} mine={userId != null && String(r.userId) === String(userId)}
                          dateLocale={dateLocale} shopName={clean(shop?.name, 80)} t={t} onEdit={setEditingReview} onDelete={deleteReview} />
                      </div>
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
          </Reveal>

          <AnimatePresence>
            {isSidebarOpen && filterPanelProps && (
              <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t("filters")}>
                <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-[color:var(--overlay)]" onClick={closeSidebar} />
                <m.div {...drawerMotion(isRTL)} style={GPU}
                  className="absolute inset-y-0 start-0 flex w-[22rem] min-w-0 max-w-[90vw] transform-gpu flex-col border-e border-[color:var(--line)] bg-[color:var(--panel)] text-[color:var(--txt)] md:w-96">
                  <div className="flex items-center justify-between px-4 pb-2 pt-4">
                    <h3 className="text-base font-extrabold"><span className={ACC}>{t("filters")}</span></h3>
                    <button type="button" onClick={closeSidebar} aria-label={t("closeFilters")} className={`${ICON} ${ICON_OFF} h-11 w-11`}><FiX aria-hidden="true" className="h-5 w-5" /></button>
                  </div>
                  <div className="pg-sb min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pe-5"><FilterPanel {...filterPanelProps} /></div>
                  <div className="border-t border-[color:var(--line)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <button type="button" onClick={() => { closeSidebar(); scrollToProducts(); }} className={`${BTN} ${BTN_ON} w-full`}>{t("showProducts").replace("{count}", filteredProducts.length)}</button>
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>

          <div className="fixed bottom-5 end-4 z-40 flex flex-col gap-3 sm:end-6 lg:bottom-8 lg:end-8">
            {showTop && <button type="button" onClick={scrollToTop} aria-label={t("backToTop")} title={t("backToTop")} className={`pg-pop ${ICON} h-11 w-11 border border-[color:var(--line2)] bg-[color:var(--fld)] text-[color:var(--txt)] shadow-lg shadow-black/20 hover:bg-emerald-600 hover:!text-white`}><FiArrowUp aria-hidden="true" className="h-5 w-5" /></button>}
            <button type="button" onClick={handleOpenChat} onMouseEnter={prefetchChatModal} aria-label={t("chatWithShop")} title={t("chatWithShop")} className={`${ICON} h-12 w-12 bg-emerald-600 text-white shadow-lg shadow-black/30 hover:bg-emerald-500 sm:h-14 sm:w-14`}><FiMessageCircle aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" /></button>
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