import React, { useState, useEffect, useCallback, memo, useMemo, useTransition, Suspense } from "react";
import {
  FaTag, FaPercent, FaCalendarAlt, FaStore,
  FaShieldAlt, FaClock, FaCheckCircle, FaGift,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import api from "../api";
import { RiStarFill, RiTimeLine, RiStore2Line, RiShieldCheckLine, RiPriceTag2Line } from "react-icons/ri";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as FiIcons from "react-icons/fi";

const queryClient = new QueryClient();
const { FiChevronLeft, FiChevronRight, FiTag, FiX, FiExternalLink, FiClock: FiClockIcon } = FiIcons;

const WaveBottom = memo(({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-12 md:h-20" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));

const WaveTop = memo(({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-10 md:h-16" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));

const StatCard = memo(({ icon, value, label, accent, delay, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.45, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -4, scale: 1.02 }}
    className={`relative group overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border transition-all duration-300 ${
      darkMode ? "bg-gray-800/80 border-gray-700/60 backdrop-blur-md" : "bg-white/90 border-gray-100 backdrop-blur-md"
    }`}
  >
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
        {icon}
      </div>
      <span className="text-lg sm:text-2xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
    </div>
    <p className={`text-[10px] sm:text-xs font-semibold leading-snug pl-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
  </motion.div>
));

const LimeScrollStyle = memo(() => (
  <style>{`
    .lime-scroll::-webkit-scrollbar { width: 6px; }
    .lime-scroll::-webkit-scrollbar-track { background: transparent; }
    .lime-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#84cc16,#10b981); border-radius: 999px; }
    .lime-scroll { scrollbar-width: thin; scrollbar-color: #84cc16 transparent; }
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

  const discountFormatted = useMemo(() => formatDiscount(offer), [offer]);
  const dateRangeFormatted = useMemo(() => formatDateRange(offer.startDate, offer.endDate), [offer.startDate, offer.endDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.015 }}
      className={`group relative rounded-xl sm:rounded-2xl border-2 overflow-hidden transition-all duration-300 flex flex-col hover:shadow-2xl ${
        darkMode ? "bg-gray-800 border-gray-700 hover:border-lime-500/70" : "bg-white border-gray-200 hover:border-lime-400/70"
      }`}
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 flex-shrink-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-lime-500/0 via-lime-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.07 + 0.2, type: "spring", stiffness: 200 }} viewport={{ once: true }}
        className="absolute top-4 right-4 z-10">
        <div className={`flex flex-col items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shadow-xl ${
          isPercentage ? "bg-gradient-to-br from-orange-500 to-rose-500" : "bg-gradient-to-br from-lime-500 to-emerald-600"
        }`}>
          <span className="text-white text-sm sm:text-lg font-extrabold leading-none text-center">{discountFormatted}</span>
          <span className="text-white/80 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide">OFF</span>
        </div>
      </motion.div>

      <div className="p-4 sm:p-6 relative z-10 flex flex-col flex-1">
        <div className="pr-16 sm:pr-20 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
              isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            }`}>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
              {offer.status}
            </span>
            {remaining && (
              <motion.span animate={isUrgent ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                  isUrgent ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                    : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                }`}>
                <RiTimeLine className="w-3 h-3" />{remaining}
              </motion.span>
            )}
          </div>
          <h3 className={`text-base sm:text-xl font-extrabold leading-tight transition-colors group-hover:text-lime-600 dark:group-hover:text-lime-400 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {offer.name}
          </h3>
        </div>

        <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3 sm:mb-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {offer.description || "Limited time offer on selected services and products."}
        </p>

        <motion.div whileHover={{ scale: 1.01 }}
          className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-5 border ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPercentage ? "bg-orange-100 dark:bg-orange-900/30" : "bg-lime-100 dark:bg-lime-900/30"
          }`}>
            {isPercentage ? <FaPercent className="text-orange-500 text-sm sm:text-lg" /> : <FaTag className="text-lime-600 text-sm sm:text-lg" />}
          </div>
          <div>
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>You save</p>
            <p className={`text-lg sm:text-2xl font-extrabold ${isPercentage ? "text-orange-500" : "text-lime-600 dark:text-lime-400"}`}>
              {isPercentage ? `${offer.discountValue}% OFF` : `${offer.discountValue} EGP OFF`}
            </p>
          </div>
        </motion.div>

        <div className="space-y-2 mt-auto">
          <div className={`flex items-center gap-2 text-xs sm:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <FaCalendarAlt className="text-lime-500 text-[10px] sm:text-xs" />
            </div>
            <span className="text-[10px] sm:text-xs">{dateRangeFormatted}</span>
          </div>
          {offer.shopName && (
            <Link to={`/shops/${offer.shopId}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 group/link">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <FaStore className="text-lime-500 text-[10px] sm:text-xs" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-lime-600 dark:text-lime-400 group-hover/link:underline">{offer.shopName}</span>
            </Link>
          )}
        </div>
      </div>

      <div className={`px-4 sm:px-6 py-2.5 sm:py-3 border-t flex items-center justify-between flex-shrink-0 ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50/80"}`}>
        <span className={`text-[10px] sm:text-xs font-semibold ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          {isPercentage ? "Percentage discount" : "Fixed amount off"}
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onViewDetail(offer.id)}
            className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg bg-lime-500 hover:bg-lime-600 text-white transition-all shadow-sm">
            Details <FiChevronRight className="w-3 h-3" />
          </motion.button>
          <Link to={`/shops/${offer.shopId}`} onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">
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
      <DialogBackdrop className="fixed inset-0 bg-black/70 backdrop-blur-md" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <DialogPanel className={`relative w-full max-w-lg rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="h-1.5 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
          <div className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <DialogTitle className={`text-lg sm:text-xl font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <RiPriceTag2Line className="text-lime-500 text-xl" /> Offer Details
            </DialogTitle>
            <button onClick={onClose} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="lime-scroll max-h-[75vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : offer ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-hidden ${darkMode ? "bg-gray-800" : "bg-gradient-to-br from-lime-50 to-emerald-50"}`}>
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                          isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />{offer.status}
                        </span>
                        {remaining && (
                          <span className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                            isUrgent ? "bg-orange-100 text-orange-700" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                          }`}>
                            <FiClockIcon className="w-3 h-3" />{remaining}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-lg sm:text-2xl font-extrabold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>{offer.name}</h3>
                      {offer.description && <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{offer.description}</p>}
                    </div>
                    <div className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center shadow-xl ${
                      isPercentage ? "bg-gradient-to-br from-orange-500 to-rose-500" : "bg-gradient-to-br from-lime-500 to-emerald-600"
                    }`}>
                      <span className="text-white text-base sm:text-xl font-extrabold leading-none">{offer.discountValue}{isPercentage ? "%" : ""}</span>
                      <span className="text-white/80 text-[9px] sm:text-[10px] font-bold">OFF</span>
                      {!isPercentage && <span className="text-white/80 text-[8px] sm:text-[9px]">EGP</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {[
                    { label: "Discount Type", value: isPercentage ? "Percentage" : "Fixed Amount", icon: <FaPercent />, color: isPercentage ? "text-orange-500" : "text-lime-600 dark:text-lime-400" },
                    { label: "You Save", value: discountFormatted, icon: <FaTag />, color: "text-lime-600 dark:text-lime-400" },
                  ].map((item) => (
                    <div key={item.label} className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                      <div className={`flex items-center gap-1.5 sm:gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-0.5 sm:mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        <span className={item.color}>{item.icon}</span>{item.label}
                      </div>
                      <p className={`text-sm sm:text-lg font-extrabold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-lime-100"}`}>
                    <FaCalendarAlt className="text-lime-500 text-sm" />
                  </div>
                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Valid Period</p>
                    <p className={`text-xs sm:text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{dateRangeFormatted}</p>
                  </div>
                </div>

                {offer.shopName && (
                  <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-lime-100"}`}>
                        <FaStore className="text-lime-500 text-sm" />
                      </div>
                      <div>
                        <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Shop</p>
                        <p className={`text-xs sm:text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{offer.shopName}</p>
                      </div>
                    </div>
                    <Link to={`/shops/${offer.shopId}`} onClick={onClose}
                      className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-lime-500 hover:bg-lime-600 text-white transition-all shadow-sm">
                      Visit <FiExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                <div className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border-lime-500 ${darkMode ? "bg-lime-900/20" : "bg-lime-50"}`}>
                  <FaCheckCircle className="text-lime-500 flex-shrink-0 mt-0.5 text-base sm:text-lg" />
                  <p className={`text-xs sm:text-sm ${darkMode ? "text-lime-300" : "text-lime-800"}`}>
                    Applied automatically at checkout from <strong>{offer.shopName || "this shop"}</strong>. No code needed!
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="py-12 sm:py-16 text-center">
                <p className={`text-base sm:text-lg font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Offer not found</p>
              </div>
            )}
          </div>
          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t flex justify-end gap-2 sm:gap-3 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-sm transition-all ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Close
            </motion.button>
            {offer?.shopId && (
              <Link to={`/shops/${offer.shopId}`} onClick={onClose}>
                <motion.button whileTap={{ scale: 0.97 }}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-white font-bold text-sm transition-all shadow-md flex items-center gap-1.5 sm:gap-2">
                  <FaStore size={12} /> Visit Shop
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
  <div className={`rounded-xl sm:rounded-2xl border-2 overflow-hidden animate-pulse ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
    <div className="h-1.5 bg-gradient-to-r from-lime-300 to-emerald-300 opacity-40" />
    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1 pr-14 sm:pr-16">
          <div className={`h-3 sm:h-4 rounded-lg w-20 sm:w-24 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
          <div className={`h-5 sm:h-6 rounded-lg w-32 sm:w-40 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      </div>
      <div className={`h-3 sm:h-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      <div className={`h-3 sm:h-4 rounded-lg w-5/6 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
      <div className={`h-12 sm:h-16 rounded-lg sm:rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
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
      Swal.fire({ icon: "warning", title: "Please Log In", text: "Log in to see personalized offers", confirmButtonColor: "#84cc16" })
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

  const heroStats = useMemo(() => [
    { icon: <FaGift size={16} />, value: "50%", label: "Max discount available", accent: "#f97316", delay: 0.1 },
    { icon: <RiStore2Line size={16} />, value: "500+", label: "Participating shops", accent: "#6366f1", delay: 0.2 },
    { icon: <RiStarFill size={16} />, value: "Daily", label: "New offers added", accent: "#16a34a", delay: 0.3 },
  ], []);

  const features = useMemo(() => [
    { icon: <FaGift className="w-7 h-7 sm:w-9 sm:h-9" />, title: "Big Savings", desc: "Up to 50% off on repairs & devices", accent: "#f97316" },
    { icon: <RiShieldCheckLine className="w-7 h-7 sm:w-9 sm:h-9" />, title: "Trusted Shops", desc: "Verified partners with quality guarantee", accent: "#6366f1" },
    { icon: <FaClock className="w-7 h-7 sm:w-9 sm:h-9" />, title: "Limited Time", desc: "Exclusive deals available right now", accent: "#ef4444" },
    { icon: <FaCheckCircle className="w-7 h-7 sm:w-9 sm:h-9" />, title: "Easy Redemption", desc: "Apply instantly at checkout, no code needed", accent: "#16a34a" },
  ], []);

  const handlePrevPage = useCallback(() => startTransition(() => setCurrentPage((p) => Math.max(1, p - 1))), []);
  const handleNextPage = useCallback(() => startTransition(() => setCurrentPage((p) => Math.min(totalPages, p + 1))), [totalPages]);

  return (
    <div className={`min-h-screen overflow-x-hidden ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <LimeScrollStyle />

      <section className={`relative overflow-hidden pt-16 sm:pt-20 pb-24 sm:pb-32 md:pb-40 ${
        darkMode ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
          : "bg-gradient-to-br from-lime-50 via-white to-emerald-50"
      }`}>
        <div className="absolute w-72 h-72 sm:w-[500px] sm:h-[500px] -top-32 -left-20 rounded-full blur-3xl opacity-20 bg-lime-400 animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
        <div className="absolute w-56 h-56 sm:w-[400px] sm:h-[400px] top-10 -right-16 rounded-full blur-3xl opacity-15 bg-emerald-500 animate-pulse pointer-events-none" style={{ animationDuration: "7s" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,#000 39px,#000 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#000 39px,#000 40px)" }} />
        <WaveTop darkMode={darkMode} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-5 sm:space-y-8 text-center lg:text-left order-2 lg:order-1">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex mt-6 items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping flex-shrink-0" /> Limited time deals — grab them fast!
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08]">
                <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">Exclusive</span>
                <br /><span className={darkMode ? "text-white" : "text-gray-900"}>Offers Just</span>
                <br /><span style={{ WebkitTextStroke: darkMode ? "2px #84cc16" : "2px #16a34a", color: "transparent" }}>For You</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className={`text-base sm:text-lg lg:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Save big on repairs, accessories, and premium services at trusted shops near you.
              </motion.p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 pt-1">
                {heroStats.map((s) => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
              </div>
            </div>

            <div className="relative h-56 sm:h-80 lg:h-[520px] order-1 lg:order-2 hidden sm:block">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-125" />
              <div className="relative w-full h-full">
                <motion.div initial={{ opacity: 0, rotate: 8, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 5, scale: 1.04 }}
                  className={`absolute top-8 left-6 w-40 sm:w-52 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1.5 bg-gradient-to-r from-orange-400 to-rose-500" />
                  <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                    <div className={`h-3 rounded w-20 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-3 rounded w-28 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="h-8 sm:h-10 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-lg sm:rounded-xl w-20 sm:w-24 flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-extrabold">20% OFF</span>
                    </div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.07, y: -4 }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-36 sm:w-48 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1.5 bg-gradient-to-r from-lime-500 to-emerald-500" />
                  <div className="p-3 sm:p-5 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-2xl sm:rounded-3xl mx-auto mb-2 sm:mb-4 flex items-center justify-center shadow-xl p-3 sm:p-4">
                      <FaStore className="text-white text-xl sm:text-3xl" />
                    </div>
                    <span className="text-xs font-bold text-lime-500">Active Offer ✓</span>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 right-4 z-20 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl">
                  🎁 Up to 50% OFF
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <WaveBottom darkMode={darkMode} />
      </section>

      <section className={`py-12 sm:py-20 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className={`text-2xl sm:text-4xl font-extrabold text-center mb-2 sm:mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Why Choose Our Offers?
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className={`text-center text-sm sm:text-base mb-8 sm:mb-12 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Everything you need to save smart and shop confidently
          </motion.p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }} whileHover={{ y: -5, scale: 1.02 }}
                className={`relative group rounded-xl sm:rounded-2xl p-4 sm:p-7 border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${f.accent}, ${f.accent}88)` }} />
                <div className="text-center">
                  <div className="inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-3 sm:mb-5 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${f.accent}, ${f.accent}bb)` }}>{f.icon}</div>
                  <h3 className={`text-sm sm:text-xl font-extrabold mb-1 sm:mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>{f.title}</h3>
                  <p className={`text-[10px] sm:text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={`py-10 sm:py-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex items-center justify-between mb-7 sm:mb-10 flex-wrap gap-3 sm:gap-4">
            <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-wide relative inline-block ${darkMode ? "text-lime-400" : "text-lime-600"} after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-1 after:bg-gradient-to-r after:from-lime-600 after:to-emerald-500`}>
              Active Offers
            </h2>
            <motion.span key={offers.length} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold ${darkMode ? "bg-lime-900/30 text-lime-400" : "bg-lime-50 text-lime-600 border border-lime-200"}`}>
              {offers.length} offer{offers.length !== 1 ? "s" : ""} available
            </motion.span>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} darkMode={darkMode} />)}
            </div>
          ) : paginatedOffers.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedOffers.map((offer, index) => (
                  <OfferCard key={offer.id} offer={offer} index={index} darkMode={darkMode} onViewDetail={openDetail} />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 sm:py-32">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <FaTag className="text-3xl sm:text-4xl text-gray-400" />
              </div>
              <p className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>No active offers right now</p>
              <p className={`text-sm sm:text-base ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Check back soon — new deals are added daily!</p>
            </motion.div>
          )}
        </div>
      </section>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-3 py-8 sm:py-12 flex-wrap px-4 sm:px-6">
          <motion.button whileTap={{ scale: 0.96 }} onClick={handlePrevPage} disabled={currentPage === 1}
            className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all ${currentPage === 1 ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700" : darkMode ? "bg-gray-800 border-gray-700 text-white hover:border-lime-500" : "bg-white border-gray-200 text-gray-700 hover:border-lime-400"}`}>
            <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <motion.button key={page} whileTap={{ scale: 0.96 }} onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all duration-200 ${
                currentPage === page ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-white border-transparent shadow-lg scale-105"
                  : darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:border-lime-500 hover:text-lime-400" : "bg-white border-gray-200 text-gray-700 hover:border-lime-400 hover:text-lime-600"
              }`}>
              {page}
            </motion.button>
          ))}
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleNextPage} disabled={currentPage === totalPages}
            className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all ${currentPage === totalPages ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700" : darkMode ? "bg-gray-800 border-gray-700 text-white hover:border-lime-500" : "bg-white border-gray-200 text-gray-700 hover:border-lime-400"}`}>
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