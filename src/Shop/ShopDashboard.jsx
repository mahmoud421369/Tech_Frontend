
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { RiMoneyDollarCircleLine, RiBox2Line, RiToolsLine } from 'react-icons/ri';
import { FiCalendar } from 'react-icons/fi';
import { FaChartLine } from 'react-icons/fa';
import api from '../api';
import debounce from 'lodash/debounce';

const DashboardSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-4 sm:p-6">
    <div className="mb-8 bg-indigo-50 dark:bg-indigo-900 rounded-xl p-4">
      <div className="h-8 w-1/3 bg-indigo-200 dark:bg-indigo-700 rounded mb-4"></div>
      <div className="h-4 w-2/3 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
    </div>
    <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="w-full sm:w-64">
          <div className="h-4 w-1/3 bg-indigo-200 dark:bg-indigo-700 rounded mb-2"></div>
          <div className="h-10 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(5)].map((_, idx) => (
        <div key={idx} className="p-6 bg-indigo-50 dark:bg-indigo-900 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-1/2 bg-indigo-200 dark:bg-indigo-700 rounded mb-2"></div>
              <div className="h-8 w-1/3 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
            </div>
            <div className="h-10 w-10 bg-indigo-200 dark:bg-indigo-700 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ShopDashboard = ({ darkMode }) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [salesStats, setSalesStats] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [repairsStats, setRepairsStats] = useState(null);
  const [totalRepairs, setTotalRepairs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const validateDates = useCallback(() => {
    if (!startDate || !endDate) return true;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    if (start > now || end > now) {
      Swal.fire({
        title: 'خطأ',
        text: 'لا يمكن تحديد تواريخ في المستقبل',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
      return false;
    }
    if (start > end) {
      Swal.fire({
        title: 'خطأ',
        text: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
      return false;
    }
    return true;
  }, [startDate, endDate, darkMode]);

  const fetchSales = useCallback(async () => {
    if (!validateDates()) return;
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.post(
        '/api/shops/dashboard/sales/total',
        { startDate, endDate },
        { signal: controller.signal, headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setTotalSales(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching sales:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في جلب إجمالي المبيعات',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
        });
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [startDate, endDate, darkMode]);

  const fetchSalesStats = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/sales/stats', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setSalesStats(res.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching sales stats:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في جلب إحصائيات المبيعات',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
        });
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [darkMode]);

  const fetchOrders = useCallback(async () => {
    if (!validateDates()) return;
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.post(
        '/api/shops/dashboard/orders/total',
        { startDate, endDate },
        { signal: controller.signal, headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setTotalOrders(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching orders:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في جلب إجمالي الطلبات',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
        });
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [startDate, endDate, darkMode]);

  const fetchRepairsStats = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/repairs/stats', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setRepairsStats(res.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching repairs stats:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في جلب إحصائيات التصليحات',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
        });
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [darkMode]);

  const fetchRepairsTotal = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/repairs/total', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setTotalRepairs(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching repairs total:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في جلب إجمالي طلبات التصليح',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
        });
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [darkMode]);

  const resetDates = useCallback(() => {
    setStartDate('');
    setEndDate('');
    Swal.fire({
      title: 'تم',
      text: 'تم إعادة تعيين التواريخ',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
    });
  }, [darkMode]);

  const debouncedFetchSales = useMemo(() => debounce(fetchSales, 300), [fetchSales]);
  const debouncedFetchOrders = useMemo(() => debounce(fetchOrders, 300), [fetchOrders]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
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
  }, [debouncedFetchSales, fetchSalesStats, debouncedFetchOrders, fetchRepairsStats, fetchRepairsTotal, navigate]);

  return (
    <div className={`min-h-screen font-cairo transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-indigo-200' : 'bg-indigo-50 text-indigo-800'} p-4 sm:p-6 lg:p-8 mt-16 lg:ml-72 sm:ml-24 ml-20`}>
      {isLoading && <DashboardSkeleton darkMode={darkMode} />}
      {!isLoading && (
        <div className="max-w-full sm:max-w-7xl mx-auto">
          <div className="mb-8 text-right bg-indigo-50 dark:bg-indigo-900 rounded-xl p-4 sm:p-6 shadow-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">لوحة تحكم المتجر</h1>
            <p className="text-sm sm:text-base text-indigo-600 dark:text-indigo-300 mt-2">راقب أداء متجرك وإحصائياته بسهولة</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center items-center">
            <div className="relative w-full sm:w-64 group">
              <label className="block text-sm sm:text-base font-medium text-indigo-700 dark:text-indigo-300 mb-1.5">تاريخ البداية</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-indigo-700 bg-indigo-800 text-indigo-200' : 'border-indigo-200 bg-indigo-100 text-indigo-800'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base`}
                  aria-label="تاريخ البداية"
                />
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
              </div>
            </div>
            <div className="relative w-full sm:w-64 group">
              <label className="block text-sm sm:text-base font-medium text-indigo-700 dark:text-indigo-300 mb-1.5">تاريخ النهاية</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'border-indigo-700 bg-indigo-800 text-indigo-200' : 'border-indigo-200 bg-indigo-100 text-indigo-800'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base`}
                  aria-label="تاريخ النهاية"
                />
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
              </div>
            </div>
            <button
              onClick={resetDates}
              className={`px-4 py-3 rounded-lg ${darkMode ? 'bg-indigo-700 text-indigo-200 hover:bg-indigo-800' : 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300'} transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base`}
            >
              إعادة تعيين
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="relative p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/70 dark:bg-indigo-900/70">
                  <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-indigo-700 dark:text-indigo-200">إجمالي المبيعات</h3>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalSales} EGP</p>
                </div>
                <RiMoneyDollarCircleLine className="text-3xl sm:text-4xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {salesStats && (
              <div className="relative p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/70 dark:bg-indigo-900/70">
                    <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-indigo-700 dark:text-indigo-200">المبيعات اليوم مقابل الأمس</h3>
                    <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{salesStats.todaySales || 0} EGP</p>
                    <p className="text-sm sm:text-base text-indigo-600 dark:text-indigo-300">
                      الأمس: {salesStats.previousDaySales} EGP (
                      {salesStats.increased ? (
                        <span className="text-emerald-600 dark:text-emerald-400">⬆ {salesStats.difference} EGP</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">⬇ {salesStats.difference} EGP</span>
                      )})
                    </p>
                  </div>
                  <FaChartLine className="text-3xl sm:text-4xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
            )}

            <div className="relative p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/70 dark:bg-indigo-900/70">
                  <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-indigo-700 dark:text-indigo-200">إجمالي الطلبات</h3>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalOrders}</p>
                </div>
                <RiBox2Line className="text-3xl sm:text-4xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {repairsStats && (
              <div className="relative p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/70 dark:bg-indigo-900/70">
                    <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-indigo-700 dark:text-indigo-200">التصليحات اليوم مقابل الأمس</h3>
                    <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{repairsStats.todayRepairs}</p>
                    <p className="text-sm sm:text-base text-indigo-600 dark:text-indigo-300">
                      الأمس: {repairsStats.yesterdayRepairs} (
                      {repairsStats.increase ? (
                        <span className="text-emerald-600 dark:text-emerald-400">⬆ {repairsStats.difference}</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">⬇ {repairsStats.difference}</span>
                      )})
                    </p>
                  </div>
                  <FaChartLine className="text-3xl sm:text-4xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
            )}

            <div className="relative p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/70 dark:bg-indigo-900/70">
                  <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-indigo-700 dark:text-indigo-200">إجمالي طلبات التصليح</h3>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalRepairs}</p>
                </div>
                <RiToolsLine className="text-3xl sm:text-4xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
