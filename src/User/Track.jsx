import React, { useState, useEffect } from "react";
import {
  FiPackage,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiClock,
  FiChevronDown
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
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-blue-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-blue-600 text-xl font-semibold">
            Loading Tracking...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen mt-20 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      } mt-6 p-6`}
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mt-20">
       
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2 text-blue-500 dark:text-white">
          <FiTruck/>  Track Your Order
          </h1>
        </div>

        
        {orders.length > 0 ? (
             <div className="relative w-full inline-flex mb-8">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="py-3 w-full px-4 inline-flex items-center justify-between gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50"
            >
              {selectedOrder ? `Order #${selectedOrder.id} - ${selectedOrder.status}` : "Select Order"}
              <FiChevronDown
                className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

           
            {isDropdownOpen && (
              <div className="absolute z-10 mt-2 w-60 bg-white overflow-y-auto shadow-md rounded-lg border border-gray-200">
                <div className="p-1 space-y-0.5">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100"
                    >
                      #{order.id} 
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        ) : (
          <p className="text-center text-gray-500">No orders found</p>
        )}

        
        {selectedOrder && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Live Status for Order #{selectedOrder.id}
            </h2>

            <div className="relative">
              
              <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>

              <div className="space-y-8">
                {statusSteps.map((step, index) => {
                  const currentIndex = statusSteps.findIndex(
                    (s) => s.key === selectedOrder.status
                  );
                  const isCompleted = index <= currentIndex && selectedOrder.status !== "CANCELLED";
                  const isCancelled = step.key === "CANCELLED" && selectedOrder.status === "CANCELLED";

                  return (
                    <div key={step.key} className="flex items-start relative">
                      
                      <div className="relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center z-10 
                          ${
                            isCancelled
                              ? "bg-red-500 text-white"
                              : isCompleted
                              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {step.icon}
                        </div>

                        
                        {index !== statusSteps.length - 1 && (
                          <div className="absolute left-4 top-8 h-8 w-0.5 bg-gray-200"></div>
                        )}
                      </div>

                      
                      <div className="ml-4">
                        <p
                          className={`font-medium ${
                            isCancelled
                              ? "text-red-600"
                              : isCompleted
                              ? "text-indigo-600"
                              : "text-gray-600 dark:text-gray-300"
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
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:opacity-90 transition-colors">
            Home Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default Track;