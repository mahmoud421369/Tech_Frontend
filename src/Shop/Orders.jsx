import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FiChevronDown, FiSearch, FiInfo, FiCheckSquare, FiXCircle,
  FiChevronLeft, FiChevronRight, FiX, FiPackage, FiClock,
  FiTruck, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { RiShoppingBag3Line } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';

const Orders = () => {
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
      toast.success('تم قبول الطلب');
    } catch {
      setOrders(prev);
      toast.error('فشل قبول الطلب');
    }
  };

  const rejectOrder = async (orderId) => {
    const { isConfirmed } = await Swal.fire({
      title: 'رفض الطلب؟', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'رفض', cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;

    const prev = [...orders];
    setOrders(prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));

    try {
      await api.post(`/api/shops/orders/control/${orderId}/reject`);
      toast.success('تم رفض الطلب');
    } catch {
      setOrders(prev);
      toast.error('فشل رفض الطلب');
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
      toast.success(`تم تحديث الحالة إلى ${statusTranslations[selectedNewStatus]}`);
      setShowStatusModal(false);
    } catch {
      setOrders(prev);
      toast.error('فشل تحديث الحالة');
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
    <div style={{marginTop:"-575px",marginLeft:"-250px"}} className="min-h-screen bg-gray-50 font-cairo py-8">
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

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">إجمالي الطلبات</p>
                <p className="text-4xl font-bold mt-3">{stats.total}</p>
              </div>
              <FiPackage className="text-6xl opacity-40" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">معلقة</p>
                <p className="text-4xl font-bold mt-3 text-blue-600">{stats.pending}</p>
              </div>
              <FiClock className="text-6xl opacity-40 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">مؤكدة</p>
                <p className="text-4xl font-bold mt-3 text-lime-600">{stats.confirmed}</p>
              </div>
              <FiCheckCircle className="text-6xl opacity-40 text-lime-600" />
            </div>
          </div>

          {/* <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">قيد المعالجة</p>
                <p className="text-4xl font-bold mt-3 text-yellow-600">{stats.processing}</p>
              </div>
              <FiTruck className="text-6xl opacity-40 text-yellow-600" />
            </div>
          </div> */}

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">تم التسليم</p>
                <p className="text-4xl font-bold mt-3 text-green-600">{stats.delivered}</p>
              </div>
              <FiCheckCircle className="text-6xl opacity-40 text-green-600" />
            </div>
          </div>
        </div>

       
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input
                type="text"
                placeholder="ابحث برقم الطلب أو معرف العميل..."
                className="w-full pr-12 py-3.5 pl-4 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-base transition bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setOpenFilterDropdown(prev => !prev)}
                className="px-8 py-3.5 bg-gray-50 border   text-gray-600 rounded-xl flex items-center justify-between gap-4 min-w-48 font-medium shadow transition"
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

       
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-5 py-4 text-base font-bold text-right">#</th>
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
                    const productNames = o.orderItems?.map(item => item.productName).join('، ') || '—';

                    return (
                      <tr key={o.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4 text-sm font-medium text-gray-800">{globalIdx}</td>
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
                            <button onClick={() => openDetailsModal(o)} className="px-3 py-2 flex justify-center items-center gap-2 bg-transparent text-amber-500 border border-amber-500 rounded-3xl  text-xs font-medium transition">
                              <FiInfo className="w-4 h-4 inline ml-1" /> تفاصيل
                            </button>
                            {o.status === 'PENDING' && (
                              <>
                                <button onClick={() => acceptOrder(o.id)} className="px-3 py-2 flex gap-2 bg-transparent text-lime-500 border border-lime-500 rounded-3xl text-xs font-medium transition">
                                  <FiCheckSquare className="w-4 h-4 inline ml-1" /> قبول
                                </button>
                                <button onClick={() => rejectOrder(o.id)} className="px-3 py-2 flex gap-2 bg-transparent text-red-500 border border-red-500 rounded-3xl text-xs font-medium transition">
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

        
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900">تفاصيل الطلب #{selectedOrder.id}</h3>
                <button onClick={() => setShowDetailsModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition">
                  <FiX className="w-8 h-8" />
                </button>
              </div>
              <div className="space-y-6 text-right">
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div><strong>العميل:</strong> {selectedOrder.firstName} {selectedOrder.lastName}</div>
                  <div><strong>الهاتف:</strong> {selectedOrder.phoneNumber}</div>
                  <div><strong>الإجمالي:</strong> <span className="font-bold text-2xl text-lime-600">{selectedOrder.totalPrice} ج.م</span></div>
                  <div><strong>طريقة الدفع:</strong> {selectedOrder.paymentMethod || '—'}</div>
                  <div><strong>التاريخ:</strong> {new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}</div>
                  <div><strong>الحالة:</strong> <span className={`px-4 py-2 rounded-full font-bold ${getStatusColor(selectedOrder.status)}`}>{statusTranslations[selectedOrder.status]}</span></div>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-4">المنتجات</h4>
                  <div className="space-y-3">
                    {selectedOrder.orderItems?.map((item, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between"><strong>المنتج:</strong> {item.productName}</div>
                        <div className="flex justify-between"><strong>الكمية:</strong> {item.quantity}</div>
                        <div className="flex justify-between"><strong>السعر:</strong> {item.priceAtCheckout} ج.م</div>
                        <div className="flex justify-between font-bold"><strong>الإجمالي:</strong> {item.subtotal} ج.م</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showStatusModal && statusModalOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-bold text-gray-900">تحديث حالة الطلب #{statusModalOrder.id}</h3>
                <button onClick={() => setShowStatusModal(false)} className="p-4 hover:bg-gray-100 rounded-full transition">
                  <FiX className="w-8 h-8" />
                </button>
              </div>

              <div className="text-center mb-12">
                <p className="text-xl text-gray-700 mb-6">الحالة الحالية</p>
                <span className={`inline-block px-8 py-4 rounded-2xl text-2xl font-bold ${getStatusColor(statusModalOrder.status)}`}>
                  {statusTranslations[statusModalOrder.status]}
                </span>
              </div>

              <div>
                <p className="text-2xl font-bold text-center mb-10">اختر الحالة الجديدة</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {nextStatuses[statusModalOrder.status]?.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedNewStatus(status)}
                      className={`p-10 rounded-3xl border-4 transition-all shadow-lg ${
                        selectedNewStatus === status
                          ? 'border-lime-600 bg-lime-50 scale-105'
                          : 'border-gray-300 hover:border-lime-400 hover:bg-lime-50'
                      }`}
                    >
                      <p className="text-2xl font-bold mb-4">{statusTranslations[status]}</p>
                      <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${getStatusColor(status)}`}>
                        معاينة
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-8 mt-16">
                <button onClick={() => setShowStatusModal(false)} className="px-12 py-5 border-4 border-gray-400 rounded-2xl text-xl font-bold hover:bg-gray-100 transition">
                  إلغاء
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={!selectedNewStatus}
                  className="px-16 py-6 bg-lime-600 text-white rounded-2xl text-2xl font-bold hover:bg-lime-700 disabled:opacity-50 transition shadow-2xl"
                >
                  تأكيد التحديث
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