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
    <div style={{marginTop:"-600px",marginLeft:"250px"}} className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 lg:p-8 font-cairo">
      <div className="max-w-7xl mx-auto">
       
        <div className="mb-8 text-right bg-white p-4 rounded-xl dark:bg-gray-950">
          <h1 className="text-4xl mb-4 font-bold text-indigo-600 dark:text-white">لوحة تحكم المتجر</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">راقب أداء متجرك وإحصائياته بسهولة</p>
        </div>

       
        <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center items-center">
          <div className="relative w-full sm:w-64 group">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تاريخ البداية</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 shadow-sm hover:shadow-lg text-sm"
                aria-label="تاريخ البداية"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="relative w-full sm:w-64 group">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تاريخ النهاية</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 shadow-sm hover:shadow-lg text-sm"
                aria-label="تاريخ النهاية"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="relative p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 ">
                <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">إجمالي المبيعات</h3>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalSales} EGP</p>
              </div>
              <RiMoneyDollarCircleLine className="text-4xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          {salesStats && (
            <div className="relative p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-emerald-600 dark:border-emerald-500 group">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 ">
                  <div className="w-6 h-6 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">المبيعات اليوم مقابل الأمس</h3>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{salesStats.todaySales || 0} EGP</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    الأمس: {salesStats.previousDaySales} EGP (
                    {salesStats.increased ? (
                      <span className="text-emerald-600 dark:text-emerald-400">⬆ {salesStats.difference} EGP</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">⬇ {salesStats.difference} EGP</span>
                    )})
                  </p>
                </div>
                <FaChartLine className="text-4xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          )}

          <div className="relative p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-blue-600 dark:border-blue-500 group">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 ">
                <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">إجمالي الطلبات</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalOrders}</p>
              </div>
              <RiBox2Line className="text-4xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          {repairsStats && (
            <div className="relative p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-purple-600 dark:border-purple-500 group">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 ">
                  <div className="w-6 h-6 border-2 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">التصليحات اليوم مقابل الأمس</h3>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{repairsStats.todayRepairs}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    الأمس: {repairsStats.yesterdayRepairs} (
                    {repairsStats.increase ? (
                      <span className="text-emerald-600 dark:text-emerald-400">⬆ {repairsStats.difference}</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">⬇ {repairsStats.difference}</span>
                    )})
                  </p>
                </div>
                <FaTools className="text-4xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          )}

          <div className="relative p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-pink-600 dark:border-pink-500 group">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 ">
                <div className="w-6 h-6 border-2 border-pink-600 dark:border-pink-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">إجمالي طلبات التصليح</h3>
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{totalRepairs}</p>
              </div>
              <RiToolsLine className="text-4xl text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;