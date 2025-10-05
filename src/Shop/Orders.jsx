import React, { useState, useEffect } from "react";
import { FaFirstOrder } from "react-icons/fa";
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
} from "react-icons/fi";
import { RiCheckLine, RiClockwise2Line, RiPassPendingLine, RiShoppingBag4Line } from "react-icons/ri";
import Swal from "sweetalert2";

const Orders = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const ordersPerPage = 10;
  const token = localStorage.getItem("authToken");

  const statuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "FINISHPROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "CONFIRMED":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "FINISHPROCESSING":
        return "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-200";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "DELIVERED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/shops/orders/control', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch all orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch all orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersByStatus = async (status) => {
    setLoading(true);
    try {
      const url = status === 'all' 
        ? 'http://localhost:8080/api/shops/orders/control' 
        : `http://localhost:8080/api/shops/orders/control/status/${status}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.content || []);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/shops/orders/control/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch order details');
      const order = await res.json();

      const formattedDate = new Date(order.createdAt).toLocaleString("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      const itemsHtml = order.orderItems?.map(item => `
        <div class="p-2 border-b border-gray-200 dark:border-gray-700">
          <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">كود المنتج</strong> ${item.productId}</p>
          <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الكمية</strong> ${item.quantity}</p>
          <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">المبلغ في العربة</strong> ${item.priceAtCheckout} EGP</p>
          <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">المبلغ الإجمالي</strong> ${item.subtotal} EGP</p>
        </div>
      `).join('') || '<p class="text-gray-600 dark:text-gray-400">لا توجد عناصر</p>';

      Swal.fire({
        title: `#${order.id} - تفاصيل الطلب `,
        html: `
          <div class="text-right font-cairo">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">العميل</strong> ${order.userId}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">كود التوصيل</strong> ${order.deliveryAddressId || 'N/A'}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الإجمالي</strong> ${order.totalPrice} EGP</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">حالة الطلب</strong> ${order.status}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">طريقة الدفع</strong> ${order.paymentMethod || 'N/A'}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
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
      console.error(err);
      Swal.fire('Error', 'فشل في تحميل تفاصيل الطلب', 'error');
    }
  };

  const acceptOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'هل تريد قبول الطلب؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'قبول',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:8080/api/shops/orders/control/${orderId}/accept`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to accept order');
        Swal.fire('تم القبول', 'تم قبول الطلب', 'success');
        fetchOrdersByStatus(statusFilter);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'فشل قبول الطلب', 'error');
      }
    }
  };

  const rejectOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'هل تريد رفض الطلب؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'رفض',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:8080/api/shops/orders/control/${orderId}/reject`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to reject order');
        Swal.fire('تم الرفض', 'تم رفض الطلب', 'success');
        fetchOrdersByStatus(statusFilter);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'فشل رفض الطلب', 'error');
      }
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`http://localhost:8080/api/shops/orders/control/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      Swal.fire('تم التحديث',` تم تحديث حالة الطلب إلى ${status}`, 'success');
      fetchOrdersByStatus(statusFilter);
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'فشل تحديث حالة الطلب', 'error');
    }
  };

  useEffect(() => { fetchOrdersByStatus(statusFilter); }, [statusFilter]);

  const filteredOrders = orders.filter(
    (order) =>
      order.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm)
  );

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div style={{marginTop:"-600px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-indigo-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-indigo-600 dark:text-indigo-400">
            إجمالي الطلبات <RiShoppingBag4Line className="text-xl" />
          </h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">{orders.length}</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-yellow-600 dark:text-yellow-400">
            طلبات معلقة <RiClockwise2Line className="text-xl" />
          </h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
            {orders.filter((o) => o.status === "PENDING").length}
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-green-600 dark:text-green-400">
            طلبات مكتملة <RiCheckLine className="text-xl" />
          </h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
            {orders.filter((o) => o.status === "DELIVERED").length}
          </p>
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between flex-row-reverse flex-wrap gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">الطلبات</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="... ابحث  في الطلبات"
                className="w-full pl-10 pr-4 placeholder:text-right py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-56">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300"
              >
                <span>{statusFilter === "all" ? "حالة الطلب" : statusFilter.replace("_", " ")}</span>
                <FiChevronDown className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {["all", ...statuses].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      {s === "all" ? "الكل" : s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

     
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-center text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">العميل</th>
                      <th className="px-4 py-3 font-semibold">المجموع</th>
                      <th className="px-4 py-3 font-semibold">الحالة</th>
                      <th className="px-4 py-3 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {currentOrders.map((order, i) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <td className="px-4 py-3">{indexOfFirstOrder + i + 1}</td>
                        <td className="px-4 py-3">{order.userId}</td>
                        <td className="px-4 py-3 font-medium">{order.totalPrice} EGP</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex justify-center gap-2">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all duration-300"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => viewOrderDetails(order.id)}
                            className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                          >
                            <FiInfo />
                          </button>
                          {order.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => acceptOrder(order.id)}
                                className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200"
                              >
                                <FiCheckSquare />
                              </button>
                              <button
                                onClick={() => rejectOrder(order.id)}
                                className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
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
                <div className="p-8 text-center bg-white dark:bg-gray-800">
                  <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    {orders.length === 0 ? "لا توجد طلبات" : "لم يتم العثور على طلبات"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? "حاول تعديل مصطلحات البحث" : "جميع الطلبات تمت معالجتها أو لا توجد طلبات معلقة"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

       
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => changePage(currentPage - 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => changePage(currentPage + 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
            >
              <FiChevronLeft />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;