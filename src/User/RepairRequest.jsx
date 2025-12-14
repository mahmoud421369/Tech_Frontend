import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiMapPin, FiTruck, FiFileText, FiArrowLeft, FiCreditCard, FiDollarSign, FiSmartphone, FiChevronDown, FiStar, FiUsers, FiZap } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import api from '../api';

const RepairRequest = ({ darkMode }) => {
  const { requestId } = useParams();
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
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  const deliveryMethods = [
    { value: 'HOME_DELIVERY', label: 'Home Delivery', icon: <FiTruck /> },
    { value: 'PICKUP', label: 'Store Pickup', icon: <FaStore /> },
    { value: 'SHOP_VISIT', label: 'Drop Off', icon: <FiArrowLeft /> },
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
        text: 'Failed to load addresses!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [token]);

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
    fetchAddresses().finally(() => setIsLoading(false));
  }, [fetchAddresses, requestId, navigate]);

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
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      position: 'top',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });
    if (!confirm.isConfirmed) return;

    try {
      if (formData.paymentMethod === 'CREDIT_CARD') {
        const paymentResponse = await api.post(`/api/payments/repair/card/${requestId}`, {}, {
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
        title: 'Confirmed!',
        text: 'Repair request confirmed!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
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
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16`}>
       
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl w-96 animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-full animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-5/6 animate-pulse"></div>
                <div className="flex gap-3">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex-1 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-32 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-6 pt-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

       
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 shadow-xl animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
              <div className="flex gap-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex-1"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pt-16`}>
     
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
           
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Repair <span className="underline decoration-lime-500 decoration-4">with ease</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                Fast, reliable repair services. Choose your delivery, payment, and get it fixed in no time.
              </p>

             
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="text"
                  placeholder="Enter device issue..."
                  className="flex-1 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500 outline-none"
                />
                <button className="px-6 py-3 bg-lime-500 text-black font-semibold rounded-xl hover:bg-lime-400 transition shadow-md">
                  Get Quote
                </button>
              </div>

              
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiZap /> 98.5%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fix rate</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiUsers /> 5K+
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Repairs/month</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => <FiStar key={i} fill="currentColor" />)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">4.8 Rating</p>
                </div>
              </div>
            </div>

           
            <div className="relative hidden md:block">
              <div className="relative w-full h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-teal-100 dark:from-lime-900 dark:to-teal-900 rounded-3xl blur-3xl opacity-50"></div>

                <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 transform-gpu overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-8 bg-lime-500 rounded w-16"></div>
                  </div>
                </div>

                <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 transform-gpu overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
                        <FiFileText className="text-white text-lg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
                  <div className="p-4">
                    <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <FiTruck className="text-white text-2xl" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/account')}
          className="inline-flex items-center text-lime-600 dark:text-lime-400 font-semibold mb-8 hover:text-lime-800 dark:hover:text-lime-300 transition-all group"
        >
          <FiArrowLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Back to Account
        </button>

        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-6 flex items-center gap-2">
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
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500 focus:outline-none transition flex justify-between items-center"
                >
                  <span className="flex items-center gap-2">
                    <FiMapPin />
                    {formData.deliveryAddress
                      ? (() => {
                          const addr = addresses.find(a => a.id === formData.deliveryAddress);
                          return addr ? `${addr.street}, ${addr.building}, ${addr.city}, ${addr.state}` : 'Select an address';
                        })()
                      : 'Select an address'}
                  </span>
                  <FiChevronDown className={`transition-transform ${dropdownOpen.address ? 'rotate-180' : ''}`} />
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
                        className="px-4 py-2 hover:bg-lime-100 dark:hover:bg-lime-900 cursor-pointer flex items-center gap-2 text-gray-800 dark:text-gray-100"
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
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500 focus:outline-none transition flex justify-between items-center"
                >
                  <span className="flex items-center gap-2">
                    {deliveryMethods.find(m => m.value === formData.deliveryMethod)?.icon || <FiTruck />}
                    {deliveryMethods.find(m => m.value === formData.deliveryMethod)?.label || 'Select delivery method'}
                  </span>
                  <FiChevronDown className={`transition-transform ${dropdownOpen.delivery ? 'rotate-180' : ''}`} />
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
                        className="px-4 py-2 hover:bg-lime-100 dark:hover:bg-lime-900 cursor-pointer flex items-center gap-2 text-gray-800 dark:text-gray-100"
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
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500 focus:outline-none transition flex justify-between items-center"
                >
                  <span className="flex items-center gap-2">
                    {paymentMethods.find(m => m.value === formData.paymentMethod)?.icon || <FiCreditCard />}
                    {paymentMethods.find(m => m.value === formData.paymentMethod)?.label || 'Select payment method'}
                  </span>
                  <FiChevronDown className={`transition-transform ${dropdownOpen.payment ? 'rotate-180' : ''}`} />
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
                        className="px-4 py-2 hover:bg-lime-100 dark:hover:bg-lime-900 cursor-pointer flex items-center gap-2 text-gray-800 dark:text-gray-100"
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
                className="flex items-center gap-2 px-6 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition shadow-md font-semibold"
              >
                Confirm Repair
              </button>
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

     
      {/* {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="text-xl">Cookie</div>
              <p>We use cookies to enhance your repair experience. Learn more in our <a href="#" className="underline">Cookie Policy</a>.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCookieBanner(false)} className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition">Accept</button>
              <button onClick={() => setShowCookieBanner(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition">Reject</button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default RepairRequest;