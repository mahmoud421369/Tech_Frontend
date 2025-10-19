
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
import Swal from "sweetalert2";
import api from "../api";

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
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setError("No auth token found. Please log in.");
       Swal.fire({
                          title: 'Authentication Required',
                          text: 'please login in your account or create one!',
                          icon: 'warning',
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 1500,
                        })
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await api.get("/api/users/orders");
        const data = response.data.content || response.data || [];
        setOrders(data);
        if (data.length > 0) setSelectedOrder(data[0]);
        setError("");
        if(data.length === 0 ){
          setOrders([])
        }
      } catch (err) {
        console.error("Error fetching orders:", err.response?.data || err.message);
    
       Swal.fire({
                          title: 'Error',
                          text: 'failed to load orders!',
                          icon: 'error',
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 1500,
                        })
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [token, darkMode]);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"} pt-16`}>
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-gray-800 text-white py-12 px-6">
          <div className="max-w-7xl mx-auto text-center animate-pulse">
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-8"></div>
            <div className="space-y-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="ml-6">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"} flex items-center justify-center pt-16`}>
        <div className="text-red-500 dark:text-red-400 text-center text-lg font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen mt-4 ${darkMode ? "bg-gray-900" : "bg-gray-100"} pt-16 transition-all duration-300`}>
      <div className="bg-gradient-to-r from-white dark:from-indigo-900 dark:to-gray-800 text-indigo-500 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl text-indigo-600 dark:text-white flex items-center justify-center gap-4 sm:text-4xl md:text-5xl font-extrabold">
            <FiTruck className="text-4xl" /> Track Your Order
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-200 max-w-xl sm:max-w-2xl mx-auto">
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
                className={`w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-between text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-1 ${
                  isDropdownOpen ? "ring-2 ring-indigo-500" : ""
                }`}
              >
                {selectedOrder ? `Order #${selectedOrder.id} - ${selectedOrder.status}` : "Select Order"}
                <FiChevronDown
                  className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-md animate-fade-in">
                  <div className="p-2 space-y-1">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-600 rounded-lg transition-all duration-300 transform hover:-translate-y-1"
                      >
                        Order #{order.id} - {order.status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 text-lg animate-fade-in">
              No orders found
            </p>
          )}

          {selectedOrder && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 animate-fade-in">
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
                      <div key={step.key} className="flex items-center relative animate-fade-in">
                        <div className="relative">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 transform hover:scale-110 ${
                              isCancelled
                                ? "bg-red-500 text-white"
                                : isCompleted
                                ? "bg-indigo-600 dark:bg-indigo-500 text-white"
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
              className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 transform hover:-translate-y-1"
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