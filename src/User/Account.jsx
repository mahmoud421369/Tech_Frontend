import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SockJS from "sockjs-client";
import {Stomp}  from "@stomp/stompjs";
import {
  FiUser,
  FiMapPin,
  FiBox,
  FiTool,
  FiBell,
  FiEdit2,
  FiTrash2,
  FiX,
  FiMail,
  FiPhone,
  FiPlus,
  FiXCircle,
  FiInfo,
  FiHash,
  FiCheckCircle,
  FiSmartphone,
  FiAlertTriangle,
  FiCalendar,
  FiFileText,
  FiTruck,
  FiHome,
  FiEdit3,
  FiChevronLeft,
  FiChevronRight,
  FiWifiOff,
  FiWifi,
} from "react-icons/fi";
import { RiStore2Line } from "@remixicon/react";

const Account = ({ userId, darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const [activeSection, setActiveSection] = useState("profile");
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const stompClientRef = useRef(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [addressForm, setAddressForm] = useState({
    state: "",
    city: "",
    street: "",
    building: "",
    notes: "",
    isDefault: false,
  });


  const [ordersPage, setOrdersPage] = useState(1);
  const [repairsPage, setRepairsPage] = useState(1);
  const itemsPerPage = 3;

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUserProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/users/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAddresses(data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/users/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRepairRequests = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/users/repair-request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRepairRequests(data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewRepairRequest = async (repairId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/repair-request/${repairId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch repair details");
      const repair = await res.json();

      const statusLabels = {
        SUBMITTED: "تم الإرسال",
        QUOTE_PENDING: "بانتظار عرض السعر",
        QUOTE_SENT: "تم إرسال العرض",
        QUOTE_APPROVED: "تمت الموافقة",
        QUOTE_REJECTED: "تم الرفض",
        DEVICE_COLLECTED: "تم الاستلام",
        REPAIRING: "قيد الإصلاح",
        REPAIR_COMPLETED: "تم الإصلاح",
        DEVICE_DELIVERED: "تم التسليم",
        CANCELLED: "أُلغيت",
        FAILED: "فشلت",
      };

      const deliveryMethodLabels = {
        HOME_DELIVERY: "توصيل للمنزل",
        PICKUP: "استلام من المتجر",
      };

      const paymentMethodLabels = {
        CASH: "نقدًا",
        CARD: "بطاقة",
        WALLET: "محفظة إلكترونية",
      };

      Swal.fire({
        title: ` تفاصيل الطلب - ${repair.id}`,
        html: `
          <div style="text-align:right; line-height:1.8;">
            <p class="flex justify-between items-center flex-row-reverse"><strong>المستخدم</strong> ${repair.userId}</p>
            <p class="flex justify-between items-center flex-row-reverse"><strong>المتجر</strong> ${repair.shopId}</p>
            <p class="flex justify-between items-center flex-row-reverse"><strong>العنوان</strong> ${repair.deliveryAddress}</p>
            <p class="flex justify-between items-center flex-row-reverse"><strong>الوصف</strong> ${repair.description || "لا يوجد"}</p>
            <p class="flex justify-between items-center flex-row-reverse"><strong>الفئة</strong> ${repair.deviceCategory}</p>
            <p class="flex justify-between items-center flex-row-reverse"><strong>طريقة التوصيل</strong> ${deliveryMethodLabels[repair.deliveryMethod] || repair.deliveryMethod}</p>
            <p class="flex justify-between items-center flex-row-reverse"><strong>طريقة الدفع</strong> ${paymentMethodLabels[repair.paymentMethod] || repair.paymentMethod}</p>
            <p class="flex justify-between items-center flex-row-reverse"><strong>مؤكد</strong> ${repair.confirmed ? "نعم" : "لا"}</p>
            <p class="flex justify-between items-center flex-row-reverse"><strong>الحالة</strong> ${statusLabels[repair.status] || repair.status}</p>
          </div>
        `,
        icon: "info",
        showCloseButton: true,
        confirmButtonText: "إغلاق",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelRepairRequest = async (requestId) => {
    const confirm = await Swal.fire({
      title: "Cancel Repair Request?",
      text: "Are you sure you want to cancel this repair request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:8080/api/users/repair-request/${requestId}/cancel`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to cancel repair request");
      fetchRepairRequests();
      Swal.fire("Cancelled", "Repair request cancelled successfully", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to cancel repair request", "error");
    }
  };

  const updateRepairRequest = async (shopId, requestId, updatedData) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/repair-request/${shopId}/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );
      console.log(updatedData);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update repair request");
      }

      Swal.fire("Success", "Repair request updated!", "success");
      fetchRepairRequests();
    } catch (err) {
      console.error("Update repair request error:", err);
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleEditRepairRequest = async (request) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Repair Request",
      html: `
        <input id="deliveryAddress" class="swal2-input" placeholder="Delivery Address" value="${request.deliveryAddress}">
        <input id="description" class="swal2-input" placeholder="Description" value="${request.description}">
        <input id="deliveryMethod" class="swal2-input" placeholder="Delivery Method" value="${request.deliveryMethod}">
        <input id="deviceCategory" class="swal2-input" placeholder="Device Category" value="${request.deviceCategory}">
        <input id="paymentMethod" class="swal2-input" placeholder="Payment Method" value="${request.paymentMethod}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return {
          userId: userProfile.id,
          shopId: request.shopId,
          deliveryAddress: document.getElementById("deliveryAddress").value,
          description: document.getElementById("description").value,
          deliveryMethod: document.getElementById("deliveryMethod").value,
          deviceCategory: document.getElementById("deviceCategory").value,
          paymentMethod: document.getElementById("paymentMethod").value,
        };
      },
    });

    if (formValues) {
      updateRepairRequest(request.shopId, request.id, formValues);
    }
  };

  const updateStatus = async (requestId, status) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/repair-request/${requestId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Failed to update status");

      setRepairRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: status } : r
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      console.log(profileForm);
      if (response.ok) {
        await fetchUserProfile();
        setIsEditingProfile(false);
        Swal.fire("Success", "Profile updated successfully", "success");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const showOrderDetails = (order) => {
    if (!order) {
      Swal.fire("Error", "Order data is missing", "error");
      return;
    }

    const statusIcons = {
      PENDING: "⏳",
      CONFIRMED: "✅",
      SHIPPED: "📦",
      DELIVERED: "🚚",
      CANCELLED: "❌",
    };

    const statusLabel = `${statusIcons[order.status] || "ℹ"} ${order.status}`;

    const formattedDate = new Date(order.createdAt).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const itemsHtml = order.orderItems?.map(
      (item) => `
      <div class="p-2 border-b font-cairo">
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> : كود المنتج</strong> ${item.productId}</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: المنتج</strong> ${item.productName}</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">:  وصف المنتج</strong> ${item.description} </p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :  سعر المنتج</strong> ${item.productPrice} EGP</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :   المتجر</strong> ${item.shopName} </p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :  الاجمالي</strong> ${item.subtotal} EGP</p>
      </div>
    `
    ).join("") || "<p>لا توجد عناصر</p>";

    Swal.fire({
      title: `#${order.id} - تفاصيل الطلب `,
      html: `
        <div class="text-right font-cairo">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :كود التوصيل  </strong> ${order.deliveryAddressId || "N/A"}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: الاجمالي</strong> ${order.totalPrice} EGP</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: حالة الطلب</strong> ${order.status}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: طريقة الدفع</strong> ${order.paymentMethod || "N/A"}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: تأريخ الطلب</strong> ${formattedDate}</p><hr class="border-gray-100 p-1">
          <hr class="my-4"/>
          <h3 class="font-bold text-lg">محتوي الطلب</h3><br>
          <div class="max-h-60 overflow-y-auto border rounded p-2 bg-gray-50">
            ${itemsHtml}
          </div>
        </div>
      `,
      width: 600,
      icon: "info",
      showCloseButton: true,
      confirmButtonText: "إغلاق",
    });
  };

  const handleTrackOrder = async (orderId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/orders/${orderId}/tracking`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to track order");
      const data = await res.json();
      Swal.fire("Tracking Info", JSON.stringify(data), "info");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to track order", "error");
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirm = await Swal.fire({
      title: "Cancel Order?",
      text: "Are you sure you want to cancel this order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/orders/${orderId}/cancel`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to cancel order");
      fetchOrders();
      Swal.fire("Cancelled", "Order cancelled successfully", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to cancel order", "error");
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8080/api/users/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        await fetchAddresses();
        setAddressForm({
          state: "",
          city: "",
          street: "",
          building: "",
          notes: "",
          isDefault: false,
        });
        setIsAddingAddress(false);
        alert("success");
      } else {
        console.error("Failed to add address:", response.status);
      }
    } catch (error) {
      console.error("Error adding address:", error);
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8080/api/users/addresses/${editingAddressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        await fetchAddresses();
        setEditingAddressId(null);
        setAddressForm({
          state: "",
          city: "",
          street: "",
          building: "",
          notes: "",
          isDefault: false,
        });
      }
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        const response = await fetch(`http://localhost:8080/api/users/addresses/${addressId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`},
        });

        if (response.ok) {
          await fetchAddresses();
        }
      } catch (error) {
        console.error("Error deleting address:", error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const response = await fetch("http://localhost:8080/api/users/profile", {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          alert("Account deleted successfully");
          navigate("/");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  const initEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      state: address.state,
      city: address.city,
      street: address.street,
      building: address.building,
      notes: address.notes || "",
      isDefault: address.isDefault,
    });
  };

  const cancelAddressForm = () => {
    setEditingAddressId(null);
    setIsAddingAddress(false);
    setAddressForm({
      state: "",
      city: "",
      street: "",
      building: "",
      notes: "",
      isDefault: false,
    });
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const notificationsPerPage = 5;
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);




  useEffect(() => {


    
    fetchNotifications();
  }, []);

  
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/notifications/users',{headers:{Authorization:`Bearer ${token}`}});
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

   const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };


  const removeNotification = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/users/${notificationId}`, {
        method: 'DELETE',
        headers:{
        Authorization:`Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to remove notification');
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

 const clearAll = () => {
    setNotifications([]);
  };

  
  const filteredNotifications = notifications.filter((n) =>
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(startIndex, startIndex + notificationsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };





  useEffect(() => {
       
    Promise.all([
      fetchUserProfile(),
      fetchAddresses(),
      fetchOrders(),
      fetchRepairRequests(),

    ]).then(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { id: "profile", label: "Profile", icon: <FiUser /> },
    { id: "addresses", label: "Addresses", icon: <FiMapPin /> },
    { id: "orders", label: "Orders", icon: <FiBox /> },
    { id: "repairs", label: "Repair Requests", icon: <FiTool /> },
    { id: "notifications", label: "Notifications", icon: <FiBell /> },
  ];

  
  const totalOrdersPages = Math.ceil(orders.length / itemsPerPage);
  const currentOrders = orders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);

  const totalRepairsPages = Math.ceil(repairRequests.length / itemsPerPage);
  const currentRepairs = repairRequests.slice((repairsPage - 1) * itemsPerPage, repairsPage * itemsPerPage);

  return (
    <div
      className={`min-h-screen mt-16 transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
   
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-gray-800 text-white py-12 px-6 mt-16 shadow-xl">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl flex justify-center items-center gap-2 md:text-4xl font-extrabold tracking-tight mb-2 animate-fade-in">
            <FiUser /> Account
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
            Manage your profile, addresses, orders, repairs, and notifications with ease.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
        
          <div className="w-full lg:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <ul className="flex flex-col">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer font-semibold transition-all duration-200 ${
                    activeSection === item.id
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-indigo-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  } border-b border-gray-200 dark:border-gray-700 last:border-0`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

       
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 overflow-hidden">
            {activeSection === "profile" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                  <FiUser /> Profile Information
                </h2>
                <hr className="border-gray-200 dark:border-gray-700 mb-6" />
                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.first_name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, first_name: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.last_name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, last_name: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-md"
                      >
                        <FiX /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FiInfo className="text-indigo-500" /> Account Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FiUser className="text-indigo-500" /> Name
                          </p>
                          <p className="font-medium text-indigo-600 dark:text-indigo-400">
                            {userProfile
                              ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`
                              : "Loading..."}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FiMail className="text-indigo-500" /> Email
                          </p>
                          <p className="font-medium text-indigo-600 dark:text-indigo-400 break-words">
                            {userProfile?.email || "Not Provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FiSmartphone className="text-indigo-500" /> Contact Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FiPhone className="text-indigo-500" /> Phone Number
                          </p>
                          <p className="font-medium text-indigo-600 dark:text-indigo-400">
                            {userProfile.phone || "Not Provided"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">
                            {userProfile.activate ? (
                              <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold text-xs px-3 py-1 rounded-full">
                                Activated
                              </span>
                            ) : (
                              <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 font-semibold text-xs px-3 py-1 rounded-full">
                                Deactivated
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-md"
                          >
                            <FiEdit2 /> Edit Profile
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition shadow-md"
                          >
                            <FiTrash2 /> Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "addresses" && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <FiMapPin /> My Addresses
                  </h2>
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
                  >
                    <FiPlus /> Add New Address
                  </button>
                </div>

                {(isAddingAddress || editingAddressId) && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl mb-6 shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      {editingAddressId ? "Edit Address" : "Add New Address"}
                    </h3>
                    <form
                      onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={addressForm.state}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, state: e.target.value })
                            }
                            placeholder="e.g., Cairo"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, city: e.target.value })
                            }
                            placeholder="e.g., Nasr City"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Street
                          </label>
                          <input
                            type="text"
                            value={addressForm.street}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, street: e.target.value })
                            }
                            placeholder="e.g., 123 Main St"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Building
                          </label>
                          <input
                            type="text"
                            value={addressForm.building}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, building: e.target.value })
                            }
                            placeholder="e.g., Apt 4B"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={addressForm.notes}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, notes: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                          rows="3"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, isDefault: e.target.checked })
                          }
                          className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          id="isDefault"
                        />
                        <label
                          htmlFor="isDefault"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Set as default address
                        </label>
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
                        >
                          {editingAddressId ? "Update Address" : "Add Address"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelAddressForm}
                          className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-md"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`relative p-4 rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                        address.isDefault
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500"
                          : "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {address.isDefault && (
                        <span className="absolute top-2 right-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full shadow">
                          Default
                        </span>
                      )}
                      <div className="flex items-start mb-3">
                        <FiMapPin className="text-indigo-500 mt-1 mr-2 text-xl" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                            {address.street}, {address.building}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {address.city}, {address.state}
                          </p>
                          {address.notes && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 italic">
                              Notes: {address.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => initEditAddress(address)}
                          className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow"
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                  {addresses.length === 0 && !isAddingAddress && (
                    <div className="col-span-full text-center py-8">
                      <FiMapPin className="text-gray-400 text-6xl mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No addresses found. Add your first address!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "orders" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                  <FiBox /> My Orders
                </h2>
                {orders.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center text-lg py-8">
                    No orders found.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-5 rounded-xl shadow-md bg-white dark:bg-gray-950 dark:border-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                              Order #{order.id.slice(0, 8)}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold shadow ${
                                order.status === "COMPLETED"
                                  ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                                  : order.status === "PENDING"
                                  ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
                                  : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FiHome className="text-indigo-500" /> Shop: <span className="font-semibold">{order.shopName}</span>
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FiCalendar className="text-indigo-500" /> {new Date(order.createdAt).toLocaleString()}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FiFileText className="text-indigo-500" /> Payment: {order.paymentMethod}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-bold">
                            <FiTruck className="text-indigo-500" /> Total: {order.totalPrice} EGP
                          </p>
                          {order.orderItems && order.orderItems.length > 0 && (
                            <div className="mt-2">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <FiBox className="text-indigo-500" /> Items:
                              </p>
                              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                                {order.orderItems.map((item, idx) => (
                                  <li key={idx}>
                                    {item.productName} × {item.quantity} ({item.subtotal} EGP)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => showOrderDetails(order)}
                              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow"
                            >
                              <FiInfo /> Details
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow"
                            >
                              <FiXCircle /> 
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center items-center gap-4 mt-8">
                      <button
                        onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
                        disabled={ordersPage === 1}
                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition shadow-md"
                      >
                        <FiChevronLeft /> 
                      </button>
                      <span className="text-gray-700 dark:text-gray-300 font-semibold">
                        Page {ordersPage} of {totalOrdersPages}
                      </span>
                      <button
                        onClick={() => setOrdersPage((prev) => Math.min(prev + 1, totalOrdersPages))}
                        disabled={ordersPage === totalOrdersPages}
                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition shadow-md"
                      >
                         <FiChevronRight />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeSection === "repairs" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                  <FiTool /> Repair Requests
                </h2>
                {repairRequests.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center text-lg py-8">
                    No repair requests found.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentRepairs.map((req) => (
                        <div
                          key={req.id}
                          className="p-5 rounded-xl shadow-md bg-white dark:bg-gray-950 dark:border-gray-700 border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                        >
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                            <FiHash className="text-indigo-500" /> Repair #{req.id}
                          </h3>
                          <hr className="border-gray-200 dark:border-gray-700 my-3" />
                          <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <FiCheckCircle className="text-indigo-500" /> Status: {req.status}
                          </p>
                          <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <FiHome className="text-indigo-500" /> Shop: {req.shopName}
                          </p>
                          <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <FiTruck className="text-indigo-500" /> Method: {req.deliveryMethod}
                          </p>
                          <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <FiAlertTriangle className="text-indigo-500" /> Issue: {req.description}
                          </p>
                          <div className="mt-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <FiFileText className="text-indigo-500" /> Notes
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              {req.notes ? req.notes : "No additional notes"}
                            </p>
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => handleViewRepairRequest(req.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow"
                            >
                              <FiInfo /> Details
                            </button>
                            <button
                              onClick={() => handleCancelRepairRequest(req.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow"
                            >
                              <FiXCircle /> 
                            </button>
                            <button
                              onClick={() => handleEditRepairRequest(req)}
                              className="flex items-center gap-1 px-3 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition shadow"
                            >
                              <FiEdit3 /> 
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center items-center gap-4 mt-8">
                      <button
                        onClick={() => setRepairsPage((prev) => Math.max(prev - 1, 1))}
                        disabled={repairsPage === 1}
                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition shadow-md"
                      >
                        <FiChevronLeft /> 
                      </button>
                      <span className="text-gray-700 dark:text-gray-300 font-semibold">
                        Page {repairsPage} of {totalRepairsPages}
                      </span>
                      <button
                        onClick={() => setRepairsPage((prev) => Math.min(prev + 1, totalRepairsPages))}
                        disabled={repairsPage === totalRepairsPages}
                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition shadow-md"
                      >
                         <FiChevronRight />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeSection === "notifications" && (
      <div className="max-w-3xl mx-auto p-3">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                  <FiBell /> Notifications 
                </h2>

      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        {/* <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Unread: <span className="font-bold text-blue-600 dark:text-blue-400">{unreadCount}</span>
          </span>
          <button
            onClick={clearAll}
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:bg-red-300 disabled:cursor-not-allowed"
            disabled={notifications.length === 0}
          >
            Clear All
          </button>
        </div> */}
        <ul className="space-y-4">
          {currentNotifications.length === 0 ? (
            <li className="text-center text-gray-500 dark:text-gray-400 py-4">No notifications found</li>
          ) : (
            currentNotifications.map((n) => (
              <li
                key={n.id}
                className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                style={{ fontWeight: n.read ? 'normal' : 'bold' }}
              >
                <div className="flex-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    [{new Date(n.timestamp).toLocaleString()}]
                  </span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">{n.message}</span>
                </div>
                {/* <div className="flex space-x-3">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors duration-150"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(n.id)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors duration-150"
                  >
                    ✕
                  </button>
                </div> */}
              </li>
            ))
          )}
        </ul>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <FiChevronLeft/>
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } transition-colors duration-150`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            <FiChevronRight/>
          </button>
        </div>
      )}
    </div>




            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;