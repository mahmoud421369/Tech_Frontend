

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";



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

const [notifications, setNotifications] = useState([]);
const stompClientRef = useRef(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  });

    const [addressForm, setAddressForm] = useState({
    state: '',
    city: '',
    street: '',
    building: '',
    notes: '',
    isDefault: false
  });

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
      title:` تفاصيل الطلب - ${repair.id}`,
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
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
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
      const response = await fetch('http://localhost:8080/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(profileForm)
      });

      console.log(profileForm);
      if (response.ok) {
        await fetchUserProfile();
        setIsEditingProfile(false);
      Swal.fire("Success", "Profile updated successfully", "success");

      }
    } catch (error) {
      console.error('Error updating profile:', error);
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
      timeStyle: "short"
    });

    const itemsHtml = order.orderItems?.map(item => `
      <div class="p-2 border-b font-cairo">

        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> : كود المنتج</strong> ${item.productId}</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: المنتج</strong> ${item.productName}</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">:  وصف المنتج</strong> ${item.description} </p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :  سعر المنتج</strong> ${item.productPrice} EGP</p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :   المتجر</strong> ${item.shopName} </p>
        <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :  الاجمالي</strong> ${item.subtotal} EGP</p>

      </div>
    `).join('') || '<p>لا توجد عناصر</p>';

    Swal.fire({
      title:`    #${order.id} - تفاصيل الطلب `,
      html: `
        <div class="text-right font-cairo">

          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :كود التوصيل  </strong> ${order.deliveryAddressId || 'N/A'}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: الاجمالي</strong> ${order.totalPrice} EGP</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: حالة الطلب</strong> ${order.status}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: طريقة الدفع</strong> ${order.paymentMethod || 'N/A'}</p><hr class="border-gray-100 p-1">
          <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: تأريخ الطلب</strong> ${formattedDate}</p><hr class="border-gray-100 p-1">
          
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
};
 
  const handleTrackOrder = async (orderId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/orders/${orderId}/tracking`,
        {   headers: {
        'Authorization': `Bearer ${token}`
      } }
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
            headers: {
        'Authorization': `Bearer ${token}`
      }
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
    const response = await fetch('http://localhost:8080/api/users/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(addressForm)
    });

    if (response.ok) {
      await fetchAddresses();
      setAddressForm({
        state: '',
        city: '',
        street: '',
        building: '',
        notes: '',
        isDefault: false
      });
      setIsAddingAddress(false);
      alert("success");
    } else {
      console.error('Failed to add address:', response.status);
    }
  } catch (error) {
    console.error('Error adding address:', error);
  }
};

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8080/api/users/addresses/${editingAddressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}` 
        },

        body: JSON.stringify(addressForm)
      });

      if (response.ok) {
        await fetchAddresses();
        setEditingAddressId(null);
        setAddressForm({
          state: '',
          city: '',
          street: '',
          building: '',
          notes: '',
          isDefault: false
        });
      }
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

 
  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const response = await fetch(`http://localhost:8080/api/users/addresses/${addressId}`, {
          method: 'DELETE',
