import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiPackage, FiCheckCircle, FiTruck, FiXCircle,
  FiClock, FiChevronDown, FiHome, FiShield, FiCreditCard, FiMapPin, FiCalendar,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import Hero from "../components/Hero";

const queryClient = new QueryClient();

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

  .track-root * { box-sizing: border-box; }
  .track-root { font-family: 'Outfit', sans-serif; overflow-x: hidden; }

  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  .skeleton-shimmer {
    background: linear-gradient(90deg, transparent 25%, rgba(52,211,153,0.08) 50%, transparent 75%);
    background-size: 200% auto;
    animation: shimmer 1.8s linear infinite;
  }

  .thin-scroll::-webkit-scrollbar { width: 4px; }
  .thin-scroll::-webkit-scrollbar-track { background: transparent; }
  .thin-scroll::-webkit-scrollbar-thumb { background: rgba(52,211,153,0.4); border-radius: 4px; }

  @keyframes stepPulse { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.45)} 50%{box-shadow:0 0 0 9px rgba(52,211,153,0)} }
  .step-pulse { animation: stepPulse 2s ease-in-out infinite; will-change: box-shadow; }

  .timeline-line {
    position: absolute;
    left: 28px;
    top: 40px;
    bottom: 40px;
    width: 2px;
    background: linear-gradient(to bottom, #34d399, rgba(52,211,153,0.08));
  }

  @keyframes iconRing {
    0% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(1.7); opacity: 0; }
  }
  .icon-ring {
    animation: iconRing 2.2s cubic-bezier(0,0,0.2,1) infinite;
    will-change: transform, opacity;
  }
  .icon-ring-delay {
    animation-delay: 1.1s;
  }
`;

const STATUS_STEPS = [
  { key: "PENDING", label: "Order Placed", sub: "Your order has been received", icon: <FiClock className="w-5 h-5" /> },
  { key: "CONFIRMED", label: "Confirmed", sub: "Order confirmed by our team", icon: <FiCheckCircle className="w-5 h-5" /> },
  { key: "PROCESSING", label: "Processing", sub: "Items being prepared", icon: <FiPackage className="w-5 h-5" /> },
  { key: "FINISHPROCESSING", label: "Ready to Ship", sub: "Packed and ready for courier", icon: <FiCheckCircle className="w-5 h-5" /> },
  { key: "SHIPPED", label: "Out for Delivery", sub: "On the way to your address", icon: <FiTruck className="w-5 h-5" /> },
  { key: "DELIVERED", label: "Delivered", sub: "Package delivered successfully", icon: <FiCheckCircle className="w-5 h-5" /> },
  { key: "CANCELLED", label: "Cancelled", sub: "Order has been cancelled", icon: <FiXCircle className="w-5 h-5" /> },
];

const AnimatedStatusIcon = memo(({ status, darkMode }) => {
  const step = STATUS_STEPS.find((s) => s.key === status) ?? STATUS_STEPS[0];
  const isCancelled = status === "CANCELLED";
  const gradientClass = isCancelled
    ? "from-red-500 to-rose-600 shadow-red-500/30"
    : "from-emerald-400 to-teal-500 shadow-emerald-400/30";

  return (
    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
      <span className={`absolute w-20 h-20 rounded-full icon-ring ${isCancelled ? "bg-red-400/40" : "bg-emerald-400/40"}`} />
      <span className={`absolute w-20 h-20 rounded-full icon-ring icon-ring-delay ${isCancelled ? "bg-red-400/40" : "bg-emerald-400/40"}`} />
      <motion.div
        className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl bg-gradient-to-br ${gradientClass}`}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={step.key}
            initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.4, rotate: 90 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            {React.cloneElement(step.icon, { className: "w-9 h-9" })}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return null;
  return `$${Number(value).toFixed(2)}`;
};

const addDays = (dateInput, days) => {
  const base = dateInput ? new Date(dateInput) : new Date();
  base.setDate(base.getDate() + days);
  return base;
};

const formatDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const findStepTimestamp = (order, stepKey) => {
  const historyEntry = order?.statusHistory?.find((h) => h.status === stepKey);
  if (historyEntry?.timestamp) return formatDateTime(historyEntry.timestamp);
  if (stepKey === "PENDING") return formatDateTime(order?.createdAt);
  if (stepKey === order?.status) return formatDateTime(order?.updatedAt);
  return null;
};

const InfoPanel = memo(({ darkMode, selectedOrder }) => {
  const itemsCount = selectedOrder?.items?.length ?? selectedOrder?.orderItems?.length ?? null;
  const total = formatCurrency(selectedOrder?.totalAmount ?? selectedOrder?.total ?? selectedOrder?.amount);
  const paymentMethod = selectedOrder?.paymentMethod ?? selectedOrder?.payment_method ?? null;
  const address = selectedOrder?.shippingAddress ?? selectedOrder?.address ?? null;
  const isCancelled = selectedOrder?.status === "CANCELLED";
  const isDelivered = selectedOrder?.status === "DELIVERED";
  const estimatedDelivery = isDelivered
    ? formatDate(selectedOrder?.deliveredAt ?? selectedOrder?.updatedAt)
    : formatDate(selectedOrder?.estimatedDelivery) ?? formatDate(addDays(selectedOrder?.createdAt, 5));

  const detailRows = [
    itemsCount !== null && { icon: <FiPackage size={14} />, label: "Items", value: `${itemsCount} item${itemsCount === 1 ? "" : "s"}` },
    total && { icon: <FiCreditCard size={14} />, label: "Order total", value: total },
    paymentMethod && { icon: <FiCreditCard size={14} />, label: "Payment", value: paymentMethod },
    address && { icon: <FiMapPin size={14} />, label: "Delivering to", value: address },
    !isCancelled && estimatedDelivery && {
      icon: <FiCalendar size={14} />,
      label: isDelivered ? "Delivered on" : "Estimated delivery",
      value: estimatedDelivery,
    },
  ].filter(Boolean);

  return (
    <div className={`hidden lg:flex flex-col rounded-3xl p-6 gap-5 h-fit shrink-0 w-full lg:w-80 shadow-xl shadow-black/[0.03] ${darkMode ? "bg-gray-800/80 backdrop-blur-md" : "bg-white"}`}>
      <AnimatedStatusIcon status={selectedOrder?.status} darkMode={darkMode} />

      {detailRows.length > 0 && (
        <div className={`rounded-2xl p-4 space-y-3 ${darkMode ? "bg-gray-900/50" : "bg-gray-50"}`}>
          <h4 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Order details</h4>
          <div className="space-y-2.5">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-start gap-2.5">
                <span className={`mt-0.5 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{row.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-medium ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{row.label}</p>
                  <p className={`text-sm font-semibold truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className={`text-sm font-extrabold mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Track in Real-Time</h4>
        <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Our system updates automatically. You will also receive SMS and email notifications at every major step.
        </p>
      </div>

      <div className={`flex items-start gap-2.5 text-xs px-4 py-3 rounded-2xl ${darkMode ? "bg-gray-900/50" : "bg-emerald-50/80"}`}>
        <FiShield className="text-emerald-500 mt-0.5 shrink-0" size={14} />
        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
          <span className="font-semibold text-emerald-500">Need help?</span> Contact support if your order status seems stuck for more than 24 hours.
        </p>
      </div>
    </div>
  );
});

const StepRow = memo(({ step, index, isCompleted, isCurrent, isCancelledStep, darkMode, timestamp }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: isCompleted || isCancelledStep ? 1 : 0.4, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="flex items-start gap-5 py-3 pl-1 relative"
  >
    <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${isCancelledStep
      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
      : isCompleted
        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-400/20'
        : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'
      } ${isCurrent ? 'step-pulse' : ''}`}>
      {step.icon}
    </div>
    <div className="flex-1 pt-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className={`text-sm font-bold leading-snug ${isCancelledStep ? 'text-red-500 dark:text-red-400'
          : isCompleted ? darkMode ? 'text-emerald-400' : 'text-emerald-700'
            : darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>{step.label}</p>
        {timestamp && (isCompleted || isCancelledStep) && (
          <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{timestamp}</span>
        )}
      </div>
      <p className={`text-xs mt-0.5 ${isCompleted || isCancelledStep
        ? darkMode ? 'text-gray-400' : 'text-gray-500'
        : darkMode ? 'text-gray-600' : 'text-gray-300'
        }`}>{step.sub}</p>
      {isCurrent && !isCancelledStep && (
        <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Current status
        </span>
      )}
    </div>
    {isCompleted && !isCurrent && (
      <FiCheckCircle className="text-emerald-400 flex-shrink-0 mt-1.5" size={16} />
    )}
  </motion.div>
));

const TrackContent = ({ darkMode }) => {
  const token = localStorage.getItem("authToken");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => { document.title = "Track your order | Tech-Restore"; }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['track_orders'],
    queryFn: async () => {
      const res = await api.get("/api/users/orders", { headers: { Authorization: `Bearer ${token}` } });
      return res.data.content || res.data || [];
    },
    enabled: !!token,
    staleTime: 30000,
  });

  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrder]);

  const toggleDropdown = useCallback(() => setIsDropdownOpen((prev) => !prev), []);

  const selectOrder = useCallback((order) => {
    setSelectedOrder(order);
    setIsDropdownOpen(false);
  }, []);

  const isCancelled = selectedOrder?.status === "CANCELLED";

  const currentStepIndex = useMemo(
    () => STATUS_STEPS.findIndex((s) => s.key === selectedOrder?.status),
    [selectedOrder?.status]
  );

  const progressPct = useMemo(
    () => (isCancelled ? 0 : Math.round((currentStepIndex / (STATUS_STEPS.length - 2)) * 100)),
    [isCancelled, currentStepIndex]
  );

  const visibleSteps = useMemo(
    () => STATUS_STEPS.filter((s) => (isCancelled ? s.key !== 'DELIVERED' : s.key !== 'CANCELLED')),
    [isCancelled]
  );

  const stepTimestamps = useMemo(() => {
    const map = {};
    visibleSteps.forEach((s) => { map[s.key] = findStepTimestamp(selectedOrder, s.key); });
    return map;
  }, [visibleSteps, selectedOrder]);

  const trackingMeta = useMemo(() => {
    if (!selectedOrder) return [];
    return [
      { icon: <FiPackage size={13} />, label: "Tracking ID", value: selectedOrder.trackingNumber ?? selectedOrder.id?.slice(0, 12) },
      { icon: <FiTruck size={13} />, label: "Carrier", value: selectedOrder.carrier ?? "Standard Courier" },
      { icon: <FiCalendar size={13} />, label: "Order date", value: formatDate(selectedOrder.createdAt) ?? "—" },
      { icon: <FiClock size={13} />, label: "Last updated", value: formatDateTime(selectedOrder.updatedAt) ?? "—" },
    ];
  }, [selectedOrder]);

  const statusBadgeClass = useCallback((status) => (
    status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      : status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  ), []);

  if (!token) return (
    <>
      <style>{STYLES}</style>
      <div className={`track-root min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
        <Hero variant="track" darkMode={darkMode} />
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10 text-center">
          <div className={`rounded-3xl shadow-xl shadow-black/[0.03] p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <FiPackage className="w-8 h-8 text-gray-400" />
            </div>
            <p className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Login Required</p>
            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Please log in to track your orders.</p>
            <a href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 text-sm">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </>
  );

  if (isLoading) return (
    <>
      <style>{STYLES}</style>
      <div className={`track-root min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
        <Hero variant="track" darkMode={darkMode} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className={`rounded-3xl shadow-xl shadow-black/[0.03] overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 sm:p-8 space-y-6">
              <div className={`h-10 rounded-xl animate-pulse skeleton-shimmer ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex-shrink-0 animate-pulse skeleton-shimmer ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} style={{ width: `${[60, 75, 50, 70, 55][i]}%` }} />
                    <div className={`h-3 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`} style={{ width: `${[40, 55, 35, 50, 40][i]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className={`track-root min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} pt-16 pb-16`}>
        <Hero variant="track" darkMode={darkMode} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className={`rounded-3xl shadow-xl shadow-black/[0.03] overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-5 sm:p-8">
                  {orders.length === 0 ? (
                    <div className="text-center py-16 space-y-5">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FiPackage className="w-10 h-10 text-gray-400" />
                      </div>
                      <div>
                        <p className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No orders yet</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start shopping to see your orders here</p>
                      </div>
                      <a href="/devices"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm hover:shadow-emerald-500/25"
                      >
                        <FiHome size={14} /> Start Shopping
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-8">
                        <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Select Order</p>
                        <button
                          onClick={toggleDropdown}
                          className={`w-full flex justify-between items-center px-5 py-3.5 rounded-xl transition-all text-sm font-semibold shadow-sm ${isDropdownOpen
                            ? 'shadow-md'
                            : darkMode ? 'bg-gray-900/60' : 'bg-gray-50'
                            } ${darkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isCancelled ? 'bg-red-500' : 'bg-emerald-400'}`} />
                            <span>{selectedOrder ? `Order #${selectedOrder.id?.slice(0, 8)}…` : 'Select an order'}</span>
                            {selectedOrder && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${statusBadgeClass(selectedOrder.status)}`}>{selectedOrder.status}</span>
                            )}
                          </div>
                          <FiChevronDown className={`transition-transform duration-300 text-emerald-400 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.97 }}
                              transition={{ duration: 0.16 }}
                              className={`absolute mt-2 w-full rounded-2xl shadow-2xl z-50 overflow-hidden thin-scroll max-h-60 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
                            >
                              {orders.map((order) => (
                                <button key={order.id}
                                  onClick={() => selectOrder(order)}
                                  className={`w-full text-left px-5 py-3.5 flex items-center justify-between text-sm font-medium transition-colors ${selectedOrder?.id === order.id
                                    ? 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-400'
                                    : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                  <span>Order #{order.id?.slice(0, 8)}…</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${statusBadgeClass(order.status)}`}>{order.status}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {selectedOrder && (
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={selectedOrder.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-6"
                          >
                            <div className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                              <div>
                                <p className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Live Tracking</p>
                                <p className={`text-base font-extrabold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Order <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>#{selectedOrder.id?.slice(0, 8)}</span>
                                </p>
                              </div>
                              <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${statusBadgeClass(selectedOrder.status)}`}>{selectedOrder.status}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {trackingMeta.map((meta) => (
                                <div key={meta.label} className={`rounded-xl p-3 ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50'}`}>
                                  <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>{meta.icon}</span>
                                    {meta.label}
                                  </div>
                                  <p className={`text-sm font-bold mt-1 truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{meta.value}</p>
                                </div>
                              ))}
                            </div>
                            {!isCancelled && (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall Progress</p>
                                  <p className={`text-xs font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{progressPct}%</p>
                                </div>
                                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="relative">
                              <div className="timeline-line" />
                              <div className="space-y-1">
                                {visibleSteps.map((step, index) => {
                                  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === step.key);
                                  const isCompleted = !isCancelled && stepIndex <= currentStepIndex;
                                  const isCurrent = stepIndex === currentStepIndex;
                                  const isCancelledStep = isCancelled && step.key === 'CANCELLED';
                                  return (
                                    <StepRow
                                      key={step.key}
                                      step={step}
                                      index={index}
                                      isCompleted={isCompleted}
                                      isCurrent={isCurrent}
                                      isCancelledStep={isCancelledStep}
                                      darkMode={darkMode}
                                      timestamp={stepTimestamps[step.key]}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex justify-center pt-2">
                              <a href="/devices"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-400/20 text-sm"
                              >
                                <FiHome size={14} /> Explore More Products
                              </a>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <InfoPanel darkMode={darkMode} selectedOrder={selectedOrder} />
          </div>
        </div>
      </div>
    </>
  );
};

export default function Track(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <TrackContent {...props} />
    </QueryClientProvider>
  );
}