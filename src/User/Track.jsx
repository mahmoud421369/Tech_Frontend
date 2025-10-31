import React, { useState, useEffect } from "react";
import {
  FiPackage,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiClock,
  FiChevronDown,
  FiHome,
} from "react-icons/fi";
import { RiCarLine, RiMotorbikeLine, RiTaxiLine } from "react-icons/ri";
import Swal from "sweetalert2";
import api from "../api";

const statusSteps = [
  { key: "PENDING", label: "Pending", icon: <FiClock className="w-6 h-6" /> },
  { key: "CONFIRMED", label: "Confirmed", icon: <FiCheckCircle className="w-6 h-6" /> },
  { key: "PROCESSING", label: "Processing", icon: <FiPackage className="w-6 h-6" /> },
  { key: "FINISHPROCESSING", label: "Finished Processing", icon: <FiCheckCircle className="w-6 h-6" /> },
  { key: "SHIPPED", label: "Shipped", icon: <FiTruck className="w-6 h-6" /> },
  { key: "DELIVERED", label: "Delivered", icon: <FiCheckCircle className="w-6 h-6" /> },
  { key: "CANCELLED", label: "Cancelled", icon: <FiXCircle className="w-6 h-6" /> },
];

const Track = ({ darkMode }) => {
  const token = localStorage.getItem("authToken");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        Swal.fire({
          title: "Login Required",
          text: "Please log in to track your orders",
          icon: "warning",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get("/api/users/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.content || response.data || [];
        setOrders(data);
        if (data.length > 0) setSelectedOrder(data[0]);
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: "Failed to load orders!",
          icon: "error",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [token, darkMode]);

  // Skeleton Loader
  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16`}>
        {/* Hero Skeleton */}
        <section className="relative overflow-hidden">
          <div className={`h-64 ${darkMode ? "bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900" : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"}`}>
            <div className="absolute inset-0 opacity-20">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>
            <div className="max-w-7xl mx-auto px-6 pt-20 text-center">
              <div className="h-12 bg-white/30 backdrop-blur-sm rounded-2xl w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-white/20 rounded-xl w-96 mx-auto animate-pulse"></div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 shadow-xl animate-pulse">
            <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-8"></div>
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16`}>
        <p className="text-xl text-gray-500 dark:text-gray-400">Please log in to track orders.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16`}>
      {/* HERO SECTION WITH CURVED BG + DOTS */}
      <section className="relative overflow-hidden pb-4">
        <div
          className={`absolute inset-0 ${darkMode ? "bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900" : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"}`}
        >
          <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320">
            <path
              fill={darkMode ? "#111827" : "#ffffff"}
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        {/* Animated Dots */}
        {/* <div className="absolute inset-0 opacity-20 pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div> */}

        {/* Floating Icons */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <FiTruck className="absolute top-16 left-10 w-16 h-16 text-white animate-bounce" />
          <RiCarLine className="absolute bottom-20 right-20 w-20 h-20 text-white animate-pulse" />
          <RiMotorbikeLine className="absolute top-1/3 right-1/4 w-14 h-14 text-white animate-ping" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg">
            Track Your Order
          </h1>
          <p className="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Watch your package move from our warehouse to your doorstep in real-time.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-12 -mt-20 relative z-10">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <FiPackage className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-300">No orders yet</p>
              <a
                href="/explore"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-all hover:scale-105"
              >
                <FiHome /> Start Shopping
              </a>
            </div>
          ) : (
            <>
              {/* Order Selector */}
              <div className="relative mb-10">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-transparent hover:border-indigo-500 transition-all text-lg font-medium shadow-md"
                >
                  <span>
                    {selectedOrder ? `Order #${selectedOrder.id} - ${selectedOrder.status}` : "Select Order"}
                  </span>
                  <FiChevronDown className={`text-xl transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto z-50">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-6 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all text-sm"
                      >
                        Order #{order.id} - {order.status}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              {selectedOrder && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 text-center">
                    Live Tracking: Order #{selectedOrder.id}
                  </h2>

                  <div className="relative">
                    {/* Connecting Line */}
                    <div className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-indigo-400 to-transparent dark:from-indigo-500"></div>

                    {statusSteps.map((step, index) => {
                      const currentIndex = statusSteps.findIndex((s) => s.key === selectedOrder.status);
                      const isCompleted = index <= currentIndex && selectedOrder.status !== "CANCELLED";
                      const isCurrent = index === currentIndex;
                      const isCancelled = selectedOrder.status === "CANCELLED" && step.key === "CANCELLED";

                      return (
                        <div
                          key={step.key}
                          className={`flex items-center relative transition-all duration-500 ${isCompleted || isCancelled ? "opacity-100" : "opacity-50"}`}
                        >
                          {/* Icon Circle */}
                          <div
                            className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                              isCancelled
                                ? "bg-red-500 text-white"
                                : isCompleted
                                ? "bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-800"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                            } ${isCurrent ? "animate-pulse scale-110" : ""}`}
                          >
                            {step.icon}
                          </div>

                          {/* Label */}
                          <div className="ml-6 flex-1">
                            <p
                              className={`text-lg font-semibold transition-all ${
                                isCancelled
                                  ? "text-red-600 dark:text-red-400"
                                  : isCompleted
                                  ? "text-indigo-600 dark:text-indigo-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                                Current Status
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 mt-12">
                    <a
                      href="/explore"
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold transition-all hover:scale-105"
                    >
                      <FiHome /> Explore More
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Track;