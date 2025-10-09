
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiTool, FiHome, FiDollarSign, FiPackage, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const RepairsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
    <div className="flex gap-2 mb-6">
      <div className="h-10 w-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
      <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-xl shadow-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AssignedRepairs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [deliveryId, setDeliveryId] = useState('');
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRepairs = useCallback(async () => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No authentication token found. Please log in.',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      navigate('/login');
      return;
    }

    if (!deliveryId) {
      Swal.fire({
        title: 'Warning',
        text: 'Please enter a delivery ID',
        icon: 'warning',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      return;
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      const res = await api.get(`/api/assigner/delivery/${deliveryId}/repairs`, {
        signal: controller.signal,
      });
      const data = res.data.content || res.data || [];
      setRepairs(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching repairs:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch repairs',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          navigate('/login');
        }
        setRepairs([]);
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [deliveryId, darkMode, navigate, token]);

  useEffect(() => {
    return () => {
     
      const controller = new AbortController();
      controller.abort();
    };
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6 transition-colors duration-300 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <FiTool /> Assigned Repairs by Delivery
        </h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <input
          type="text"
          value={deliveryId}
          onChange={(e) => setDeliveryId(e.target.value)}
          placeholder="Enter Delivery ID"
          className="w-full max-w-xs px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
        />
        <button
          onClick={fetchRepairs}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
        >
          <FiSearch /> Get Repairs
        </button>
      </div>

      {loading ? (
        <RepairsSkeleton darkMode={darkMode} />
      ) : repairs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repairs.map((repair) => (
            <div
              key={repair.id}
              className="bg-white dark:bg-gray-950 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3 text-indigo-500 dark:text-indigo-400">
                <FiPackage />{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Repair #{repair.id.slice(0, 8)}
                </span>
              </div>
              <div className="text-gray-700 dark:text-gray-200 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FiUser className="text-indigo-500" /> User ID: {repair.userId}
                </div>
                <div className="flex items-center gap-2">
                  <FiHome className="text-indigo-500" /> Shop ID: {repair.shopId}
                </div>
                {repair.userAddress && (
                  <div className="text-xs bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg mt-2 text-indigo-600 dark:text-indigo-400">
                    <strong className="flex items-center gap-2">
                      <FiHome /> User Address:
                    </strong>{' '}
                    {repair.userAddress.street}, {repair.userAddress.city}, {repair.userAddress.state}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FiTool className="text-indigo-500" /> Status:{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      repair.status === 'COMPLETED'
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        : repair.status === 'SUBMITTED' || repair.status === 'QUOTE_PENDING'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {repair.status === 'SUBMITTED'
                      ? 'Submitted'
                      : repair.status === 'QUOTE_PENDING'
                      ? 'Pending Quote'
                      : repair.status === 'COMPLETED'
                      ? 'Completed'
                      : repair.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiDollarSign className="text-green-500" /> Price: {repair.price} EGP
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          <FiPackage className="text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
          <p className="text-lg">No repairs found</p>
        </div>
      )}
    </div>
  );
};

export default AssignedRepairs;
