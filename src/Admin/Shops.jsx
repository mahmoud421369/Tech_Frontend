
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiEye, FiCheckCircle, FiXCircle, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiCopy } from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';


const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Skeleton Component for Shops
const ShopsSkeleton = ({ darkMode }) => (
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
        <div key={idx} className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow">
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md mt-4">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        <div className="relative w-full md:w-64">
          <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md mt-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {['ID', 'Name', 'Status', 'Shop Type', 'Actions'].map((header, idx) => (
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
                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
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
  </div>
);

// PaginatedTable Component
const PaginatedTable = ({ data, columns, page, setPage, pageSize, renderRow, emptyMessage, darkMode }) => {
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-6 py-3 text-center font-medium uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
          {paginatedData.map(renderRow)}
          {paginatedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-4 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <FiHome className="text-2xl text-gray-500 dark:text-gray-400" />
                  {emptyMessage}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <FiChevronLeft /> Previous
          </button>
          {getPageNumbers().map((pageNum, idx) => (
            <button
              key={idx}
              onClick={() => typeof pageNum === 'number' && setPage(pageNum)}
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                pageNum === '...' ? 'cursor-default' : page === pageNum ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
              }`}
              disabled={pageNum === '...'}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

// Shop Section Component
const ShopSection = ({ shops, filter, setFilter, search, setSearch, approveShop, suspendShop, deleteShop, viewShop, darkMode, token }) => {
  const [shopPage, setShopPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
      setSearch(value);
      setShopPage(1);
    }, 300),
    [setSearch]
  );

  const computedStats = useMemo(() => {
    const totalShops = shops.length;
    const approvedShops = shops.filter((s) => s.verified).length;
    const suspendedShops = shops.filter((s) => !s.verified).length;
    return { totalShops, approvedShops, suspendedShops };
  }, [shops]);

  const filteredShops = useMemo(() => {
    return shops.filter(
      (shop) =>
        shop.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        shop.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [shops, debouncedSearch]);

  const copyToClipboard = useCallback(
    (id) => {
      navigator.clipboard.writeText(id).then(
        () => {
          Swal.fire({
            title: 'Success',
            text: 'Shop ID copied to clipboard!',
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
            text: 'Failed to copy Shop ID',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
          });
        }
      );
    },
    [darkMode]
  );

  return (
    <section className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Total Shops</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.totalShops}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Approved Shops</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.approvedShops}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Suspended Shops</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.suspendedShops}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setShopPage(1);
          }}
          className="w-full md:w-40 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
        >
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </select>
        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleSearchChange(e.target.value);
            }}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                handleSearchChange('');
                setShopPage(1);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiXCircle />
            </button>
          )}
        </div>
      </div>
      <PaginatedTable
        data={filteredShops}
        columns={['ID', 'Name', 'Status', 'Shop Type', 'Actions']}
        page={shopPage}
        setPage={setShopPage}
        pageSize={5}
        darkMode={darkMode}
        renderRow={(shop) => (
          <tr
            key={shop.id}
            className="text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
          >
            <td className="px-6 py-4 text-sm flex items-center justify-center gap-2">
              {shop.id}
              <button
                onClick={() => copyToClipboard(shop.id)}
                className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Copy Shop ID"
              >
                <FiCopy />
                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                  Copy Shop ID
                </span>
              </button>
            </td>
            <td className="px-6 py-4">{DOMPurify.sanitize(shop.name) || 'N/A'}</td>
            <td className="px-6 py-4">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  shop.verified
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                }`}
              >
                {shop.verified ? 'Approved' : 'Suspended'}
              </span>
            </td>
            <td className="px-6 py-4">{DOMPurify.sanitize(shop.shopType) || 'N/A'}</td>
            <td className="px-6 py-4 flex justify-center gap-2">
              <button
                onClick={() => viewShop(shop.id)}
                className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300"
              >
                <FiEye />
              </button>
              {!shop.verified ? (
                <button
                  onClick={() => approveShop(shop.id)}
                  className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-300"
                >
                  <FiCheckCircle />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => suspendShop(shop.id)}
                    className="p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-all duration-300"
                  >
                    <FiXCircle />
                  </button>
                  <button
                    onClick={() => deleteShop(shop.id)}
                    className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-300"
                  >
                    <FiTrash2 />
                  </button>
                </>
              )}
            </td>
          </tr>
        )}
        emptyMessage="No shops found"
      />
    </section>
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

  const fetchShops = useCallback(async () => {
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
    setLoadingShops(true);
    const controller = new AbortController();
    try {
      let url = '/api/admin/shops';
      if (filter === 'approved') url += '/approved';
      else if (filter === 'suspended') url += '/suspend';
      if (search.trim()) url = `/api/admin/shops/search?query=${encodeURIComponent(search)}`;

      const response = await api.get(url, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.content || response.data || [];
      setShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to fetch shops',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setShops([]);
    } finally {
      setLoadingShops(false);
    }
    return () => controller.abort();
  }, [filter, search, token, navigate, darkMode]);

  const approveShop = useCallback(
    async (id) => {
      try {
        await api.put(`/api/admin/shops/${id}/approve`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          title: 'Success',
          text: 'Shop has been approved.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        fetchShops();
      } catch (error) {
        console.error('Error approving shop:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to approve shop',
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
    },
    [fetchShops, token, navigate, darkMode]
  );

  const suspendShop = useCallback(
    async (id) => {
      try {
        await api.put(`/api/admin/shops/${id}/suspend`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          title: 'Success',
          text: 'Shop has been suspended.',
          icon: 'warning',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        fetchShops();
      } catch (error) {
        console.error('Error suspending shop:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to suspend shop',
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
    },
    [fetchShops, token, navigate, darkMode]
  );

  const deleteShop = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#374151',
        confirmButtonText: 'Yes, delete it!',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });

      if (!result.isConfirmed) return;

      try {
        await api.delete(`/api/admin/shops/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          title: 'Success',
          text: 'Shop has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        fetchShops();
      } catch (error) {
        console.error('Error deleting shop:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401
            ? 'Unauthorized, please log in'
            : `Failed to delete shop: ${error.response?.data?.message || error.message}`,
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
    },
    [fetchShops, token, navigate, darkMode]
  );

  const viewShop = useCallback(
    async (id) => {
      try {
        const response = await api.get(`/api/admin/shops/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSelectedShop(response.data);
      } catch (error) {
        console.error('Error fetching shop:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to fetch shop details',
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
    },
    [token, navigate, darkMode]
  );

  useEffect(() => {
    fetchShops();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchShops]);

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
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
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
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
          });
        }
      );
    }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mt-14 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FiHome /> Shops Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage all the shops, approve or suspend shops, and view details of each
          </p>
        </div>
        {loadingShops ? (
          <ShopsSkeleton darkMode={darkMode} />
        ) : (
          <ShopSection
            shops={shops}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            approveShop={approveShop}
            suspendShop={suspendShop}
            deleteShop={deleteShop}
            viewShop={viewShop}
            darkMode={darkMode}
            token={token}
          />
        )}
        {selectedShop && (
          <Modal
            onClose={() => setSelectedShop(null)}
            title={`Shop Details - ${DOMPurify.sanitize(selectedShop.name)}`}
            darkMode={darkMode}
          >
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  Shop Information
                  <button
                    onClick={() => copyToClipboard(selectedShop.id)}
                    className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    title="Copy Shop ID"
                  >
                    <FiCopy />
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                      Copy Shop ID
                    </span>
                  </button>
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>ID:</strong> {selectedShop.id || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Name:</strong> {DOMPurify.sanitize(selectedShop.name) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Email:</strong> {DOMPurify.sanitize(selectedShop.email) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Phone:</strong> {DOMPurify.sanitize(selectedShop.phone) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Status:</strong> {selectedShop.verified ? 'Approved' : 'Suspended'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Rating:</strong> {selectedShop.rating || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Description:</strong> {DOMPurify.sanitize(selectedShop.description) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Shop Type:</strong> {DOMPurify.sanitize(selectedShop.shopType) || 'N/A'}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedShop(null)}
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

export default Shops;
