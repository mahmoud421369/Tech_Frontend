import React, { useEffect, useState, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiPackage, FiTool, FiClock, FiCheckCircle,
  FiBell, FiX, FiTrendingUp
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { getAvailableOrders, getAvailableRepairs, getMyDeliveries, getMyRepairs } from "../api/deliveryApi";
import api from "../api";

const DeliveryDashboard = () => {
  const [stats, setStats] = useState({
    availableOrders: 0,
    myOrders: 0,
    availableRepairs: 0,
    myRepairs: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const [availOrders, availRepairs, myOrdersRes, myRepairsRes] = await Promise.all([
        getAvailableOrders().catch(() => ({ content: [] })),
        getAvailableRepairs().catch(() => ({ content: [] })),
        getMyDeliveries().catch(() => ({ content: [] })),
        getMyRepairs().catch(() => ({ content: [] }))
      ]);

      const newStats = {
        availableOrders: (availOrders?.content || availOrders || []).length,
        availableRepairs: (availRepairs?.content || availRepairs || []).length,
        myOrders: (myOrdersRes?.content || myOrdersRes || []).length,
        myRepairs: (myRepairsRes?.content || myRepairsRes || []).length
      };

      setStats(newStats);

      // Build recent activity
      const activity = [
        ...((myOrdersRes?.content || myOrdersRes || []).slice(0, 4).map(o => ({
          id: o.id,
          type: "order",
          title: `Order #${o.id.slice(-8)}`,
          desc: `${o.status.replace(/_/g, ' ')} • ${o.totalPrice || 0} EGP`,
          time: new Date(o.updatedAt || o.createdAt).getTime(),
          icon: FiPackage,
          color: "emerald"
        }))),
        ...((myRepairsRes?.content || myRepairsRes || []).slice(0, 4).map(r => ({
          id: r.id,
          type: "repair",
          title: `Repair #${r.id.slice(-8)}`,
          desc: `${r.status.replace(/_/g, ' ')} • ${r.price || 0} EGP`,
          time: new Date(r.updatedAt || r.createdAt).getTime(),
          icon: FiTool,
          color: "teal"
        })))
      ].sort((a, b) => b.time - a.time).slice(0, 6);

      setRecentActivity(activity);

      // Auto-refresh notifications every 30s
      if (!silent) fetchNotifications();

    } catch (err) {
      if (!silent) toast.error("Failed to load dashboard data");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications/delivery");
      setNotifications(res.data.content || res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const dismissNotification = async (notifId) => {
    try {
      await api.delete(`/api/notifications/delivery/${notifId}`);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      toast.success("Notification dismissed");
    } catch (err) {
      toast.error("Failed to dismiss notification");
    }
  };

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => loadData(true), 15000);
    const notifInterval = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(notifInterval);
    };
  }, [loadData]);

  const statCards = [
    {
      title: "Available Orders",
      value: stats.availableOrders,
      icon: FiPackage,
      gradient: "from-emerald-500 to-teal-600",
      path: "/delivery/available-orders",
      bg: "bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
      title: "My Deliveries",
      value: stats.myOrders,
      icon: FiClock,
      gradient: "from-blue-500 to-indigo-600",
      path: "/delivery/my-deliveries",
      bg: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      title: "Available Repairs",
      value: stats.availableRepairs,
      icon: FiTool,
      gradient: "from-purple-500 to-pink-600",
      path: "/delivery/available-repair-requests",
      bg: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      title: "My Repairs",
      value: stats.myRepairs,
      icon: FiCheckCircle,
      gradient: "from-orange-500 to-red-600",
      path: "/delivery/my-repairs",
      bg: "bg-orange-100 dark:bg-orange-900/30"
    }
  ];

  return (
    <>
      <ToastContainer position="top-right" theme={document.documentElement.classList.contains("dark") ? "dark" : "light"} />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          
          <div className="text-center mb-12 mt-5">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-6">
              <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl text-white">
                <FiTrendingUp size={48} />
              </div>
              Delivery Dashboard
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Welcome back! Here's your live overview
            </p>
          </div>

         
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl h-48 animate-pulse shadow-xl border border-gray-200 dark:border-gray-800">
                  <div className="p-8 space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
             
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {statCards.map((card) => (
                  <Link
                    key={card.title}
                    to={card.path}
                    className="group relative bg-white dark:bg-gray-900 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-500 hover:-translate-y-4"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl ${card.bg}`}>
                          <card.icon size={36} className={`text-${card.gradient.split(' ')[1].split('-')[1]}-600 dark:text-${card.gradient.split(' ')[1].split('-')[1]}-400`} />
                        </div>
                        <span className="text-4xl font-bold text-gray-800 dark:text-white">
                          {card.value}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Click to view →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <FiBell size={28} className="text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Notifications
                      </h3>
                      {notifications.length > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {notifications.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                          No new notifications
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="relative p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800"
                          >
                            <button
                              onClick={() => dismissNotification(notif.id)}
                              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition"
                            >
                              <FiX size={18} />
                            </button>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {notif.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                              {new Date(notif.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                      <FiClock size={28} className="text-emerald-600 dark:text-emerald-400" />
                      Recent Activity
                    </h3>

                    {recentActivity.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                        No recent deliveries or repairs
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {recentActivity.map((act) => (
                          <div
                            key={`${act.type}-${act.id}`}
                            className="flex items-center gap-5 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                          >
                            <div className={`p-4 rounded-2xl ${act.type === 'order' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                              <act.icon size={28} className={`text-${act.type === 'order' ? 'emerald' : 'amber'}-600 dark:text-${act.type === 'order' ? 'emerald' : 'amber'}-400`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 dark:text-white">
                                {act.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {act.desc}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(act.time).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DeliveryDashboard;