import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiCopy, FiSearch, FiXCircle, FiInfo, FiFileText, FiChevronDown, FiCheckCircle, FiXCircle as FiReject, FiClock, FiDollarSign } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const AdminSubscriptions = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageSize = 10;

 useEffect(() => {
    document.title = "Subscriptions - TechRepair";
  }, []);

  const fetchAllSubscriptions = useCallback(async (pageNum = 0) => {
    if (!token) return navigate('/login');

    setLoading(true);
    try {
      const res = await api.get('/api/admin/subscriptions/subscriptions-with-payment', {
        params: { page: pageNum, size: pageSize },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      const normalized = (data.content || []).map(item => ({
        id: item.id || item.subscriptionId,
        subscriptionId: item.subscriptionId || item.id,
        shopId: item.shop?.id || item.shopId,
        shopName: item.shop?.name || item.shopName || 'Unknown Shop',
        shopEmail: item.shop?.email || item.shopEmail,
        startDate: item.startDate,
        endDate: item.endDate,
        months: item.months || 0,
        status: item.status || 'PENDING',
        paymentMethod: item.payment?.method || item.paymentMethod || 'CARD',
        paymentStatus: item.payment?.paymentStatus || item.paymentStatus || 'PENDING',
        amount: item.amount || item.payment?.amount || 0,
        paymentId: item.payment?.id || item.paymentId,
      }));

      setSubscriptions(normalized);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      setPage(data.number || 0);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

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
        id: item.id,
        paymentId: item.id,
        paymentMethod: 'CASH',
        paymentStatus: item.paymentStatus || 'PENDING',
        amount: item.amount || 0,
        paymentReference: item.paymentReference || '-',
        transactionId: item.transactionId || '-',
        details: item.details || '-',
        paidAt: item.paidAt,
        createdAt: item.createdAt,
        shopId: item.shop?.id || item.shopId,
        shopName: item.shop?.name || item.shopName || 'Unknown Shop',
        shopEmail: item.shop?.email || item.shopEmail,
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

  const confirmCash = async (paymentId) => {
    const result = await Swal.fire({
      title: 'Confirm Cash Payment?',
      text: 'This will activate the subscription.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    try {
      await api.post(`/api/admin/subscriptions/cash/confirm/${paymentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success!', 'Payment confirmed and subscription activated.', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to confirm', 'error');
    }
  };

  const rejectCash = async (paymentId) => {
    const result = await Swal.fire({
      title: 'Reject Cash Payment?',
      text: 'This action cannot be undone.',
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
      Swal.fire('Rejected!', 'Cash payment has been rejected.', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to reject', 'error');
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

      const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

      const statusColor = s.paymentStatus === 'PAID' || s.status === 'ACTIVE'
        ? 'bg-green-100 text-green-800'
        : s.paymentStatus === 'PENDING'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800';

      const methodIcon = s.paymentMethod === 'CASH'
        ? '💵'
        : s.paymentMethod === 'CARD'
          ? '💳'
          : '🔗';

      Swal.fire({
        title: 'Subscription Details',
        width: '700px',
        html: `
          <div class="text-left space-y-4 text-sm font-medium">
            <div class="grid grid-cols-2 gap-4">
              <div><strong>Subscription ID:</strong></div>
              <div class="font-mono text-emerald-600">${s.subscriptionId || s.id || '—'}</div>

              <div><strong>Shop Name:</strong></div>
              <div>${s.shopName || '—'}</div>

              <div><strong>Shop ID:</strong></div>
              <div class="font-mono">${s.shopId || '—'}</div>
            </div>

            <hr class="border-gray-300" />

            <div class="grid grid-cols-2 gap-4">
              <div><strong><span class="inline-block mr-2">Start Date</span></strong></div>
              <div>${formatDate(s.startDate)}</div>

              <div><strong><span class="inline-block mr-2">End Date</span></strong></div>
              <div>${formatDate(s.endDate)}</div>

              <div><strong><span class="inline-block mr-2">Duration</span></strong></div>
              <div>${s.months ? `${s.months} month${s.months > 1 ? 's' : ''}` : '—'}</div>

              <div><strong><span class="inline-block mr-2">Status</span></strong></div>
              <div>
                <span class="px-3 py-1 rounded-full text-xs font-bold ${statusColor}">
                  ${s.status || s.paymentStatus || 'UNKNOWN'}
                </span>
              </div>

              <div><strong><span class="inline-block mr-2">${methodIcon} Payment Method</span></strong></div>
              <div class="capitalize font-semibold">${(s.paymentMethod || 'card').toLowerCase()}</div>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Close',
        confirmButtonColor: '#10b981',
      });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to load details', 'error');
    }
  };

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
    pending: subscriptions.filter(s => 
      s.paymentStatus === 'PENDING' || s.status === 'PENDING'
    ).length,
    cashPending: subscriptions.filter(s => 
      s.paymentMethod === 'CASH' && s.paymentStatus === 'PENDING'
    ).length,
  }), [subscriptions, totalElements]);

  const isCashPendingMode = filter === 'CASH_PENDING';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <div className="max-w-7xl mx-auto space-y-8">

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Total Subscriptions', 
                  value: stats.total, 
                  color: 'emerald', 
                  icon: FiFileText 
                },
                { 
                  label: 'Active Subscriptions', 
                  value: stats.active, 
                  color: 'green', 
                  icon: FiCheckCircle 
                },
                { 
                  label: 'Pending Payments', 
                  value: stats.pending, 
                  color: 'amber', 
                  icon: FiClock 
                },
                { 
                  label: 'Pending Cash Payments', 
                  value: stats.cashPending, 
                  color: 'orange', 
                  icon: FiDollarSign 
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-2 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                      {stat.value}
                    </p>
                  </div>

                  <div className={`p-4 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                    <stat.icon className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-5 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-white rounded-lg flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition whitespace-nowrap"
                  >
                    {isCashPendingMode ? 'Pending Cash Payments' : 'All Subscriptions'}
                    <FiChevronDown className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full mt-2 w-full bg-white font-semibold text-sm dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                      <button onClick={() => { setFilter('all'); setDropdownOpen(false); }} className={`block w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 ${!isCashPendingMode ? 'bg-emerald-50 dark:bg-emerald-900/30 font-medium' : ''}`}>
                        All Subscriptions
                      </button>
                      <button onClick={() => { setFilter('CASH_PENDING'); setDropdownOpen(false); }} className={`block w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 ${isCashPendingMode ? 'bg-emerald-50 dark:bg-emerald-900/30 font-medium' : ''}`}>
                        Pending Cash Payments Only
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by Shop ID, Name, or Email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-lg dark:text-white border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      <FiXCircle size={20} />
                    </button>
                  )}
                </div>

                <button onClick={loadData} className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 dark:text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Shop ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Shop Name</th>
                      {isCashPendingMode ? (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Reference</th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Details</th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Amount</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Method</th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filtered.map(sub => (
                      <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4 text-sm dark:text-white font-mono">
                          {sub.shopId}
                          <button onClick={() => copy(sub.shopId)} className="ml-2 text-emerald-600 hover:text-emerald-800">
                            <FiCopy className="inline" size={14} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-md font-semibold dark:text-teal-300 ">{sub.shopName || '—'}</td>

                        {isCashPendingMode ? (
                          <>
                            <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{sub.paymentReference}</td>
                            <td className="px-6 py-4 text-sm  text-gray-600 dark:text-white font-bold" title={sub.details}>{sub.details}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-emerald-600">EGP {sub.amount}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sub.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-white'}`}>
                                {sub.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.paymentStatus === 'PAID' || sub.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-white' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-white'}`}>
                                {sub.paymentStatus || sub.status || 'PENDING'}
                              </span>
                            </td>
                          </>
                        )}

                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {!isCashPendingMode && (
                              <button
                                onClick={() => viewDetails(sub.subscriptionId || sub.id)}
                                className="text-blue-600 dark:bg-gray-950 dark:text-blue-700 dark:border-gray-900 hover:text-blue-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 rounded-lg font-medium border border-blue-200 "
                              >
                                <FiInfo size={16} /> View
                              </button>
                            )}

                            {isCashPendingMode && (
                              <>
                                <button
                                  onClick={() => confirmCash(sub.paymentId || sub.id)}
                                  className="text-green-600 dark:bg-gray-950 dark:text-green-700 dark:border-gray-900 hover:text-green-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 rounded-lg font-medium border border-green-200"
                                >
                                  <FiCheckCircle size={16} /> Confirm
                                </button>
                                <button
                                  onClick={() => rejectCash(sub.paymentId || sub.id)}
                                  className="text-red-600 dark:bg-gray-950 dark:text-red-700 dark:border-gray-900 hover:text-red-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 rounded-lg font-medium border border-red-200"
                                >
                                  <FiReject size={16} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={isCashPendingMode ? 6 : 5} className="text-center py-12 text-gray-500 text-lg">
                          No {isCashPendingMode ? 'pending cash payments' : 'subscriptions'} found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {!isCashPendingMode && totalPages > 1 && (
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