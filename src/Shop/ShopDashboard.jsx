
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { RiMoneyDollarCircleLine, RiBox2Line, RiToolsLine } from 'react-icons/ri';
import { FiCalendar, FiHome } from 'react-icons/fi';
import { FaChartLine } from 'react-icons/fa';
import api from '../api';
import useAuthStore from '../store/Auth';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const DashboardSkeleton = () => (
  <div className="space-y-6 p-4 sm:p-6 animate-pulse">
    <div className="h-10 bg-lime-200 w-48 rounded"></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-10 bg-lime-100 rounded"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-36 bg-lime-50 rounded-lg"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-64 bg-lime-50 rounded-lg"></div>
      <div className="h-64 bg-lime-50 rounded-lg"></div>
    </div>
  </div>
);

const ShopDashboard = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [salesStats, setSalesStats] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [repairsStats, setRepairsStats] = useState(null);
  const [totalRepairs, setTotalRepairs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { 
          color: '#000000',
          font: { family: 'Cairo', size: 12 }
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#000000',
        bodyColor: '#1f2937',
        borderColor: '#84cc16',
        borderWidth: 2,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#6b7280' }
      },
      y: { 
        grid: { color: '#e5e7eb' }, 
        ticks: { color: '#6b7280' }
      },
    },

  };

  const validateDates = useCallback(() => {
    if (!startDate || !endDate) return true;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    if (start > now || end > now) {
      toast.error('لا يمكن تحديد تواريخ في المستقبل');
      return false;
    }
    if (start > end) {
      toast.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return false;
    }
    return true;
  }, [startDate, endDate]);

  const fetchSales = useCallback(async () => {
    if (!validateDates()) return;
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.post('/api/shops/dashboard/sales/total', { startDate, endDate }, { signal: controller.signal });
      setTotalSales(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('فشل في جلب إجمالي المبيعات');
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [startDate, endDate]);

  const fetchSalesStats = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/sales/stats', { signal: controller.signal });
      setSalesStats(res.data);
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('فشل في جلب إحصائيات المبيعات');
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!validateDates()) return;
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.post('/api/shops/dashboard/orders/total', { startDate, endDate }, { signal: controller.signal });
      setTotalOrders(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('فشل في جلب إجمالي الطلبات');
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [startDate, endDate]);

  const fetchRepairsStats = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/repairs/stats', { signal: controller.signal });
      setRepairsStats(res.data);
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('فشل في جلب إحصائيات التصليحات');
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

  const fetchRepairsTotal = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/repairs/total', { signal: controller.signal });
      setTotalRepairs(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('فشل في جلب إجمالي طلبات التصليح');
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

  const resetDates = useCallback(() => {
    setStartDate('');
    setEndDate('');
    toast.success('تم إعادة تعيين التواريخ');
  }, []);

  const debouncedFetchSales = useMemo(() => debounce(fetchSales, 300), [fetchSales]);
  const debouncedFetchOrders = useMemo(() => debounce(fetchOrders, 300), [fetchOrders]);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }

    debouncedFetchSales();
    fetchSalesStats();
    debouncedFetchOrders();
    fetchRepairsStats();
    fetchRepairsTotal();

    return () => {
      debouncedFetchSales.cancel();
      debouncedFetchOrders.cancel();
    };
  }, [
    accessToken,
    debouncedFetchSales,
    fetchSalesStats,
    debouncedFetchOrders,
    fetchRepairsStats,
    fetchRepairsTotal,
    navigate,
  ]);


  const salesChartData = {
    labels: salesStats?.trend?.map((d) => d.day) || ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    datasets: [
      {
        label: 'المبيعات (EGP)',
        data: salesStats?.trend?.map((d) => d.sales) || [2400, 1398, 9800, 3908, 4800, 3800, 4300],
        borderColor: '#84cc16', // Lime
        backgroundColor: 'rgba(132, 204, 22, 0.15)',
        borderWidth: 3,
        pointBackgroundColor: '#84cc16',
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const repairsChartData = {
    labels: repairsStats?.weekly?.map((d) => d.day) || ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    datasets: [
      {
        label: 'التصليحات',
        data: repairsStats?.weekly?.map((d) => d.repairs) || [12, 19, 15, 22, 18, 14, 20],
        backgroundColor: '#10b981', 
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div style={{marginTop:"-575px"}} className="p-4 sm:p-6 font-cairo space-y-6 bg-gradient-to-br from-gray-50 via-white to-white min-h-screen">
      {isLoading && <DashboardSkeleton />}

      {!isLoading && (
        <>
          
          <div className="bg-white p-5 shadow-sm border-l-4 border-lime-500  max-w-5xl">
            <div className="flex justify-start flex-row-reverse items-center gap-3">
              <FiHome size={40} className="p-3 rounded-xl bg-lime-500 text-white shadow-md" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-black">
                  لوحة تحكم المتجر
                </h1>
                <p className="text-sm text-gray-600">راقب أداء متجرك بسهولة</p>
              </div>
            </div>
          </div>

         
          <div className="bg-white p-4 max-w-5xl shadow-sm rounded-lg border ">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-right text-gray-700 mb-1">
                  تاريخ البداية
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border  bg-gray-50 text-black placeholder:none placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 rounded-md transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-right text-gray-700 mb-1">
                  تاريخ النهاية
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border  bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 rounded-md transition-all"
                />
              </div>

              <button
                onClick={resetDates}
                className="px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white font-medium text-sm rounded-md transition-colors shadow-sm"
              >
                إعادة تعيين
              </button>
            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl gap-5">
            
            <div className="bg-white p-5 shadow-sm border-l-4 border-lime-500 ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">إجمالي المبيعات</h3>
                  <p className="text-2xl font-bold text-black mt-1">
                    {totalSales.toLocaleString()} EGP
                  </p>
                </div>
                <RiMoneyDollarCircleLine className="text-4xl text-gray-500 opacity-80" />
              </div>
            </div>

     
            {salesStats && (
              <div className="bg-white p-5 shadow-sm border-l-4 border-lime-500 ">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">المبيعات اليوم</h3>
                    <p className="text-2xl font-bold text-black mt-1">
                      {salesStats.todaySales || 0} EGP
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      الأمس: {salesStats.previousDaySales || 0} EGP
                    </p>
                  </div>
                  <FaChartLine className="text-4xl text-gray-500 opacity-80" />
                </div>
              </div>
            )}

            
            <div className="bg-white p-5 shadow-sm border-l-4 border-lime-500 ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">إجمالي الطلبات</h3>
                  <p className="text-2xl font-bold text-black mt-1">
                    {totalOrders}
                  </p>
                </div>
                <RiBox2Line className="text-4xl text-gray-500 opacity-80" />
              </div>
            </div>

            
            {repairsStats && (
              <div className="bg-white p-5 shadow-sm border-l-4 border-lime-500 ">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">التصليحات اليوم</h3>
                    <p className="text-2xl font-bold text-black mt-1">
                      {repairsStats.todayRepairs || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      الأمس: {repairsStats.yesterdayRepairs || 0}
                    </p>
                  </div>
                  <FaChartLine className="text-4xl text-gray-500 opacity-80" />
                </div>
              </div>
            )}

         
            <div className="bg-white p-5 shadow-sm border-l-4 border-lime-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">إجمالي طلبات التصليح</h3>
                  <p className="text-2xl font-bold text-black mt-1">
                    {totalRepairs}
                  </p>
                </div>
                <RiToolsLine className="text-4xl text-gray-500 opacity-80" />
              </div>
            </div>
          </div>

       
          <div className="grid grid-cols-1 lg:grid-cols-2 max-w-5xl gap-6">
            
            <div className="bg-white p-5 shadow-sm rounded-lg border border-lime-100">
              <h3 className="text-lg font-bold text-black mb-4">
                اتجاه المبيعات (أسبوعي)
              </h3>
              <div className="h-64">
                <Line data={salesChartData} options={chartOptions} />
              </div>
            </div>

         
            <div className="bg-white p-5 shadow-sm rounded-lg border border-lime-100">
              <h3 className="text-lg font-bold text-black mb-4">
                اتجاه التصليحات (أسبوعي)
              </h3>
              <div className="h-64">
                <Bar 
                  data={repairsChartData} 
                  options={{ 
                    ...chartOptions, 
                    plugins: { 
                      ...chartOptions.plugins, 
                      legend: { display: false } 
                    },
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        beginAtZero: true,
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopDashboard;