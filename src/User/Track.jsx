import React, { useState, useEffect } from "react";
import {
  FiPackage,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiClock,
  FiChevronDown,
  FiHome,
  FiStar,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { RiCarLine, RiMotorbikeLine } from "react-icons/ri";
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
  const [showCookieBanner, setShowCookieBanner] = useState(true);

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
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl w-96 animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-full animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-5/6 animate-pulse"></div>
                <div className="flex gap-3">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex-1 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-32 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-6 pt-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"></div>
              </div>
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
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-white via-lime-50 to-gray-100"} pt-16`}>
      {/* === HERO SECTION - EXACT MONOTREE STYLE === */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-md text-lime-700 font-bold leading-tight">
                Track your <span className="underline decoration-lime-500 decoration-4">package</span> 
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                Real-time tracking from warehouse to your doorstep. Watch every step, stay in control.
              </p>

              {/* CTA */}
              {/* <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="text"
                  placeholder="Enter tracking number"
                  className="flex-1 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500 outline-none"
                />
                <button className="px-6 py-3 bg-lime-500 text-black font-semibold rounded-xl hover:bg-lime-400 transition shadow-md">
                  Track Now
                </button>
              </div> */}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiZap /> 98.9%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">On-time delivery</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiUsers /> ~50K
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Packages daily</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">4.9 Avg rating</p>
                </div>
              </div>
            </div>

            {/* Right: 3D Illustration */}
            <div className="relative hidden md:block">
              <div className="relative w-full h-96">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-teal-100 dark:from-lime-900 dark:to-teal-900 rounded-3xl blur-3xl opacity-50"></div>

                {/* Phone Mockups */}
                <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 transform-gpu overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-8 bg-lime-500 rounded w-16"></div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="w-8 h-8 bg-lime-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 transform-gpu overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
                        <FiTruck className="text-white text-lg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-3 bg-lime-500 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
                  <div className="p-4">
                    <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <FiPackage className="text-white text-2xl" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === MAIN CONTENT (Mono-tree Style) === */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <FiPackage className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-300">No orders yet</p>
              <a
                href="/explore"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-lime-600 text-white rounded-2xl font-semibold hover:bg-lime-700 transition-all hover:scale-105"
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
                  className="w-full flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-transparent hover:border-lime-500 transition-all text-lg font-medium shadow-md"
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
                        className="w-full text-left px-6 py-3 hover:bg-lime-50 dark:hover:bg-lime-900/50 transition-all text-sm"
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
                  <h2 className="text-2xl font-bold text-lime-600 dark:text-lime-400 text-center">
                    Live Tracking: Order #{selectedOrder.id}
                  </h2>

                  <div className="relative">
                    {/* Connecting Line */}
                    <div className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-lime-400 to-transparent dark:from-lime-500"></div>

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
                                ? "bg-lime-600 text-white ring-4 ring-lime-200 dark:ring-lime-800"
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
                                  ? "text-lime-600 dark:text-lime-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-sm text-lime-600 dark:text-lime-400 mt-1">
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
                      className="flex items-center gap-2 px-6 py-3 bg-lime-600 hover:bg-lime-700 text-white rounded-2xl font-semibold transition-all hover:scale-105"
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

      {/* === COOKIE BANNER === */}
      {/* {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="text-xl">Cookie</div>
              <p>We use cookies to enhance your tracking experience. Learn more in our <a href="#" className="underline">Cookie Policy</a>.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCookieBanner(false)} className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition">Accept</button>
              <button onClick={() => setShowCookieBanner(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition">Reject</button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Track;