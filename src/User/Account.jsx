import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import debounce from 'lodash/debounce';
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
  FiXCircle,
  FiSend,
  FiClock,
  FiHelpCircle,
  FiShoppingBag,
  FiMonitor,
  FiDollarSign,
} from 'react-icons/fi';
import api from '../api';
import { FaArrowCircleRight, FaDesktop, FaGamepad, FaLaptop, FaMobileAlt, FaTable, FaTv } from 'react-icons/fa';


const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const ProfileSection = ({ userProfile, isEditingProfile, setIsEditingProfile, profileForm, setProfileForm, handleUpdateProfile, handleDeleteAccount, darkMode }) => (
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
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
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
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
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
        <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <FiInfo className="text-indigo-500" /> Account Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FiUser className="text-indigo-500" /> Name
              </p>
              <p className="font-medium text-indigo-600 dark:text-indigo-400">
                {userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}` : 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FiMail className="text-indigo-500" /> Email
              </p>
              <p className="font-medium text-indigo-600 dark:text-indigo-400 break-words">
                {userProfile?.email || 'Not available'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700  p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <FiSmartphone className="text-indigo-500" /> Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FiPhone className="text-indigo-500" /> Phone Number
              </p>
              <p className="font-medium text-indigo-600 dark:text-indigo-400">
                {userProfile?.phone || 'Not available'}
              </p>
            </div>
            <div>
              <p className="font-medium">
                {userProfile?.activate ? (
                  <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold text-xs px-3 py-1 rounded-full">
                    Activated
                  </span>
                ) : (
                  <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 font-semibold text-xs px-3 py-1 rounded-full">
                    Not Activated
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 bg-indigo-600 dark:bg-gray-950 dark:border-gray-700 font-semibold text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-md"
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
);


const AddressesSection = ({ addresses, isAddingAddress, setIsAddingAddress, editingAddressId, setEditingAddressId, addressForm, setAddressForm, handleAddAddress, handleUpdateAddress, handleDeleteAddress, initEditAddress, cancelAddressForm, darkMode }) => (
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
          {editingAddressId ? 'Edit Address' : 'Add New Address'}
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
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
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
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
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
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                placeholder="e.g., 123 Main Street"
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
                onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                placeholder="e.g., Apartment 4B"
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
              onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              rows="3"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              id="isDefault"
            />
            <label
              htmlFor="isDefault"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Set as Default Address
            </label>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
            >
              {editingAddressId ? 'Update Address' : 'Add Address'}
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
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
              : 'bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700'
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
              className="flex items-center bg-white/30 dark:bg-black/30 dark:text-white dark:border-gray-700 text-indigo-600 border-2 gap-1 px-3 py-2  rounded-xl font-bold transition shadow"
            >
              <FiEdit2 /> Edit
            </button>
            <button
              onClick={() => handleDeleteAddress(address.id)}
              className="flex items-center bg-white/30 text-red-600 dark:bg-black/30 dark:text-white dark:border-gray-700 border-2 gap-1 px-3 py-2  rounded-xl font-bold transition shadow"
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
);


const OrdersSection = ({ orders, ordersPage, setOrdersPage, showOrderDetails, handleCancelOrder, handleTrackOrder, darkMode }) => {
  const itemsPerPage = 3;
  const totalOrdersPages = Math.ceil(orders.length / itemsPerPage);
  const currentOrders = useMemo(
    () => orders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage),
    [orders, ordersPage]
  );

  return (
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
                <div className="flex justify-between flex-wrap items-center mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                    Order #{order.id.slice(0, 8)}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs border dark:border-gray-700 font-semibold shadow ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        : order.status === 'PENDING'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {order.status === 'COMPLETED' ? 'Completed' : order.status === 'PENDING' ? 'Pending' : 'Cancelled'}
                  </span>
                </div>
           
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FiCalendar className="text-indigo-500" />{' '}
                  {new Date(order.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="text-gray-600 dark:text-gray-400 flex  items-center gap-2">
                  <FiFileText className="text-indigo-500" />   {order.paymentMethod}
                </p>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-bold">
                  <FiDollarSign className="text-indigo-500" />  {order.totalPrice} EGP
                </p>
                {/* {order.orderItems && order.orderItems.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FiBox className="text-indigo-500" /> Items:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                      {order.orderItems.map((item, idx) => (
                        <li key={idx}>
                          {item.productNAme} × {item.quantity} ({item.priceAtCheckout} EGP)
                        </li>
                      ))}
                    </ul>
                  </div>
                )} */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => showOrderDetails(order)}
                    className="flex items-center gap-1 px-3 py-2 dark:bg-black/30 dark:text-white dark:border-gray-700 bg-white/30 text-indigo-600 border-2 rounded-xl transition shadow"
                  >
                    <FiInfo /> 
                  </button>
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="flex items-center gap-1 px-3 py-2 dark:bg-black/30 dark:text-white dark:border-gray-700 bg-white/30 text-red-600 border-2 rounded-xl  transition shadow"
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
  );
};







const RepairsSection = ({ repairRequests, repairsPage, setRepairsPage, handleViewRepairRequest, handleCancelRepairRequest, handleEditRepairRequest, darkMode }) => {
  const itemsPerPage = 3;
  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();
  const totalRepairsPages = Math.ceil(repairRequests.filter((req) => req.id).length / itemsPerPage);
  const currentRepairs = useMemo(
    () => repairRequests
      .filter((req) => req.id)
      .slice((repairsPage - 1) * itemsPerPage, repairsPage * itemsPerPage),
    [repairRequests, repairsPage]
  );

  const statusIcons = {
    SUBMITTED: <FiSend className="text-indigo-500" title="Submitted" />,
    QUOTE_PENDING: <FiClock className="text-indigo-500" title="Pending Quote" />,
    QUOTE_SENT: <FiFileText className="text-indigo-500" title="Quote Sent" />,
    QUOTE_APPROVED: <FiCheckCircle className="text-indigo-500" title="Quote Approved" />,
  };

  const handleApproveRepairRequest = async (requestId) => {
    if (!requestId) {
      Swal.fire({
        title: 'Error',
        text: 'Invalid repair request ID',
        icon: 'error',
        position: 'top',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Approve Repair Request?',
      text: 'Are you sure you want to approve this repair quote? You will be redirected to update delivery and payment details.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'No',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      position: 'top',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.put(`/api/users/repair-request/${requestId}/status`, { status: 'QUOTE_APPROVED' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        title: 'Approved',
        text: 'Repair quote approved successfully. Please update your delivery and payment details.',
        icon: 'success',
        position: 'top',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      navigate(`/repair-request/${requestId}/update`);
    } catch (err) {
      console.error('Error approving repair request:', err.response?.data || err.message);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to approve repair request',
        icon: 'error',
        position: 'top',
         timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  };

  return (
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
                  <FiHash className="text-indigo-500" /> Repair #{req.id.slice(0, 8)}
                </h3>
                <hr className="border-gray-200 dark:border-gray-700 my-3" />
                {/* <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  {statusIcons[req.status] || <FiHelpCircle className="text-indigo-500" title="Unknown Status" />}
                  <span className="sr-only">Status: {req.status}</span>
                </p> */}
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiHome className="text-indigo-500" /> Shop: {req.shopName}
                </p>
             
                <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiAlertTriangle className="text-indigo-500" /> Issue: {req.description}
                </p>
                {req.status === 'QUOTE_SENT' && req.price && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-bold">
                    <FiFileText className="text-indigo-500" /> Quoted Price: {req.price} EGP
                  </p>
                )}
                <div className="mt-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FiFileText className="text-indigo-500" /> Notes
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {req.notes ? req.notes : 'No additional notes'}
                  </p>
                </div>
                <div className="flex gap-3 mt-4 flex-wrap">
                  <button
                    onClick={() => handleViewRepairRequest(req.id)}
                    className="p-2 bg-white/50 dark:bg-black/30 dark:text-white dark:border-gray-700 text-blue-600 border-2 rounded-xl  transition shadow"
                    aria-label={`View details for repair request ${req.id}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleViewRepairRequest(req.id);
                      }
                    }}
                  >
                    <FiInfo />
                  </button>
                  <button
                    onClick={() => handleCancelRepairRequest(req.id)}
                    className="p-2 bg-white/50 dark:bg-black/30 dark:text-white dark:border-gray-700 text-red-600 border-2 rounded-xl  transition shadow"
                    aria-label={`Cancel repair request ${req.id}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCancelRepairRequest(req.id);
                      }
                    }}
                  >
                    <FiXCircle />
                  </button>
                  <button
                    onClick={() => handleEditRepairRequest(req)}
                    className="p-2 bg-white/50 dark:bg-black/30 dark:text-white dark:border-gray-700 text-amber-600 border-2 rounded-xl  transition shadow"
                    aria-label={`Edit repair request ${req.id}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleEditRepairRequest(req);
                      }
                    }}
                  >
                    <FiEdit3 />
                  </button>
                  {req.status === 'QUOTE_SENT' && (
                    <button
                      onClick={() => handleApproveRepairRequest(req.id)}
                      className="p-2 bg-white/50 dark:bg-black/30 dark:text-white dark:border-gray-700 text-emerald-600 border-2 rounded-xl  transition shadow"
                      aria-label={`Approve repair request ${req.id}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleApproveRepairRequest(req.id);
                        }
                      }}
                    >
                      <FiCheckCircle />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setRepairsPage((prev) => Math.max(prev - 1, 1))}
              disabled={repairsPage === 1}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 transition shadow-md"
              aria-label="Previous repairs page"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' && repairsPage !== 1) {
                  setRepairsPage((prev) => Math.max(prev - 1, 1));
                }
              }}
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
              aria-label="Next repairs page"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' && repairsPage !== totalRepairsPages) {
                  setRepairsPage((prev) => Math.min(prev + 1, totalRepairsPages));
                }
              }}
            >
               <FiChevronRight />
            </button>
          </div>
        </>
      )}
    </div>
  );
};



// const NotificationsSection = ({ notifications, setNotifications, fetchNotifications, currentPage, setCurrentPage, searchTerm, setSearchTerm, darkMode }) => {
//   const notificationsPerPage = 5;
//   const debouncedSetSearchTerm = useMemo(() => debounce((value) => setSearchTerm(value), 300), []);

//   const filteredNotifications = useMemo(
//     () => notifications.filter((n) => n.message.toLowerCase().includes(searchTerm.toLowerCase())),
//     [notifications, searchTerm]
//   );

//   const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
//   const startIndex = (currentPage - 1) * notificationsPerPage;
//   const currentNotifications = useMemo(
//     () => filteredNotifications.slice(startIndex, startIndex + notificationsPerPage),
//     [filteredNotifications, currentPage]
//   );

//   const handlePageChange = useCallback((page) => {
//     setCurrentPage(page);
//   }, []);

//   const markAsReadAndRemove = useCallback(async (notificationId) => {
//     try {
//       setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
//       await api.delete(`/api/notifications/users/${notificationId}`);
//       setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
//       Swal.fire({
//         title: 'Success',
//         text: 'Notification removed successfully',
//         icon: 'success',
//         position: 'top',
//         customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
//       });
//     } catch (err) {
//       console.error('Error removing notification:', err.response?.data || err.message);
//       Swal.fire({
//         title: 'Error',
//         text: err.response?.data?.message || 'Failed to remove notification',
//         icon: 'error',
//         position: 'top',
//         customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
//       });
//     }
//   }, [darkMode, setNotifications]);

//   const clearAll = useCallback(async () => {
//     try {
//       await api.delete('/api/notifications/users/clear');
//       setNotifications([]);
//       Swal.fire({
//         title: 'Success',
//         text: 'All notifications cleared successfully',
//         icon: 'success',
//         position: 'top',
//         customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
//       });
//     } catch (err) {
//       console.error('Error clearing notifications:', err.response?.data || err.message);
//       Swal.fire({
//         title: 'Error',
//         text: err.response?.data?.message || 'Failed to clear notifications',
//         icon: 'error',
//         position: 'top',
//         customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
//       });
//     }
//   }, [darkMode]);

//   return (
//     <div className="max-w-3xl mx-auto p-3">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
//           <FiBell /> Notifications
//         </h2>
//       </div>
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Search notifications..."
//           onChange={(e) => debouncedSetSearchTerm(e.target.value)}
//           className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//         />
//       </div>
//       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
//         <ul className="space-y-4">
//           {currentNotifications.length === 0 ? (
//             <li className="text-center text-gray-500 dark:text-gray-400 py-4">No notifications found</li>
//           ) : (
//             currentNotifications.map((n) => (
//               <li
//                 key={n.id}
//                 className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
//                 style={{ fontWeight: n.read ? 'normal' : 'bold' }}
//               >
//                 <div className="flex-1">
//                   <span className="text-xs text-gray-500 dark:text-gray-400">
//                     [{new Date(n.timestamp).toLocaleString('en-US', {
//                       dateStyle: 'medium',
//                       timeStyle: 'short',
//                     })}]
//                   </span>{' '}
//                   <span className="text-gray-800 dark:text-gray-200">{n.message}</span>
//                 </div>
//               </li>
//             ))
//           )}
//         </ul>
//       </div>
//       {totalPages > 1 && (
//         <div className="flex justify-center items-center space-x-2">
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//             aria-label="Previous notifications page"
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter' || e.key === ' ' && currentPage !== 1) {
//                 handlePageChange(currentPage - 1);
//               }
//             }}
//           >
//             <FiChevronLeft />
//           </button>
//           {[...Array(totalPages)].map((_, i) => (
//             <button
//               key={i + 1}
//               onClick={() => handlePageChange(i + 1)}
//               className={`px-3 py-1 rounded-lg ${
//                 currentPage === i + 1
//                   ? 'bg-blue-500 text-white'
//                   : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
//               } transition-colors duration-150`}
//               aria-label={`Go to notifications page ${i + 1}`}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter' || e.key === ' ') {
//                   handlePageChange(i + 1);
//                 }
//               }}
//             >
//               {i + 1}
//             </button>
//           ))}
//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//             aria-label="Next notifications page"
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter' || e.key === ' ' && currentPage !== totalPages) {
//                 handlePageChange(currentPage + 1);
//               }
//             }}
//           >
//             <FiChevronRight />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

const Account = ({ userId, darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [addressForm, setAddressForm] = useState({
    state: '',
    city: '',
    street: '',
    building: '',
    notes: '',
    isDefault: false,
  });
  const [ordersPage, setOrdersPage] = useState(1);
  const [repairsPage, setRepairsPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingRepairs, setIsLoadingRepairs] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoadingProfile(true);
      const res = await api.get('/api/users/profile', { 
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal 
      });
      setUserProfile(res.data);
      setProfileForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        phone: res.data.phone || '',
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching profile:', err.response?.data || err.message);
     Swal.fire({
                   title: 'Error',
                   text: 'failed to load profile details!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    } finally {
      setIsLoadingProfile(false);
    }
    return () => controller.abort();
  }, [darkMode, token]);

  const fetchAddresses = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoadingAddresses(true);
      const res = await api.get('/api/users/addresses', { 
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal 
      });
      setAddresses(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching addresses:', err.response?.data || err.message);
      Swal.fire({
                   title: 'Error',
                   text: 'failed to load addresses!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    } finally {
      setIsLoadingAddresses(false);
    }
    return () => controller.abort();
  }, [darkMode, token]);

  const fetchOrders = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoadingOrders(true);
      const res = await api.get('/api/users/orders', { 
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal 
      });
      console.log(res.data.content || [])
      setOrders(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching orders:', err.response?.data || err.message);
       Swal.fire({
                   title: 'Error',
                   text: 'failed to load orders!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    } finally {
      setIsLoadingOrders(false);
    }
    return () => controller.abort();
  }, [darkMode, token]);

  const fetchRepairRequests = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoadingRepairs(true);
      const res = await api.get('/api/users/repair-request', { 
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal 
      });
    
      const requests = await Promise.all(
        res.data.content.map(async (req) => {
          if (req.status === 'QUOTE_SENT') {
            try {
              const repairRes = await api.get(`/api/users/repair-request/${req.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              return { ...req, price: repairRes.data.price || null };
            } catch (err) {
              console.error(`Error fetching price for repair ${req.id}:`, err.response?.data || err.message);
              return req;
            }
          }
          return req;
        })
      );
      setRepairRequests(requests || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching repair requests:', err.response?.data || err.message);
       Swal.fire({
                   title: 'Error',
                   text: 'failed to load repair requests!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    } finally {
      setIsLoadingRepairs(false);
    }
    return () => controller.abort();
  }, [darkMode, token]);

  const fetchNotifications = useCallback(async () => {
    const controller = new AbortController();
    try {
      setIsLoadingNotifications(true);
      const res = await api.get('/api/notifications/users', { 
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal 
      });
      setNotifications(res.data || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching notifications:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to load notifications',
          icon: 'error',
          position: 'top',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    } finally {
      setIsLoadingNotifications(false);
    }
    return () => controller.abort();
  }, [darkMode, token]);

  const handleViewRepairRequest = useCallback(async (repairId) => {
    try {
      const res = await api.get(`/api/users/repair-request/${repairId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const repair = res.data;

      const statusLabels = {
        SUBMITTED: 'Submitted',
        QUOTE_PENDING: 'Pending Quote',
        QUOTE_SENT: 'Quote Sent',
        QUOTE_APPROVED: 'Quote Approved',
        QUOTE_REJECTED: 'Quote Rejected',
        DEVICE_COLLECTED: 'Device Collected',
        REPAIRING: 'Repairing',
        REPAIR_COMPLETED: 'Repair Completed',
        DEVICE_DELIVERED: 'Device Delivered',
        CANCELLED: 'Cancelled',
        FAILED: 'Failed',
      };

      const deliveryMethodLabels = {
        HOME_DELIVERY: 'Home Delivery',
        PICKUP: 'Store Pickup',
        SHOP_VISIT: 'Drop Off',
      };

      const paymentMethodLabels = {
        CASH: 'Cash',
        CREDIT_CARD: 'Credit Card',
        DEBIT_CARD: 'Debit Card',
        BANK_TRANSFER: 'Bank Transfer',
        MOBILE_WALLET: 'Mobile Wallet',
      };


    

   

      Swal.fire({
        title: `Request Details - ${repair.id}`,
        html: `
          <div style="text-align:left; line-height:1.8;">

            <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Shop</strong> ${repair.shopName || repair.shopId}</p>
            <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Address</strong> ${repair.deliveryAddressDetails || 'Not set'}</p>
            <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Device issue</strong> ${repair.description || 'None'}</p>

            <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Delivery Method</strong> ${
              deliveryMethodLabels[repair.deliveryMethod] || repair.deliveryMethod || 'Not set'
            }</p>
            <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Payment Method</strong> ${
              paymentMethodLabels[repair.paymentMethod] || repair.paymentMethod || 'Not set'
            }</p>
            <p class="flex justify-between items-center bg-white dark:bg-gray-800  dark:text-white px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Price</strong> ${repair.price ? repair.price + ' EGP' : 'Not set'}</p>
            <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Confirmed</strong> ${repair.confirmed ? 'Yes' : 'No'}</p>
            <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Status</strong> ${
              statusLabels[repair.status] || repair.status
            }</p>
          </div>
        `,
        icon: 'info',
        showCloseButton: true,
        confirmButtonText: 'Close',
        confirmButtonColor: '#2563eb',
        position: 'top',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    } catch (err) {
      console.error('Error fetching repair details:', err.response?.data || err.message);
     Swal.fire({
                   title: 'Error',
                   text: 'failed to load repair request details!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
    }
  }, [darkMode, token]);



  const handleCancelRepairRequest = useCallback(async (requestId) => {
    const confirm = await Swal.fire({
      title: 'Cancel Repair Request?',
      text: 'Are you sure you want to cancel this repair request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      position: 'top',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/api/users/repair-request/${requestId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRepairRequests();
  Swal.fire({
              title: 'Cancelled',
              text: 'repair request cancelled!',
              icon: 'success',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 1500,
            })
    } catch (err) {
      console.error('Error cancelling repair request:', err.response?.data || err.message);
    Swal.fire({
                   title: 'Error',
                   text: 'failed to cancel repair request!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
    }
  }, [darkMode, fetchRepairRequests, token]);

  const [categories, setCategories] = useState([]);


  const updateRepairRequest = useCallback(
    async (shopId, requestId, updatedData) => {
      try {
        await api.put(`/api/users/repair-request/${shopId}/${requestId}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
                    title: 'Success',
                    text: 'Repair request updated successfully!',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1500,
                  })
        fetchRepairRequests();
      } catch (err) {
        console.error('Error updating repair request:', err.response?.data || err.message);
      Swal.fire({
                   title: 'Error',
                   text: 'failed to update repair request!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    },
    [darkMode, fetchRepairRequests, token]
  );
  const [isLoading, setIsLoading] = useState(false);



  const staticCategories = [
    { id: 1, name: 'Laptop', icon: <FaLaptop size={28} />, color: 'text-indigo-600' },
    { id: 2, name: 'Phone', icon: <FaMobileAlt size={28} />, color: 'text-indigo-600' },
    { id: 3, name: 'Tablet', icon: <FaTable size={28} />, color: 'text-indigo-600' },
    { id: 4, name: 'Monitor', icon: <FaDesktop size={28} />, color: 'text-indigo-600' },
    { id: 5, name: 'PC', icon: <FaDesktop size={28} />, color: 'text-indigo-600' },
    { id: 6, name: 'Gaming Console', icon: <FaGamepad size={28} />, color: 'text-indigo-600' },
    { id: 7, name: 'TV', icon: <FaTv size={28} />, color: 'text-indigo-600' },
  ];


const fetchCategories = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    try {
      if (!token) throw new Error('Login required');
      const res = await api.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const content = res.data.content || [];
      setCategories(
        content.length === 0
          ? staticCategories
          : content.map((cat) => ({
              id: cat.id,
              name: cat.name,
              icon: staticCategories.find((s) => s.name === cat.name)?.icon || (
                <FaArrowCircleRight size={28} />
              ),
              color: 'text-indigo-600',
            }))
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        setCategories(staticCategories);
    Swal.fire({
                   title: 'Error',
                   text: 'could not load categories!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [token, darkMode]);

useEffect(() => {
  fetchCategories();
}, [fetchCategories]);


const handleEditRepairRequest = useCallback(
  async (request) => {
    const deliveryMethods = ["HOME_DELIVERY", "PICKUP", "SHOP_VISIT"];
    const paymentMethods = ["CASH", "CREDIT_CARD"];
    const userAddresses = addresses || [];

    const makeOptions = (list, selectedValue, getLabel, getValue) =>
      list
        .map((item) => {
          const value = getValue(item);
          const label = getLabel(item);
          const selected = selectedValue === value ? "selected" : "";
          return `<option value="${value}" ${selected}>${label}</option>`;
        })
        .join("");

    const deliveryAddressOptions = makeOptions(
      userAddresses,
      request.deliveryAddress?.id || request.deliveryAddress,
      (a) =>
        `${a.city || ""}, ${a.state || ""}, ${a.street || ""}, ${
          a.building || ""
        }${a.isDefault ? " (Default)" : ""}`,
      (a) => a.id
    );

    const deliveryMethodOptions = makeOptions(
      deliveryMethods,
      request.deliveryMethod,
      (m) => m.replace("_", " "),
      (m) => m
    );

    const deviceCategoryOptions = makeOptions(
      categories,
      request.deviceCategory,
      (c) => c.name,
      (c) => c.name
    );

    const paymentMethodOptions = makeOptions(
      paymentMethods,
      request.paymentMethod,
      (m) => m.replace("_", " "),
      (m) => m
    );

    const { value: formValues } = await Swal.fire({
      title: "Edit Repair Request",
      html: `
        <div class="space-y-3">
          ${[
            { id: "userId", label: "User", value: `${userProfile.first_name} ${userProfile.last_name}`, readonly: true, type: "input" },
            { id: "shopId", label: "Shop", value: request.shopId, readonly: true, type: "input" },
            { id: "deliveryAddress", label: "Delivery Address", options: deliveryAddressOptions, type: "select" },
            { id: "description", label: "Description", value: request.description || "", type: "input" },
            { id: "deliveryMethod", label: "Delivery Method", options: deliveryMethodOptions, type: "select" },
            { id: "deviceCategory", label: "Device Category", options: deviceCategoryOptions, type: "select" },
            { id: "paymentMethod", label: "Payment Method", options: paymentMethodOptions, type: "select" },
          ]
            .map((field) => {
              if (field.type === "input") {
                return `
                  <div class="flex items-center justify-between gap-3">
                    <label for="${field.id}" class="w-1/3 text-sm font-medium ${
                  darkMode ? "text-white" : "text-gray-700"
                }">${field.label}</label>
                    <input id="${field.id}" type="text"
                      class="swal2-input w-2/3 mt-0 ${
                        darkMode
                          ? "bg-gray-800 text-white border-gray-700"
                          : "bg-white text-gray-900 border-gray-300"
                      }"
                      value="${field.value}" ${field.readonly ? "readonly" : ""} />
                  </div>
                `;
              } else {
                return `
                  <div class="flex items-center justify-between gap-3">
                    <label for="${field.id}" class="w-1/3 text-sm font-medium ${
                  darkMode ? "text-white" : "text-gray-700"
                }">${field.label}</label>
                    <select id="${field.id}"
                      class="w-2/3 p-2 rounded border focus:ring-2 focus:ring-indigo-500 ${
                        darkMode
                          ? "bg-gray-800 text-white border-gray-700"
                          : "bg-white text-gray-900 border-gray-300"
                      }">
                      ${field.options}
                    </select>
                  </div>
                `;
              }
            })
            .join("")}
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      position: "top",
      width: 600,
      customClass: {
        popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "",
      },
      preConfirm: () => {
        const getVal = (id) => document.getElementById(id)?.value || "";
        return {
          userId: getVal("userId"),
          shopId: getVal("shopId"),
          deliveryAddress: getVal("deliveryAddress"),
          description: getVal("description"),
          deliveryMethod: getVal("deliveryMethod"),
          deviceCategory: getVal("deviceCategory"),
          paymentMethod: getVal("paymentMethod"),
        };
      },
    });

    if (formValues) {
      await updateRepairRequest(request.shopId, request.id, formValues);
     Swal.fire({
                 title: 'Updated',
                 text: 'repair request updated!',
                 icon: 'success',
                 toast: true,
                 position: 'top-end',
                 showConfirmButton: false,
                 timer: 1500,
               })
    }
  },
  [darkMode, userProfile, addresses, categories, updateRepairRequest]
);



  const updateStatus = useCallback(async (requestId, status) => {
    try {
      await api.put(`/api/users/repair-request/${requestId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRepairRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
    } catch (err) {
      console.error('Error updating status:', err.response?.data || err.message);
     Swal.fire({
                   title: 'Error',
                   text: 'failed to update status!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
    }
  }, [darkMode, token]);

  const handleUpdateProfile = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await api.put('/api/users/profile', profileForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchUserProfile();
        setIsEditingProfile(false);
       Swal.fire({
                   title: 'Updated',
                   text: 'profile updated!',
                   icon: 'success',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      } catch (err) {
        console.error('Error updating profile:', err.response?.data || err.message);
       Swal.fire({
                   title: 'Error',
                   text: 'failed to update profile!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    },
    [darkMode, profileForm, fetchUserProfile, token]
  );

  const showOrderDetails = useCallback((order) => {
    if (!order) {
      Swal.fire({
        title: 'Error',
        text: 'Order data is missing',
        icon: 'error',
        position: 'top',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      return;
    }

    const statusIcons = {
      PENDING: '⏳',
      CONFIRMED: '✅',
      SHIPPED: '📦',
      DELIVERED: '🚚',
      CANCELLED: '❌',
    };

    const statusLabel = `${statusIcons[order.status] || 'ℹ'} ${
      order.status === 'PENDING' ? 'Pending' : order.status === 'CONFIRMED' ? 'Confirmed' : order.status
    }`;

    const formattedDate = new Date(order.createdAt).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const itemsHtml = order.orderItems?.map(
      (item) => `
      <div class="p-2 border-b">
        <p class="flex justify-between items-center bg-white dark:bg-gray-800 px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Product ID</strong> ${item.productId}</p>
        <p class="flex justify-between items-center bg-white dark:bg-gray-800  px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Product</strong> ${item.productNAme}</p>
        <p class="flex justify-between items-center bg-white dark:bg-gray-800  px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Quantity</strong> ${item.quantity}</p>
        <p class="flex justify-between items-center bg-white dark:bg-gray-800  px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Product Price</strong> ${item.price} EGP</p>
        <p class="flex justify-between items-center bg-white dark:bg-gray-800  px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Shop</strong> ${item.shopName}</p>
        <p class="flex justify-between items-center bg-white dark:bg-gray-800  px-3 py-2 rounded-3xl text-sm text-indigo-600 m-2"><strong>Total</strong> ${item.priceAtCheckout} EGP</p>
        
      </div>
    `
    ).join('') || '<p>No items found</p>';

    Swal.fire({
      title: `#${order.id} - Order Details`,
      html: `
        <div style="text-align:left;">
          <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white  px-3 py-2 rounded-3xl text-sm text-blue-600"><strong>Delivery Address ID</strong> ${order.deliveryAddressId || 'Not available'}</p><hr class="border-gray-100 dark:border-gray-700 p-1">
          <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white   px-3 py-2 rounded-3xl text-sm text-blue-600""><strong>Total</strong> ${order.totalPrice} EGP</p><hr class="border-gray-100 dark:border-gray-700 p-1">
          <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white   px-3 py-2 rounded-3xl text-sm text-blue-600""><strong>Order Status</strong> ${statusLabel}</p><hr class="border-gray-100 dark:border-gray-700 p-1">
          <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white   px-3 py-2 rounded-3xl text-sm text-blue-600""><strong>Payment Method</strong> ${order.paymentMethod || 'Not available'}</p><hr class="border-gray-100 dark:border-gray-700 p-1">
          <p class="flex justify-between items-center bg-white dark:bg-gray-800 dark:text-white   px-3 py-2 rounded-3xl text-sm text-blue-600""><strong>Date</strong> ${formattedDate}</p>
          <hr class="my-4 dark:border-gray-700 border"/>
          <h3 class="font-bold text-lg">Order Items</h3><br>
          <div class="max-h-60 overflow-y-auto border rounded p-4  bg-gray-50 dark:bg-gray-900 dark:border-gray-700 rounded-xl">
            ${itemsHtml}
          </div>
        </div>
      `,
      width: 600,
      icon: 'info',
      showCloseButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: '#2563eb',
      position: 'top',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });
  }, [darkMode]);

  const handleTrackOrder = useCallback(async (orderId) => {
    try {
      const res = await api.get(`/api/users/orders/${orderId}/tracking`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        title: 'Tracking Information',
        text: JSON.stringify(res.data, null, 2),
        icon: 'info',
        position: 'top',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    } catch (err) {
      console.error('Error tracking order:', err.response?.data || err.message);
     Swal.fire({
                   title: 'Error',
                   text: 'failed to track order!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
    }
  }, [darkMode, token]);

  const handleCancelOrder = useCallback(async (orderId) => {
    const confirm = await Swal.fire({
      title: 'Cancel Order?',
      text: 'Are you sure you want to cancel this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      position: 'top',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/api/users/orders/${orderId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
       Swal.fire({
                   title: 'Cancelled',
                   text: 'order cancelled!',
                   icon: 'success',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
    } catch (err) {
      console.error('Error cancelling order:', err.response?.data || err.message);
     Swal.fire({
                   title: 'Error',
                   text: 'failed to cancel order!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
    }
  }, [darkMode, fetchOrders, token]);

  const handleAddAddress = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await api.post('/api/users/addresses', addressForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchAddresses();
        setAddressForm({ state: '', city: '', street: '', building: '', notes: '', isDefault: false });
        setIsAddingAddress(false);
         Swal.fire({
                   title: 'Added',
                   text: 'address added!',
                   icon: 'success',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      } catch (err) {
        console.error('Error adding address:', err.response?.data || err.message);
       Swal.fire({
                   title: 'Error',
                   text: 'failed to add address!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    },
    [darkMode, addressForm, fetchAddresses, token]
  );

  const handleUpdateAddress = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await api.put(`/api/users/addresses/${editingAddressId}`, addressForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchAddresses();
        setEditingAddressId(null);
        setAddressForm({ state: '', city: '', street: '', building: '', notes: '', isDefault: false });
       Swal.fire({
                   title: 'Updated',
                   text: 'address updated!',
                   icon: 'success',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      } catch (err) {
        console.error('Error updating address:', err.response?.data || err.message);
      Swal.fire({
                   title: 'Error',
                   text: 'failed to update address!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    },
    [darkMode, editingAddressId, addressForm, fetchAddresses, token]
  );

  const handleDeleteAddress = useCallback(
    async (addressId) => {
      const confirm = await Swal.fire({
        title: 'Delete Address?',
        text: 'Are you sure you want to delete this address?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'No',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#d33',
        position: 'top',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (!confirm.isConfirmed) return;

      try {
        await api.delete(`/api/users/addresses/${addressId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchAddresses();
       Swal.fire({
                   title: 'Deleted',
                   text: 'address deleted!',
                   icon: 'success',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      } catch (err) {
        console.error('Error deleting address:', err.response?.data || err.message);
       Swal.fire({
                   title: 'Error',
                   text: 'failed to delete address!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      }
    },
    [darkMode, fetchAddresses, token]
  );

  const handleDeleteAccount = useCallback(async () => {
    const confirm = await Swal.fire({
      title: 'Delete Account?',
      text: 'Are you sure you want to delete your account? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'No',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      position: 'top',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.delete('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
    Swal.fire({
                   title: 'Deleted',
                   text: 'account deleted!',
                   icon: 'success',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err.response?.data || err.message);
      Swal.fire({
                   title: 'Error',
                   text: 'failed to delete account!',
                   icon: 'error',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 })
    }
  }, [darkMode, navigate, token]);

  const initEditAddress = useCallback((address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      state: address.state,
      city: address.city,
      street: address.street,
      building: address.building,
      notes: address.notes || '',
      isDefault: address.isDefault,
    });
  }, []);

  const cancelAddressForm = useCallback(() => {
    setEditingAddressId(null);
    setIsAddingAddress(false);
    setAddressForm({ state: '', city: '', street: '', building: '', notes: '', isDefault: false });
  }, []);

  useEffect(() => {
    if (!token) {
    Swal.fire({
                   title: 'Authentication Required',
                   text: 'please login in your account or create one!',
                   icon: 'success',
                   toast: true,
                   position: 'top-end',
                   showConfirmButton: false,
                   timer: 1500,
                 }).then(() => navigate('/login'));
      return;
    }
    Promise.all([
      fetchUserProfile(),
      fetchAddresses(),
      fetchOrders(),
      fetchRepairRequests(),
      fetchNotifications(),
    ]).catch((err) => console.error('Error in initial fetch:', err));
  }, [fetchUserProfile, fetchAddresses, fetchOrders, fetchRepairRequests, fetchNotifications, navigate, token, darkMode]);

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'addresses', label: 'Addresses', icon: <FiMapPin /> },
    { id: 'orders', label: 'Orders', icon: <FiBox /> },
    { id: 'repairs', label: 'Repair Requests', icon: <FiTool /> },

  ];

  return (
    <div className={`min-h-screen transition-all duration-300 mt-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="relative bg-gradient-to-r from-white  dark:from-indigo-900 dark:to-gray-800 text-indigo-500 py-12 px-6 shadow-xl">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
                                  <FiTool className="absolute w-20 h-20 bottom-1/3 right-1/5 animate-float-medium text-indigo-400 dark:text-blue-500" />
                                  <FiShoppingBag className="absolute w-24 h-24 top-1/3 right-1/4 animate-float-slow dark:text-blue-500" />
                                  <FiShoppingBag className="absolute w-16 h-16 bottom-1/4 left-1/3 animate-float-fast dark:text-blue-500" />
                                  <FiSmartphone className="absolute w-20 h-20 top-10 left-10 animate-float-medium dark:text-blue-500" />
                                  <FiSmartphone className="absolute w-28 h-28 bottom-20 right-20 animate-float-slow dark:text-blue-500" />
                                  <FiMonitor className="absolute w-18 h-18 top-1/2 left-1/4 animate-float-fast dark:text-blue-500" />
                                </div>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl text-indigo-600 dark:text-white flex items-center justify-center gap-4 sm:text-4xl md:text-5xl font-extrabold">
            <FiUser /> Account
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-200 max-w-xl sm:max-w-2xl mx-auto">
            Manage your profile, addresses, orders, and repair requests with ease.
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
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-indigo-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                  } border-b border-gray-200 dark:border-gray-700 last:border-0`}
                 
                  onClick={() => setActiveSection(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveSection(item.id);
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 overflow-hidden">
            {activeSection === 'profile' && (isLoadingProfile ? <LoadingSpinner /> : <ProfileSection {...{ userProfile, isEditingProfile, setIsEditingProfile, profileForm, setProfileForm, handleUpdateProfile, handleDeleteAccount, darkMode }} />)}
            {activeSection === 'addresses' && (isLoadingAddresses ? <LoadingSpinner /> : <AddressesSection {...{ addresses, isAddingAddress, setIsAddingAddress, editingAddressId, setEditingAddressId, addressForm, setAddressForm, handleAddAddress, handleUpdateAddress, handleDeleteAddress, initEditAddress, cancelAddressForm, darkMode }} />)}
            {activeSection === 'orders' && (isLoadingOrders ? <LoadingSpinner /> : <OrdersSection {...{ orders, ordersPage, setOrdersPage, showOrderDetails, handleCancelOrder, handleTrackOrder, darkMode }} />)}
            {activeSection === 'repairs' && (isLoadingRepairs ? <LoadingSpinner /> : <RepairsSection {...{ repairRequests, repairsPage, setRepairsPage, handleViewRepairRequest, handleCancelRepairRequest, handleEditRepairRequest, darkMode }} />)}
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;