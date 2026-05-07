import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import {
  FiPackage, FiCheckCircle, FiTruck, FiXCircle,
  FiClock, FiChevronDown, FiHome, FiStar,
  FiUsers, FiZap,
} from "react-icons/fi";
import { RiCarLine, RiMotorbikeLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

  .track-root * { box-sizing: border-box; }
  .track-root { font-family: 'Outfit', sans-serif; overflow-x: hidden; }

  @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-30px) scale(1.08)} 66%{transform:translate(-15px,20px) scale(0.95)} }
  @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,15px) scale(1.06)} 66%{transform:translate(20px,-20px) scale(0.96)} }
  @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(10px,25px) scale(1.04)} 66%{transform:translate(-20px,-10px) scale(0.98)} }
  .blob1 { animation: blob1 9s ease-in-out infinite; }
  .blob2 { animation: blob2 11s ease-in-out infinite; }
  .blob3 { animation: blob3 7s ease-in-out infinite; }

  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .float-badge { animation: float 3s ease-in-out infinite; }

  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  .skeleton-shimmer {
    background: linear-gradient(90deg, transparent 25%, rgba(132,204,22,0.08) 50%, transparent 75%);
    background-size: 200% auto;
    animation: shimmer 1.8s linear infinite;
  }

  .grid-texture {
    background-image:
      repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(0,0,0,0.03) 39px,rgba(0,0,0,0.03) 40px),
      repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(0,0,0,0.03) 39px,rgba(0,0,0,0.03) 40px);
  }

  .thin-scroll::-webkit-scrollbar { width: 4px; }
  .thin-scroll::-webkit-scrollbar-track { background: transparent; }
  .thin-scroll::-webkit-scrollbar-thumb { background: rgba(132,204,22,0.4); border-radius: 4px; }

  @keyframes stepPulse { 0%,100%{box-shadow:0 0 0 0 rgba(132,204,22,0.5)} 50%{box-shadow:0 0 0 10px rgba(132,204,22,0)} }
  .step-pulse { animation: stepPulse 2s ease-in-out infinite; }

  .timeline-line {
    position: absolute;
    left: 28px;
    top: 40px;
    bottom: 40px;
    width: 2px;
    background: linear-gradient(to bottom, #84cc16, rgba(132,204,22,0.1));
  }

  .delivery-card { transition: transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s ease; }
  .delivery-card:hover { transform: translateY(-6px); }

  @keyframes progressFill { from{width:0} to{width:var(--fill)} }
  .progress-fill { animation: progressFill 1s cubic-bezier(.16,1,.3,1) both; }
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

const WaveBottom = memo(({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="relative block w-full h-16 md:h-24" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z" fill={darkMode ? '#111827' : '#f9fafb'} />
    </svg>
  </div>
));

const WaveTop = memo(({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="relative block w-full h-12 md:h-20" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z" fill={darkMode ? '#111827' : '#f9fafb'} />
    </svg>
  </div>
));

const StatCard = memo(({ icon, value, label, accent, delay, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true, margin: "-50px" }}
    whileHover={{ y: -4, scale: 1.03 }}
    className={`relative overflow-hidden rounded-2xl p-4 shadow-xl border transition-all duration-300 ${darkMode ? 'bg-gray-800/80 border-gray-700/60 backdrop-blur-md' : 'bg-white/90 border-gray-100 backdrop-blur-md'
      }`}
  >
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
    <div className="flex items-center gap-3 mb-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
        {icon}
      </div>
      <span className="text-xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
    </div>
    <p className={`text-xs font-semibold pl-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
  </motion.div>
));

const HeroSection = memo(({ darkMode, heroStats }) => (
  <div className="min-h-screen">
    <section className={`relative overflow-hidden pt-10 pb-32 md:pt-24 -mt-8 md:pb-40  ${darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-lime-50 via-white to-emerald-50'
      }`}>
      <div className="blob1 absolute w-[400px] h-[400px] -top-32 -left-24 rounded-full blur-3xl opacity-20 bg-lime-400 pointer-events-none" />
      <div className="blob2 absolute w-[350px] h-[350px] top-8 -right-16 rounded-full blur-3xl opacity-15 bg-emerald-500 pointer-events-none" />
      <div className="blob3 absolute w-[250px] h-[250px] bottom-20 left-1/2 rounded-full blur-3xl opacity-10 bg-teal-300 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none grid-texture" />
      <WaveTop darkMode={darkMode} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 mt-6 py-1.5 rounded-full border text-sm font-semibold bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400"
            >
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
              Real-time order tracking
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">Track Your</span>
              <br />
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>Order in</span>
              <br />
              <span style={{ WebkitTextStroke: darkMode ? '2px #84cc16' : '2px #16a34a', color: 'transparent' }}>Real Time</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className={`text-base sm:text-lg leading-relaxed max-w-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Watch every step of your delivery — from warehouse to your doorstep. Stay informed, stay in control.
            </motion.p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {heroStats.map((s) => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
            </div>
          </div>

          <div className="relative h-64 sm:h-72 lg:h-[420px] hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-300/20 to-emerald-300/20 dark:from-lime-900/15 dark:to-emerald-900/15 rounded-full blur-3xl scale-125" />
            <div className="relative w-full h-full">
              <motion.div initial={{ opacity: 0, rotate: 10, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 5, scale: 1.04 }}
                className={`absolute top-8 left-6 w-44 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
                <div className="p-4 space-y-3">
                  <div className={`h-3 rounded w-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-3 rounded w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center">
                      <FiCheckCircle className="text-white w-3 h-3" />
                    </div>
                    <div className={`h-2.5 rounded flex-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-lime-500/30 flex items-center justify-center">
                      <FiTruck className="text-lime-500 w-3 h-3" />
                    </div>
                    <div className={`h-2.5 rounded flex-1 bg-gradient-to-r from-lime-400 to-emerald-400`} />
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, rotate: -8, y: 20 }} animate={{ opacity: 1, rotate: -10, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }} whileHover={{ rotate: -4, scale: 1.04 }}
                className={`absolute bottom-10 right-8 w-52 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className={`h-4 rounded w-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <FiTruck className="text-lime-400 text-xl" />
                  </div>
                  <div className="space-y-2">
                    <div className={`h-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className={`h-3 rounded w-5/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <div className="h-3 rounded bg-gradient-to-r from-lime-400 to-emerald-400 w-1/2" />
                  </div>
                  <span className="text-xs font-bold text-lime-500">On the way ✓</span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.07, y: -4 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-40 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="h-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
                <div className="p-4 flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <FiPackage className="text-lime-400 text-2xl" />
                  </div>
                  <div className={`h-2.5 rounded w-5/6 mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-2.5 rounded w-4/6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <span className="text-xs font-bold text-lime-500 mt-2">Shipped ✓</span>
                </div>
              </motion.div>

              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="float-badge absolute top-1/4 right-4 z-20 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-xl"
              >
                🚚 Live Tracking
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <WaveBottom darkMode={darkMode} />
    </section>
  </div>
));

const Track = memo(({ darkMode }) => {
  const token = localStorage.getItem("authToken");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => { document.title = "Track your order | Tech-Restore"; }, []);

  const fetchOrders = useCallback(async () => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await api.get("/api/users/orders", { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.content || res.data || [];
      setOrders(data);
      if (data.length > 0) setSelectedOrder(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const heroStats = useMemo(() => [
    { icon: <FiZap size={15} />, value: "98.9%", label: "On-time delivery", accent: "#0d9488", delay: 0.1 },
    { icon: <FiUsers size={15} />, value: "~50K", label: "Packages daily", accent: "#3b82f6", delay: 0.2 },
    { icon: <FiStar size={15} />, value: "4.9★", label: "Customer rating", accent: "#f59e0b", delay: 0.3 },
  ], []);

  if (isLoading) return (
    <>
      <style>{STYLES}</style>
      <div className={`track-root min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
        <HeroSection darkMode={darkMode} heroStats={heroStats} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className={`rounded-2xl border shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
            <div className="p-6 sm:p-8 space-y-6">
              <div className={`h-10 rounded-xl animate-pulse skeleton-shimmer ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex-shrink-0 animate-pulse skeleton-shimmer ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${[60, 75, 50, 70, 55][i]}%` }} />
                    <div className={`h-3 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ width: `${[40, 55, 35, 50, 40][i]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!token) return (
    <>
      <style>{STYLES}</style>
      <div className={`track-root min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
        <HeroSection darkMode={darkMode} heroStats={heroStats} />
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10 text-center">
          <div className={`rounded-2xl border shadow-xl p-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 -mx-8 -mt-8 mb-8 rounded-t-2xl" />
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <FiPackage className="w-8 h-8 text-gray-400" />
            </div>
            <p className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Login Required</p>
            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Please log in to track your orders.</p>
            <a href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-lime-500/30 text-sm">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </>
  );

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === selectedOrder?.status);
  const isCancelled = selectedOrder?.status === "CANCELLED";
  const progressPct = isCancelled ? 0 : Math.round(((currentStepIndex) / (STATUS_STEPS.length - 2)) * 100);

  return (
    <>
      <style>{STYLES}</style>
      <div className={`track-root min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} pt-16 pb-16`}>
        <HeroSection darkMode={darkMode} heroStats={heroStats} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className={`rounded-2xl border shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
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
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg text-sm hover:shadow-lime-500/25"
                  >
                    <FiHome size={14} /> Start Shopping
                  </a>
                </div>
              ) : (
                <>
                  <div className="relative mb-8">
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Select Order</p>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full flex justify-between items-center px-5 py-3.5 rounded-xl border-2 transition-all text-sm font-semibold shadow-sm ${isDropdownOpen
                        ? 'border-lime-500 shadow-lime-500/10'
                        : darkMode ? 'bg-gray-900/60 border-gray-700 hover:border-lime-500/50' : 'bg-gray-50 border-gray-200 hover:border-lime-400'
                        } ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isCancelled ? 'bg-red-500' : 'bg-lime-500'}`} />
                        <span>{selectedOrder ? `Order #${selectedOrder.id?.slice(0, 8)}…` : 'Select an order'}</span>
                        {selectedOrder && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedOrder.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : selectedOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300'
                            }`}>{selectedOrder.status}</span>
                        )}
                      </div>
                      <FiChevronDown className={`transition-transform duration-300 text-lime-500 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className={`absolute mt-2 w-full rounded-2xl shadow-2xl border z-50 overflow-hidden thin-scroll max-h-60 overflow-y-auto ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                        >
                          {orders.map((order) => (
                            <button key={order.id}
                              onClick={() => { setSelectedOrder(order); setIsDropdownOpen(false); }}
                              className={`w-full text-left px-5 py-3.5 flex items-center justify-between text-sm font-medium transition-colors ${selectedOrder?.id === order.id
                                ? 'bg-lime-500/10 text-lime-600 dark:text-lime-400'
                                : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              <span>Order #{order.id?.slice(0, 8)}…</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300'
                                }`}>{order.status}</span>
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
                        transition={{ duration: 0.25 }}
                        className="space-y-6"
                      >
                        <div className={`rounded-xl p-4 border flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-lime-50/60 border-lime-100'
                          }`}>
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Live Tracking</p>
                            <p className={`text-base font-extrabold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                              Order <span className={`${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>#{selectedOrder.id?.slice(0, 8)}</span>
                            </p>
                          </div>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            : selectedOrder.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300'
                            }`}>{selectedOrder.status}</span>
                        </div>
                        {!isCancelled && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall Progress</p>
                              <p className={`text-xs font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>{progressPct}%</p>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full rounded-full bg-gradient-to-r from-lime-500 to-emerald-500"
                                style={{ boxShadow: '0 0 8px rgba(132,204,22,0.5)' }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="relative">
                          <div className="timeline-line" />
                          <div className="space-y-1">
                            {STATUS_STEPS.filter(s => isCancelled ? (s.key !== 'DELIVERED') : (s.key !== 'CANCELLED')).map((step, index) => {
                              const stepIndex = STATUS_STEPS.findIndex(s => s.key === step.key);
                              const isCompleted = !isCancelled && stepIndex <= currentStepIndex;
                              const isCurrent = stepIndex === currentStepIndex;
                              const isCancelledStep = isCancelled && step.key === 'CANCELLED';
                              return (
                                <motion.div
                                  key={step.key}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: isCompleted || isCancelledStep ? 1 : 0.4, x: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.06 }}
                                  className="flex items-start gap-5 py-3 pl-1 relative"
                                >
                                  <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${isCancelledStep
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                    : isCompleted
                                      ? 'bg-gradient-to-br from-lime-500 to-emerald-500 text-white shadow-lg shadow-lime-500/30'
                                      : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'
                                    } ${isCurrent ? 'step-pulse' : ''}`}>
                                    {step.icon}
                                  </div>
                                  <div className="flex-1 pt-1.5">
                                    <p className={`text-sm font-bold leading-snug ${isCancelledStep ? 'text-red-500 dark:text-red-400'
                                      : isCompleted ? darkMode ? 'text-lime-400' : 'text-lime-700'
                                        : darkMode ? 'text-gray-500' : 'text-gray-400'
                                      }`}>{step.label}</p>
                                    <p className={`text-xs mt-0.5 ${isCompleted || isCancelledStep
                                      ? darkMode ? 'text-gray-400' : 'text-gray-500'
                                      : darkMode ? 'text-gray-600' : 'text-gray-300'
                                      }`}>{step.sub}</p>
                                    {isCurrent && !isCancelledStep && (
                                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-lime-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                                        Current status
                                      </span>
                                    )}
                                  </div>
                                  {isCompleted && !isCurrent && (
                                    <FiCheckCircle className="text-lime-500 flex-shrink-0 mt-1.5" size={16} />
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex justify-center pt-2">
                          <a href="/devices"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-lime-500/20 text-sm"
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
        <section className={`py-16 px-4 sm:px-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-5xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`text-2xl sm:text-3xl font-extrabold text-center mb-10 relative inline-block w-full ${darkMode ? 'text-white' : 'text-gray-900'}`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Fast &{' '}
              <span className="bg-gradient-to-r from-lime-500 to-emerald-500 bg-clip-text text-transparent">
                Reliable
              </span>{' '}
              Delivery Options
            </motion.h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  icon: <RiMotorbikeLine className="w-12 h-12" />,
                  title: "Same-Day",
                  desc: "Order before 2 PM, get it today",
                  badge: "Popular",
                  color: "from-orange-400 to-red-500",
                  delay: 0.1,
                },
                {
                  icon: <RiCarLine className="w-12 h-12" />,
                  title: "Next-Day",
                  desc: "Guaranteed delivery within 24 hours",
                  badge: "Best Value",
                  color: "from-lime-400 to-emerald-500",
                  delay: 0.2,
                },
                {
                  icon: <FiTruck className="w-12 h-12" />,
                  title: "Standard",
                  desc: "2–5 business days, free on large orders",
                  badge: "Free",
                  color: "from-blue-400 to-indigo-500",
                  delay: 0.3,
                },
              ].map((opt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: opt.delay }}
                  viewport={{ once: true }}
                  className={`delivery-card relative rounded-2xl shadow-xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                    }`}
                >
                  {opt.badge && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
                      {opt.badge}
                    </span>
                  )}
                  <div className={`h-1.5 bg-gradient-to-r ${opt.color}`} />
                  <div className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${opt.color} text-white mb-5 shadow-lg`}>
                      {opt.icon}
                    </div>
                    <h3 className={`text-lg font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {opt.title} Delivery
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{opt.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
});

Track.displayName = 'Track';
export default memo(Track);