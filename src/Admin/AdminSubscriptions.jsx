import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText, FiSearch, FiX, FiCopy, FiRefreshCw,
  FiCheckCircle, FiXCircle, FiClock, FiDollarSign,
  FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiInfo,
  FiActivity, FiCalendar, FiCreditCard, FiCheck
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const ROWS_OPTIONS = [5, 10, 20, 50];

const PAYMENT_STATUS_META = {
  PAID:    { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  ACTIVE:  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  PENDING: { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600',   dot: 'bg-amber-500'   },
  FAILED:  { bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-600',     dot: 'bg-red-500'     },
};
const getPayStatusMeta = (s) => PAYMENT_STATUS_META[s] || PAYMENT_STATUS_META.PENDING;

const METHOD_META = {
  CASH: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', dot: 'bg-orange-500' },
  CARD: { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600',   dot: 'bg-blue-500'   },
};
const getMethodMeta = (m) => METHOD_META[m] || METHOD_META.CARD;

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};




const StatCard = memo(({ icon: Icon, label, value, color }) => (
  <div className="bg-white/10  dark:bg-slate-900/40 backdrop-blur-md text-white  border  rounded-2xl p-6 dark:border-gray-700 shadow-xl  hover:shadow-xl hover:shadow-emerald-400/5 transition-all duration-500 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gray-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="relative flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center text-gray-500 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
));

const SortIcon = memo(({ field, sortField, sortDir }) => {
  if (sortField !== field) return <FiChevronDown size={11} className="text-gray-400 dark:text-gray-500" />;
  return sortDir === 'asc'
    ? <FiChevronUp size={11} className="text-emerald-600" />
    : <FiChevronDown size={11} className="text-emerald-600" />;
});

const Th = memo(({ field, label, center = true, onSort, sortField, sortDir }) => (
  <th
    onClick={() => onSort(field)}
    scope='col'
    className={`text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${center ? 'text-center' : 'text-right'}`}
  >
    <span className={`flex items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </span>
  </th>
));

const RowsDropdown = memo(({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-emerald-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{value} Rows</span>
        <FiChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {options.map(n => (
            <button key={n} onClick={() => { onChange(n); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest transition ${value === n ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {n} Rows
              {value === n && <FiCheck size={12} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const SubscriptionModal = memo(({ sub, onClose }) => {
  if (!sub) return null;
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const rows = [
    { icon: FiFileText,   label: 'Shop Entity', value: sub.shopName || '—' },
    { icon: FiActivity,   label: 'Shop ID',     value: sub.shopId || '—', mono: true },
    { icon: FiCalendar,   label: 'Start Date',  value: fmt(sub.startDate) },
    { icon: FiCalendar,   label: 'End Date',    value: fmt(sub.endDate) },
    { icon: FiClock,      label: 'Duration',    value: sub.months ? `${sub.months} Month(s)` : '—' },
    { icon: FiDollarSign, label: 'Amount',      value: sub.months ? `${sub.months * 1000} EGP` : '—', color: 'lime' },
    { icon: FiCreditCard, label: 'Method',      value: (sub.paymentMethod || 'CARD').toUpperCase(), color: 'blue' },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/80 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Subscription Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-all">
            <FiX size={16} title="Close" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-3 gap-4">
          {rows.map(({ icon: Icon, label, value, mono, color }) => (
            <div key={label} className="group p-5 bg-gray-50 dark:bg-gray-900/40 border border-transparent hover:border-emerald-500/20 rounded-xl transition-all duration-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-emerald-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <Icon size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
                  <p className={`text-[10px] font-bold truncate ${mono ? 'font-mono text-emerald-600' : color === 'lime' ? 'text-emerald-600' : color === 'blue' ? 'text-blue-500' : 'text-gray-700 dark:text-gray-200'}`}>
                    {value}
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
        <div className="px-4 pb-4 pt-2">
          <button onClick={onClose}
            className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 dark:hover:bg-emerald-500 dark:hover:text-white transition-all active:scale-[0.98]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});



const AdminSubscriptions = ({ darkMode }) => {
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem('authToken'));

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('shopName');
  const [sortDir, setSortDir] = useState('asc');
  const [serverPage, setServerPage] = useState(0);
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => { document.title = 'Admin - Subscriptions'; }, []);

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchAll = useCallback(async (pageNum = 0) => {
    const token = tokenRef.current;
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await api.get('/api/admin/subscriptions/subscriptions-with-payment', {
        params: { page: pageNum, size: 100 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data;
      const normalized = (d.content || []).map(item => ({
        id:             item.id || item.subscriptionId,
        subscriptionId: item.subscriptionId || item.id,
        shopId:         item.shop?.id || item.shopId,
        shopName:       item.shop?.name || item.shopName || 'Unknown Shop',
        shopEmail:      item.shop?.email || item.shopEmail,
        startDate:      item.startDate,
        endDate:        item.endDate,
        months:         item.months || 0,
        status:         item.status || 'PENDING',
        paymentMethod:  item.payment?.method || item.paymentMethod || 'CARD',
        paymentStatus:  item.payment?.paymentStatus || item.paymentStatus || 'PENDING',
        amount:         item.amount || item.payment?.amount || 0,
        paymentId:      item.payment?.id || item.paymentId,
      }));
      setSubscriptions(normalized);
      setTotalServerPages(d.totalPages || 1);
      setServerPage(d.number || 0);
    } catch (err) {
      if (err?.response?.status === 401) navigate('/login');
      else showToast('Sync failed', 'error');
    } finally { setLoading(false); }
  }, [navigate]);

  const fetchCashPending = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await api.get('/api/admin/subscriptions/cash/pending', { headers: { Authorization: `Bearer ${token}` } });
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setSubscriptions(list.map(item => ({
        ...item,
        paymentId:     item.id,
        paymentMethod: 'CASH',
        paymentStatus: item.paymentStatus || 'PENDING',
        shopName:      item.shop?.name || item.shopName || 'Unknown Shop',
        shopEmail:     item.shop?.email || item.shopEmail,
      })));
    } catch (err) {
      if (err?.response?.status === 401) navigate('/login');
      else showToast('Sync failed', 'error');
    } finally { setLoading(false); }
  }, [navigate]);

  const loadData = useCallback(() => {
    setCurrentPage(1);
    viewMode === 'cash_pending' ? fetchCashPending() : fetchAll(serverPage);
  }, [viewMode, fetchAll, fetchCashPending, serverPage]);

  useEffect(() => { loadData(); }, [viewMode]);

  const stats = useMemo(() => ({
    total:       subscriptions.length,
    active:      subscriptions.filter(s => s.status === 'ACTIVE').length,
    pending:     subscriptions.filter(s => s.paymentStatus === 'PENDING' || s.status === 'PENDING').length,
    cashPending: subscriptions.filter(s => s.paymentMethod === 'CASH' && s.paymentStatus === 'PENDING').length,
  }), [subscriptions]);

  const handleSort = useCallback((field) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc'); return field;
    });
    setCurrentPage(1);
  }, []);

  const processed = useMemo(() => {
    const t = debouncedSearch.toLowerCase();
    const list = subscriptions.filter(s =>
      !t ||
      (s.shopName || '').toLowerCase().includes(t) ||
      (s.shopEmail || '').toLowerCase().includes(t) ||
      String(s.shopId || '').includes(t)
    );
    return [...list].sort((a, b) => {
      let av = String(a[sortField] || '').toLowerCase(), bv = String(b[sortField] || '').toLowerCase();
      if (sortField === 'amount' || sortField === 'months') { av = Number(a[sortField] || 0); bv = Number(b[sortField] || 0); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [subscriptions, debouncedSearch, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / rowsPerPage);
  const paginated = useMemo(
    () => processed.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [processed, currentPage, rowsPerPage]
  );

  const confirmCash = useCallback(async (paymentId) => {
    const token = tokenRef.current;
    const { isConfirmed } = await Swal.fire({
      title: 'Authorize Cash Payment?', text: 'This will instantly activate the shop subscription.',
      icon: 'question', showCancelButton: true, confirmButtonText: 'Confirm Payment',
      background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000',
    });
    if (!isConfirmed) return;
    try {
      await api.post(`/api/admin/subscriptions/cash/confirm/${paymentId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Payment Confirmed', 'success'); loadData();
    } catch (err) { showToast(err?.response?.data?.message || 'Confirmation failed', 'error'); }
  }, [loadData, darkMode]);

  const rejectCash = useCallback(async (paymentId) => {
    const token = tokenRef.current;
    const { isConfirmed } = await Swal.fire({
      title: 'Reject Cash Entry?', text: 'This will cancel the subscription request.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Confirm Rejection',
      confirmButtonColor: '#ef4444', background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000',
    });
    if (!isConfirmed) return;
    try {
      await api.post(`/api/admin/subscriptions/cash/reject/${paymentId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Payment Rejected', 'success'); loadData();
    } catch (err) { showToast(err?.response?.data?.message || 'Rejection failed', 'error'); }
  }, [loadData, darkMode]);

  const viewDetails = useCallback(async (subscriptionId) => {
    const token = tokenRef.current;
    try {
      const { data: s } = await api.get(`/api/admin/subscriptions/${subscriptionId}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedSub(s);
    } catch (err) { showToast(err?.response?.data?.message || 'Sync failed', 'error'); }
  }, []);

  const statCards = useMemo(() => [
    { icon: FiFileText,    label: 'Total Subscriptions',  value: stats.total,       color: 'lime'    },
    { icon: FiCheckCircle, label: 'Active Plans',         value: stats.active,      color: 'emerald' },
    { icon: FiClock,       label: 'Pending Subscriptions',  value: stats.pending,     color: 'amber'   },
    { icon: FiDollarSign,  label: 'Pending Cash',         value: stats.cashPending, color: 'rose'    },
  ], [stats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

       
       
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Enterprise Plans</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Subscriptions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Coordinate merchant access cycles and financial settlements</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
               <FiActivity size={18} />
             </div>
             <div>
              
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
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input type="text" placeholder="Search by shop ..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                  <FiX size={16} title="Clear" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[{ v: 'all', l: 'All Plans' }, { v: 'cash_pending', l: 'Cash Queue' }].map(({ v, l }) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${viewMode === v ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-transparent bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {l}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
               <button onClick={loadData} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-emerald-500 border border-transparent hover:border-emerald-500/20 transition-all">
                 <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} title="Refresh Registry" />
               </button>
               <div className="flex items-center gap-3 px-4 border-l border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">View</span>
                  <RowsDropdown
                    value={rowsPerPage}
                    options={ROWS_OPTIONS}
                    onChange={n => { setRowsPerPage(n); setCurrentPage(1); }}
                  />
               </div>
            </div>
          </div>
        </div>

        
        
        <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Mapping subscription network...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full rounded-sm border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar-thin">
                <table className="w-full table-auto border-collapse text-center text-sm text-gray-500  min-w-[900px]">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {viewMode === 'cash_pending' ? (
                        <>
                          <th className={` text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Method</th>
                          <th className={` text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Status</th>
                          <th className={` text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Date</th>
                          <th className={` text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Notes</th>
                          <Th field="amount" label="Value" onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                        </>
                      ) : (
                        <>
                          <Th field="shopId"        label=" ID"      center={true}  onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                          <Th field="shopName"      label="Shop "    center={true} onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                          <th className={` text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Duration</th>
                          <Th field="paymentMethod" label="Method"     center={true}             onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                          <Th field="paymentStatus" label="Status"                  onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                        </>
                      )}
                      <th className={` text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
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
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-50 dark:bg-orange-900/20 text-orange-600 border border-orange-500/10">
                                  <FiCreditCard size={12} /> {sub.paymentMethod || 'CASH'}
                                </span>
                              </td>
                              <td className="p-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{sub.paymentStatus || 'PENDING'}</td>
                              <td className="p-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatDate(sub.createdAt)}</td>
                              <td className="p-3 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{sub.details || '—'}</td>
                              <td className="p-3 text-center font-mono font-bold text-sm text-lime-600">EGP {sub.amount || 0}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-3">
                                  <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[100px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">{sub.shopId}</code>
                                  <button onClick={() => navigator.clipboard.writeText(sub.shopId).then(() => showToast('ID Copied', 'success'))}
                                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all">
                                    <FiCopy size={14} title="Copy Shop ID" />
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                 <div className="space-y-0.5 text-center">
                                   <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{sub.shopName || 'Unnamed Merchant'}</p>
                                   <p className="text-[10px] text-gray-400 font-medium">{sub.shopEmail}</p>
                                 </div>
                              </td>
                             
                              <td className="p-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{sub.months} MONTHS</td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest  ${methodMeta.bg} ${methodMeta.text}`}>
                                  {sub.paymentMethod}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest  ${payMeta.bg} ${payMeta.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${payMeta.dot}`} />
                                  {sub.paymentStatus === 'PAID' || sub.status === 'ACTIVE' ? 'SETTLED' : sub.paymentStatus || sub.status || 'PENDING'}
                                </span>
                              </td>
                            </>
                          )}

                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {viewMode !== 'cash_pending' && (
                                <button onClick={() => viewDetails(sub.subscriptionId || sub.id)}
                                  className="p-1.5 text-gray- border border-gray-200 dark:text-white dark:border-gray-900 dark:hover:text-white dark:bg-gray-900 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                  <FiInfo size={16} title="View Plan Details" />
                                </button>
                              )}
                              {viewMode === 'cash_pending' && (
                                <>
                                  <button onClick={() => confirmCash(sub.paymentId || sub.id)}
                                    className="p-1.5 text-gray-500 border border-gray-200 dark:text-white dark:border-gray-800 dark:hover:text-white dark:bg-gray-900 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors">
                                    <FiCheck size={16} title="Accept Subscription" />
                                  </button>
                                  <button onClick={() => rejectCash(sub.paymentId || sub.id)}
                                    className="p-1.5 text-gray-500 border border-gray-200 dark:text-white dark:border-gray-800 dark:hover:text-white dark:bg-gray-900 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors">
                                    <FiXCircle size={16} title="Reject Subscription" />
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
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3 gap-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Showing {paginated.length} records of {processed.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                      <FiChevronLeft size={16} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = i + 1;
                        return (
                          <button key={p} onClick={() => setCurrentPage(p)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${currentPage === p ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:border-emerald-500/50'}`}>
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedSub && <SubscriptionModal sub={selectedSub} onClose={() => setSelectedSub(null)} />}

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