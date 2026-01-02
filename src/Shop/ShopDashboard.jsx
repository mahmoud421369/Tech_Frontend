import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { RiMoneyDollarCircleLine, RiBox2Line, RiToolsLine } from 'react-icons/ri';
import { FiCalendar, FiHome, FiTrendingUp, FiPackage } from 'react-icons/fi';
import { FaChartLine } from 'react-icons/fa';
import api from '../api';
import useAuthStore from '../store/Auth';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';
import {DatePicker} from '@mui/x-date-pickers/DatePicker'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { arSA } from 'date-fns/locale';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const DashboardSkeleton = () => (
  <div className="space-y-8 p-6 animate-pulse">
    <div className="h-12 bg-gray-200 rounded-2xl w-96"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-40 bg-gray-100 rounded-2xl"></div>
      <div className="h-40 bg-gray-100 rounded-2xl"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-50 rounded-2xl border border-gray-200"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-96 bg-gray-50 rounded-2xl"></div>
      <div className="h-96 bg-gray-50 rounded-2xl"></div>
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


useEffect(()=>{
  document.title = "لوحة التحكم";
})

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#1f2937', font: { family: 'Cairo', size: 13 } } },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#84cc16',
        borderWidth: 2,
        cornerRadius: 10,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280' }, beginAtZero: true },
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
    try {
      setIsLoading(true);
      const res = await api.post('/api/shops/dashboard/sales/total', { startDate, endDate });
      setTotalSales(res.data || 0);
    } catch (err) {
      toast.error('فشل في جلب إجمالي المبيعات');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const fetchSalesStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/sales/stats');
      setSalesStats(res.data);
    } catch (err) {
      toast.error('فشل في جلب إحصائيات المبيعات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!validateDates()) return;
    try {
      setIsLoading(true);
      const res = await api.post('/api/shops/dashboard/orders/total', { startDate, endDate });
      setTotalOrders(res.data || 0);
    } catch (err) {
      toast.error('فشل في جلب إجمالي الطلبات');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const fetchRepairsStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/repairs/stats');
      setRepairsStats(res.data);
    } catch (err) {
      toast.error('فشل في جلب إحصائيات التصليحات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRepairsTotal = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/repairs/total');
      setTotalRepairs(res.data || 0);
    } catch (err) {
      toast.error('فشل في جلب إجمالي طلبات التصليح');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetDates = useCallback(() => {
    setStartDate('');
    setEndDate('');
    toast.success('تم إعادة تعيين التواريخ');
  }, []);

  const debouncedFetchSales = useMemo(() => debounce(fetchSales, 500), [fetchSales]);
  const debouncedFetchOrders = useMemo(() => debounce(fetchOrders, 500), [fetchOrders]);

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
  }, [accessToken, debouncedFetchSales, fetchSalesStats, debouncedFetchOrders, fetchRepairsStats, fetchRepairsTotal, navigate]);

  // Charts Data
  const salesTrendData = {
    labels: salesStats?.trend?.map(d => d.day) || ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    datasets: [{
      label: 'المبيعات اليومية (جنيه مصري)',
      data: salesStats?.trend?.map(d => d.sales) || [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#84cc16',
      backgroundColor: 'rgba(132, 204, 22, 0.2)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
    }],
  };

  const ordersTrendData = {
    labels: salesStats?.trend?.map(d => d.day) || ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    datasets: [{
      label: 'عدد الطلبات اليومية',
      data: salesStats?.trend?.map(d => d.orders) || [12, 18, 15, 22, 20, 16, 25], // افتراضي أو من API
      backgroundColor: '#3b82f6',
      borderRadius: 8,
    }],
  };

  return (
    <div style={{marginTop:"-575px"}} className="p-6 max-w-6xl font-cairo bg-gray-50 min-h-screen">
      {isLoading && <DashboardSkeleton />}

      {!isLoading && (
        <>
         
          <div className="mb-10 bg-white rounded-3xl shadow-sm border max-w-5xl border-gray-200 p-8">
            <div className="flex items-center justify-between text-right gap-5">
              <div className="p-5 bg-lime-100 rounded-2xl">
                <FiHome className="text-4xl text-lime-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">لوحة تحكم المتجر</h1>
                <p className="text-lg text-gray-600 mt-2">تابع أداء متجرك يوميًا بكل سهولة ووضوح</p>
              </div>
            </div>
          </div>

    
          <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 max-w-5xl p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center text-justify-end gap-3">
              <FiCalendar className="text-2xl text-lime-600" />
              فلتر حسب الفترة الزمنية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end text-right">
              <div >
                {/* <label className="block text-sm font-medium text-gray-700  mb-2">من تاريخ ووقت</label> */}
                <input
              
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-lime-200 focus:border-lime-500 transition bg-gray-50 text-base"
                />
              </div>
              <div >
                {/* <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ ووقت</label> */}
                <input
            
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-5 py-4 border-none rounded-2xl focus:ring-4 focus:ring-lime-200 focus:border-lime-500 transition bg-gray-50 text-base"
                />
              </div>
              <button
                onClick={resetDates}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-2xl transition shadow-md"
              >
                إعادة تعيين
              </button>
            </div>
          </div>

         
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mb-12">
           
            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">إجمالي المبيعات</p>
                  <p className="text-4xl font-bold mt-3">{totalSales.toLocaleString()} ج.م</p>
                </div>
                <RiMoneyDollarCircleLine className="text-6xl opacity-40" />
              </div>
            </div>

           
            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">مبيعات اليوم</p>
                  <p className="text-4xl font-bold mt-3">{salesStats?.todaySales || 0} ج.م</p>
                </div>
                <FiTrendingUp className="text-6xl opacity-40" />
              </div>
            </div>

           
            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">إجمالي الطلبات</p>
                  <p className="text-4xl font-bold mt-3">{totalOrders}</p>
                </div>
                <FiPackage className="text-6xl opacity-40" />
              </div>
            </div>

           
            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">تصليحات اليوم</p>
                  <p className="text-4xl font-bold mt-3">{repairsStats?.todayRepairs || 0}</p>
                </div>
                <FaChartLine className="text-6xl opacity-40" />
              </div>
            </div>

           
            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">إجمالي التصليحات</p>
                  <p className="text-4xl font-bold mt-3">{totalRepairs}</p>
                </div>
                <RiToolsLine className="text-6xl opacity-40" />
              </div>
            </div>
          </div>

        
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* اتجاه المبيعات */}
            {/* <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FiTrendingUp className="text-lime-600 text-3xl" />
                اتجاه المبيعات الأسبوعي
              </h3>
              <div className="h-96">
                <Line data={salesTrendData} options={chartOptions} />
              </div>
            </div> */}

            {/* اتجاه الطلبات */}
            {/* <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FiPackage className="text-blue-600 text-3xl" />
                اتجاه الطلبات الأسبوعي
              </h3>
              <div className="h-96">
                <Bar data={ordersTrendData} options={chartOptions} />
              </div>
            </div> */}
          </div>
        </>
      )}
    </div>
  );
};

export default ShopDashboard;