import React, { useState, useEffect, memo, useCallback, useMemo, useTransition } from "react";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiPackage, FiCheckCircle, FiTruck, FiXCircle,
  FiClock, FiChevronDown, FiHome,
} from "react-icons/fi";
import { RiCarLine, RiMotorbikeLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import Hero from "../components/Hero";

const queryClient = new QueryClient();

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
    background: linear-gradient(90deg, transparent 25%, rgba(52,211,153,0.08) 50%, transparent 75%);
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
  .thin-scroll::-webkit-scrollbar-thumb { background: rgba(52,211,153,0.4); border-radius: 4px; }

  @keyframes stepPulse { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.5)} 50%{box-shadow:0 0 0 10px rgba(52,211,153,0)} }
  .step-pulse { animation: stepPulse 2s ease-in-out infinite; }

  .timeline-line {
    position: absolute;
    left: 28px;
    top: 40px;
    bottom: 40px;
    width: 2px;
    background: linear-gradient(to bottom, #34d399, rgba(52,211,153,0.1));
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

const InfoPanel = memo(({ darkMode }) => (
  <div className={`hidden lg:flex flex-col rounded-2xl border p-6 gap-4 h-100 shrink-0 w-full  lg:w-80 ${darkMode ? "bg-gray-800/80 border-gray-700 backdrop-blur-md" : "bg-white border-gray-200 shadow-sm"}`}>
    <div className="w-full aspect-square max-w-[180px]  mx-auto">
      <motion.div
        className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center"
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <FiTruck className="text-white text-6xl" />
      </motion.div>
    </div>
    <div>
      <h4 className={`text-sm font-extrabold mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Track in Real-Time</h4>
      <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        Our system updates automatically. You will also receive SMS and email notifications at every major step.
      </p>
    </div>
    <div>
      <h4 className={`text-sm font-extrabold mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Need Help?</h4>
      <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        Contact our support team if your order status seems stuck for more than 24 hours.
      </p>
    </div>
    <div className={`text-xs px-4 py-3 rounded-xl ${darkMode ? "bg-gray-900/60 border border-gray-700" : "bg-emerald-50 border border-emerald-100"}`}>
      <span className="font-semibold text-emerald-500">Tip:</span> You can also track your order from the My Orders section in your account.
    </div>
  </div>
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
    enabled: !!token
  });

  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrder]);

  if (isLoading) return (
    <>
      <style>{STYLES}</style>
      <div className={`track-root min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
        <Hero variant="track" darkMode={darkMode} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className={`rounded-2xl border shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
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
        <Hero variant="track" darkMode={darkMode} />
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10 text-center">
          <div className={`rounded-2xl border shadow-xl p-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 -mx-8 -mt-8 mb-8 rounded-t-2xl" />
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

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === selectedOrder?.status);
  const isCancelled = selectedOrder?.status === "CANCELLED";
  const progressPct = isCancelled ? 0 : Math.round(((currentStepIndex) / (STATUS_STEPS.length - 2)) * 100);

  return (
    <>
      <style>{STYLES}</style>
      <div className={`track-root min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} pt-16 pb-16`}>
        <Hero variant="track" darkMode={darkMode} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className={`rounded-2xl border shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
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
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className={`w-full flex justify-between items-center px-5 py-3.5 rounded-xl border-2 transition-all text-sm font-semibold shadow-sm ${isDropdownOpen
                            ? 'border-emerald-400 shadow-emerald-400/10'
                            : darkMode ? 'bg-gray-900/60 border-gray-700 hover:border-emerald-400/50' : 'bg-gray-50 border-gray-200 hover:border-emerald-400'
                            } ${darkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isCancelled ? 'bg-red-500' : 'bg-emerald-400'}`} />
                            <span>{selectedOrder ? `Order #${selectedOrder.id?.slice(0, 8)}…` : 'Select an order'}</span>
                            {selectedOrder && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${selectedOrder.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : selectedOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                }`}>{selectedOrder.status}</span>
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
                              transition={{ duration: 0.18 }}
                              className={`absolute mt-2 w-full rounded-2xl shadow-2xl border z-50 overflow-hidden thin-scroll max-h-60 overflow-y-auto ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                                }`}
                            >
                              {orders.map((order) => (
                                <button key={order.id}
                                  onClick={() => { setSelectedOrder(order); setIsDropdownOpen(false); }}
                                  className={`w-full text-left px-5 py-3.5 flex items-center justify-between text-sm font-medium transition-colors ${selectedOrder?.id === order.id
                                    ? 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-400'
                                    : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                  <span>Order #{order.id?.slice(0, 8)}…</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                    : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
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
                            <div className={`rounded-xl p-4 border flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-emerald-50/60 border-emerald-100'
                              }`}>
                              <div>
                                <p className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Live Tracking</p>
                                <p className={`text-base font-extrabold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                                  Order <span className={`${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>#{selectedOrder.id?.slice(0, 8)}</span>
                                </p>
                              </div>
                              <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                : selectedOrder.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                }`}>{selectedOrder.status}</span>
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
                                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                    style={{ boxShadow: '0 0 8px rgba(52,211,153,0.5)' }}
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
                                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-400/30'
                                          : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'
                                        } ${isCurrent ? 'step-pulse' : ''}`}>
                                        {step.icon}
                                      </div>
                                      <div className="flex-1 pt-1.5">
                                        <p className={`text-sm font-bold leading-snug ${isCancelledStep ? 'text-red-500 dark:text-red-400'
                                          : isCompleted ? darkMode ? 'text-emerald-400' : 'text-emerald-700'
                                            : darkMode ? 'text-gray-500' : 'text-gray-400'
                                          }`}>{step.label}</p>
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

            <InfoPanel darkMode={darkMode} />
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