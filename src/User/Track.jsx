import React, { useState, useEffect, memo } from "react";
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
  FiMapPin,
  FiShield,
  FiRefreshCw,
  FiHeadphones,
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

const Track = memo(({ darkMode }) => {
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
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (isLoading) {
    return (
      <>
        <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16`}>
          <section className="relative overflow-hidden py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl w-full animate-pulse"></div>
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-full animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-5/6 animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mx-auto w-20"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-3 animate-pulse mx-auto w-24"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative h-96 lg:h-[600px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-150" />
                  <div className="relative w-full h-full">
                    <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 border border-gray-200 dark:border-gray-700">
                      <div className="p-4 space-y-3">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-8 bg-lime-500 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 border border-gray-200 dark:border-gray-700">
                      <div className="p-5 space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="w-10 h-10 bg-lime-500 rounded-full mx-auto"></div>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10 border border-gray-200 dark:border-gray-700">
                      <div className="p-4">
                        <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16`}>
          <p className="text-xl text-gray-500 dark:text-gray-400">Please log in to track orders.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-white via-lime-50 to-gray-100"} pt-16`}>
        <section className={`relative overflow-hidden py-16 md:py-24 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                  Track Your Order
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Real-time tracking from warehouse to your doorstep. Watch every step, stay in control.
                </p>
                <div className="flex flex-wrap">
                <div className="grid sm:grid-cols-3 grid-cols-2  gap-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="text-2xl px-3 py-2 font-bold bg-purple-50 text-purple-600 rounded-3xl dark:bg-gray-950 dark:text-purple-400 flex items-center justify-center gap-2">
                      <FiZap /> 98.9%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">On-time delivery</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="text-2xl px-3 py-2 font-bold bg-green-50 text-green-600 rounded-3xl dark:bg-gray-950 dark:text-green-400 flex items-center justify-center gap-2">
                      <FiUsers /> ~50K
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Packages daily</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="flex items-center justify-center gap-1 bg-amber-50 dark:bg-gray-900 rounded-3xl px-3 py-2 text-yellow-500 text-4xl">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">4.9 Average rating</p>
                  </div>
                </div>
              </div>
               </div>
              <div className="relative h-96 lg:h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-150" />
                <div className="relative w-full h-full">
                  <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 hover:rotate-6 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
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
                  <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 hover:-rotate-3 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
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
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10 hover:scale-110 transition-all duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
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

        <section className="py-16 px-6 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">
              Why Customers Love Our Delivery
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: <FiMapPin className="w-10 h-10" />, title: "Real-Time Tracking", desc: "Know exactly where your package is, anytime" },
                { icon: <FiShield className="w-10 h-10" />, title: "Fully Insured", desc: "Every order is protected from loss or damage" },
                { icon: <FiRefreshCw className="w-10 h-10" />, title: "Easy Returns", desc: "30-day hassle-free return policy" },
                { icon: <FiHeadphones className="w-10 h-10" />, title: "24/7 Support", desc: "We're here whenever you need us" },
              ].map((feature, idx) => (
                <div key={idx} className="text-center bg-emerald-50 dark:bg-gray-950  rounded-xl p-5 group hover:scale-105 transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-lime-900 rounded-full mb-5 text-lime-600 dark:text-lime-400 group-hover:bg-lime-600 group-hover:text-white transition-all">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
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
                <div className="relative mb-10">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex justify-between items-center border px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border-2 border-transparent hover:border-lime-500 transition-all text-lg font-medium shadow-md"
                  >
                    <span>
                      {selectedOrder ? `Order #${selectedOrder.id} - ${selectedOrder.status}` : "Select Order"}
                    </span>
                    <FiChevronDown className={`text-xl transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute mt-2 w-full bg-white border dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto z-50">
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

                {selectedOrder && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-lime-600 dark:text-lime-400 text-center">
                      Live Tracking: Order #{selectedOrder.id}
                    </h2>

                    <div className="relative">
                      <div className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-lime-400 to-transparent dark:from-lime-500"></div>

                      {statusSteps.map((step, index) => {
                        const currentIndex = statusSteps.findIndex((s) => s.key === selectedOrder.status);
                        const isCompleted = index <= currentIndex && selectedOrder.status !== "CANCELLED";
                        const isCurrent = index === currentIndex;
                        const isCancelled = selectedOrder.status === "CANCELLED" && step.key === "CANCELLED";

                        return (
                          <div
                            key={step.key}
                            className={`flex items-center gap-6 py-4 relative transition-all duration-500 ${isCompleted || isCancelled ? "opacity-100" : "opacity-50"}`}
                          >
                            <div
                              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 flex-shrink-0 ${
                                isCancelled
                                  ? "bg-red-500 text-white"
                                  : isCompleted
                                  ? "bg-lime-600 text-white ring-4 ring-lime-200 dark:ring-lime-800"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                              } ${isCurrent ? "animate-pulse scale-110" : ""}`}
                            >
                              {step.icon}
                            </div>

                            <div className="flex-1">
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

                    <div className="flex justify-center gap-4 mt-12">
                      <a
                        href="/devices"
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

        <section className="py-20 px-6 bg-gradient-to-b from-transparent to-lime-50 dark:to-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">
              Fast & Reliable Delivery Options
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <RiMotorbikeLine className="w-16 h-16" />,
                  title: "Same-Day Delivery",
                  desc: "Order before 2 PM → Delivered today",
                  badge: "Most Popular",
                  color: "from-orange-400 to-red-500",
                },
                {
                  icon: <RiCarLine className="w-16 h-16" />,
                  title: "Next-Day Delivery",
                  desc: "Guaranteed delivery within 24 hours",
                  badge: "Best Value",
                  color: "from-lime-400 to-emerald-500",
                },
                {
                  icon: <FiTruck className="w-16 h-16" />,
                  title: "Standard Shipping",
                  desc: "2–5 business days, free on orders over $50",
                  badge: "Free",
                  color: "from-blue-400 to-indigo-500",
                },
              ].map((option, idx) => (
                <div
                  key={idx}
                  className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2"
                >
                  {option.badge && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                      {option.badge}
                    </div>
                  )}
                  <div className={`h-2 bg-gradient-to-r ${option.color}`} />
                  <div className="p-8 text-center">
                    <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${option.color} text-white mb-6`}>
                      {option.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{option.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 text-center">
          <a
            href="/devices"
            className="inline-flex items-center gap-3 px-8 py-4 bg-lime-600 hover:bg-lime-700 text-white text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <FiPackage /> Continue Shopping
          </a>
        </section>
      </div>
    </>
  );
});

export default Track;