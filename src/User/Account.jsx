import React, { useState, useEffect, useCallback, memo, useMemo, useTransition, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Swal from "sweetalert2";
import {
  FiUser, FiMapPin, FiBox, FiTool, FiEdit2, FiTrash2,
  FiX, FiMail, FiPhone, FiPlus, FiInfo, FiCalendar,
  FiDollarSign, FiHome, FiChevronLeft, FiChevronRight,
  FiXCircle, FiUsers, FiZap, FiCheckCircle,
  FiCreditCard, FiTruck, FiCheck, FiShield, FiEdit,
  FiMapPin as FiLocation,
  FiNavigation,
  FiList,
  FiBell,
  FiDownload,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiClock,
  FiArrowRight,
  FiExternalLink,
  FiCrosshair,
  FiLoader,
  FiPieChart,
  FiTrendingUp,
  FiTarget,
  FiSend,
  FiAward,
  FiCompass,
} from "react-icons/fi";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { RiLogoutBoxRLine, RiVerifiedBadgeLine, RiStarFill } from "react-icons/ri";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import Hero from "../components/Hero";

const queryClient = new QueryClient();

const isEmptyVal = (val) => {
  if (val === null || val === undefined) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  if (typeof val === "number" && val === 0) return true;
  return false;
};

const isEmptyCoord = (val) => val === null || val === undefined || val === 0;

const toDateOnlyString = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  * {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }
  *::-webkit-scrollbar { width: 5px; height: 5px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  *::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

  .lime-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .lime-scroll::-webkit-scrollbar-track { background: transparent; }
  .lime-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  .lime-scroll { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
  .tabs-scroll::-webkit-scrollbar { display: none; }
  .tabs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  .leaflet-container { font-family: inherit; }
  .pin-pulse { animation: pinpulse 1.8s ease-out infinite; }
  @keyframes pinpulse {
    0% { transform: scale(0.6); opacity: 0.55; }
    70% { transform: scale(2.1); opacity: 0; }
    100% { transform: scale(2.1); opacity: 0; }
  }
`;

const LEAFLET_CSS = `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const ORDER_STEPS = ["PENDING","CONFIRMED","PROCESSING","FINISHPROCESSING","SHIPPED","DELIVERED"];
const REPAIR_STEPS = ["SUBMITTED","QUOTE_SENT","QUOTE_APPROVED","DEVICE_COLLECTED","REPAIRING","REPAIR_COMPLETED","DEVICE_DELIVERED"];

const getOrderProgress = (status) => {
  if (status === "CANCELLED") return -1;
  const idx = ORDER_STEPS.indexOf(status);
  return idx === -1 ? 0 : Math.round((idx / (ORDER_STEPS.length - 1)) * 100);
};

const getRepairProgress = (status) => {
  if (status === "CANCELLED" || status === "FAILED" || status === "QUOTE_REJECTED") return -1;
  const idx = REPAIR_STEPS.indexOf(status);
  return idx === -1 ? 0 : Math.round((idx / (REPAIR_STEPS.length - 1)) * 100);
};

const ProgressBar = memo(({ progress, status, darkMode }) => {
  if (progress === -1) return (
    <div className="mt-2.5 mb-1">
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${darkMode ? "bg-red-950/40" : "bg-red-100"}`}>
        <div className="h-full w-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" />
      </div>
      <p className="text-[10px] text-red-500 font-bold mt-1.5 uppercase tracking-wide">{status?.replace(/_/g, " ")}</p>
    </div>
  );
  return (
    <div className="mt-2.5 mb-1">
      <div className="flex justify-between items-center mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wide ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{status?.replace(/_/g," ")}</span>
        <span className={`text-[10px] font-bold ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{progress}%</span>
      </div>
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
        />
      </div>
    </div>
  );
});

const LoadingSpinner = memo(({ darkMode }) => (
  <div className="flex justify-center items-center py-16">
    <div className={`w-10 h-10 border-[3px] ${darkMode ? "border-emerald-400" : "border-emerald-500"} border-t-transparent rounded-full animate-spin`} />
  </div>
));

const StatusBadge = memo(({ status, type = "order", darkMode }) => {
  const orderMapLight = { DELIVERED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-700", CONFIRMED: "bg-blue-100 text-blue-700", SHIPPED: "bg-purple-100 text-purple-700", PROCESSING: "bg-cyan-100 text-cyan-700", FINISHPROCESSING: "bg-teal-100 text-teal-700" };
  const orderMapDark = { DELIVERED: "bg-emerald-500/15 text-emerald-300", CANCELLED: "bg-red-500/15 text-red-300", CONFIRMED: "bg-blue-500/15 text-blue-300", SHIPPED: "bg-purple-500/15 text-purple-300", PROCESSING: "bg-cyan-500/15 text-cyan-300", FINISHPROCESSING: "bg-teal-500/15 text-teal-300" };
  const repairMapLight = { DEVICE_DELIVERED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-700", FAILED: "bg-red-100 text-red-700", QUOTE_APPROVED: "bg-emerald-100 text-emerald-700", QUOTE_SENT: "bg-purple-100 text-purple-700", QUOTE_REJECTED: "bg-red-100 text-red-700", REPAIRING: "bg-cyan-100 text-cyan-700", REPAIR_COMPLETED: "bg-teal-100 text-teal-700", DEVICE_COLLECTED: "bg-blue-100 text-blue-700" };
  const repairMapDark = { DEVICE_DELIVERED: "bg-emerald-500/15 text-emerald-300", CANCELLED: "bg-red-500/15 text-red-300", FAILED: "bg-red-500/15 text-red-300", QUOTE_APPROVED: "bg-emerald-500/15 text-emerald-300", QUOTE_SENT: "bg-purple-500/15 text-purple-300", QUOTE_REJECTED: "bg-red-500/15 text-red-300", REPAIRING: "bg-cyan-500/15 text-cyan-300", REPAIR_COMPLETED: "bg-teal-500/15 text-teal-300", DEVICE_COLLECTED: "bg-blue-500/15 text-blue-300" };
  const map = darkMode
    ? (type === "repair" ? repairMapDark : orderMapDark)
    : (type === "repair" ? repairMapLight : orderMapLight);
  const fallback = darkMode ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700";
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${map[status] || fallback}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
});

const Pagination = memo(({ page, total, setPage, darkMode }) => {
  if (total <= 1) return null;
  return (
    <div className="flex justify-center mt-8 gap-1.5 flex-wrap">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
        className={`p-2 rounded-xl border transition-all ${page === 1 ? "opacity-40 cursor-not-allowed" : darkMode ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
        <FiChevronLeft size={14} />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => setPage(p)}
          className={`w-9 h-9 rounded-xl font-bold text-sm transition-all border ${
            page === p ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/20"
              : darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-emerald-900/30" : "bg-white border-gray-200 text-gray-700 hover:bg-emerald-50"
          }`}>{p}</button>
      ))}
      <button onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page === total}
        className={`p-2 rounded-xl border transition-all ${page === total ? "opacity-40 cursor-not-allowed" : darkMode ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
        <FiChevronRight size={14} />
      </button>
    </div>
  );
});

const FilterBar = memo(({ statusOptions, statusFilter, setStatusFilter, dateFilter, setDateFilter, search, setSearch, darkMode }) => {
  const inputCls = `px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${
    darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-emerald-400"
      : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-emerald-500"
  }`;
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <div className="relative flex-1 min-w-[160px]">
        <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-500" : "text-gray-400"}`} size={13} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className={`${inputCls} pl-8 w-full`} />
      </div>
      <div className="relative">
        <FiFilter className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-500" : "text-gray-400"}`} size={11} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} pl-8 pr-8 appearance-none cursor-pointer`}>
          <option value="">All</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <FiChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? "text-gray-500" : "text-gray-400"}`} size={11} />
      </div>
      <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={inputCls} />
      {(statusFilter || dateFilter || search) && (
        <button onClick={() => { setStatusFilter(""); setDateFilter(""); setSearch(""); }}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            darkMode ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20" : "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
          }`}>
          <FiX size={11} /> Clear
        </button>
      )}
    </div>
  );
});

const EmptyState = memo(({ illustration, title, subtitle, darkMode }) => (
  <div className={`text-center py-14 rounded-2xl border ${darkMode ? "bg-gray-800/60 border-gray-700" : "bg-white border-gray-200"}`}>
    <div className="mx-auto mb-4 w-40 h-40">{illustration}</div>
    <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{title}</p>
    {subtitle && <p className={`text-sm mt-1 max-w-xs mx-auto ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{subtitle}</p>}
  </div>
));

const IllustrationBox = memo(({ darkMode }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="90" fill={darkMode ? "#052e21" : "#ecfdf5"} />
    <rect x="55" y="80" width="90" height="65" rx="8" fill="#10b981" opacity="0.15" />
    <rect x="55" y="80" width="90" height="24" rx="8" fill="#10b981" />
    <path d="M55 100 L100 60 L145 100" fill="none" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="100" cy="115" r="9" fill={darkMode ? "#0b1a12" : "#ffffff"} stroke="#10b981" strokeWidth="3" />
  </svg>
));

const IllustrationPin = memo(({ darkMode }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="90" fill={darkMode ? "#052e21" : "#ecfdf5"} />
    <ellipse cx="100" cy="155" rx="34" ry="8" fill="#10b981" opacity="0.15" />
    <path d="M100 45c-24 0-42 18-42 42 0 32 42 68 42 68s42-36 42-68c0-24-18-42-42-42z" fill="#10b981" />
    <circle cx="100" cy="87" r="16" fill={darkMode ? "#0b1a12" : "#ffffff"} />
  </svg>
));

const IllustrationTool = memo(({ darkMode }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="90" fill={darkMode ? "#052e21" : "#ecfdf5"} />
    <rect x="70" y="55" width="60" height="90" rx="10" fill={darkMode ? "#0b1a12" : "#ffffff"} stroke="#10b981" strokeWidth="4" />
    <rect x="82" y="70" width="36" height="6" rx="3" fill="#10b981" />
    <rect x="82" y="84" width="24" height="6" rx="3" fill="#a7f3d0" />
    <path d="M120 120 l16 16 m0 -16 l-16 16" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" />
  </svg>
));

const IllustrationBell = memo(({ darkMode }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="90" fill={darkMode ? "#052e21" : "#ecfdf5"} />
    <path d="M100 55c-18 0-28 14-28 32v20l-10 16h76l-10-16V87c0-18-10-32-28-32z" fill="#10b981" />
    <circle cx="100" cy="50" r="7" fill="#0d9488" />
    <path d="M88 132a12 12 0 0024 0" fill="none" stroke="#0d9488" strokeWidth="5" strokeLinecap="round" />
  </svg>
));

const IllustrationHeart = memo(({ darkMode }) => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="90" fill={darkMode ? "#052e21" : "#ecfdf5"} />
    <path d="M100 145s-40-24-40-54c0-16 13-27 28-27 8 0 15 4 20 12 5-8 12-12 20-12 15 0 28 11 28 27 0 30-40 54-40 54z" fill="#10b981" />
  </svg>
));

const generateInvoicePDF = async (order) => {
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  const loadPoppinsFont = async () => {
    try {
      const fontUrl = "https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2";
      const resp = await fetch(fontUrl);
      const buf = await resp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      doc.addFileToVFS("Poppins-Regular.woff2", base64);
      doc.addFont("Poppins-Regular.woff2", "Poppins", "normal");

      const boldUrl = "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2";
      const respB = await fetch(boldUrl);
      const bufB = await respB.arrayBuffer();
      const base64B = btoa(String.fromCharCode(...new Uint8Array(bufB)));
      doc.addFileToVFS("Poppins-Bold.woff2", base64B);
      doc.addFont("Poppins-Bold.woff2", "Poppins", "bold");
      return true;
    } catch {
      return false;
    }
  };

  const poppinsLoaded = await loadPoppinsFont();
  const fontFamily = poppinsLoaded ? "Poppins" : "helvetica";

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(fontFamily, "bold");
  doc.text("TECH-RESTORE", 14, 12);
  doc.setFontSize(10);
  doc.setFont(fontFamily, "normal");
  doc.text("Order Invoice", 14, 20);
  doc.setTextColor(255, 255, 255);
  doc.text(`#${order.id?.slice(0, 8).toUpperCase()}`, pageW - 14, 20, { align: "right" });

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  let y = 40;
  doc.setFont(fontFamily, "bold");
  doc.text("Invoice Details", 14, y);
  doc.setFont(fontFamily, "normal");
  y += 8;
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-EG", { year: "numeric", month: "long", day: "numeric" })}`, 14, y);
  y += 6;
  doc.text(`Status: ${order.status?.replace(/_/g, " ")}`, 14, y);
  y += 6;
  doc.text(`Payment: ${order.paymentMethod?.replace(/_/g, " ")}`, 14, y);

  y += 14;
  doc.setFillColor(236, 253, 245);
  doc.rect(14, y - 5, pageW - 28, 9, "F");
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(9);
  doc.text("Item", 16, y);
  doc.text("Shop", 85, y);
  doc.text("Qty", 132, y);
  doc.text("Unit Price", 148, y);
  doc.text("Total", pageW - 14, y, { align: "right" });

  doc.setFont(fontFamily, "normal");
  y += 8;
  (order.orderItems || []).forEach((item, i) => {
    if (i % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(14, y - 5, pageW - 28, 8, "F"); }
    doc.setFontSize(8);
    doc.text(String(item.productName || "—").slice(0, 28), 16, y);
    doc.text(String(item.shopName || "—").slice(0, 16), 85, y);
    doc.text(String(item.quantity || "—"), 132, y);
    doc.text(`${Number(item.priceAtCheckout || 0).toFixed(2)} EGP`, 148, y);
    doc.text(`${(Number(item.priceAtCheckout) * Number(item.quantity)).toFixed(2)} EGP`, pageW - 14, y, { align: "right" });
    y += 8;
  });

  y += 4;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 6;
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(`Grand Total: ${order.totalPrice} EGP`, pageW - 14, y, { align: "right" });

  doc.setTextColor(150, 150, 150);
  doc.setFont(fontFamily, "normal");
  doc.setFontSize(8);
  doc.text("Thank you for choosing Tech-Restore!", pageW / 2, 285, { align: "center" });

  doc.save(`Invoice_${order.id?.slice(0, 8).toUpperCase()}.pdf`);
};

const useLeaflet = () => {
  const [leafletReady, setLeafletReady] = useState(typeof window !== "undefined" && !!window.L);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.L) { setLeafletReady(true); return; }
    const existingLink = document.querySelector(`link[href="${LEAFLET_CSS}"]`);
    if (!existingLink) {
      const link = document.createElement("link"); link.rel = "stylesheet"; link.href = LEAFLET_CSS; document.head.appendChild(link);
    }
    const existingScript = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existingScript) { existingScript.addEventListener("load", () => setLeafletReady(true)); return; }
    const script = document.createElement("script"); script.src = LEAFLET_JS; script.onload = () => setLeafletReady(true); document.head.appendChild(script);
  }, []);
  return leafletReady;
};

const reverseGeocode = async (lat, lng, signal) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("reverse geocode failed");
  return res.json();
};

