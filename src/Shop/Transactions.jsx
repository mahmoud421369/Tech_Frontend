import React, { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
import {
  FiDollarSign, FiSearch, FiTool, FiShoppingCart,
  FiChevronRight, FiChevronLeft, FiCheckCircle, FiClock, FiXCircle
} from 'react-icons/fi';
import api from '../api';

const ROWS_PER_PAGE = 10;


const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


const TransactionRow = memo(({ txn }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getServiceType = () => {
    if (txn.paymentType === 'ORDER_PAYMENT') return 'طلب بيع';
    if (txn.paymentType === 'REPAIR_PAYMENT') return 'طلب إصلاح';
    return txn.paymentType || '-';
  };

  const getItemName = () => {
    return txn.details || 'غير محدد';
  };

  const getLocation = () => {
    return 'المتجر الرئيسي';
  };

  const getPaymentMethod = () => {
    if (txn.paymentMethod === 'CASH') return 'نقدي';
    if (txn.paymentMethod === 'CARD') return 'بطاقة ائتمان';
    return txn.paymentMethod || '-';
  };

  const getStatus = () => {
    if (txn.paymentStatus === 'PAID') {
      return (
        <span className="flex items-center gap-2 text-green-700 font-medium">
          <FiCheckCircle className="text-lg" />
          مدفوع
        </span>
      );
    }
    if (txn.paymentStatus === 'PENDING') {
      return (
        <span className="flex items-center gap-2 text-amber-700 font-medium">
          <FiClock className="text-lg" />
          معلق
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 text-red-700 font-medium">
        <FiXCircle className="text-lg" />
        {txn.paymentStatus || 'غير معروف'}
      </span>
    );
  };

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{formatDate(txn.paidAt)}</td>
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{getServiceType()}</td>
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{getItemName()}</td>
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{getLocation()}</td>
      <td className="px-5 py-4 text-sm text-gray-800 text-center">{getPaymentMethod()}</td>
      <td className="px-5 py-4 text-center font-bold text-lg text-lime-600">
        {txn.amount.toLocaleString()} ج.م
      </td>
      <td className="px-5 py-4 text-center">{getStatus()}</td>
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
useEffect(() => {
document.title = "إدارة الفواتير";

});
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

      const merged = [...repairRes.data, ...orderRes.data].map((t) => ({
        id: t.id || generateUUID(), // استخدام الدالة المحلية
        amount: Number(t.amount) || 0,
        paymentType: t.paymentType || 'ORDER_PAYMENT',
        paymentMethod: t.paymentMethod || 'CASH',
        paymentStatus: t.paymentStatus || 'PENDING',
        paidAt: t.paidAt,
        details: t.details || 'غير محدد',
        paymentReference: t.paymentReference || '-',
        transactionId: t.transactionId || '-',
        orderId: t.orderId,
        repairRequestId: t.repairRequestId,
      }));

      setTransactions(merged);
    } catch (err) {
      console.error('Error fetching data:', err);
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
    return transactions
      .filter(t => t.paymentType === 'REPAIR_PAYMENT')
      .reduce((s, t) => s + t.amount, 0);
  }, [financialReport, transactions]);

  const salesEarnings = useMemo(() => {
    if (financialReport?.salesEarnings != null) return financialReport.salesEarnings;
    return transactions
      .filter(t => t.paymentType === 'ORDER_PAYMENT')
      .reduce((s, t) => s + t.amount, 0);
  }, [financialReport, transactions]);

  const repairPct = totalEarnings > 0 ? Math.round((repairEarnings / totalEarnings) * 100) : 0;
  const salesPct = totalEarnings > 0 ? Math.round((salesEarnings / totalEarnings) * 100) : 0;

  const filtered = useMemo(() =>
    transactions.filter(t =>
      [
        t.paidAt || '',
        t.paymentType || '',
        t.details || '',
        t.paymentMethod || '',
        t.paymentStatus || ''
      ].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [transactions, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, currentPage]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString();
  };

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
                <p className="text-4xl font-bold mt-3">{formatNumber(totalEarnings)} ج.م</p>
              </div>
              <FiDollarSign className="text-6xl opacity-40 text-lime-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">من الإصلاحات ({repairPct}%)</p>
                <p className="text-4xl font-bold mt-3 text-emerald-600">{formatNumber(repairEarnings)} ج.م</p>
              </div>
              <FiTool className="text-6xl opacity-40 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">من المبيعات ({salesPct}%)</p>
                <p className="text-4xl font-bold mt-3 text-amber-600">{formatNumber(salesEarnings)} ج.م</p>
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
              value={searchTerm}
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