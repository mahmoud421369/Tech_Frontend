import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaFirstOrder } from 'react-icons/fa';
import {
  FiXCircle,
  FiChevronDown,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiInfo,
  FiCheckSquare,
  FiGift,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { RiCheckLine, RiClockwise2Line, RiPassPendingLine, RiShoppingBag3Line, RiShoppingBag4Line } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';

const Orders = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const ordersPerPage = 10;

  const statusTranslations = {
    PENDING: 'معلق',
    CONFIRMED: 'مؤكد',
    PROCESSING: 'قيد المعالجة',
    FINISHPROCESSING: 'تمت المعالجة',
    SHIPPED: 'تم الشحن',
    DELIVERED: 'تم التسليم',
    CANCELLED: 'ملغى',
    all: 'الكل',
  };

  const statuses = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'FINISHPROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'FINISHPROCESSING':
        return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Debounced fetchOrdersByStatus
  const debouncedFetchOrdersByStatus = useMemo(
    () =>
      debounce(async (status, search) => {
        setLoading(true);
        try {
          const url = status === 'all' ? '/api/shops/orders/control' : `/api/shops/orders/control/status/${status}`;
          const res = await api.get(url, { params: { query: search } });
          setOrders(Array.isArray(res.data) ? res.data : res.data.content || []);
        } catch (err) {
          // console.error('Error fetching orders:', err.response?.data || err.message);
          // Swal.fire('خطأ', 'فشل في جلب الطلبات', 'error');
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  // Fetch orders by status
  const fetchOrdersByStatus = useCallback(
    (status, search = '') => {
      debouncedFetchOrdersByStatus(status, search);
    },
    [debouncedFetchOrdersByStatus]
  );

  // Fetch order details
  const viewOrderDetails = useCallback(async (orderId) => {
    try {
      const res = await api.get(`/api/shops/orders/control/${orderId}`);
      const order = res.data;

      const formattedDate = new Date(order.createdAt).toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const itemsHtml = order.orderItems?.map(
        (item) => `
          <div class="p-2 border-b border-gray-200 dark:border-gray-700">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">كود المنتج</strong> ${item.productId}</p>
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">اسم المنتج</strong> ${item.productName || 'غير متوفر'}</p>
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الكمية</strong> ${item.quantity}</p>
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">المبلغ في العربة</strong> ${item.priceAtCheckout} EGP</p>
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">المبلغ الإجمالي</strong> ${item.subtotal} EGP</p>
          </div>
        `
      ).join('') || '<p class="text-gray-600 dark:text-gray-400">لا توجد عناصر</p>';

      Swal.fire({
        title: `#${order.id} - تفاصيل الطلب`,
        html: `
          <div class="text-right font-sans">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">العميل</strong> ${order.userId}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">كود التوصيل</strong> ${order.deliveryAddressId || 'غير متوفر'}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الإجمالي</strong> ${order.totalPrice} EGP</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">حالة الطلب</strong> ${statusTranslations[order.status]}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">طريقة الدفع</strong> ${order.paymentMethod || 'غير متوفر'}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">تاريخ الطلب</strong> ${formattedDate}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <hr class="my-4 border-gray-200 dark:border-gray-700"/>
            <h3 class="font-bold text-lg text-gray-900 dark:text-white">محتوى الطلب</h3>
            <div class="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-700">
              ${itemsHtml}
            </div>
          </div>
        `,
        width: 600,
        icon: 'info',
        showCloseButton: true,
        confirmButtonText: 'إغلاق',
        customClass: {
          popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '',
        },
      });
    } catch (err) {
      console.error('Error fetching order details:', err.response?.data || err.message);
      Swal.fire('خطأ', 'فشل في تحميل تفاصيل الطلب', 'error');
    }
  }, [darkMode]);

  // Accept order
  const acceptOrder = useCallback(async (orderId) => {
    const result = await Swal.fire({
      title: 'هل تريد قبول الطلب؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'قبول',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/api/shops/orders/control/${orderId}/accept`);
        Swal.fire('نجاح', 'تم قبول الطلب', 'success');
        fetchOrdersByStatus(statusFilter, searchTerm);
      } catch (err) {
        console.error('Error accepting order:', err.response?.data || err.message);
        Swal.fire('خطأ', 'فشل قبول الطلب', 'error');
      }
    }
  }, [statusFilter, searchTerm, fetchOrdersByStatus]);

  // Reject order
  const rejectOrder = useCallback(async (orderId) => {
    const result = await Swal.fire({
      title: 'هل تريد رفض الطلب؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'رفض',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/api/shops/orders/control/${orderId}/reject`);
        Swal.fire('نجاح', 'تم رفض الطلب', 'success');
        fetchOrdersByStatus(statusFilter, searchTerm);
      } catch (err) {
        console.error('Error rejecting order:', err.response?.data || err.message);
        Swal.fire('خطأ', 'فشل رفض الطلب', 'error');
      }
    }
  }, [statusFilter, searchTerm, fetchOrdersByStatus]);

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      try {
        await api.put(`/api/shops/orders/control/${orderId}/status`, { status });
        Swal.fire('نجاح', `تم تحديث حالة الطلب إلى ${statusTranslations[status]}`, 'success');
        fetchOrdersByStatus(statusFilter, searchTerm);
        setSelectedOrder(null);
      } catch (err) {
        console.error('Error updating order status:', err.response?.data || err.message);
        Swal.fire('خطأ', 'فشل تحديث حالة الطلب', 'error');
      }
    },
    [statusFilter, searchTerm, fetchOrdersByStatus]
  );

  // Fetch orders when statusFilter or searchTerm changes
  useEffect(() => {
    fetchOrdersByStatus(statusFilter, searchTerm);
  }, [statusFilter, searchTerm, fetchOrdersByStatus]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedFetchOrdersByStatus.cancel();
    };
  }, [debouncedFetchOrdersByStatus]);

  // Filter orders
  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toString().includes(searchTerm)
      ),
    [orders, searchTerm]
  );

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const changePage = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  return (
    <div style={{ marginTop: "-600px", marginLeft: "250px" }} className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 lg:p-8 font-cairo">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-right bg-white p-4 rounded-xl dark:bg-gray-950">
          <h1 className="text-4xl font-bold text-indigo-600 mb-4 dark:text-white flex items-center justify-end gap-3">
            <RiShoppingBag3Line className="text-indigo-600 dark:text-indigo-400" /> الطلبات
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-right">إدارة ومتابعة الطلبات بسهولة</p>
        </div>

       
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-indigo-600 dark:text-indigo-400">
              إجمالي الطلبات <RiShoppingBag4Line className="text-xl group-hover:scale-110 transition-transform duration-300" />
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">{orders.length}</p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-yellow-600 dark:border-yellow-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-yellow-600 dark:text-yellow-400">
              طلبات معلقة <RiClockwise2Line className="text-xl group-hover:scale-110 transition-transform duration-300" />
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
              {orders.filter((o) => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-green-600 dark:border-green-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-green-600 dark:text-green-400">
              طلبات مكتملة <RiCheckLine className="text-xl group-hover:scale-110 transition-transform duration-300" />
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
              {orders.filter((o) => o.status === 'DELIVERED').length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="ابحث في الطلبات..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 shadow-sm hover:shadow-lg text-sm text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-56">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 shadow-sm hover:shadow-lg text-sm"
            >
              <span>{statusTranslations[statusFilter]}</span>
              <FiChevronDown className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {['all', ...statuses].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm"
                  >
                    {statusTranslations[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="max-w-7xl mx-auto">
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
                        <th className="px-6 py-4 font-semibold text-right">رقم الطلب</th>
                        <th className="px-6 py-4 font-semibold text-center">المنتج</th>
                        <th className="px-6 py-4 font-semibold text-right">الكمية</th>
                        <th className="px-6 py-4 font-semibold text-right">المجموع</th>
                        <th className="px-6 py-4 font-semibold text-right">الحالة</th>
                        <th className="px-6 py-4 font-semibold text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-200 text-center">
                      {currentOrders.map((order, i) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          <td className="px-6 py-4">{indexOfFirstOrder + i + 1}</td>
                          <td className="px-6 py-4">
                            {order.orderItems?.map((o) => o.productNAme || 'غير متوفر').join(', ')}
                          </td>
                          <td className="px-6 py-4">
                            {order.orderItems?.reduce((sum, o) => sum + o.quantity, 0) || 0}
                          </td>
                          <td className="px-6 py-4 font-medium">{order.totalPrice} EGP</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {statusTranslations[order.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <div className="relative w-40">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-sm text-right appearance-none"
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s}>
                                    {statusTranslations[s]}
                                  </option>
                                ))}
                              </select>
                              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none" />
                            </div>
                            <button
                              onClick={() => viewOrderDetails(order.id)}
                              className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                              title="عرض التفاصيل"
                            >
                              <FiInfo />
                            </button>
                            {order.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => acceptOrder(order.id)}
                                  className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200"
                                  title="قبول الطلب"
                                >
                                  <FiCheckSquare />
                                </button>
                                <button
                                  onClick={() => rejectOrder(order.id)}
                                  className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                                  title="رفض الطلب"
                                >
                                  <FiXCircle />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {currentOrders.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-gray-900">
                    <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {orders.length === 0 ? 'لا توجد طلبات' : 'لم يتم العثور على طلبات'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'حاول تعديل مصطلحات البحث' : 'جميع الطلبات تمت معالجتها أو لا توجد طلبات معلقة'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => changePage(currentPage - 1)}
                className="px-4 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
              >
                <FiChevronRight />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => changePage(i + 1)}
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
                onClick={() => changePage(currentPage + 1)}
                className="px-4 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages}
              >
                <FiChevronLeft />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;