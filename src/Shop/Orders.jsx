import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FiChevronDown,
  FiSearch,
  FiInfo,
  FiCheckSquare,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiArrowUp,
  FiArrowDown,
  FiX,
} from 'react-icons/fi';
import { RiShoppingBag3Line, RiShoppingBag4Line, RiClockwise2Line, RiCheckLine } from 'react-icons/ri';
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
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');

  const filterDropdownRef = useRef(null);

  const ordersPerPage = 10;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setOpenFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Status translations
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

  const statuses = Object.keys(statusTranslations).filter((s) => s !== 'all');

  // Next valid statuses
  const nextStatuses = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING'],
    PROCESSING: ['FINISHPROCESSING'],
    FINISHPROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  // Status badge color
  const getStatusColor = (status) => {
    const map = {
      PENDING: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-lime-100 text-lime-700',
      PROCESSING: 'bg-yellow-100 text-yellow-700',
      FINISHPROCESSING: 'bg-amber-100 text-amber-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-600',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  // Row background color
  const getRowBgColor = (status) => {
    const map = {
      PENDING: 'hover:bg-blue-50',
      CONFIRMED: 'hover:bg-lime-50',
      PROCESSING: 'hover:bg-yellow-50',
      FINISHPROCESSING: 'hover:bg-amber-50',
      SHIPPED: 'hover:bg-purple-50',
      DELIVERED: 'hover:bg-green-50',
      CANCELLED: 'hover:bg-red-50',
    };
    return map[status] || 'hover:bg-gray-50';
  };

  // Fetch orders
  const debouncedFetch = useMemo(
    () =>
      debounce((status, search) => {
        setLoading(true);
        const endpoint = status === 'all'
          ? '/api/shops/orders/control'
          : `/api/shops/orders/control/status/${status}`;

        api
          .get(endpoint, { params: { query: search } })
          .then((res) => {
            const data = Array.isArray(res.data) ? res.data : res.data.content || [];
            setOrders(data);
          })
          .catch((err) => {
            console.error(err);
            toast.error('فشل تحميل الطلبات');
          })
          .finally(() => setLoading(false));
      }, 300),
    []
  );

  const fetchOrders = useCallback(
    (status, search = '') => {
      debouncedFetch(status, search);
    },
    [debouncedFetch]
  );

  useEffect(() => {
    fetchOrders(statusFilter, searchTerm);
  }, [statusFilter, searchTerm, fetchOrders]);

  useEffect(() => {
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  // Accept Order
  const acceptOrder = async (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'PENDING') return;

    const confirm = await Swal.fire({
      title: 'قبول الطلب؟',
      text: 'سيتم خصم الكميات من المخزون تلقائيًا',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'قبول',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#84cc16',
    });

    if (!confirm.isConfirmed) return;

    const prevOrders = [...orders];
    const updated = [...orders];
    const idx = updated.findIndex((o) => o.id === orderId);
    updated[idx] = { ...updated[idx], status: 'CONFIRMED' };
    setOrders(updated);

    try {
      await api.post(`/api/shops/orders/control/${orderId}/accept`);
      toast.success('تم قبول الطلب');
      fetchOrders(statusFilter, searchTerm);
    } catch {
      setOrders(prevOrders);
      toast.error('فشل قبول الطلب');
    }
  };

  // Reject Order
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
    const idx = orders.findIndex((o) => o.id === orderId);
    const updated = [...orders];
    updated[idx] = { ...updated[idx], status: 'CANCELLED' };
    setOrders(updated);

    try {
      await api.post(`/api/shops/orders/control/${orderId}/reject`);
      toast.success('تم رفض الطلب');
      fetchOrders(statusFilter, searchTerm);
    } catch {
      setOrders(prev);
      toast.error('فشل رفض الطلب');
    }
  };

  // Open Status Update Modal
  const openStatusUpdateModal = (order) => {
    setStatusModalOrder(order);
    setSelectedNewStatus('');
    setShowStatusModal(true);
  };

  // Confirm Status Update
  const confirmStatusUpdate = async () => {
    if (!statusModalOrder || !selectedNewStatus) return;

    const prev = [...orders];
    const idx = orders.findIndex((o) => o.id === statusModalOrder.id);
    const updated = [...orders];
    updated[idx] = { ...updated[idx], status: selectedNewStatus };
    setOrders(updated);

    try {
      await api.put(`/api/shops/orders/control/${statusModalOrder.id}/status`, { status: selectedNewStatus });
      toast.success(` تحديث الحالة إلى ${statusTranslations[selectedNewStatus]}`);
      setShowStatusModal(false);
      fetchOrders(statusFilter, searchTerm);
    } catch {
      setOrders(prev);
      toast.error('فشل تحديث الحالة');
    }
  };

  // Open Details Modal
  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Sorting & Filtering
  const sortedOrders = useMemo(() => {
    const list = [...orders];
    list.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (sortKey === 'totalPrice') {
        aVal = aVal ?? 0;
        bVal = bVal ?? 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [orders, sortKey, sortDir]);

  const filteredOrders = useMemo(() => {
    return sortedOrders.filter(
      (o) =>
        o.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toString().includes(searchTerm)
    );
  }, [sortedOrders, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const pageOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <>
      <div style={{ marginTop: '-575px', marginLeft: '-25px' }} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-white">
        {/* Header */}
        <div className="mb-8 text-right bg-white p-6 shadow-sm border-l-4 border-lime-500">
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center justify-end gap-3">
            <RiShoppingBag3Line className="text-gray-500" /> الطلبات
          </h1>
          <p className="text-sm text-gray-600">إدارة ومتابعة الطلبات بسهولة</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-5 bg-white shadow-md hover:shadow-xl transition-all border-l-4 border-lime-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-2 text-lime-700">
              إجمالي الطلبات <RiShoppingBag4Line className="group-hover:scale-110 transition-transform" />
            </h3>
            <p className="text-3xl font-bold text-black mt-2 text-right">{orders.length}</p>
          </div>

          <div className="p-5 bg-white shadow-md hover:shadow-xl transition-all border-l-4 border-yellow-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-2 text-yellow-700">
              معلقة <RiClockwise2Line className="group-hover:scale-110 transition-transform" />
            </h3>
            <p className="text-3xl font-bold text-black mt-2 text-right">
              {orders.filter((o) => o.status === 'PENDING').length}
            </p>
          </div>

          <div className="p-5 bg-white shadow-md hover:shadow-xl transition-all border-l-4 border-green-500 group">
            <h3 className="text-lg font-semibold flex justify-end items-center gap-2 text-green-700">
              مكتملة <RiCheckLine className="group-hover:scale-110 transition-transform" />
            </h3>
            <p className="text-3xl font-bold text-black mt-2 text-right">
              {orders.filter((o) => o.status === 'DELIVERED').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between flex-row-reverse items-center gap-4 mb-6 bg-white rounded-xl shadow-sm p-5 border ">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث في الطلبات..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border  bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-56" ref={filterDropdownRef}>
            <button
              onClick={() => setOpenFilterDropdown(!openFilterDropdown)}
              className="w-full px-4 py-3 bg-gray-50 border  rounded-lg flex justify-between items-center text-right text-black text-sm font-medium focus:ring-2 focus:ring-lime-400 focus:border-lime-500"
            >
              <span>{statusTranslations[statusFilter]}</span>
              <FiChevronDown className={`transition-transform ${openFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
            {openFilterDropdown && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-lime-200 rounded-lg shadow-xl">
                {['all', ...statuses].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setOpenFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm font-medium text-black"
                  >
                    {statusTranslations[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border  overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-lime-400 scrollbar-track-lime-50">
              <table className="w-full text-sm text-center">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th onClick={() => toggleSort('id')} className="px-4 py-3 font-bold cursor-pointer hover:bg-lime-100 transition">
                      <div className="flex items-center justify-end gap-1 text-gray-700">
                        #
                        {sortKey === 'id' && (sortDir === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-gray-700">المنتجات</th>
                    <th className="px-4 py-3 text-gray-700">الكمية</th>
                    <th onClick={() => toggleSort('totalPrice')} className="px-4 py-3 font-bold cursor-pointer hover:bg-lime-100 transition">
                      <div className="flex items-center justify-end gap-1 text-gray-700">
                        المجموع
                        {sortKey === 'totalPrice' && (sortDir === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-gray-700">طريقة الدفع</th>
                    <th className="px-4 py-3 text-gray-700">تاريخ الطلب</th>
                    <th className="px-4 py-3 text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-100">
                  {pageOrders.length > 0 ? (
                    pageOrders.map((o, i) => {
                      const globalIdx = (currentPage - 1) * ordersPerPage + i + 1;
                      const totalQty = o.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                      const productNames = o.orderItems?.map((item) => item.productName || 'غير معروف').join('، ') || '—';

                      return (
                        <tr key={o.id} className={`transition ${getRowBgColor(o.status)}`}>
                          <td className="px-4 py-4 font-medium text-black">{globalIdx}</td>
                          <td className="px-4 py-4 text-xs max-w-xs truncate text-right">{productNames}</td>
                          <td className="px-4 py-4 text-center">{totalQty}</td>
                          <td className="px-4 py-4 text-center font-bold text-black">{o.totalPrice} ج.م</td>
                          <td className="px-4 py-4 text-xs">{o.paymentMethod || '—'}</td>
                          <td className="px-4 py-4 text-xs">{new Date(o.createdAt).toLocaleDateString('ar-EG')}</td>

                          {/* Status Badge → Opens Modal */}
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => openStatusUpdateModal(o)}
                              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition hover:shadow-md ${getStatusColor(o.status)}`}
                            >
                              {statusTranslations[o.status]}
                              {nextStatuses[o.status]?.length > 0 && (
                                <FiChevronDown className="inline w-3 h-3 ml-1" />
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openDetailsModal(o)}
                                className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all text-xs"
                              >
                                <FiInfo className="w-4 h-4" /> تفاصيل
                              </button>

                              {o.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => acceptOrder(o.id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-xs"
                                  >
                                    <FiCheckSquare className="w-4 h-4" /> قبول
                                  </button>
                                  <button
                                    onClick={() => rejectOrder(o.id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-xs"
                                  >
                                    <FiXCircle className="w-4 h-4" /> رفض
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-16">
                        <div className="text-lime-400 mb-4">
                          <RiShoppingBag3Line className="w-20 h-20 mx-auto opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">
                          {orders.length === 0 ? 'لا توجد طلبات' : 'لا توجد نتائج'}
                        </h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'جرب تعديل البحث' : 'جميع الطلبات تمت معالجتها'}
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
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
            >
              <FiChevronRight />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => changePage(i + 1)}
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
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
            >
              <FiChevronLeft />
            </button>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && statusModalOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md font-cairo text-right">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">تحديث حالة الطلب #{statusModalOrder.id}</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">الحالة الحالية:</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(statusModalOrder.status)}`}>
                  {statusTranslations[statusModalOrder.status]}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">اختر الحالة الجديدة:</p>
                <div className="space-y-2">
                  {nextStatuses[statusModalOrder.status]?.map((s) => (
                    <label
                      key={s}
                      className="flex items-center justify-end gap-2 cursor-pointer p-2 rounded-lg hover:bg-lime-50 transition"
                    >
                      <input
                        type="radio"
                        name="newStatus"
                        value={s}
                        checked={selectedNewStatus === s}
                        onChange={(e) => setSelectedNewStatus(e.target.value)}
                        className="w-4 h-4 text-lime-600"
                      />
                      <span className="text-sm font-medium">{statusTranslations[s]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={!selectedNewStatus}
                  className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تأكيد التغيير
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto font-cairo text-right">
              <div className="flex justify-between flex-row-reverse items-center mb-6">
                <h3 className="text-xl font-bold text-black"> # {selectedOrder.id}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between flex-row-reverse"><strong>المعرف</strong> <span>{selectedOrder.id}</span></div>
                <div className="flex justify-between flex-row-reverse"><strong>العميل</strong> <span>{selectedOrder.firstName} {selectedOrder.lastName}</span></div>
                <div className="flex justify-between flex-row-reverse"><strong>الإجمالي</strong> <span className="font-bold">{selectedOrder.totalPrice} ج.م</span></div>
                <div className="flex justify-between flex-row-reverse">
                  <strong>الحالة</strong>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                    {statusTranslations[selectedOrder.status]}
                  </span>
                </div>
                <div className="flex justify-between flex-row-reverse"><strong>طريقة الدفع</strong> <span>{selectedOrder.paymentMethod || 'غير متوفر'}</span></div>

                <div className="flex justify-between flex-row-reverse"><strong>تاريخ الإنشاء</strong> <span>{new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}</span></div>

                <hr className="my-4 border-lime-100" />
                <h4 className="font-bold text-lg text-right">العناصر</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((it, i) => (
                    <div key={i} className="border rounded-lg p-3 bg-lime-50 text-sm text-right">
                      <div className="flex justify-between flex-row-reverse"><strong>المنتج</strong> {it.productName || 'غير معروف'}</div>
                      <div className="flex justify-between flex-row-reverse"><strong>معرف المنتج</strong> {it.productId}</div>
                      <div className="flex justify-between flex-row-reverse"><strong>الكمية</strong> {it.quantity}</div>
                      <div className="flex justify-between flex-row-reverse"><strong>سعر الوحدة</strong> {it.priceAtCheckout} ج.م</div>
                      <div className="flex justify-between flex-row-reverse"><strong>الإجمالي</strong> {it.subtotal} ج.م</div>
                      <div className="flex justify-between flex-row-reverse"><strong>اسم المتجر</strong> {it.shopName || 'غير متوفر'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;