
import React, { useEffect, useState } from "react";
import { FiPackage, FiClock, FiCheckCircle, FiAlertTriangle, FiTool } from "react-icons/fi";
import { getAvailableOrders, getAvailableRepairs, getMyDeliveries, getMyRepairs } from "../api/deliveryApi";
import { Link } from "react-router-dom";

const DeliveryDashboard = () => {
  const token = localStorage.getItem("authToken");
  const [availableOrders, setAvailableOrders] = useState([]);
  const [availableRepairs, setAvailableRepairs] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myRepairs, setMyRepairs] = useState([]);

  useEffect(() => {
    getAvailableOrders(token).then(setAvailableOrders).catch(console.error);
    getAvailableRepairs(token).then(setAvailableRepairs).catch(console.error);
    getMyDeliveries(token).then(setMyOrders).catch(console.error);
    getMyRepairs(token).then(setMyRepairs).catch(console.error);
  }, [token]);

  const cards = [
    {
      title: "Available Orders",
      value: availableOrders.length,
      icon: <FiPackage />,
      color: "text-indigo-600",
      path: "/delivery/available-orders",
    },
    {
      title: "My Deliveries",
      value: myOrders.length,
      icon: <FiClock />,
      color: "text-indigo-600",
      path: "/delivery/my-deliveries",
    },
    {
      title: "Available Repairs",
      value: availableRepairs.length,
      icon: <FiTool />,
      color: "text-indigo-600",
      path: "/delivery/available-repair-requests",
    },
    {
      title: "My Repair Deliveries",
      value: myRepairs.length,
      icon: <FiCheckCircle />,
      color: "text-indigo-600",
      path: "/delivery/my-repairs",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-300">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
          Delivery <span className="text-indigo-600 dark:text-indigo-400">Dashboard</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Quick overview of your orders and repairs
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Link
            to={c.path || "#"}
            key={i}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-2xl transition transform hover:scale-105 p-6 flex flex-col justify-between"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-4xl ${c.color}`}>{c.icon}</div>
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {c.title}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {c.value}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-auto">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </Link>
        ))}
      </div>


      <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Recent Activity
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          You can show recent orders, repairs, or notifications here.
        </p>
      </div>
    </div>
  );
};

export default DeliveryDashboard;