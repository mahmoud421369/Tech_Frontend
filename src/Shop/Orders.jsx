import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiChevronDown, FiSearch, FiInfo, FiCheckSquare, FiXCircle,
  FiChevronLeft, FiChevronRight, FiX, FiPackage, FiClock,
  FiTruck, FiCheckCircle, FiAlertCircle,
  FiCalendar, FiUser, FiPhone, FiCreditCard, FiDollarSign,
  FiTag, FiShoppingBag, FiHash,
  FiCheck, FiFilter, FiArrowLeft, FiCopy, FiThumbsUp, FiSettings,
  FiChevronsDown, FiArrowUp, FiArrowDown, FiExternalLink, FiMoreHorizontal, FiActivity
} from 'react-icons/fi';
import { RiShoppingCartLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';




const ROWS_OPTIONS = [5,10, 25, 50];

const STATUS_TRANSLATIONS = {
  PENDING: 'معلق',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد المعالجة',
  FINISHPROCESSING: 'تمت المعالجة',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغى',
  all: 'جميع الحالات',
};

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHPROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const NEXT_STATUSES = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING'],
  PROCESSING: ['FINISHPROCESSING'],
  FINISHPROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_STYLE = {
  PENDING: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
  CONFIRMED: { bg: 'bg-lime-50 dark:bg-lime-900/20', text: 'text-lime-600', dot: 'bg-lime-500' },
  PROCESSING: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600', dot: 'bg-yellow-500' },
  FINISHPROCESSING: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  SHIPPED: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', dot: 'bg-purple-500' },
  DELIVERED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
};

const getStatusStyle = (s) => STATUS_STYLE[s] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };



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

const OrderRow = memo(({ order, onDetails, onCopy, onUpdateStatus }) => {
  const cs = getStatusStyle(order.status);
  const totalQty = (order.orderItems || []).reduce((sum, i) => sum + i.quantity, 0);
  return (
    <tr className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
            <FiHash size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-900 dark:text-white">#{String(order.id).slice(0, 8)}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{totalQty} منتجات</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 whitespace-nowrap text-center">
        <p className="text-xs font-black text-gray-900 dark:text-white">{order.firstName} {order.lastName}</p>
        <p dir='ltr' className="text-[10px] font-bold text-gray-400 tracking-tight">{order.phoneNumber || "بدون هاتف"}</p>
      </td>
      <td className="px-8 py-6 whitespace-nowrap text-center font-mono font-black text-xs text-lime-600">
        EGP {Number(order.totalPrice)}
      </td>
      <td className="px-8 py-6 whitespace-nowrap text-center">
        <p className="text-[10px] font-black text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
      </td>
      <td className="px-8 py-6 whitespace-nowrap text-center">
        <span onClick={() => onUpdateStatus(order)} className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cs.dot} animate-pulse`} />
          {STATUS_TRANSLATIONS[order.status] || order.status}
        </span>
      </td>
      <td className="px-8 py-6 whitespace-nowrap text-left">
        <div className="flex items-center justify-start gap-2">
          <button title="تفاصيل الطلب" onClick={() => onDetails(order)} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 transition-all active:scale-95">
            <FiInfo size={16} />
          </button>
          <button title='نسخ' onClick={() => onCopy(order.id)} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 transition-all active:scale-95">
            <FiCopy size={14} />
          </button>

          {order.status === 'PENDING' && (
            <div className="flex gap-2">
              <button title="قبول الطلب" onClick={() => onUpdateStatus(order, 'CONFIRMED')} className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95">
                <FiCheck size={16} />
              </button>
              <button title="رفض الطلب" onClick={() => onUpdateStatus(order, 'CANCELLED')} className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-all active:scale-95">
                <FiX size={16} />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});




const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');


  useEffect(() => { document.title = 'إدارة الطلبات'; }, []);

  const showToast = (text, icon) =>
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    });

  const fetchOrders = useCallback(async (status, search = '') => {
    setLoading(true);
    try {
      const endpoint = status === 'all'
        ? '/api/shops/orders/control'
        : `/api/shops/orders/control/status/${status}`;
      const res = await api.get(endpoint, { params: { query: search } });
      setOrders(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch {
      showToast('فشل تحميل الطلبات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useMemo(() => debounce(fetchOrders, 300), [fetchOrders]);

  useEffect(() => {
    debouncedFetch(statusFilter, searchTerm);
    return () => debouncedFetch.cancel();
  }, [statusFilter, searchTerm, debouncedFetch]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return orders;
    return orders.filter(o =>
      String(o.id).toLowerCase().includes(term) ||
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(term) ||
      String(o.phoneNumber).toLowerCase().includes(term) ||
      (o.orderItems || []).some(item => item.productName?.toLowerCase().includes(term))
    );
  }, [orders, searchTerm]);

  const paginated = useMemo(() => filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredOrders, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  }), [orders]);

  const updateOrderStatus = async (orderId, newStatus) => {
   
    
    const applyOptimistic = (id, status) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    };

    const previousOrders = [...orders];

    try {
      if (newStatus === 'CONFIRMED') {
        const { isConfirmed } = await Swal.fire({
          title: 'قبول الطلب؟', text: 'سيتم خصم الكميات من المخزون', icon: 'question',
          showCancelButton: true, confirmButtonText: 'قبول', cancelButtonText: 'إلغاء',
          confirmButtonColor: '#84cc16',
        });
        if (!isConfirmed) return;
        
        applyOptimistic(orderId, 'CONFIRMED');
        await api.post(`/api/shops/orders/control/${orderId}/accept`);
      } else if (newStatus === 'CANCELLED') {
        const { isConfirmed } = await Swal.fire({
          title: 'رفض الطلب؟', icon: 'warning',
          showCancelButton: true, confirmButtonText: 'رفض', cancelButtonText: 'إلغاء',
          confirmButtonColor: '#ef4444',
        });
        if (!isConfirmed) return;
        
        applyOptimistic(orderId, 'CANCELLED');
        await api.post(`/api/shops/orders/control/${orderId}/reject`);
      } else {
        applyOptimistic(orderId, newStatus);
        await api.put(`/api/shops/orders/control/${orderId}/status`, { status: newStatus });
      }
      showToast('تم تحديث الحالة بنجاح', 'success');
      
      
      fetchOrders(statusFilter, searchTerm);
    } catch {
      setOrders(previousOrders);
      showToast('فشل تحديث الحالة', 'error');
    }
  };

  const statCards = useMemo(() => [
    { icon: RiShoppingCartLine, label: 'إجمالي الطلبات', value: stats.total.toLocaleString('ar-EG'), color: "lime", description: "طلبات قيد المعالجة" },
    { icon: FiClock, label: 'طلبات معلقة', value: stats.pending.toLocaleString('ar-EG'), color: "blue", description: "بانتظار المراجعة" },
    { icon: FiCheckCircle, label: 'طلبات مؤكدة', value: stats.confirmed.toLocaleString('ar-EG'), color: "emerald", description: "في مرحلة التنفيذ" },
    { icon: FiTruck, label: 'تم التسليم', value: stats.delivered.toLocaleString('ar-EG'), color: "indigo", description: "عمليات مكتملة" },
  ], [stats]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">



        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">سجل المعاملات</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-lime-500">الطلبات</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">تابع وحسن تجربة عملائك من خلال إدارة الطلبات الفعالة</p>
          </div>

          <button
            title="تصفية النتائج"
            onClick={() => setShowFilterPanel(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest hover:bg-lime-500 dark:hover:bg-lime-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <FiFilter size={16} /> تصفية النتائج
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
                placeholder="ابحث برقم الطلب، اسم العميل، أو المنتج..."
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
              {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n} طلبات لكل صفحة</option>)}
            </select>
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الطلب</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">العميل</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المجموع</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">التاريخ</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الحالة</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  [...Array(rowsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-gray-800">
                        <FiShoppingBag size={40} />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد طلبات</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">السجل فارغ أو لا يطابق شروط البحث</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(o => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      onDetails={(order) => { setSelectedOrder(order); setShowDetailsModal(true); }}
                      onCopy={(id) => { navigator.clipboard.writeText(id); showToast('تم نسخ رقم الطلب', 'success'); }}
                      onUpdateStatus={(order, nextStatus) => {
                        if (nextStatus) {
                          updateOrderStatus(order.id, nextStatus);
                        } else {
                          setStatusModalOrder(order);
                          setShowStatusModal(true);
                        }
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>



          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filteredOrders.length)}</span> من <span className="text-gray-900 dark:text-white">{filteredOrders.length}</span> طلب
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



      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowDetailsModal(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/10 text-lime-600 flex items-center justify-center">
                  <RiShoppingCartLine size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">تفاصيل الطلب</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{selectedOrder.id}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                <FiX size={18} />
              </button>
            </div>

            <div className="px-8 py-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar-thin">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">العميل</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                  <p dir="ltr" className="text-[10px] font-bold text-gray-500">{selectedOrder.phoneNumber}</p>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">التاريخ</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')}</p>
                  <p className="text-[10px] font-bold text-gray-500">{new Date(selectedOrder.createdAt).toLocaleTimeString('ar-EG')}</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">المنتجات المطلوب</p>
                <div className="space-y-4">
                  {(selectedOrder.orderItems || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-700">
                          <FiPackage size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white">{item.productName}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{item.quantity} وحدة × {item.priceAtCheckout} ج.م</p>
                        </div>
                      </div>
                      <p className="text-xs font-black text-lime-600 font-mono">{item.subtotal} ج.م</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-6">
                <p className="text-sm font-black text-gray-900 dark:text-white">الإجمالي النهائي</p>
                <p className="text-2xl font-black text-lime-600 tracking-tighter">ج.م {selectedOrder.totalPrice.toLocaleString('ar-EG')}</p>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-4">
              <button onClick={() => setShowDetailsModal(false)} className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-lime-500 transition-all">إغلاق النافذة</button>
            </div>
          </div>
        </div>
      )}



      {showFilterPanel && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowFilterPanel(false)} />
          <div className="relative w-full lg:max-w-md bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية الطلبات</h3>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">اختر الحالة المطلوبة للعرض</p>
            </div>
            <div className="p-8 grid grid-cols-2 gap-4">
              {['all', ...STATUSES].map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setShowFilterPanel(false); setCurrentPage(1); }}
                  className={`px-4 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s
                    ? "bg-lime-500 border-lime-500 text-white shadow-lg shadow-lime-500/20"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-lime-500 hover:text-lime-600"
                    }`}
                >
                  {STATUS_TRANSLATIONS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {showStatusModal && statusModalOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowStatusModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديث حالة الطلب</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">#{statusModalOrder.id}</p>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">اختر المرحلة التالية</p>
              <div className="space-y-2">
                {(NEXT_STATUSES[statusModalOrder.status] || []).length > 0 ? (
                  (NEXT_STATUSES[statusModalOrder.status] || []).map(status => (
                    <button
                      key={status}
                      onClick={() => { updateOrderStatus(statusModalOrder.id, status); setShowStatusModal(false); }}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-xs font-black text-gray-700 dark:text-gray-200 hover:border-lime-500 hover:text-lime-600 transition-all flex items-center justify-between group"
                    >
                      {STATUS_TRANSLATIONS[status]}
                      <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300 mx-auto">
                      <FiCheckSquare size={24} />
                    </div>
                    <p className="text-xs font-bold text-gray-400">لا توجد مراحل تالية متاحة لهذا الطلب</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-8 pb-8">
              <button onClick={() => setShowStatusModal(false)} className="w-full py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
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

export default memo(Orders);