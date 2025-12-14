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
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const DashboardSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-4 sm:p-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="p-4 sm:p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="p-4 sm:p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md h-64">
          <div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-full bg-gray-300 dark:bg-gray-700 rounded"></div>
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
          title: 'Copied!',
          text: `${label} copied!`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          background: darkMode ? '#1f2937' : '#fff',
          color: darkMode ? '#d1d5db' : '#111',
        });
      },
      () => {
        Swal.fire({
          title: 'Error',
          text: 'Failed to copy',
          icon: 'error',
          toast: true,
          position: 'top-end',
          timer: 1500,
        });
      }
    );
  }, [darkMode]);


  const fetchStats = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/stats', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(data);
    } catch (error) {
      const msg = error.response?.status === 401
        ? 'Session expired. Logging out...'
        : 'Failed to load data.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setStats(null);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [token, navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  
  const chartLabels = ['Users', 'Shops', 'Repair Requests', 'Orders'];
  const chartValues = [stats?.users || 0, stats?.shops || 0, stats?.repairs || 0, stats?.orders || 0];

  const lightColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // emerald, blue, amber, red
  const darkColors = ['#34d399', '#60a5fa', '#fbbf24', '#f87171'];

  const barChartData = useMemo(() => ({
    labels: chartLabels,
    datasets: [{
      label: 'Count',
      data: chartValues,
      backgroundColor: darkMode ? darkColors.map(c => c + '80') : lightColors.map(c => c + '99'),
      borderColor: darkMode ? darkColors : lightColors,
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }],
  }), [darkMode, chartValues]);

  const pieChartData = useMemo(() => ({
    labels: chartLabels,
    datasets: [{
      data: chartValues,
      backgroundColor: darkMode ? darkColors.map(c => c + 'CC') : lightColors,
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 12,
    }],
  }), [darkMode, chartValues]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151',
          font: { size: 13, weight: '600' },
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        color: darkMode ? '#e5e7eb' : '#1f2937',
        font: { size: 18, weight: 'bold' },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#e5e7eb' : '#1f2937',
        bodyColor: darkMode ? '#d1d5db' : '#374151',
        borderColor: darkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    animation: { duration: 1200, easing: 'easeOutQuart' },
  }), [darkMode]);

  const barOptions = { ...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Statistics Overview' } } };
  const pieOptions = { ...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Data Distribution' } } };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <div className="max-w-7xl mx-auto">

     
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
              <FiActivity /> Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time platform insights
            </p>
          </div>
        </div>

      
        {loading ? (
          <DashboardSkeleton darkMode={darkMode} />
        ) : !stats ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-10 text-center border border-gray-200 dark:border-gray-700">
            <FiBarChart2 className="mx-auto text-6xl text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Data</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Try refreshing.</p>
          </div>
        ) : (
          <>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[
                { title: 'Total Users', value: stats.users, icon: FiUsers, color: 'emerald' },
                { title: 'Total Shops', value: stats.shops, icon: FiHome, color: 'blue' },
                { title: 'Repair Requests', value: stats.repairs, icon: FiTool, color: 'amber' },
                { title: 'Total Orders', value: stats.orders, icon: FiShoppingCart, color: 'red' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                        {stat.value}
                        <button
                          onClick={() => copyToClipboard(stat.value, stat.title)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-emerald-600"
                          title="Copy"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </p>
                    </div>
                    <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 h-80 sm:h-96">
                <Bar data={barChartData} options={barOptions} />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 h-80 sm:h-96">
                <Pie data={pieChartData} options={pieOptions} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


export default Dashboard;