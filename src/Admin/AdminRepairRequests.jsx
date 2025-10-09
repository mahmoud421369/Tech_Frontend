
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTool, FiChevronLeft, FiChevronRight, FiCopy } from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';


const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);



const RepairsSkeleton = ({ darkMode }) => (
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
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'Shop Name', 'Issue', 'Delivery Method', 'Status', 'Payment Method'].map((header, idx) => (
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
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);


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
                  <FiTool className="text-2xl text-gray-500 dark:text-gray-400" />
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


const RepairSection = ({ repairRequests, darkMode }) => {
  const [repairPage, setRepairPage] = useState(1);

  const computedStats = useMemo(() => {
    const totalRepairs = repairRequests.length;
    const pendingRepairs = repairRequests.filter((r) => r.status === 'PENDING').length;
    const completedRepairs = repairRequests.filter((r) => r.status === 'COMPLETED').length;
    return { totalRepairs, pendingRepairs, completedRepairs };
  }, [repairRequests]);

  const copyToClipboard = useCallback(
    (id) => {
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
            text: 'Failed to copy Repair ID',
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
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Total Repairs</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.totalRepairs}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Pending Repairs</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.pendingRepairs}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Completed Repairs</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.completedRepairs}</p>
        </div>
      </div>
      <PaginatedTable
        data={repairRequests}
        columns={['ID', 'Shop Name', 'Issue', 'Delivery Method', 'Status', 'Payment Method']}
        page={repairPage}
        setPage={setRepairPage}
        pageSize={5}
        darkMode={darkMode}
        renderRow={(req) => (
          <tr
            key={req.id}
            className="text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
          >
            <td className="px-6 py-4 text-sm flex items-center justify-center gap-2">
              {req.id}
              <button
                onClick={() => copyToClipboard(req.id)}
                className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Copy Repair ID"
              >
                <FiCopy />
                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                  Copy Repair ID
                </span>
              </button>
            </td>
            <td className="px-6 py-4">{DOMPurify.sanitize(req.shopName) || 'N/A'}</td>
            <td className="px-6 py-4 max-w-xs truncate">{DOMPurify.sanitize(req.description) || 'N/A'}</td>
            <td className="px-6 py-4">{DOMPurify.sanitize(req.deliveryMethod) || 'N/A'}</td>
            <td className="px-6 py-4">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  req.status === 'PENDING'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                    : req.status === 'COMPLETED'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                    : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300'
                }`}
              >
                {req.status}
              </span>
            </td>
            <td className="px-6 py-4">{DOMPurify.sanitize(req.paymentMethod) || 'N/A'}</td>
          </tr>
        )}
        emptyMessage="No repair requests found"
      />
    </section>
  );
};


const RepairRequestsPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [repairRequests, setRepairRequests] = useState([]);
  const [loadingRepairs, setLoadingRepairs] = useState(false);

  const fetchRepairRequests = useCallback(async () => {
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
    setLoadingRepairs(true);
    const controller = new AbortController();
    try {
      const response = await api.get('/api/admin/repair-requests', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.content || response.data || [];
      setRepairRequests(data);
    } catch (error) {
      console.error('Error fetching repair requests:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to fetch repair requests',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setRepairRequests([]);
    } finally {
      setLoadingRepairs(false);
    }
    return () => controller.abort();
  }, [token, navigate, darkMode]);

  useEffect(() => {
    fetchRepairRequests();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchRepairRequests]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mt-14 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FiTool /> Repair Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and view all repair requests of shops
          </p>
        </div>
        {loadingRepairs ? (
          <RepairsSkeleton darkMode={darkMode} />
        ) : (
          <RepairSection repairRequests={repairRequests} darkMode={darkMode} />
        )}
      </div>
    </div>
  );
};

export default RepairRequestsPage;