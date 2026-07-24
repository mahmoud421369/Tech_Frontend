import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiDollarSign, FiSearch, FiTool, FiShoppingCart,
  FiChevronRight, FiChevronLeft, FiCheckCircle, FiClock, FiXCircle,
  FiDownload, FiActivity, FiArrowUp, FiArrowDown, FiMoreHorizontal, FiCalendar, FiCreditCard, FiHash, FiChevronDown
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const EASE = [0.16, 1, 0.3, 1];

const ROWS_OPTIONS = [5, 10, 25, 50];

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });



const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ar-EG', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const getServiceType = (txn) => {
  if (txn.paymentType === 'ORDER_PAYMENT')  return 'طلب بيع';
  if (txn.paymentType === 'REPAIR_PAYMENT') return 'طلب إصلاح';
  return txn.paymentType || '-';
};

const getPaymentMethod = (txn) => {
  if (txn.paymentMethod === 'CASH') return 'نقدي';
  if (txn.paymentMethod === 'CREDIT_CARD') return 'بطاقة ائتمان';
  return txn.paymentMethod || '-';
};

const COLOR_HEX = { lime: '#84cc16', emerald: '#10b981', blue: '#3b82f6', orange: '#f97316' };

const CoinsIllustration = memo(({ color }) => (
  <svg viewBox="0 0 44 44" className="w-6 h-6">
    <motion.g
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="18" cy="28" rx="12" ry="5" fill="none" stroke={color} strokeWidth="2.4" />
      <path d="M6,28 L6,22" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30,28 L30,22" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="18" cy="22" rx="12" ry="5" fill="none" stroke={color} strokeWidth="2.4" />
    </motion.g>
    <circle cx="30" cy="12" r="7" fill="none" stroke={color} strokeWidth="2.4" />
    <text x="30" y="15.5" textAnchor="middle" fontSize="8" fontWeight="800" fill={color}>$</text>
  </svg>
));

const WrenchIllustration = memo(({ color }) => (
  <svg viewBox="0 0 44 44" className="w-6 h-6">
    <motion.g
      animate={{ rotate: [-12, 12, -12] }}
      style={{ transformOrigin: '30px 14px' }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="16" y="20" width="26" height="7" rx="3.5" fill="none" stroke={color} strokeWidth="2.4" transform="rotate(-32 29 23.5)" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke={color} strokeWidth="2.4" strokeDasharray="22 100" strokeLinecap="round" transform="rotate(140 12 12)" />
    </motion.g>
  </svg>
));

const BagIllustration = memo(({ color }) => (
  <svg viewBox="0 0 44 44" className="w-6 h-6">
    <path d="M12,17 H32 L30,36 H14 Z" fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
    <motion.path
      d="M17,17 V13 C17,9.5 19.5,7 22,7 C24.5,7 27,9.5 27,13 V17"
      fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    />
    <circle cx="22" cy="24" r="1.8" fill={color} />
  </svg>
));

const PulseIllustration = memo(({ color }) => (
  <svg viewBox="0 0 44 44" className="w-6 h-6">
    <circle cx="22" cy="22" r="15" fill="none" stroke={color} strokeWidth="2" opacity="0.35" />
    <motion.path
      d="M7,22 H16 L20,12 L25,32 L29,22 H37"
      fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2, ease: EASE }}
    />
  </svg>
));

const StatCard = memo(({ Illustration, label, value, color, description }) => (
  <div className="relative group bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="flex flex-col h-full relative z-10 text-right">
      <div className={`w-12 h-12 rounded-full bg-white border-2 border-gray-100 dark:border-gray-800 dark:bg-${color}-900/20 flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform`}>
        <Illustration color={COLOR_HEX[color] || '#10b981'} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-[9px] font-bold text-gray-400 mt-2">{description}</p>
    </div>
  </div>
));

const FilterDropdown = memo(({ value, options, onChange, icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full sm:w-auto flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 cursor-pointer transition-all"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon size={13} className="text-emerald-500" />}
          {current?.label}
        </span>
        <FiChevronDown className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: EASE }}
            className="absolute z-30 mt-2 w-full sm:w-52 right-0 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-right px-5 py-3 text-xs font-bold transition-colors ${
                  opt.value === value ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const Transactions = () => {
  const [transactions, setTransactions]   = useState([]);
  const [financialReport, setFinancialReport] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [rowsPerPage, setRowsPerPage]     = useState(10);
  const [filterType, setFilterType]       = useState('ALL');
  const [filterMethod, setFilterMethod]   = useState('ALL');

  useEffect(() => { document.title = 'السجل المالي للمتجر'; }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reportRes, repairRes, orderRes] = await Promise.all([
        api.get('/api/shops/payments/financial-report'),
        api.get('/api/shops/payments/repairs'),
        api.get('/api/shops/payments/orders'),
      ]);
      setFinancialReport(reportRes.data);
      const merged = [...(repairRes.data || []), ...(orderRes.data || [])].map(t => ({
        ...t, id: t.id || generateUUID()
      }));
      setTransactions(merged);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = useMemo(() => {
    const total = financialReport?.totalEarnings || transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const repair = financialReport?.repairEarnings || transactions.filter(t => t.paymentType === 'REPAIR_PAYMENT').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const order = financialReport?.salesEarnings || transactions.filter(t => t.paymentType === 'ORDER_PAYMENT').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return { total, repair, order };
  }, [financialReport, transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = [t.details, t.paymentReference, t.paymentType].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || t.paymentType === filterType;
      const matchesMethod = filterMethod === 'ALL' || t.paymentMethod === filterMethod;
      return matchesSearch && matchesType && matchesMethod;
    });
  }, [transactions, searchTerm, filterType, filterMethod]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filtered, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const exportToCSV = useCallback(() => {
    const headers = ['التاريخ', 'نوع الخدمة', 'طريقة الدفع', 'المبلغ (ج.م)'];
    const rows = filtered.map(t => [formatDate(t.paidAt), getServiceType(t), getPaymentMethod(t), t.amount]);
    const BOM = '\uFEFF';
    const csv = BOM + [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const statCards = useMemo(() => [
    { Illustration: CoinsIllustration, label: 'إجمالي الأرباح', value: `${stats.total.toLocaleString('ar-EG')} ج.م`, color: "lime", description: "إجمالي الدخل المحقق" },
    { Illustration: WrenchIllustration, label: 'أرباح الصيانة', value: `${stats.repair.toLocaleString('ar-EG')} ج.م`, color: "orange", description: "من طلبات الإصلاح" },
    { Illustration: BagIllustration, label: 'أرباح المبيعات', value: `${stats.order.toLocaleString('ar-EG')} ج.م`, color: "blue", description: "من مبيعات المنتجات" },
    { Illustration: PulseIllustration, label: 'العمليات المكتملة', value: transactions.length.toLocaleString('ar-EG'), color: "emerald", description: "إجمالي الفواتير" },
  ], [stats, transactions.length]);

  const typeOptions = useMemo(() => ([
    { value: 'ALL', label: 'جميع الخدمات' },
    { value: 'REPAIR_PAYMENT', label: 'طلبات الإصلاح' },
    { value: 'ORDER_PAYMENT', label: 'طلبات البيع' },
  ]), []);

  const methodOptions = useMemo(() => ([
    { value: 'ALL', label: 'جميع طرق الدفع' },
    { value: 'CASH', label: 'نقدي' },
    { value: 'CARD', label: 'بطاقة ائتمان' },
  ]), []);

  const rowsOptions = useMemo(() => ROWS_OPTIONS.map(n => ({ value: n, label: `${n} صفوف` })), []);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

       
       
        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">المركز المالي</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">سجل <span className="text-emerald-500">العمليات</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">تتبع تدفقاتك النقدية وحلل أداء مبيعاتك وخدماتك المالية بدقة</p>
          </div>

          <button 
            title="تصدير التقرير"
            onClick={exportToCSV}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-emerald-500 text-white dark:text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <FiDownload size={16} /> تصدير التقرير المالي
          </button>
        </div>

        
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة أو نوع العملية..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-200 transition-all"
              />
            </div>
            <FilterDropdown value={filterType} options={typeOptions} onChange={(v) => { setFilterType(v); setCurrentPage(1); }} icon={FiTool} />
            <FilterDropdown value={filterMethod} options={methodOptions} onChange={(v) => { setFilterMethod(v); setCurrentPage(1); }} icon={FiCreditCard} />
            <FilterDropdown value={rowsPerPage} options={rowsOptions} onChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }} />
          </div>
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900  dark:border-gray-700">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">التاريخ</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">نوع الخدمة</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المبلغ</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">طريقة الدفع</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">رقم العملية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                   [...Array(rowsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-gray-800">
                        <FiDollarSign size={40} />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد عمليات حالياً</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">لم يتم العثور على أي بيانات مالية مسجلة</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(t => (
                    <tr key={t.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                               <FiCalendar size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black text-gray-900 dark:text-white">{formatDate(t.paidAt)}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date(t.paidAt).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                         <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${t.paymentType === 'REPAIR_PAYMENT' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                            {t.paymentType === 'REPAIR_PAYMENT' ? <FiTool size={12} /> : <FiShoppingCart size={12} />}
                            {getServiceType(t)}
                         </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-black text-xs text-emerald-600">
                          EGP {Number(t.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                         <div className="flex flex-col items-center">
                            <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5 justify-center">
                               {t.paymentMethod === 'CARD' ? <FiCreditCard size={14} className="text-blue-500" /> : <FiDollarSign size={14} className="text-emerald-500" />}
                               {getPaymentMethod(t)}
                            </p>
                         </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-left">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                            <FiHash size={12} /> {t.paymentReference || t.id?.slice(0, 8)}
                         </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          
          
          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                 عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filtered.length)}</span> من <span className="text-gray-900 dark:text-white">{filtered.length}</span> عملية
               </p>
               <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                     <FiChevronRight size={20} />
                  </button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                     <FiChevronLeft size={20} />
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #10b981; }
      `}} />
    </div>
  );
};

export default memo(Transactions);