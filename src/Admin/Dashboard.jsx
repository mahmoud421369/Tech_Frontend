
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShoppingCart, FiLayers, FiTag, FiMessageSquare, FiTruck, FiUserCheck, FiCopy, FiBarChart2, FiHome, FiTool, FiBox } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';


const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const DashboardSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="p-6 bg-white dark:bg-gray-950 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(7)].map((_, idx) => (
        <div key={idx} className="p-6 bg-white dark:bg-gray-950 rounded-lg shadow-md">
          <div className="flex flex-col items-center justify-center">
            <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full mb-4"></div>
            <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  const copyToClipboard = useCallback((value, label) => {
    navigator.clipboard.writeText(value).then(
      () => {
        Swal.fire({
          title: 'Success',
          text: `${label} copied to clipboard!`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      },
      (err) => {
        console.error('Copy failed:', err);
        Swal.fire({
          title: 'Error',
          text: `Failed to copy ${label.toLowerCase()}`,
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    );
  }, [darkMode]);

  const fetchStats = useCallback(async () => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No authentication token found. Please log in.',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      navigate('/login');
      return;
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      const response = await api.get('/api/admin/stats', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched stats:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to load stats',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setStats(null);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [token, navigate, darkMode]);

  const cards = useMemo(
    () => [
      { title: 'Users', icon: <FiUsers size={24} />, path: '/users'},
      { title: 'Shops', icon: <FiHome size={24} />, path: '/repair-shops'},
      { title: "Repair Requests", icon: <FiTool />, label: "Repair Shops",path: "/admin/repair-requests"},
      { title: "Products ", icon: <FiBox />, label: "Products", path: "/admin/products" },
      { title: 'Categories', icon: <FiLayers size={24} />, path: '/category'},
      { title: 'Offers', icon: <FiTag size={24} />, path: '/admin/offers' },
      { title: 'Reviews', icon: <FiMessageSquare size={24} />, path: '/reviews' },
      { title: 'Delivery', icon: <FiTruck size={24} />, path: '/deliveries' },
      { title: 'Assigners', icon: <FiUserCheck size={24} />, path: '/assigners' },
    ],
    []
  );

  useEffect(() => {
    fetchStats();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mt-14 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <DashboardSkeleton darkMode={darkMode} />
        ) : !stats ? (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-8 text-center">
            <FiBarChart2 className="text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No stats available</h3>
            <p className="text-gray-600 dark:text-gray-400">Unable to load dashboard statistics. Please try again.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { title: 'Total Users', value: stats.users, icon: <FiUsers className="text-4xl text-indigo-600 dark:text-indigo-400" /> },
                { title: 'Total Shops', value: stats.shops, icon: <FiHome className="text-4xl text-indigo-600 dark:text-indigo-400" /> },
                { title: 'Total Repair Requests', value: stats.repairs, icon: <FiTool className="text-4xl text-indigo-600 dark:text-indigo-400" /> },
                { title: 'Total Orders', value: stats.orders, icon: <FiShoppingCart className="text-4xl text-indigo-600 dark:text-indigo-400" /> },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="p-6 bg-white dark:bg-gray-950  shadow-md flex items-center justify-between border-l-4 border-indigo-600 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stat.title}</h3>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      {stat.value || '-'}
                      <button
                        onClick={() => copyToClipboard(stat.value || '0', stat.title)}
                        className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title={`Copy ${stat.title}`}
                      >
                        <FiCopy />
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                          Copy {stat.title}
                        </span>
                      </button>
                    </p>
                  </div>
                  {stat.icon}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {cards.map((card, index) => (
                <div
                  key={index}
                  onClick={() => navigate(card.path)}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="relative bg-white dark:bg-gray-950 cursor-pointer rounded-xl p-6 shadow-md flex flex-col items-center justify-center transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="text-3xl bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 p-4 rounded-full mb-4">
                    {card.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{card.title}</p>
                
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
