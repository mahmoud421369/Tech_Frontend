import React, { useState, useEffect, useCallback, memo, useMemo, useTransition, Suspense } from "react";
import {
  FaTag, FaPercent, FaCalendarAlt, FaStore, FaCheckCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import api from "../api";
import { RiTimeLine, RiPriceTag2Line } from "react-icons/ri";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as FiIcons from "react-icons/fi";
import { Hero } from "../components";
const queryClient = new QueryClient();
const { FiChevronLeft, FiChevronRight, FiX, FiExternalLink, FiClock: FiClockIcon } = FiIcons;

const EASE = [0.16, 1, 0.3, 1];

const palette = (darkMode) => ({
  line: darkMode ? "#34d399" : "#059669",
  lineSoft: darkMode ? "#6ee7b7" : "#10b981",
  fillSoft: darkMode ? "rgba(52,211,153,0.14)" : "rgba(52,211,153,0.1)",
  fillCard: darkMode ? "#0b1a12" : "#ffffff",
  cardBorder: darkMode ? "rgba(52,211,153,0.25)" : "rgba(5,150,105,0.18)",
  accent: "#f59e0b",
});

const NoOffersIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle cx="100" cy="102" r="74" fill={c.fillSoft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.g
        animate={{ rotate: [-4, 4, -4] }}
        style={{ transformOrigin: "100px 100px" }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M68,50 L120,50 L150,86 L110,140 L68,140 Z" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
        <circle cx="86" cy="72" r="7" fill="none" stroke={c.cardBorder} strokeWidth="3" />
        <path d="M78,120 L128,70" stroke={c.cardBorder} strokeWidth="4" strokeLinecap="round" />
      </motion.g>
      <motion.g
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="100" cy="100" r="30" fill="none" stroke={c.line} strokeWidth="2" strokeDasharray="3 7" />
      </motion.g>
      <text x="100" y="108" textAnchor="middle" fontSize="15" fontWeight="700" fill={c.line}>soon</text>
    </svg>
  );
});

const OfferTicketIllustration = memo(({ darkMode, isPercentage }) => {
  const c = palette(darkMode);
  const stub = isPercentage ? "#f97316" : "#059669";
  return (
    <svg viewBox="0 0 96 96" className="w-full h-full">
      <circle cx="48" cy="48" r="44" fill={c.fillSoft} />
      <g transform="translate(48 48) rotate(-8) translate(-30 -22)">
        <path d="M4 4 H56 C58 4 60 6 60 8 V14 C57.5 14 55.5 16.4 55.5 19 C55.5 21.6 57.5 24 60 24 V30 C60 32 58 34 56 34 H4 C2 34 0 32 0 30 V24 C2.5 24 4.5 21.6 4.5 19 C4.5 16.4 2.5 14 0 14 V8 C0 6 2 4 4 4 Z"
          fill="white" stroke={c.cardBorder} strokeWidth="2" />
        <line x1="40" y1="8" x2="40" y2="30" stroke={c.cardBorder} strokeWidth="1.5" strokeDasharray="2 3" />
        {isPercentage ? (
          <>
            <circle cx="15" cy="13" r="3.4" fill="none" stroke={stub} strokeWidth="2.2" />
            <circle cx="25" cy="25" r="3.4" fill="none" stroke={stub} strokeWidth="2.2" />
            <line x1="26" y1="12" x2="14" y2="26" stroke={stub} strokeWidth="2.2" strokeLinecap="round" />
          </>
        ) : (
          <text x="20" y="24" fontSize="16" fontWeight="800" fill={stub}>£</text>
        )}
      </g>
      <circle cx="76" cy="22" r="4" fill="#fbbf24" />
      <circle cx="18" cy="76" r="3" fill={stub} opacity="0.5" />
    </svg>
  );
});

const EmeraldScrollStyle = memo(() => (
  <style>{`
    .emerald-scroll::-webkit-scrollbar { width: 6px; }
    .emerald-scroll::-webkit-scrollbar-track { background: transparent; }
    .emerald-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#10b981,#0d9488); border-radius: 999px; }
    .emerald-scroll { scrollbar-width: thin; scrollbar-color: #10b981 transparent; }
  `}</style>
));

const daysLeft = (endDate) => {
  const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return "Last day!";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
};

const formatDiscount = (offer) =>
  offer.discountType === "PERCENTAGE" ? `${offer.discountValue}%` : `${offer.discountValue} EGP`;

const formatDateRange = (s, e) =>
  `${new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — ${new Date(e).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

const OfferCard = memo(({ offer, index, darkMode, onViewDetail }) => {
  const isPercentage = useMemo(() => offer.discountType === "PERCENTAGE", [offer.discountType]);
  const isActive = useMemo(() => offer.status === "ACTIVE", [offer.status]);
  const remaining = useMemo(() => daysLeft(offer.endDate), [offer.endDate]);
  const isUrgent = useMemo(() => remaining && parseInt(remaining) <= 3, [remaining]);
  const dateRangeFormatted = useMemo(() => formatDateRange(offer.startDate, offer.endDate), [offer.startDate, offer.endDate]);

  const notchBg = darkMode ? "bg-gray-900" : "bg-emerald-50/30";
  const stubGradient = isPercentage
    ? "bg-gradient-to-br from-orange-500 to-rose-500"
    : "bg-gradient-to-br from-emerald-500 to-teal-600";
  const glow = isPercentage ? "hover:shadow-orange-500/15" : "hover:shadow-emerald-500/15";

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: EASE }}
      whileHover={{ y: -5, transition: { duration: 0.15, ease: EASE } }}
      className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-shadow duration-300 hover:shadow-xl ${glow} ${
        darkMode ? "bg-gray-800 border-gray-700/80" : "bg-white border-emerald-100"
      }`}
    >
      <div className="relative grid grid-cols-[84px_1fr] sm:grid-cols-[100px_1fr] flex-1">
        <div className={`relative flex flex-col items-center justify-center gap-0.5 py-5 px-2 text-white text-center ${stubGradient}`}>
          <span className="text-xl sm:text-2xl font-extrabold leading-none">
            {offer.discountValue}{isPercentage ? "%" : ""}
          </span>
          {!isPercentage && <span className="text-[9px] font-bold opacity-80 tracking-wide">EGP</span>}
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-85 mt-0.5">Off</span>

          <span className={`absolute -top-2.5 right-0 translate-x-1/2 w-5 h-5 rounded-full ${notchBg}`} />
          <span className={`absolute -bottom-2.5 right-0 translate-x-1/2 w-5 h-5 rounded-full ${notchBg}`} />
        </div>

        <div className={`pointer-events-none absolute top-3 bottom-3 left-[84px] sm:left-[100px] border-l-2 border-dashed ${darkMode ? "border-gray-600" : "border-gray-300"}`} />

        <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            }`}>
              <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
              {offer.status}
            </span>
            {remaining && (
              <motion.span animate={isUrgent ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.8, repeat: Infinity }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isUrgent ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                    : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                }`}>
                <RiTimeLine className="w-3 h-3" />{remaining}
              </motion.span>
            )}
          </div>

          <h3 className={`text-base sm:text-lg font-extrabold leading-tight mb-1 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {offer.name}
          </h3>

          <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {offer.description || "Limited time offer on selected services and products."}
          </p>

          <div className={`space-y-1.5 mt-auto text-xs sm:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-emerald-500 text-[11px] flex-shrink-0" />
              <span>{dateRangeFormatted}</span>
            </div>
            {offer.shopName && (
              <Link to={`/shops/${offer.shopId}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 group/link w-fit">
                <FaStore className="text-emerald-500 text-[11px] flex-shrink-0" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 group-hover/link:underline">{offer.shopName}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={`px-4 sm:px-5 py-2.5 border-t flex items-center justify-between flex-shrink-0 ${darkMode ? "border-gray-700 bg-gray-800/60" : "border-emerald-50 bg-emerald-50/40"}`}>
        <span className={`text-[10px] sm:text-xs font-semibold ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          {isPercentage ? "Percentage discount" : ""}
        </span>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }} transition={{ duration: 0.12 }}
            onClick={() => onViewDetail(offer.id)}
            className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors duration-150 shadow-sm"
          >
            Details <FiChevronRight className="w-3 h-3" />
          </motion.button>
          <Link to={`/shops/${offer.shopId}`} onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150">
            Shop <FiExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

const OfferDetailModal = memo(({ open, onClose, offerId, token, darkMode }) => {
  const { data: offer, isLoading: loading } = useQuery({
    queryKey: ['offerDetail', offerId],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/users/offers/${offerId}`, { headers: { Authorization: `Bearer ${token}` } });
        return res.data;
      } catch (err) {
        Swal.fire({ icon: "error", title: "Failed to load offer", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
        throw err;
      }
    },
    enabled: open && !!offerId && !!token,
  });

  const isPercentage = useMemo(() => offer?.discountType === "PERCENTAGE", [offer]);
  const isActive = useMemo(() => offer?.status === "ACTIVE", [offer]);
  const remaining = useMemo(() => offer ? daysLeft(offer.endDate) : null, [offer]);
  const isUrgent = useMemo(() => remaining && parseInt(remaining) <= 3, [remaining]);

  const discountFormatted = useMemo(() => offer ? formatDiscount(offer) : "", [offer]);
  const dateRangeFormatted = useMemo(() => offer ? formatDateRange(offer.startDate, offer.endDate) : "", [offer]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-black/70 backdrop-blur-md duration-150 data-closed:opacity-0" />
      <div className="fixed inset-0 flex items-center justify-center p-3 overflow-y-auto">
        <DialogPanel transition
          className={`relative w-full max-w-sm sm:max-w-md rounded-md sm:rounded-md shadow-2xl overflow-hidden border duration-150 data-closed:opacity-0 data-closed:scale-95 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-emerald-100"}`}
        >
         
          <div className={`flex items-center justify-between px-4 py-2.5 sm:py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <DialogTitle className={`text-sm sm:text-base font-extrabold flex items-center gap-1.5 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <RiPriceTag2Line className="text-emerald-500 text-lg" /> Offer Details
            </DialogTitle>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
              <FiX className="w-4 h-4" />
            </button>
          </div>
          <div className="emerald-scroll max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : offer ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }}
                className="p-3.5 sm:p-4 space-y-3">
                <div className={`relative rounded-xl p-3.5 sm:p-4 overflow-hidden ${darkMode ? "bg-gray-800" : "bg-gradient-to-br from-emerald-50 to-teal-50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0">
                      <OfferTicketIllustration darkMode={darkMode} isPercentage={isPercentage} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />{offer.status}
                        </span>
                        {remaining && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isUrgent ? "bg-orange-100 text-orange-700" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                          }`}>
                            <FiClockIcon className="w-2.5 h-2.5" />{remaining}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base sm:text-lg font-extrabold leading-snug ${darkMode ? "text-white" : "text-gray-900"}`}>{offer.name}</h3>
                      {offer.description && <p className={`text-[11px] sm:text-xs leading-relaxed mt-0.5 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{offer.description}</p>}
                    </div>
                    <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center shadow-lg ${
                      isPercentage ? "bg-gradient-to-br from-orange-500 to-rose-500" : "bg-gradient-to-br from-emerald-500 to-teal-600"
                    }`}>
                      <span className="text-white text-xs sm:text-sm font-extrabold leading-none">{offer.discountValue}{isPercentage ? "%" : ""}</span>
                      <span className="text-white/80 text-[7px] sm:text-[8px] font-bold">OFF</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: "You Save", value: discountFormatted, icon: <FaTag />, color: "text-emerald-600 dark:text-emerald-400" },
                  ].map((item) => (
                    <div key={item.label} className={`p-2.5 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                      <div className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide mb-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        <span className={item.color}>{item.icon}</span>{item.label}
                      </div>
                      <p className={`text-sm font-extrabold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-emerald-100"}`}>
                    <FaCalendarAlt className="text-emerald-500 text-xs" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[9px] font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Valid Period</p>
                    <p className={`text-xs font-bold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{dateRangeFormatted}</p>
                  </div>
                </div>

                {offer.shopName && (
                  <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-emerald-100"}`}>
                        <FaStore className="text-emerald-500 text-xs" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[9px] font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Shop</p>
                        <p className={`text-xs font-bold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{offer.shopName}</p>
                      </div>
                    </div>
                    <Link to={`/shops/${offer.shopId}`} onClick={onClose}
                      className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm flex-shrink-0">
                      Visit <FiExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                )}

                
              </motion.div>
            ) : (
              <div className="py-10 text-center">
                <p className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Offer not found</p>
              </div>
            )}
          </div>
          <div className={`px-4 py-2.5 sm:py-3 border-t flex justify-end gap-2 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <motion.button whileTap={{ scale: 0.97 }} transition={{ duration: 0.12 }} onClick={onClose}
              className={`px-3.5 py-1.5 sm:py-2 rounded-lg font-bold text-xs transition-all ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Close
            </motion.button>
            {offer?.shopId && (
              <Link to={`/shops/${offer.shopId}`} onClick={onClose}>
                <motion.button whileTap={{ scale: 0.97 }} transition={{ duration: 0.12 }}
                  className="px-3.5 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5">
                  <FaStore size={11} /> Visit Shop
                </motion.button>
              </Link>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
});

const SkeletonCard = memo(({ darkMode }) => (
  <div className={`flex rounded-2xl border overflow-hidden animate-pulse ${darkMode ? "bg-gray-800 border-gray-700/80" : "bg-white border-emerald-100"}`}>
    <div className={`w-[84px] sm:w-[100px] flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-emerald-50"}`} />
    <div className="flex-1 p-4 sm:p-5 space-y-3">
      <div className={`h-3 rounded-full w-16 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      <div className={`h-5 rounded-lg w-3/4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      <div className={`h-3 rounded-lg w-full ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      <div className={`h-3 rounded-lg w-5/6 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      <div className={`h-3 rounded-lg w-1/2 mt-3 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
    </div>
  </div>
));

const MOCK_OFFER = {
  id: "0199b7de-ded5-7fea-964d-616ca9af5d3c", name: "Offer 6",
  description: "The sixth offer", discountType: "FIXED_VALUE", discountValue: 200,
  startDate: "2025-10-05T21:00:00", endDate: "2026-10-30T22:00:00", status: "ACTIVE",
  shopId: "01998efa-6127-7218-bcd3-f701a640df92", shopName: "Star",
};

const OffersContent = ({ darkMode }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);
  const [detailOfferId, setDetailOfferId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const token = localStorage.getItem("authToken");

  useEffect(() => { document.title = "Exclusive Offers | Tech-Restore"; }, []);

  useEffect(() => {
    if (!token) {
      Swal.fire({ icon: "warning", title: "Please Log In", text: "Log in to see personalized offers", confirmButtonColor: "#10b981" })
        .then(() => { window.location.href = "/login"; });
    }
  }, [token]);

  const { data: offers = [MOCK_OFFER], isLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      try {
        const res = await api.get("/api/users/offers", { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data.content || res.data || [];
        return data.length > 0 ? data : [MOCK_OFFER];
      } catch {
        return [MOCK_OFFER];
      }
    },
    enabled: !!token,
  });

  const openDetail = useCallback((id) => { setDetailOfferId(id); setIsDetailOpen(true); }, []);
  const closeDetail = useCallback(() => { setIsDetailOpen(false); setDetailOfferId(null); }, []);

  const totalPages = useMemo(() => Math.ceil(offers.length / pageSize), [offers.length, pageSize]);
  const paginatedOffers = useMemo(() => offers.slice((currentPage - 1) * pageSize, currentPage * pageSize), [offers, currentPage, pageSize]);

  const handlePrevPage = useCallback(() => startTransition(() => setCurrentPage((p) => Math.max(1, p - 1))), []);
  const handleNextPage = useCallback(() => startTransition(() => setCurrentPage((p) => Math.min(totalPages, p + 1))), [totalPages]);

  return (
    <div className={`min-h-screen overflow-x-hidden ${darkMode ? "bg-gray-900" : "bg-emerald-50/30"}`}>
      <EmeraldScrollStyle />

      <Hero variant="offers" darkMode={darkMode} />

      <section className={`py-10 sm:py-16 ${darkMode ? "bg-gray-900" : "bg-emerald-50/30"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-center justify-between mb-7 sm:mb-10 flex-wrap gap-3 sm:gap-4">
            <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight relative inline-block ${darkMode ? "text-emerald-400" : "text-emerald-800"} after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-12 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-emerald-600 after:to-teal-400`}>
              Active Offers
            </h2>
            <motion.span key={offers.length} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2, ease: EASE }}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold ${darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
              {offers.length} offer{offers.length !== 1 ? "s" : ""} available
            </motion.span>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} darkMode={darkMode} />)}
            </div>
          ) : paginatedOffers.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: EASE }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedOffers.map((offer, index) => (
                  <OfferCard key={offer.id} offer={offer} index={index} darkMode={darkMode} onViewDetail={openDetail} />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: EASE }} className="text-center py-16 sm:py-24">
              <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-2">
                <NoOffersIllustration darkMode={darkMode} />
              </div>
              <p className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>No active offers right now</p>
              <p className={`text-sm sm:text-base ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Check back soon — new deals are added daily!</p>
            </motion.div>
          )}
        </div>
      </section>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-3 py-8 sm:py-12 flex-wrap px-4 sm:px-6">
          <motion.button whileTap={{ scale: 0.96 }} transition={{ duration: 0.12 }} onClick={handlePrevPage} disabled={currentPage === 1}
            className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-150 ${currentPage === 1 ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700" : darkMode ? "bg-gray-800 border-gray-700 text-white hover:border-emerald-500" : "bg-white border-emerald-100 text-gray-700 hover:border-emerald-400"}`}>
            <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <motion.button key={page} whileTap={{ scale: 0.96 }} transition={{ duration: 0.12 }} onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all duration-150 ${
                currentPage === page ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg scale-105"
                  : darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-400" : "bg-white border-emerald-100 text-gray-700 hover:border-emerald-400 hover:text-emerald-600"
              }`}>
              {page}
            </motion.button>
          ))}
          <motion.button whileTap={{ scale: 0.96 }} transition={{ duration: 0.12 }} onClick={handleNextPage} disabled={currentPage === totalPages}
            className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-150 ${currentPage === totalPages ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700" : darkMode ? "bg-gray-800 border-gray-700 text-white hover:border-emerald-500" : "bg-white border-emerald-100 text-gray-700 hover:border-emerald-400"}`}>
            <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      )}

      <OfferDetailModal open={isDetailOpen} onClose={closeDetail}
        offerId={detailOfferId} token={token} darkMode={darkMode} />
    </div>
  );
};

const Offers = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <OffersContent {...props} />
  </QueryClientProvider>
));

export default Offers;