import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiChevronDown,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { debounce } from 'lodash';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ShopsSkeleton = ({ darkMode }) => (
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
            {['ID', 'Name', 'Status', 'Shop Type', 'Actions'].map((header, idx) => (
              <th
                key={idx}
                className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                {header}
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
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
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
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px; height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${darkMode ? '#34d399' : '#10b981'};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${darkMode ? '#6ee7b7' : '#059669'};
          }
        `}
      </style>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
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
                    <FiHome className="text-4xl text-gray-400 dark:text-gray-500" />
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              <FiChevronLeft /> Prev
            </button>
            {getPageNumbers().map((pageNum, idx) => (
              <button
                key={idx}
                onClick={() => typeof pageNum === 'number' && setPage(pageNum)}
                disabled={pageNum === '...'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pageNum === '...'
                    ? 'cursor-default text-gray-500 dark:text-gray-400'
                    : page === pageNum
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const Shops = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loadingShops, setLoadingShops] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  const fetchAllShops = useCallback(async (signal) => {
    const { data } = await api.get('/api/admin/shops', { signal, headers: { Authorization: `Bearer ${token}` } });
    return Array.isArray(data) ? data : data?.content || [];
  }, [token]);

  const fetchApprovedShops = useCallback(async (signal) => {
    const { data } = await api.get('/api/admin/shops/approved', { signal, headers: { Authorization: `Bearer ${token}` } });
    return Array.isArray(data) ? data : data?.content || [];
  }, [token]);

  const fetchSuspendedShops = useCallback(async (signal) => {
    const { data } = await api.get('/api/admin/shops/suspend', { signal, headers: { Authorization: `Bearer ${token}` } });
    return Array.isArray(data) ? data : data?.content || [];
  }, [token]);

  const fetchShops = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoadingShops(true);
    const controller = new AbortController();
    try {
      let data;
      if (filter === 'Approved') data = await fetchApprovedShops(controller.signal);
      else if (filter === 'suspend') data = await fetchSuspendedShops(controller.signal);
      else data = await fetchAllShops(controller.signal);
      setShops(data);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load shops.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setShops([]);
    } finally {
      setLoadingShops(false);
    }
    return () => controller.abort();
  }, [filter, token, navigate, fetchAllShops, fetchApprovedShops, fetchSuspendedShops]);

  const approveShop = async (id) => {
    try {
      await api.put(`/api/admin/shops/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Approved!', text: 'Shop approved.', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchShops();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to approve.', icon: 'error' });
    }
  };

  const suspendShop = async (id) => {
    try {
      await api.put(`/api/admin/shops/${id}/suspend`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Suspended!', text: 'Shop suspended.', icon: 'warning', toast: true, position: 'top-end', timer: 1500 });
      fetchShops();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to suspend.', icon: 'error' });
    }
  };

  const deleteShop = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Shop?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/admin/shops/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Deleted!', text: 'Shop removed.', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchShops();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to delete.', icon: 'error' });
    }
  };

  const viewShop = async (id) => {
    try {
      const { data } = await api.get(`/api/admin/shops/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedShop(data);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load shop.', icon: 'error' });
    }
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id).then(
      () => Swal.fire({ title: 'Copied!', text: 'Shop ID copied!', icon: 'success', toast: true, position: 'top-end', timer: 1500 }),
      () => Swal.fire({ title: 'Error', text: 'Failed to copy', icon: 'error', toast: true, position: 'top-end', timer: 1500 })
    );
  };

  const filteredShops = useMemo(() => {
    if (!search.trim()) return shops;
    const lower = search.toLowerCase();
    return shops.filter(s => 
      s.name?.toLowerCase().includes(lower) || 
      s.email?.toLowerCase().includes(lower)
    );
  }, [shops, search]);

  const computedStats = useMemo(() => {
    const total = shops.length;
    const approved = shops.filter(s => s.verified).length;
    const suspended = total - approved;
    return { totalShops: total, approvedShops: approved, suspendedShops: suspended };
  }, [shops]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-14">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiHome /> Shops Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage, approve, suspend, and view shop details</p>
        </div>

        {loadingShops ? (
          <ShopsSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 border-b border-gray-200 dark:border-gray-700">
              {[
                { label: 'Total Shops', value: computedStats.totalShops, color: 'emerald' },
                { label: 'Approved', value: computedStats.approvedShops, color: 'green' },
                { label: 'Suspended', value: computedStats.suspendedShops, color: 'red' },
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter</label>
                  <select
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setSearch(''); }}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Shops</option>
                    <option value="Approved">Approved</option>
                    <option value="suspend">Suspended</option>
                  </select>
                </div>
                <div className="flex-1 relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
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
                data={filteredShops}
                columns={['ID', 'Name', 'Status', 'Shop Type', 'Actions']}
                page={1}
                setPage={() => {}}
                pageSize={5}
                darkMode={darkMode}
                renderRow={(shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="truncate max-w-32">{shop.id}</span>
                        <button onClick={() => copyToClipboard(shop.id)} className="text-gray-500 hover:text-emerald-600">
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(shop.name) || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        shop.verified
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {shop.verified ? 'Approved' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(shop.shopType) || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => viewShop(shop.id)} className="px-3 py-1.5 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800">
                          View
                        </button>
                        {!shop.verified ? (
                          <button onClick={() => approveShop(shop.id)} className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800">
                            Approve
                          </button>
                        ) : (
                          <>
                            <button onClick={() => suspendShop(shop.id)} className="px-3 py-1.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800">
                              Suspend
                            </button>
                            <button onClick={() => deleteShop(shop.id)} className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                emptyMessage="No shops found"
              />
            </div>
          </div>
        )}

        {/* Shop Details Modal */}
        {selectedShop && (
          <Modal onClose={() => setSelectedShop(null)} title="Shop Details" darkMode={darkMode}>
            <div className="space-y-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Shop Info</h4>
                  <button onClick={() => copyToClipboard(selectedShop.id)} className="text-gray-500 hover:text-emerald-600">
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                <p><strong>ID:</strong> {selectedShop.id}</p>
                <p><strong>Name:</strong> {DOMPurify.sanitize(selectedShop.name)}</p>
                <p><strong>Email:</strong> {DOMPurify.sanitize(selectedShop.email)}</p>
                <p><strong>Phone:</strong> {DOMPurify.sanitize(selectedShop.phone) || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={selectedShop.verified ? 'text-green-600' : 'text-red-600'}>{selectedShop.verified ? 'Approved' : 'Suspended'}</span></p>
                <p><strong>Rating:</strong> {selectedShop.rating || 'N/A'}</p>
                <p><strong>Description:</strong> {DOMPurify.sanitize(selectedShop.description) || 'N/A'}</p>
                <p><strong>Shop Type:</strong> {DOMPurify.sanitize(selectedShop.shopType) || 'N/A'}</p>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setSelectedShop(null)} className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
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

export default Shops;