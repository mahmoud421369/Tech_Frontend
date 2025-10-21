import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShoppingCart, FiTool, FiHome, FiCopy, FiBarChart2, FiActivity } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import {
  Chart,
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
  <div className="animate-pulse p-4 sm:p-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-1/2 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
              <div className="h-8 w-1/4 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
            </div>
            <div className="h-10 w-10 bg-indigo-200 dark:bg-indigo-700 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow-md h-64">
          <div className="h-8 w-1/3 bg-indigo-200 dark:bg-indigo-700 rounded mb-4"></div>
          <div className="h-full bg-indigo-200 dark:bg-indigo-700 rounded"></div>
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
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : '' },
        });
      },
      (err) => {
        Swal.fire({
          title: 'Error',
          text: `Failed to copy ${label.toLowerCase()}`,
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : '' },
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
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : '' },
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
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : '' },
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
      backgroundColor: darkMode
        ? ['rgba(99, 102, 241, 0.4)', 'rgba(159, 122, 234, 0.4)', 'rgba(139, 92, 246, 0.4)', 'rgba(196, 181, 253, 0.4)']
        : ['rgba(99, 102, 241, 0.6)', 'rgba(159, 122, 234, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(196, 181, 253, 0.6)'],
      borderColor: darkMode
        ? ['rgb(99, 102, 241)', 'rgb(159, 122, 234)', 'rgb(139, 92, 246)', 'rgb(196, 181, 253)']
        : ['rgb(79, 70, 229)', 'rgb(139, 92, 246)', 'rgb(109, 40, 217)', 'rgb(167, 139, 250)'],
      borderWidth: 1.5,
      hoverBackgroundColor: darkMode
        ? ['rgba(99, 102, 241, 0.6)', 'rgba(159, 122, 234, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(196, 181, 253, 0.6)']
        : ['rgba(79, 70, 229, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(109, 40, 217, 0.8)', 'rgba(167, 139, 250, 0.8)'],
    }],
  }), [darkMode, stats]);

  const barChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: darkMode ? '#e0e7ff' : '#4b5e8e', font: { size: 14, weight: 'bold' } },
      },
      title: {
        display: true,
        text: 'Admin Statistics Overview',
        color: darkMode ? '#e0e7ff' : '#4b5e8e',
        font: { size: 18, weight: 'bold' },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(79, 70, 229, 0.9)' : 'rgba(49, 46, 129, 0.9)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        ticks: { color: darkMode ? '#e0e7ff' : '#4b5e8e', font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: darkMode ? '#e0e7ff' : '#4b5e8e', font: { size: 12 } },
        grid: { color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad',
    },
  }), [darkMode]);

  const pieChartData = useMemo(() => ({
    labels: chartLabels,
    datasets: [{
      data: chartValues,
      backgroundColor: darkMode
        ? ['rgba(99, 102, 241, 0.6)', 'rgba(159, 122, 234, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(196, 181, 253, 0.6)']
        : ['rgba(99, 102, 241, 0.8)', 'rgba(159, 122, 234, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(196, 181, 253, 0.8)'],
      borderColor: darkMode
        ? ['rgb(99, 102, 241)', 'rgb(159, 122, 234)', 'rgb(139, 92, 246)', 'rgb(196, 181, 253)']
        : ['rgb(79, 70, 229)', 'rgb(139, 92, 246)', 'rgb(109, 40, 217)', 'rgb(167, 139, 250)'],
      borderWidth: 1.5,
      hoverBackgroundColor: darkMode
        ? ['rgba(99, 102, 241, 0.8)', 'rgba(159, 122, 234, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(196, 181, 253, 0.8)']
        : ['rgba(79, 70, 229, 1)', 'rgba(139, 92, 246, 1)', 'rgba(109, 40, 217, 1)', 'rgba(167, 139, 250, 1)'],
    }],
  }), [darkMode, stats]);

  const pieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: darkMode ? '#e0e7ff' : '#4b5e8e', font: { size: 14, weight: 'bold' } },
      },
      title: {
        display: true,
        text: 'Distribution of Stats',
        color: darkMode ? '#e0e7ff' : '#4b5e8e',
        font: { size: 18, weight: 'bold' },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(79, 70, 229, 0.9)' : 'rgba(49, 46, 129, 0.9)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad',
    },
  }), [darkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 animate-fade-in mt-14">
      <div className="max-w-full sm:max-w-7xl mx-auto">
        <div className="bg-white dark:bg-indigo-900 mb-6 rounded-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4 items-center">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-4 text-indigo-600 dark:text-indigo-200">
            <FiActivity />
            Admin Dashboard
          </h1>
          <p className="text-indigo-600 dark:text-indigo-300 text-sm sm:text-base">
            Overview of key metrics and statistics
          </p>
        </div>
        {loading ? (
          <DashboardSkeleton darkMode={darkMode} />
        ) : !stats ? (
          <div className="bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow-md p-6 sm:p-8 text-center transition-all duration-300">
            <FiBarChart2 className="text-5xl sm:text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            <h3 className="text-lg sm:text-xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">
              No stats available
            </h3>
            <p className="text-indigo-600 dark:text-indigo-300 text-sm sm:text-base">
              Unable to load dashboard statistics. Please try again.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {[
                { title: 'Total Users', value: stats.users, icon: <FiUsers className="text-3xl sm:text-4xl text-indigo-500 dark:text-indigo-400" /> },
                { title: 'Total Shops', value: stats.shops, icon: <FiHome className="text-3xl sm:text-4xl text-indigo-500 dark:text-indigo-400" /> },
                { title: 'Total Repair Requests', value: stats.repairs, icon: <FiTool className="text-3xl sm:text-4xl text-indigo-500 dark:text-indigo-400" /> },
                { title: 'Total Orders', value: stats.orders, icon: <FiShoppingCart className="text-3xl sm:text-4xl text-indigo-500 dark:text-indigo-400" /> },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="p-4 sm:p-6 bg-white dark:bg-indigo-900 shadow-lg flex items-center justify-between border-l-4 border-indigo-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                >
                  <div>
                    <h3 className="font-semibold text-indigo-700 dark:text-indigo-200 text-base sm:text-lg">
                      {stat.title}
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      {stat.value || '-'}
                      <button
                        onClick={() => copyToClipboard(stat.value || '0', stat.title)}
                        className="relative group p-1 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-transform duration-200 hover:scale-110"
                        title={`Copy ${stat.title}`}
                      >
                        <FiCopy />
                        <span className="absolute hidden group-hover:block bg-indigo-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                          Copy {stat.title}
                        </span>
                      </button>
                    </p>
                  </div>
                  {stat.icon}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-indigo-900 rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-xl h-80 sm:h-96">
                <Bar options={barChartOptions} data={barChartData} />
              </div>
              <div className="bg-white dark:bg-indigo-900 rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-xl h-80 sm:h-96">
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