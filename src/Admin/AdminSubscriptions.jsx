import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiCopy, FiSearch, FiXCircle, FiEye, FiFileText, FiChevronDown, FiInfo } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const AdminSubscriptions = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  // State
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageSize = 10;

  // Fetch All Subscriptions (with pagination)
  const fetchAllSubscriptions = useCallback(async (pageNum = 0) => {
    if (!token) return navigate('/login');

    setLoading(true);
    try {
      const res = await api.get('/api/admin/subscriptions/subscriptions-with-payment', {
        params: { page: pageNum, size: pageSize },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      setSubscriptions((data.content || []).map(item => ({
        ...item,
        paymentId: item.payment?.id || item.paymentId,
        paymentMethod: item.payment?.method || item.paymentMethod || item.paymentType || 'CARD',
        amount: item.amount || 0,
        shopId: item.shopId || item.shop?.id,
        shopName: item.shopName || item.shop?.name || 'Unknown Shop',
        shopEmail: item.shopEmail || item.shop?.email,
        startDate: item.startDate,
        endDate: item.endDate,
        months: item.months,
        status: item.status,
      })));
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      setPage(data.number || 0);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  // Fetch Pending Cash Payments Only
  const fetchPendingCashPayments = useCallback(async () => {
    if (!token) return navigate('/login');

    setLoading(true);
    try {
      const res = await api.get('/api/admin/subscriptions/cash/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawData = res.data;
      const list = Array.isArray(rawData) ? rawData : (rawData.content || []);

      const normalized = list.map(item => ({
        ...item,
        paymentId: item.payment?.id || item.paymentId || null,
        paymentMethod: 'CASH',
        paymentType: 'CASH',
        amount: item.amount || item.payment?.amount || 0,
        shopId: item.shopId || item.shop?.id,
        shopName: item.shopName || item.shop?.name || 'Unknown Shop',
        shopEmail: item.shopEmail || item.shop?.email,
        startDate: item.startDate,
        endDate: item.endDate,
        months: item.months,
        status: item.status || 'PENDING',
      }));

      setSubscriptions(normalized);
      setTotalPages(1);
      setTotalElements(normalized.length);
      setPage(0);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const handleError = (err) => {
    console.error(err);
    Swal.fire('Error', 'Failed to load data', 'error');
    if (err.response?.status === 401) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const loadData = useCallback(() => {
    if (filter === 'CASH_PENDING') {
      fetchPendingCashPayments();
    } else {
      fetchAllSubscriptions(page);
    }
  }, [filter, page, fetchAllSubscriptions, fetchPendingCashPayments]);

  // Effects
  useEffect(() => {
    setPage(0);
    loadData();
  }, [filter]);

  useEffect(() => {
    if (filter !== 'CASH_PENDING') {
      fetchAllSubscriptions(page);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, []);

  // Actions
  const confirmCash = async (paymentId) => {
    const result = await Swal.fire({
      title: 'Confirm Payment?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm',
    });
    if (!result.isConfirmed) return;

    try {
      await api.post(`/api/admin/subscriptions/cash/confirm/${paymentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Confirmed!', 'Cash payment approved.', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', 'Failed to confirm payment', 'error');
    }
  };

  const rejectCash = async (paymentId) => {
    const result = await Swal.fire({
      title: 'Reject Payment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await api.post(`/api/admin/subscriptions/cash/reject/${paymentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Rejected!', 'Cash payment rejected.', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', 'Failed to reject payment', 'error');
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({ title: 'Copied!', toast: true, position: 'top-end', timer: 1500, icon: 'success', showConfirmButton: false });
  };

  const viewDetails = async (subscriptionId) => {
    try {
      const res = await api.get(`/api/admin/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const s = res.data;

      const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

      Swal.fire({
        title: 'Subscription Details',
        width: '650px',
        html: `
          <div class="text-left text-sm space-y-3 font-medium">
            <div class="grid grid-cols-2 gap-4">
              <div><strong>Subscription ID:</strong></div>
              <div class="font-mono text-emerald-600">${s.subscriptionId || s.id}</div>
              
              <div><strong>Shop Name:</strong></div>
              <div>${s.shopName || '—'}</div>
              
              <div><strong>Shop ID:</strong></div>
              <div class="font-mono">${s.shopId || '—'}</div>
              
              <div><strong>Shop Email:</strong></div>
              <div>${s.shopEmail || '—'}</div>
            </div>
            
            <hr class="my-3 border-gray-300" />
            
            <div class="grid grid-cols-2 gap-4">
              <div><strong>Start Date:</strong></div>
              <div>${formatDate(s.startDate)}</div>
              
              <div><strong>End Date:</strong></div>
              <div>${formatDate(s.endDate)}</div>
              
              <div><strong>Duration:</strong></div>
              <div>${s.months ? `${s.months} month${s.months > 1 ? 's' : ''}` : '—'}</div>
              
              <div><strong>Status:</strong></div>
              <div>
                <span class="px-3 py-1 rounded-full text-xs font-bold ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : s.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
                  ${s.status || 'UNKNOWN'}
                </span>
              </div>
              
              <div><strong>Payment Method:</strong></div>
              <div class="capitalize">${(s.paymentMethod || s.paymentType || 'card').toLowerCase()}</div>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Close',
        confirmButtonColor: '#10b981',
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to load details', 'error');
    }
  };

  // Filtered data
  const filtered = useMemo(() => {
    return subscriptions.filter(s =>
      !search ||
      s.shopEmail?.toLowerCase().includes(search.toLowerCase()) ||
      s.shopId?.toString().includes(search) ||
      s.shopName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [subscriptions, search]);

  const stats = useMemo(() => ({
    total: totalElements,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    pending: subscriptions.filter(s => s.status === 'PENDING').length,
    cashPending: subscriptions.filter(s => s.paymentMethod === 'CASH' && s.status === 'PENDING').length,
  }), [subscriptions, totalElements]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-14">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiFileText /> Subscriptions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage shop subscriptions and payments</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{value}</p>
                </div>
              ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Custom Tailwind Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-5 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition whitespace-nowrap"
                  >
                    {filter === 'all' ? 'All Subscriptions' : 'Pending Cash Payments'}
                    <FiChevronDown className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 overflow-hidden">
                      <button
                        onClick={() => { setFilter('all'); setDropdownOpen(false); }}
                        className={`block w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition ${filter === 'all' ? 'bg-emerald-50 dark:bg-emerald-900/30 font-medium' : ''}`}
                      >
                        All Subscriptions
                      </button>
                      <button
                        onClick={() => { setFilter('CASH_PENDING'); setDropdownOpen(false); }}
                        className={`block w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition ${filter === 'CASH_PENDING' ? 'bg-emerald-50 dark:bg-emerald-900/30 font-medium' : ''}`}
                      >
                        Pending Cash Payments Only
                      </button>
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by Shop ID, Name, or Email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      <FiXCircle size={20} />
                    </button>
                  )}
                </div>

                <button onClick={loadData} className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 whitespace-nowrap">
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Shop ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Shop</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filtered.map(sub => (
                      <tr key={sub.id || sub.subscriptionId} className= "hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4 text-sm font-mono">
                          {sub.shopId}
                          <button onClick={() => copy(sub.shopId)} className="ml-2 text-emerald-600 hover:text-emerald-800 text-xs">
                            <FiCopy className="inline" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm capitalize">{(sub.paymentType || sub.paymentMethod || 'card').toLowerCase()}</td>
                        <td className="px-6 py-4 text-sm">{sub.shopName || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sub.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {sub.paymentMethod || 'CARD'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewDetails(sub.id || sub.subscriptionId)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 rounded-lg font-medium"
                            >
                              <FiInfo size={16} /> View
                            </button>

                            {sub.paymentMethod === 'CASH' && sub.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => confirmCash(sub.paymentId || sub.id)}
                                  className="text-green-600 hover:text-green-800 text-xs px-2 py-1 bg-green-50 rounded-lg font-medium"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => rejectCash(sub.paymentId || sub.id)}
                                  className="text-red-600 hover:text-red-800 text-xs px-2 py-1 bg-red-50 rounded-lg font-medium"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500 text-lg">
                          No subscriptions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {filter !== 'CASH_PENDING' && totalPages > 1 && (
                  <div className="flex justify-center items-center gap-6 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptions;