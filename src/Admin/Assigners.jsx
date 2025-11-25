import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiSearch,
  FiXCircle,
  FiCopy,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiList,
  FiTrash2,
  FiXOctagon,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const AssignersSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="h-10 w-full md:w-80 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6"></div>
      <div className="flex flex-wrap gap-3 mb-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-10 w-28 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        ))}
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'Name', 'Email', 'Phone', 'Status', 'Created At', 'Actions'].map((_, idx) => (
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
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PaginatedTable = ({
  data,
  page,
  setPage,
  pageSize,
  renderRow,
  emptyMessage,
  darkMode,
}) => {
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
      if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  };

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${darkMode ? '#34d399' : '#10b981'}; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#6ee7b7' : '#059669'}; }
        `}
      </style>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {['ID', 'Name', 'Email', 'Phone', 'Status', 'Created At', 'Actions'].map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-gray-100">
            {paginatedData.length > 0 ? (
              paginatedData.map(renderRow)
            ) : (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-4">
                    <FiUsers className="text-5xl text-gray-400 dark:text-gray-500" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition"
            >
              <FiChevronLeft /> Prev
            </button>
            {getPageNumbers().map((num, i) => (
              <button
                key={i}
                onClick={() => typeof num === 'number' && setPage(num)}
                disabled={num === '...'}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  num === '...'
                    ? 'cursor-default text-gray-500 dark:text-gray-400'
                    : page === num
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const Assigners = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [assigners, setAssigners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedAssigner, setSelectedAssigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Sanitized search term
  const sanitizedSearchTerm = useMemo(() => {
    return DOMPurify.sanitize(searchTerm.trim().toLowerCase());
  }, [searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalHandled = assigners.reduce((sum, a) => sum + (a.totalAssignmentsHandled || 0), 0);
    const pending = assigners.reduce((sum, a) => sum + (a.pendingAssignments || 0), 0);
    const verified = assigners.filter(a => a.status === 'APPROVED').length;
    return { totalHandled, pending, verified };
  }, [assigners]);

  // Fetch all assigners once
  const fetchAssigners = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/assigners', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      setAssigners(processed);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load assigners.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setAssigners([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  // Client-side filtering
  const filteredAssigners = useMemo(() => {
    let result = assigners;

    // Status filter
    if (filter !== 'all') {
      const statusMap = {
        pending: 'PENDING',
        approved: 'APPROVED',
        suspended: 'SUSPENDED'
      };
      result = result.filter(a => a.status === statusMap[filter]);
    }

    // Search filter (sanitized)
    if (sanitizedSearchTerm) {
      result = result.filter(a =>
        (a.name || '').toLowerCase().includes(sanitizedSearchTerm) ||
        (a.email || '').toLowerCase().includes(sanitizedSearchTerm) ||
        (a.phone || '').toLowerCase().includes(sanitizedSearchTerm)
      );
    }

    return result;
  }, [assigners, filter, sanitizedSearchTerm]);

  useEffect(() => {
    fetchAssigners();
  }, [fetchAssigners]);

  // Reset page when filtering
  useEffect(() => {
    setPage(1);
  }, [filter, sanitizedSearchTerm]);

  const fetchAssignerById = async (id) => {
    try {
      const { data } = await api.get(`/api/admin/assigners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedAssigner(data);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load details.', icon: 'error' });
    }
  };

  const updateStatus = async (id, action) => {
    const actionText = action === 'approve' ? 'Approve' : action === 'suspend' ? 'Suspend' : 'Delete';
    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Delete Assigner?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete',
      });
      if (!result.isConfirmed) return;
    }

    try {
      const method = action === 'delete' ? 'delete' : 'put';
      const endpoint = action === 'delete' 
        ? `/api/admin/assigners/${id}` 
        : `/api/admin/assigners/${id}/${action}`;

      await api[method](endpoint, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({
        title: 'Success!',
        text: `Assigner ${actionText.toLowerCase()}d successfully.`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 1500,
        showConfirmButton: false
      });

      fetchAssigners();
    } catch (error) {
      Swal.fire({ title: 'Error', text: `Failed to ${actionText.toLowerCase()} assigner.`, icon: 'error' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => Swal.fire({ title: 'Copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Failed', icon: 'error', toast: true, position: 'top-end', timer: 1000 })
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      APPROVED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Approved' },
      PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending' },
      SUSPENDED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Suspended' },
    };
    const s = map[status] || map.PENDING;
    return <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-14">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiUsers className="w-8 h-8" /> Assigners Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage assignment personnel</p>
        </div>

        {loading ? (
          <AssignersSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

            {/* Stats Cards */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Assignments', value: stats.totalHandled },
                  { label: 'Pending', value: stats.pending },
                  { label: 'Verified Assigners', value: stats.verified },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Search + Filters */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Search Bar */}
                <div className="relative max-w-md w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition"
                      >
                        <FiXCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Buttons - Always in one row */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'all', label: 'All', icon: FiList },
                    { key: 'pending', label: 'Pending', icon: FiXOctagon },
                    { key: 'approved', label: 'Approved', icon: FiCheckCircle },
                    { key: 'suspended', label: 'Suspended', icon: FiTrash2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                        filter === key
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="p-6">
              <PaginatedTable
                data={filteredAssigners}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                darkMode={darkMode}
                renderRow={(a) => (
                  <tr key={a.id} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-xs truncate max-w-28">{a.id}</span>
                        <button onClick={() => copyToClipboard(a.id)} className="text-gray-500 hover:text-emerald-600 transition">
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(a.name || 'N/A')}</td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(a.email || 'N/A')}</td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(a.phone || 'N/A')}</td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(a.status)}</td>
                    <td className="px-6 py-4 text-sm text-center">{formatDate(a.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => fetchAssignerById(a.id)}
                          className="px-3 py-1.5 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 transition"
                        >
                          View
                        </button>
                        {a.status !== 'APPROVED' && (
                          <button
                            onClick={() => updateStatus(a.id, 'approve')}
                            className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition"
                          >
                            Approve
                          </button>
                        )}
                        {a.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => updateStatus(a.id, 'suspend')}
                            className="px-3 py-1.5 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(a.id, 'delete')}
                          className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                emptyMessage={
                  sanitizedSearchTerm || filter !== 'all'
                    ? 'No assigners match your filters'
                    : 'No assigners available'
                }
              />
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedAssigner && (
          <Modal onClose={() => setSelectedAssigner(null)} title="Assigner Details" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">Assigner Information</h4>
                  <button onClick={() => copyToClipboard(selectedAssigner.id)} className="text-gray-500 hover:text-emerald-600">
                    <FiCopy className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>ID:</strong> <span className="font-mono">{selectedAssigner.id}</span></p>
                  <p><strong>Total Assignments:</strong> {selectedAssigner.totalAssignmentsHandled || 0}</p>
                  <p><strong>Pending Assignments:</strong> {selectedAssigner.pendingAssignments || 0}</p>
                  <p><strong>Name:</strong> {DOMPurify.sanitize(selectedAssigner.name || 'N/A')}</p>
                  <p><strong>Email:</strong> {DOMPurify.sanitize(selectedAssigner.email || 'N/A')}</p>
                  <p><strong>Phone:</strong> {DOMPurify.sanitize(selectedAssigner.phone || 'N/A')}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedAssigner.status)}</p>
                  <p><strong>Created At:</strong> {formatDate(selectedAssigner.createdAt)}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedAssigner(null)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
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