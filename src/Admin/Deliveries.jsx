import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiInfo, FiList, FiTrash2, FiXCircle, FiTruck, FiCopy, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const DeliveriesSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-8">
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-600 rounded-lg mb-3"></div>
          <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
        </div>
      ))}
    </div>
    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
      <div className="relative w-full md:w-80">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <div className="flex gap-4 flex-wrap">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-10 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
        ))}
      </div>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {['ID', 'Name', 'Email', 'Phone', 'Status', 'Completed', 'Actions'].map((header, idx) => (
              <th key={idx} className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Deliveries = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const deliveriesPerPage = 5;

  const computedStats = useMemo(() => {
    const totalDeliveries = deliveries.length;
    const pendingDeliveries = deliveries.filter((d) => d.status === 'PENDING').length;
    const approvedDeliveries = deliveries.filter((d) => d.status === 'APPROVED').length;
    const suspendedDeliveries = deliveries.filter((d) => d.status === 'SUSPENDED').length;
    return {
      totalDeliveries,
      pendingDeliveries,
      approvedDeliveries,
      suspendedDeliveries,
    };
  }, [deliveries]);

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
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleFilterChange = useCallback(
    debounce((value) => {
      setFilter(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const copyToClipboard = useCallback((id) => {
    navigator.clipboard.writeText(id).then(
      () => {
        Swal.fire({
          title: 'Success',
          text: 'Delivery ID copied to clipboard!',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
        });
      },
      (err) => {
        console.error('Copy failed:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to copy delivery ID',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
        });
      }
    );
  }, [darkMode]);

  const fetchDeliveries = useCallback(async () => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No authentication token found. Please log in.',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
      });
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    const url = filter === 'all' ? '/api/admin/deliveries' : `/api/admin/deliveries/${filter}`;
    const controller = new AbortController();

    try {
      const response = await api.get(url, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.content || response.data || [];
      setDeliveries(data);
    } catch (error) {
      console.error('Error fetching deliveries:', error.response?.data || error.message);
      setError(
        error.response?.status === 401
          ? 'Unauthorized, please log in'
          : 'Failed to load deliveries'
      );
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [filter, token, navigate, darkMode]);

  const fetchDeliveryById = useCallback(async (id) => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No authentication token found. Please log in.',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
      });
      navigate('/login');
      return;
    }

    const controller = new AbortController();
    try {
      const response = await api.get(`/api/admin/deliveries/${id}`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedDelivery(response.data);
    } catch (error) {
      console.error('Error fetching delivery details:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401
          ? 'Unauthorized, please log in'
          : 'Failed to load delivery details',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    }
    return () => controller.abort();
  }, [token, navigate, darkMode]);

  const updateStatus = useCallback(async (id, action) => {
    const actionText = action === 'approve' ? 'Approve' : action === 'suspend' ? 'Suspend' : 'Delete';
    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#dc2626',
        confirmButtonText: `Yes, ${actionText}!`,
        cancelButtonText: 'Cancel',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
      });
      if (!result.isConfirmed) return;
    }

    try {
      const method = action === 'delete' ? 'delete' : 'put';
      await api[method](`/api/admin/deliveries/${id}/${action}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        title: 'Success',
        text: `Delivery ${actionText.toLowerCase()}d successfully`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
      });
      await fetchDeliveries();
    } catch (error) {
      console.error(`Error ${action} delivery:`, error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401
          ? 'Unauthorized, please log in'
          : `Failed to ${actionText.toLowerCase()} delivery`,
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    }
  }, [fetchDeliveries, token, navigate, darkMode]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(
      (d) =>
        d.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        d.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        d.phone?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [deliveries, debouncedSearchTerm]);

  const indexOfLastDelivery = currentPage * deliveriesPerPage;
  const indexOfFirstDelivery = indexOfLastDelivery - deliveriesPerPage;
  const currentDeliveries = useMemo(() => {
    return filteredDeliveries.slice(indexOfFirstDelivery, indexOfLastDelivery);
  }, [filteredDeliveries, indexOfFirstDelivery, indexOfLastDelivery]);
  const totalPages = Math.ceil(filteredDeliveries.length / deliveriesPerPage);

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
    fetchDeliveries();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchDeliveries]);

  useEffect(() => {
    handleSearchChange(searchTerm);
  }, [searchTerm, handleSearchChange]);

  return (
    <div style={{marginTop:"50px",marginLeft:"250px"}} className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 transition-colors duration-500 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-gray-100 flex items-center gap-3">
            <FiTruck className="text-indigo-600 dark:text-indigo-400" /> Delivery Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Efficiently monitor and manage delivery details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Total Deliveries', value: computedStats.totalDeliveries },
            { title: 'Pending Deliveries', value: computedStats.pendingDeliveries },
            { title: 'Approved Deliveries', value: computedStats.approvedDeliveries },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stat.title}</h3>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-10 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <FiXCircle size={20} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              {['all', 'pending', 'approved', 'suspended'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
                    filter === f
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                  }`}
                >
                  {f === 'all' && <FiList size={18} />}
                  {f === 'pending' && <FiXCircle size={18} />}
                  {f === 'approved' && <FiCheckCircle size={18} />}
                  {f === 'suspended' && <FiTrash2 size={18} />}
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <DeliveriesSkeleton darkMode={darkMode} />
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-red-500 dark:text-red-400 text-lg font-medium">{error}</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <FiTruck className="text-6xl mx-auto mb-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No deliveries found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'No deliveries available for the selected filter'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['ID', 'Name', 'Email', 'Phone', 'Status', 'Completed', 'Actions'].map((header, idx) => (
                      <th
                        key={idx}
                        className="px-6 py-4 text-sm font-semibold text-indigo-600 dark:text-gray-100 uppercase tracking-wider text-center"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentDeliveries.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200"
                    >
                      <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          {d.id}
                          <button
                            onClick={() => copyToClipboard(d.id)}
                            className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                            title="Copy Delivery ID"
                          >
                            <FiCopy size={18} />
                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                              Copy Delivery ID
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300 font-medium">
                        {DOMPurify.sanitize(d.name) || 'N/A'}
                      </td>
                      <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300">
                        {DOMPurify.sanitize(d.email) || 'N/A'}
                      </td>
                      <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300">
                        {DOMPurify.sanitize(d.phone) || 'N/A'}
                      </td>
                      <td className="py-6 px-6 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            d.status === 'APPROVED'
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                              : d.status === 'PENDING'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                          }`}
                        >
                          {d.status === 'APPROVED' ? 'Approved' : d.status === 'PENDING' ? 'Pending' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300">
                        {d.totalCompletedDeliveries || 0}
                      </td>
                      <td className="py-6 px-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => fetchDeliveryById(d.id)}
                            className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200 hover:shadow-md"
                          >
                            <FiInfo size={18} />
                          </button>
                          {d.status !== 'APPROVED' && (
                            <button
                              onClick={() => updateStatus(d.id, 'approve')}
                              className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200 hover:shadow-md"
                            >
                              <FiCheckCircle size={18} />
                            </button>
                          )}
                          {d.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => updateStatus(d.id, 'suspend')}
                              className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200 hover:shadow-md"
                            >
                              <FiXCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => updateStatus(d.id, 'delete')}
                            className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200 hover:shadow-md"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  <FiChevronLeft size={18} /> Previous
                </button>

                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      page === '...' ? 'cursor-default text-gray-500 dark:text-gray-400' : currentPage === page ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                    }`}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  Next <FiChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {selectedDelivery && (
          <Modal onClose={() => setSelectedDelivery(null)} title="Delivery Details" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  Delivery Information
                  <button
                    onClick={() => copyToClipboard(selectedDelivery.id)}
                    className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                    title="Copy Delivery ID"
                  >
                    <FiCopy size={18} />
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                      Copy Delivery ID
                    </span>
                  </button>
                </h4>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">ID:</strong> {selectedDelivery.id || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Name:</strong> {DOMPurify.sanitize(selectedDelivery.name) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Email:</strong> {DOMPurify.sanitize(selectedDelivery.email) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Phone:</strong> {DOMPurify.sanitize(selectedDelivery.phone) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Address:</strong> {DOMPurify.sanitize(selectedDelivery.address) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Status:</strong>{' '}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedDelivery.status === 'APPROVED'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                          : selectedDelivery.status === 'PENDING'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                      }`}
                    >
                      {selectedDelivery.status === 'APPROVED' ? 'Approved' : selectedDelivery.status === 'PENDING' ? 'Pending' : 'Suspended'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Active Orders:</strong> {selectedDelivery.activeOrderDeliveries || 0}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Active Repairs:</strong> {selectedDelivery.activeRepairDeliveries || 0}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Completed:</strong> {selectedDelivery.totalCompletedDeliveries || 0}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedDelivery(null)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Deliveries;