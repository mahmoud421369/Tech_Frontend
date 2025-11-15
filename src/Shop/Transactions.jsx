import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiSearch,
  FiChevronDown,
  FiMoreVertical,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import debounce from 'lodash/debounce';
import api from '../api';

const ROWS_PER_PAGE = 10;

// ---------------------------------------------------------------------
// Memoized Table Row
// ---------------------------------------------------------------------
const TransactionRow = memo(({ txn }) => {
  const statusColor =
    txn.status === 'مكتمل'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';

  return (
    <tr className="border-b border-lime-100 hover:bg-lime-50 transition">
      <td className="px-4 py-3 text-sm text-center">{txn.paidAt}</td>
      <td className="px-4 py-3 text-sm text-center">{txn.type}</td>
      <td className="px-4 py-3 text-sm text-center">{txn.item}</td>
      <td className="px-4 py-3 text-sm text-center">{txn.shop}</td>
      <td className="px-4 py-3 text-sm text-center">{txn.paymentMethod}</td>
      <td className="px-4 py-3 text-sm font-medium text-center">{txn.amount.toFixed(2)} ج.م</td>
      <td className="px-4 py-3 text-center">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {txn.status}
        </span>
      </td>
    </tr>
  );
});
TransactionRow.displayName = 'TransactionRow';

// ---------------------------------------------------------------------
// Loading Skeleton Row
// ---------------------------------------------------------------------
const SkeletonRow = memo(() => (
  <tr>
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-4 py-3 text-center">
        <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-20" />
      </td>
    ))}
  </tr>
));
SkeletonRow.displayName = 'SkeletonRow';

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [financialReport, setFinancialReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const abortCtrl = useRef(new AbortController());

  // -----------------------------------------------------------------
  // Translations
  // -----------------------------------------------------------------
  const statusMap = { completed: 'مكتمل', pending: 'معلق' };
  const typeMap = { repair: 'إصلاح', sale: 'بيع' };
  const timeRangeOptions = [
    { value: 'week', label: 'الأسبوع' },
    { value: 'month', label: 'الشهر' },
  ];

  // -----------------------------------------------------------------
  // Fetch data
  // -----------------------------------------------------------------
  const fetchAll = useCallback(async () => {
    abortCtrl.current.abort();
    abortCtrl.current = new AbortController();
    setLoading(true);

    try {
      const [reportRes, repairRes, orderRes] = await Promise.all([
        api.get('/api/shops/payments/financial-report', { signal: abortCtrl.current.signal }),
        api.get('/api/shops/payments/repairs', {
          signal: abortCtrl.current.signal,
          params: { timeRange },
        }),
        api.get('/api/shops/payments/orders', {
          signal: abortCtrl.current.signal,
          params: { timeRange },
        }),
      ]);

      setFinancialReport(reportRes.data);

      const merged = [...repairRes.data, ...orderRes.data].map((t, idx) => ({
        id: t.id ?? idx,
        paidAt: t.paidAt
          ? new Date(t.paidAt).toLocaleString('ar-EG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : 'غير متوفر',
        type: t.type?.toLowerCase().includes('repair') ? typeMap.repair : typeMap.sale,
        item: t.item || (t.type?.includes('REPAIR') ? 'إصلاح جهاز' : 'طلب شراء'),
        shop: t.shopName || 'متحرك',
        paymentMethod: t.paymentMethod || 'غير محدد',
        amount: Number(t.amount) || 0,
        status: (t.status || 'completed').toLowerCase() === 'completed'
          ? statusMap.completed
          : statusMap.pending,
      }));

      setTransactions(merged);
    } catch (err) {
      // if (err.name !== 'AbortError') {
      //   console.error(err);
      //   Swal.fire({
      //     title: 'خطأ',
      //     text: 'فشل تحميل العمليات',
      //     icon: 'error',
      //     toast: true,
      //     position: 'top-end',
      //     timer: 2000,
      //   });
      // }
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // -----------------------------------------------------------------
  // Debounced search
  // -----------------------------------------------------------------
  const debouncedSearch = useMemo(
    () => debounce((val) => setSearchTerm(val), 300),
    []
  );

  const handleSearch = (e) => {
    const val = e.target.value;
    debouncedSearch(val);
    setCurrentPage(1);
  };

  // -----------------------------------------------------------------
  // Load on mount / timeRange change
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchAll();
    return () => abortCtrl.current.abort();
  }, [fetchAll]);

  // -----------------------------------------------------------------
  // Financial calculations
  // -----------------------------------------------------------------
  const totalEarnings = useMemo(() => {
    if (financialReport?.totalEarnings != null) return financialReport.totalEarnings;
    return transactions.reduce((s, t) => s + t.amount, 0);
  }, [financialReport, transactions]);

  const repairEarnings = useMemo(() => {
    if (financialReport?.repairEarnings != null) return financialReport.repairEarnings;
    return transactions
      .filter((t) => t.type === typeMap.repair)
      .reduce((s, t) => s + t.amount, 0);
  }, [financialReport, transactions, typeMap.repair]);

  const salesEarnings = useMemo(() => {
    if (financialReport?.salesEarnings != null) return financialReport.salesEarnings;
    return transactions
      .filter((t) => t.type === typeMap.sale)
      .reduce((s, t) => s + t.amount, 0);
  }, [financialReport, transactions, typeMap.sale]);

  const repairPct = totalEarnings > 0 ? Math.round((repairEarnings / totalEarnings) * 100) : 0;
  const salesPct = totalEarnings > 0 ? Math.round((salesEarnings / totalEarnings) * 100) : 0;

  // -----------------------------------------------------------------
  // Filtering & pagination
  // -----------------------------------------------------------------
  const filtered = useMemo(
    () =>
      transactions.filter((t) =>
        [t.paidAt, t.type, t.shop].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [transactions, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, currentPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div dir="rtl" style={{marginLeft:"-25px",marginTop:"-575px"}} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-right bg-white p-6  shadow-sm border-l-4 border-lime-500">
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center justify-start gap-3">
            <FiDollarSign className="text-gray-500" /> الإيرادات
          </h1>
          <p className="text-sm text-gray-600">إدارة ومتابعة العمليات المالية بسهولة</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث في العمليات..."
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 rounded-lg border  bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none transition text-right"
            />
          </div>

          {/* Time range dropdown */}
          {/* <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-5 py-3 bg-lime-50 border border-lime-300 rounded-lg hover:border-lime-500 transition text-right"
            >
              {timeRangeOptions.find((o) => o.value === timeRange)?.label || 'اختر المدة'}
              <FiChevronDown className={`transition ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-lime-200 rounded-lg shadow-lg">
                {timeRangeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTimeRange(opt.value);
                      setDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-lime-50 transition text-sm"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div> */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-5 bg-white  shadow-sm border-l-4 border-lime-500">
            <h3 className="text-sm font-medium flex items-center gap-1 text-lime-700 justify-start">
              <FiDollarSign /> إجمالي الأرباح
            </h3>
            <p className="mt-1 text-2xl font-bold text-black">{totalEarnings.toFixed(2)} ج.م</p>
          </div>
          <div className="p-5 bg-white  shadow-sm border-l-4 border-green-500">
            <h3 className="text-sm font-medium flex items-center gap-1 text-green-700 justify-start">
              <FiDollarSign /> تصليح ({repairPct}%)
            </h3>
            <p className="mt-1 text-2xl font-bold text-black">{repairEarnings.toFixed(2)} ج.م</p>
          </div>
          <div className="p-5 bg-white  shadow-sm border-l-4 border-yellow-500">
            <h3 className="text-sm font-medium flex items-center gap-1 text-yellow-700 justify-start">
              <FiDollarSign /> مبيعات ({salesPct}%)
            </h3>
            <p className="mt-1 text-2xl font-bold text-black">{salesEarnings.toFixed(2)} ج.م</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-lime-100">
          {loading ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['التاريخ', 'نوع الخدمة', 'الجهاز', 'المكان', 'طريقة الدفع', 'الحساب', 'الحالة'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-gray-700 text-center">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {['التاريخ', 'نوع الخدمة', 'الجهاز', 'المكان', 'طريقة الدفع', 'الحساب', 'الحالة'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs font-bold text-gray-700 text-center"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-100">
                  {paginated.length ? (
                    paginated.map((txn) => (
                      <tr key={txn.id} className="hover:bg-lime-50 transition">
                        <td className="px-4 py-3 text-sm text-center">{txn.paidAt}</td>
                        <td className="px-4 py-3 text-sm text-center">{txn.type}</td>
                        <td className="px-4 py-3 text-sm text-center">{txn.item}</td>
                        <td className="px-4 py-3 text-sm text-center">{txn.shop}</td>
                        <td className="px-4 py-3 text-sm text-center">{txn.paymentMethod}</td>
                        <td className="px-4 py-3 text-sm font-medium text-center">{txn.amount.toFixed(2)} ج.م</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${txn.status === 'مكتمل' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-500">
                        <div className="text-lime-400 mb-4">
                          <FiDollarSign className="w-16 h-16 mx-auto opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">
                          لا توجد عمليات
                        </h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'جرب تعديل البحث' : 'سيتم عرض العمليات عند وجودها'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
            >
              <FiChevronRight />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  currentPage === i + 1
                    ? 'bg-lime-500 text-white border-lime-500'
                    : 'border-lime-200 hover:bg-lime-50 text-black'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
            >
              <FiChevronLeft />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;