
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiInfo, FiUsers, FiTrash2, FiXOctagon, FiCopy, FiSearch, FiXCircle, FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';


const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const AssignersSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="flex space-x-4 mb-6">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="h-10 w-24 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['Name', 'Email', 'Phone', 'Status', 'Created At', 'Actions'].map((header, idx) => (
              <th key={idx} className="px-6 py-3">
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Assigners = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [assigners, setAssigners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedAssigner, setSelectedAssigner] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

 
  const computedStats = useMemo(() => {
    const totalHandled = assigners.reduce((sum, a) => sum + (a.totalAssignmentsHandled || 0), 0);
    const pending = assigners.reduce((sum, a) => sum + (a.pendingAssignments || 0), 0);
    const verified = assigners.filter((a) => a.status === 'APPROVED').length;
    return {
      totalAssignmentsHandled: totalHandled,
      pendingAssignments: pending,
      verifiedAssigners: verified,
    };
  }, [assigners]);

 
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
          text: 'Assigner ID copied to clipboard!',
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
          text: 'Failed to copy assigner ID',
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

  const fetchAssigners = useCallback(async () => {
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

    setLoading(true);
    setError('');
    const url = filter === 'all' ? '/api/admin/assigners' : `/api/admin/assigners/${filter}`;
    const controller = new AbortController();

    try {
      const response = await api.get(url, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.content || response.data || [];
      setAssigners(data);
    } catch (error) {
      console.error('Error fetching assigners:', error.response?.data || error.message);
      setError(
        error.response?.status === 401
          ? 'Unauthorized, please log in'
          : 'Failed to load assigners'
      );
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setAssigners([]);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [filter, token, navigate, darkMode]);

  const fetchAssignerById = useCallback(async (id) => {
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
      const response = await api.get(`/api/admin/assigners/${id}`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedAssigner(response.data);
    } catch (error) {
      console.error('Error fetching assigner details:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401
          ? 'Unauthorized, please log in'
          : 'Failed to load assigner details',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
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
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${actionText}!`,
        cancelButtonText: 'Cancel',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (!result.isConfirmed) return;
    }

    try {
      const method = action === 'delete' ? 'delete' : 'put';
      await api[method](`/api/admin/assigners/${id}/${action}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        title: 'Success',
        text: `${actionText} assigner successfully`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      await fetchAssigners();
    } catch (error) {
      console.error(`Error ${action} assigner:`, error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401
          ? 'Unauthorized, please log in'
          : `Failed to ${actionText.toLowerCase()} assigner`,
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    }
  }, [token, fetchAssigners, darkMode]);

  const filteredAssigners = assigners.filter(
    (a) =>
      a.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      a.phone?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAssigners = filteredAssigners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssigners.length / itemsPerPage);

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
    fetchAssigners();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchAssigners]);

  useEffect(() => {
    handleSearchChange(searchTerm);
  }, [searchTerm, handleSearchChange]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mt-14 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FiUsers /> Assigners Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage assigner details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Total Assignments Handled</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.totalAssignmentsHandled}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Pending Assignments</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.pendingAssignments}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Verified Assigners</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.verifiedAssigners}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="relative w-full md:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiXCircle />
                </button>
              )}
            </div>
            <div className="flex space-x-4 space-x-reverse">
              {['all', 'pending', 'approved', 'suspended'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-4 py-2 m-2 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 ${
                    filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                  }`}
                >
                  {f === 'all' && <FiList />}
                  {f === 'pending' && <FiXOctagon />}
                  {f === 'approved' && <FiCheckCircle />}
                  {f === 'suspended' && <FiTrash2 />}
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <AssignersSkeleton darkMode={darkMode} />
        ) : error ? (
          <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
        ) : filteredAssigners.length === 0 ? (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-8 text-center">
            <FiUsers className="text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No assigners found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'No assigners available for the selected filter'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400">
                  <tr>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentAssigners.map((a) => (
                    <tr
                      key={a.id}
                      className="text-center text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
                    >
                      <td className="px-6 py-4 text-sm flex items-center justify-center gap-2">
                        {a.id}
                        <button
                          onClick={() => copyToClipboard(a.id)}
                          className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title="Copy Assigner ID"
                        >
                          <FiCopy />
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Copy Assigner ID
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium">{DOMPurify.sanitize(a.name) || 'N/A'}</td>
                      <td className="px-6 py-4">{DOMPurify.sanitize(a.email) || 'N/A'}</td>
                      <td className="px-6 py-4">0{DOMPurify.sanitize(a.phone) || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            a.status === 'APPROVED'
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : a.status === 'PENDING'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {a.status === 'APPROVED' ? 'Approved' : a.status === 'PENDING' ? 'Pending' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(a.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button
                          onClick={() => fetchAssignerById(a.id)}
                          className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300"
                        >
                          <FiInfo />
                        </button>
                        {a.status !== 'APPROVED' && (
                          <button
                            onClick={() => updateStatus(a.id, 'approve')}
                            className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-300"
                          >
                            <FiCheckCircle />
                          </button>
                        )}
                        {a.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => updateStatus(a.id, 'suspend')}
                            className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-300"
                          >
                            <FiXOctagon />
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(a.id, 'delete')}
                          className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-300"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <FiChevronLeft /> Previous
                </button>

                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${
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
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {selectedAssigner && (
          <Modal onClose={() => setSelectedAssigner(null)} title="Assigner Details" darkMode={darkMode}>
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  Assigner Information
                  <button
                    onClick={() => copyToClipboard(selectedAssigner.id)}
                    className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    title="Copy Assigner ID"
                  >
                    <FiCopy />
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                      Copy Assigner ID
                    </span>
                  </button>
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>ID:</strong> {selectedAssigner.id || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Name:</strong> {DOMPurify.sanitize(selectedAssigner.name) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Email:</strong> {DOMPurify.sanitize(selectedAssigner.email) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Phone:</strong> {DOMPurify.sanitize(selectedAssigner.phone) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Status:</strong>{' '}
                  {selectedAssigner.status === 'APPROVED'
                    ? 'Approved'
                    : selectedAssigner.status === 'PENDING'
                    ? 'Pending'
                    : 'Suspended'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Created At:</strong>{' '}
                  {new Date(selectedAssigner.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedAssigner(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
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

export default Assigners;
