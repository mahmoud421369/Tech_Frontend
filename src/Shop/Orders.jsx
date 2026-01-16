import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FiChevronDown, FiSearch, FiInfo, FiCheckSquare, FiXCircle,
  FiChevronLeft, FiChevronRight, FiX, FiPackage, FiClock,
  FiTruck, FiCheckCircle, FiAlertCircle,
  FiCalendar, FiUser, FiPhone, FiCreditCard, FiDollarSign,
  FiTag, FiShoppingBag, FiHash,
  FiCheck
} from 'react-icons/fi';
import { RiShoppingBag3Line } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';

const Orders = ({darkMode}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');

  const filterDropdownRef = useRef(null);
  const ordersPerPage = 10;

  useEffect(() => {
    document.title = "إدارة الطلبات";
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setOpenFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusTranslations = {
    PENDING: 'معلق',
    CONFIRMED: 'مؤكد',
    PROCESSING: 'قيد المعالجة',
    FINISHPROCESSING: 'تمت المعالجة',
    SHIPPED: 'تم الشحن',
    DELIVERED: 'تم التسليم',
    CANCELLED: 'ملغى',
    all: 'جميع الحالات',
  };

  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHPROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  const nextStatuses = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING'],
    PROCESSING: ['FINISHPROCESSING'],
    FINISHPROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  const getStatusColor = (status) => {
    const map = {
      PENDING: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-lime-100 text-lime-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      FINISHPROCESSING: 'bg-amber-100 text-amber-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const confirmed = orders.filter(o => o.status === 'CONFIRMED').length;
    const processing = orders.filter(o => ['PROCESSING', 'FINISHPROCESSING'].includes(o.status)).length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;

    return { total, pending, confirmed, processing, delivered };
  }, [orders]);

  const debouncedFetch = useMemo(
    () => debounce((status, search) => {
      setLoading(true);
      const endpoint = status === 'all'
        ? '/api/shops/orders/control'
        : `/api/shops/orders/control/status/${status}`;

      api.get(endpoint, { params: { query: search } })
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : res.data.content || [];
          setOrders(data);
        })
        .catch(() => toast.error('فشل تحميل الطلبات'))
        .finally(() => setLoading(false));
    }, 300),
    []
  );

  const fetchOrders = useCallback((status, search = '') => {
    debouncedFetch(status, search);
  }, [debouncedFetch]);

  useEffect(() => {
    fetchOrders(statusFilter, searchTerm);
    return () => debouncedFetch.cancel();
  }, [statusFilter, searchTerm, fetchOrders]);

  const acceptOrder = async (orderId) => {
    const confirm = await Swal.fire({
      title: 'قبول الطلب؟',
      text: 'سيتم خصم الكميات من المخزون',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'قبول',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#84cc16',
    });
    if (!confirm.isConfirmed) return;

    const prev = [...orders];
    setOrders(prev.map(o => o.id === orderId ? { ...o, status: 'CONFIRMED' } : o));

    try {
      await api.post(`/api/shops/orders/control/${orderId}/accept`);
      Swal.fire({
        title: 'نجاح',
        text: 'تم قبول الطلب',
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch {
      setOrders(prev);
      Swal.fire({
        title: 'فشل',
        text: 'فشل قبول الطلب',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const rejectOrder = async (orderId) => {
    const { isConfirmed } = await Swal.fire({
      title: 'رفض الطلب؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'رفض',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;

    const prev = [...orders];
    setOrders(prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));

    try {
      await api.post(`/api/shops/orders/control/${orderId}/reject`);
      Swal.fire({
        title: 'نجاح',
        text: 'تم رفض الطلب',
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch {
      setOrders(prev);
      Swal.fire({
        title: 'فشل',
        text: 'فشل في رفض الطلب',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const openStatusUpdateModal = (order) => {
    setStatusModalOrder(order);
    setSelectedNewStatus('');
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedNewStatus) return;
    const prev = [...orders];
    setOrders(prev.map(o => o.id === statusModalOrder.id ? { ...o, status: selectedNewStatus } : o));

    try {
      await api.put(`/api/shops/orders/control/${statusModalOrder.id}/status`, { status: selectedNewStatus });
      Swal.fire({
        title: 'تم!',
        text: `تم تحديث الحالة إلى ${statusTranslations[selectedNewStatus]}`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      setShowStatusModal(false);
    } catch {
      setOrders(prev);
      Swal.fire({
        title: 'خطأ',
        text: 'فشل تحديث الحالة',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(o =>
      o.id.toString().includes(term) ||
      (o.userId || '').toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const pageOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  return (
    <div style={{ marginTop: "-540px", marginLeft: "-250px" }} className="min-h-screen bg-gray-50 font-cairo py-8">
      
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${darkMode ? '#34d399' : '#10b981'};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${darkMode ? '#6ee7b7' : '#059669'};
          }
        `}
      </style>
      
      
      <div className="max-w-5xl mx-auto px-6">

        <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between text-right gap-5">
            <div className="p-5 bg-lime-100 rounded-2xl">
              <RiShoppingBag3Line className="text-4xl text-lime-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">الطلبات</h1>
              <p className="text-lg text-gray-600 mt-2">إدارة ومتابعة جميع طلبات العملاء بسهولة وسرعة</p>
            </div>
          </div>

       
        </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 mb-6">
  
  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
        <FiPackage className="w-8 h-8 text-gray-600" />
      </div>
    </div>
  </div>

 
  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">معلقة</p>
        <p className="text-3xl font-bold text-blue-700 mt-2">{stats.pending}</p>
      </div>
      <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
        <FiClock className="w-8 h-8 text-blue-600" />
      </div>
    </div>
  </div>


  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">مؤكدة</p>
        <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.confirmed}</p>
      </div>
      <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
        <FiCheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
    </div>
  </div>

 
  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">تم التسليم</p>
        <p className="text-3xl font-bold text-green-700 mt-2">{stats.delivered}</p>
      </div>
      <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
        <FiCheckCircle className="w-8 h-8 text-green-600" />
      </div>
    </div>
  </div>
</div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input
                type="text"
                placeholder="ابحث برقم الطلب أو معرف العميل"
                className="w-full pr-12 py-3.5 pl-4 rounded-xl placeholder:text-right border border-gray-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-base transition bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setOpenFilterDropdown(prev => !prev)}
                className="px-8 py-3.5 bg-gray-50 border text-gray-600 rounded-xl flex items-center justify-between gap-4 min-w-48 font-medium shadow transition"
              >
                <span>{statusTranslations[statusFilter]}</span>
                <FiChevronDown className={`text-xl transition ${openFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              {openFilterDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-xl shadow-xl z-30 overflow-hidden">
                  {['all', ...statuses].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setOpenFilterDropdown(false);
                        setCurrentPage(1);
                      }}
                      className="w-full text-right px-6 py-3 hover:bg-lime-50 transition text-base"
                    >
                      {statusTranslations[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 border-6 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-6 text-lg text-gray-600">جاري تحميل الطلبات...</p>
            </div>
          ) : pageOrders.length === 0 ? (
            <div className="p-20 text-center text-gray-500">
              <RiShoppingBag3Line className="w-16 h-16 mx-auto opacity-30 mb-4" />
              <p className="text-xl">لا توجد طلبات حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gray-100 border text-gray-600">
                  <tr>
                    {/* <th className="px-5 py-4 text-base font-bold text-right">#</th> */}
                    <th className="px-5 py-4 text-base font-bold">المنتجات</th>
                    <th className="px-5 py-4 text-base font-bold">الكمية</th>
                    <th className="px-5 py-4 text-base font-bold">المجموع</th>
                    <th className="px-5 py-4 text-base font-bold">الدفع</th>
                    <th className="px-5 py-4 text-base font-bold">التاريخ</th>
                    <th className="px-5 py-4 text-base font-bold">الحالة</th>
                    <th className="px-5 py-4 text-base font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageOrders.map((o, i) => {
                    const globalIdx = (currentPage - 1) * ordersPerPage + i + 1;
                    const totalQty = o.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                    const productNames = o.orderItems?.map(item => item.productName).join(', ') || '—';

                    return (
                      <tr key={o.id} className="hover:bg-gray-50 transition">
                        {/* <td className="px-5 py-4 text-sm font-medium text-gray-800">{globalIdx}</td> */}
                        <td className="px-5 py-4 text-sm text-gray-700 text-right max-w-xs truncate">{productNames}</td>
                        <td className="px-5 py-4 text-center">{totalQty}</td>
                        <td className="px-5 py-4 text-center font-bold">{o.totalPrice} ج.م</td>
                        <td className="px-5 py-4 text-center text-sm">{o.paymentMethod || '—'}</td>
                        <td className="px-5 py-4 text-center text-sm">{new Date(o.createdAt).toLocaleDateString('ar-EG')}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => openStatusUpdateModal(o)}
                            className={`px-4 py-2 rounded-full text-xs font-bold ${getStatusColor(o.status)} hover:shadow transition`}
                          >
                            {statusTranslations[o.status]}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => openDetailsModal(o)} className="px-3 font-sans py-2 flex gap-2 bg-orange-50 text-orange-500 border border-orange-100 rounded-3xl text-sm font-bold transition">
                              <FiInfo className="w-4 h-4 inline ml-1" /> تفاصيل
                            </button>
                            {o.status === 'PENDING' && (
                              <>
                                <button onClick={() => acceptOrder(o.id)} className="px-3 font-sans py-2 flex gap-2 bg-green-50 text-green-500 border border-green-100 rounded-3xl text-sm font-bold transition">
                                  <FiCheck className="w-4 h-4 inline ml-1" /> قبول
                                </button>
                                <button onClick={() => rejectOrder(o.id)} className="px-3 font-sans py-2 flex gap-2 bg-red-50 text-red-500 border border-red-100 rounded-3xl text-sm font-bold transition">
                                  <FiXCircle className="w-4 h-4 inline ml-1" /> رفض
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
            >
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
              
            </button>

            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold text-base transition shadow-sm flex items-center justify-center ${
                    currentPage === i + 1 ? 'bg-gray-600 text-white' : 'bg-white border border-gray-600 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
            >
              
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

      {showDetailsModal && selectedOrder && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 rounded-2xl flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto ">
    
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-8 py-7 relative ">
        <button
          onClick={() => setShowDetailsModal(false)}
          className="absolute top-6 right-6 p-2.5 bg-white/20 hover:bg-white/30 rounded-full transition-all"
          aria-label="إغلاق"
        >
          <FiX className="w-6 h-6" />
        </button>

        <div className="text-center space-y-3">
          <div className="inline-block px-5 py-1.5 bg-white/95 rounded-full text-emerald-800 font-semibold text-sm shadow-sm">
            تفاصيل الطلب
          </div>
          <h2 className="text-2xl font-bold tracking-tight">#{selectedOrder.id}</h2>
          <div className="flex items-center justify-center gap-2.5 opacity-90 text-lg">
            <FiCalendar className="w-5 h-5" />
            {new Date(selectedOrder.createdAt).toLocaleString('ar-EG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </div>
        </div>
      </div>

     
      <div className="p-6 md:p-8 space-y-7 text-right">
      
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center justify-end gap-3">
            <FiUser className="w-6 h-6 text-emerald-600" />
            معلومات العميل
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <FiUser className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الاسم</p>
                <p className="font-semibold text-lg">
                  {selectedOrder.firstName} {selectedOrder.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <FiPhone className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الهاتف</p>
                <p className="font-semibold text-lg dir-ltr text-left">
                  {selectedOrder.phoneNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center justify-end gap-3">
            <FiCreditCard className="w-6 h-6 text-emerald-600" />
            ملخص الدفع
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">الإجمالي</p>
              <p className="text-2xl font-bold text-emerald-700">
                {selectedOrder.totalPrice} ج.م
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">طريقة الدفع</p>
              <p className="font-semibold text-lg">
                {selectedOrder.paymentMethod || 'غير محدد'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">حالة الطلب</p>
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
                  selectedOrder.status
                )}`}
              >
                {statusTranslations[selectedOrder.status]}
              </span>
            </div>
          </div>
        </div>

        
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center justify-between">
            <span className="flex items-center gap-3">
              <FiShoppingBag className="w-6 h-6 text-emerald-600" />
              المنتجات ({selectedOrder.orderItems?.length || 0})
            </span>
          </h3>

          <div className="space-y-4">
            {selectedOrder.orderItems?.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-gray-100 hover:border-emerald-200 transition-colors"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-3">
                      <FiPackage className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <p className="font-medium text-lg">{item.productName}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">الكمية</p>
                    <p className="font-bold text-lg">{item.quantity}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">الإجمالي</p>
                    <p className="font-bold text-lg text-emerald-700">
                      {item.subtotal} ج.م
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-500 text-center sm:text-right">
                  سعر الوحدة: {item.priceAtCheckout} ج.م
                </div>
              </div>
            ))}
          </div>
        </div>

        
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowDetailsModal(false)}
            className="px-12 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-lg rounded-xl shadow-lg transition-all flex items-center gap-2.5 hover:shadow-xl active:scale-[0.98]"
          >
            <FiCheckCircle className="w-6 h-6" />
            إغلاق
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        {showStatusModal && statusModalOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">تحديث الحالة #{statusModalOrder.id}</h3>
                <button onClick={() => setShowStatusModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition">
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-base text-gray-700 mb-3">الحالة الحالية</p>
                <span className={`inline-block px-5 py-2 rounded-full text-sm font-bold ${getStatusColor(statusModalOrder.status)}`}>
                  {statusTranslations[statusModalOrder.status]}
                </span>
              </div>

              <div>
                <p className="text-lg font-bold text-center mb-6">اختر الحالة الجديدة</p>
                <div className="grid grid-cols-1 gap-4">
                  {nextStatuses[statusModalOrder.status]?.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedNewStatus(status)}
                      className={`p-4 rounded-2xl border-4 transition-all ${
                        selectedNewStatus === status
                          ? 'border-lime-600 bg-lime-50'
                          : 'border-gray-300 hover:border-lime-400 hover:bg-lime-50'
                      }`}
                    >
                      <p className="text-lg font-bold">{statusTranslations[status]}</p>
                    </button>
                  ))}
                </div>
                {nextStatuses[statusModalOrder.status]?.length === 0 && (
                  <p className="text-center text-base text-gray-600 mt-6">
                    لا توجد حالات متاحة للتحديث
                  </p>
                )}
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <button onClick={() => setShowStatusModal(false)} className="px-8 py-3 border-2 border-gray-400 rounded-2xl text-base font-bold hover:bg-gray-100 transition">
                  إلغاء
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={!selectedNewStatus}
                  className="px-10 py-3 bg-lime-600 text-white rounded-2xl text-base font-bold hover:bg-lime-700 disabled:opacity-50 transition shadow-lg"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;