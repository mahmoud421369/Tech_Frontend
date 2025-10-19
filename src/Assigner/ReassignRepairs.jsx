import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiTool, FiHome, FiClipboard, FiSearch, FiChevronLeft, FiChevronRight, FiCopy, FiXCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const RepairsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 w-1/3 sm:w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-10 w-full sm:w-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
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
          <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded-xl mt-4"></div>
        </div>
      ))}
    </div>
  </div>
);

const ReassignRepairs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [repairs, setRepairs] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [loading, setLoading] = useState(false);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
    }, 300),
    []
  );

  const copyToClipboard = useCallback((id) => {
    navigator.clipboard.writeText(id).then(
      () => {
        Swal.fire({
          title: 'Success',
          text: 'Repair ID copied to clipboard!',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      },
      (err) => {
        console.error('Copy failed:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to copy repair ID',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    );
  }, [darkMode]);

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

    const controller = new AbortController();
    try {
      setLoading(true);
      const [repairsRes, assignmentLogRes] = await Promise.all([
        api.get('/api/assigner/repairs-for-assignment', {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/api/assigner/assignment-log', {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
          params: { assignmentType: 'REPAIR' },
        }),
      ]);

      const repairsData = repairsRes.data.content || repairsRes.data || [];
      const assignmentLogData = assignmentLogRes.data.content || assignmentLogRes.data || [];

    
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
    } catch (err) {
      console.error('Error fetching repairs:', err.response?.data || err.message);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to load repairs',
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
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [darkMode, navigate, token]);

  const fetchDeliveryPersons = useCallback(async () => {
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

    const controller = new AbortController();
    try {
      const res = await api.get('/api/assigner/delivery-persons', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.content || res.data || [];
      setDeliveryPersons(data);
    } catch (err) {
      console.error('Error fetching delivery persons:', err.response?.data || err.message);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to load delivery persons',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setDeliveryPersons([]);
    }
    return () => controller.abort();
  }, [darkMode, navigate, token]);

  const reassignRepair = useCallback(
    async (deliveryId) => {
      if (!selectedRepair?.id || !deliveryId) {
        Swal.fire({
          title: 'Error',
          text: 'Invalid repair or delivery person ID. Please try again.',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        return;
      }

      try {
        await api.put(
          `/api/assigner/reassign-repair/${selectedRepair.id}`,
          { newDeliveryId: deliveryId, notes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: 'Success',
          text: 'Repair reassigned successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        setSelectedRepair(null);
        setNotes('');
        await fetchRepairs();
      } catch (err) {
        console.error('Error reassigning repair:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to reassign repair',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    },
    [selectedRepair, notes, token, fetchRepairs, darkMode]
  );

  const filteredRepairs = repairs.filter(
    (r) =>
      r.id?.toString().includes(debouncedSearchTerm) ||
      r.userId?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      r.shopId?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      r.status?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      r.userAddress?.street?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      r.userAddress?.city?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      r.shopAddress?.street?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      r.shopAddress?.city?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRepairs = filteredRepairs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);

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

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400',
      ASSIGNED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-400',
      IN_TRANSIT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-400',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return statusColors[status] || statusColors.default;
  };

  useEffect(() => {
    fetchRepairs();
    fetchDeliveryPersons();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchRepairs, fetchDeliveryPersons]);

  useEffect(() => {
    handleSearchChange(searchTerm);
  }, [searchTerm, handleSearchChange]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <FiTool size={24} />
              Reassign Repairs
            </h2>
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" size={20} />
              <input
                type="text"
                placeholder="Search by ID, user, shop, or status..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-2 sm:py-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300 text-sm sm:text-base"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiXCircle size={20} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <RepairsSkeleton darkMode={darkMode} />
          ) : currentRepairs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {currentRepairs.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-gray-950 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FiClipboard className="text-indigo-500" size={20} />
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                            Repair #{r.id ? r.id.slice(-8) : 'N/A'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(r.id)}
                            className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                            title="Copy Repair ID"
                          >
                            <FiCopy size={16} />
                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                              Copy Repair ID
                            </span>
                          </button>
                        </div>
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(r.status)}`}
                        >
                          {r.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                       
                        {r.userAddress && (
                          <div className="text-xs bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <strong className="flex items-center gap-2">
                              <FiHome size={16} /> User Address:
                            </strong>{' '}
                            {r.userAddress.street}, {r.userAddress.city}, {r.userAddress.state}
                          </div>
                        )}
                        {r.shopAddress && (
                          <div className="text-xs bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <strong className="flex items-center gap-2">
                              <FiHome size={16} /> Shop Address:
                            </strong>{' '}
                            {r.shopAddress.street}, {r.shopAddress.city}, {r.shopAddress.state}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FiClipboard className="text-indigo-500" size={16} />
                          <span>Created: {formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRepair(r)}
                        className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md text-sm sm:text-base"
                      >
                        Reassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center mt-6 gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm sm:text-base"
                  >
                    
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
              <FiTool className="text-5xl sm:text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
              <p className="text-base sm:text-lg">No repairs available for reassignment</p>
            </div>
          )}

          {selectedRepair && (
            <Modal onClose={() => setSelectedRepair(null)} title="Reassign Repair" darkMode={darkMode}>
              <div className="space-y-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2 text-base sm:text-lg">
                    Repair Details
                    <button
                      onClick={() => copyToClipboard(selectedRepair.id)}
                      className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                      title="Copy Repair ID"
                    >
                      <FiCopy size={16} />
                      <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                        Copy Repair ID
                      </span>
                    </button>
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Repair ID:</strong> {selectedRepair.id || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>User ID:</strong> {selectedRepair.userId || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Shop ID:</strong> {selectedRepair.shopId || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Status:</strong> {selectedRepair.status?.replace(/_/g, ' ') || 'N/A'}
                  </p>
                  {selectedRepair.userAddress && (
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      <strong>User Address:</strong> {selectedRepair.userAddress.street}, {selectedRepair.userAddress.city},{' '}
                      {selectedRepair.userAddress.state}
                    </p>
                  )}
                  {selectedRepair.shopAddress && (
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      <strong>Shop Address:</strong> {selectedRepair.shopAddress.street}, {selectedRepair.shopAddress.city},{' '}
                      {selectedRepair.shopAddress.state}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Created:</strong> {formatDate(selectedRepair.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reassignment Notes:
                  </label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-sm sm:text-base"
                    placeholder="Add any special instructions or notes for reassignment..."
                    rows="4"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-base sm:text-lg">Choose New Delivery Person:</h3>
                  {deliveryPersons.length === 0 ? (
                    <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                      <p className="text-sm sm:text-base">No delivery persons available</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {deliveryPersons.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => reassignRepair(d.id)}
                          className="block w-full text-left p-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg transition-all duration-300 border border-indigo-200 dark:border-indigo-700"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            {d.name || 'Unknown Name'}
                            {!d.id && <span className="text-red-500 text-xs ml-2">(Invalid ID)</span>}
                          </div>
                          <div className="text-sm text-indigo-600 dark:text-indigo-400">
                            ID: {d.id || 'N/A'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Modal>
          )}
      </div>
    </div>
    </div>
  );
};

export default ReassignRepairs;