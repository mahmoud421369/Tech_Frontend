import React, { useState, useEffect, useCallback, memo, useMemo, useTransition, useRef, createContext, useContext } from "react";
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
  FiGlobe,
  FiLock,
  FiMonitor,
  FiActivity,
  FiAlertTriangle,
  FiDownload,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiLogOut,
  FiClock,
  FiEye,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { RiLogoutBoxRLine, RiVerifiedBadgeLine, RiStarFill } from "react-icons/ri";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";




export const AppSettingsContext = createContext({
  darkMode: false,
  setDarkMode: () => {},
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export const useAppSettings = () => useContext(AppSettingsContext);




const TRANSLATIONS = {
  en: {
    myAccount: "My Account", dashboard: "Dashboard", settings: "Settings",
    profile: "Profile", addresses: "Addresses", orders: "Orders", repairs: "Repairs",
    notifications: "Notifications", security: "Security",
    editProfile: "Edit Profile", saveChanges: "Save Changes", cancel: "Cancel",
    firstName: "First Name", lastName: "Last Name", phone: "Phone Number",
    email: "Email", accountStatus: "Account Status", active: "Active", inactive: "Inactive",
    logout: "Logout", deleteAccount: "Delete Account",
    addAddress: "Add Address", editAddress: "Edit Address", deleteAddress: "Delete Address",
    addressInfo: "Address Information", pickOnMap: "Pick on Map",
    state: "State / Governorate", city: "City", street: "Street", building: "Building / Apartment",
    notes: "Additional Notes (optional)", setDefault: "Set as default address",
    noAddresses: "No saved addresses yet", noOrders: "No orders placed yet", noRepairs: "No repair requests yet",
    noNotifications: "No notifications yet", details: "Details", cancelOrder: "Cancel Order",
    viewRepair: "View", editRepair: "Edit", acceptQuote: "Accept Quote", cancelRepair: "Cancel Request",
    downloadInvoice: "Download Invoice", filterStatus: "Filter by Status",
    filterDate: "Filter by Date", searchPlaceholder: "Search...",
    all: "All", orderStatuses: { PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing", FINISHPROCESSING: "Finish Processing", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled" },
    repairStatuses: { SUBMITTED: "Submitted", QUOTE_SENT: "Quote Sent", QUOTE_APPROVED: "Quote Approved", QUOTE_REJECTED: "Quote Rejected", DEVICE_COLLECTED: "Device Collected", REPAIRING: "Repairing", REPAIR_COMPLETED: "Repair Completed", DEVICE_DELIVERED: "Device Delivered", CANCELLED: "Cancelled", FAILED: "Failed" },
    activeSessions: "Active Sessions", accountActivity: "Account Activity Log", dangerZone: "Danger Zone",
    currentSession: "Current Session", thisDevice: "This Device",
    deleteAccountWarning: "This action is irreversible. All your data will be permanently deleted.",
    confirmDelete: "Yes, Delete My Account", deleteNotification: "Delete",
    unread: "Unread",
    personalDashboard: "Your personal dashboard",
    manageParagraph: "Manage your profile, addresses, orders, and repair requests — all in one place.",
    dailyActivity: "Daily activity", activeUsers: "Active users", avgRating: "Avg rating",
    quickStats: "Quick Stats", myProfile: "My Profile",
    confirmRepair: "Confirm Repair Order", deliveryAddress: "Delivery Address",
    deliveryMethod: "Delivery Method", paymentMethod: "Payment Method",
    homeDelivery: "Home Delivery", visitShop: "Visit Shop", courier: "Courier",
    cash: "Cash", creditCard: "Credit Card", confirm: "Confirm", processing: "Processing...",
    useMylocation: "Use My Location", clickToSet: "Click on the map or drag the pin to set your location",
    update: "Update", save: "Save", inUse: "In Use", usedInActive: "Used in active order/repair",
    default: "Default", orderItems: "Order Items", grandTotal: "Grand Total",
    shop: "Shop", issueDescription: "Issue Description", status: "Status", quote: "Quote",
    total: "Total", close: "Close", deviceCategory: "Device Category", description: "Description",
    describeIssue: "Describe the issue...", noItems: "No items",
    orderDate: "Order Date", from: "From", payWith: "Pay with",
    redirectPayment: "You'll be redirected to a secure payment gateway.",
    noAddressFound: "No addresses found. Please add one in your profile.",
    loadingMap: "Loading map...",
    stillNeedManual: "You still need to fill in the manual address fields. Switch to Manual Entry to complete the street details.",
    language: "Language", darkModeLabel: "Dark Mode",
    sessionInfo: "Session Information", ipAddress: "IP Address", browser: "Browser",
    location: "Location", lastActive: "Last Active", terminate: "Terminate",
    activityType: "Activity", activityTime: "Time", activityDetails: "Details",
    login: "Login", passwordChange: "Password Changed", profileUpdate: "Profile Updated",
    addressAdded: "Address Added",
  },
  ar: {
    myAccount: "حسابي", dashboard: "لوحة التحكم", settings: "الإعدادات",
    profile: "الملف الشخصي", addresses: "العناوين", orders: "الطلبات", repairs: "الإصلاحات",
    notifications: "الإشعارات", security: "الأمان",
    editProfile: "تعديل الملف", saveChanges: "حفظ التغييرات", cancel: "إلغاء",
    firstName: "الاسم الأول", lastName: "اسم العائلة", phone: "رقم الهاتف",
    email: "البريد الإلكتروني", accountStatus: "حالة الحساب", active: "نشط", inactive: "غير نشط",
    logout: "تسجيل الخروج", deleteAccount: "حذف الحساب",
    addAddress: "إضافة عنوان", editAddress: "تعديل العنوان", deleteAddress: "حذف العنوان",
    addressInfo: "معلومات العنوان", pickOnMap: "اختر على الخريطة",
    state: "المحافظة / الولاية", city: "المدينة", street: "الشارع", building: "المبنى / الشقة",
    notes: "ملاحظات إضافية (اختياري)", setDefault: "تعيين كعنوان افتراضي",
    noAddresses: "لا توجد عناوين محفوظة", noOrders: "لا توجد طلبات بعد", noRepairs: "لا توجد طلبات إصلاح",
    noNotifications: "لا توجد إشعارات", details: "التفاصيل", cancelOrder: "إلغاء الطلب",
    viewRepair: "عرض", editRepair: "تعديل", acceptQuote: "قبول العرض", cancelRepair: "إلغاء الطلب",
    downloadInvoice: "تحميل الفاتورة", filterStatus: "تصفية حسب الحالة",
    filterDate: "تصفية حسب التاريخ", searchPlaceholder: "بحث...",
    all: "الكل",
    orderStatuses: { PENDING: "قيد الانتظار", CONFIRMED: "مؤكد", PROCESSING: "جارٍ المعالجة", FINISHPROCESSING: "اكتملت المعالجة", SHIPPED: "تم الشحن", DELIVERED: "تم التسليم", CANCELLED: "ملغي" },
    repairStatuses: { SUBMITTED: "مُقدَّم", QUOTE_SENT: "تم إرسال العرض", QUOTE_APPROVED: "تم قبول العرض", QUOTE_REJECTED: "تم رفض العرض", DEVICE_COLLECTED: "تم استلام الجهاز", REPAIRING: "جارٍ الإصلاح", REPAIR_COMPLETED: "اكتمل الإصلاح", DEVICE_DELIVERED: "تم تسليم الجهاز", CANCELLED: "ملغي", FAILED: "فشل" },
    activeSessions: "الجلسات النشطة", accountActivity: "سجل نشاط الحساب", dangerZone: "منطقة الخطر",
    currentSession: "الجلسة الحالية", thisDevice: "هذا الجهاز",
    deleteAccountWarning: "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك بشكل دائم.",
    confirmDelete: "نعم، احذف حسابي", deleteNotification: "حذف",
    unread: "غير مقروء",
    personalDashboard: "لوحتك الشخصية",
    manageParagraph: "أدر ملفك الشخصي وعناوينك وطلباتك وطلبات الإصلاح — كل ذلك في مكان واحد.",
    dailyActivity: "النشاط اليومي", activeUsers: "المستخدمون النشطون", avgRating: "متوسط التقييم",
    quickStats: "إحصائيات سريعة", myProfile: "ملفي الشخصي",
    confirmRepair: "تأكيد طلب الإصلاح", deliveryAddress: "عنوان التسليم",
    deliveryMethod: "طريقة التسليم", paymentMethod: "طريقة الدفع",
    homeDelivery: "توصيل للمنزل", visitShop: "زيارة المتجر", courier: "مندوب توصيل",
    cash: "نقداً", creditCard: "بطاقة ائتمان", confirm: "تأكيد", processing: "جارٍ المعالجة...",
    useMylocation: "استخدم موقعي", clickToSet: "انقر على الخريطة أو اسحب الدبوس لتحديد موقعك",
    update: "تحديث", save: "حفظ", inUse: "قيد الاستخدام", usedInActive: "مستخدم في طلب نشط",
    default: "افتراضي", orderItems: "عناصر الطلب", grandTotal: "المجموع الكلي",
    shop: "المتجر", issueDescription: "وصف المشكلة", status: "الحالة", quote: "العرض",
    total: "الإجمالي", close: "إغلاق", deviceCategory: "فئة الجهاز", description: "الوصف",
    describeIssue: "صف المشكلة...", noItems: "لا توجد عناصر",
    orderDate: "تاريخ الطلب", from: "من", payWith: "ادفع بـ",
    redirectPayment: "سيتم تحويلك إلى بوابة دفع آمنة.",
    noAddressFound: "لم يتم العثور على عناوين. يرجى إضافة واحد في ملفك الشخصي.",
    loadingMap: "جارٍ تحميل الخريطة...",
    stillNeedManual: "لا تزال بحاجة إلى ملء حقول العنوان اليدوية. انتقل إلى الإدخال اليدوي لإكمال تفاصيل الشارع.",
    language: "اللغة", darkModeLabel: "الوضع الداكن",
    sessionInfo: "معلومات الجلسة", ipAddress: "عنوان IP", browser: "المتصفح",
    location: "الموقع", lastActive: "آخر نشاط", terminate: "إنهاء",
    activityType: "النشاط", activityTime: "الوقت", activityDetails: "التفاصيل",
    login: "تسجيل دخول", passwordChange: "تغيير كلمة المرور", profileUpdate: "تحديث الملف الشخصي",
    addressAdded: "إضافة عنوان",
  }
};

const queryClient = new QueryClient();




const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  /* Apply Cairo font globally when RTL (Arabic) */
  html[dir="rtl"],
  html[dir="rtl"] body,
  html[dir="rtl"] * {
    font-family: 'Cairo', sans-serif !important;
  }

  /* Light gray scrollbars everywhere */
  * {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }
  *::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  *::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 999px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  .lime-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .lime-scroll::-webkit-scrollbar-track { background: transparent; }
  .lime-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  .lime-scroll { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
  .tabs-scroll::-webkit-scrollbar { display: none; }
  .tabs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  .leaflet-container { font-family: inherit; }
  [dir="rtl"] .rtl-flip { transform: scaleX(-1); }
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


const ProgressBar = memo(({ progress, status }) => {
  if (progress === -1) return (
    <div className="mt-2 mb-1">
      <div className="h-1.5 w-full rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" />
      </div>
      <p className="text-[9px] text-red-500 font-semibold mt-0.5 uppercase tracking-wide">{status?.replace(/_/g, " ")}</p>
    </div>
  );
  return (
    <div className="mt-2 mb-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-bold text-lime-600 dark:text-lime-400 uppercase tracking-wide">{status?.replace(/_/g," ")}</span>
        <span className="text-[9px] font-bold text-gray-400">{progress}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500"
        />
      </div>
    </div>
  );
});



const WaveBottom = memo(({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="relative block w-full h-10 md:h-20" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z" fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));

const WaveTop = memo(({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="relative block w-full h-8 md:h-16" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z" fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));

const StatCard = memo(({ icon, value, label, accent, delay, darkMode }) => (
  <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, delay }} viewport={{ once: true }} whileHover={{ y: -4, scale: 1.02 }}
    className={`relative group overflow-hidden rounded-xl p-3 sm:p-4 shadow-lg border transition-all duration-300 ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white/90 border-gray-100"}`}>
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
    <div className="flex items-center gap-2 mb-1">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>{icon}</div>
      <span className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
    </div>
    <p className={`text-[10px] sm:text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
  </motion.div>
));

const LoadingSpinner = memo(() => (
  <div className="flex justify-center items-center py-16">
    <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
  </div>
));

const StatusBadge = memo(({ status, type = "order" }) => {
  const orderMap = { DELIVERED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-700", CONFIRMED: "bg-blue-100 text-blue-700", SHIPPED: "bg-purple-100 text-purple-700", PROCESSING: "bg-cyan-100 text-cyan-700", FINISHPROCESSING: "bg-teal-100 text-teal-700" };
  const repairMap = { DEVICE_DELIVERED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-700", FAILED: "bg-red-100 text-red-700", QUOTE_APPROVED: "bg-emerald-100 text-emerald-700", QUOTE_SENT: "bg-purple-100 text-purple-700", QUOTE_REJECTED: "bg-red-100 text-red-700", REPAIRING: "bg-cyan-100 text-cyan-700", REPAIR_COMPLETED: "bg-teal-100 text-teal-700", DEVICE_COLLECTED: "bg-blue-100 text-blue-700" };
  const map = type === "repair" ? repairMap : orderMap;
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${map[status] || "bg-amber-100 text-amber-700"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
});

const Pagination = memo(({ page, total, setPage, darkMode }) => (
  <div className="flex justify-center mt-8 gap-1.5 flex-wrap">
    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={`p-2 rounded-xl border transition-all ${page === 1 ? "opacity-40 cursor-not-allowed" : darkMode ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}><FiChevronLeft size={14} /></button>
    {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
      <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-xl font-bold text-sm transition-all border ${page === p ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-white border-transparent shadow-lg" : darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-700 hover:bg-lime-50"}`}>{p}</button>
    ))}
    <button onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page === total} className={`p-2 rounded-xl border transition-all ${page === total ? "opacity-40 cursor-not-allowed" : darkMode ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}><FiChevronRight size={14} /></button>
  </div>
));




const FilterBar = memo(({ statusOptions, statusFilter, setStatusFilter, dateFilter, setDateFilter, search, setSearch, darkMode, t }) => {
  const inputCls = `px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-lime-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-lime-500"}`;
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <div className="relative flex-1 min-w-[160px]">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} className={`${inputCls} pl-8 w-full`} />
      </div>
      <div className="relative">
        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={11} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} pl-8 pr-8 appearance-none cursor-pointer`}>
          <option value="">{t("all")}</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
      </div>
      <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={inputCls} />
      {(statusFilter || dateFilter || search) && (
        <button onClick={() => { setStatusFilter(""); setDateFilter(""); setSearch(""); }} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-bold border border-red-200 dark:border-red-800 hover:bg-red-100 transition-all">
          <FiX size={11} /> Clear
        </button>
      )}
    </div>
  );
});



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

  

  doc.setFillColor(132, 204, 22);
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
  doc.setFillColor(240, 253, 244);
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
  doc.setDrawColor(132, 204, 22);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 6;
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 163, 74);
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





const MapPicker = memo(({ latitude, longitude, onChange, darkMode, t }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const leafletReady = useLeaflet();
  const defaultLat = latitude && latitude !== 0 ? latitude : 30.0444;
  const defaultLng = longitude && longitude !== 0 ? longitude : 31.2357;

  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    if (mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { center: [defaultLat, defaultLng], zoom: 13, zoomControl: true });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 22, maxNativeZoom: 19, tileSize: 256, zoomOffset: 0, detectRetina: true,
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35))"><div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#84cc16,#10b981);transform:rotate(-45deg);border:3px solid white;display:flex;align-items:center;justify-content:center"><div style="width:10px;height:10px;border-radius:50%;background:white;transform:rotate(45deg)"></div></div><div style="width:2px;height:8px;background:linear-gradient(to bottom,#84cc16,transparent);margin-top:-2px"></div></div>`,
      className: "", iconSize: [36, 52], iconAnchor: [18, 52],
    });

    const marker = L.marker([defaultLat, defaultLng], { icon: customIcon, draggable: true }).addTo(map);
    marker.on("dragend", (e) => { const { lat, lng } = e.target.getLatLng(); onChange(lat, lng); });
    map.on("click", (e) => { const { lat, lng } = e.latlng; marker.setLatLng([lat, lng]); onChange(lat, lng); });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null; } };
  }, [leafletReady]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (latitude && longitude && (latitude !== 0 || longitude !== 0)) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
    }
  }, [latitude, longitude]);

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { const { latitude: lat, longitude: lng } = pos.coords; onChange(lat, lng); if (markerRef.current) markerRef.current.setLatLng([lat, lng]); if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 16); },
      () => Swal.fire({ title: "Location Error", text: "Could not get your location.", icon: "error", toast: true, position: "top-end", timer: 2000 })
    );
  };

  return (
    <div className="space-y-2">
      {!leafletReady && (
        <div className={`flex items-center justify-center h-64 rounded-xl border-2 border-dashed ${darkMode ? "border-gray-600 bg-gray-800/50" : "border-gray-300 bg-gray-50"}`}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
            <span className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("loadingMap")}</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className={`w-full rounded-xl overflow-hidden border-2 transition-all ${darkMode ? "border-gray-600" : "border-gray-200"} ${!leafletReady ? "hidden" : ""}`} style={{ height: "300px", zIndex: 0 }} />
      {leafletReady && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={handleLocateMe} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all">
            <FiNavigation size={12} /> {t("useMylocation")}
          </button>
          {(latitude !== 0 || longitude !== 0) && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold flex-1 truncate ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-lime-50 border-lime-200 text-lime-700"}`}>
              <FiLocation size={11} className="text-lime-500 flex-shrink-0" />
              <span className="truncate">{latitude?.toFixed(5)}, {longitude?.toFixed(5)}</span>
            </div>
          )}
        </div>
      )}
      <p className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{t("clickToSet")}</p>
    </div>
  );
});




