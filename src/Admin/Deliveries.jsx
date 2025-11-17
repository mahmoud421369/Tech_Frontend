import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTruck,
  FiSearch,
  FiXCircle,
  FiCopy,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiInfo,
  FiList,
  FiTrash2,
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

const DeliveriesSkeleton = ({ darkMode }) => (
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
            {['ID', 'Name', 'Email', 'Phone', 'Status', 'Completed', 'Actions'].map((_, idx) => (
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
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
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
              {['ID', 'Name', 'Email', 'Phone', 'Status', 'Completed', 'Actions'].map((col, i) => (
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
                <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <FiTruck className="text-4xl text-gray-400 dark:text-gray-500" />
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

const Deliveries = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [deliveries, setDeliveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const stats = useMemo(() => {
    const total = deliveries.length;
    const pending = deliveries.filter(d => d.status === 'PENDING').length;
    const approved = deliveries.filter(d => d.status === 'APPROVED').length;
    const suspended = deliveries.filter(d => d.status === 'SUSPENDED').length;
    return { total, pending, approved, suspended };
  }, [deliveries]);

  const fetchDeliveries = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    const url = filter === 'all' ? '/api/admin/deliveries' : `/api/admin/deliveries/status/${filter}`;
    try {
      const { data } = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      setDeliveries(processed);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load deliveries.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate, filter]);

  const fetchDeliveryById = async (id) => {
    try {
      const { data } = await api.get(`/api/admin/deliveries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedDelivery(data);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load details.', icon: 'error' });
    }
  };

  const updateStatus = async (id, action) => {
    const actionText = action === 'approve' ? 'Approve' : action === 'suspend' ? 'Suspend' : 'Delete';
    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Delete Delivery?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete',
      });
      if (!result.isConfirmed) return;
    }

    try {
      const method = action === 'delete' ? 'delete' : 'put';
      const endpoint = action === 'delete' ? `/api/admin/deliveries/${id}` : `/api/admin/deliveries/${id}/${action}`;
      await api[method](endpoint, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Success!', text: `Delivery ${actionText.toLowerCase()}d.`, icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchDeliveries();
    } catch (error) {
      Swal.fire({ title: 'Error', text: `Failed to ${actionText.toLowerCase()}.`, icon: 'error' });
    }
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id).then(
      () => Swal.fire({ title: 'Copied!', text: 'Delivery ID copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Error', text: 'Failed to copy', icon: 'error', toast: true, position: 'top-end', timer: 1000 })
    );
  };

  const filteredDeliveries = useMemo(() => {
    if (!searchTerm.trim()) return deliveries;
    const lower = searchTerm.toLowerCase();
    return deliveries.filter(d =>
      d.name?.toLowerCase().includes(lower) ||
      d.email?.toLowerCase().includes(lower) ||
      d.phone?.toLowerCase().includes(lower)
    );
  }, [deliveries, searchTerm]);

  const getStatusBadge = (status) => {
    const map = {
      APPROVED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Approved' },
      PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending' },
      SUSPENDED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Suspended' },
    };
    const s = map[status] || map.PENDING;
    return <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-14">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiTruck /> Delivery Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage delivery personnel</p>
        </div>

        {loading ? (
          <DeliveriesSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

            {/* Stats */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Deliveries', value: stats.total, color: 'emerald' },
                  { label: 'Pending', value: stats.pending, color: 'yellow' },
                  { label: 'Approved', value: stats.approved, color: 'green' },
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative max-w-md w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        <FiXCircle />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All', icon: FiList },
                    { key: 'pending', label: 'Pending', icon: FiXCircle },
                    { key: 'approved', label: 'Approved', icon: FiCheckCircle },
                    { key: 'suspended', label: 'Suspended', icon: FiTrash2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                        filter === key
                          ? 'bg-emerald-600 text-white'
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
                data={filteredDeliveries}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                darkMode={darkMode}
                renderRow={(d) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="truncate max-w-32">{d.id}</span>
                        <button onClick={() => copyToClipboard(d.id)} className="text-gray-500 hover:text-emerald-600">
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(d.name) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(d.email) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">0{DOMPurify.sanitize(d.phone) || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(d.status)}</td>
                    <td className="px-6 py-4 text-center">{d.totalCompletedDeliveries || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => fetchDeliveryById(d.id)}
                          className="px-3 py-1.5 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800"
                        >
                          View
                        </button>
                        {d.status !== 'APPROVED' && (
                          <button
                            onClick={() => updateStatus(d.id, 'approve')}
                            className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                          >
                            Approve
                          </button>
                        )}
                        {d.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => updateStatus(d.id, 'suspend')}
                            className="px-3 py-1.5 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(d.id, 'delete')}
                          className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                emptyMessage={searchTerm ? 'No deliveries match your search' : 'No deliveries available'}
              />
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedDelivery && (
          <Modal onClose={() => setSelectedDelivery(null)} title="Delivery Details" darkMode={darkMode}>
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Delivery Information</h4>
                  <button onClick={() => copyToClipboard(selectedDelivery.id)} className="text-gray-500 hover:text-emerald-600">
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <p><strong>ID:</strong> {selectedDelivery.id}</p>
                  <p><strong>Name:</strong> {DOMPurify.sanitize(selectedDelivery.name) || 'N/A'}</p>
                  <p><strong>Email:</strong> {DOMPurify.sanitize(selectedDelivery.email) || 'N/A'}</p>
                  <p><strong>Phone:</strong> 0{DOMPurify.sanitize(selectedDelivery.phone) || 'N/A'}</p>
                  <p><strong>Address:</strong> {DOMPurify.sanitize(selectedDelivery.address) || 'N/A'}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedDelivery.status)}</p>
                  <p><strong>Active Orders:</strong> {selectedDelivery.activeOrderDeliveries || 0}</p>
                  <p><strong>Active Repairs:</strong> {selectedDelivery.activeRepairDeliveries || 0}</p>
                  <p><strong>Completed:</strong> {selectedDelivery.totalCompletedDeliveries || 0}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedDelivery(null)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
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