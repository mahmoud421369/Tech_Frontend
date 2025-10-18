
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiDollarSign, FiSearch, FiChevronDown } from 'react-icons/fi';
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
  const [isTimeRangeDropdownOpen, setIsTimeRangeDropdownOpen] = useState(false);
  const transactionsPerPage = 4;


  const statusTranslations = {
    completed: 'مكتمل',
    pending: 'معلق',
  };

  const typeTranslations = {
    repair: 'إصلاح',
    sale: 'بيع',
  };

  const timeRangeOptions = [
    { value: 'week', label: 'الأسبوع' },
    { value: 'month', label: 'الشهر' },
    { value: 'year', label: 'السنة' },
  ];

  // Fetch data
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
        paidAt: t.paidAt
          ? new Date(t.paidAt).toLocaleString('ar-EG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : 'غير متوفر',
        type: (t.type || '').toLowerCase().includes('repair')
          ? typeTranslations.repair
          : typeTranslations.sale,
        item: t.item || (t.type && t.type.includes('REPAIR') ? 'إصلاح جهاز' : 'طلب شراء'),
        shop: t.shopName || 'متحرك',
        paymentMethod: t.paymentMethod || 'غير محدد',
        amount: Number(t.amount) || 0,
        status: (t.status || 'Completed').toLowerCase() === 'completed'
          ? statusTranslations.completed
          : statusTranslations.pending,
      }));

      setTransactions(allTransactions);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching transactions:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في تحميل العمليات المالية',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [timeRange, darkMode]);

  // Debounced search
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

  // Pagination
  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedSetSearchTerm.cancel();
  }, [debouncedSetSearchTerm]);

  // Fetch data on mount or timeRange change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Financial calculations
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
        .filter((t) => t.type === typeTranslations.repair)
        .reduce((sum, t) => sum + t.amount, 0),
    [financialReport, transactions]
  );

  const salesEarnings = useMemo(
    () =>
      financialReport?.salesEarnings ??
      transactions
        .filter((t) => t.type === typeTranslations.sale)
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

  // Filter transactions
  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        [transaction.paidAt, transaction.type, transaction.shop]
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

  // const earningsChart = {
  //   type: 'bar',
  //   data: {
  //     labels: ['إصلاح', 'مبيعات'],
  //     datasets: [
  //       {
  //         label: 'الإيرادات (EGP)',
  //         data: [repairEarnings, salesEarnings],
  //         backgroundColor: ['#10B981', '#F59E0B'],
  //         borderColor: ['#059669', '#D97706'],
  //         borderWidth: 1,
  //       },
  //     ],
  //   },
  //   options: {
  //     responsive: true,
  //     maintainAspectRatio: false,
  //     scales: {
  //       y: {
  //         beginAtZero: true,
  //         title: {
  //           display: true,
  //           text: 'المبلغ (EGP)',
  //           color: darkMode ? '#D1D5DB' : '#374151',
  //         },
  //         ticks: {
  //           color: darkMode ? '#D1D5DB' : '#374151',
  //         },
  //         grid: {
  //           color: darkMode ? '#4B5563' : '#E5E7EB',
  //         },
  //       },
  //       x: {
  //         title: {
  //           display: true,
  //           text: 'نوع الإيرادات',
  //           color: darkMode ? '#D1D5DB' : '#374151',
  //         },
  //         ticks: {
  //           color: darkMode ? '#D1D5DB' : '#374151',
  //         },
  //         grid: {
  //           display: false,
  //         },
  //       },
  //     },
  //     plugins: {
  //       legend: {
  //         labels: {
  //           color: darkMode ? '#D1D5DB' : '#374151',
  //         },
  //       },
  //       tooltip: {
  //         callbacks: {
  //           label: (context) => `${context.dataset.label}: ${context.raw.toFixed(2)} EGP`,
  //         },
  //       },
  //     },
  //   },
  // };

  return (
    <div style={{ marginTop: "-600px", marginLeft: "250px" }} className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 lg:p-8 font-cairo">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-right bg-white p-4 rounded-xl dark:bg-gray-950">
          <h1 className="text-4xl mb-4 font-bold text-indigo-600 dark:text-white flex items-center justify-end gap-3">
            <FiDollarSign className="text-indigo-600 dark:text-indigo-400" /> الإيرادات
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-right">إدارة ومتابعة العمليات المالية بسهولة</p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              id="search"
              placeholder=" "
              onChange={handleSearchChange}
              className="peer w-full pl-10 pr-4 py-3 pt-6 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-right text-sm"
            />
            <label
              htmlFor="search"
              className="absolute right-10 top-1 text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
            >
              ابحث في العمليات...
            </label>
          </div>
          {/* <div className="relative w-full sm:w-56">
            <button
              onClick={() => setIsTimeRangeDropdownOpen(!isTimeRangeDropdownOpen)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 shadow-sm hover:shadow-lg text-sm text-right"
            >
              <span>{timeRangeOptions.find((opt) => opt.value === timeRange)?.label || 'اختر المدة'}</span>
              <FiChevronDown className={`transition-transform duration-300 ${isTimeRangeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isTimeRangeDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {timeRangeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTimeRange(opt.value);
                      setIsTimeRangeDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div> */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-indigo-600 dark:text-indigo-400">
              إجمالي الأرباح <FiDollarSign className="text-xl group-hover:scale-110 transition-transform duration-300" />
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
              {totalEarnings.toFixed(2)} EGP
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-green-600 dark:border-green-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-green-600 dark:text-green-400">
              تصليح ({repairPercentage}%) <FiDollarSign className="text-xl group-hover:scale-110 transition-transform duration-300" />
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
              {repairEarnings.toFixed(2)} EGP
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-yellow-600 dark:border-yellow-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-yellow-600 dark:text-yellow-400">
              مبيعات ({salesPercentage}%) <FiDollarSign className="text-xl group-hover:scale-110 transition-transform duration-300" />
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
              {salesEarnings.toFixed(2)} EGP
            </p>
          </div>
        </div>

      

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm text-right">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-right">التاريخ</th>
                      <th className="px-6 py-4 font-semibold text-right">نوع الخدمة</th>
                      <th className="px-6 py-4 font-semibold text-right">الجهاز</th>
                      <th className="px-6 py-4 font-semibold text-right">المكان</th>
                      <th className="px-6 py-4 font-semibold text-right">طريقة الدفع</th>
                      <th className="px-6 py-4 font-semibold text-right">الحساب</th>
                      <th className="px-6 py-4 font-semibold text-right">حالة العملية</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {currentTransactions.map((txn, index) => (
                      <tr
                        key={txn.id ?? index}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <td className="px-6 py-4">{txn.paidAt}</td>
                        <td className="px-6 py-4">{txn.type}</td>
                        <td className="px-6 py-4">{txn.item}</td>
                        <td className="px-6 py-4">{txn.shop}</td>
                        <td className="px-6 py-4">{txn.paymentMethod}</td>
                        <td className="px-6 py-4 font-medium">{txn.amount.toFixed(2)} EGP</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              txn.status === statusTranslations.completed
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
                <div className="p-8 text-center bg-white dark:bg-gray-900">
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

        {/* Pagination */}
        <div className="flex items-center justify-between max-w-7xl mx-auto p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-md mt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            عرض {indexOfFirstTransaction + 1} إلى{' '}
            {Math.min(indexOfLastTransaction, filteredTransactions.length)} من{' '}
            {filteredTransactions.length} عملية
          </div>
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    : 'bg-white dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
