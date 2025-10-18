
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import debounce from 'lodash/debounce';
import sanitizeHtml from 'sanitize-html';
import {
  FaMobileAlt,
  FaLaptop,
  FaDesktop,
  FaTv,
  FaGamepad,
  FaTabletAlt,
  FaArrowAltCircleRight,
  FaTimesCircle,
  FaClock,
  FaMapMarkedAlt,
  FaCheckCircle,
  FaTimes,
  FaInfoCircle,
  FaPhone,
  FaStar,
  FaSearch,
  FaArrowLeft,
  FaSpinner,
  FaStore,
  FaTruck,
  FaCreditCard,
  FaDollarSign,
} from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight, FiList, FiMonitor, FiShoppingBag, FiSmartphone, FiTool } from 'react-icons/fi';
import api from '../api';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const RepairRequest = ({ onApproved, onRejected, darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [addressSearch, setAddressSearch] = useState('');
  const [step, setStep] = useState(1);
  const [shops, setShops] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [description, setDescription] = useState('');
  const [requestStatus, setRequestStatus] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [repairRequestId, setRepairRequestId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [price, setPrice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const shopsPerPage = 6;

  const staticCategories = [
    { id: 1, name: 'Laptop', icon: <FaLaptop size={28} />, color: 'text-indigo-600' },
    { id: 2, name: 'Phone', icon: <FaMobileAlt size={28} />, color: 'text-indigo-600' },
    { id: 3, name: 'Tablet', icon: <FaTabletAlt size={28} />, color: 'text-indigo-600' },
    { id: 4, name: 'Monitor', icon: <FaDesktop size={28} />, color: 'text-indigo-600' },
    { id: 5, name: 'PC', icon: <FaDesktop size={28} />, color: 'text-indigo-600' },
    { id: 6, name: 'Gaming Console', icon: <FaGamepad size={28} />, color: 'text-indigo-600' },
    { id: 7, name: 'TV', icon: <FaTv size={28} />, color: 'text-indigo-600' },
    { id: 8, name: 'Others', icon: <FaArrowAltCircleRight size={28} />, color: 'text-indigo-600' },
  ];

  const deliveryOptions = [
    { id: 1, name: 'Home Delivery', description: 'Pickup & delivery', apiValue: 'HOME_DELIVERY', icon: '🚚' },
    { id: 2, name: 'Drop Off', description: 'Bring device to shop', apiValue: 'SHOP_VISIT', icon: '🏪' },
    { id: 3, name: 'Courier Service', description: 'Courier pickup', apiValue: 'PICKUP', icon: '📦' },
  ];

  const paymentOptions = [
    { id: 1, name: 'Cash on Delivery', desc: 'Pay when the device is repaired', apiValue: 'CASH', icon: '💵' },
    { id: 2, name: 'Credit Card', desc: 'Pay securely online', apiValue: 'CREDIT_CARD', icon: '💳' },
    { id: 3, name: 'Debit Card', desc: 'Pay securely online', apiValue: 'DEBIT_CARD', icon: '💳' },
    { id: 4, name: 'Bank Transfer', desc: 'Pay via bank account', apiValue: 'BANK_TRANSFER', icon: '🏦' },
    { id: 5, name: 'Mobile Wallet', desc: 'Pay with mobile wallet', apiValue: 'MOBILE_WALLET', icon: '💳' },
  ];

  const debouncedSetAddressSearch = useMemo(
    () => debounce((value) => setAddressSearch(value), 300),
    []
  );

  const filteredAddresses = useMemo(
    () =>
      addresses.filter((addr) =>
        `${addr.street} ${addr.city} ${addr.state}`
          .toLowerCase()
          .includes(addressSearch.toLowerCase())
      ),
    [addresses, addressSearch]
  );

  const indexOfLastShop = currentPage * shopsPerPage;
  const indexOfFirstShop = indexOfLastShop - shopsPerPage;
  const currentShops = useMemo(
    () => shops.slice(indexOfFirstShop, indexOfLastShop),
    [shops, indexOfFirstShop, indexOfLastShop]
  );
  const totalPages = Math.ceil(shops.length / shopsPerPage);


  const sanitizeDescription = (input) => {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {}, 
    }).trim();
  };

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
                <FaArrowAltCircleRight size={28} />
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

  const fetchShops = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    try {
      const res = await api.get('/api/users/shops/all', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setShops(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
      Swal.fire({
                        title: 'Error',
                        text: 'could not load shops!',
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

  const fetchAddresses = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    try {
      const res = await api.get('/api/users/addresses', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setAddresses(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Could not load addresses',
          position: 'top',
          confirmButtonColor: '#2563eb',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [token, darkMode]);

  const fetchRepairRequestStatus = useCallback(async () => {
    if (!repairRequestId) return;
    try {
      const res = await api.get(`/api/users/repair-request/${repairRequestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { status, price } = res.data;
      setRequestStatus(status);
      if (status === 'QUOTE_SENT' && price) {
        setPrice(price);
      }
      if (status === 'REJECTED') {
        setPrice(null);
      }
    } catch (err) {
      console.error('Error fetching repair request status:', err.response?.data || err.message);
   Swal.fire({
                     title: 'Error',
                     text: 'failed to load repair request status!',
                     icon: 'error',
                     toast: true,
                     position: 'top-end',
                     showConfirmButton: false,
                     timer: 1500,
                   })
    }
  }, [repairRequestId, token, darkMode]);

  const createRepairRequest = useCallback(
    async (shop) => {
      if (!shop || !selectedCategory) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Please select a device category and shop.',
          position: 'top',
          confirmButtonColor: '#2563eb',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        return false;
      }

      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Login Required',
          text: 'Please log in to create a repair request.',
          position: 'top',
          confirmButtonColor: '#2563eb',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        }).then(() => navigate('/login'));
        return false;
      }

      const sanitizedDescription = sanitizeDescription(description);
      if (!sanitizedDescription) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Description',
          text: 'Please provide a description of the issue.',
          position: 'top',
          confirmButtonColor: '#2563eb',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        setStep(1);
        return false;
      }

      if (sanitizedDescription.length > 1000) {
        Swal.fire({
          icon: 'warning',
          title: 'Description Too Long',
          text: 'Description must be 1000 characters or less.',
          position: 'top',
          confirmButtonColor: '#2563eb',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        setStep(1);
        return false;
      }

      const requestData = {
        deviceCategory: selectedCategory.id.toString(),
        description: sanitizedDescription,
      };

      try {
        setIsLoading(true);
        const res = await api.post(`/api/users/repair-request/${shop.id}`, requestData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        setRepairRequestId(res.data.id);
        Swal.fire({
          title: 'Success',
          text: `Repair request submitted successfully`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        }).then(() => {
          navigate('/');
        });
        return true;
      } catch (err) {
        console.error('Error creating repair request:', err.response?.data || err.message);
       Swal.fire({
                         title: 'Error',
                         text: 'failed to send repair request!',
                         icon: 'error',
                         toast: true,
                         position: 'top-end',
                         showConfirmButton: false,
                         timer: 1500,
                       })
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [token, selectedCategory, description, navigate, darkMode]
  );

  const updateRepairRequest = useCallback(
    async () => {
      if (!repairRequestId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No repair request ID found. Please try again.',
          position: 'top',
          confirmButtonColor: '#2563eb',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        return false;
      }

      if (!selectedAddress) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Address',
          text: 'Please select a delivery address.',
          position: 'top',
          confirmButtonColor: '#2563eb',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        setStep(3);
        return false;
      }

      if (!selectedDelivery || !selectedPayment) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Please select delivery and payment methods.',
          position: 'top',
          confirmButtonColor: '#2563eb',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        setStep(3);
        return false;
      }

      const updateData = {
        deliveryAddress: selectedAddress.id.toString(),
        deliveryMethod: selectedDelivery.apiValue,
        paymentMethod: selectedPayment.apiValue,
      };

      try {
        setIsLoading(true);
        await api.post(`/api/users/repair-request/${repairRequestId}/update`, updateData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        return true;
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
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [repairRequestId, selectedAddress, selectedDelivery, selectedPayment, token, darkMode]
  );

  const handleShopSelect = useCallback(
    async (shop) => {
      setSelectedShop(shop);
      setRequestStatus(null);
      setPrice(null);
      const success = await createRepairRequest(shop);
      if (!success) {
        setSelectedShop(null);
      }
    },
    [createRepairRequest]
  );

  const handlePriceApproval = useCallback(async () => {
    if (!repairRequestId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No repair request ID found. Please try again.',
        position: 'top',
        confirmButtonColor: '#2563eb',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      setStep(2);
      return;
    }

    const success = await updateRepairRequest();
    if (!success) return;

    try {
      await api.post(`/api/users/repair-request/repairs/${repairRequestId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
     Swal.fire({
                       title: 'Approved',
                       text: 'repair request approved!',
                       icon: 'success',
                       toast: true,
                       position: 'top-end',
                       showConfirmButton: false,
                       timer: 1500,
                     }).then(() => {
        onApproved?.();
        navigate('/');
      });
    } catch (err) {
      console.error('Error approving price:', err.response?.data || err.message);
    Swal.fire({
                      title: 'Error',
                      text: 'failed to approve repair request!',
                      icon: 'error',
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 1500,
                    })
    }
  }, [repairRequestId, token, onApproved, navigate, updateRepairRequest, darkMode]);

  const handlePriceRejection = useCallback(async () => {
    if (!repairRequestId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No repair request ID found. Please try again.',
        position: 'top',
        confirmButtonColor: '#2563eb',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      setStep(2);
      return;
    }

    try {
      await api.post(`/api/users/repair-request/${repairRequestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      Swal.fire({
        icon: 'info',
        title: 'Quote Rejected',
        text: 'Please select another shop.',
        position: 'top',
        confirmButtonColor: '#2563eb',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      }).then(() => {
        onRejected?.();
        setPrice(null);
        setRequestStatus(null);
        setRepairRequestId(null);
        setSelectedShop(null);
        setStep(2);
      });
    } catch (err) {
      console.error('Error rejecting price:', err.response?.data || err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to reject quote.',
        position: 'top',
        confirmButtonColor: '#2563eb',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [repairRequestId, token, onRejected, darkMode]);

  const handleDeliverySelect = useCallback((option) => {
    setSelectedDelivery(option);
    setStep(4);
  }, []);

  const handlePaymentSelect = useCallback((option) => {
    setSelectedPayment(option);
  }, []);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleBackStep = useCallback(() => {
    if (step === 0 && requestStatus === 'QUOTE_SENT') {
      setStep(2);
    } else if (step === 0 && requestStatus === 'REJECTED') {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(0);
    } else if (step === 4) {
      setStep(3);
    }
  }, [step, requestStatus]);

  useEffect(() => {
    fetchCategories();
    if (token) {
      fetchShops();
      fetchAddresses();
    }
  }, [fetchCategories, fetchShops, fetchAddresses, token]);

  useEffect(() => {
    if (!repairRequestId) return;

    const interval = setInterval(() => {
      setProgressPercentage((prev) => {
        if (prev >= 100) return 100;
        return prev + 5;
      });
      setEstimatedTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const statusInterval = setInterval(() => {
      fetchRepairRequestStatus();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [repairRequestId, fetchRepairRequestStatus]);

  const steps = useMemo(() => {
    const baseSteps = ['Device Type', 'Select Shop'];
    if (requestStatus === 'QUOTE_SENT') {
      return [...baseSteps, 'Delivery & Address', 'Payment Method'];
    }
    return baseSteps;
  }, [requestStatus]);

  const renderStep = () => {
    return (
      <div className="mb-8 max-w-6xl mx-auto px-6 animate__animated animate__fadeIn">
        {step !== 1 && (
          <button
            onClick={handleBackStep}
            className="mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition-colors duration-200"
            aria-label="Go back to previous step"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleBackStep();
              }
            }}
          >
            <FaArrowLeft className="text-lg" /> Back
          </button>
        )}
        {(() => {
          switch (step) {
            case 0:
              if (!requestStatus || requestStatus === 'PENDING') {
                return (
                  <div className="flex flex-col items-center py-12 animate__animated animate__pulse">
                    <FaClock className="text-indigo-600 dark:text-indigo-400 text-5xl mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Waiting for Shop to Respond...
                    </h2>
                    <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 h-4 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
                      Estimated time: {estimatedTime}s
                    </p>
                  </div>
                );
              }

              if (requestStatus === 'QUOTE_SENT' && price) {
                return (
                  <div className="flex flex-col items-center py-12 animate__animated animate__fadeInUp">
                    <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6">
                      Shop Has Provided a Quote
                    </h2>
                    <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                        <FiTool className="text-indigo-600 dark:text-indigo-400" /> Repair Request Details
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-200">
                        <p className="flex items-center gap-3">
                          <FaStore className="text-indigo-500" />
                          <span className="font-semibold">Shop:</span> {selectedShop?.name || 'N/A'}
                          {selectedShop?.shopAddress && (
                            <span className="text-sm">
                              {' '}
                              ({selectedShop.shopAddress.street}, {selectedShop.shopAddress.city},{' '}
                              {selectedShop.shopAddress.state})
                            </span>
                          )}
                        </p>
                        <p className="flex items-center gap-3">
                          <FaLaptop className="text-indigo-500" />
                          <span className="font-semibold">Device:</span> {selectedCategory?.name || 'N/A'}
                        </p>
                        <p className="flex items-center gap-3">
                          <FaInfoCircle className="text-indigo-500" />
                          <span className="font-semibold">Issue Description:</span>{' '}
                          {description || 'No description provided'}
                        </p>
                        <p className="flex items-center gap-3">
                          <FaDollarSign className="text-indigo-500" />
                          <span className="font-semibold">Quoted Price:</span>{' '}
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{price} EGP</span>
                        </p>
                        <p className="flex items-center gap-3">
                          <FaCheckCircle className="text-green-600 dark:text-green-400" />
                          <span className="font-semibold">Status:</span>{' '}
                          <span className="text-green-600 dark:text-green-400">Quote Sent</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={() => setStep(3)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition transform hover:-translate-y-1 shadow-lg"
                        aria-label="Proceed to delivery and payment"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setStep(3);
                          }
                        }}
                      >
                        <FaTruck /> Proceed to Delivery & Payment
                      </button>
                      <button
                        onClick={handlePriceRejection}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 dark:hover:bg-red-500 transition transform hover:-translate-y-1 shadow-lg"
                        aria-label="Reject shop quote"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handlePriceRejection();
                          }
                        }}
                      >
                        <FaTimesCircle /> Reject Quote
                      </button>
                    </div>
                  </div>
                );
              }

              if (requestStatus === 'REJECTED') {
                return (
                  <div className="flex flex-col items-center py-12 animate__animated animate__fadeInUp">
                    <FaTimesCircle className="text-red-500 dark:text-red-400 text-5xl mb-4" />
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Shop Rejected the Repair Request
                    </p>
                    <button
                      onClick={() => {
                        setRequestStatus(null);
                        setRepairRequestId(null);
                        setSelectedShop(null);
                        setPrice(null);
                        setStep(2);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition transform hover:-translate-y-1 shadow-lg"
                      aria-label="Try another shop"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setRequestStatus(null);
                          setRepairRequestId(null);
                          setSelectedShop(null);
                          setPrice(null);
                          setStep(2);
                        }
                      }}
                    >
                      <FiTool /> Try Another Shop
                    </button>
                  </div>
                );
              }
              return null;

            case 1:
              return (
                <div className=" min-h-screen  animate__animated animate__fadeIn">
                  <h2 className="text-3xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
                    Step 1: Select Device Type
                  </h2>
                  <label className="block text-indigo-600 dark:text-indigo-400 font-semibold mb-3">
                    Problem Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 mb-6 resize-none"
                    rows="5"
                    placeholder="Describe the issue with your device..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    aria-label="Describe the issue with your device"
                    maxLength={1000}
                  ></textarea>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCategory(c);
                            setStep(2);
                          }}
                          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          aria-label={`Select ${c.name} category`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedCategory(c);
                              setStep(2);
                            }
                          }}
                        >
                          <div className={`text-4xl mb-4 flex justify-center items-center ${c.color} dark:text-indigo-400`}>
                            <FiList/>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-center">{c.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );

            case 2:
              return (
                <div className="animate__animated animate__fadeIn">
                  <h2 className="text-3xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
                    Step 2: Select Shop
                  </h2>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentShops.map((shop) => (
                          <div
                            key={shop.id}
                            onClick={() => handleShopSelect(shop)}
                            className={`p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                              selectedShop?.id === shop.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                                : 'bg-white dark:bg-gray-800'
                            }`}
                            aria-label={`Select shop ${shop.name}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleShopSelect(shop);
                              }
                            }}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                {shop.name}
                              </h3>
                              <span className="flex items-center text-yellow-500 dark:text-yellow-400 font-semibold">
                                <FaStar className="mr-1" /> {shop.rating || 'N/A'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-200">
                              <div className="flex items-center gap-2">
                                <FaPhone className="text-green-500 dark:text-green-400" /> 0{shop.phone}
                              </div>
                              <div className="flex items-center gap-2">
                                <FaInfoCircle className="text-indigo-500 dark:text-indigo-400" />{' '}
                                {shop.shopType}
                              </div>
                              <div className="flex items-center gap-2">
                                {shop.verified ? (
                                  <FaCheckCircle className="text-green-600 dark:text-green-400" />
                                ) : (
                                  <FaTimesCircle className="text-red-500 dark:text-red-400" />
                                )}
                                {shop.verified ? 'Verified' : 'Unverified'}
                              </div>
                              <div className="flex items-center gap-2">
                                <FaClock className="text-purple-500 dark:text-purple-400" />
                                {new Date(shop.createdAt).toLocaleDateString('en-US', {
                                  dateStyle: 'medium',
                                })}
                              </div>
                            </div>
                            {shop.description && (
                              <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                                {shop.description}
                              </p>
                            )}
                            {shop.shopAddress && (
                              <p className="mt-2 flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm">
                                <FaMapMarkedAlt className="text-red-500 dark:text-red-400" />
                                {shop.shopAddress.street}, {shop.shopAddress.city},{' '}
                                {shop.shopAddress.state}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center mt-8 gap-4 items-center">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || isLoading}
                          className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                          aria-label="Previous page"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handlePageChange(currentPage - 1);
                            }
                          }}
                        >
                          <FiChevronLeft /> 
                        </button>
                        <span className="text-gray-700 dark:text-gray-200 font-semibold">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages || isLoading}
                          className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-indigo-700 dark:hover:bg-indigo-500 transition shadow-md disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                          aria-label="Next page"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handlePageChange(currentPage + 1);
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

            case 3:
              return (
                <div className=" animate__animated animate__fadeIn">
                  <h2 className="text-3xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
                    Step 3: Delivery & Address
                  </h2>
                  <label className="block text-indigo-600 dark:text-indigo-400 font-semibold mb-3">
                    Choose Delivery Address
                  </label>
                  <div className="relative mb-6">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                    <input
                      type="text"
                      placeholder="Search address..."
                      onChange={(e) => debouncedSetAddressSearch(e.target.value)}
                      className="w-full pl-12 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200"
                      aria-label="Search addresses"
                    />
                    {addressSearch && (
                      <button
                        onClick={() => setAddressSearch('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                        aria-label="Clear address search"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setAddressSearch('');
                          }
                        }}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm max-h-60 overflow-y-auto mb-6">
                      {filteredAddresses.length === 0 ? (
                        <p className="px-4 py-3 text-gray-500 dark:text-gray-300">
                          No addresses found.
                        </p>
                      ) : (
                        filteredAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddress(addr)}
                            className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900 transition duration-200 ${
                              selectedAddress?.id === addr.id ? 'bg-indigo-50 dark:bg-indigo-900' : ''
                            }`}
                            aria-label={`Select address ${addr.street}, ${addr.city}, ${addr.state}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedAddress(addr);
                              }
                            }}
                          >
                            {addr.street}, {addr.city}, {addr.state}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-8 mb-4">
                    Select Delivery Method
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {deliveryOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handleDeliverySelect(option)}
                        className={`p-5 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                          selectedDelivery?.id === option.id
                            ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}
                        aria-label={`Select ${option.name} delivery method`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleDeliverySelect(option);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{option.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{option.name}</h3>
                            <p className="text-gray-500 dark:text-gray-300 text-sm">{option.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 4:
              return (
                <div className=" animate__animated animate__fadeIn">
                  <h2 className="text-3xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
                    Step 4: Payment Method
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handlePaymentSelect(option)}
                        className={`p-5 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                          selectedPayment?.id === option.id
                            ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}
                        aria-label={`Select ${option.name} payment method`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handlePaymentSelect(option);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{option.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{option.name}</h3>
                            <p className="text-gray-500 dark:text-gray-300 text-sm">{option.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handlePriceApproval}
                    disabled={isLoading || !selectedPayment}
                    className={`w-full mt-8 py-3 rounded-xl text-white font-semibold transition transform hover:-translate-y-1 shadow-lg focus:ring-2 focus:ring-green-500 focus:outline-none ${
                      isLoading || !selectedPayment
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 dark:hover:bg-green-500'
                    }`}
                    aria-label="Approve repair request"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ' && selectedPayment) {
                        handlePriceApproval();
                      }
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin" /> Submitting...
                      </span>
                    ) : (
                      'Approve Repair Request'
                    )}
                  </button>
                </div>
              );

            default:
              return null;
          }
        })()}
      </div>
    );
  };

  return (
    <div
      className={`relative mb-0 min-h-screen transition-all duration-300 mt-16 py-5 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-indigo-900 dark:to-gray-800 text-gray-500 dark:text-gray-800 py-12 px-6 shadow-2xl">
             <div className="absolute inset-0 opacity-5 pointer-events-none">
                          <FiTool className="absolute w-20 h-20 bottom-1/3 right-1/5 animate-float-medium  dark:text-blue-500" />
                          <FiShoppingBag className="absolute w-24 h-24 top-1/3 right-1/4 animate-float-slow dark:text-blue-500" />
                          <FiShoppingBag className="absolute w-16 h-16 bottom-1/4 left-1/3 animate-float-fast dark:text-blue-500" />
                          <FiSmartphone className="absolute w-20 h-20 top-10 left-10 animate-float-medium dark:text-blue-500" />
                          <FiSmartphone className="absolute w-28 h-28 bottom-20 right-20 animate-float-slow dark:text-blue-500" />
                          <FiMonitor className="absolute w-18 h-18 top-1/2 left-1/4 animate-float-fast dark:text-blue-500" />
                        </div>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl text-gray-800 dark:text-white font-extrabold tracking-tight mb-3 animate__animated animate__fadeInDown flex justify-center items-center gap-3">
            <FiTool className="text-4xl" /> Book a Repair Request
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 dark:text-white max-w-2xl mx-auto opacity-90 animate__animated animate__fadeInUp">
            Easily schedule a repair for your device by selecting a shop and describing the issue.
          </p>
        </div>
      </div>
      <div className="flex justify-center items-center mb-12 relative max-w-5xl mx-auto mt-10">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 text-center relative z-10">
            <div
              className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-md ${
                step >= i + 1
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {i + 1}
            </div>
            <p
              className={`text-sm sm:text-base mt-3 font-semibold ${
                step >= i + 1
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {s}
            </p>
            {i < steps.length - 1 && (
              <div
                className={`absolute top-6 left-1/2 w-1/2 h-1 transition-all duration-300 ${
                  step > i + 1
                    ? 'bg-indigo-600 dark:bg-indigo-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ transform: 'translateX(50%)' }}
              ></div>
            )}
            {i > 0 && (
              <div
                className={`absolute top-6 right-1/2 w-1/2 h-1 transition-all duration-300 ${
                  step > i
                    ? 'bg-indigo-600 dark:bg-indigo-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ transform: 'translateX(-50%)' }}
              ></div>
            )}
          </div>
        ))}
      </div>
      {renderStep()}
    </div>
  );
};

export default RepairRequest;
