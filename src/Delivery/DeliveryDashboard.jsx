import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiPackage, FiClock, FiTool, FiCheckCircle } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getAvailableOrders, getAvailableRepairs, getMyDeliveries, getMyRepairs } from "../api/deliveryApi";

const DeliveryDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [availableRepairs, setAvailableRepairs] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myRepairs, setMyRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

 // Replace your loadData + useEffect with this improved version

const loadData = useCallback(async (silent = false) => {
  if (!silent) setIsLoading(true);

  try {
    const [ordersRes, repairsRes, myOrdersRes, myRepairsRes] = await Promise.all([
      getAvailableOrders().catch(() => ({ content: [] })),
      getAvailableRepairs().catch(() => ({ content: [] })),
      getMyDeliveries().catch(() => ({ content: [] })),
      getMyRepairs().catch(() => ({ content: [] })),
    ]);

    // Safely extract .content OR fallback to empty array
    setAvailableOrders(ordersRes?.content || ordersRes || []);
    setAvailableRepairs(repairsRes?.content || repairsRes || []);
    setMyOrders(myOrdersRes?.content || myOrdersRes || []);
    setMyRepairs(myRepairsRes?.content || myRepairsRes || []);

  } catch (err) {
    // Only show error on first load, not on auto-refresh
    if (!silent) {
      toast.error("Failed to load data. Check your connection.");
    }
    console.error("Dashboard load error:", err);
  } finally {
    if (!silent) setIsLoading(false);
  }
}, []);

// First load: show spinner
useEffect(() => {
  loadData(false); // false = show loading
}, [loadData]);

// Auto-refresh every 15 seconds: silent (no spinner, no toast)
useEffect(() => {
  const interval = setInterval(() => {
    loadData(true); // true = silent refresh
  }, 15000);
  return () => clearInterval(interval);
}, [loadData]);

  const cards = [
    {
      title: "Available Orders",
      value: availableOrders.length,
      icon: <FiPackage className="text-4xl" />,
      color: "text-indigo-600",
      path: "/delivery/available-orders",
    },
    {
      title: "My Deliveries",
      value: myOrders.length,
      icon: <FiClock className="text-4xl" />,
      color: "text-indigo-600",
      path: "/delivery/my-deliveries",
    },
    {
      title: "Available Repairs",
      value: availableRepairs.length,
      icon: <FiTool className="text-4xl" />,
      color: "text-indigo-600",
      path: "/delivery/available-repair-requests",
    },
    {
      title: "My Repair Deliveries",
      value: myRepairs.length,
      icon: <FiCheckCircle className="text-4xl" />,
      color: "text-indigo-600",
      path: "/delivery/my-repairs",
    },
  ];

  const recentActivities = [
    ...myOrders.slice(0, 3).map((order) => ({
      id: order.id,
      type: "Order",
      description: `Order #${order.id} - ${order.status} (Price: ${order.totalPrice} EGP)`,
      timestamp: new Date(order.createdAt).toLocaleString(),
    })),
    ...myRepairs.slice(0, 3).map((repair) => ({
      id: repair.id,
      type: "Repair",
      description: `Repair #${repair.id} - ${repair.status} (Price: ${repair.price} EGP)`,
      timestamp: new Date(repair.createdAt).toLocaleString(),
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 transition-colors duration-300">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
          Delivery <span className="text-indigo-600 dark:text-indigo-400">Dashboard</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Your quick overview of orders and repairs
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
              <Link
                to={card.path || "#"}
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-105 p-6 flex flex-col justify-between border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`text-indigo-600 dark:text-indigo-400 ${card.color}`}>
                    {card.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {card.title}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {card.value}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-auto">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Recent Activity
            </h3>
            {recentActivities.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">
                No recent activity available.
              </p>
            )}
            {recentActivities.length > 0 && (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === "Order"
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {activity.type === "Order" ? <FiPackage /> : <FiTool />}
                    </div>
                    <div>
                      <p>{activity.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryDashboard;