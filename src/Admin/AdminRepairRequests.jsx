import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTool,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiSearch,
  FiXCircle,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const RepairsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="h-10 w-48 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        <div className="h-10 w-full sm:w-80 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'Shop Name', 'Issue', 'Delivery Method', 'Status', 'Payment Method'].map((_, idx) => (
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
              <td className="px-6 py-4"><div className="h-4 w-64 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded-full"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PaginatedTable = ({
  data,
  columns,
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
              {columns.map((col, i) => (
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
            {paginatedData.map(renderRow)}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <FiTool className="text-4xl text-gray-400 dark:text-gray-500" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              <FiChevronLeft /> Prev
            </button>
            {getPageNumbers().map((num, i) => (
              <button
                key={i}
                onClick={() => typeof num === 'number' && setPage(num)}
                disabled={num === '...'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  num === '...'
                    ? 'cursor-default text-gray-500 dark:text-gray-400'
                    : page === num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const RepairRequestsPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [repairRequests, setRepairRequests] = useState([]);
  const [loadingRepairs, setLoadingRepairs] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const fetchRepairRequests = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoadingRepairs(true);
    try {
      let url = '/api/admin/repair-requests';
      if (filter === 'pending') url += '/pending';
      else if (filter === 'completed') url += '/completed';
      if (search.trim()) {
        url = `/api/admin/repair-requests/search?query=${encodeURIComponent(search)}`;
      }

      const { data } = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const processed = Array.isArray(data) ? data : data?.content || [];
      setRepairRequests(processed);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load repair requests.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setRepairRequests([]);
    } finally {
      setLoadingRepairs(false);
    }
  }, [token, navigate, filter, search]);

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id).then(
      () => Swal.fire({ title: 'Copied!', text: 'Repair ID copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Error', text: 'Failed to copy', icon: 'error', toast: true, position: 'top-end', timer: 1000 })
    );
  };

  const filteredRepairs = useMemo(() => {
    let filtered = repairRequests;

    // Filter by status
    if (filter === 'pending') filtered = filtered.filter(r => r.status === 'PENDING');
    if (filter === 'completed') filtered = filtered.filter(r => r.status === 'COMPLETED');

    // Search by shop name or description
    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.shopName?.toLowerCase().includes(lower) ||
        r.description?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [repairRequests, filter, search]);

  const stats = useMemo(() => {
    const total = repairRequests.length;
    const pending = repairRequests.filter(r => r.status === 'PENDING').length;
    const completed = repairRequests.filter(r => r.status === 'COMPLETED').length;
    return { totalRepairs: total, pendingRepairs: pending, completedRepairs: completed };
  }, [repairRequests]);

  useEffect(() => {
    fetchRepairRequests();
  }, [fetchRepairRequests]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-14">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiTool /> Repair Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and view all shop repair requests</p>
        </div>

        {loadingRepairs ? (
          <RepairsSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 border-b border-gray-200 dark:border-gray-700">
              {[
                { label: 'Total Repairs', value: stats.totalRepairs, color: 'emerald' },
                { label: 'Pending', value: stats.pendingRepairs, color: 'yellow' },
                { label: 'Completed', value: stats.completedRepairs, color: 'green' },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters & Search */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter Status</label>
                  <select
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Repairs</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex-1 relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by shop name or issue..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        <FiXCircle />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="p-6">
              <PaginatedTable
                data={filteredRepairs}
                columns={['ID', 'Shop Name', 'Issue', 'Delivery Method', 'Status', 'Payment Method']}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                darkMode={darkMode}
                renderRow={(req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="truncate max-w-32">{req.id}</span>
                        <button onClick={() => copyToClipboard(req.id)} className="text-gray-500 hover:text-emerald-600">
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(req.shopName) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate" title={DOMPurify.sanitize(req.description)}>
                      {DOMPurify.sanitize(req.description) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(req.deliveryMethod) || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        req.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : req.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(req.paymentMethod) || 'N/A'}</td>
                  </tr>
                )}
                emptyMessage="No repair requests found"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairRequestsPage;