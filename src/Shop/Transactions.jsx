import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  FiDollarSign, FiSearch, FiTool, FiShoppingCart,
  FiChevronRight,
  FiChevronLeft
} from 'react-icons/fi';
import api from '../api';

const ROWS_PER_PAGE = 10;

const TransactionRow = memo(({ txn }) => {
  const statusColor =
    txn.status === 'مكتمل'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{txn.paidAt}</td>
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{txn.type}</td>
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{txn.item}</td>
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{txn.shop}</td>
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{txn.paymentMethod}</td>
      <td className="px-5 py-4 text-center font-bold text-lg">{txn.amount.toFixed(2)} ج.م</td>
      <td className="px-5 py-4 text-center">
        <span className={`px-4 py-2 rounded-full text-xs font-bold ${statusColor}`}>
          {txn.status}
        </span>
      </td>
    </tr>
  );
});

const SkeletonRow = memo(() => (
  <tr>
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-5 py-4 text-center">
        <div className="h-4 bg-gray-200 rounded-full animate-pulse mx-auto w-32" />
      </td>
    ))}
  </tr>
));

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [financialReport, setFinancialReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('month');
  const [currentPage, setCurrentPage] = useState(1);

  const abortCtrl = useRef(new AbortController());

  const statusMap = { completed: 'مكتمل', pending: 'معلق' };
  const typeMap = { repair: 'إصلاح', sale: 'بيع' };

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

    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAll();
    return () => abortCtrl.current.abort();
  }, [fetchAll]);

  const totalEarnings = useMemo(() => {
    if (financialReport?.totalEarnings != null) return financialReport.totalEarnings;
    return transactions.reduce((s, t) => s + t.amount, 0);
  }, [financialReport, transactions]);

  const repairEarnings = useMemo(() => {
    if (financialReport?.repairEarnings != null) return financialReport.repairEarnings;
    return transactions.filter(t => t.type === typeMap.repair).reduce((s, t) => s + t.amount, 0);
  }, [financialReport, transactions]);

  const salesEarnings = useMemo(() => {
    if (financialReport?.salesEarnings != null) return financialReport.salesEarnings;
    return transactions.filter(t => t.type === typeMap.sale).reduce((s, t) => s + t.amount, 0);
  }, [financialReport, transactions]);

  const repairPct = totalEarnings > 0 ? Math.round((repairEarnings / totalEarnings) * 100) : 0;
  const salesPct = totalEarnings > 0 ? Math.round((salesEarnings / totalEarnings) * 100) : 0;

  const filtered = useMemo(() =>
    transactions.filter(t =>
      [t.paidAt, t.type, t.shop, t.item].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [transactions, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <div dir="rtl" style={{ marginLeft: "-250px", marginTop: "-575px" }} className="min-h-screen bg-gray-50 font-cairo py-8">
      <div className="max-w-5xl mx-auto px-6">

        
        <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between flex-row-reverse text-right gap-5">
            <div className="p-5 bg-lime-100 rounded-2xl">
              <FiDollarSign className="text-4xl text-lime-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">الإيرادات والعمليات المالية</h1>
              <p className="text-lg text-gray-600 mt-2">متابعة شاملة للأرباح من المبيعات والإصلاحات</p>
            </div>
          </div>
        </div>

       
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">إجمالي الأرباح</p>
                <p className="text-4xl font-bold mt-3">{totalEarnings.toFixed(2)} ج.م</p>
              </div>
              <FiDollarSign className="text-6xl opacity-40 text-lime-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">من الإصلاحات ({repairPct}%)</p>
                <p className="text-4xl font-bold mt-3 text-emerald-600">{repairEarnings.toFixed(2)} ج.م</p>
              </div>
              <FiTool className="text-6xl opacity-40 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">من المبيعات ({salesPct}%)</p>
                <p className="text-4xl font-bold mt-3 text-amber-600">{salesEarnings.toFixed(2)} ج.م</p>
              </div>
              <FiShoppingCart className="text-6xl opacity-40 text-amber-600" />
            </div>
          </div>
        </div>

      
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="relative max-w-md mx-auto">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input
              type="text"
              placeholder="ابحث في العمليات حسب التاريخ، النوع، المكان..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 py-3.5 pl-4 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-base transition bg-gray-50"
            />
          </div>
        </div>

        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 border-6 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-6 text-lg text-gray-600">جاري تحميل العمليات المالية...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-20 text-center text-gray-500">
              <FiDollarSign className="w-16 h-16 mx-auto opacity-30 mb-4" />
              <p className="text-xl">لا توجد عمليات مالية حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-5 py-4 text-base font-bold">التاريخ</th>
                    <th className="px-5 py-4 text-base font-bold">نوع الخدمة</th>
                    <th className="px-5 py-4 text-base font-bold">الجهاز/المنتج</th>
                    <th className="px-5 py-4 text-base font-bold">المكان</th>
                    <th className="px-5 py-4 text-base font-bold">طريقة الدفع</th>
                    <th className="px-5 py-4 text-base font-bold">المبلغ</th>
                    <th className="px-5 py-4 text-base font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map((txn) => (
                    <TransactionRow key={txn.id} txn={txn} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

    
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-3 bg-white border border-lime-600 rounded-xl disabled:opacity-50 hover:bg-lime-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
            >
              <FiChevronLeft className="w-5 h-5" />
              السابق
            </button>

            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-12 h-12 rounded-xl font-bold text-base transition shadow-sm flex items-center justify-center ${
                    currentPage === i + 1 ? 'bg-lime-600 text-white' : 'bg-white border border-lime-600 text-lime-700 hover:bg-lime-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-3 bg-white border border-lime-600 rounded-xl disabled:opacity-50 hover:bg-lime-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
            >
              التالي
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;