import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiMoneyDollarCircleLine,
  RiBox2Line,
  RiToolsLine,
} from 'react-icons/ri';
import { FaChartLine, FaTools } from 'react-icons/fa';
import api from '../api';
import debounce from 'lodash/debounce';

const ShopDashboard = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [salesStats, setSalesStats] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [repairsStats, setRepairsStats] = useState(null);
  const [totalRepairs, setTotalRepairs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSales = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.post(
        '/api/shops/dashboard/sales/total',
        { startDate, endDate },
        { signal: controller.signal }
      );
      setTotalSales(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching sales:', err.response?.data || err.message);
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [startDate, endDate]);

  const fetchSalesStats = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/sales/stats', {
        signal: controller.signal,
      });
      setSalesStats(res.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching sales stats:', err.response?.data || err.message);
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

  const fetchOrders = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.post(
        '/api/shops/dashboard/orders/total',
        { startDate, endDate },
        { signal: controller.signal }
      );
      setTotalOrders(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching orders:', err.response?.data || err.message);
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [startDate, endDate]);

  const fetchRepairsStats = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/repairs/stats', {
        signal: controller.signal,
      });
      setRepairsStats(res.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching repairs stats:', err.response?.data || err.message);
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

  const fetchRepairsTotal = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/shops/dashboard/repairs/total', {
        signal: controller.signal,
      });
      setTotalRepairs(res.data || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching repairs total:', err.response?.data || err.message);
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

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
    <div style={{marginLeft:"250px",marginTop:"-600px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Date Range Inputs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center">
          <div className="relative w-full sm:w-60 md:w-64">
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              aria-label="تاريخ البداية"
            />
          </div>
          <div className="relative w-full sm:w-60 md:w-64">
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              aria-label="تاريخ النهاية"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="relative p-5 sm:p-6 bg-indigo-500 dark:bg-indigo-950 rounded-xl shadow-lg border-l-4 border-indigo-600 dark:border-indigo-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/50 dark:bg-indigo-950/50 rounded-xl">
                <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white dark:text-gray-200">إجمالي المبيعات</h3>
                <p className="text-xl sm:text-2xl font-bold text-white dark:text-indigo-400">{totalSales} EGP</p>
              </div>
              <RiMoneyDollarCircleLine className="text-3xl sm:text-4xl text-white dark:text-indigo-400" />
            </div>
          </div>

          {salesStats && (
            <div className="relative p-5 sm:p-6 bg-emerald-500 dark:bg-green-950 rounded-xl shadow-lg border-l-4 border-green-500 dark:border-green-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 dark:bg-green-950/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-green-500 dark:border-green-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white dark:text-gray-200">المبيعات اليوم مقابل الأمس</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white dark:text-green-400">{salesStats.todaySales || 0} EGP</p>
                  <p className="text-xs sm:text-sm text-white dark:text-gray-400">
                    الأمس: {salesStats.previousDaySales} EGP (
                    {salesStats.increased ? (
                      <span className="text-white">⬆ {salesStats.difference} EGP</span>
                    ) : (
                      <span className="text-red-500">⬇ {salesStats.difference} EGP</span>
                    )})
                  </p>
                </div>
                <FaChartLine className="text-3xl sm:text-4xl text-white dark:text-green-400" />
              </div>
            </div>
          )}

          <div className="relative p-5 sm:p-6 bg-blue-500 dark:bg-blue-950 rounded-xl shadow-lg border-l-4 border-blue-500 dark:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-500 dark:bg-blue-950/50 rounded-xl">
                <div className="w-5 h-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white dark:text-gray-200">إجمالي الطلبات</h3>
                <p className="text-xl sm:text-2xl font-bold text-white dark:text-blue-400">{totalOrders}</p>
              </div>
              <RiBox2Line className="text-3xl sm:text-4xl text-white dark:text-blue-400" />
            </div>
          </div>

          {repairsStats && (
            <div className="relative p-5 sm:p-6 bg-purple-500 dark:bg-purple-950 rounded-xl shadow-lg border-l-4 border-purple-500 dark:border-purple-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-purple-500 dark:bg-purple-950/50 rounded-xl">
                  <div className="w-5 h-5 border-2 border-purple-500 dark:border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white dark:text-gray-200">التصليحات اليوم مقابل الأمس</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white dark:text-purple-400">{repairsStats.todayRepairs}</p>
                  <p className="text-xs sm:text-sm text-white dark:text-gray-400">
                    الأمس: {repairsStats.yesterdayRepairs} (
                    {repairsStats.increase ? (
                      <span className="text-green-500">⬆ {repairsStats.difference}</span>
                    ) : (
                      <span className="text-white">⬇ {repairsStats.difference}</span>
                    )})
                  </p>
                </div>
                <FaTools className="text-3xl sm:text-4xl text-white dark:text-purple-400" />
              </div>
            </div>
          )}

          <div className="relative p-5 sm:p-6 bg-pink-500 dark:bg-pink-950 rounded-xl shadow-lg border-l-4 border-pink-500 dark:border-pink-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-pink-500 dark:bg-pink-950/50 rounded-xl">
                <div className="w-5 h-5 border-2 border-pink-500 dark:border-pink-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white dark:text-gray-200">إجمالي طلبات التصليح</h3>
                <p className="text-xl sm:text-2xl font-bold text-white dark:text-pink-400">{totalRepairs}</p>
              </div>
              <RiToolsLine className="text-3xl sm:text-4xl text-white dark:text-pink-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;