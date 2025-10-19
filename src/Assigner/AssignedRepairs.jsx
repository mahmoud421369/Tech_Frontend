import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiTool, FiHome, FiDollarSign, FiPackage, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const RepairsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-4 sm:p-6">
    <div className="flex justify-between items-center mb-6 sm:mb-8">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 w-1/3 sm:w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 sm:mb-8">
      <div className="h-10 w-full sm:w-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
      <div className="h-10 w-full sm:w-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(6)].map((_, idx) => (
        <div
          key={idx}
          className="p-4 sm:p-5 rounded-xl shadow-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700"
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

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
      const [repairsRes, assignmentLogRes] = await Promise.all([
        api.get(`/api/assigner/delivery/${deliveryId}/repairs`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/api/assigner/assignment-log', {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
          params: { assignmentType: 'REPAIR', deliveryId },
        }),
      ]);

      const repairsData = Array.isArray(repairsRes.data?.content) ? repairsRes.data.content : Array.isArray(repairsRes.data) ? repairsRes.data : [];
      const assignmentLogData = Array.isArray(assignmentLogRes.data?.content) ? assignmentLogRes.data.content : Array.isArray(assignmentLogRes.data) ? assignmentLogRes.data : [];

      const mergedRepairs = [
        ...repairsData,
        ...assignmentLogData.map((log) => ({
          id: log.repairRequestId,
          userId: log.userId,
          userName: log.userName,
          userAddress: log.userAddress,
          shopId: log.shopId,
          shopName: log.shopName,
          shopAddress: log.shopAddress,
          price: log.price,
          status: log.status || 'ASSIGNED',
          createdAt: log.createdAt,
          updatedAt: log.updatedAt,
          assignerId: log.assignerId,
          assignerName: log.assignerName,
          deliveryId: log.deliveryId,
        })),
      ];

      const uniqueRepairs = Array.from(
        new Map(mergedRepairs.map((repair) => [repair.id, repair])).values()
      );

      setRepairs(uniqueRepairs);
      setCurrentPage(1); 
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

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING_PICKUP: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400',
      SUBMITTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400',
      QUOTE_PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400',
      ASSIGNED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-400',
      IN_TRANSIT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-400',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return statusColors[status] || statusColors.default;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const repairsArray = Array.isArray(repairs) ? repairs : [];
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRepairs = repairsArray.length > 0 ? repairsArray.slice(indexOfFirstItem, indexOfLastItem) : [];

  const totalPages = repairsArray.length > 0 ? Math.ceil(repairsArray.length / itemsPerPage) : 0;

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <FiTool size={24} />
              Assigned Repairs by Delivery
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">View repairs assigned to a specific delivery person</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" size={20} />
              <input
                type="text"
                value={deliveryId}
                onChange={(e) => setDeliveryId(e.target.value)}
                placeholder="Enter Delivery ID"
                className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300 text-sm sm:text-base"
              />
            </div>
            <button
              onClick={fetchRepairs}
              className="flex items-center gap-2 px-4 py-2 sm:py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md text-sm sm:text-base"
            >
              <FiSearch size={16} /> Get Repairs
            </button>
          </div>

          {loading ? (
            <RepairsSkeleton darkMode={darkMode} />
          ) : repairs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {currentRepairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="bg-white dark:bg-gray-950 rounded-xl shadow-md p-4 sm:p-5 border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-3 text-indigo-500 dark:text-indigo-400">
                      <FiTool size={16} />
                      <span className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                        Repair #{repair.id?.slice(-8)}
                      </span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-200 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-indigo-500" size={16} />
                        <span>
                          <strong>User ID:</strong> {repair.userId || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiHome className="text-indigo-500" size={16} />
                        <span>
                          <strong>Shop ID:</strong> {repair.shopId || 'N/A'}
                        </span>
                      </div>
                      {repair.userAddress && (
                        <div className="text-xs bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg mt-2 text-indigo-600 dark:text-indigo-400">
                          <strong className="flex items-center gap-2">
                            <FiHome size={16} /> User Address:
                          </strong>{' '}
                          {repair.userAddress.street}, {repair.userAddress.city}, {repair.userAddress.state}
                        </div>
                      )}
                      {repair.shopAddress && (
                        <div className="text-xs bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg mt-2 text-indigo-600 dark:text-indigo-400">
                          <strong className="flex items-center gap-2">
                            <FiHome size={16} /> Shop Address:
                          </strong>{' '}
                          {repair.shopAddress.street}, {repair.shopAddress.city}, {repair.shopAddress.state}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FiTool className="text-indigo-500" size={16} />
                        <span>
                          <strong>Status:</strong>
                          <span
                            className={`inline-block ml-2 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              repair.status
                            )}`}
                          >
                            {repair.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="text-green-500" size={16} />
                        <span>
                          <strong>Price:</strong> {repair.price || 0} EGP
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Created: {formatDate(repair.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm sm:text-base"
                  >
                    <FiChevronLeft size={16} />
                  </button>

                  {getPageNumbers().map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 text-sm sm:text-base ${
                        page === '...' ? 'cursor-default' : currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                      }`}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm sm:text-base"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10 bg-white dark:bg-gray-950 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
              <FiTool className="text-5xl sm:text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
              <p className="text-lg sm:text-xl">No repairs found</p>
              <p className="text-sm sm:text-base mt-2">
                {deliveryId ? 'No repairs assigned to this delivery person' : 'Please enter a delivery ID to view repairs'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignedRepairs;