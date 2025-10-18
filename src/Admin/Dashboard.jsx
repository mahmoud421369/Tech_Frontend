import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShoppingCart, FiTool, FiHome, FiCopy, FiBarChart2 } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import {
  Chart ,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const DashboardSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="p-6 bg-white dark:bg-gray-950 rounded-lg shadow-md h-64">
          <div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="h-full bg-gray-300 dark:bg-gray-600 rounded"></div>
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

  useEffect(() => {
    fetchStats();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchStats]);

  const chartLabels = ['Users', 'Shops', 'Repair Requests', 'Orders'];
  const chartValues = [stats?.users || 0, stats?.shops || 0, stats?.repairs || 0, stats?.orders || 0];

  const barChartData = useMemo(() => ({
    labels: chartLabels,
    datasets: [{
      label: 'Counts',
      data: chartValues,
      backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.6)',
      borderColor: darkMode ? 'rgba(99, 102, 241, 0.8)' : 'rgb(99, 102, 241)',
      borderWidth: 1,
    }],
  }), [darkMode, stats]);

  const barChartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: darkMode ? '#e5e7eb' : '#1f2937' } },
      title: { display: true, text: 'Admin Statistics Overview', color: darkMode ? '#e5e7eb' : '#1f2937' },
    },
    scales: {
      x: { ticks: { color: darkMode ? '#e5e7eb' : '#1f2937' } },
      y: { beginAtZero: true, ticks: { color: darkMode ? '#e5e7eb' : '#1f2937' } },
    },
  }), [darkMode]);

  const pieChartData = useMemo(() => ({
    labels: chartLabels,
    datasets: [{
      data: chartValues,
      backgroundColor: [
        darkMode ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.8)',
        darkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.8)',
        darkMode ? 'rgba(129, 140, 248, 0.6)' : 'rgba(129, 140, 248, 0.8)',
        darkMode ? 'rgba(167, 139, 250, 0.6)' : 'rgba(167, 139, 250, 0.8)',
      ],
      borderColor: [
        'rgb(99, 102, 241)',
        'rgb(59, 130, 246)',
        'rgb(129, 140, 248)',
        'rgb(167, 139, 250)',
      ],
      borderWidth: 1,
    }],
  }), [darkMode, stats]);

  const pieChartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: darkMode ? '#e5e7eb' : '#1f2937' } },
      title: { display: true, text: 'Distribution of Stats', color: darkMode ? '#e5e7eb' : '#1f2937' },
    },
  }), [darkMode]);

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
            <div style={{ marginLeft: "250px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { title: 'Total Users', value: stats.users, icon: <FiUsers className="text-4xl text-indigo-600 dark:text-indigo-400" /> },
                { title: 'Total Shops', value: stats.shops, icon: <FiHome className="text-4xl text-indigo-600 dark:text-indigo-400" /> },
                { title: 'Total Repair Requests', value: stats.repairs, icon: <FiTool className="text-4xl text-indigo-600 dark:text-indigo-400" /> },
                { title: 'Total Orders', value: stats.orders, icon: <FiShoppingCart className="text-4xl text-indigo-600 dark:text-indigo-400" /> },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="p-6 bg-white dark:bg-gray-950 shadow-md flex items-center justify-between border-l-4 border-indigo-600 transition-all duration-300 transform hover:-translate-y-1"
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

            <div style={{ marginLeft: "250px" }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-6">
                <Bar options={barChartOptions} data={barChartData} />
              </div>
              <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-6">
                <Pie options={pieChartOptions} data={pieChartData} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;