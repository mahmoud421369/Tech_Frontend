import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiMapPin, FiTruck, FiFileText, FiArrowLeft, FiArrowRight, FiCreditCard, FiDollarSign, FiSmartphone, FiChevronDown } from 'react-icons/fi';
import api from '../api';
import { FaStore } from 'react-icons/fa';

const RepairRequest = ({ darkMode }) => {
  const { requestId, mode } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [formData, setFormData] = useState({
    deliveryAddress: '',
    deliveryMethod: '',
    paymentMethod: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState({ address: false, delivery: false, payment: false });

  const deliveryMethods = [
    { value: 'HOME_DELIVERY', label: 'Home Delivery', icon: <FiTruck /> },
    { value: 'PICKUP', label: 'Store Pickup', icon: <FaStore /> },
    { value: 'SHOP_VISIT', label: 'Drop Off', icon: <FiArrowRight /> },
  ];
  const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: <FiDollarSign /> },
    { value: 'CREDIT_CARD', label: 'Credit Card', icon: <FiCreditCard /> },
    { value: 'DEBIT_CARD', label: 'Debit Card', icon: <FiCreditCard /> },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <FiDollarSign /> },
    { value: 'MOBILE_WALLET', label: 'Mobile Wallet', icon: <FiSmartphone /> },
  ];

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await api.get('/api/users/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.content || []);
    } catch (err) {
      console.error('Error fetching addresses:', err.response?.data || err.message);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to load addresses',
        icon: 'error',
        position: 'top',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [darkMode, token]);

  useEffect(() => {
    if (!requestId) {
      Swal.fire({
        title: 'Error',
        text: 'Invalid repair request ID',
        icon: 'error',
        position: 'top',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      }).then(() => navigate('/account'));
      return;
    }
    setIsLoading(true);
    Promise.all([fetchAddresses()]).finally(() => setIsLoading(false));
  }, [fetchAddresses, requestId, darkMode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      title: 'Confirm Repair Request?',
      text: 'Are you sure you want to confirm this repair request with the provided details?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm',
      cancelButtonText: 'No',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      position: 'top',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });
    if (!confirm.isConfirmed) return;

    try {

      if (formData.paymentMethod === 'CREDIT_CARD') {
        const paymentResponse = await api.post(`/api/payments/repair/card/${requestId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { paymentURL } = paymentResponse.data;
        if (paymentURL) {
       
          window.location.href = paymentURL;
          return;
        } else {
          throw new Error('Payment URL not provided in response');
        }
      }

      
      await api.post(`/api/users/repair-request/repairs/${requestId}/confirm`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        title: 'Confirmed',
        text: 'Repair request confirmed successfully.',
        icon: 'success',
        position: 'top',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      navigate('/account');
    } catch (err) {
      console.error('Error confirming repair request:', err.response?.data || err.message);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to confirm repair request or process payment',
        icon: 'error',
        position: 'top',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  };

  const toggleDropdown = (key) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mt-16 dark:bg-gray-900 w-full mx-auto p-6">
      <button
        onClick={() => navigate('/account')}
        className="flex items-center bg-indigo-500 dark:bg-gray-950 dark:text-white gap-2 mb-6 text-white rounded-2xl px-3 py-2 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition"
        aria-label="Back to account"
      >
        <FiArrowLeft /> Back to Account
      </button>
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
          <FiFileText /> Repair Request #{requestId}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Address
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('address')}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition flex justify-between items-center"
                aria-label="Select delivery address"
              >
                <span className="flex items-center gap-2">
                  <FiMapPin />
                  {formData.deliveryAddress
                    ? addresses.find((a) => a.id === formData.deliveryAddress)?.street +
                      ', ' +
                      addresses.find((a) => a.id === formData.deliveryAddress)?.building +
                      ', ' +
                      addresses.find((a) => a.id === formData.deliveryAddress)?.city +
                      ', ' +
                      addresses.find((a) => a.id === formData.deliveryAddress)?.state
                    : 'Select an address'}
                </span>
                <FiChevronDown />
              </button>
              {dropdownOpen.address && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {addresses.map((address) => (
                    <li
                      key={address.id}
                      onClick={() => {
                        setFormData({ ...formData, deliveryAddress: address.id });
                        toggleDropdown('address');
                      }}
                      className="px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer flex items-center gap-2 text-gray-800 dark:text-gray-100"
                      role="option"
                      aria-selected={formData.deliveryAddress === address.id}
                    >
                      <FiMapPin />
                      {address.street}, {address.building}, {address.city}, {address.state}
                    </li>
                  ))}
                  {addresses.length === 0 && (
                    <li className="px-4 py-2 text-gray-500 dark:text-gray-400">No addresses available</li>
                  )}
                </ul>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Method
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('delivery')}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition flex justify-between items-center"
                aria-label="Select delivery method"
              >
                <span className="flex items-center gap-2">
                  {deliveryMethods.find((m) => m.value === formData.deliveryMethod)?.icon || <FiTruck />}
                  {deliveryMethods.find((m) => m.value === formData.deliveryMethod)?.label || 'Select delivery method'}
                </span>
                <FiChevronDown />
              </button>
              {dropdownOpen.delivery && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg">
                  {deliveryMethods.map((method) => (
                    <li
                      key={method.value}
                      onClick={() => {
                        setFormData({ ...formData, deliveryMethod: method.value });
                        toggleDropdown('delivery');
                      }}
                      className="px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer flex items-center gap-2 text-gray-800 dark:text-gray-100"
                      role="option"
                      aria-selected={formData.deliveryMethod === method.value}
                    >
                      {method.icon}
                      {method.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('payment')}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition flex justify-between items-center"
                aria-label="Select payment method"
              >
                <span className="flex items-center gap-2">
                  {paymentMethods.find((m) => m.value === formData.paymentMethod)?.icon || <FiCreditCard />}
                  {paymentMethods.find((m) => m.value === formData.paymentMethod)?.label || 'Select payment method'}
                </span>
                <FiChevronDown />
              </button>
              {dropdownOpen.payment && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg">
                  {paymentMethods.map((method) => (
                    <li
                      key={method.value}
                      onClick={() => {
                        setFormData({ ...formData, paymentMethod: method.value });
                        toggleDropdown('payment');
                      }}
                      className="px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer flex items-center gap-2 text-gray-800 dark:text-gray-100"
                      role="option"
                      aria-selected={formData.paymentMethod === method.value}
                    >
                      {method.icon}
                      {method.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
              aria-label="Confirm repair request"
            >
              Confirm Repair
            </button>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-md"
              aria-label="Cancel update"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairRequest;