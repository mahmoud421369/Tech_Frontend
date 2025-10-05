import React, { useState, useEffect } from "react";
import {
  FiPackage,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiClock,
  FiChevronDown,
} from "react-icons/fi";
import { RiCarLine, RiMotorbikeLine, RiTaxiLine } from "react-icons/ri";

const statusSteps = [
  { key: "PENDING", label: "Pending", icon: <FiClock /> },
  { key: "CONFIRMED", label: "Confirmed", icon: <FiCheckCircle /> },
  { key: "PROCESSING", label: "Processing", icon: <FiPackage /> },
  { key: "FINISHPROCESSING", label: "Finished Processing", icon: <FiCheckCircle /> },
  { key: "SHIPPED", label: "Shipped", icon: <FiTruck /> },
  { key: "DELIVERED", label: "Delivered", icon: <FiCheckCircle /> },
  { key: "CANCELLED", label: "Cancelled", icon: <FiXCircle /> },
];

const Track = ({ darkMode }) => {
  const token = localStorage.getItem("authToken");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data.content || []);
        if (data.length > 0) setSelectedOrder(data[0]);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-indigo-600 text-lg font-semibold">
            Loading Tracking...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen mt-16 transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
    
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 mt-16 dark:from-indigo-900 dark:to-gray-800 text-white py-12 px-6 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center justify-center gap-2 animate-fade-in">
            <FiTruck /> Track Your Order
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto">
            Follow the journey of your order in real-time with our tracking system.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {orders.length > 0 ? (
            <div className="relative mb-8">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-between text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {selectedOrder ? `Order #${selectedOrder.id} - ${selectedOrder.status}` : "Select Order"}
                <FiChevronDown
                  className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-md">
                  <div className="p-2 space-y-1">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-600 rounded-lg transition"
                      >
                        Order #{order.id} - {order.status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
              No orders found
            </p>
          )}

          {selectedOrder && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Live Status for Order #{selectedOrder.id}
              </h2>
              <div className="relative">
                <div className="absolute left-5 top-0 h-full w-1 bg-gray-200 dark:bg-gray-700"></div>
                <div className="space-y-6">
                  {statusSteps.map((step, index) => {
                    const currentIndex = statusSteps.findIndex(
                      (s) => s.key === selectedOrder.status
                    );
                    const isCompleted = index <= currentIndex && selectedOrder.status !== "CANCELLED";
                    const isCancelled = step.key === "CANCELLED" && selectedOrder.status === "CANCELLED";

                    return (
                      <div key={step.key} className="flex items-center relative">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                              isCancelled
                                ? "bg-red-500 text-white"
                                : isCompleted
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {step.icon}
                          </div>
                        </div>
                        <div className="ml-6">
                          <p
                            className={`font-semibold text-lg ${
                              isCancelled
                                ? "text-red-600 dark:text-red-400"
                                : isCompleted
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-8">
            <a
              href="/"
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition"
            >
              Home Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Track;