headers:{ 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          await fetchAddresses();
        }
      } catch (error) {
        console.error('Error deleting address:', error);
      }
    }
  };


  
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch('http://localhost:8080/api/users/profile', {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          alert('Account deleted successfully');
        
          navigate('/');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
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
      notes: address.notes || '',
      isDefault: address.isDefault
    });
  };

  const cancelAddressForm = () => {
    setEditingAddressId(null);
    setIsAddingAddress(false);
    setAddressForm({
      state: '',
      city: '',
      street: '',
      building: '',
      notes: '',
      isDefault: false
    });
  };








  useEffect(() => {

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, (frame) => {
      console.log("Connected: " + frame);

 
      stompClient.subscribe("/user/queue/notifications", (message) => {
        if (message.body) {
          const notif = JSON.parse(message.body);
          setNotifications((prev) => [notif, ...prev]);
        }
      });
    });

    return () => {
      if (stompClient.connected) {
        stompClient.disconnect(() => {
          console.log("Disconnected from WebSocket");
        });
      }
    };
  }, []);




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
      <div className="flex justify-center items-center h-[80vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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

  return (
    <div className="bg-gray">
      <br /><br /><br />
    <div
      className={`flex flex-col md:flex-row gap-6 mt-18 w-full  transition-colors duration-300  max-w-8xl p-4 ${
        darkMode ? "bg-gray-900 " : "bg-gray-50"
      }`}
    >

      <div className="w-full md:w-64 block bg-white dark:bg-gray-950 rounded-xl shadow-lg">
        <ul className="flex md:flex-col flex-col overflow-x-auto h-auto md:overflow-visible">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 dark:text-white cursor-pointer font-semibold ${
                activeSection === item.id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>


      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        {activeSection === "profile" && (
            <div className="bg-white dark:bg-gray-950 dark:border-gray-700 rounded-lg p-6">
           <h2 className="text-2xl font-semibold text-blue-600 mb-4 flex items-center gap-2"><FiUser/>Profile Information</h2>
         <hr className='border-blue-50 dark:border-gray-800' />
          <br />
          {isEditingProfile ? (
             <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     First Name
                 </label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                      className="w-full px-3 py-2 bg-[#f1f5f9] border text-blue-500 border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
                      onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                       className="w-full px-3 py-2 bg-[#f1f5f9] border text-blue-500 border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
                   onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                className="w-full px-3 py-2 bg-[#f1f5f9] border text-blue-500 border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                     required
                   />
                </div>
                
                 <div className="flex gap-4">
                   <button type="submit" className="flex items-center gap-2 bg-[#f1f5f9] text-indigo-500 px-4 py-2 rounded-3xl">
                     Save Changes
                   </button>
                   <button type="button" onClick={() => setIsEditingProfile(false)} className="flex items-center gap-2 bg-gray-50 text-indigo-500 px-4 py-2 rounded-3xl">
                    <FiX /> Cancel
                  </button>
                </div>
               </form>
             ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

   <div>
       <h3 className="text-lg font-medium mb-3 p-3 inline-block dark:text-white">
              Account Details
     </h3>
     <div className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm">
       <div>
         <p className="text-gray-600 dark:text-gray-400 p-2 flex items-center gap-2"><FiUser/>Name</p>
         <p className="font-medium border-b-2 text-blue-500 border-gray-200 dark:border-gray-700 inline-block p-2 dark:text-white">
          {userProfile
            ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`
            : "Loading..."}
        </p>
      </div>
      
       <div>
        <p className="text-gray-600 dark:text-gray-400 p-2 flex items-center break-words whitespace-normal gap-2"><FiMail/>Email</p>
        <p className="font-medium border-b-2 border-gray-200 text-blue-500 break-words whitespace-normal flex dark:border-gray-700 block p-2 dark:text-white">
           {userProfile?.email || "Not Provided"}
         </p>
       </div>
     </div>
  </div>


   <div>
     <h3 className="text-lg font-medium mb-3 p-3 inline-block dark:text-white">
      Contact Information
    </h3>
     <div className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm">
       <div>
         <p className="text-gray-600 dark:text-gray-400 p-2 flex items-center gap-2"><FiPhone/>Phone Number</p>
         <p className="font-medium border-b-2 border-gray-200 dark:border-gray-700 inline-block p-2 text-blue-600 dark:text-blue-400">
          {userProfile.phone || "Not Provided"}
        </p>
       </div>

        <div>

        <p className="font-medium  inline-block p-2 text-blue-600 dark:text-blue-400">
          {userProfile.activate ? <p className='bg-emerald-100 dark:bg-gray-950 dark:text-white text-emerald-500 font-semibold text-xs px-3 py-2 rounded-3xl'>Activated</p> : <p className='bg-red-100 text-red-500 font-semibold text-xs px-3 py-2 rounded-3xl'>Deactivated</p>}
        </p>
       </div>

       <div className="flex gap-4 flex-wrap">
       <button
         onClick={() => setIsEditingProfile(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 text-white rounded-3xl  text-md transition"
         >
           <FiEdit2 /> Edit Profile
         </button>
         <button
           onClick={handleDeleteAccount}
           className="flex items-center gap-2 bg-red-600 hover:bg-red-700 p-3 text-white rounded-3xl text-md transition"
         >
          <FiTrash2 /> 
        </button>
       </div>
     </div>
   </div>
 </div>
           )}
        </div>
        )}

        {activeSection === "addresses" && (
                  <div className="bg-white dark:bg-gray-950 rounded-lg p-6">
            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
              <h2 className="text-2xl font-semibold text-blue-600 flex items-center gap-2"><FiMapPin/> My Addresses</h2>
              <button 
                onClick={() => setIsAddingAddress(true)}
                className="flex items-center gap-2 bg-blue-50 dark:bg-gray-900 dark:text-white  text-blue-600 px-4 py-2 rounded-md"
              >
                <FiPlus /> Add New Address
              </button>
            </div>

           
            {(isAddingAddress || editingAddressId) && (
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
                <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                        placeholder="e.g., Cairo"
                        className="block w-full dark:text-white  dark:bg-gray-950 dark:border-none cursor-pointer pl-3 pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                        className="block w-full pl-3 dark:text-white dark:bg-gray-950 cursor-pointer dark:border-none pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                        placeholder="e.g., Nasr City"
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
                        onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                        className="block w-full dark:text-white dark:bg-gray-950 cursor-pointer dark:border-none pl-3 pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                        placeholder="e.g., 123 Main St"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Building
                      </label>
                      <input
                        type="text"
                        value={addressForm.building}
                        onChange={(e) => setAddressForm({...addressForm, building: e.target.value})}
                        className="block w-full dark:text-white pl-3 dark:bg-gray-950 cursor-pointer dark:border-none pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                        placeholder="e.g., Apt 4B"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={addressForm.notes}
                      onChange={(e) => setAddressForm({...addressForm, notes: e.target.value})}
                      className="block w-full dark:text-white pl-3 dark:bg-gray-950 dark:border-none cursor-pointer pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                      className="mr-2"
                      id="isDefault"
                    />
                    <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                      Set as default address
                    </label>
                  </div>
                  
                  <div className="flex gap-4">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      {editingAddressId ? 'Update Address' : 'Add Address'}
                    </button>
                    <button type="button" onClick={cancelAddressForm} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

      
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((address) => (
                <div key={address.id} className={`border rounded-lg p-4 h-auto relative ${
                  address.isDefault ? 'bg-blue-50 dark:bg-blue-900/20  ' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'
                }`}>
                  {address.isDefault && (
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                  
                  <div className="flex items-start mb-3">
                    <FiMapPin className="text-red-500 mt-1 mr-2" />
                    <div>
                      <h4 className="font-semibold dark:text-white">{address.street}, {address.building}</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {address.city}, {address.state}
                      </p>
                      {address.notes && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          Notes: {address.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => initEditAddress(address)}
                      className="flex items-center dark:border-none dark:bg-gray-950 gap-1 bg-gray-50 border rounded-3xl p-2 text-blue-600 dark:text-blue-400 text-sm"
                    >
                      <FiEdit2 /> 
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="flex items-center  dark:border-none dark:bg-gray-950 gap-1 bg-gray-50 border rounded-3xl p-2 text-red-600 dark:text-red-400 text-sm ml-4"
                    >
                      <FiTrash2 /> 
                    </button>
                  </div>
                </div>
              ))}
              
              {addresses.length === 0 && !isAddingAddress && (
                <div className="col-span-full text-center py-8">
                  <FiMapPin className="text-gray-400 text-4xl mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No addresses found. Add your first address!</p>
                </div>
              )}
            </div>
          </div>
        )}



   {activeSection === "orders" && (
  <div>
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
      <FiBox /> My Orders
    </h2>
    {orders.length === 0 ? (
      <p className="text-gray-600 dark:text-gray-400">No orders found.</p>
    ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-5 rounded-xl shadow-md bg-gradient-to-br from-blue-500/90 to-indigo-600/90 
                       text-white dark:from-gray-800 dark:to-gray-900 dark:text-gray-100 
                       flex flex-col gap-3 transition"
          >
      
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Order #{order.id.slice(0, 8)}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  order.status === "COMPLETED"
                    ? "bg-green-600 text-white"
                    : order.status === "PENDING"
                    ? "bg-yellow-500 text-gray-900"
                    : "bg-red-600 text-white"
                }`}
              >
                {order.status}
              </span>
            </div>

           
            <p>🏪 Shop: <span className="font-semibold">{order.shopName}</span></p>
            <p>💳 Payment: {order.paymentMethod}</p>
            <p>📅 {new Date(order.createdAt).toLocaleString()}</p>
            <p>💰 Total: <span className="font-bold">{order.totalPrice} EGP</span></p>

          
            {order.orderItems && order.orderItems.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Items:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {order.orderItems.map((item, idx) => (
                    <li key={idx}>
                      {item.productName} × {item.quantity} ({item.subtotal} EGP)
                    </li>
                  ))}
                </ul>
              </div>
            )}


            
                <div className="flex gap-2">
                 <button
  onClick={() => showOrderDetails(order)}
  className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition"
>
  <FiInfo/>
</button>
             
                  <button
                     onClick={() => handleCancelOrder(order.id)}
                    className="p-3 bg-white/20 backdrop-blur-md rounded-full text-red-300 hover:bg-red-400/40 transition"
                   >
                                        <FiXCircle /> 
                  </button>
                </div>
          </div>



        ))}
      </div>
    )}
  </div>
)}

       {activeSection === "repairs" && (
  <div>
    <h2 className="text-2xl font-bold mb-4 flex dark:text-white items-center gap-2">
      <FiTool /> Repair Requests
    </h2>

    {repairRequests.length === 0 ? (
      <p className="text-gray-600 dark:text-gray-400">
        No repair requests found.
      </p>
    ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">




        {repairRequests.map((req) => (
          <div
            key={req.id}
            className="p-4  border dark:border-gray-800 rounded-lg shadow-sm bg-gradient-to-br from-blue-500/90 to-indigo-600/90 
                       text-white dark:from-gray-800 dark:to-gray-900 dark:text-gray-100 "
          >
            <h3 className="font-bold flex items-center gap-2">
              <FiHash /> Repair #{req.id}
            </h3><hr className="border-gray-100 dark:border-gray-900 m-2 p-3" />
            <p className="flex items-center gap-2">
              <FiCheckCircle /> Status: {req.status}
            </p><br />
  
               <p className="flex items-center gap-2">
              <FiHome /> Shop: {req.shopName}
            </p><br />
            <p className="flex items-center gap-2">
              <FiTruck /> Method: {req.deliveryMethod}
            </p><br />
          
            <p className="flex items-center gap-2">
              <FiAlertTriangle /> Issue: {req.description}
            </p>
         
            <div className="mt-2">
              <h4 className="font-semibold flex items-center gap-2">
                <FiFileText /> Notes
              </h4>
              <p className="text-sm">
                {req.notes ? req.notes : "No additional notes"}
              </p>
            </div>

   <div className="flex gap-3 mt-4">
               <button
                  onClick={() => handleViewRepairRequest(req.id)}
                   className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition"
                >
                  <FiInfo />
                </button>
                <button
                   onClick={() => handleCancelRepairRequest(req.id)}
                   className="p-3 bg-white/20 backdrop-blur-md rounded-full text-red-300 hover:bg-red-400/40 transition"
                 >
                  <FiXCircle />
                </button>
                 <button
                  onClick={() => handleEditRepairRequest(req)}
                 className="p-3 bg-white/20 backdrop-blur-md rounded-full text-amber-300 hover:bg-amber-400/40 transition"
                >
                  <FiEdit3 />
                </button>
              </div>

          </div>
        ))}
      </div>
    )}
  </div>
)}
      {activeSection === "notifications" && (
  <div>
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
      <FiBell /> Notifications
    </h2>

    {notifications.length === 0 ? (
      <p className="text-gray-500 dark:text-gray-400">
        No notifications yet.
      </p>
    ) : (
      <ul className="space-y-3">
        {notifications.map((n, idx) => (
          <li
            key={idx}
            className="p-4 rounded-lg bg-blue-50 dark:bg-gray-900 border-l-4 border-blue-500"
          >
            <p className="text-blue-600 dark:text-blue-400 font-semibold">
              {n.title || "New Notification"}
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {n.notification || JSON.stringify(n)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
)}
      </div>
    </div>
    </div>
  );
};

export default Account;



















// import React, { useState,useRef,useEffect } from 'react';
// import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
// import {FaBell, } from 'react-icons/fa';
// import { useNavigate } from 'react-router-dom';
// import 'react-tabs/style/react-tabs.css';
// import {
//   FiEdit2,
//   FiX,
//   FiPlus,
//   FiTrash2,
//   FiMapPin,
//   FiXCircle,
//   FiUser,
//   FiInfo,
//   FiEdit3,
//   FiBox,
//   FiTool,
//   FiMail,
//   FiPhone,
//   FiTruck,
//   FiSmartphone,
//   FiCheckCircle,
// } from "react-icons/fi";

// import "../styles/style.css";
// import Swal from "sweetalert2";

// const Account = ({userId,darkMode}) => {
//    const navigate = useNavigate();
//      const token = localStorage.getItem("authToken");
//   const [activeTab, setActiveTab] = useState(0);
//   const [supportMessage, setSupportMessage] = useState('');
// const [repairRequests, setRepairRequests] = useState([]);
// const [messages, setMessages] = useState([]);

//   //  const [messages, setMessages] = useState([
//   //     { id: 1, text: 'Hello! How can I help you today?', sender: 'support', timestamp: '10:30 AM' },

//   //     { id: 2, text: 'I have an issue with my laptop', sender: 'user', timestamp: '10:31 AM' },

//   //     { id: 3, text: 'May I get the product key of the laptop ', sender: 'support', timestamp: '10:30 AM' },
//   //     { id: 4, text: 'Of course', sender: 'user', timestamp: '10:31 AM' },
//   //     { id: 5, text: 'PX49392YWY11', sender: 'user', timestamp: '10:31 AM' },



//   //   ]);



//   const [addresses, setAddresses] = useState([]);
//   const [userProfile, setUserProfile] = useState(null);
//   const [isEditingProfile, setIsEditingProfile] = useState(false);
//   const [isAddingAddress, setIsAddingAddress] = useState(false);
//   const [editingAddressId, setEditingAddressId] = useState(null);

//   const [orders, setOrders] = useState([]);


//     const [newMessage, setNewMessage] = useState('');
//     const [imagePreview, setImagePreview] = useState(null);

//     const fileInputRef = useRef(null);
  
//     const handleSend = () => {
//       if (newMessage.trim() || imagePreview) {
//         const newMsg = {
//           id: messages.length + 1,
//           text: newMessage,
//           sender: 'user',
//           timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//           image: imagePreview
//         };
        
//         setMessages([...messages, newMsg]);
//         setNewMessage('');
//         setImagePreview(null);
//       }
//     };
  
//     const handleImageChange = (e) => {
//       const file = e.target.files[0];
//       if (file) {
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           setImagePreview(reader.result);
//         };
//         reader.readAsDataURL(file);
//       }
//     };
  
//     const handleKeyPress = (e) => {
//       if (e.key === 'Enter' && !e.shiftKey) {
//         e.preventDefault();
//         handleSend();
//       }
//     };

    
//   const handleProfile = () => {
//     navigate('/edit-profile');
//   };


    
//   const [addressForm, setAddressForm] = useState({
//     state: '',
//     city: '',
//     street: '',
//     building: '',
//     notes: '',
//     isDefault: false
//   });

//   const fetchRepairRequests = async () => {
//   try {
//     const res = await fetch('http://localhost:8080/api/users/repair-request', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     if (!res.ok) throw new Error('Failed to fetch repair requests');
//     const data = await res.json();
//     setRepairRequests(data.content || []);
//   } catch (err) {
//     console.error(err);
//   }
// };

 
//   const [profileForm, setProfileForm] = useState({
//     first_name: '',
//     last_name: '',
//     phone: ''
//   });
//    const authHeader = () => ({
//     Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//     "Content-Type": "application/json",
//   });



//  const fetchAddresses = async () => {
//   try {
//     const token = localStorage.getItem("authToken");
//     const response = await fetch('http://localhost:8080/api/users/addresses', {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     if (response.ok) {
//       const data = await response.json();
//       setAddresses(data.content || []);
//     }
//   } catch (error) {
//     console.error('Error fetching addresses:', error);
//   }
// };












// const fetchUserProfile = async () => {
//   try {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       console.error("No token found, cannot fetch profile.");
//       return;
//     }

//     const res = await fetch("http://localhost:8080/api/users/profile", {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!res.ok) {
//       throw new Error(`Failed to fetch profile: ${res.status}`);
//     }

//     const data = await res.json();
//     setUserProfile(data);
//     setProfileForm(data);
//   } catch (err) {
//     console.error("Error fetching profile:", err);
//   }
// };

//     const fetchOrders = async () => {
//     try {
//       const res = await fetch("http://localhost:8080/api/users/orders", {
//         headers: {
//         'Authorization': `Bearer ${token}`
//       }
//       });
//       if (!res.ok) throw new Error("Failed to load orders");
//       const data = await res.json();
//       setOrders(data.content || []);
//     } catch (err) {
//       console.error(err);
//       Swal.fire("Error", "Failed to load orders", "error");
//     }
//   };






// const showOrderDetails = (order) => {
//   if (!order) {
//     Swal.fire("Error", "Order data is missing", "error");
//     return;
//   }


//   const statusIcons = {
//     PENDING: "⏳",
//     CONFIRMED: "✅",
//     SHIPPED: "📦",
//     DELIVERED: "🚚",
//     CANCELLED: "❌",
//   };

//   const statusLabel = `${statusIcons[order.status] || "ℹ"} ${order.status}`;


//   const formattedDate = new Date(order.createdAt).toLocaleString("ar-EG", {
//       dateStyle: "medium",
//       timeStyle: "short"
//     });

//     const itemsHtml = order.orderItems?.map(item => `
//       <div class="p-2 border-b font-cairo">

//         <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> : كود المنتج</strong> ${item.productId}</p>
//         <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: الكمية</strong> ${item.quantity}</p>
//         <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: المبلغ في العربة</strong> ${item.priceAtCheckout} EGP</p>
//         <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> : المبلغ الاجمالي</strong> ${item.subtotal} EGP</p>
//       </div>
//     `).join('') || '<p>لا توجد عناصر</p>';

//     Swal.fire({
//       title:`    #${order.id} - تفاصيل الطلب `,
//       html: `
//         <div class="text-right font-cairo">

//           <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900"> :كود التوصيل  </strong> ${order.deliveryAddressId || 'N/A'}</p><hr class="border-gray-100 p-1">
//           <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: الاجمالي</strong> ${order.totalPrice} EGP</p><hr class="border-gray-100 p-1">
//           <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: حالة الطلب</strong> ${order.status}</p><hr class="border-gray-100 p-1">
//           <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: طريقة الدفع</strong> ${order.paymentMethod || 'N/A'}</p><hr class="border-gray-100 p-1">
//           <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: تأريخ الطلب</strong> ${formattedDate}</p><hr class="border-gray-100 p-1">
//           <p class="flex justify-between flex-row-reverse text-blue-500"><strong class="text-gray-900">: كود الدفع</strong> ${order.paymentId || 'N/A'}</p>
//           <hr class="my-4"/>
//           <h3 class="font-bold text-lg">محتوي الطلب</h3><br>
//           <div class="max-h-60 overflow-y-auto border rounded p-2 bg-gray-50">
//             ${itemsHtml}
//           </div>
//         </div>
//       `,
//       width: 600,
//       icon: 'info',
//       showCloseButton: true,
//       confirmButtonText: 'إغلاق'
//     });
// };
 
//   const handleTrackOrder = async (orderId) => {
//     try {
//       const res = await fetch(
//         `http://localhost:8080/api/users/orders/${orderId}/tracking`,
//         {   headers: {
//         'Authorization': `Bearer ${token}`
//       } }
//       );
//       if (!res.ok) throw new Error("Failed to track order");
//       const data = await res.json();
//       Swal.fire("Tracking Info", JSON.stringify(data), "info");
//     } catch (err) {
//       console.error(err);
//       Swal.fire("Error", "Failed to track order", "error");
//     }
//   };

//   const handleCancelOrder = async (orderId) => {
//     const confirm = await Swal.fire({
//       title: "Cancel Order?",
//       text: "Are you sure you want to cancel this order?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, cancel it",
//     });
//     if (!confirm.isConfirmed) return;
//     try {
//       const res = await fetch(
//         `http://localhost:8080/api/users/orders/${orderId}/cancel`,
//         {
//           method: "DELETE",
//             headers: {
//         'Authorization': `Bearer ${token}`
//       }
//         }
//       );
//       if (!res.ok) throw new Error("Failed to cancel order");
//       fetchOrders();
//       Swal.fire("Cancelled", "Order cancelled successfully", "success");
//     } catch (err) {
//       console.error(err);
//       Swal.fire("Error", "Failed to cancel order", "error");
//     }
//   };


//   const handleAddAddress = async (e) => {
//   e.preventDefault();
//   try {
//     const token = localStorage.getItem("authToken");
//     const response = await fetch('http://localhost:8080/api/users/addresses', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}` 
//       },
//       body: JSON.stringify(addressForm)
//     });

//     if (response.ok) {
//       await fetchAddresses();
//       setAddressForm({
//         state: '',
//         city: '',
//         street: '',
//         building: '',
//         notes: '',
//         isDefault: false
//       });
//       setIsAddingAddress(false);
//       alert("success");
//     } else {
//       console.error('Failed to add address:', response.status);
//     }
//   } catch (error) {
//     console.error('Error adding address:', error);
//   }
// };

//   const handleUpdateAddress = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch(`http://localhost:8080/api/users/addresses/${editingAddressId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//            'Authorization': `Bearer ${token}` 
//         },

//         body: JSON.stringify(addressForm)
//       });

//       if (response.ok) {
//         await fetchAddresses();
//         setEditingAddressId(null);
//         setAddressForm({
//           state: '',
//           city: '',
//           street: '',
//           building: '',
//           notes: '',
//           isDefault: false
//         });
//       }
//     } catch (error) {
//       console.error('Error updating address:', error);
//     }
//   };

 
//   const handleDeleteAddress = async (addressId) => {
//     if (window.confirm('Are you sure you want to delete this address?')) {
//       try {
//         const response = await fetch(`http://localhost:8080/api/users/addresses/${addressId}`, {
//           method: 'DELETE',
// headers:{ 'Authorization': `Bearer ${token}` }
//         });

//         if (response.ok) {
//           await fetchAddresses();
//         }
//       } catch (error) {
//         console.error('Error deleting address:', error);
//       }
//     }
//   };

 
//   const handleUpdateProfile = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:8080/api/users/profile', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//          'Authorization': `Bearer ${token}` 
//         },
//         body: JSON.stringify(profileForm)
//       });

//       console.log(profileForm);
//       if (response.ok) {
//         await fetchUserProfile();
//         setIsEditingProfile(false);
//       Swal.fire("Success", "Profile updated successfully", "success");

//       }
//     } catch (error) {
//       console.error('Error updating profile:', error);
//     }
//   };

  
//   const handleDeleteAccount = async () => {
//     if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
//       try {
//         const response = await fetch('http://localhost:8080/api/users/profile', {
//           method: 'DELETE',
//           credentials: 'include'
//         });

//         if (response.ok) {
//           alert('Account deleted successfully');
        
//           navigate('/');
//         }
//       } catch (error) {
//         console.error('Error deleting account:', error);
//       }
//     }
//   };


//   const initEditAddress = (address) => {
//     setEditingAddressId(address.id);
//     setAddressForm({
//       state: address.state,
//       city: address.city,
//       street: address.street,
//       building: address.building,
//       notes: address.notes || '',
//       isDefault: address.isDefault
//     });
//   };

//   const cancelAddressForm = () => {
//     setEditingAddressId(null);
//     setIsAddingAddress(false);
//     setAddressForm({
//       state: '',
//       city: '',
//       street: '',
//       building: '',
//       notes: '',
//       isDefault: false
//     });
//   };


//   useEffect(() => {
//     const loadData = async () => {
//       await Promise.all([fetchAddresses(), fetchUserProfile()]);
//       setIsLoading(false);
//     };
//     loadData();
//   }, []);

//     useEffect(() => {
//     const loadData = async () => {
//       await Promise.all([
//         fetchUserProfile(),
//         fetchAddresses(),
//         fetchOrders(),
//         fetchRepairRequests(),

//       ]);
//       setIsLoading(false);
//     };
//     loadData();
//   }, []);




 

//   const handleSupportSubmit = (e) => {
//     e.preventDefault();
//     alert(`Support request submitted: ${supportMessage}`);
//     setSupportMessage('');
//   };

// const handleViewRepairRequest = async (repairId) => {
//   try {
//     const res = await fetch(
//       `http://localhost:8080/api/users/repair-request/${repairId}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     if (!res.ok) throw new Error("Failed to fetch repair details");
//     const repair = await res.json();

   
//     const statusLabels = {
//       SUBMITTED: "تم الإرسال",
//       QUOTE_PENDING: "بانتظار عرض السعر",
//       QUOTE_SENT: "تم إرسال العرض",
//       QUOTE_APPROVED: "تمت الموافقة",
//       QUOTE_REJECTED: "تم الرفض",
//       DEVICE_COLLECTED: "تم الاستلام",
//       REPAIRING: "قيد الإصلاح",
//       REPAIR_COMPLETED: "تم الإصلاح",
//       DEVICE_DELIVERED: "تم التسليم",
//       CANCELLED: "أُلغيت",
//       FAILED: "فشلت",
//     };

//     const deliveryMethodLabels = {
//       HOME_DELIVERY: "توصيل للمنزل",
//       PICKUP: "استلام من المتجر",
//     };

//     const paymentMethodLabels = {
//       CASH: "نقدًا",
//       CARD: "بطاقة",
//       WALLET: "محفظة إلكترونية",
//     };

//     Swal.fire({
//       title:` تفاصيل الطلب - ${repair.id}`,
//       html: `
//         <div style="text-align:right; line-height:1.8;">
//           <p><strong>المستخدم:</strong> ${repair.userId}</p>
//           <p><strong>المتجر:</strong> ${repair.shopId}</p>
//           <p><strong>العنوان:</strong> ${repair.deliveryAddress}</p>
//           <p><strong>الوصف:</strong> ${repair.description || "لا يوجد"}</p>
//           <p><strong>الفئة:</strong> ${repair.deviceCategory}</p>
//           <p><strong>طريقة التوصيل:</strong> ${deliveryMethodLabels[repair.deliveryMethod] || repair.deliveryMethod}</p>
//           <p><strong>طريقة الدفع:</strong> ${paymentMethodLabels[repair.paymentMethod] || repair.paymentMethod}</p>
//           <p><strong>مؤكد:</strong> ${repair.confirmed ? "نعم" : "لا"}</p>
//           <p><strong>الحالة:</strong> ${statusLabels[repair.status] || repair.status}</p>
//         </div>
//       `,
//       icon: "info",
//       showCloseButton: true,
//       confirmButtonText: "إغلاق",
//     });
//   } catch (err) {
//     console.error(err);
 
//   }
// };
// const handleCancelRepairRequest = async (requestId) => {
//   const confirm = await Swal.fire({
//     title: "Cancel Repair Request?",
//     text: "Are you sure you want to cancel this repair request?",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonText: "Yes, cancel it",
//   });
//   if (!confirm.isConfirmed) return;

//   try {
//     const res = await fetch(`http://localhost:8080/api/users/repair-request/${requestId}/cancel`, {
//       method: 'DELETE',
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     if (!res.ok) throw new Error("Failed to cancel repair request");
//     fetchRepairRequests();
//     Swal.fire("Cancelled", "Repair request cancelled successfully", "success");
//   } catch (err) {
//     console.error(err);
//     Swal.fire("Error", "Failed to cancel repair request", "error");
//   }
// };

// const updateRepairRequest = async (shopId, requestId, updatedData) => {
//   try {
//     const res = await fetch(
//       `http://localhost:8080/api/users/repair-request/${shopId}/${requestId}`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(updatedData),
//       }
//     );
//     console.log(updatedData);

//     if (!res.ok) {
//       const errData = await res.json();
//       throw new Error(errData.message || "Failed to update repair request");
//     }

//     Swal.fire("Success", "Repair request updated!", "success");
//     fetchRepairRequests(); 
//   } catch (err) {
//     console.error("Update repair request error:", err);
//     Swal.fire("Error", err.message, "error");
//   }
// };

// const handleEditRepairRequest = async (request) => {
//   const { value: formValues } = await Swal.fire({
//     title: "Edit Repair Request",
//     html: `
//       <input id="deliveryAddress" class="swal2-input" placeholder="Delivery Address" value="${request.deliveryAddress}">
//       <input id="description" class="swal2-input" placeholder="Description" value="${request.description}">
//       <input id="deliveryMethod" class="swal2-input" placeholder="Delivery Method" value="${request.deliveryMethod}">
//       <input id="deviceCategory" class="swal2-input" placeholder="Device Category" value="${request.deviceCategory}">
//       <input id="paymentMethod" class="swal2-input" placeholder="Payment Method" value="${request.paymentMethod}">
//     `,
//     focusConfirm: false,
//     showCancelButton: true,
//     preConfirm: () => {
//       return {
//         userId: userProfile.id,
//         shopId: request.shopId,
//         deliveryAddress: document.getElementById("deliveryAddress").value,
//         description: document.getElementById("description").value,
//         deliveryMethod: document.getElementById("deliveryMethod").value,
//         deviceCategory: document.getElementById("deviceCategory").value,
//         paymentMethod: document.getElementById("paymentMethod").value,
//       };
//     },
//   });

//   if (formValues) {
//     updateRepairRequest(request.shopId, request.id, formValues);
//   }
// };

// const updateStatus = async (requestId, status) => {
//     try {
//       const res = await fetch(
//         `http://localhost:8080/api/users/repair-request/${requestId}/status`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ status }),
//         }
//       );
//       if (!res.ok) throw new Error("Failed to update status");
  
//       setRepairRequests((prev) =>
//         prev.map((r) =>
//           r.id === requestId ? { ...r, status: status } : r
//         )
//       );
//     } catch (err) {
//       console.error(err);
//     }
//   };

//  const [isLoading, setIsLoading] = useState(true);
  
   
//       useEffect(() => {
//         const timer = setTimeout(() => {
//           setIsLoading(false);
//         }, 1500);
//         return () => clearTimeout(timer);
//       }, []);
    

//     if (isLoading) {
//     return (
//       <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-600 border-t-blue-200 rounded-full animate-spin mx-auto"></div>
//           <p className="mt-4 text-blue-600 text-xl font-semibold">Loading your profile information...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`container ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}   mt-20  mx-auto p-4 max-w-full`}>

      



//  <Tabs selectedIndex={activeTab} onSelect={(index) => setActiveTab(index)}>
//   <TabList
//     className="
//       flex sm:flex-wrap gap-2
//       overflow-x-auto sm:overflow-visible
//       bg-gray-100 dark:bg-gray-950
//       p-2 rounded-full mb-6
//       scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600
//     "
//   >
//     {[
//       "Profile Overview",
//       "Addresses",
//       "Orders",
//       "Repair Requests",
//       "Support"
//       // "Transaction History",
//       // "Contact Support",
//       // "Notifications",
//       // "Chat Support"
//     ].map((tab, idx) => (
//       <Tab
//         key={idx}
//         className={`
//           flex items-center justify-center
//           min-w-[120px] sm:min-w-fit
//           py-2 px-4 sm:px-5
//           rounded-full text-blue-500 font-semibold cursor-pointer focus:outline-none
//           transition-all duration-200
//           ui-selected:bg-blue-500 ui-selected:text-white ui-selected:shadow-md
//           hover:bg-blue-100 dark:hover:bg-gray-800
//         `}
//       >
//         {tab}
//         {tab === "Notifications" && (
//           <span className="ml-2 bg-white text-blue-500 border rounded-full px-3 py-0.5 text-xs font-semibold">
//             4
//           </span>
//         )}
//       </Tab>
//     ))}
//   </TabList>


       
//         <TabPanel>
//           <div className="bg-white dark:bg-gray-950 dark:border-gray-700 rounded-lg p-6">
//             <h2 className="text-2xl font-semibold text-blue-600 mb-4 flex items-center gap-2"><FiUser/>Profile Information</h2>
//             <hr className='border-blue-50 dark:border-gray-800' />
//             <br />
            
//             {isEditingProfile ? (
//               <form onSubmit={handleUpdateProfile} className="space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                       First Name
//                     </label>
//                     <input
//                       type="text"
//                       value={profileForm.first_name}
//                       onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
//                       className="w-full px-3 py-2 bg-[#f1f5f9] border text-blue-500 border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                       Last Name
//                     </label>
//                     <input
//                       type="text"
//                       value={profileForm.last_name}
//                       onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
//                       className="w-full px-3 py-2 bg-[#f1f5f9] border text-blue-500 border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
//                       required
//                     />
//                   </div>
//                 </div>
                
               
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                     Phone
//                   </label>
//                   <input
//                     type="tel"
//                     value={profileForm.phone}
//                     onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
//                     className="w-full px-3 py-2 bg-[#f1f5f9] border text-blue-500 border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
//                     required
//                   />
//                 </div>
                
//                 <div className="flex gap-4">
//                   <button type="submit" className="flex items-center gap-2 bg-[#f1f5f9] text-indigo-500 px-4 py-2 rounded-3xl">
//                      Save Changes
//                   </button>
//                   <button type="button" onClick={() => setIsEditingProfile(false)} className="flex items-center gap-2 bg-gray-50 text-indigo-500 px-4 py-2 rounded-3xl">
//                     <FiX /> Cancel
//                   </button>
//                 </div>
//               </form>
//             ) : (
//              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//   <div>
//     <h3 className="text-lg font-medium mb-3 p-3 inline-block dark:text-white">
//       Account Details
//     </h3>
//     <div className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm">
//       <div>
//         <p className="text-gray-600 dark:text-gray-400 p-2 flex items-center gap-2"><FiUser/>Name</p>
//         <p className="font-medium border-b-2 text-blue-500 border-gray-200 dark:border-gray-700 inline-block p-2 dark:text-white">
//           {userProfile
//             ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`
//             : "Loading..."}
//         </p>
//       </div>
      
//       <div>
//         <p className="text-gray-600 dark:text-gray-400 p-2 flex items-center gap-2"><FiMail/>Email</p>
//         <p className="font-medium border-b-2 border-gray-200 text-blue-500 dark:border-gray-700 inline-block p-2 dark:text-white">
//           {userProfile?.email || "Not Provided"}
//         </p>
//       </div>
//     </div>
//   </div>


//   <div>
//     <h3 className="text-lg font-medium mb-3 p-3 inline-block dark:text-white">
//       Contact Information
//     </h3>
//     <div className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm">
//       <div>
//         <p className="text-gray-600 dark:text-gray-400 p-2 flex items-center gap-2"><FiPhone/>Phone Number</p>
//         <p className="font-medium border-b-2 border-gray-200 dark:border-gray-700 inline-block p-2 text-blue-600 dark:text-blue-400">
//           {userProfile.phone || "Not Provided"}
//         </p>
//       </div>

//        <div>

//         <p className="font-medium  inline-block p-2 text-blue-600 dark:text-blue-400">
//           {userProfile.activate ? <p className='bg-emerald-100 text-emerald-500 font-semibold text-xs px-3 py-2 rounded-3xl'>Activated</p> : <p className='bg-red-100 text-red-500 font-semibold text-xs px-3 py-2 rounded-3xl'>Deactivated</p>}
//         </p>
//       </div>

//       <div className="flex gap-4 flex-wrap">
//         <button
//           onClick={() => setIsEditingProfile(true)}
//           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 p-3 text-white rounded-3xl font-medium transition"
//         >
//           <FiEdit2 /> Edit Profile
//         </button>
//         <button
//           onClick={handleDeleteAccount}
//           className="flex items-center gap-2 bg-red-600 hover:bg-red-700 p-3 text-white rounded-3xl font-medium transition"
//         >
//           <FiTrash2 /> Delete Account
//         </button>
//       </div>
//     </div>
//   </div>
// </div>
//             )}
//           </div>
//         </TabPanel>

       
//         <TabPanel>
//           <div className="bg-white dark:bg-gray-950 rounded-lg p-6">
//             <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
//               <h2 className="text-2xl font-semibold text-blue-600 flex items-center gap-2"><FiMapPin/> My Addresses</h2>
//               <button 
//                 onClick={() => setIsAddingAddress(true)}
//                 className="flex items-center gap-2 bg-blue-50 dark:bg-black/30 dark:text-white  text-blue-600 px-4 py-2 rounded-md"
//               >
//                 <FiPlus /> Add New Address
//               </button>
//             </div>

           
//             {(isAddingAddress || editingAddressId) && (
//               <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
//                 <h3 className="text-lg font-semibold mb-4 dark:text-white">
//                   {editingAddressId ? 'Edit Address' : 'Add New Address'}
//                 </h3>
//                 <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-4">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         State
//                       </label>
//                       <input
//                         type="text"
//                         value={addressForm.state}
//                         onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
//                         className="block w-full pl-3 pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         City
//                       </label>
//                       <input
//                         type="text"
//                         value={addressForm.city}
//                         onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
//                         className="block w-full pl-3 pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                         required
//                       />
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         Street
//                       </label>
//                       <input
//                         type="text"
//                         value={addressForm.street}
//                         onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
//                         className="block w-full pl-3 pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                         Building
//                       </label>
//                       <input
//                         type="text"
//                         value={addressForm.building}
//                         onChange={(e) => setAddressForm({...addressForm, building: e.target.value})}
//                         className="block w-full pl-3 pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                         required
//                       />
//                     </div>
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                       Notes (Optional)
//                     </label>
//                     <textarea
//                       value={addressForm.notes}
//                       onChange={(e) => setAddressForm({...addressForm, notes: e.target.value})}
//                       className="block w-full pl-3 pr-3 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                       rows="3"
//                     />
//                   </div>
                  
//                   <div className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={addressForm.isDefault}
//                       onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
//                       className="mr-2"
//                       id="isDefault"
//                     />
//                     <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
//                       Set as default address
//                     </label>
//                   </div>
                  
//                   <div className="flex gap-4">
//                     <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
//                       {editingAddressId ? 'Update Address' : 'Add Address'}
//                     </button>
//                     <button type="button" onClick={cancelAddressForm} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
//                       Cancel
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             )}

      
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {addresses.map((address) => (
//                 <div key={address.id} className={`border rounded-lg p-4 relative ${
//                   address.isDefault ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'
//                 }`}>
//                   {address.isDefault && (
//                     <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
//                       Default
//                     </span>
//                   )}
                  
//                   <div className="flex items-start mb-3">
//                     <FiMapPin className="text-red-500 mt-1 mr-2" />
//                     <div>
//                       <h4 className="font-semibold dark:text-white">{address.street}, {address.building}</h4>
//                       <p className="text-gray-600 dark:text-gray-300 text-sm">
//                         {address.city}, {address.state}
//                       </p>
//                       {address.notes && (
//                         <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
//                           Notes: {address.notes}
//                         </p>
//                       )}
//                     </div>
//                   </div>
                  
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => initEditAddress(address)}
//                       className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm"
//                     >
//                       <FiEdit2 /> Edit
//                     </button>
//                     <button
//                       onClick={() => handleDeleteAddress(address.id)}
//                       className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm ml-4"
//                     >
//                       <FiTrash2 /> Delete
//                     </button>
//                   </div>
//                 </div>
//               ))}
              
//               {addresses.length === 0 && !isAddingAddress && (
//                 <div className="col-span-full text-center py-8">
//                   <FiMapPin className="text-gray-400 text-4xl mx-auto mb-4" />
//                   <p className="text-gray-500 dark:text-gray-400">No addresses found. Add your first address!</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </TabPanel>




//  <TabPanel>
//   <div className="bg-white p-4 dark:bg-gray-950 rounded-lg">
//               <h2 className="text-2xl font-semibold text-blue-600 flex items-center gap-2"><FiBox/> My Orders</h2> <br />

//           <div className="grid md:grid-cols-3 gap-6">
//             {orders.map((order) => (
//               <div
//                 key={order.id}
//                 className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-md   border-white/20 text-white relative overflow-hidden"
//               >
//                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
//                 <FiInfo className="text-white/90" /> Order #{order.id}
//               </h3>

//                 <p className="px-4 py-1.5 rounded-full bg-white/10 border-white/20 text-white/70 hover:bg-white/20 block font-semibold text-sm shadow-md transition backdrop-blur-md border mb-2">Status: {order.status}</p>
//                 <p className="px-4 py-1.5 rounded-full bg-white/10 border-white/20 text-white/70 hover:bg-white/20 block font-semibold text-sm shadow-md transition backdrop-blur-md border mb-2">Total: {order.totalPrice} EGP</p>
//                 <p className="px-4 py-1.5 rounded-full bg-white/10 border-white/20 text-white/70 hover:bg-white/20  block font-semibold text-sm shadow-md transition backdrop-blur-md border mb-2">Date: {new Date(order.createdAt).toLocaleDateString("en-US",{
//                   year:"numeric",
//                   month:"long",
//                   day:"numeric"
//                 })}


//                 </p>

//                 <div className="flex gap-2">
//                  <button
//   onClick={() => showOrderDetails(order)}
//   className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition"
// >
//   <FiInfo/>
// </button>
//               
//                   <button
//                     onClick={() => handleCancelOrder(order.id)}
//                     className="p-3 bg-white/20 backdrop-blur-md rounded-full text-red-300 hover:bg-red-400/40 transition"
//                   >
//                     <FiXCircle /> 
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           </div>
//         </TabPanel>



// <TabPanel>
//   <div className="bg-white dark:bg-gray-950 p-6 rounded-lg">
//     <h2 className="text-2xl font-semibold flex items-center gap-2 text-blue-600 mb-4">
//       <FiTool /> Repair Requests
//     </h2>

//     {repairRequests.length === 0 ? (
//       <p className="text-gray-500 dark:text-gray-400">No repair requests found.</p>
//     ) : (
//       <div className="grid md:grid-cols-3 gap-6">
//         {repairRequests.map((request) => {
//           // helper to get device name instead of ID
//           // const getDeviceName = (id) => {
//           //   const device = devices.find((d) => d.id === id);
//           //   return device ? device.name : "Unknown Device";
//           // };

//           return (
//             <div
//               key={request.id}
//               className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500/80 to-indigo-600/80 backdrop-blur-md border border-white/20 text-white relative overflow-hidden"
//             >
//               <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
//                 <FiInfo className="text-white/90" /> Request #{request.id}
//               </h3>

//               {/* Device */}
//               {/* <p className="mb-2 flex items-center gap-2">
//                 <FiSmartphone className="text-white/80" />
//                 Device: {getDeviceName(request.deviceId)}
//               </p> */}

//               {/* Status */}
//               <p className="mb-2 flex items-center gap-2">
//                 <FiCheckCircle className="text-white/80" />
//                 Status:
//               </p>
//               <div className="flex flex-wrap gap-3 mt-2">
//                 {["QUOTE_APPROVED", "IN_PROGRESS", "COMPLETED"].map((statusOption) => (
//                   <button
//                     key={statusOption}
//                     onClick={() => updateStatus(request.id, statusOption)}
//                     className={`px-4 py-1.5 rounded-full font-semibold text-sm shadow-md transition backdrop-blur-md border ${
//                       request.status === statusOption
//                         ? "bg-white/30 border-white/40 text-white"
//                         : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
//                     }`}
//                   >
//                     {statusOption.replace("_", " ")}
//                   </button>
//                 ))}
//               </div>

//               {/* Delivery */}
//               <p className="mt-4 mb-2 flex items-center gap-2">
//                 <FiTruck className="text-white/80" />
//                 Delivery Method: {request.deliveryMethod}
//               </p>

//               {/* Actions */}
//               <div className="flex gap-3 mt-4">
//                 <button
//                   onClick={() => handleViewRepairRequest(request.id)}
//                   className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition"
//                 >
//                   <FiInfo />
//                 </button>
//                 <button
//                   onClick={() => handleCancelRepairRequest(request.id)}
//                   className="p-3 bg-white/20 backdrop-blur-md rounded-full text-red-300 hover:bg-red-400/40 transition"
//                 >
//                   <FiXCircle />
//                 </button>
//                 <button
//                   onClick={() => handleEditRepairRequest(request)}
//                   className="p-3 bg-white/20 backdrop-blur-md rounded-full text-amber-300 hover:bg-amber-400/40 transition"
//                 >
//                   <FiEdit3 />
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     )}
//   </div>
// </TabPanel>

// {/* <TabPanel>

//   <div className="flex h-screen bg-gray-100">
      
//       <div className="w-1/4 bg-white border-r overflow-y-auto">
//         <h2 className="p-4 font-bold bg-blue-600 text-white">Conversations</h2>
//         <ul>
//           {conversations.map((shop) => (
//             <li
//               key={shop.id}
//               className={`p-3 cursor-pointer hover:bg-gray-200 ${
//                 selectedShop?.id === shop.id ? "bg-blue-100" : ""
//               }`}
//               onClick={() => loadMessages(shop)}
//             >
//               🏪 {shop.name}
//             </li>
//           ))}
//         </ul>
//       </div>


//       <div className="flex-1 flex flex-col">
//         {selectedShop ? (
//           <>
            
//             <div className="p-4 bg-blue-600 text-white font-semibold">
//               Chat with {selectedShop.name}
//             </div>

//             <div className="flex-1 p-4 overflow-y-auto">
//               {messages.map((msg, idx) => (
//                 <div
//                   key={idx}
//                   className={`mb-2 flex ${
//                     msg.senderId === userId ? "justify-end" : "justify-start"
//                   }`}
//                 >
//                   <div
//                     className={`px-4 py-2 rounded-lg ${
//                       msg.senderId === userId
//                         ? "bg-blue-500 text-white"
//                         : "bg-gray-300 text-black"
//                     }`}
//                   >
//                     {msg.content}
//                   </div>
//                 </div>
//               ))}
//             </div>


//             <div className="p-3 border-t flex">
//               <input
//                 className="flex-1 border rounded-lg px-3 py-2"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 placeholder="Type a message..."
//               />
//               <button
//                 className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
//                 onClick={sendMessage}
//               >
//                 Send
//               </button>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center text-gray-500">
//             Select a shop to start chatting
//           </div>
//         )}
//       </div>
//     </div>



// </TabPanel> */}
//         {/* Transaction History Tab */}
//         {/* <TabPanel>
//           <div className="bg-white dark:bg-gray-950 p-6  rounded-lg  overflow-hidden">
//             <h2 className="text-2xl font-semibold text-blue-600 mb-4">Transaction History</h2><hr className='border-gray-200 dark:border-gray-900'/><br />
            
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-blue-500 dark:bg-gray-800 text-white ">
//                   <tr>
//                     <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Date</th>
//                     <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Type</th>
//                     <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Item/Service</th>
//                     <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Shop</th>
//                     <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Amount</th>
//                     <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-gray-50 dark:bg-gray-900 divide-y divide-gray-300 dark:divide-gray-700  text-center">
//                   {transactions.map((transaction) => (
//                     <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-950">
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-90 dark:text-white">{transaction.date}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{transaction.type}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{transaction.item}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-white">{transaction.shop}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{transaction.amount.toFixed(2)} EGP</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 py-1 text-xs rounded-full font-bold ${
//                           transaction.status === 'Completed' 
//                             ? 'bg-green-100 text-green-800' 
//                             : 'bg-yellow-100 text-yellow-800'
//                         }`}>
//                           {transaction.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
            
//             <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
//               <button className="text-blue-600 hover:text-blue-800 font-medium">
//                 View Full History
//               </button>
//             </div>
//           </div>
//         </TabPanel> */}

        
//         <TabPanel>
//           <div className="bg-white dark:bg-gray-950  rounded-lg p-6">
//             <h2 className="text-2xl font-semibold text-blue-600 mb-4">Contact Support</h2><hr className='border-gray-200 dark:border-gray-700'/><br />
//             <p className="text-gray-400 mb-6">
//               Have questions about your repairs, purchases, or deliveries? Our support team is here to help.
//             </p>
            
//             <form onSubmit={handleSupportSubmit} className="space-y-4">
//               <div>
//                 <label className="block mb-3 font-medium dark:text-white">Subject</label>
//                 <select className="block w-full font-bold text-sm dark:bg-gray-900 text-[#6079F6] pl-6 pr-3 py-3 bg-[#ECF0F3] cursor-pointer rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
//                   <option>Select an issue</option>
//                   <option>Repair Service</option>
//                   <option>Purchase Issue</option>
//                   <option>Delivery Problem</option>
//                   <option>Cracked Screen</option>
//                   <option>Battery Replacement</option>
//                   <option>Charging Port Issue</option>
//                   <option>Account Help</option>
//                   <option>Other</option>
//                 </select>
//               </div>
              
//               <div>
//                 <label className="block mb-3 font-medium dark:text-white">Message</label>
//                 <textarea
//                   value={supportMessage}
//                   onChange={(e) => setSupportMessage(e.target.value)}
//                   className="block w-full font-bold text-sm dark:bg-gray-900 text-[#6079F6] pl-6 pr-3 py-3 bg-[#ECF0F3] cursor-pointer rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//                   placeholder="Describe your issue in detail..."
//                   required
//                 />
//               </div>
              
//               <div className="flex items-center">
//                 <input type="checkbox" id="urgent" className="mr-2" />
//                 <label htmlFor="urgent" className="text-sm text-gray-600">
//                   Mark as urgent
//                 </label>
//               </div>
              
//               <button
//                 type="submit"
//                 className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition"
//               >
//                 Submit Request
//               </button>
//             </form>
            
//             <div className="mt-8 pt-6 border-t border-gray-200">
//               <h3 className="font-medium mb-2 dark:text-white">Support Information</h3>
//               <p className="text-gray-600 mb-2">Email: support@techrepair.com</p>
//               <p className="text-gray-600 mb-2">Phone: 19999</p>
//               <p className="text-gray-600 mt-2">Availability: 24/7 Hours</p>
//             </div>
//           </div>
//         </TabPanel>


//         <TabPanel>
//           <div className="bg-white dark:bg-gray-950  rounded-lg p-6">
//             <h2 className="text-2xl font-semibold flex gap-5 items-center  text-blue-600 mb-6 "><FaBell size={54} className='bg-blue-500 text-white p-3   rounded-full'/> Notifications</h2><hr className='border-gray-200 dark:border-gray-700'/><br />
//             <p className="text-gray-400 mb-6">
//               View your real-time updates on repair status,delivery progress ,and promotional offers.
//             </p>
            
//             <div className="repair">
//               <h3 className='bg-purple-400 text-white p-4 rounded-full font-bold text-sm mb-5 inline-block'>Repair Status <span className='badge px-4 py-2 rounded-full m-2 text-white bg-purple-500'>2</span></h3>
              
//               <div className="bg-purple-50 dark:bg-gray-900 flex gap-5 items-center  p-3 mb-4 rounded-xl   ">
//    <div className="icon">
//     <FaBell size={40} className='bg-purple-500 text-white p-3   rounded-full'/>
//    </div>
//    <div className="message">
//    <p className='text-sm font-bold text-purple-500'>The repair of your device is in diagonsing issue phase, Mahmoud</p>
//    </div>

//               </div>

//                     <div className="bg-purple-50 dark:bg-gray-900 flex gap-5 items-center  p-3 rounded-xl mb-4  ">
//    <div className="icon">
//     <FaBell size={40} className='bg-purple-500 text-white p-3   rounded-full'/>
//    </div>
//    <div className="message">
//    <p className='text-sm font-bold text-purple-500'>The repair of your device is in progress, Mahmoud</p>
//    </div>

//               </div>
//             </div><br />


//             <div className="delivery">
//               <h3 className='bg-emerald-400 text-white p-4 rounded-full font-bold text-sm mb-5 inline-block'>Devlivery Status <span className='badge px-4 py-2 rounded-full m-2 text-white bg-emerald-500'>1</span></h3>


//              <div className="bg-emerald-50 dark:bg-gray-900 flex gap-5 items-center  p-3 rounded-xl mb-4  ">
//    <div className="icon">
//     <FaBell size={40} className='bg-emerald-500 text-white p-3   rounded-full'/>
//    </div>
//    <div className="message">
//    <p className='text-sm font-bold text-emerald-500'>The repair of your device is in progress, Mahmoud</p>
//    </div>

//               </div>

//             </div><br />


//   <div className="promotional">
//               <h3 className='bg-red-400 text-white p-4 rounded-full font-bold text-sm mb-5 inline-block'>Offers <span className='badge px-4 py-2 rounded-full m-2 text-white bg-red-500'>1</span></h3>


//              <div className="bg-red-50 dark:bg-gray-900 flex gap-5 items-center  p-3 rounded-xl mb-4  ">
//    <div className="icon">
//     <FaBell size={40} className='bg-red-500 text-white p-3   rounded-full'/>
//    </div>
//    <div className="message">
//    <p className='text-sm font-bold text-red-500'>There are special offers for you Mahmoud, What are you waiting!!</p>
//    </div>

//               </div>

//             </div>


            
        
//           </div>
//         </TabPanel>


// <TabPanel>
//    <div className="flex flex-col h-[calc(100vh-180px)]">
//       <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-950 rounded-lg shadow mb-4">
//         {messages.map((msg) => (
//           <div 
//             key={msg.id} 
//             className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//           >
//             <div 
//               className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
//                 msg.sender === 'user' 
//                   ? 'bg-blue-700 text-white rounded-br-none' 
//                   : 'bg-gray-200 dark:bg-gray-900 dark:text-white text-gray-800 rounded-bl-none'
//               }`}
//             >
//               {msg.image && (
//                 <img 
//                   src={msg.image} 
//                   alt="Attached" 
//                   className="mb-2 rounded-md max-w-[150px] h-auto"
//                 />
//               )}
//               <p>{msg.text}</p>
//               <div className="text-xs dark:text-gray-400 opacity-80 mt-1">
//                 {msg.timestamp}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
//         {imagePreview && (
//           <div className="relative mb-3">
//             <img 
//               src={imagePreview} 
//               alt="Preview" 
//               className="h-24 w-24 object-cover rounded-md border"
//             />
//             <button 
//               onClick={() => setImagePreview(null)}
//               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
//             >
//               ×
//             </button>
//           </div>
//         )}
        
//         <div className="flex gap-2">
//           <button 
//             onClick={() => fileInputRef.current.click()}
//             className="p-2 text-gray-600 dark:text-white hover:text-indigo-600"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//             </svg>
//             <input 
//               type="file" 
//               ref={fileInputRef} 
//               onChange={handleImageChange} 
//               className="hidden" 
//               accept="image/*"
//             />
//           </button>
          
//           <textarea
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             onKeyPress={handleKeyPress}
//             placeholder="Type your message..."
//             className="block w-full font-bold text-sm dark:bg-gray-900 text-[#6079F6] pl-6 pr-3 py-3 bg-[#ECF0F3] cursor-pointer rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//             rows="1"
//           />
          
//           <button 
//             onClick={handleSend}
//             className="bg-blue-600 font-bold text-white rounded-3xl px-4 py-2 hover:bg-blue-700 transition-colors"
//           >
//             Send
//           </button>
//         </div>
//       </div>
//     </div>


//         </TabPanel>
//       </Tabs>
//     </div>
//   );
// };

// export default Account;