const ConfirmRepairModal = memo(({ open, onClose, req, token, onSuccess, darkMode, t }) => {
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

  const selCls = `w-full px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`;
  const optBtn = (active) => `flex-1 py-2.5 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${active ? "border-lime-500 bg-lime-500 text-white" : darkMode ? "border-gray-600 text-gray-300 hover:border-lime-500/60" : "border-gray-200 text-gray-600 hover:border-lime-400"}`;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <DialogPanel className={`relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden ${darkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
          <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <DialogTitle className={`text-lg font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiCheckCircle className="text-lime-500" /> {t("confirmRepair")}</DialogTitle>
            <button onClick={onClose} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiX className="w-5 h-5" /></button>
          </div>
          {req && (
            <div className={`mx-5 mt-4 p-4 rounded-xl border ${darkMode ? "bg-gray-800/60 border-gray-700" : "bg-lime-50 border-lime-100"}`}>
              <p className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{req.shopName}</p>
              <p className="text-2xl font-black text-lime-600 mt-0.5">{req.price} <span className="text-sm font-medium">EGP</span></p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}><FiLocation className="inline mr-1 text-lime-500" /> {t("deliveryAddress")}</label>
              {addresses.length === 0 ? <p className="text-sm text-red-500 font-medium">{t("noAddressFound")}</p> : (
                <select value={selectedAddrId} onChange={(e) => setSelectedAddrId(e.target.value)} className={selCls} required>
                  {addresses.map((a) => <option key={a.id} value={a.id}>{a.street}, {a.building} — {a.city}{a.isDefault ? ` (${t("default")})` : ""}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}><FiTruck className="inline mr-1 text-lime-500" /> {t("deliveryMethod")}</label>
              <div className="flex gap-2">
                {[["HOME_DELIVERY", t("homeDelivery")], ["SHOP_VISIT", t("visitShop")], ["PICKUP", t("courier")]].map(([val, lbl]) => (
                  <button type="button" key={val} onClick={() => setDeliveryMethod(val)} className={optBtn(deliveryMethod === val)}>{lbl}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}><FiCreditCard className="inline mr-1 text-lime-500" /> {t("paymentMethod")}</label>
              <div className="flex gap-3">
                {[["CASH", t("cash")], ["CREDIT_CARD", t("creditCard")]].map(([val, lbl]) => (
                  <button type="button" key={val} onClick={() => setPaymentMethod(val)} className={optBtn(paymentMethod === val)}>{lbl}</button>
                ))}
              </div>
              {paymentMethod === "CREDIT_CARD" && <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}>{t("redirectPayment")}</p>}
            </div>
            <div className="flex gap-3 pt-1 pb-1">
              <button type="button" onClick={onClose} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t("cancel")}</button>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting || addresses.length === 0} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("processing")}</> : <><FiCheckCircle size={14} /> {t("confirm")}</>}
              </motion.button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
});




const ProfileTab = memo(({ isEditingProfile, setIsEditingProfile, userProfile, profileForm, setProfileForm, handleUpdateProfile, handleDeleteAccount, handleLogout, darkMode, isAuthenticated, inputCls, t }) => {
  if (isEditingProfile) return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white border-gray-100"}`}>
      <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
      <div className="p-5 sm:p-7">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}><FiEdit2 className="text-lime-500" /> {t("editProfile")}</h3>
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full border-4 border-lime-500/40 shadow-lg flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}><FiUser className="text-3xl text-lime-500" /></div>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t("firstName")}</label><input type="text" placeholder={t("firstName")} value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} className={inputCls} required /></div>
            <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t("lastName")}</label><input type="text" placeholder={t("lastName")} value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} className={inputCls} required /></div>
          </div>
          <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t("phone")}</label><input type="tel" placeholder={t("phone")} value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} required /></div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm"><FiCheck size={14} /> {t("saveChanges")}</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setIsEditingProfile(false)} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t("cancel")}</motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white border-gray-100"}`}>
      <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
          <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}><FiUser className="text-lime-500" /> {t("myProfile")}</h3>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsEditingProfile(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-3xl bg-green-500 font-bold text-sm text-white hover:bg-green-600 transition-all"><FiEdit2 size={13} /> {t("editProfile")}</motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleDeleteAccount} className="flex items-center gap-1.5 px-3 py-2 rounded-md border-2 border-red-400 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all"><FiTrash2 size={13} /></motion.button>
          </div>
        </div>
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full border-4 border-green-500/40 shadow-xl flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}><FiUser className="text-4xl text-green-500" /></div>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: <FiUser className="text-lime-500" />, value: `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}` },
            { icon: <FiMail className="text-lime-500" />, value: userProfile?.email },
            { icon: <FiPhone className="text-lime-500" />, value: userProfile?.phone || "— Not provided" },
          ].map((row, i) => (
            <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
              {row.icon}<span className={`font-medium text-sm truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{row.value}</span>
            </div>
          ))}
          <div className={`flex items-center flex-wrap justify-between gap-2 p-3.5 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
            <div className="flex items-center gap-3"><FiShield className="text-lime-500" /><span className={`font-medium text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{t("accountStatus")}</span></div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${userProfile?.activate ? "bg-lime-500/10 text-lime-600 border border-lime-500/30" : "bg-red-100 text-red-700"}`}>{userProfile?.activate ? `● ${t("active")}` : `● ${t("inactive")}`}</span>
          </div>
          {isAuthenticated && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout} className="w-full mt-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg transition-all text-sm">
              <RiLogoutBoxRLine size={16} /> {t("logout")}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
});




const AddressesTab = memo(({ isAddingAddress, setIsAddingAddress, editingAddressId, setEditingAddressId, addressForm, setAddressForm, handleUpdateAddress, handleAddAddress, resetAddressForm, addresses, startEditAddress, handleDeleteAddress, isAddressInUse, darkMode, inputCls, t }) => {
  const [addressInputMode, setAddressInputMode] = useState("manual");
  const handleMapChange = useCallback((lat, lng) => { setAddressForm((prev) => ({ ...prev, latitude: lat, longitude: lng })); }, [setAddressForm]);

  if (isAddingAddress || editingAddressId) return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white border-gray-100"}`}>
      <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
      <div className="p-5 sm:p-7">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-5 ${darkMode ? "text-white" : "text-gray-900"}`}><FiMapPin className="text-lime-500" /> {editingAddressId ? t("editAddress") : t("addAddress")}</h3>
        <div className={`flex gap-1 p-1 rounded-xl mb-5 ${darkMode ? "bg-gray-700/60" : "bg-gray-100"}`}>
          <button type="button" onClick={() => setAddressInputMode("manual")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${addressInputMode === "manual" ? "bg-green-500 text-white shadow-md" : darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}><FiList size={13} /> {t("addressInfo")}</button>
          <button type="button" onClick={() => setAddressInputMode("map")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${addressInputMode === "map" ? "bg-green-500 text-white shadow-md" : darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}><FiNavigation size={13} /> {t("pickOnMap")}</button>
        </div>
        <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-4">
          <AnimatePresence mode="wait">
            {addressInputMode === "manual" ? (
              <motion.div key="manual" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ label: t("state"), key: "state", ph: "e.g., Cairo" }, { label: t("city"), key: "city", ph: "e.g., Giza" }, { label: t("street"), key: "street", ph: "e.g., Tahrir Street" }, { label: t("building"), key: "building", ph: "e.g., Bldg 12" }].map(({ label, key, ph }) => (
                    <div key={key}><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{label}</label><input type="text" placeholder={ph} value={addressForm[key]} onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })} className={inputCls} required /></div>
                  ))}
                </div>
                <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t("notes")}</label><textarea placeholder={t("notes")} value={addressForm.notes} onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })} className={`${inputCls} resize-none`} rows={3} /></div>
              </motion.div>
            ) : (
              <motion.div key="map" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
                <MapPicker latitude={addressForm.latitude} longitude={addressForm.longitude} onChange={handleMapChange} darkMode={darkMode} t={t} />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Latitude</label><input type="number" step="any" placeholder="0.00000" value={addressForm.latitude || ""} onChange={(e) => setAddressForm({ ...addressForm, latitude: parseFloat(e.target.value) || 0 })} className={inputCls} /></div>
                  <div><label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Longitude</label><input type="number" step="any" placeholder="0.00000" value={addressForm.longitude || ""} onChange={(e) => setAddressForm({ ...addressForm, longitude: parseFloat(e.target.value) || 0 })} className={inputCls} /></div>
                </div>
                <div className={`p-3 rounded-xl border text-xs font-medium ${darkMode ? "bg-blue-900/20 border-blue-800/40 text-blue-400" : "bg-blue-50 border-blue-100 text-blue-600"}`}><FiInfo className="inline mr-1.5" size={11} />{t("stillNeedManual")}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="w-4 h-4 rounded accent-lime-500" />
            <span className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t("setDefault")}</span>
          </label>
          <div className="flex gap-3 pt-1">
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm"><FiCheck size={13} /> {editingAddressId ? t("update") : t("save")}</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => { resetAddressForm(); setAddressInputMode("manual"); }} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t("cancel")}</motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}><FiMapPin className="text-lime-500" /> {t("addresses")}</h3>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsAddingAddress(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-3xl border-2 border-green-500 text-green-600 dark:text-green-400 font-bold text-sm hover:bg-green-500 hover:text-white transition-all"><FiPlus size={13} /> {t("addAddress")}</motion.button>
      </div>
      {addresses.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}><FiMapPin className="mx-auto text-5xl text-gray-300 mb-3" /><p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{t("noAddresses")}</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const inUse = isAddressInUse(addr.id);
            return (
              <motion.div key={addr.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
                className={`relative rounded-2xl shadow-md hover:shadow-xl border-2 transition-all duration-300 overflow-hidden ${addr.isDefault ? (darkMode ? "border-lime-500 bg-gray-800/80" : "border-lime-500 bg-white") : (darkMode ? "border-gray-700 bg-gray-800/80" : "border-gray-200 bg-white")}`}>
                <div className={`h-1 ${addr.isDefault ? "bg-gradient-to-r from-lime-500 to-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                {addr.isDefault && <span className="absolute top-3 right-3 flex items-center gap-1 bg-lime-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md"><RiVerifiedBadgeLine size={10} /> {t("default")}</span>}
                <div className="p-4 sm:p-5">
                  <h4 className={`text-base font-bold mb-0.5 pr-16 ${darkMode ? "text-white" : "text-gray-900"}`}>{addr.street}, {addr.building}</h4>
                  <p className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{addr.city}, {addr.state}</p>
                  {addr.notes && <p className={`text-xs italic px-3 py-2 rounded-xl mb-3 ${darkMode ? "bg-gray-700/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>"{addr.notes}"</p>}
                  {(addr.latitude !== undefined && addr.latitude !== 0) && <p className={`text-[10px] mb-3 flex items-center gap-1 font-mono ${darkMode ? "text-gray-500" : "text-gray-400"}`}><FiNavigation size={9} className="text-lime-500" />{addr.latitude?.toFixed(5)}, {addr.longitude?.toFixed(5)}</p>}
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => !inUse && startEditAddress(addr)} disabled={inUse} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-bold text-xs transition-all ${inUse ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400" : "border-lime-500 text-lime-600 dark:text-lime-400 hover:bg-lime-500 hover:text-white"}`}><FiEdit2 size={11} /> {inUse ? t("inUse") : t("editRepair")}</motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => !inUse && handleDeleteAddress(addr.id)} disabled={inUse} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-bold text-xs transition-all ${inUse ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400" : "border-red-400 text-red-500 hover:bg-red-500 hover:text-white"}`}><FiTrash2 size={11} /></motion.button>
                  </div>
                  {inUse && <p className="text-[10px] mt-2 text-amber-500 font-semibold flex items-center gap-1"><FiInfo size={10} /> {t("usedInActive")}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
});




const OrdersTab = memo(({ orders, ordersPage, setOrdersPage, setSelectedOrder, setIsOrderModalOpen, handleCancelOrder, darkMode, t }) => {
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const ipp = 3;

  const filtered = useMemo(() => orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (dateFilter && !new Date(o.createdAt).toISOString().startsWith(dateFilter)) return false;
    if (search && !o.id?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [orders, statusFilter, dateFilter, search]);

  const total = Math.ceil(filtered.length / ipp);
  const pageOrders = filtered.slice((ordersPage - 1) * ipp, ordersPage * ipp);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}><FiBox className="text-lime-500" /> {t("orders")}</h3>
      <FilterBar statusOptions={Object.keys(TRANSLATIONS.en.orderStatuses)} statusFilter={statusFilter} setStatusFilter={setStatusFilter} dateFilter={dateFilter} setDateFilter={setDateFilter} search={search} setSearch={setSearch} darkMode={darkMode} t={t} />
      {filtered.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}><FiBox className="mx-auto text-5xl text-gray-300 mb-3" /><p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{t("noOrders")}</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageOrders.map((order) => {
              const isDelivered = order.status === "DELIVERED";
              const isCancelled = order.status === "CANCELLED";
              const progress = getOrderProgress(order.status);
              return (
                <motion.div key={order.id} whileHover={{ y: -3 }} className={`rounded-2xl shadow-md hover:shadow-xl border transition-all overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-teal-500" />
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div><p className="font-mono text-[10px] text-lime-600 dark:text-lime-400 tracking-[2px] uppercase">ORD #{order.id.slice(0, 6)}</p><p className={`text-base font-bold mt-0.5 ${darkMode ? "text-white" : "text-gray-900"}`}>{t("orders")}</p></div>
                      <StatusBadge status={order.status} type="order" />
                    </div>
                    <ProgressBar progress={progress} status={order.status} />
                    <div className="mb-3 mt-1 space-y-1.5">
                      <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}><FiCalendar className="text-lime-500 flex-shrink-0" size={11} />{new Date(order.createdAt).toLocaleDateString("en-EG", { month: "short", day: "numeric", year: "numeric" })}</div>
                      <div className="flex items-center gap-2 text-lime-600 dark:text-lime-400 text-xs"><FiCreditCard size={11} className="flex-shrink-0" /><span className="font-medium uppercase tracking-wide">{order.paymentMethod?.replace("_", " ")}</span></div>
                    </div>
                    <div className="mb-3"><span className="text-2xl sm:text-3xl font-black text-lime-600 dark:text-lime-400">{order.totalPrice}</span><span className={`text-xs ml-1 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>EGP</span></div>
                    <div className="flex gap-2 mt-auto flex-wrap">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }} className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"><FiInfo size={11} /> {t("details")}</motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => generateInvoicePDF(order)} className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"><FiDownload size={11} /> PDF</motion.button>
                      {!isDelivered && !isCancelled && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleCancelOrder(order.id)} className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-gray-700 text-red-600 dark:text-red-400 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"><FiXCircle size={11} /> {t("cancelOrder")}</motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {total > 1 && <Pagination page={ordersPage} total={total} setPage={setOrdersPage} darkMode={darkMode} />}
        </>
      )}
    </motion.div>
  );
});




