import React, { useState, useEffect } from "react";
import {
  FiXCircle,
  FiChevronDown,
  FiRefreshCw,
  FiSearch,

  FiShoppingBag,
  FiInfo,
  FiCheckSquare,
} from "react-icons/fi";
import Swal from "sweetalert2";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const ordersPerPage = 5;

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
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-indigo-100 text-indigo-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "FINISHPROCESSING":
        return "bg-yellow-200 text-yellow-900";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
      <div class="p-2 border-b font-cairo">

        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> : كود المنتج</strong> ${item.productId}</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: الكمية</strong> ${item.quantity}</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: المبلغ في العربة</strong> ${item.priceAtCheckout} EGP</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> : المبلغ الاجمالي</strong> ${item.subtotal} EGP</p>
      </div>
    `).join('') || '<p>لا توجد عناصر</p>';

    Swal.fire({
      title:`    #${order.id} - تفاصيل الطلب `,
      html: `
        <div class="text-right font-cairo">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> : العميل</strong> ${order.userId}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :كود التوصيل  </strong> ${order.deliveryAddressId || 'N/A'}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: الاجمالي</strong> ${order.totalPrice} EGP</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: حالة الطلب</strong> ${order.status}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: طريقة الدفع</strong> ${order.paymentMethod || 'N/A'}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: تأريخ الطلب</strong> ${formattedDate}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: كود الدفع</strong> ${order.paymentId || 'N/A'}</p>
          <hr class="my-4"/>
          <h3 class="font-bold text-lg">محتوي الطلب</h3><br>
          <div class="max-h-60 overflow-y-auto border rounded p-2 bg-gray-50">
            ${itemsHtml}
          </div>
        </div>
      `,
      width: 600,
      icon: 'info',
      showCloseButton: true,
      confirmButtonText: 'إغلاق'
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
          headers: {  Authorization: `Bearer ${token}` },
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
          headers: {  Authorization: `Bearer ${token}` },
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



  const filteredOrders = orders.filter(order => 
  
    order.status
  );



  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div style={{ marginLeft: "275px", marginTop: "-500px" }} className="min-h-screen bg-[#f1f5f9] p-6 font-cairo text-right">
  
      <div className="bg-white border p-4 rounded-2xl mb-4">
        <h1 className="text-3xl font-bold text-blue-500 flex justify-end items-center gap-2">طلبات المتجر  <FiShoppingBag/> </h1>
      </div>

      <div className="bg-white p-6 rounded-2xl max-w-5xl mx-auto mb-8 shadow-md flex justify-between flex-row-reverse items-center">
     
        <div className="relative w-1/3">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="...ابحث"
            className="block w-full pl-10 pr-3 py-2 rounded-lg placeholder:text-right bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-64">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-2 rounded-lg bg-[#ECF0F3] border flex justify-between items-center"
          >
            {statusFilter === "all" ? "حالة الطلب" : statusFilter.replace("_", " ")}
            <FiChevronDown />
          </button>
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-md rounded-lg border">
              {["all", ...statuses].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-right hover:bg-indigo-100 ${
                    s !== "all" ? getStatusColor(s) : ""
                  }`}
                >
                  {s === "all" ? "الكل" : s.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      
      <div className="bg-white p-6 rounded-2xl max-w-6xl mx-auto shadow-md">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FiRefreshCw className="animate-spin text-blue-500 text-2xl" />
          </div>
        ) : (
          <table className="min-w-full table-auto text-center border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-[#f1f5f9] text-blue-500">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">العميل</th>
                <th className="px-4 py-2">المجموع</th>
                <th className="px-4 py-2">الحالة</th>
                <th className="px-4 py-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-gray-50">
              {currentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition text-blue-950">
                  <td className="px-4 py-2">{order.id}</td>
                  <td className="px-4 py-2">{order.userId}</td>
                  <td className="px-4 py-2">{order.totalPrice} EGP</td>

               
                  <td className="px-4 py-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold  ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>

                 
                  <td className="px-4 py-2 flex justify-center gap-2">
                    <button
                      onClick={() => viewOrderDetails(order.id)}
                      className="bg-transparent text-amber-600 px-3 py-1 border rounded-md  transition"
                    >
                      <FiInfo />
                    </button>
                    {order.status === "PENDING" ? 
                    <button
                      onClick={() => acceptOrder(order.id)}
                      className="flex items-center bg-transparent text-blue-600 border px-3 py-1 rounded  transition"
                    >
                      <FiCheckSquare className="mr-1" /> 
                    </button>
:
                    <button
                      onClick={() => rejectOrder(order.id)}
                      className="flex items-center bg-transparent text-red-600 border px-3 py-1 rounded  transition"
                    >
                      <FiXCircle className="mr-1" /> 
                    </button>
}
                  </td>
                </tr>
              ))}
              {currentOrders.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-gray-500 text-center">
                    لا توجد طلبات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Orders;