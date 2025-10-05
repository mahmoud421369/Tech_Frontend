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
  RiNotification2Line,
} from "react-icons/ri";

const ShopDashboard = () => {
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalSales, setTotalSales] = useState(0);
  const [salesStats, setSalesStats] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [repairsStats, setRepairsStats] = useState(null);
  const [totalRepairs, setTotalRepairs] = useState(0);
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};
const fetchSales = async () => {
  try {
    const res = await fetch(
      `http://localhost:8080/api/shops/dashboard/sales/total`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ startDate, endDate }),
      }
    );
    const data = await res.json();
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
      setSalesStats(data);
    } catch (err) {
      console.error("❌ Error fetching sales stats:", err);
    }
  };

  


const fetchOrders = async () => {
  try {
    const res = await fetch(
      `http://localhost:8080/api/shops/dashboard/orders/total`,
      {
        method: "POST",  
        headers,
        body: JSON.stringify({ startDate, endDate }),
      }
    );
    const data = await res.json();
    setTotalOrders(data || 0);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
  }
};

const fetchRepairsStats = async () => {
  try {
    const res = await fetch(
      `http://localhost:8080/api/shops/dashboard/repairs/stats`,
      {
        headers,
   
      }
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
      `http://localhost:8080/api/shops/dashboard/repairs/total`,
      {
        headers,
   
      }
    );
    const data = await res.json();
    setTotalRepairs(data || 0);
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
    { name: "repairs", icon: <RiToolsFill />, label: "طلبات التصليح", path: "/repair/requests" },
    { name: "devices", icon: <RiBox2Line />, label: "المنتجات", path: "/shop/devices" },
    { name: "orders", icon: <RiShoppingBag2Line />, label: "الطلبات", path: "/shop/orders" },
    { name: "transactions", icon: <RiMoneyDollarCircleLine />, label: "الفواتير", path: "/shop/transactions" },
    { name: "inventory", icon: <RiInbox2Line />, label: "جرد", path: "/shop/inventory" },
    { name: "offers", icon: <RiPriceTag2Line />, label: "العروض", path: "/shop/offers" },
    { name: "support", icon: <RiMessage2Line />, label: "الدعم", path: "/support" },
    { name: "notifications", icon: <RiNotification2Line />, label: "الاشعارات", path: "/shop/notifications" },
    
  ];

  return (
    <div style={{marginTop:"-600px"}} className="min-h-screen font-cairo bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      
      <header className="bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-black dark:to-gray-900 text-white mb-10 p-6 rounded-2xl shadow-xl flex justify-between items-center flex-row-reverse">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight animate-slide-in-right">
          لوحة التحكم و الإحصائيات
        </h1>
      </header>

     
      <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center">
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-3 rounded-lg border-2 border-indigo-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-semibold focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all duration-300 w-full sm:w-64 shadow-sm hover:shadow-md"
        />
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-3 rounded-lg border-2 border-indigo-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-semibold focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all duration-300 w-full sm:w-64 shadow-sm hover:shadow-md"
        />
      </div>

     
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-indigo-600 dark:border-indigo-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">إجمالي المبيعات</h3>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalSales} EGP</p>
            </div>
            <RiMoneyDollarCircleLine className="text-4xl text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {salesStats && (
          <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-green-500 dark:border-green-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">المبيعات اليوم مقابل الأمس</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{salesStats.todaySales} EGP</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                   {salesStats.yesterdaySales} EGP : الامس (
                  {salesStats.increased ? <span className="text-green-500">⬆</span> : <span className="text-red-500">⬇</span>} {salesStats.difference} EGP)
                </p>
              </div>
              <FaChartLine className="text-4xl text-green-600 dark:text-green-400" />
            </div>
          </div>
        )}

        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-blue-500 dark:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">إجمالي الطلبات</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalOrders}</p>
            </div>
            <RiBox2Line className="text-4xl text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {repairsStats && (
          <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-purple-500 dark:border-purple-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">التصليحات اليوم مقابل الأمس</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{repairsStats.todayRepairs}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  الأمس: {repairsStats.yesterdayRepairs} (
                  {repairsStats.increase ? <span className="text-green-500">⬆</span> : <span className="text-red-500">⬇</span>} {repairsStats.difference})
                </p>
              </div>
              <FaTools className="text-4xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        )}

        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-pink-500 dark:border-pink-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">إجمالي طلبات التصليح</h3>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{totalRepairs}</p>
            </div>
            <RiToolsLine className="text-4xl text-pink-600 dark:text-pink-400" />
          </div>
        </div>
      </div>

   
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.name}
            onClick={() => navigate(item.path)}
            className="cursor-pointer p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl text-indigo-600 dark:text-indigo-400 mb-3">{item.icon}</div>
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopDashboard;