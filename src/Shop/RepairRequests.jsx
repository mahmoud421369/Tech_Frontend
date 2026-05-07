import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiSearch, FiChevronDown, FiInfo, FiX, FiChevronLeft, FiChevronRight,
  FiTool, FiPackage, FiCopy, FiCreditCard, FiDollarSign, FiCheckCircle,
  FiTruck, FiMapPin, FiArrowDownLeft, FiCheck, FiClock, FiXCircle,
  FiPauseCircle, FiArrowUp, FiArrowDown, FiChevronsDown, FiActivity, FiExternalLink, FiMoreHorizontal, FiHash
} from 'react-icons/fi';
import { RiFilter3Line, RiStore2Line, RiVerifiedBadgeLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';




const nextStatuses = {
  SUBMITTED: ['CANCELLED'],
  QUOTE_SENT: ['QUOTE_APPROVED', 'QUOTE_REJECTED'],
  QUOTE_APPROVED: ['DEVICE_COLLECTED'],
  QUOTE_REJECTED: ['CANCELLED'],
  DEVICE_COLLECTED: ['REPAIRING'],
  REPAIRING: ['REPAIR_COMPLETED'],
  REPAIR_COMPLETED: [],
  // DEVICE_DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};

const STATUS_META = {
  SUBMITTED: { label: 'تم التقديم', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
  QUOTE_SENT: { label: 'تم إرسال العرض', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600', dot: 'bg-teal-500' },
  QUOTE_APPROVED: { label: 'موافقة على العرض', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  QUOTE_REJECTED: { label: 'رفض العرض', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  DEVICE_COLLECTED: { label: 'تم استلام الجهاز', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', dot: 'bg-purple-500' },
  REPAIRING: { label: 'تحت الإصلاح', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', dot: 'bg-orange-500' },
  REPAIR_COMPLETED: { label: 'تم الإصلاح', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', dot: 'bg-green-500' },
  DEVICE_DELIVERED: { label: 'تم التسليم', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  CANCELLED: { label: 'ملغاة', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
  FAILED: { label: 'فشلت', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700', dot: 'bg-red-600' },
};

const getStatusMeta = (status) => STATUS_META[(status || '').toUpperCase()] || { label: status || '—', bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };

const ROWS_OPTIONS = [5,10, 25, 50];




const StatCard = memo(({ icon: Icon, label, value, color, description }) => (
  <div className="relative group bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="flex flex-col h-full relative z-10 text-right">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-4 group-hover:rotate-6 transition-transform`}>
        <Icon size={22} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-[9px] font-bold text-gray-400 mt-2">{description}</p>
    </div>
  </div>
));




const RepairRequests = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalRepair, setStatusModalRepair] = useState(null);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceModalRepair, setPriceModalRepair] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRepair, setDetailsRepair] = useState(null);

  const [stats, setStats] = useState({ totalRepairs: 0, pendingQuote: 0, underRepair: 0, completed: 0 });

  useEffect(() => { document.title = 'إدارة طلبات التصليح'; }, []);

  const showToast = useCallback((text, icon) =>
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    }), []);

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all'
        ? '/api/shops/repair-request'
        : `/api/shops/repair-request/status/${statusFilter.toUpperCase()}`;
      const res = await api.get(url, { params: { query: searchTerm } });
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setRepairs(data);
      setStats({
        totalRepairs: data.length,
        pendingQuote: data.filter(r => ['SUBMITTED', 'QUOTE_SENT'].includes((r.status || '').toUpperCase())).length,
        underRepair: data.filter(r => (r.status || '').toUpperCase() === 'REPAIRING').length,
        completed: data.filter(r => ['REPAIR_COMPLETED', 'DEVICE_DELIVERED'].includes((r.status || '').toUpperCase())).length,
      });
    } catch { showToast('فشل جلب طلبات التصليح', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, searchTerm]);

  const debouncedFetch = useMemo(() => debounce(fetchRepairs, 400), [fetchRepairs]);
  useEffect(() => { debouncedFetch(); return () => debouncedFetch.cancel(); }, [debouncedFetch]);

  const updateRepairStatus = useCallback(async (repairId, newStatus) => {
    const previousRepairs = [...repairs];
    setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: newStatus } : r));

    try {
      await api.put(`/api/shops/repair-request/${repairId}/status`, { status: newStatus });
      showToast('تم تحديث الحالة بنجاح', 'success');
      fetchRepairs();
    } catch { 
      setRepairs(previousRepairs);
      showToast('فشل تحديث الحالة', 'error'); 
    }
  }, [repairs, fetchRepairs, showToast]);

  const updateRepairPrice = useCallback(async () => {
    if (!newPrice || newPrice <= 0) { showToast('يرجى إدخال سعر صحيح', 'error'); return; }
    const repairId = priceModalRepair.id;
    const priceVal = Number(newPrice);

    const previousRepairs = [...repairs];
    setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, price: priceVal } : r));
    setShowPriceModal(false);

    try {
      await api.put(`/api/shops/repair-request/${repairId}/price`, { price: priceVal });
      showToast('تم تحديد السعر بنجاح', 'success');
      fetchRepairs();
    } catch { 
      setRepairs(previousRepairs);
      showToast('فشل في تحديد السعر', 'error'); 
    }
  }, [newPrice, priceModalRepair, repairs, fetchRepairs, showToast]);

  const paginated = useMemo(() => repairs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [repairs, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(repairs.length / rowsPerPage);

  const statCards = useMemo(() => [
    { icon: FiPackage, label: 'إجمالي الطلبات', value: stats.totalRepairs.toLocaleString('ar-EG'), color: "lime", description: "جميع الطلبات المستلمة" },
    { icon: FiClock, label: 'بانتظار عرض سعر', value: stats.pendingQuote.toLocaleString('ar-EG'), color: "orange", description: "تحتاج إلى تسعير فوراً" },
    { icon: FiTool, label: 'قيد الإصلاح', value: stats.underRepair.toLocaleString('ar-EG'), color: "blue", description: "داخل الورشة الآن" },
    { icon: FiCheckCircle, label: 'تم الانتهاء', value: stats.completed.toLocaleString('ar-EG'), color: "emerald", description: "طلبات جاهزة للتسليم" },
  ], [stats]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">



        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">خدمات الصيانة</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">طلبات <span className="text-lime-500">التصليح</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">أدر دورة حياة الإصلاح بالكامل من التقديم حتى التسليم النهائي</p>
          </div>

          <button
            title="تصفية الطلبات"
            onClick={() => setShowFilterPanel(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest hover:bg-lime-500 dark:hover:bg-lime-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <RiFilter3Line size={16} /> تصفية الطلبات
          </button>
        </div>

        
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ابحث برقم الطلب، اسم العميل أو نوع الجهاز..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all"
              />
            </div>
            <select
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-lime-500/10 cursor-pointer transition-all"
            >
              {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n} صفوف لكل صفحة</option>)}
            </select>
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">رقم الطلب</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المتجر</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">السعر التقديري</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الحالة</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  [...Array(rowsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-gray-800">
                        <FiTool size={40} />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد طلبات تصليح</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">السجل فارغ أو لا يطابق البحث</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(r => {
                    const cs = getStatusMeta(r.status);
                    const canEditPrice = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_REJECTED'].includes((r.status || '').toUpperCase());
                    const hasNext = nextStatuses[(r.status || '').toUpperCase()]?.length > 0;
                    return (
                      <tr key={r.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                              <FiHash size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 dark:text-white">#{String(r.id).slice(0, 8)}</p>

                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <p className="text-xs font-black text-gray-900 dark:text-white">{r.shopName || "—"}</p>

                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center font-mono font-black text-sm text-lime-600">
                          {r.price ? `EGP ${Number(r.price)}` : <span className="text-red-500">لم يتم التسعير</span>}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <span onClick={() => { if (hasNext) { setStatusModalRepair(r); setShowStatusModal(true); } }} className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text} ${hasNext ? 'cursor-pointer hover:opacity-80' : ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cs.dot} animate-pulse`} />
                            {cs.label}
                            {hasNext && <FiChevronDown size={12} className="mr-1" />}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-left">
                          <div className="flex items-center justify-start gap-2">
                            <button title="تفاصيل الطلب" onClick={() => { setDetailsRepair(r); setShowDetailsModal(true); }} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 transition-all active:scale-95">
                              <FiInfo size={16} />
                            </button>
                              <button title='نسخ رقم الطلب' onClick={() => { navigator.clipboard.writeText(r.id); showToast('تم نسخ رقم الطلب', 'success'); }} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 transition-all active:scale-95">
                                  <FiCopy size={14} />   
                                </button>

                                 {canEditPrice && (
                                  <button title='تحديد/تغيير السعر' onClick={() => { setPriceModalRepair(r); setNewPrice(r.price || ''); setShowPriceModal(true); }} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 transition-all active:scale-95">
                                    <FiDollarSign size={14} />  
                                  </button>
                                )}

                          
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>



          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, repairs.length)}</span> من <span className="text-gray-900 dark:text-white">{repairs.length}</span> طلب
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all">
                  <FiChevronRight size={20} />
                </button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all">
                  <FiChevronLeft size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>



      {showFilterPanel && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowFilterPanel(false)} />
          <div className="relative w-full lg:max-w-md bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية طلبات التصليح</h3>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">اختر الحالة لعرض الطلبات المتعلقة بها</p>
            </div>
            <div className="p-8 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar-thin">
              <button onClick={() => { setStatusFilter('all'); setShowFilterPanel(false); setCurrentPage(1); }} className={`px-4 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? "bg-lime-500 border-lime-500 text-white" : "bg-gray-50 dark:bg-gray-900 text-gray-500 hover:border-lime-500"}`}>جميع الحالات</button>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <button key={key} onClick={() => { setStatusFilter(key); setShowFilterPanel(false); setCurrentPage(1); }} className={`px-4 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === key ? "bg-lime-500 border-lime-500 text-white shadow-lg shadow-lime-500/20" : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-lime-500 hover:text-lime-600"}`}>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {showDetailsModal && detailsRepair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowDetailsModal(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/10 text-lime-600 flex items-center justify-center">
                  <FiTool size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">تفاصيل طلب التصليح</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{detailsRepair.id}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                <FiX size={18} />
              </button>
            </div>

            <div className="px-8 py-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar-thin text-right">
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-none space-y-4">
                <div className="flex items-start gap-3">
                  <FiTool className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">وصف العطل</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 leading-relaxed">{detailsRepair.description || "لا يوجد وصف مفصل للعطل"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">  المتجر</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{detailsRepair.shopName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">طريقة التسليم</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{detailsRepair.deliveryMethod || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest"> عنؤان التسليم</p>
                    <p className="text-xs font-black text-lime-600 mt-2 dark:text-white">{detailsRepair.deliveryAddressDetails}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest"> طريقة الدفع</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{detailsRepair.paymentMethod}</p>
                  </div>
                </div>
                <div className="p-6 bg-lime-500/5 dark:bg-lime-500/10 rounded-[2rem] border border-lime-500/10 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black text-lime-600 uppercase tracking-widest mb-1">المبلغ المطلوب</p>
                  <p className="text-2xl font-black text-lime-600 tracking-tighter">{detailsRepair.price ? `ج.م ${Number(detailsRepair.price).toLocaleString('ar-EG')}` : "—"}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700">
              <button onClick={() => setShowDetailsModal(false)} className="w-full py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-lime-500 transition-all">إغلاق</button>
            </div>
          </div>
        </div>
      )}



      {showStatusModal && statusModalRepair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowStatusModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديث مرحلة الإصلاح</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">#{statusModalRepair.id}</p>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                {nextStatuses[(statusModalRepair.status || '').toUpperCase()]?.map(status => (
                  <button
                    key={status}
                    onClick={() => { updateRepairStatus(statusModalRepair.id, status); setShowStatusModal(false); }}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-xs font-black text-gray-700 dark:text-gray-200 hover:border-lime-500 hover:text-lime-600 transition-all flex items-center justify-between group"
                  >
                    {getStatusMeta(status).label}
                    <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
            <div className="px-8 pb-8">
              <button onClick={() => setShowStatusModal(false)} className="w-full py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
            </div>
          </div>
        </div>
      )}



      {showPriceModal && priceModalRepair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowPriceModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديد عرض السعر</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">إرسال عرض مالي للعميل</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">المبلغ المقترح (ج.م)</label>
                <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-lg font-black text-gray-900 dark:text-white focus:outline-none transition-all text-center" />
              </div>
            </div>
            <div className="px-8 pb-8 flex gap-3">
              <button onClick={() => setShowPriceModal(false)} className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
              <button onClick={updateRepairPrice} className="flex-1 py-4 bg-lime-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/20">إرسال العرض</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default memo(RepairRequests);