const searchAddress = async (query, signal) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("search failed");
  return res.json();
};

const buildDirectionsUrl = (lat, lng, originLat, originLng) => {
  const dest = `${lat},${lng}`;
  if (originLat != null && originLng != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dest}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
};

const MapPicker = memo(({ latitude, longitude, onChange, darkMode }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const leafletReady = useLeaflet();
  const defaultLat = latitude && latitude !== 0 ? latitude : 30.0444;
  const defaultLng = longitude && longitude !== 0 ? longitude : 31.2357;

  const [resolvedAddress, setResolvedAddress] = useState("");
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [originCoords, setOriginCoords] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const buildIcon = useCallback(() => {
    const L = window.L;
    return L.divIcon({
      html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
        <div class="pin-pulse" style="position:absolute;top:6px;width:34px;height:34px;border-radius:50%;background:#10b981"></div>
        <div style="position:relative;filter:drop-shadow(0 6px 10px rgba(0,0,0,0.4))">
          <div style="width:38px;height:38px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#10b981,#0d9488);transform:rotate(-45deg);border:3px solid white;display:flex;align-items:center;justify-content:center">
            <div style="width:12px;height:12px;border-radius:50%;background:white;transform:rotate(45deg)"></div>
          </div>
        </div>
        <div style="width:2px;height:6px;background:linear-gradient(to bottom,#0d9488,transparent);margin-top:-2px"></div>
      </div>`,
      className: "", iconSize: [38, 54], iconAnchor: [19, 54],
    });
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    if (mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [defaultLat, defaultLng], zoom: latitude ? 16 : 12, zoomControl: false });
    L.control.zoom({ position: "bottomright" }).addTo(map);

    tileLayerRef.current = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20, maxNativeZoom: 19, tileSize: 256, detectRetina: true,
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], { icon: buildIcon(), draggable: true }).addTo(map);
    marker.on("dragend", (e) => { const { lat, lng } = e.target.getLatLng(); onChange(lat, lng); });
    map.on("click", (e) => { const { lat, lng } = e.latlng; marker.setLatLng([lat, lng]); onChange(lat, lng); });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null; tileLayerRef.current = null; } };
  }, [leafletReady]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (latitude && longitude && (latitude !== 0 || longitude !== 0)) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], Math.max(mapInstanceRef.current.getZoom(), 16));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!latitude || !longitude || (latitude === 0 && longitude === 0)) { setResolvedAddress(""); return; }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setResolving(true);
    const timer = setTimeout(() => {
      reverseGeocode(latitude, longitude, controller.signal)
        .then((data) => setResolvedAddress(data?.display_name || ""))
        .catch(() => {})
        .finally(() => setResolving(false));
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [latitude, longitude]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      setSearching(true);
      try {
        const results = await searchAddress(query, controller.signal);
        setSuggestions(results || []);
      } catch { }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setOriginCoords({ lat, lng });
        onChange(lat, lng);
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 17);
      },
      () => Swal.fire({ title: "Location Error", text: "Could not get your location.", icon: "error", toast: true, position: "top-end", timer: 2000 }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const selectSuggestion = (s) => {
    const lat = parseFloat(s.lat), lng = parseFloat(s.lon);
    onChange(lat, lng);
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 17);
    setQuery(s.display_name);
    setSuggestions([]);
  };

  const directionsUrl = (latitude || longitude)
    ? buildDirectionsUrl(latitude, longitude, originCoords?.lat, originCoords?.lng)
    : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-500" : "text-gray-500"}`} />
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an address"
          className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition ${
            darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
          }`}
        />
        {searching && <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />}
        {suggestions.length > 0 && (
          <div className={`absolute z-30 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            {suggestions.map((s, i) => (
              <button key={i} type="button" onClick={() => selectSuggestion(s)}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-medium border-b last:border-b-0 transition ${
                  darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-700" : "border-gray-100 text-gray-600 hover:bg-gray-50"
                }`}>
                {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!leafletReady && (
        <div className={`flex items-center justify-center h-64 rounded-xl border-2 border-dashed ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-300 bg-gray-50"}`}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading map...</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className={`w-full rounded-xl overflow-hidden border-2 transition-all ${darkMode ? "border-gray-700" : "border-gray-200"} ${!leafletReady ? "hidden" : ""}`} style={{ height: "300px", zIndex: 0 }} />

      {leafletReady && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={handleLocateMe} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all">
            <FiCrosshair size={12} /> Use My Location
          </button>
          {directionsUrl && (
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all">
              <FiExternalLink size={12} /> Get Directions
            </a>
          )}
          {(latitude !== 0 || longitude !== 0) && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold flex-1 truncate ${
              darkMode ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              <FiLocation size={11} className="text-emerald-500 flex-shrink-0" />
              <span className="truncate">{latitude?.toFixed(6)}, {longitude?.toFixed(6)}</span>
            </div>
          )}
        </div>
      )}

      {(resolving || resolvedAddress) && (
        <div className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-xs ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
          <FiMapPin className="text-emerald-500 flex-shrink-0 mt-0.5" size={12} />
          {resolving ? <span>Locating address...</span> : <span className="leading-relaxed">{resolvedAddress}</span>}
        </div>
      )}

      <p className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Click on the map or drag the pin to set your location</p>
    </div>
  );
});

const ConfirmRepairModal = memo(({ open, onClose, req, token, onSuccess, darkMode }) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("HOME_DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    api.get("/api/users/addresses", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { const list = res.data.content || res.data || []; setAddresses(list); const def = list.find((a) => a.isDefault) || list[0]; if (def) setSelectedAddrId(def.id); })
      .catch(() => { });
  }, [open, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAddrId) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/users/repair-request/repairs/${req.id}/confirm`, { deliveryAddress: selectedAddrId, deliveryMethod, paymentMethod }, { headers: { Authorization: `Bearer ${token}` } });
      onClose();
      if (paymentMethod === "CREDIT_CARD" && res.data.paymentURL) {
        Swal.fire({ title: "Redirecting to Payment", icon: "info", timer: 2000, showConfirmButton: false }).then(() => { window.location.href = res.data.paymentURL; });
      } else {
        Swal.fire({ icon: "success", title: "Repair Confirmed!", toast: true, position: "top-end", timer: 2500, showConfirmButton: false });
        onSuccess();
      }
    } catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed to confirm repair", "error"); }
    finally { setSubmitting(false); }
  };

  const selCls = `w-full px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
    darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
  }`;
  const optBtn = (active) => `flex-1 py-2.5 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${
    active ? "border-emerald-500 bg-emerald-500 text-white" : darkMode ? "border-gray-700 text-gray-300 hover:border-emerald-400" : "border-gray-200 text-gray-600 hover:border-emerald-400"
  }`;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <DialogPanel className={`relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500" />
          <div className={`sm:hidden flex justify-center pt-3 pb-1`}><div className={`w-10 h-1 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`} /></div>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
            <DialogTitle className={`text-lg font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiCheckCircle className="text-emerald-500" /> Confirm Repair Order</DialogTitle>
            <button onClick={onClose} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiX className="w-5 h-5" /></button>
          </div>
          {req && (
            <div className={`mx-5 mt-4 p-4 rounded-xl border ${darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"}`}>
              <p className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{req.shopName}</p>
              {!isEmptyVal(req.price) && <p className={`text-2xl font-black mt-0.5 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{req.price} <span className="text-sm font-medium">EGP</span></p>}
            </div>
          )}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}><FiLocation className="inline mr-1 text-emerald-500" /> Delivery Address</label>
              {addresses.length === 0 ? <p className="text-sm text-red-500 font-medium">No addresses found. Please add one in your profile.</p> : (
                <select value={selectedAddrId} onChange={(e) => setSelectedAddrId(e.target.value)} className={selCls} required>
                  {addresses.map((a) => <option key={a.id} value={a.id}>{a.street}, {a.building} — {a.city}{a.isDefault ? " (Default)" : ""}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}><FiTruck className="inline mr-1 text-emerald-500" /> Delivery Method</label>
              <div className="flex gap-2">
                {[["HOME_DELIVERY", "Home Delivery"], ["SHOP_VISIT", "Visit Shop"], ["PICKUP", "Courier"]].map(([val, lbl]) => (
                  <button type="button" key={val} onClick={() => setDeliveryMethod(val)} className={optBtn(deliveryMethod === val)}>{lbl}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}><FiCreditCard className="inline mr-1 text-emerald-500" /> Payment Method</label>
              <div className="flex gap-3">
                {[["CASH", "Cash"], ["CREDIT_CARD", "Credit Card"]].map(([val, lbl]) => (
                  <button type="button" key={val} onClick={() => setPaymentMethod(val)} className={optBtn(paymentMethod === val)}>{lbl}</button>
                ))}
              </div>
              {paymentMethod === "CREDIT_CARD" && <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${darkMode ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-600"}`}>You'll be redirected to a secure payment gateway.</p>}
            </div>
            <div className="flex gap-3 pt-1 pb-1">
              <button type="button" onClick={onClose} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Cancel</button>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting || addresses.length === 0} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : <><FiCheckCircle size={14} /> Confirm</>}
              </motion.button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
});

const ProfileTab = memo(({ isEditingProfile, setIsEditingProfile, userProfile, profileForm, setProfileForm, handleUpdateProfile, handleDeleteAccount, handleLogout, isAuthenticated, inputCls, darkMode }) => {
  if (isEditingProfile) return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className={`rounded-md shadow-xl border-2 overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
      
      <div className="p-5 sm:p-7">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}><FiEdit2 className="text-emerald-500" /> Edit Profile</h3>
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full border-4 border-gray-500/40 shadow-lg flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}><FiUser className="text-3xl text-gray-500" /></div>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>First Name</label><input type="text" placeholder="First Name" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} className={inputCls} required /></div>
            <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Last Name</label><input type="text" placeholder="Last Name" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} className={inputCls} required /></div>
          </div>
          <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Phone Number</label><input type="tel" placeholder="Phone Number" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} required /></div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm"><FiCheck size={14} /> Save Changes</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setIsEditingProfile(false)} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Cancel</motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const infoRows = [
    { icon: <FiUser size={15} />, value: `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}`.trim() },
    { icon: <FiMail size={15} />, value: userProfile?.email },
    { icon: <FiPhone size={15} />, value: userProfile?.phone },
  ].filter((row) => !isEmptyVal(row.value));

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
      <div className={`rounded-md shadow-xl border-2 overflow-hidden ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
            <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}><FiUser className="text-emerald-500" /> My Profile</h3>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsEditingProfile(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 font-bold text-sm text-white hover:bg-emerald-600 shadow-sm transition-all"><FiEdit2 size={13} /> Edit Profile</motion.button>
            </div>
          </div>
          <div className="flex flex-col items-center mb-6">
            <div className={`w-24 h-24 rounded-full border-4 border-gray-500/40 shadow-xl flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}><FiUser className="text-4xl text-gray-500" /></div>
            {!isEmptyVal(userProfile?.first_name) && (
              <p className={`mt-3 text-lg font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>{userProfile?.first_name} {userProfile?.last_name}</p>
            )}
          </div>
          <div className="space-y-2.5">
            {infoRows.map((row, i) => (
              <div key={i} className={`flex items-center gap-3 p-3.5 rounded-md ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
                <span className="text-emerald-500 flex-shrink-0">{row.icon}</span><span className={`font-medium text-sm truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{row.value}</span>
              </div>
            ))}
            <div className={`flex items-center flex-wrap justify-between gap-2 p-3.5 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
              <div className="flex items-center gap-3"><FiShield className="text-emerald-500" /><span className={`font-medium text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Account Status</span></div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${userProfile?.activate ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" : darkMode ? "bg-red-500/15 text-red-300" : "bg-red-100 text-red-700"}`}>{userProfile?.activate ? "● Active" : "● Inactive"}</span>
            </div>
            {isAuthenticated && (
              <div className="flex justify-end pt-1">
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleLogout} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all ${darkMode ? "bg-gray-700 hover:bg-red-500/15 text-gray-300 hover:text-red-400" : "bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500"}`}>
                  <RiLogoutBoxRLine size={13} /> Logout
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-md border-t overflow-hidden shadow-lg ${darkMode ? "bg-gray-800 border-gray-800" : "bg-white"}`}>
       
        <div className="p-5 sm:p-6">
          <h3 className={`text-base font-extrabold flex items-center gap-2.5 mb-2 ${darkMode ? "text-red-400" : "text-red-600"}`}><FiTrash2 size={15} /> Danger Zone</h3>
          <p className={`text-sm mb-4 ${darkMode ? "text-red-300/80" : "text-red-600/80"}`}>This action is irreversible. All your data will be permanently deleted.</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleDeleteAccount} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-lg hover:shadow-red-500/30 transition-all text-sm">
            <FiTrash2 size={14} /> Yes, Delete My Account
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

const AddressesTab = memo(({ isAddingAddress, setIsAddingAddress, editingAddressId, setEditingAddressId, addressForm, setAddressForm, handleUpdateAddress, handleAddAddress, resetAddressForm, addresses, startEditAddress, handleDeleteAddress, isAddressInUse, inputCls, darkMode }) => {
  const [addressInputMode, setAddressInputMode] = useState("manual");
  const handleMapChange = useCallback((lat, lng) => { setAddressForm((prev) => ({ ...prev, latitude: lat, longitude: lng })); }, [setAddressForm]);

  if (isAddingAddress || editingAddressId) return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className={`rounded-md shadow-xl border-2 overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
      
      <div className="p-5 sm:p-7">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-5 ${darkMode ? "text-white" : "text-gray-900"}`}><FiMapPin className="text-emerald-500" /> {editingAddressId ? "Edit Address" : "Add Address"}</h3>
        <div className={`flex gap-1 p-1 rounded-xl mb-5 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
          <button type="button" onClick={() => setAddressInputMode("manual")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-3xl font-bold text-xs sm:text-sm transition-all ${addressInputMode === "manual" ? "bg-emerald-500 text-white shadow-md" : darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"}`}><FiList size={13} /> Address Information</button>
          <button type="button" onClick={() => setAddressInputMode("map")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-3xl font-bold text-xs sm:text-sm transition-all ${addressInputMode === "map" ? "bg-emerald-500 text-white shadow-md" : darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"}`}><FiNavigation size={13} /> Pick on Map</button>
        </div>
        <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-4">
          <AnimatePresence mode="wait">
            {addressInputMode === "manual" ? (
              <motion.div key="manual" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ label: "State / Governorate", key: "state", ph: "e.g., Cairo" }, { label: "City", key: "city", ph: "e.g., Giza" }, { label: "Street", key: "street", ph: "e.g., Tahrir Street" }, { label: "Building / Apartment", key: "building", ph: "e.g., Bldg 12" }].map(({ label, key, ph }) => (
                    <div key={key}><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{label}</label><input type="text" placeholder={ph} value={addressForm[key]} onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })} className={inputCls} required /></div>
                  ))}
                </div>
                <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Additional Notes (optional)</label><textarea placeholder="Additional Notes (optional)" value={addressForm.notes} onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })} className={`${inputCls} resize-none`} rows={3} /></div>
              </motion.div>
            ) : (
              <motion.div key="map" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
                <MapPicker latitude={addressForm.latitude} longitude={addressForm.longitude} onChange={handleMapChange} darkMode={darkMode} />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Latitude</label><input type="number" step="any" placeholder="0.00000" value={addressForm.latitude || ""} onChange={(e) => setAddressForm({ ...addressForm, latitude: parseFloat(e.target.value) || 0 })} className={inputCls} /></div>
                  <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Longitude</label><input type="number" step="any" placeholder="0.00000" value={addressForm.longitude || ""} onChange={(e) => setAddressForm({ ...addressForm, longitude: parseFloat(e.target.value) || 0 })} className={inputCls} /></div>
                </div>
                <div className={`p-3 rounded-xl border text-xs font-medium ${darkMode ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-600"}`}><FiInfo className="inline mr-1.5" size={11} />You still need to fill in the manual address fields. Switch to Manual Entry to complete the street details.</div>
              </motion.div>
            )}
          </AnimatePresence>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="w-4 h-4 rounded accent-emerald-500" />
            <span className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Set as default address</span>
          </label>
          <div className="flex gap-3 pt-1">
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm"><FiCheck size={13} /> {editingAddressId ? "Update" : "Save"}</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => { resetAddressForm(); setAddressInputMode("manual"); }} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Cancel</motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}><FiMapPin className="text-emerald-500" /> Addresses</h3>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsAddingAddress(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-emerald-500 text-emerald-500 font-bold text-sm hover:bg-emerald-500 hover:text-white transition-all"><FiPlus size={13} /> Add Address</motion.button>
      </div>
      {addresses.length === 0 ? (
        <EmptyState illustration={<IllustrationPin darkMode={darkMode} />} title="No saved addresses yet" subtitle="Add an address to speed up checkout and repair pickups." darkMode={darkMode} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {addresses.map((addr) => {
            const inUse = isAddressInUse(addr.id);
            const hasCoords = !isEmptyCoord(addr.latitude) && !isEmptyCoord(addr.longitude);
            return (
              <motion.div key={addr.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
                className={`relative rounded-md shadow-md hover:shadow-xl border-2 transition-all duration-300 overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"} ${addr.isDefault ? "border-emerald-500" : darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className={`h-1 ${addr.isDefault ? "bg-gradient-to-r from-emerald-500 to-teal-500" : darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                {addr.isDefault && <span className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md"><RiVerifiedBadgeLine size={10} /> Default</span>}
                <div className="p-4 sm:p-5">
                  <h4 className={`text-base font-bold mb-0.5 pr-16 ${darkMode ? "text-white" : "text-gray-900"}`}>{addr.street}, {addr.building}</h4>
                  <p className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{addr.city}, {addr.state}</p>
                  {!isEmptyVal(addr.notes) && <p className={`text-xs italic px-3 py-2 rounded-xl mb-3 ${darkMode ? "bg-gray-700/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>"{addr.notes}"</p>}
                  {hasCoords && (
                    <div className="flex items-center gap-2 mb-3">
                      <p className={`text-[10px] flex items-center gap-1 font-mono ${darkMode ? "text-gray-500" : "text-gray-400"}`}><FiNavigation size={9} className="text-emerald-500" />{addr.latitude?.toFixed(5)}, {addr.longitude?.toFixed(5)}</p>
                      <a href={buildDirectionsUrl(addr.latitude, addr.longitude)} target="_blank" rel="noopener noreferrer"
                        className={`ml-auto flex items-center gap-1 text-[10px] font-bold hover:underline ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                        <FiExternalLink size={9} /> Get Directions
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => !inUse && startEditAddress(addr)} disabled={inUse} className={`flex items-center gap-1.5 px-3 py-2 rounded-3xl border-2 font-bold text-xs transition-all ${inUse ? `opacity-50 cursor-not-allowed ${darkMode ? "border-gray-700 text-gray-500" : "border-gray-300 text-gray-400"}` : "border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white"}`}><FiEdit2 size={11} /> {inUse ? "In Use" : "Edit"}</motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => !inUse && handleDeleteAddress(addr.id)} disabled={inUse} className={`flex items-center gap-1.5 px-3 py-2 rounded-md border-2 font-bold text-xs transition-all ${inUse ? `opacity-50 cursor-not-allowed ${darkMode ? "border-gray-700 text-gray-500" : "border-gray-300 text-gray-400"}` : "border-red-400 text-red-500 hover:bg-red-500 hover:text-white"}`}><FiTrash2 size={11} /></motion.button>
                  </div>
                  {inUse && <p className="text-[10px] mt-2 text-amber-500 font-semibold flex items-center gap-1"><FiInfo size={10} /> Used in active order/repair</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
});

const OrdersTab = memo(({ orders, ordersPage, setOrdersPage, setSelectedOrder, setIsOrderModalOpen, handleCancelOrder, darkMode }) => {
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const ipp = 4;

  const filtered = useMemo(() => orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (dateFilter && toDateOnlyString(o.createdAt) !== dateFilter) return false;
    if (search && !o.id?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [orders, statusFilter, dateFilter, search]);

  const total = Math.ceil(filtered.length / ipp);
  const pageOrders = filtered.slice((ordersPage - 1) * ipp, ordersPage * ipp);
  const statusKeys = ["PENDING","CONFIRMED","PROCESSING","FINISHPROCESSING","SHIPPED","DELIVERED","CANCELLED"];

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}><FiBox className="text-emerald-500" /> Orders</h3>
      <FilterBar statusOptions={statusKeys} statusFilter={statusFilter} setStatusFilter={setStatusFilter} dateFilter={dateFilter} setDateFilter={setDateFilter} search={search} setSearch={setSearch} darkMode={darkMode} />
      {filtered.length === 0 ? (
        <EmptyState illustration={<IllustrationBox darkMode={darkMode} />} title="No orders placed yet" subtitle="Everything you order will show up here with live status." darkMode={darkMode} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageOrders.map((order) => {
              const isDelivered = order.status === "DELIVERED";
              const isCancelled = order.status === "CANCELLED";
              const progress = getOrderProgress(order.status);
              const hasTotal = !isEmptyVal(order.totalPrice);
              return (
                <motion.div key={order.id} whileHover={{ y: -3 }} className={`rounded-md shadow-md hover:shadow-xl border transition-all overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                 
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div><p className={`font-mono text-[10px] tracking-[2px] uppercase ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>ORD #{order.id.slice(0, 6)}</p><p className={`text-base font-bold mt-0.5 ${darkMode ? "text-white" : "text-gray-900"}`}>Order</p></div>
                      <StatusBadge status={order.status} type="order" darkMode={darkMode} />
                    </div>
                    <ProgressBar progress={progress} status={order.status} darkMode={darkMode} />
                    <div className="mb-3 mt-1 space-y-1.5">
                      {!isEmptyVal(order.createdAt) && <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}><FiCalendar className="text-emerald-500 flex-shrink-0" size={11} />{new Date(order.createdAt).toLocaleDateString("en-EG", { month: "short", day: "numeric", year: "numeric" })}</div>}
                      {!isEmptyVal(order.paymentMethod) && <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}><FiCreditCard size={11} className="flex-shrink-0" /><span className="font-medium uppercase tracking-wide">{order.paymentMethod?.replace("_", " ")}</span></div>}
                    </div>
                    {hasTotal && <div className="mb-3"><span className={`text-2xl sm:text-3xl font-black ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{order.totalPrice}</span><span className={`text-xs ml-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>EGP</span></div>}
                    <div className="flex gap-2 mt-auto flex-wrap">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }} className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 ${darkMode ? "bg-blue-500/15 hover:bg-blue-500/25 text-blue-300" : "bg-blue-50 hover:bg-blue-100 text-blue-600"}`}><FiInfo size={11} /> Details</motion.button>
      
                      {!isDelivered && !isCancelled && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleCancelOrder(order.id)} className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 ${darkMode ? "bg-red-500/15 hover:bg-red-500/25 text-red-300" : "bg-red-50 hover:bg-red-100 text-red-600"}`}><FiXCircle size={11} /> Cancel Order</motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <Pagination page={ordersPage} total={total} setPage={setOrdersPage} darkMode={darkMode} />
        </>
      )}
    </motion.div>
  );
});

const RepairsTab = memo(({ repairRequests, repairsPage, setRepairsPage, handleViewRepair, handleEditRepair, handleAcceptQuote, handleCancelRepair, darkMode }) => {
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const ipp = 4;

  const filtered = useMemo(() => repairRequests.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (dateFilter && toDateOnlyString(r.createdAt) !== dateFilter) return false;
    if (search && !(r.shopName?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()) || r.id?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [repairRequests, statusFilter, dateFilter, search]);

  const totalPages = Math.ceil(filtered.length / ipp);
  const pageRepairs = filtered.slice((repairsPage - 1) * ipp, repairsPage * ipp);
  const statusKeys = ["SUBMITTED","QUOTE_SENT","QUOTE_APPROVED","QUOTE_REJECTED","DEVICE_COLLECTED","REPAIRING","REPAIR_COMPLETED","DEVICE_DELIVERED","CANCELLED","FAILED"];

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}><FiTool className="text-emerald-500" /> Repairs</h3>
      <FilterBar statusOptions={statusKeys} statusFilter={statusFilter} setStatusFilter={setStatusFilter} dateFilter={dateFilter} setDateFilter={setDateFilter} search={search} setSearch={setSearch} darkMode={darkMode} />
      {filtered.length === 0 ? (
        <EmptyState illustration={<IllustrationTool darkMode={darkMode} />} title="No repair requests yet" subtitle="Submit a repair request and track it from quote to delivery." darkMode={darkMode} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageRepairs.map((req) => {
              const isQuoteSent = req.status === "QUOTE_SENT";
              const canCancel = ["QUOTE_APPROVED", "QUOTE_SENT", "SUBMITTED"].includes(req.status);
              const hasPrice = !isEmptyVal(req.price);
              const progress = getRepairProgress(req.status);
              return (
                <motion.div key={req.id} whileHover={{ y: -3 }} className={`rounded-md shadow-md hover:shadow-xl border transition-all overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0"><p className={`font-mono text-[10px] tracking-[2px] uppercase ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>REQ #{req.id.slice(0, 6)}</p><p className={`text-base font-bold mt-0.5 truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{req.shopName}</p></div>
                      <StatusBadge status={req.status} type="repair" darkMode={darkMode} />
                    </div>
                    <ProgressBar progress={progress} status={req.status} darkMode={darkMode} />
                    {!isEmptyVal(req.description) && <p className={`text-xs sm:text-sm line-clamp-2 mb-3 mt-1 flex-1 leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{req.description}</p>}
                    {hasPrice && <div className="mb-3 flex items-end gap-1"><span className={`text-2xl font-black ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{req.price}</span><span className={`text-xs mb-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>EGP</span></div>}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleViewRepair(req.id)} className={`font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 ${darkMode ? "bg-blue-500/15 hover:bg-blue-500/25 text-blue-300" : "bg-blue-50 hover:bg-blue-100 text-blue-600"}`}><FiInfo size={10} /> Details</motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleEditRepair(req)} className={`font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 ${darkMode ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300" : "bg-amber-50 hover:bg-amber-100 text-amber-600"}`}><FiEdit size={10} /> Edit</motion.button>
                      {isQuoteSent && hasPrice && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleAcceptQuote(req)} className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"><FiCheckCircle size={10} /> Accept Quote</motion.button>
                      )}
                      {canCancel && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleCancelRepair(req.id)} className={`col-span-2 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 ${darkMode ? "bg-red-500/15 hover:bg-red-500/25 text-red-300" : "bg-red-50 hover:bg-red-100 text-red-600"}`}><FiXCircle size={10} /> Cancel Request</motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <Pagination page={repairsPage} total={totalPages} setPage={setRepairsPage} darkMode={darkMode} />
        </>
      )}
    </motion.div>
  );
});

const NotificationsTab = memo(({ token, darkMode }) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const ipp = 5;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get("/api/notifications/users", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.content || res.data || [];
    },
    enabled: !!token
  });

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/api/notifications/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Swal.fire({ icon: "success", title: "Deleted", toast: true, position: "top-end", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Failed", toast: true, position: "top-end", timer: 1500, showConfirmButton: false }); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalPages = Math.ceil(notifications.length / ipp);
  const pageNotifications = notifications.slice((page - 1) * ipp, page * ipp);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <FiBell className="text-emerald-500" /> Notifications
          {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h3>
      </div>
      {isLoading ? <LoadingSpinner darkMode={darkMode} /> : notifications.length === 0 ? (
        <EmptyState illustration={<IllustrationBell darkMode={darkMode} />} title="No notifications yet" subtitle="Updates about your orders and repairs will land here." darkMode={darkMode} />
      ) : (
        <>
          <div className="space-y-3">
            {pageNotifications.map((notif) => (
              <motion.div key={notif.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-md border p-4 sm:p-5 transition-all shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                {!notif.read && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />}
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <FiBell className="text-emerald-500" size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{notif.title || notif.subject || "Notification"}</p>
                    {!isEmptyVal(notif.message || notif.body) && <p className={`text-xs mt-0.5 leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{notif.message || notif.body}</p>}
                    {!isEmptyVal(notif.createdAt) && <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}><FiClock size={9} />{new Date(notif.createdAt).toLocaleString("en-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => deleteNotif(notif.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${darkMode ? "bg-red-500/15 text-red-300 hover:bg-red-500/25" : "bg-red-50 text-red-500 hover:bg-red-100"}`}>
                    <FiTrash2 size={10} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <Pagination page={page} total={totalPages} setPage={setPage} darkMode={darkMode} />
        </>
      )}
    </motion.div>
  );
});

const CHART_COLORS = ["#10b981", "#0d9488", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#f97316"];

const DonutChart = memo(({ data, size = 168, thickness = 24, darkMode }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {total === 0 ? (
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={darkMode ? "#374151" : "#e5e7eb"} strokeWidth={thickness} />
        ) : data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={d.color}
              strokeWidth={thickness} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset} />
          );
        })}
      </g>
      <text x="50%" y="47%" textAnchor="middle" fill={darkMode ? "#ffffff" : "#111827"} style={{ fontSize: 26, fontWeight: 800 }}>{total}</text>
      <text x="50%" y="62%" textAnchor="middle" fill={darkMode ? "#9ca3af" : "#9ca3af"} style={{ fontSize: 11, fontWeight: 600 }}>Total</text>
    </svg>
  );
});

const ChartLegend = memo(({ data, darkMode }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-2 flex-1 min-w-[160px]">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
          <span className={`font-semibold flex-1 truncate ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{d.label}</span>
          <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{d.value}</span>
          <span className={`w-10 text-right ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{Math.round((d.value / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
});

const StatCard = memo(({ icon, value, label, accent, darkMode }) => (
  <div className={`rounded-md border p-4 sm:p-5 shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${accent}1a`, color: accent }}>{icon}</div>
    <p className={`text-2xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>{value}</p>
    <p className={`text-xs font-semibold mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
  </div>
));

const StatProgressRow = memo(({ label, value, total, color, darkMode }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className={`text-xs font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
        <span className={`text-xs font-bold ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{value}/{total} · {pct}%</span>
      </div>
      <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: `linear-gradient(to right, ${color}, ${color}cc)` }} />
      </div>
    </div>
  );
});

const AnalyticsTab = memo(({ orders, repairRequests, addresses, darkMode }) => {
  const orderTotal = orders.length;
  const repairTotal = repairRequests.length;
  const totalSpent = orders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0) + repairRequests.reduce((s, r) => s + (Number(r.price) || 0), 0);

  const orderStatusData = useMemo(() => {
    const counts = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([label, value], i) => ({ label: label.replace(/_/g, " "), value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [orders]);

  const repairStatusData = useMemo(() => {
    const counts = {};
    repairRequests.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([label, value], i) => ({ label: label.replace(/_/g, " "), value, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [repairRequests]);

  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;
  const completedRepairs = repairRequests.filter((r) => r.status === "DEVICE_DELIVERED").length;
  const cancelledRepairs = repairRequests.filter((r) => ["CANCELLED", "FAILED", "QUOTE_REJECTED"].includes(r.status)).length;

  const hasData = orderTotal > 0 || repairTotal > 0;

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
      <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}><FiPieChart className="text-emerald-500" /> Account Analytics</h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<FiBox size={16} />} value={orderTotal} label="Total Orders" accent="#10b981" darkMode={darkMode} />
        <StatCard icon={<FiTool size={16} />} value={repairTotal} label="Total Repairs" accent="#0d9488" darkMode={darkMode} />
        <StatCard icon={<FiDollarSign size={16} />} value={`${totalSpent.toFixed(0)} EGP`} label="Total Spent" accent="#3b82f6" darkMode={darkMode} />
        <StatCard icon={<FiMapPin size={16} />} value={addresses.length} label="Saved Addresses" accent="#8b5cf6" darkMode={darkMode} />
      </div>

      {!hasData ? (
        <EmptyState illustration={<IllustrationBox darkMode={darkMode} />} title="Not enough activity yet" subtitle="Place an order or submit a repair request to see your analytics here." darkMode={darkMode} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`rounded-md border p-5 sm:p-6 shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}><FiBox className="text-emerald-500" size={14} /> Orders by Status</h4>
              {orderTotal === 0 ? <p className={`text-xs py-8 text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No orders yet</p> : (
                <div className="flex flex-wrap items-center gap-5">
                  <DonutChart data={orderStatusData} darkMode={darkMode} />
                  <ChartLegend data={orderStatusData} darkMode={darkMode} />
                </div>
              )}
            </div>
            <div className={`rounded-md border p-5 sm:p-6 shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}><FiTool className="text-emerald-500" size={14} /> Repairs by Status</h4>
              {repairTotal === 0 ? <p className={`text-xs py-8 text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No repair requests yet</p> : (
                <div className="flex flex-wrap items-center gap-5">
                  <DonutChart data={repairStatusData} darkMode={darkMode} />
                  <ChartLegend data={repairStatusData} darkMode={darkMode} />
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-md border p-5 sm:p-7 shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h4 className={`text-sm font-bold mb-5 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}><FiTrendingUp className="text-emerald-500" size={14} /> Performance Overview</h4>
            <div className="space-y-5">
              <StatProgressRow label="Orders delivered" value={deliveredOrders} total={orderTotal} color="#10b981" darkMode={darkMode} />
              <StatProgressRow label="Orders cancelled" value={cancelledOrders} total={orderTotal} color="#ef4444" darkMode={darkMode} />
              <StatProgressRow label="Repairs completed" value={completedRepairs} total={repairTotal} color="#0d9488" darkMode={darkMode} />
              <StatProgressRow label="Repairs cancelled or failed" value={cancelledRepairs} total={repairTotal} color="#f59e0b" darkMode={darkMode} />
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
});

const AboutTab = memo(({ darkMode }) => {
  const values = [
    { icon: <FiShield size={16} />, title: "Verified Shops", text: "Every repair shop on Tech-Restore is vetted so your device ends up in trusted hands." },
    { icon: <FiZap size={16} />, title: "Fast Turnaround", text: "Track every step live, from quote to pickup, so repairs never feel like a black box." },
    { icon: <FiCreditCard size={16} />, title: "Secure Payments", text: "Pay by cash or card with the same protection you'd expect from any secure checkout." },
    { icon: <FiTruck size={16} />, title: "Doorstep Delivery", text: "Choose home delivery, courier pickup, or visit the shop yourself — whatever suits you." },
  ];

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
      <div className={`rounded-md shadow-xl border-2 overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-36 h-36 flex-shrink-0"><IllustrationHeart darkMode={darkMode} /></div>
          <div>
            <h3 className={`text-xl sm:text-2xl font-extrabold mb-2 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiCompass className="text-emerald-500" /> About Tech-Restore</h3>
            <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Tech-Restore connects people who need device repairs with verified local shops, and brings retail
              shopping for parts and accessories into the same place. Our goal is simple: make getting a device
              fixed as easy and transparent as ordering anything else online.
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-md shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <div className="p-6 sm:p-8">
          <h4 className={`text-lg font-extrabold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiAward className="text-emerald-500" /> Why people choose us</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v, i) => (
              <div key={i} className={`flex gap-3 p-4 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>{v.icon}</div>
                <div>
                  <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{v.title}</p>
                  <p className={`text-xs mt-0.5 leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-md shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <div className="p-6 sm:p-8">
          <h4 className={`text-lg font-extrabold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiSend className="text-emerald-500" /> Get in touch</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`flex items-center gap-3 p-3.5 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
              <FiMail className="text-emerald-500 flex-shrink-0" size={15} />
              <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>support@tech-restore.com</span>
            </div>
            <div className={`flex items-center gap-3 p-3.5 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
              <FiPhone className="text-emerald-500 flex-shrink-0" size={15} />
              <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>+20 100 000 0000</span>
            </div>
            <div className={`flex items-center gap-3 p-3.5 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
              <FiMapPin className="text-emerald-500 flex-shrink-0" size={15} />
              <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Cairo, Egypt</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const TipsCard = memo(() => {
  const tips = [
    "Add more than one address so checkout and repair pickups are always ready to go.",
    "Accept a repair quote quickly to get your device into the queue sooner.",
    "Download invoices right after delivery so your records stay in one place.",
    "Check Analytics after a few orders to see your spending and delivery trends.",
  ];
  return (
    <div className="rounded-md border shadow-lg overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
      <div className="p-5">
        <h4 className="text-sm font-extrabold flex items-center gap-2 mb-3"><FiTarget size={15} /> Tips for Tech-Restore</h4>
        <ul className="space-y-2.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-emerald-50">
              <FiCheckCircle size={13} className="flex-shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

const AccountContent = ({ darkMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  useEffect(() => { document.title = "My Account | Tech-Restore"; }, []);

  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [activeSection, setActiveSection] = useState("profile");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [addressForm, setAddressForm] = useState({ state: "", city: "", street: "", building: "", notes: "", isDefault: false, latitude: 0, longitude: 0 });
  const [ordersPage, setOrdersPage] = useState(1);
  const [repairsPage, setRepairsPage] = useState(1);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [isEditRepairModalOpen, setIsEditRepairModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isConfirmRepairOpen, setIsConfirmRepairOpen] = useState(false);
  const [confirmRepairReq, setConfirmRepairReq] = useState(null);

  const safe = (val) => (val == null || val === "" ? "—" : String(val).trim());
  const formatDate = (d) => new Date(d).toLocaleString("en-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Cairo" });

  const inputCls = `w-full px-4 py-3 sm:py-3.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
    darkMode ? "bg-gray-800/70 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white/70 border-gray-300 text-gray-900 placeholder-gray-400"
  }`;

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => { const res = await api.get("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } }); const data = res.data; setProfileForm({ first_name: data.first_name || "", last_name: data.last_name || "", phone: data.phone || "" }); return data; },
    enabled: !!token
  });
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({ queryKey: ['addresses'], queryFn: async () => (await api.get("/api/users/addresses", { headers: { Authorization: `Bearer ${token}` } })).data.content || [], enabled: !!token });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['orders'], queryFn: async () => (await api.get("/api/users/orders", { headers: { Authorization: `Bearer ${token}` } })).data.content || [], enabled: !!token });
  const { data: repairRequests = [], isLoading: repairsLoading } = useQuery({ queryKey: ['repairs'], queryFn: async () => (await api.get("/api/users/repair-request", { headers: { Authorization: `Bearer ${token}` } })).data.content || [], enabled: !!token });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get("/api/categories", { headers: { Authorization: `Bearer ${token}` } })).data.content || [], enabled: !!token });

  const isLoading = profileLoading || addressesLoading || ordersLoading || repairsLoading;

  const safeDecodeJwt = useCallback((tk) => { try { return jwtDecode(tk); } catch { return null; } }, []);
  const isTokenExpired = useCallback((tk) => { const d = safeDecodeJwt(tk); return !d || !d.exp || d.exp < Date.now() / 1000; }, [safeDecodeJwt]);

  useEffect(() => {
    const tk = localStorage.getItem("authToken");
    if (!tk || isTokenExpired(tk)) { localStorage.removeItem("authToken"); setIsAuthenticated(false); navigate("/login"); }
    else { setToken(tk); setIsAuthenticated(true); }
  }, [location.pathname, navigate, isTokenExpired]);

  const resetAddressForm = useCallback(() => { setEditingAddressId(null); setIsAddingAddress(false); setAddressForm({ state: "", city: "", street: "", building: "", notes: "", isDefault: false, latitude: 0, longitude: 0 }); }, []);
  const startEditAddress = useCallback((addr) => { setEditingAddressId(addr.id); setAddressForm({ state: addr.state, city: addr.city, street: addr.street, building: addr.building, notes: addr.notes || "", isDefault: addr.isDefault, latitude: addr.latitude || 0, longitude: addr.longitude || 0 }); }, []);

  const handleUpdateProfile = async (e) => { e.preventDefault(); try { await api.put("/api/users/profile", profileForm, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['profile'] }); setIsEditingProfile(false); Swal.fire({ title: "Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Update failed", icon: "error", toast: true, position: "top-end", timer: 1500 }); } };

  const handleDeleteAccount = async () => {
    const c = await Swal.fire({ title: "Delete Account?", text: "This action is irreversible. All your data will be permanently deleted.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Yes, Delete My Account" });
    if (!c.isConfirmed) return;
    try { await api.delete("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } }); localStorage.removeItem("authToken"); navigate("/"); }
    catch { Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 }); }
  };

  const handleAddAddress = async (e) => { e.preventDefault(); try { await api.post("/api/users/addresses", { ...addressForm, latitude: addressForm.latitude || 0, longitude: addressForm.longitude || 0 }, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); resetAddressForm(); Swal.fire({ title: "Added!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Failed to add", icon: "error", toast: true, position: "top-end", timer: 1500 }); } };
  const handleUpdateAddress = async (e) => { e.preventDefault(); try { await api.put(`/api/users/addresses/${editingAddressId}`, { ...addressForm, latitude: addressForm.latitude || 0, longitude: addressForm.longitude || 0 }, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); resetAddressForm(); Swal.fire({ title: "Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Failed to update", icon: "error", toast: true, position: "top-end", timer: 1500 }); } };
  const handleDeleteAddress = useCallback(async (id) => { const c = await Swal.fire({ title: "Delete Address?", icon: "warning", showCancelButton: true }); if (!c.isConfirmed) return; try { await api.delete(`/api/users/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); Swal.fire({ title: "Deleted!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 }); } }, [token, queryClient]);
  const handleCancelOrder = useCallback(async (id) => { const c = await Swal.fire({ title: "Cancel Order?", icon: "warning", showCancelButton: true }); if (!c.isConfirmed) return; try { await api.delete(`/api/users/orders/${id}/cancel`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['orders'] }); Swal.fire({ title: "Cancelled!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Failed to cancel", icon: "error", toast: true, position: "top-end", timer: 1500 }); } }, [token, queryClient]);
  const handleViewRepair = useCallback(async (id) => { try { const res = await api.get(`/api/users/repair-request/${id}`, { headers: { Authorization: `Bearer ${token}` } }); setSelectedRepair(res.data); setIsRepairModalOpen(true); } catch { Swal.fire({ title: "Error", text: "Failed to load", icon: "error" }); } }, [token]);
  const handleEditRepair = useCallback((req) => { setEditingRepair(req); setEditDescription(req.description || ""); setSelectedCategory(req.deviceCategory || ""); setIsEditRepairModalOpen(true); }, []);

  const handleUpdateRepairDescription = async (e) => {
    e.preventDefault();
    if (!editingRepair) return;
    try { await api.put(`/api/users/repair-request/${editingRepair.shopId}/${editingRepair.id}`, { description: editDescription, deviceCategory: selectedCategory.id }, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['repairs'] }); setIsEditRepairModalOpen(false); setEditingRepair(null); Swal.fire({ icon: "success", title: "Updated!", toast: true, position: "top-end", timer: 2500, showConfirmButton: false }); }
    catch { Swal.fire({ icon: "error", title: "Failed", toast: true, position: "top-end", timer: 2500, showConfirmButton: false }); }
  };

  const handleAcceptQuote = useCallback(async (req) => {
    const result = await Swal.fire({ title: "Accept Quote?", text: `Accept ${req.price} EGP from ${req.shopName}?`, icon: "question", showCancelButton: true, confirmButtonText: "Yes, Accept", confirmButtonColor: "#10b981" });
    if (!result.isConfirmed) return;
    try { await api.put(`/api/users/repair-request/${req.id}/status`, { status: "QUOTE_APPROVED" }, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['repairs'] }); Swal.fire({ icon: "success", title: "Quote Accepted!", toast: true, position: "top-end", timer: 2000, showConfirmButton: false }); setConfirmRepairReq(req); setIsConfirmRepairOpen(true); }
    catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed to accept quote", "error"); }
  }, [token, queryClient]);

  const handleCancelRepair = useCallback(async (id) => {
    const result = await Swal.fire({ title: "Cancel Request?", icon: "warning", showCancelButton: true, confirmButtonText: "Yes, Cancel", confirmButtonColor: "#ef4444" });
    if (!result.isConfirmed) return;
    try { await api.delete(`/api/users/repair-request/${id}/cancel`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['repairs'] }); Swal.fire({ title: "Cancelled", icon: "success", toast: true, position: "top-end", timer: 2000 }); }
    catch { Swal.fire("Error", "Failed to cancel request", "error"); }
  }, [token, queryClient]);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try { if (token && refreshToken) await api.post("/api/auth/logout", { refreshToken }); } catch { }
    localStorage.clear(); setToken(null); setIsAuthenticated(false);
    Swal.fire({ icon: "success", text: "Logged out", position: "top-end", toast: true });
    navigate("/login", { replace: true });
  }, [token, navigate]);

  const isAddressInUse = useCallback((addressId) => {
    const activeOrder = orders.some(o => o.deliveryAddress === addressId && o.status !== "DELIVERED" && o.status !== "CANCELLED");
    const activeRepair = repairRequests.some(r => r.deliveryAddress === addressId && r.status !== "DELIVERED" && r.status !== "CANCELLED");
    return activeOrder || activeRepair;
  }, [orders, repairRequests]);

  const { data: notificationsData = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const res = await api.get("/api/notifications/users", { headers: { Authorization: `Bearer ${token}` } }); return res.data.content || res.data || []; },
    enabled: !!token
  });
  const unreadNotifCount = notificationsData.filter(n => !n.read).length;

  const tabs = useMemo(() => [
    { id: "profile", label: "Profile", icon: <FiUser size={14} />, badge: null },
    { id: "addresses", label: "Addresses", icon: <FiMapPin size={14} />, badge: addresses.length || null },
    { id: "orders", label: "Orders", icon: <FiBox size={14} />, badge: orders.length || null },
    { id: "repairs", label: "Repairs", icon: <FiTool size={14} />, badge: repairRequests.length || null },
    { id: "notifications", label: "Notifications", icon: <FiBell size={14} />, badge: unreadNotifCount || null },
    { id: "analytics", label: "Analytics", icon: <FiPieChart size={14} />, badge: null },
    { id: "about", label: "About Us", icon: <FiCompass size={14} />, badge: null },
  ], [addresses.length, orders.length, repairRequests.length, unreadNotifCount]);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <style>{STYLES}</style>

      <Hero variant="account" darkMode={darkMode} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex gap-5 lg:gap-8">

          <aside className={`hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 sticky top-20 self-start rounded-md border shadow-lg overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            
            <div className={`px-4 pt-5 pb-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full border-2 border-emerald-500/40 flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-500/10" : "bg-emerald-50"}`}><FiUser className="text-emerald-500 text-lg" /></div>
                <div className="min-w-0 flex-1">
                  {!isEmptyVal(userProfile?.first_name) && <p className={`text-sm font-extrabold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{userProfile?.first_name} {userProfile?.last_name}</p>}
                  {!isEmptyVal(userProfile?.email) && <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{userProfile?.email}</p>}
                </div>
                {isAuthenticated && (
                  <motion.button whileTap={{ scale: 0.94 }} onClick={handleLogout} title="Logout"
                    className={`flex-shrink-0 p-2 rounded-lg transition-all ${darkMode ? "text-gray-500 hover:text-red-400 hover:bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}>
                    <RiLogoutBoxRLine size={15} />
                  </motion.button>
                )}
              </div>
            </div>
            <div className="px-3 py-4 flex flex-col gap-1 flex-1">
              {tabs.map((tab) => (
                <motion.button key={tab.id} whileTap={{ scale: 0.97 }} onClick={() => startTransition(() => setActiveSection(tab.id))}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeSection === tab.id ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25" : darkMode ? "text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-300" : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"}`}>
                  <span className={activeSection === tab.id ? "text-white" : "text-emerald-500"}>{tab.icon}</span>
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.badge !== null && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeSection === tab.id ? "bg-white/20 text-white" : darkMode ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>{tab.badge}</span>}
                  {activeSection === tab.id && <FiArrowRight size={13} className="opacity-80" />}
                </motion.button>
              ))}
            </div>
            <div className="px-3 pb-4">
              <TipsCard />
            </div>
          </aside>

          <div className="flex-1 min-w-0">

            <div className="mb-5 bg-white border-2 border-gray-100 p-4 rounded-lg dark:bg-gray-900 dark:border-gray-700 sm:mb-7">
              <h1 className={`text-xl sm:text-2xl font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Welcome back{!isEmptyVal(userProfile?.first_name) ? `, ${userProfile.first_name}` : ""}
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Manage your profile, addresses, orders, and repair requests — all in one place.</p>
            </div>

            <div className="lg:hidden mb-5 -mx-0.5">
              <div className="tabs-scroll flex gap-2 overflow-x-auto pb-1 px-0.5">
                {tabs.map((tab) => (
                  <motion.button key={tab.id} whileTap={{ scale: 0.96 }} onClick={() => startTransition(() => setActiveSection(tab.id))}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap ${activeSection === tab.id ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20" : darkMode ? "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-emerald-500/10" : "bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50"}`}>
                    {tab.icon}{tab.label}
                    {tab.badge !== null && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeSection === tab.id ? "bg-white/25 text-white" : darkMode ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>{tab.badge}</span>}
                  </motion.button>
                ))}
              </div>
              <div className="mt-4">
                <TipsCard />
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {isLoading ? <LoadingSpinner key="spinner" darkMode={darkMode} /> : (
                  <div key="content">
                    {activeSection === "profile" && <ProfileTab isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile} userProfile={userProfile} profileForm={profileForm} setProfileForm={setProfileForm} handleUpdateProfile={handleUpdateProfile} handleDeleteAccount={handleDeleteAccount} handleLogout={handleLogout} isAuthenticated={isAuthenticated} inputCls={inputCls} darkMode={darkMode} />}
                    {activeSection === "addresses" && <AddressesTab isAddingAddress={isAddingAddress} setIsAddingAddress={setIsAddingAddress} editingAddressId={editingAddressId} setEditingAddressId={setEditingAddressId} addressForm={addressForm} setAddressForm={setAddressForm} handleUpdateAddress={handleUpdateAddress} handleAddAddress={handleAddAddress} resetAddressForm={resetAddressForm} addresses={addresses} startEditAddress={startEditAddress} handleDeleteAddress={handleDeleteAddress} isAddressInUse={isAddressInUse} inputCls={inputCls} darkMode={darkMode} />}
                    {activeSection === "orders" && <OrdersTab orders={orders} ordersPage={ordersPage} setOrdersPage={setOrdersPage} setSelectedOrder={setSelectedOrder} setIsOrderModalOpen={setIsOrderModalOpen} handleCancelOrder={handleCancelOrder} darkMode={darkMode} />}
                    {activeSection === "repairs" && <RepairsTab repairRequests={repairRequests} repairsPage={repairsPage} setRepairsPage={setRepairsPage} handleViewRepair={handleViewRepair} handleEditRepair={handleEditRepair} handleAcceptQuote={handleAcceptQuote} handleCancelRepair={handleCancelRepair} darkMode={darkMode} />}
                    {activeSection === "notifications" && <NotificationsTab token={token} darkMode={darkMode} />}
                    {activeSection === "analytics" && <AnalyticsTab orders={orders} repairRequests={repairRequests} addresses={addresses} darkMode={darkMode} />}
                    {activeSection === "about" && <AboutTab darkMode={darkMode} />}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <DialogPanel className={`relative transform overflow-hidden sm:rounded-md text-left shadow-2xl w-full sm:max-w-4xl border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {selectedOrder && (
                <div className="lime-scroll max-h-[90dvh] overflow-y-auto">
                
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className={`w-10 h-1 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`} /></div>
                  <div className={`sticky top-0 px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between z-10 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiBox className="text-emerald-500" /><span className="font-mono text-xs px-2 py-1 bg-emerald-500 text-white rounded-lg">ORD #{safe(selectedOrder.id).slice(0, 8).toUpperCase()}</span></DialogTitle>
                    <div className="flex items-center gap-2">
             
                      <button onClick={() => setIsOrderModalOpen(false)} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}><FiX className={`w-5 h-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} /></button>
                    </div>
                  </div>
                  <div className="p-4 sm:p-7 space-y-6 text-sm">
                    <ProgressBar progress={getOrderProgress(selectedOrder.status)} status={selectedOrder.status} darkMode={darkMode} />
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl ${darkMode ? "bg-gray-800/60" : "bg-gray-50"}`}>
                      <div className="space-y-3">
                        {!isEmptyVal(selectedOrder.createdAt) && <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Order Date</span><p className={`font-medium mt-0.5 ${darkMode ? "text-white" : "text-gray-900"}`}>{formatDate(selectedOrder.createdAt)}</p></div>}
                        <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Status</span><div className="mt-1"><StatusBadge status={selectedOrder.status} type="order" darkMode={darkMode} /></div></div>
                        {!isEmptyVal(selectedOrder.totalPrice) && <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Total</span><p className={`text-2xl sm:text-3xl font-bold mt-0.5 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{safe(selectedOrder.totalPrice)} EGP</p></div>}
                      </div>
                      {!isEmptyVal(selectedOrder.paymentMethod) && (
                        <div><p className={`font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Payment Method</p>
                          <div className={`flex items-center gap-3 p-3 rounded-2xl border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedOrder.paymentMethod === "CREDIT_CARD" ? darkMode ? "bg-blue-500/15" : "bg-blue-100" : darkMode ? "bg-orange-500/15" : "bg-orange-100"}`}>{selectedOrder.paymentMethod === "CREDIT_CARD" ? <FiCreditCard className={`w-4 h-4 ${darkMode ? "text-blue-300" : "text-blue-600"}`} /> : <FiDollarSign className={`w-4 h-4 ${darkMode ? "text-orange-300" : "text-orange-600"}`} />}</div>
                            <p className={`font-semibold capitalize text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{safe(selectedOrder.paymentMethod).toLowerCase().replace("_", " ")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}><FiBox className="text-emerald-500" /> Order Items</h3>
                      <div className={`border rounded-2xl overflow-hidden ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                        <div className={`grid grid-cols-[auto_auto_auto_auto_auto] gap-x-6 px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b ${darkMode ? "bg-gray-800/60 border-gray-700 text-gray-500" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
                          <span>Item</span>
                          <span className="text-center">From</span>
                          <span className="text-center">Qty</span>
                          <span className="text-center">Unit Price</span>
                          <span className="text-center">Total</span>
                        </div>
                        {selectedOrder.orderItems?.length > 0 ? selectedOrder.orderItems.map((item, index) => (
                          <div key={index} className={`grid grid-cols-[auto_auto_auto_auto_auto] gap-x-6 items-center px-4 py-2.5 border-b last:border-b-0 ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                            <div className={`font-semibold text-xs ${darkMode ? "text-white" : "text-gray-900"}`}>{safe(item.productName)}</div>
                            <div className={`text-xs whitespace-nowrap ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{safe(item.shopName)}</div>
                            <div className={`text-center text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{safe(item.quantity)}</div>
                            <div className={`text-right text-sm font-medium whitespace-nowrap ${darkMode ? "text-gray-300" : "text-gray-700"}`}>EGP {Number(item.priceAtCheckout || 0).toFixed(2)}</div>
                            <div className={`text-right font-bold text-sm whitespace-nowrap ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>EGP {(Number(item.priceAtCheckout) * Number(item.quantity)).toFixed(2)}</div>
                          </div>
                        )) : <div className={`p-10 text-center text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No items</div>}
                        <div className={`px-4 py-4 flex justify-between items-center border-t ${darkMode ? "bg-gray-800/60 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                          <span className={`uppercase text-xs tracking-widest font-medium ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Grand Total</span>
                          <span className={`text-2xl font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>EGP {safe(selectedOrder.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 sm:p-6 border-t flex justify-end gap-3 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIsOrderModalOpen(false)} className={`px-6 py-2.5 rounded-xl font-bold transition text-sm ${darkMode ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Close</motion.button>
                  </div>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog open={isRepairModalOpen} onClose={() => setIsRepairModalOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <DialogPanel className={`relative transform overflow-hidden rounded-t-md sm:rounded-md text-left shadow-2xl w-full sm:max-w-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {selectedRepair && (
                <div className="lime-scroll max-h-[85dvh] overflow-y-auto">
                 
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className={`w-10 h-1 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`} /></div>
                  <div className={`px-5 sm:px-7 pt-5 pb-4 border-b flex items-center justify-between ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiTool className="text-emerald-500" /> Repair #{safe(selectedRepair.id).slice(0, 8)}</DialogTitle>
                    <button onClick={() => setIsRepairModalOpen(false)} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiXCircle className="w-5 h-5" /></button>
                  </div>
                  <div className="px-5 sm:px-7 py-5 space-y-4">
                    <ProgressBar progress={getRepairProgress(selectedRepair.status)} status={selectedRepair.status} darkMode={darkMode} />
                    <div className={`rounded-2xl p-4 space-y-3.5 ${darkMode ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-500/15" : "bg-emerald-100"}`}><FiHome className="text-emerald-500" /></div>
                        <div><p className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Shop</p><p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedRepair.shopName}</p></div>
                      </div>
                      {!isEmptyVal(selectedRepair.description) && <div><p className={`text-xs uppercase tracking-widest font-medium mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Issue Description</p><p className={`leading-relaxed text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{selectedRepair.description}</p></div>}
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className={`text-xs uppercase tracking-widest font-medium mb-0.5 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Status</p><p className={`font-bold capitalize text-sm ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{selectedRepair.status?.replace("_", " ")}</p></div>
                        {!isEmptyVal(selectedRepair.price) && <div><p className={`text-xs uppercase tracking-widest font-medium mb-0.5 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Quote</p><p className={`text-xl font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{selectedRepair.price} EGP</p></div>}
                      </div>
                    </div>
                    {(!isEmptyVal(selectedRepair.paymentMethod) || !isEmptyVal(selectedRepair.price)) && (
                      <div className={`flex justify-between items-center p-3.5 rounded-xl border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
                        {!isEmptyVal(selectedRepair.paymentMethod) && <div><p className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Payment Method</p><p className={`font-bold text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{selectedRepair.paymentMethod}</p></div>}
                        {!isEmptyVal(selectedRepair.price) && <div className="text-right"><p className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Total</p><p className={`text-lg font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{selectedRepair.price} EGP</p></div>}
                      </div>
                    )}
                  </div>
                  <div className={`border-t px-5 sm:px-7 py-4 flex justify-end ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIsRepairModalOpen(false)} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-md transition-all text-sm">Close</motion.button>
                  </div>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog open={isEditRepairModalOpen} onClose={() => setIsEditRepairModalOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <DialogPanel className={`relative transform overflow-hidden rounded-t-md sm:rounded-md text-left shadow-2xl w-full sm:max-w-md border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {editingRepair && (
                <div>
                 
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className={`w-10 h-1 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`} /></div>
                  <div className={`flex items-center justify-between px-5 sm:px-7 py-4 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiEdit className="text-emerald-500" /> Edit Repair</DialogTitle>
                    <button onClick={() => { setIsEditRepairModalOpen(false); setEditingRepair(null); }} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiX className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleUpdateRepairDescription} className="p-5 sm:p-7 space-y-5">
                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Device Category</label>
                      <div className="relative">
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`${inputCls} appearance-none`}>
                          <option value="">Select category</option>
                          {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <div className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}><FiChevronRight className="rotate-90" size={13} /></div>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Description</label>
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={5} placeholder="Describe the issue..." className={`${inputCls} resize-y min-h-[100px]`} required />
                    </div>
                    <div className="flex gap-3">
                      <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => { setIsEditRepairModalOpen(false); setEditingRepair(null); }} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Cancel</motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm"><FiCheck size={13} /> Save</motion.button>
                    </div>
                  </form>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <ConfirmRepairModal open={isConfirmRepairOpen} onClose={() => setIsConfirmRepairOpen(false)} req={confirmRepairReq} token={token} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['repairs'] })} darkMode={darkMode} />
    </div>
  );
};

AccountContent.displayName = 'AccountContent';

export default function Account(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AccountContent {...props} />
    </QueryClientProvider>
  );
}