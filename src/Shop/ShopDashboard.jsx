
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaBox,
  FaTools,
  FaWrench,
} from "react-icons/fa";
import {
  RiStore2Line,
  RiToolsFill,
  RiBox2Line,
  RiShoppingBag2Line,
  RiMoneyDollarCircleLine,
  RiInbox2Line,
  RiPriceTag2Line,
  RiMessage2Line,
  RiToolsLine,
} from "react-icons/ri";

const ShopDashboard = () => {
  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [totalSales, setTotalSales] = useState(0);
  const [salesStats, setSalesStats] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [repairsStats, setRepairsStats] = useState(null);
  const [totalRepairs, setTotalRepairs] = useState(0);

  const headers = {"Content-Type":"application/json", Authorization: `Bearer ${token}` };

  const fetchSales = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/dashboard/sales/total`,
        { headers,body: JSON.stringify({ startDate:startDate,endDate:endDate  }) }
      );
      const data = await res.json();
      console.log(data.content);
      setTotalSales(data || 0);
    } catch (err) {
      console.error("❌ Error fetching sales:", err);
    }
  };

  const fetchSalesStats = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/dashboard/sales/stats`,
        { headers }
      );
      const data = await res.json();
      setSalesStats(data.content);
    } catch (err) {
      console.error("❌ Error fetching sales stats:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/dashboard/orders/total?startDate=${startDate}&endDate=${endDate}`,
        { headers }
      );
      const data = await res.json();
      setTotalOrders(data.total || 0);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    }
  };

  const fetchRepairsStats = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/dashboard/repairs/stats?startDate=${startDate}&endDate=${endDate}`,
        { headers }
      );
      const data = await res.json();
      setRepairsStats(data);
    } catch (err) {
      console.error("❌ Error fetching repairs stats:", err);
    }
  };

  const fetchRepairsTotal = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/dashboard/repairs/total?startDate=${startDate}&endDate=${endDate}`,
        { headers }
      );
      const data = await res.json();
      setTotalRepairs(data.total || 0);
    } catch (err) {
      console.error("❌ Error fetching repairs total:", err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchSales();
    fetchSalesStats();
    fetchOrders();
    fetchRepairsStats();
    fetchRepairsTotal();
  }, [startDate, endDate]);

  const menuItems = [
    // { name: "dashboard", icon: <RiStore2Line />, label: "لوحة التحكم", path: "/shop-dashboard" },
    { name: "repairs", icon: <RiToolsFill />, label: "طلبات التصليح", path: "/repair/requests" },
    { name: "devices", icon: <RiBox2Line />, label: "المنتجات", path: "/shop/devices" },
    { name: "orders", icon: <RiShoppingBag2Line />, label: "الطلبات", path: "/shop/orders" },
    { name: "transactions", icon: <RiMoneyDollarCircleLine />, label: "الفواتير", path: "/shop/transactions" },
    { name: "inventory", icon: <RiInbox2Line />, label: "جرد", path: "/shop/inventory" },
    { name: "offers", icon: <RiPriceTag2Line />, label: "العروض", path: "/shop/offers" },
    { name: "support", icon: <RiMessage2Line />, label: "الدعم", path: "/support" },
  ];

  return (
    <div style={{marginTop:"-550px"}} className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"} min-h-screen font-cairo p-6`}>
  
      <header className={`flex justify-between items-center flex-row-reverse mb-6 p-4 rounded-lg shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <h1 className="text-2xl font-bold">لوحة التحكم و الاحصائيات</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600"
        >
          {darkMode ? "☀" : "🌙"}
        </button>
      </header>


      <div className="flex gap-4 mb-6 flex-wrap justify-center">
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-indigo-400 bg-purple-50 font-bold text-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        <input
       type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-indigo-400 bg-purple-50 font-bold text-indigo-500 dark:bg-gray-700 dark:text-white"
        />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className={`p-6 shadow-lg flex items-center justify-between border-l-4 border-indigo-600 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div>
            <h3 className="font-semibold">اجمالي المبيعات</h3>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalSales}</p>
          </div>
          <RiMoneyDollarCircleLine className="text-4xl text-indigo-600 dark:text-indigo-400" />
        </div>

        {salesStats && (
          <div className={`p-6 shadow-lg  flex items-center justify-between border-l-4 border-green-500 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div>
              <h3 className="font-semibold">Sales Today vs Yesterday</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{salesStats.todaySales}</p>
              <small className="text-gray-500 dark:text-gray-300">
                {salesStats.yesterdaySales} ({salesStats.increase ? "⬆" : "⬇"} {salesStats.difference})
              </small>
            </div>
            <FaChartLine className="text-4xl text-green-600 dark:text-green-400" />
          </div>
        )}

        <div className={`p-6 shadow-lg  flex items-center justify-between border-l-4 border-indigo-500 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div>
            <h3 className="font-semibold">اجمالي الطلبات</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalOrders}</p>
          </div>
          <RiBox2Line className="text-4xl text-indigo-600 dark:text-blue-400" />
        </div>

        {repairsStats && (
          <div className={`p-6 shadow-lg  flex items-center justify-between border-l-4 border-purple-500 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div>
              <h3 className="font-semibold">Repairs Today vs Yesterday</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{repairsStats.todayRepairs}</p>
              <small className="text-gray-500 dark:text-gray-300">
                {repairsStats.yesterdayRepairs} ({repairsStats.increase ? "⬆" : "⬇"} {repairsStats.difference})
              </small>
            </div>
            <FaTools className="text-4xl text-purple-600 dark:text-purple-400" />
          </div>
        )}

        <div className={`p-6 shadow-lg  flex items-center justify-between border-l-4 border-indigo-500 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div>
            <h3 className="font-semibold">اجمالي طلبات التصليح</h3>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{totalRepairs}</p>
          </div>
          <RiToolsLine className="text-4xl text-indigo-600 dark:text-pink-400" />
        </div>
      </div>

     
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`cursor-pointer p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center hover:scale-105 transition-transform ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="text-4xl text-indigo-500 mb-2">{item.icon}</div>
            <span className="font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopDashboard;