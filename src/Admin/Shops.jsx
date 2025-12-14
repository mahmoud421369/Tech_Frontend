import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
     FiHash, FiUser, FiMail, FiPhone,
  FiTag, FiFileText, FiMapPin,  FiStar,
  FiToggleLeft, FiToggleRight, FiExternalLink
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';



import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
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
            {['ID', 'Name', 'Status', 'Shop Type', 'Actions'].map((header) => (
              <th key={header} className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded mx-auto"></div></td>
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
  const paginatedData = React.useMemo(() => {
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
              {columns.map((col) => (
                <th
                  key={col}
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
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              Prev <FiChevronLeft />
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

const Shops = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [allShops, setAllShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pageSize = 5;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sanitizedSearchTerm = useMemo(() => {
    return DOMPurify.sanitize(searchTerm.trim().toLowerCase());
  }, [searchTerm]);

  const fetchAllShops = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/shops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const shopsList = Array.isArray(data) ? data : data?.content || [];
      setAllShops(shopsList);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load shops.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setAllShops([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchAllShops();
  }, [fetchAllShops]);

  const filteredShops = useMemo(() => {
    let filtered = allShops;

    if (filterStatus === 'approved') {
      filtered = filtered.filter(s => s.verified === true);
    } else if (filterStatus === 'suspended') {
      filtered = filtered.filter(s => s.verified === false);
    }

    if (sanitizedSearchTerm) {
      filtered = filtered.filter(s =>
        (s.name || '').toLowerCase().includes(sanitizedSearchTerm) ||
        (s.email || '').toLowerCase().includes(sanitizedSearchTerm)
      );
    }

    return filtered;
  }, [allShops, filterStatus, sanitizedSearchTerm]);

  const stats = useMemo(() => {
    const total = allShops.length;
    const approved = allShops.filter(s => s.verified).length;
    const suspended = total - approved;
    return { total, approved, suspended };
  }, [allShops]);

  const approveShop = async (id) => {
    try {
      await api.put(`/api/admin/shops/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({ title: 'Approved!', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchAllShops();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to approve shop.', icon: 'error' });
    }
  };

  const suspendShop = async (id) => {
    try {
      await api.put(`/api/admin/shops/${id}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({ title: 'Suspended!', icon: 'warning', toast: true, position: 'top-end', timer: 1500 });
      fetchAllShops();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to suspend shop.', icon: 'error' });
    }
  };

  const deleteShop = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Shop?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/admin/shops/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({ title: 'Deleted!', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchAllShops();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to delete shop.', icon: 'error' });
    }
  };

  const viewShop = async (id) => {
    try {
      const { data } = await api.get(`/api/admin/shops/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedShop(data);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load shop details.', icon: 'error' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => Swal.fire({ title: 'Copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Failed', icon: 'error', toast: true, position: 'top-end', timer: 1000 })
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiHome className="w-8 h-8" /> Shops Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage, approve, suspend, and view shop details</p>
        </div>

        {loading ? (
          <ShopsSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 border-b border-gray-200 dark:border-gray-700">
              {[
                { label: 'Total Shops', value: stats.total },
                { label: 'Approved', value: stats.approved },
                { label: 'Suspended', value: stats.suspended },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">

                <div className="relative max-w-md w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
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

                <div ref={dropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Status</label>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-56 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-between text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <span>
                      {filterStatus === 'all' && 'All Shops'}
                      {filterStatus === 'approved' && 'Approved Shops'}
                      {filterStatus === 'suspended' && 'Suspended Shops'}
                    </span>
                    <FiChevronDown className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl">
                      {[
                        { value: 'all', label: 'All Shops' },
                        { value: 'approved', label: 'Approved Shops' },
                        { value: 'suspended', label: 'Suspended Shops' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilterStatus(option.value);
                            setPage(1);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            filterStatus === option.value
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <PaginatedTable
                data={filteredShops}
                columns={['ID', 'Name', 'Status', 'Shop Type', 'Actions']}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
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
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(shop.name || 'N/A')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        shop.verified
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {shop.verified ? 'Approved' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(shop.shopType || 'N/A')}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => viewShop(shop.id)} className="px-3 py-1.5 text-xs bg-emerald-50 border border-gray-200 font-semibold dark:bg-gray-950 dark:border-gray-900 text-blue-700 dark:text-blue-700 rounded   transition">
                          View
                        </button>
                        {!shop.verified ? (
                          <button onClick={() => approveShop(shop.id)} className="px-3 py-1.5 text-xs border border-gray-200 font-semibold bg-green-50 dark:bg-gray-950 dark:border-gray-900 text-green-700 dark:text-green-300 rounded   transition">
                            Approve
                          </button>
                        ) : (
                          <>
                            <button onClick={() => suspendShop(shop.id)} className="px-3 py-1.5 text-xs border border-gray-200 font-semibold bg-yellow-50 dark:bg-gray-950 dark:border-gray-900 text-yellow-700 dark:text-yellow-300 rounded  transition">
                              Suspend
                            </button>
                            <button onClick={() => deleteShop(shop.id)} className="px-3 py-1.5 text-xs border border-gray-200 font-semibold bg-red-50 dark:bg-gray-950 dark:border-gray-900 text-red-700 dark:text-red-300 rounded  transition">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                emptyMessage={
                  sanitizedSearchTerm || filterStatus !== 'all'
                    ? 'No shops match your filters'
                    : 'No shops available'
                }
              />
            </div>
          </div>
        )}

       {selectedShop && (
  <Modal onClose={() => setSelectedShop(null)} title="Shop Details" darkMode={darkMode}>
    <div className="space-y-6 text-sm">
  
      <div className="bg-gray-50 dark:bg-gray-800/70 p-6 rounded-xl rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaStore className="w-5 h-5 text-emerald-600" />
            Shop Information
          </h3>
          <button
            onClick={() => copyToClipboard(selectedShop.id)}
            className="text-gray-500 hover:text-emerald-600 transition"
            title="Copy Shop ID"
          >
            <FiCopy className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <FiHash className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Shop ID</p>
              <p className="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mt-1">
                {selectedShop.id}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiUser className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Name</p>
              <p className="font-medium dark:text-white">{DOMPurify.sanitize(selectedShop.name)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiMail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Email</p>
              <p className='font-medium dark:text-white'>{DOMPurify.sanitize(selectedShop.email)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiPhone className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Phone</p>
              <p className='font-medium dark:text-white'>{selectedShop.phone ? DOMPurify.sanitize(selectedShop.phone) : <span className="text-gray-400">N/A</span>}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FiCheckCircle className={`w-5 h-5 ${selectedShop.verified ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Verification</p>
              <span className={`font-semibold ${selectedShop.verified ? 'text-green-600' : 'text-red-600'}`}>
                {selectedShop.verified ? 'Approved' : 'Suspended'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedShop.activate ? (
              <FiToggleRight className="w-6 h-6 text-emerald-600" />
            ) : (
              <FiToggleLeft className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <p className="text-gray-500 dark:text-gray-400">Status</p>
              <span className={`font-semibold ${selectedShop.activate ? 'text-emerald-600' : 'text-gray-500'}`}>
                {selectedShop.activate ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiStar className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Rating</p>
              <p className="font-medium dark:text-amber-400">{selectedShop.rating || 'No ratings yet'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiTag className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Shop Type</p>
              <p className='font-medium dark:text-white'>{selectedShop.shopType ? DOMPurify.sanitize(selectedShop.shopType) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {selectedShop.description && (
          <div className="mt-5 flex items-start gap-3">
            <FiFileText className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Description</p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">
                {DOMPurify.sanitize(selectedShop.description)}
              </p>
            </div>
          </div>
        )}
      </div>

   
      {selectedShop.shopAddress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiMapPin className="w-5 h-5 text-blue-600" />
              Shop Address {selectedShop.shopAddress.default && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Default</span>}
            </h3>
            <button
              onClick={() => copyToClipboard(selectedShop.shopAddress.fullAddress)}
              className="text-gray-500 hover:text-blue-600 transition"
              title="Copy full address"
            >
              <FiCopy className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Full Address:</strong> {DOMPurify.sanitize(selectedShop.shopAddress.fullAddress)}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><strong>Street:</strong> {selectedShop.shopAddress.street}</p>
              <p><strong>Building:</strong> {selectedShop.shopAddress.building || '—'}</p>
              <p><strong>City:</strong> {selectedShop.shopAddress.city}</p>
              <p><strong>State:</strong> {selectedShop.shopAddress.state}</p>
            </div>
            {selectedShop.shopAddress.notes && (
              <p><strong>Notes:</strong> {DOMPurify.sanitize(selectedShop.shopAddress.notes)}</p>
            )}
            <div className="flex gap-6 text-xs text-gray-500">
              <p>Lat: {selectedShop.shopAddress.latitude.toFixed(6)}</p>
              <p>Lng: {selectedShop.shopAddress.longitude.toFixed(6)}</p>
            </div>
          </div>
        </div>
      )}

      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t dark:border-gray-700">
        <p>Created: {new Date(selectedShop.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(selectedShop.updatedAt).toLocaleString()}</p>
      </div>

      
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={() => setSelectedShop(null)}
          className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
        >
          Close
        </button>
        {/* <button
          onClick={() => window.open(`https://maps.google.com/?q=${selectedShop.shopAddress?.latitude},${selectedShop.shopAddress?.longitude}`, '_blank')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-2"
          disabled={!selectedShop.shopAddress}
        >
          <FiExternalLink className="w-4 h-4" />
          Open in Maps
        </button> */}
      </div>
    </div>
  </Modal>
)}
      </div>
    </div>
  );
};

export default Shops;