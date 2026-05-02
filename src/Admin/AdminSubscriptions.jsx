import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText, FiSearch, FiX, FiCopy, FiRefreshCw,
  FiCheckCircle, FiXCircle, FiClock, FiDollarSign,
  FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiInfo,
  FiActivity, FiCalendar, FiCreditCard
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const ROWS_OPTIONS = [5, 10, 20, 50];

const PAYMENT_STATUS_META = {
  PAID: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  ACTIVE: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  PENDING: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  FAILED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
};
const getPayStatusMeta = (s) => PAYMENT_STATUS_META[s] || PAYMENT_STATUS_META.PENDING;

const METHOD_META = {
  CASH: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', dot: 'bg-orange-500' },
  CARD: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
};
const getMethodMeta = (m) => METHOD_META[m] || METHOD_META.CARD;

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};




const StatCard = memo(({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-lime-500/5 transition-all duration-500 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="relative flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-500 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
));

const SortIcon = memo(({ field, sortField, sortDir }) => {
  if (sortField !== field) return <FiChevronDown size={11} className="text-gray-400 dark:text-gray-500" />;
  return sortDir === 'asc' ? <FiChevronUp size={11} className="text-lime-600" /> : <FiChevronDown size={11} className="text-lime-600" />;
});

const AdminSubscriptions = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('shopName');
  const [sortDir, setSortDir] = useState('asc');
  const [serverPage, setServerPage] = useState(0);
  const [totalServerPages, setTotalServerPages] = useState(1);

  useEffect(() => { document.title = 'Admin - Subscriptions'; }, []);

  const fetchAll = useCallback(async (pageNum = 0) => {
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await api.get('/api/admin/subscriptions/subscriptions-with-payment', {
        params: { page: pageNum, size: 100 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data;
      const normalized = (d.content || []).map(item => ({
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
      setTotalServerPages(d.totalPages || 1);
      setServerPage(d.number || 0);
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); }
      else showToast('Sync failed', 'error');
    } finally { setLoading(false); }
  }, [token, navigate]);

  const fetchCashPending = useCallback(async () => {
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await api.get('/api/admin/subscriptions/cash/pending', { headers: { Authorization: `Bearer ${token}` } });
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setSubscriptions(list.map(item => ({
        ...item,
        paymentId: item.id,
        paymentMethod: 'CASH',
        paymentStatus: item.paymentStatus || 'PENDING',
        shopName: item.shop?.name || item.shopName || 'Unknown Shop',
        shopEmail: item.shop?.email || item.shopEmail,
      })));
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); }
      else showToast('Sync failed', 'error');
    } finally { setLoading(false); }
  }, [token, navigate]);

  const loadData = useCallback(() => {
    setCurrentPage(1);
    viewMode === 'cash_pending' ? fetchCashPending() : fetchAll(serverPage);
  }, [viewMode, fetchAll, fetchCashPending, serverPage]);

  useEffect(() => { loadData(); }, [viewMode]);

  const stats = useMemo(() => ({
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    pending: subscriptions.filter(s => s.paymentStatus === 'PENDING' || s.status === 'PENDING').length,
    cashPending: subscriptions.filter(s => s.paymentMethod === 'CASH' && s.paymentStatus === 'PENDING').length,
  }), [subscriptions]);

  const handleSort = useCallback((field) => {
    setSortField(prev => { if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; } setSortDir('asc'); return field; });
    setCurrentPage(1);
  }, []);

  const processed = useMemo(() => {
    const t = search.toLowerCase();
    let list = subscriptions.filter(s =>
      !t || (s.shopName || '').toLowerCase().includes(t) || (s.shopEmail || '').toLowerCase().includes(t) || String(s.shopId || '').includes(t)
    );
    return [...list].sort((a, b) => {
      let av = String(a[sortField] || '').toLowerCase(), bv = String(b[sortField] || '').toLowerCase();
      if (sortField === 'amount' || sortField === 'months') { av = Number(a[sortField] || 0); bv = Number(b[sortField] || 0); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [subscriptions, search, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / rowsPerPage);
  const paginated = processed.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const confirmCash = useCallback(async (paymentId) => {
    const { isConfirmed } = await Swal.fire({ title: 'Authorize Cash Payment?', text: 'This will instantly activate the shop subscription.', icon: 'question', showCancelButton: true, confirmButtonText: 'Confirm Payment', background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000', });
    if (!isConfirmed) return;
    try {
      await api.post(`/api/admin/subscriptions/cash/confirm/${paymentId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Payment Confirmed', 'success'); loadData();
    } catch (err) { showToast(err?.response?.data?.message || 'Confirmation failed', 'error'); }
  }, [token, loadData, darkMode]);

  const rejectCash = useCallback(async (paymentId) => {
    const { isConfirmed } = await Swal.fire({ title: 'Reject Cash Entry?', text: 'This will cancel the subscription request.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Confirm Rejection', confirmButtonColor: '#ef4444', background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000', });
    if (!isConfirmed) return;
    try {
      await api.post(`/api/admin/subscriptions/cash/reject/${paymentId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Payment Rejected', 'success'); loadData();
    } catch (err) { showToast(err?.response?.data?.message || 'Rejection failed', 'error'); }
  }, [token, loadData, darkMode]);

  const viewDetails = useCallback(async (subscriptionId) => {
    try {
      const { data: s } = await api.get(`/api/admin/subscriptions/${subscriptionId}`, { headers: { Authorization: `Bearer ${token}` } });
      const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      
      Swal.fire({
        title: 'Subscription Details',
        background: darkMode ? '#111827' : '#fff',
        color: darkMode ? '#fff' : '#000',
        width: '550px',
        html: `<div class="text-left text-xs font-bold space-y-4 p-4 uppercase tracking-widest">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-none border border-gray-100 dark:border-gray-800">
            <div class="grid grid-cols-2 gap-y-4">
              <div class="text-gray-400">Shop Entity</div><div>${s.shopName || '—'}</div>
              <div class="text-gray-400">Shop ID</div><div class="font-mono text-lime-500">${s.shopId || '—'}</div>
              <div class="text-gray-400">Start date</div><div>${fmt(s.startDate)}</div>
              <div class="text-gray-400">End date</div><div>${fmt(s.endDate)}</div>
              <div class="text-gray-400"> Duration</div><div>${s.months ? `${s.months} Month(s)` : '—'}</div>
              <div class="text-gray-400"> Amount</div><div>${s.months ? `${s.months * 1000} EGP` : '—'}</div>

              <div class="text-gray-400">Payment Method</div><div class="text-blue-500">${(s.paymentMethod || 'CARD').toUpperCase()}</div>
              <div class="text-gray-400">Payment Status</div><div>${(s.status || s.paymentStatus || 'UNSET').toUpperCase()}</div>
            </div>
          </div>
        </div>`,
        showConfirmButton: true, confirmButtonText: 'Close', confirmButtonColor: '#84cc16',
      });
    } catch (err) { showToast(err?.response?.data?.message || 'Sync failed', 'error'); }
  }, [token, darkMode]);

  const Th = ({ field, label, center = true }) => (
    <th onClick={() => handleSort(field)}
      className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${center ? 'text-center' : 'text-left'}`}>
      <span className={`flex items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
        {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </th>
  );

  const statCards = [
    { icon: FiFileText, label: 'Total Subscriptions', value: stats.total, color: 'lime' },
    { icon: FiCheckCircle, label: 'Active Plans', value: stats.active, color: 'emerald' },
    { icon: FiClock, label: 'Awaiting Settlement', value: stats.pending, color: 'amber' },
    { icon: FiDollarSign, label: 'Pending Cash', value: stats.cashPending, color: 'rose' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

        
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Enterprise Plans</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Subscriptions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Coordinate merchant access cycles and financial settlements</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
               <FiActivity size={18} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Plan Network</p>
               <p className="text-sm font-bold text-gray-700 dark:text-gray-200">System Synced</p>
             </div>
          </div>
        </div>

        
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={16} />
              <input type="text" placeholder="Search by shop ..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all" />
              {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"><FiX size={16} title="Clear Registry Filter" /></button>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[{ v: 'all', l: 'All Plans' }, { v: 'cash_pending', l: 'Cash Queue' }].map(({ v, l }) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                    ${viewMode === v 
                      ? 'bg-lime-500 border-lime-500 text-white shadow-lg shadow-lime-500/20' 
                      : 'border-transparent bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {l}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
               <button onClick={loadData} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 border border-transparent hover:border-lime-500/20 transition-all">
                 <FiRefreshCw size={16} title="Refresh Registry" />
               </button>
               <div className="flex items-center gap-3 px-4 border-l border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rows</span>
                  <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-transparent text-sm font-black text-gray-900 dark:text-white focus:outline-none cursor-pointer">
                    {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
               </div>
            </div>
          </div>
        </div>

      
      
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Mapping subscription network...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto custom-scrollbar-thin">
                <table className="w-full min-w-[850px] ">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      {viewMode === 'cash_pending' ? (
                        <>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Method</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Notes</th>
                          <Th field="amount" label="Value" />
                        </>
                      ) : (
                        <>
                          <Th field="shopId" label=" ID" center={true} />
                          <Th field="shopName" label="Shop " center={false} />
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Validity</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Duration</th>
                          <Th field="paymentMethod" label="Method" />
                          <Th field="paymentStatus" label="Status" />
                        </>
                      )}
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={7} className="py-32 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                          <FiFileText size={32} className="text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold">No Plan Records Identified</p>
                      </td></tr>
                    ) : paginated.map(sub => {
                      const payMeta = getPayStatusMeta(sub.paymentStatus === 'PAID' || sub.status === 'ACTIVE' ? 'PAID' : sub.paymentStatus || sub.status);
                      const methodMeta = getMethodMeta(sub.paymentMethod);

                      return (
                        <tr key={sub.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                          {viewMode === 'cash_pending' ? (
                            <>
                              <td className="px-8 py-6">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-50 dark:bg-orange-900/20 text-orange-600 border border-orange-500/10">
                                  <FiCreditCard size={12} /> {sub.paymentMethod || 'CASH'}
                                </span>
                              </td>
                              <td className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{sub.paymentStatus || 'PENDING'}</td>
                              <td className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatDate(sub.createdAt)}</td>
                              <td className="px-8 py-6 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{sub.details || '—'}</td>
                              <td className="px-8 py-6 text-center font-mono font-bold text-sm text-lime-600">EGP {sub.amount || 0}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[100px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">{sub.shopId}</code>
                                  <button onClick={() => navigator.clipboard.writeText(sub.shopId).then(() => showToast('ID Copied', 'success'))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all"><FiCopy size={14} title="Copy Shop ID" /></button>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="space-y-0.5">
                                   <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{sub.shopName || 'Unnamed Merchant'}</p>
                                   <p className="text-[10px] text-gray-400 font-medium">{sub.shopEmail}</p>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{formatDate(sub.startDate)}</span>
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{formatDate(sub.endDate)}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{sub.months} MONTHS</td>
                              <td className="px-8 py-6 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${methodMeta.bg} ${methodMeta.text}`}>
                                  {sub.paymentMethod}
                                </span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${payMeta.bg} ${payMeta.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${payMeta.dot}`} />
                                  {sub.paymentStatus === 'PAID' || sub.status === 'ACTIVE' ? 'SETTLED' : sub.paymentStatus || sub.status || 'PENDING'}
                                </span>
                              </td>
                            </>
                          )}

                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {viewMode !== 'cash_pending' && (
                                <button onClick={() => viewDetails(sub.subscriptionId || sub.id)}
                                  className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-all border border-transparent hover:border-lime-500/20">
                                  <FiInfo size={16} title="View Plan Dossier" />
                                </button>
                              )}
                              {viewMode === 'cash_pending' && (
                                <>
                                  <button onClick={() => confirmCash(sub.paymentId || sub.id)}
                                    className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 hover:scale-110 transition-all border border-transparent hover:border-emerald-500/20">
                                    <FiCheckCircle size={16} title="Authorize Settlement" />
                                  </button>
                                  <button onClick={() => rejectCash(sub.paymentId || sub.id)}
                                    className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:scale-110 transition-all border border-transparent hover:border-red-500/20">
                                    <FiXCircle size={16} title="Reject Settlement" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 px-8 py-6 gap-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Showing {paginated.length} records of {processed.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all">
                      <FiChevronLeft size={16} title="Previous Page" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = i + 1;
                        return (
                          <button key={p} onClick={() => setCurrentPage(p)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border
                              ${currentPage === p ? 'bg-lime-500 border-lime-500 text-white shadow-lg shadow-lime-500/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:border-lime-500/50'}`}>
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all">
                      <FiChevronRight size={16} title="Next Page" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

        <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default AdminSubscriptions;