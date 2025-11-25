import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCreditCard,
  FiCopy,
  FiSearch,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiDollarSign,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';
import { AdminTransactions } from '.';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const TransactionsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, idx) => (
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
      <div className="h-10 w-96 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6"></div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'User ID', 'Amount', 'Status', 'Date', 'Type'].map((_, idx) => (
              <th key={idx} className="px-6 py-3">
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedData.length > 0 ? (
            paginatedData.map(renderRow)
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center gap-3">
                  <FiCreditCard className="text-5xl text-gray-400 dark:text-gray-600" />
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
  );
};

const TransactionsPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchAllTransactions = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/transactions/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      setTransactions(processed);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load transactions.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const fetchTransactionsByUserId = async (userId) => {
    if (!userId.trim()) {
      fetchAllTransactions();
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(`/api/admin/transactions/${userId.trim()}`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      setTransactions(processed);
    } catch (error) {
      Swal.fire({
        title: 'Not Found',
        text: error.response?.status === 404
          ? 'No transactions found for this user.'
          : 'Failed to fetch transactions.',
        icon: 'info',
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactionsByUserId(searchUserId);
    setPage(1);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => Swal.fire({ title: 'Copied!', text: 'User ID copied to clipboard!', icon: 'success', toast: true, position: 'top-end', timer: 1500 }),
      () => Swal.fire({ title: 'Error', text: 'Failed to copy', icon: 'error' })
    );
  };

  const filteredTransactions = useMemo(() => {
    return transactions;
  }, [transactions]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const completed = transactions.filter(t => t.status === 'COMPLETED').length;
    const pending = transactions.filter(t => t.status === 'PENDING').length;
    const failed = transactions.filter(t => t.status === 'FAILED').length;
    const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    return { total, completed, pending, failed, totalAmount };
  }, [transactions]);

  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      REFUNDED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-14">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiCreditCard /> Transactions Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View and monitor all payment transactions</p>
        </div>

        {loading ? (
          <TransactionsSkeleton darkMode={darkMode} />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <FiCreditCard className="text-3xl text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div> */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <FiDollarSign className="text-3xl text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalAmount.toFixed(2)} EGP</p>
              </div>
            </div>

            {/* Search by User ID */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by User ID (leave empty for all transactions)"
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 focus:outline-none rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchUserId('');
                        fetchAllTransactions();
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600"
                    >
                      <FiXCircle />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  Search User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchUserId('');
                    fetchAllTransactions();
                    setPage(1);
                  }}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition font-medium"
                >
                  Show All
                </button>
              </form>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <PaginatedTable
                  data={filteredTransactions}
                  columns={['Transaction ID','User ID', 'Amount', 'Date', 'Type']}
                  page={page}
                  setPage={setPage}
                  pageSize={pageSize}
                  darkMode={darkMode}
                  renderRow={(t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 text-xs font-medium text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="truncate max-w-32">{DOMPurify.sanitize(t.id)}</span>
                          <button onClick={() => copyToClipboard(t.id)} className="text-gray-500 hover:text-emerald-600">
                            <FiCopy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">{DOMPurify.sanitize(t.userId || 'N/A')}</span>
                          {t.userId && (
                            <button
                              onClick={() => {
                                copyToClipboard(t.userId);
                                setSearchUserId(t.userId);
                              }}
                              className="text-emerald-600 hover:text-emerald-800"
                              title="Copy & Search this user"
                            >
                              <FiUser className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-center">{t.amount ? `${t.amount.toFixed(2)} EGP` : 'N/A'}</td>
                      {/* <td className="px-6 py-4 text-center">{getStatusBadge(t.status)}</td> */}
                      <td className="px-6 py-4 text-sm text-center">
                        {t.createdAt ? formatDate(t.createdAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="text-gray-600 dark:text-gray-400">{t.paymentMethod || t.type || 'N/A'}</span>
                      </td>
                    </tr>
                  )}
                  emptyMessage={searchUserId ? "No transactions found for this user." : "No transactions available."}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;