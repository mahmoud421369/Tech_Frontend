
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiDollarSign, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';
import debounce from 'lodash/debounce'; 
import api from '../api';

const Transactions = ({ darkMode }) => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [financialReport, setFinancialReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const transactionsPerPage = 4;


  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
     
      const reportRes = await api.get('/api/shops/payments/financial-report', {
        signal: controller.signal,
      });
      setFinancialReport(reportRes.data);


      const repairRes = await api.get('/api/shops/payments/repairs', {
        signal: controller.signal,
        params: { timeRange }, 
      });

      
      const orderRes = await api.get('/api/shops/payments/orders', {
        signal: controller.signal,
        params: { timeRange }, 
      });

      const allTransactions = [...repairRes.data, ...orderRes.data].map((t, idx) => ({
        id: t.id ?? idx,
        paidAt: t.paidAt ? new Date(t.paidAt).toLocaleString('ar-EG', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }) : 'غير متوفر',
        type: (t.type || '').toLowerCase().includes('repair') ? 'إصلاح' : 'بيع',
        item: t.item || (t.type && t.type.includes('REPAIR') ? 'إصلاح جهاز' : 'طلب شراء'),
        shop: t.shopName || 'متحرك',
        paymentMethod: t.paymentMethod || 'غير محدد',
        amount: Number(t.amount) || 0,
        status: (t.status || 'Completed').toLowerCase() === 'completed' ? 'مكتمل' : 'معلق',
      }));

      setTransactions(allTransactions);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching transactions:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في تحميل العمليات المالية',
          icon: 'error',
          customClass: { popup: 'dark:bg-gray-800 dark:text-white' },
        });
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [timeRange]);


  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = useCallback(
    (e) => {
      debouncedSetSearchTerm(e.target.value);
      setCurrentPage(1);
    },
    [debouncedSetSearchTerm]
  );

 
  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, []);

 
  useEffect(() => {
    return () => debouncedSetSearchTerm.cancel();
  }, [debouncedSetSearchTerm]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const totalEarnings = useMemo(
    () =>
      financialReport?.totalEarnings ??
      transactions.reduce((sum, t) => sum + t.amount, 0),
    [financialReport, transactions]
  );

  const repairEarnings = useMemo(
    () =>
      financialReport?.repairEarnings ??
      transactions
        .filter((t) => t.type === 'إصلاح')
        .reduce((sum, t) => sum + t.amount, 0),
    [financialReport, transactions]
  );

  const salesEarnings = useMemo(
    () =>
      financialReport?.salesEarnings ??
      transactions
        .filter((t) => t.type === 'بيع')
        .reduce((sum, t) => sum + t.amount, 0),
    [financialReport, transactions]
  );

  const repairPercentage = useMemo(
    () => (totalEarnings > 0 ? Math.round((repairEarnings / totalEarnings) * 100) : 0),
    [totalEarnings, repairEarnings]
  );

  const salesPercentage = useMemo(
    () => (totalEarnings > 0 ? Math.round((salesEarnings / totalEarnings) * 100) : 0),
    [totalEarnings, salesEarnings]
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        [transaction.date, transaction.type, transaction.shop]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [transactions, searchTerm]
  );

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / transactionsPerPage));

  return (
    <div style={{marginTop:"-600px",marginLeft:"250px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="... ابحث في العمليات"
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-3">
            <FiDollarSign className="text-xl sm:text-2xl" /> الإيرادات
          </h1>
     
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-indigo-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">
            إجمالي الأرباح
          </h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 text-right">
            {totalEarnings.toFixed(2)} EGP
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">
            تصليح ({repairPercentage}%)
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 text-right">
            {repairEarnings.toFixed(2)} EGP
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">
            مبيعات ({salesPercentage}%)
          </h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 text-right">
            {salesEarnings.toFixed(2)} EGP
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg
                className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-right text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">التاريخ</th>
                      <th className="px-4 py-3 font-semibold">نوع الخدمة</th>
                      <th className="px-4 py-3 font-semibold">الجهاز</th>
                      <th className="px-4 py-3 font-semibold">المكان</th>
                      <th className="px-4 py-3 font-semibold">طريقة الدفع</th>
                      <th className="px-4 py-3 font-semibold">الحساب</th>
                      <th className="px-4 py-3 font-semibold">حالة العملية</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {currentTransactions.map((txn, index) => (
                      <tr
                        key={txn.id ?? index}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <td className="px-4 py-3">{txn.paidAt}</td>
                        <td className="px-4 py-3">{txn.type}</td>
                        <td className="px-4 py-3">{txn.item}</td>
                        <td className="px-4 py-3">{txn.shop}</td>
                        <td className="px-4 py-3">{txn.paymentMethod}</td>
                        <td className="px-4 py-3">{txn.amount.toFixed(2)} EGP</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              txn.status === 'مكتمل'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}
                          >
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {currentTransactions.length === 0 && (
                <div className="p-8 text-center bg-white dark:bg-gray-800">
                  <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    لا توجد عمليات
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? 'حاول تعديل مصطلحات البحث' : 'لا توجد عمليات مالية متاحة'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <br />
        <div className="flex items-center justify-between max-w-6xl mx-auto p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            عرض {indexOfFirstTransaction + 1} إلى{' '}
            {Math.min(indexOfLastTransaction, filteredTransactions.length)} من{' '}
            {filteredTransactions.length} عملية
          </div>
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              <FiChevronLeft />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
