import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiTool,
  FiLayers,
  FiTag,
  FiMessageSquare,
  FiTruck,
  FiUserCheck,
} from "react-icons/fi";
import { RiUser3Line } from "react-icons/ri";
import { RiOrderPlayLine, RiShoppingBag4Line, RiStore2Line, RiToolsLine } from "@remixicon/react";

const Dashboard = ({ darkMode }) => {
  const token = localStorage.getItem("authToken");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched stats:", data);
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
        setLoading(false);
      });
  }, [token]);

  const cards = [
    { title: "Users",  icon: <FiUsers size={24} />, path: "/users", quick: "Manage all registered users" },
    { title: "Repair Shops",  icon: <FiTool size={24} />, path: "/repair-shops", quick: "Track active and pending shops" },
    { title: "Categories",  icon: <FiLayers size={24} />, path: "/category", quick: "Organize repair categories" },
    { title: "Offers",  icon: <FiTag size={24} />, path: "/admin/offers", quick: "View active offers and discounts" },
    { title: "Reviews",  icon: <FiMessageSquare size={24} />, path: "/reviews", quick: "Moderate customer reviews" },
    { title: "Delivery",  icon: <FiTruck size={24} />, path: "/deliveries", quick: "Manage delivery persons" },
    { title: "Assigners", icon: <FiUserCheck size={24} />, path: "/assigners", quick: "Control assigner accounts" },
  ];

  return (
    <div
      style={{ marginTop: "60px" }}
      className="flex-1 mt-20 p-6 bg-[#f1f5f9] dark:bg-gray-900 min-h-screen transition-colors duration-300"
    >



{/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className={`p-6 shadow-lg flex items-center justify-between dark:bg-gray-950 border-l-4 border-indigo-600 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div>
            <h3 className="font-semibold dark:text-white"> Total Users</h3>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.users ? stats.users : 0}</p>
          </div>
          <RiUser3Line className="text-4xl text-indigo-600 dark:text-indigo-400" />
        </div>


        <div className={`p-6 shadow-lg  flex items-center justify-between dark:bg-gray-950 border-l-4 border-indigo-500 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div>
            <h3 className="font-semibold dark:text-white">Total Shops</h3>
            <p className="text-2xl font-bold text-indigo-600 dark:text-blue-400">{stats.shops}</p>
          </div>
          <RiStore2Line className="text-4xl text-indigo-600 dark:text-blue-400" />
        </div>


        <div className=" dark:bg-gray-950 p-6 shadow-lg  flex items-center justify-between border-l-4 border-indigo-500  bg-white">
          <div>
            <h3 className="font-semibold dark:text-white">Total Repair Requests</h3>
            <p className="text-2xl font-bold text-indigo-600 dark:text-pink-400">{stats.repairs}</p>
          </div>
          <RiToolsLine className="text-4xl text-indigo-600 dark:text-pink-400" />
        </div>

          <div className="dark:bg-gray-950 p-6 shadow-lg  flex items-center justify-between border-l-4 border-indigo-500 bg-white">
          <div>
            <h3 className="font-semibold dark:text-white">Total Orders</h3>
            <p className="text-2xl font-bold text-indigo-600 dark:text-pink-400">{stats.orders}</p>
          </div>
          <RiShoppingBag4Line className="text-4xl text-indigo-600 dark:text-pink-400" />
        </div>
      </div>


      {loading ? (
        <p className="text-center text-blue-500 dark:text-blue-300 animate-pulse">
          Loading stats...
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              className="relative bg-white dark:bg-gray-800 cursor-pointer rounded-xl p-6 shadow-md flex flex-col items-center justify-center transition transform hover:scale-105 ${
               
              "
            >
              <div className="text-3xl bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-300 p-4 rounded-full mb-4">
                {card.icon}
              </div>
              <p
                className="text-sm mb-1 text-gray-500 dark:text-white
           
                "
              >
                {card.title}
              </p>
              {/* <p className="text-2xl font-bold">{card.value}</p> */}

              {/* Hover Quick Stats Popup */}
              {/* {hoveredCard === index && (
                <div
                  className={`absolute top-full mt-2 w-52 p-4 rounded-lg shadow-lg z-10 ${
                    darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                  }`}
                >
                  <p className="text-sm font-semibold text-blue-500 dark:text-blue-300">
                    {card.title} Quick Stats
                  </p>
                  <p className="text-xs mt-1">{card.quick}</p>
                </div>
              )} */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;