const RepairsTab = memo(({ repairRequests, repairsPage, setRepairsPage, handleViewRepair, handleEditRepair, handleAcceptQuote, handleCancelRepair, darkMode, t }) => {
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const ipp = 3;

  const filtered = useMemo(() => repairRequests.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (dateFilter && !new Date(r.createdAt).toISOString().startsWith(dateFilter)) return false;
    if (search && !(r.shopName?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()) || r.id?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [repairRequests, statusFilter, dateFilter, search]);

  const totalPages = Math.ceil(filtered.length / ipp);
  const pageRepairs = filtered.slice((repairsPage - 1) * ipp, repairsPage * ipp);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}><FiTool className="text-lime-500" /> {t("repairs")}</h3>
      <FilterBar statusOptions={Object.keys(TRANSLATIONS.en.repairStatuses)} statusFilter={statusFilter} setStatusFilter={setStatusFilter} dateFilter={dateFilter} setDateFilter={setDateFilter} search={search} setSearch={setSearch} darkMode={darkMode} t={t} />
      {filtered.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}><FiTool className="mx-auto text-5xl text-gray-300 mb-3" /><p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{t("noRepairs")}</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageRepairs.map((req) => {
              const isQuoteSent = req.status === "QUOTE_SENT";
              const canCancel = ["QUOTE_APPROVED", "QUOTE_SENT", "SUBMITTED"].includes(req.status);
              const hasPrice = req.price;
              const progress = getRepairProgress(req.status);
              return (
                <motion.div key={req.id} whileHover={{ y: -3 }} className={`rounded-2xl shadow-md hover:shadow-xl border transition-all overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-teal-500" />
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0"><p className="font-mono text-[10px] text-lime-600 dark:text-lime-400 tracking-[2px] uppercase">REQ #{req.id.slice(0, 6)}</p><p className={`text-base font-bold mt-0.5 truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{req.shopName}</p></div>
                      <StatusBadge status={req.status} type="repair" />
                    </div>
                    <ProgressBar progress={progress} status={req.status} />
                    <p className={`text-xs sm:text-sm line-clamp-2 mb-3 mt-1 flex-1 leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{req.description}</p>
                    {hasPrice && <div className="mb-3 flex items-end gap-1"><span className="text-2xl font-black text-lime-600 dark:text-lime-400">{req.price}</span><span className={`text-xs mb-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>EGP</span></div>}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleViewRepair(req.id)} className="bg-blue-50 hover:bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"><FiInfo size={10} /> {t("viewRepair")}</motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleEditRepair(req)} className="bg-amber-50 hover:bg-amber-100 dark:bg-gray-700 text-amber-600 dark:text-amber-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"><FiEdit size={10} /> {t("editRepair")}</motion.button>
                      {isQuoteSent && hasPrice && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleAcceptQuote(req)} className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"><FiCheckCircle size={10} /> {t("acceptQuote")}</motion.button>
                      )}
                      {canCancel && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleCancelRepair(req.id)} className="col-span-2 bg-red-50 hover:bg-red-100 dark:bg-gray-700 text-red-600 dark:text-red-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"><FiXCircle size={10} /> {t("cancelRepair")}</motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {totalPages > 1 && <Pagination page={repairsPage} total={totalPages} setPage={setRepairsPage} darkMode={darkMode} />}
        </>
      )}
    </motion.div>
  );
});



const NotificationsTab = memo(({ token, darkMode, t }) => {
  const queryClient = useQueryClient();
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

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <FiBell className="text-lime-500" /> {t("notifications")}
          {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h3>
      </div>
      {isLoading ? <LoadingSpinner /> : notifications.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}>
          <FiBell className="mx-auto text-5xl text-gray-300 mb-3" />
          <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-2xl border p-4 sm:p-5 transition-all bg-white ${darkMode ? "border-gray-700" : "border-gray-200"} shadow-sm`}>
              {!notif.read && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-lime-500 rounded-full animate-pulse" />}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-gray-100">
                  <FiBell className="text-lime-500" size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{notif.title || notif.subject || "Notification"}</p>
                  <p className="text-xs mt-0.5 leading-relaxed text-gray-500">{notif.message || notif.body}</p>
                  {notif.createdAt && <p className="text-[10px] mt-1.5 flex items-center gap-1 text-gray-400"><FiClock size={9} />{new Date(notif.createdAt).toLocaleString("en-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => deleteNotif(notif.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-red-50 text-red-500 hover:bg-red-100">
                  <FiTrash2 size={10} /> {t("deleteNotification")}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
});




const SecurityTab = memo(({ darkMode, handleDeleteAccount, handleLogout, token, t }) => {
  const mockSessions = [
    { id: "sess_1", device: "Chrome on Windows", ip: "102.45.67.89", location: "Cairo, Egypt", lastActive: new Date().toISOString(), current: true },
    { id: "sess_2", device: "Safari on iPhone", ip: "197.55.12.34", location: "Alexandria, Egypt", lastActive: new Date(Date.now() - 3600000).toISOString(), current: false },
  ];

  const mockActivity = [
    { id: 1, type: "login", details: "Login from Chrome on Windows", time: new Date().toISOString(), icon: <FiLogOut className="text-lime-500" />, color: "lime" },
    { id: 2, type: "profileUpdate", details: "Profile information updated", time: new Date(Date.now() - 86400000).toISOString(), icon: <FiUser className="text-blue-500" />, color: "blue" },
    { id: 3, type: "addressAdded", details: "New address added: Cairo, Tahrir St.", time: new Date(Date.now() - 172800000).toISOString(), icon: <FiMapPin className="text-purple-500" />, color: "purple" },
    { id: 4, type: "login", details: "Login from Safari on iPhone", time: new Date(Date.now() - 259200000).toISOString(), icon: <FiLogOut className="text-lime-500" />, color: "lime" },
  ];

  const [sessions, setSessions] = useState(mockSessions);

  const terminateSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    Swal.fire({ icon: "success", title: "Session terminated", toast: true, position: "top-end", timer: 1500, showConfirmButton: false });
  };

  const cardCls = `rounded-2xl border overflow-hidden ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white border-gray-100"} shadow-lg`;
  const sectionTitle = `text-lg font-extrabold flex items-center gap-2.5 mb-5 ${darkMode ? "text-white" : "text-gray-900"}`;

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
     
     
      <div className={cardCls}>
        <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
        <div className="p-5 sm:p-6">
          <h3 className={sectionTitle}><FiMonitor className="text-lime-500" /> {t("activeSessions")}</h3>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border ${session.current ? (darkMode ? "border-lime-600/40 bg-lime-900/20" : "border-lime-200 bg-lime-50") : (darkMode ? "border-gray-700 bg-gray-700/30" : "border-gray-100 bg-gray-50")}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-600" : "bg-white"} shadow-sm`}><FiMonitor className={session.current ? "text-lime-500" : "text-gray-400"} size={16} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{session.device}</p>
                      {session.current && <span className="text-[9px] bg-lime-500 text-white px-2 py-0.5 rounded-full font-extrabold uppercase">{t("currentSession")}</span>}
                    </div>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{session.ip} · {session.location}</p>
                    <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}><FiClock size={9} /> {t("lastActive")}: {new Date(session.lastActive).toLocaleString("en-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                {!session.current && (
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => terminateSession(session.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-800 hover:bg-red-100 transition-all">
                    <FiLogOut size={11} /> {t("terminate")}
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      
      
      <div className={cardCls}>
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="p-5 sm:p-6">
          <h3 className={sectionTitle}><FiActivity className="text-blue-500" /> {t("accountActivity")}</h3>
          <div className="relative">
            <div className={`absolute left-5 top-0 bottom-0 w-px ${darkMode ? "bg-gray-700" : "bg-gray-100"}`} />
            <div className="space-y-4">
              {mockActivity.map((item) => (
                <div key={item.id} className="flex gap-4 relative pl-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm ${darkMode ? "bg-gray-700" : "bg-white border border-gray-100"}`}>{item.icon}</div>
                  <div className={`flex-1 p-3 rounded-xl border ${darkMode ? "bg-gray-700/30 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                    <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{t(item.type) || item.type}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.details}</p>
                    <p className={`text-[10px] mt-1 flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}><FiClock size={9} />{new Date(item.time).toLocaleString("en-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

     
     
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-red-900/10 border-red-800/40" : "bg-red-50 border-red-200"} shadow-lg`}>
        <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600" />
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-extrabold flex items-center gap-2.5 mb-2 text-red-600 dark:text-red-400"><FiAlertTriangle /> {t("dangerZone")}</h3>
          <p className={`text-sm mb-5 ${darkMode ? "text-red-400/80" : "text-red-600/80"}`}>{t("deleteAccountWarning")}</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleDeleteAccount} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-lg hover:shadow-red-500/30 transition-all text-sm">
            <FiTrash2 size={14} /> {t("confirmDelete")}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});




const SettingsBar = memo(({ lang, setLang, t }) => (
  <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 rounded-2xl border mb-4 bg-white border-gray-200 shadow-sm dark:bg-gray-800/60 dark:border-gray-700">
    <div className="flex items-center gap-2">
      <FiGlobe className="text-lime-500" size={14} />
      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{t("language")}:</span>
      <button onClick={() => setLang("en")} className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${lang === "en" ? "bg-lime-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"}`}>EN</button>
      <button onClick={() => setLang("ar")} className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${lang === "ar" ? "bg-lime-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"}`}>عربي</button>
    </div>
  </div>
));




const AccountContent = ({ darkMode: externalDark, setDarkMode: externalSetDark }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const [internalDark, setInternalDark] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? JSON.parse(saved) : (externalDark ?? false);
  });
  const [internalLang, setInternalLang] = useState(() => localStorage.getItem("lang") || "en");

  const darkMode = externalDark !== undefined ? externalDark : internalDark;
  const setDarkMode = (val) => {
    if (externalSetDark) externalSetDark(val);
    setInternalDark(val);
    localStorage.setItem("darkMode", JSON.stringify(val));
    document.documentElement.classList.toggle("dark", val);
  };


  
  const setLang = (l) => {
    setInternalLang(l);
    localStorage.setItem("lang", l);
    document.documentElement.setAttribute("dir", l === "ar" ? "rtl" : "ltr");
   
    
    if (l === "ar") {
      document.documentElement.style.fontFamily = "'Cairo', sans-serif";
      document.body.style.fontFamily = "'Cairo', sans-serif";
    } else {
      document.documentElement.style.fontFamily = "";
      document.body.style.fontFamily = "";
    }
  };

  const lang = internalLang;
  const t = (key, sub) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (sub) return dict[key]?.[sub] || TRANSLATIONS.en[key]?.[sub] || sub;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    const currentLang = localStorage.getItem("lang") || "en";
    document.documentElement.setAttribute("dir", currentLang === "ar" ? "rtl" : "ltr");
    if (currentLang === "ar") {
      document.documentElement.style.fontFamily = "'Cairo', sans-serif";
      document.body.style.fontFamily = "'Cairo', sans-serif";
    }
  }, []);

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
  const formatDate = (d) => new Date(d).toLocaleString(lang === "ar" ? "ar-EG" : "en-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Cairo" });

  const inputCls = `w-full px-4 py-3 sm:py-3.5 rounded-xl border text-sm transition-all outline-none ${darkMode ? "bg-gray-800/70 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-lime-500 focus:border-lime-500" : "bg-white/70 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-lime-500 focus:border-lime-500"}`;

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

  useEffect(() => { document.title = "My Account | Tech-Restore"; }, []);

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
    const c = await Swal.fire({ title: t("deleteAccount") + "?", text: t("deleteAccountWarning"), icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: t("confirmDelete") });
    if (!c.isConfirmed) return;
    try { await api.delete("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } }); localStorage.removeItem("authToken"); navigate("/"); }
    catch { Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 }); }
  };

  const handleAddAddress = async (e) => { e.preventDefault(); try { await api.post("/api/users/addresses", { ...addressForm, latitude: addressForm.latitude || 0, longitude: addressForm.longitude || 0 }, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); resetAddressForm(); Swal.fire({ title: "Added!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Failed to add", icon: "error", toast: true, position: "top-end", timer: 1500 }); } };
  const handleUpdateAddress = async (e) => { e.preventDefault(); try { await api.put(`/api/users/addresses/${editingAddressId}`, { ...addressForm, latitude: addressForm.latitude || 0, longitude: addressForm.longitude || 0 }, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); resetAddressForm(); Swal.fire({ title: "Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Failed to update", icon: "error", toast: true, position: "top-end", timer: 1500 }); } };
  const handleDeleteAddress = useCallback(async (id) => { const c = await Swal.fire({ title: t("deleteAddress") + "?", icon: "warning", showCancelButton: true }); if (!c.isConfirmed) return; try { await api.delete(`/api/users/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); Swal.fire({ title: "Deleted!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 }); } }, [token, queryClient, t]);
  const handleCancelOrder = useCallback(async (id) => { const c = await Swal.fire({ title: t("cancelOrder") + "?", icon: "warning", showCancelButton: true }); if (!c.isConfirmed) return; try { await api.delete(`/api/users/orders/${id}/cancel`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['orders'] }); Swal.fire({ title: "Cancelled!", icon: "success", toast: true, position: "top-end", timer: 1500 }); } catch { Swal.fire({ title: "Error", text: "Failed to cancel", icon: "error", toast: true, position: "top-end", timer: 1500 }); } }, [token, queryClient, t]);
  const handleViewRepair = useCallback(async (id) => { try { const res = await api.get(`/api/users/repair-request/${id}`, { headers: { Authorization: `Bearer ${token}` } }); setSelectedRepair(res.data); setIsRepairModalOpen(true); } catch { Swal.fire({ title: "Error", text: "Failed to load", icon: "error" }); } }, [token]);
  const handleEditRepair = useCallback((req) => { setEditingRepair(req); setEditDescription(req.description || ""); setSelectedCategory(req.deviceCategory || ""); setIsEditRepairModalOpen(true); }, []);

  const handleUpdateRepairDescription = async (e) => {
    e.preventDefault();
    if (!editingRepair) return;
    try { await api.put(`/api/users/repair-request/${editingRepair.shopId}/${editingRepair.id}`, { description: editDescription, deviceCategory: selectedCategory.id }, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['repairs'] }); setIsEditRepairModalOpen(false); setEditingRepair(null); Swal.fire({ icon: "success", title: "Updated!", toast: true, position: "top-end", timer: 2500, showConfirmButton: false }); }
    catch { Swal.fire({ icon: "error", title: "Failed", toast: true, position: "top-end", timer: 2500, showConfirmButton: false }); }
  };

  const handleAcceptQuote = useCallback(async (req) => {
    const result = await Swal.fire({ title: t("acceptQuote") + "?", text: `Accept ${req.price} EGP from ${req.shopName}?`, icon: "question", showCancelButton: true, confirmButtonText: "Yes, Accept", confirmButtonColor: "#84cc16" });
    if (!result.isConfirmed) return;
    try { await api.put(`/api/users/repair-request/${req.id}/status`, { status: "QUOTE_APPROVED" }, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['repairs'] }); Swal.fire({ icon: "success", title: "Quote Accepted!", toast: true, position: "top-end", timer: 2000, showConfirmButton: false }); setConfirmRepairReq(req); setIsConfirmRepairOpen(true); }
    catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed to accept quote", "error"); }
  }, [token, queryClient, t]);

  const handleCancelRepair = useCallback(async (id) => {
    const result = await Swal.fire({ title: t("cancelRepair") + "?", icon: "warning", showCancelButton: true, confirmButtonText: "Yes, Cancel", confirmButtonColor: "#ef4444" });
    if (!result.isConfirmed) return;
    try { await api.delete(`/api/users/repair-request/${id}/cancel`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['repairs'] }); Swal.fire({ title: "Cancelled", icon: "success", toast: true, position: "top-end", timer: 2000 }); }
    catch { Swal.fire("Error", "Failed to cancel request", "error"); }
  }, [token, queryClient, t]);

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

  const heroStats = useMemo(() => [
    { icon: <FiZap size={13} />, value: "75.2%", label: t("dailyActivity"), accent: "#f97316", delay: 0.1 },
    { icon: <FiUsers size={13} />, value: "~20K", label: t("activeUsers"), accent: "#6366f1", delay: 0.2 },
    { icon: <RiStarFill size={13} />, value: "4.9★", label: t("avgRating"), accent: "#f59e0b", delay: 0.3 },
  ], [lang]);

  const { data: notificationsData = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const res = await api.get("/api/notifications/users", { headers: { Authorization: `Bearer ${token}` } }); return res.data.content || res.data || []; },
    enabled: !!token
  });
  const unreadNotifCount = notificationsData.filter(n => !n.read).length;

  const tabs = useMemo(() => [
    { id: "profile", label: t("profile"), icon: <FiUser size={14} />, badge: null },
    { id: "addresses", label: t("addresses"), icon: <FiMapPin size={14} />, badge: addresses.length || null },
    { id: "orders", label: t("orders"), icon: <FiBox size={14} />, badge: orders.length || null },
    { id: "repairs", label: t("repairs"), icon: <FiTool size={14} />, badge: repairRequests.length || null },
    { id: "notifications", label: t("notifications"), icon: <FiBell size={14} />, badge: unreadNotifCount || null },
    { id: "security", label: t("security"), icon: <FiLock size={14} />, badge: null },
  ], [addresses.length, orders.length, repairRequests.length, unreadNotifCount, lang]);

  const isRtl = lang === "ar";

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`} dir={isRtl ? "rtl" : "ltr"}>
      <style>{STYLES}</style>

     
     
      <section className={`relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-32 md:pt-24 md:pb-40 ${darkMode ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" : "bg-gradient-to-br from-lime-50 via-white to-emerald-50"}`}>
        <div className="absolute w-[350px] h-[350px] -top-28 -left-20 rounded-full blur-3xl opacity-20 bg-lime-400 animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
        <div className="absolute w-[250px] h-[250px] top-8 -right-12 rounded-full blur-3xl opacity-15 bg-emerald-500 animate-pulse pointer-events-none" style={{ animationDuration: "7s" }} />
        <WaveTop darkMode={darkMode} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-5 sm:space-y-6">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
                className="inline-flex items-center mt-6 gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-semibold bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400">
                <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" /> {t("personalDashboard")}
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1]">
                <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">{t("myAccount")}</span>
                <br /><span className={darkMode ? "text-white" : "text-gray-900"}>{t("dashboard")}</span>
                <br /><span className="hidden sm:inline" style={{ WebkitTextStroke: darkMode ? "2px #84cc16" : "2px #16a34a", color: "transparent" }}>& {t("settings")}</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className={`text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t("manageParagraph")}</motion.p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pt-1">
                {heroStats.map((s) => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
              </div>
            </div>
            <div className="relative hidden sm:block h-64 md:h-80 lg:h-[480px]">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-125" />
              <div className="relative w-full h-full">
                <motion.div initial={{ opacity: 0, rotate: 8, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 4, scale: 1.04 }}
                  className={`absolute top-8 left-6 w-40 sm:w-44 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
                  <div className="p-4 space-y-3">
                    <div className={`h-2.5 rounded w-20 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-2.5 rounded w-28 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="h-7 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-xl w-14" />
                    <div className="flex gap-2"><div className={`w-7 h-7 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`} /><div className="w-7 h-7 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full" /></div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.06, y: -4 }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-36 sm:w-40 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
                  <div className="p-4">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"><FiUser className="text-lime-400 text-3xl" /></div>
                    <div className={`h-2.5 rounded w-full mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-2.5 rounded w-3/4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="mt-2 text-center"><span className="text-xs font-bold text-lime-500">Verified ✓</span></div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 right-3 z-20 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-xl">
                  👤 My Space
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <WaveBottom darkMode={darkMode} />
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex gap-5 lg:gap-8">
       
       
          <aside className={`hidden lg:flex flex-col w-60 xl:w-68 flex-shrink-0 sticky top-20 self-start rounded-2xl border shadow-lg overflow-hidden ${darkMode ? "bg-gray-800/60 border-gray-700 backdrop-blur-md" : "bg-white border-gray-200"}`}>
            <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
            <div className={`px-4 pt-5 pb-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full border-2 border-lime-500/40 flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-lime-50"}`}><FiUser className="text-lime-500 text-lg" /></div>
                <div className="min-w-0">
                  <p className={`text-sm font-extrabold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{userProfile?.first_name} {userProfile?.last_name}</p>
                  <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{userProfile?.email}</p>
                </div>
              </div>
       
       
              {/* <div className="mt-3 flex items-center gap-1">
                <button onClick={() => setLang("en")} className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${lang === "en" ? "bg-lime-500 text-white" : darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-500"}`}>EN</button>
                <button onClick={() => setLang("ar")} className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${lang === "ar" ? "bg-lime-500 text-white" : darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-500"}`}>عربي</button>
              </div> */}
            </div>
            <div className="px-3 py-4 flex flex-col gap-1 flex-1">
              {tabs.map((tab) => (
                <motion.button key={tab.id} whileTap={{ scale: 0.97 }} onClick={() => startTransition(() => setActiveSection(tab.id))}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeSection === tab.id ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-lg shadow-lime-500/25" : darkMode ? "text-gray-300 hover:bg-gray-700/60 hover:text-white" : "text-gray-600 hover:bg-lime-50 hover:text-lime-700"}`}>
                  <span className={activeSection === tab.id ? "text-white" : "text-lime-500"}>{tab.icon}</span>
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.badge !== null && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeSection === tab.id ? "bg-white/20 text-white" : "bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400"}`}>{tab.badge}</span>}
                </motion.button>
              ))}
             
             
              {isAuthenticated && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout} className={`mt-3 w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${darkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-500 hover:bg-red-50"}`}>
                  <RiLogoutBoxRLine className="text-lg" /> {t("logout")}
                </motion.button>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
         
         
            <div className="lg:hidden mb-5 -mx-0.5">
              <SettingsBar lang={lang} setLang={setLang} t={t} />
              <div className="tabs-scroll flex gap-2 overflow-x-auto pb-1 px-0.5">
                {tabs.map((tab) => (
                  <motion.button key={tab.id} whileTap={{ scale: 0.96 }} onClick={() => startTransition(() => setActiveSection(tab.id))}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap ${activeSection === tab.id ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-lime-500/20" : darkMode ? "bg-gray-800 border border-gray-700 text-gray-300 hover:text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-lime-50"}`}>
                    {tab.icon}{tab.label}
                    {tab.badge !== null && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeSection === tab.id ? "bg-white/25 text-white" : "bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400"}`}>{tab.badge}</span>}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {isLoading ? <LoadingSpinner key="spinner" /> : (
                  <div key="content">
                    {activeSection === "profile" && <ProfileTab isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile} userProfile={userProfile} profileForm={profileForm} setProfileForm={setProfileForm} handleUpdateProfile={handleUpdateProfile} handleDeleteAccount={handleDeleteAccount} handleLogout={handleLogout} darkMode={darkMode} isAuthenticated={isAuthenticated} inputCls={inputCls} t={t} />}
                    {activeSection === "addresses" && <AddressesTab isAddingAddress={isAddingAddress} setIsAddingAddress={setIsAddingAddress} editingAddressId={editingAddressId} setEditingAddressId={setEditingAddressId} addressForm={addressForm} setAddressForm={setAddressForm} handleUpdateAddress={handleUpdateAddress} handleAddAddress={handleAddAddress} resetAddressForm={resetAddressForm} addresses={addresses} startEditAddress={startEditAddress} handleDeleteAddress={handleDeleteAddress} isAddressInUse={isAddressInUse} darkMode={darkMode} inputCls={inputCls} t={t} />}
                    {activeSection === "orders" && <OrdersTab orders={orders} ordersPage={ordersPage} setOrdersPage={setOrdersPage} setSelectedOrder={setSelectedOrder} setIsOrderModalOpen={setIsOrderModalOpen} handleCancelOrder={handleCancelOrder} darkMode={darkMode} t={t} />}
                    {activeSection === "repairs" && <RepairsTab repairRequests={repairRequests} repairsPage={repairsPage} setRepairsPage={setRepairsPage} handleViewRepair={handleViewRepair} handleEditRepair={handleEditRepair} handleAcceptQuote={handleAcceptQuote} handleCancelRepair={handleCancelRepair} darkMode={darkMode} t={t} />}
                    {activeSection === "notifications" && <NotificationsTab token={token} darkMode={darkMode} t={t} />}
                    {activeSection === "security" && <SecurityTab darkMode={darkMode} handleDeleteAccount={handleDeleteAccount} handleLogout={handleLogout} token={token} t={t} />}
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
            <DialogPanel className={`relative transform overflow-hidden rounded-t-2xl sm:rounded-2xl text-left shadow-2xl w-full sm:max-w-4xl border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {selectedOrder && (
                <div className="lime-scroll max-h-[90dvh] overflow-y-auto">
                  <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
                  <div className={`sticky top-0 px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between z-10 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiBox className="text-lime-500" /><span className="font-mono text-xs px-2 py-1 bg-lime-500 text-white rounded-lg">#{safe(selectedOrder.id).slice(0, 8).toUpperCase()}</span></DialogTitle>
                    <div className="flex items-center gap-2">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => generateInvoicePDF(selectedOrder)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md hover:bg-emerald-600 transition-all"><FiDownload size={12} /> {t("downloadInvoice")}</motion.button>
                      <button onClick={() => setIsOrderModalOpen(false)} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}><FiX className="w-5 h-5 text-gray-400" /></button>
                    </div>
                  </div>
                  <div className="p-4 sm:p-7 space-y-6 text-sm">
                    <ProgressBar progress={getOrderProgress(selectedOrder.status)} status={selectedOrder.status} />
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
                      <div className="space-y-3">
                        <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("orderDate")}</span><p className={`font-medium mt-0.5 ${darkMode ? "text-white" : "text-gray-900"}`}>{formatDate(selectedOrder.createdAt)}</p></div>
                        <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("status")}</span><div className="mt-1"><StatusBadge status={selectedOrder.status} type="order" /></div></div>
                        <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("total")}</span><p className="text-2xl sm:text-3xl font-bold text-lime-600 dark:text-lime-400 mt-0.5">{safe(selectedOrder.totalPrice)} EGP</p></div>
                      </div>
                      <div><p className={`font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t("paymentMethod")}</p>
                        <div className={`flex items-center gap-3 p-3 rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedOrder.paymentMethod === "CREDIT_CARD" ? "bg-blue-100 dark:bg-blue-900" : "bg-orange-100"}`}>{selectedOrder.paymentMethod === "CREDIT_CARD" ? <FiCreditCard className="w-4 h-4 text-blue-600" /> : <FiDollarSign className="w-4 h-4 text-orange-600" />}</div>
                          <p className={`font-semibold capitalize text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{safe(selectedOrder.paymentMethod).toLowerCase().replace("_", " ")}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}><FiBox className="text-lime-500" /> {t("orderItems")}</h3>
                      <div className={`border rounded-2xl overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                        {/* Table header with explicit spacing between price and total */}
                        <div className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b ${darkMode ? "bg-gray-700/50 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
                          <span>{t("orderItems")}</span>
                          <span>{t("from")}</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Unit Price</span>
                          <span className="text-right">{t("total")}</span>
                        </div>
                        {selectedOrder.orderItems?.length > 0 ? selectedOrder.orderItems.map((item, index) => (
                          <div key={index} className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 items-center px-4 py-3 border-b last:border-b-0 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                            <div className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{safe(item.productName)}</div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">{safe(item.shopName)}</div>
                            <div className={`text-center text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{safe(item.quantity)}</div>
                            <div className={`text-right text-sm font-medium whitespace-nowrap ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{Number(item.priceAtCheckout || 0).toFixed(2)} EGP</div>
                            <div className="text-right font-bold text-lime-600 dark:text-lime-400 text-sm whitespace-nowrap">{(Number(item.priceAtCheckout) * Number(item.quantity)).toFixed(2)} EGP</div>
                          </div>
                        )) : <div className="p-10 text-center text-gray-400 text-sm">{t("noItems")}</div>}
                        <div className={`px-4 py-4 flex justify-between items-center border-t ${darkMode ? "bg-gray-700/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                          <span className="uppercase text-xs tracking-widest text-gray-500 font-medium">{t("grandTotal")}</span>
                          <span className="text-2xl font-bold text-lime-600 dark:text-lime-400">{safe(selectedOrder.totalPrice)} EGP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 sm:p-6 border-t flex justify-end gap-3 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIsOrderModalOpen(false)} className={`px-6 py-2.5 rounded-xl font-bold transition text-sm ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{t("close")}</motion.button>
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
            <DialogPanel className={`relative transform overflow-hidden rounded-t-2xl sm:rounded-2xl text-left shadow-2xl w-full sm:max-w-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {selectedRepair && (
                <div className="lime-scroll max-h-[85dvh] overflow-y-auto">
                  <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
                  <div className={`px-5 sm:px-7 pt-5 pb-4 border-b flex items-center justify-between ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiTool className="text-lime-500" /> Repair #{safe(selectedRepair.id).slice(0, 8)}</DialogTitle>
                    <button onClick={() => setIsRepairModalOpen(false)} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiXCircle className="w-5 h-5" /></button>
                  </div>
                  <div className="px-5 sm:px-7 py-5 space-y-4">
                    <ProgressBar progress={getRepairProgress(selectedRepair.status)} status={selectedRepair.status} />
                    <div className={`rounded-2xl p-4 space-y-3.5 ${darkMode ? "bg-gray-800/60" : "bg-lime-50"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-lime-100"}`}><FiHome className="text-lime-500" /></div>
                        <div><p className="text-xs uppercase tracking-widest text-lime-600 font-medium">{t("shop")}</p><p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedRepair.shopName}</p></div>
                      </div>
                      <div><p className="text-xs uppercase tracking-widest text-lime-600 font-medium mb-1">{t("issueDescription")}</p><p className={`leading-relaxed text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{selectedRepair.description}</p></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-xs uppercase tracking-widest text-lime-600 font-medium mb-0.5">{t("status")}</p><p className="font-bold capitalize text-emerald-600 text-sm">{selectedRepair.status?.replace("_", " ")}</p></div>
                        {selectedRepair.price && <div><p className="text-xs uppercase tracking-widest text-lime-600 font-medium mb-0.5">{t("quote")}</p><p className="text-xl font-bold text-lime-600 dark:text-lime-400">{selectedRepair.price} EGP</p></div>}
                      </div>
                    </div>
                    <div className={`flex justify-between items-center p-3.5 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                      <div><p className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("paymentMethod")}</p><p className={`font-bold text-sm ${darkMode ? "text-orange-400" : "text-gray-800"}`}>{selectedRepair.paymentMethod || "Not set"}</p></div>
                      {selectedRepair.price && <div className="text-right"><p className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t("total")}</p><p className="text-lg font-bold text-lime-600 dark:text-lime-400">{selectedRepair.price} EGP</p></div>}
                    </div>
                  </div>
                  <div className={`border-t px-5 sm:px-7 py-4 flex justify-end ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIsRepairModalOpen(false)} className="px-6 py-2.5 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold rounded-xl shadow-md transition-all text-sm">{t("close")}</motion.button>
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
            <DialogPanel className={`relative transform overflow-hidden rounded-t-2xl sm:rounded-2xl text-left shadow-2xl w-full sm:max-w-md border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {editingRepair && (
                <div>
                  <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
                  <div className={`flex items-center justify-between px-5 sm:px-7 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiEdit className="text-lime-500" /> {t("editRepair")}</DialogTitle>
                    <button onClick={() => { setIsEditRepairModalOpen(false); setEditingRepair(null); }} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiX className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleUpdateRepairDescription} className="p-5 sm:p-7 space-y-5">
                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t("deviceCategory")}</label>
                      <div className="relative">
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`${inputCls} appearance-none`}>
                          <option value="">Select category</option>
                          {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><FiChevronRight className="rotate-90" size={13} /></div>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{t("description")}</label>
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={5} placeholder={t("describeIssue")} className={`${inputCls} resize-y min-h-[100px]`} required />
                    </div>
                    <div className="flex gap-3">
                      <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => { setIsEditRepairModalOpen(false); setEditingRepair(null); }} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t("cancel")}</motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm"><FiCheck size={13} /> {t("save")}</motion.button>
                    </div>
                  </form>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <ConfirmRepairModal open={isConfirmRepairOpen} onClose={() => setIsConfirmRepairOpen(false)} req={confirmRepairReq} token={token} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['repairs'] })} darkMode={darkMode} t={t} />
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