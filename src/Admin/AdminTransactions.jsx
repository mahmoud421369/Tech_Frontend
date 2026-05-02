import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCreditCard, FiCopy, FiSearch, FiX, FiUser, FiDollarSign,
  FiClock, FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight,
  FiChevronUp, FiChevronDown, FiActivity, FiDownload
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { debounce } from 'lodash';
import api from '../api';

const ROWS_OPTIONS = [5, 10, 20, 50];

const STATUS_META = {
  COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  PENDING: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  FAILED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
  REFUNDED: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', dot: 'bg-purple-500' },
};
const getStatusMeta = (s) => STATUS_META[s] || { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500', dot: 'bg-gray-400' };

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

const TransactionsPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userIdSearch, setUserIdSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => { document.title = 'Admin - Transactions'; }, []);

  const fetchAll = useCallback(async () => {
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/transactions/all', { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); }
      else showToast('Sync failed', 'error');
    } finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchByUser = useCallback(async () => {
    if (!userIdSearch.trim()) { fetchAll(); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/api/admin/transactions/${userIdSearch.trim()}`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      showToast(err?.response?.status === 404 ? 'User not found' : 'Fetch failed', 'info');
      setTransactions([]);
    } finally { setLoading(false); setCurrentPage(1); }
  }, [token, userIdSearch, fetchAll]);

  const stats = useMemo(() => ({
    total: transactions.length,
    completed: transactions.filter(t => (t.paymentStatus || t.status) === 'COMPLETED').length,
    pending: transactions.filter(t => (t.paymentStatus || t.status) === 'PENDING').length,
    failed: transactions.filter(t => (t.paymentStatus || t.status) === 'FAILED').length,
    totalAmount: transactions.reduce((s, t) => s + (t.amount || 0), 0),
  }), [transactions]);

  const handleSort = useCallback((field) => {
    setSortField(prev => { if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; } setSortDir('desc'); return field; });
    setCurrentPage(1);
  }, []);

  const processed = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'status') { av = a.paymentStatus || a.status; bv = b.paymentStatus || b.status; }
      if (sortField === 'amount') { av = Number(av) || 0; bv = Number(bv) || 0; }
      else if (sortField === 'createdAt') { av = new Date(a.createdAt || a.paidAt || 0).getTime(); bv = new Date(b.createdAt || b.paidAt || 0).getTime(); }
      else { av = String(av || '').toLowerCase(); bv = String(bv || '').toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / rowsPerPage);
  const paginated = processed.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const exportCSV = useCallback(() => {
    const headers = 'Transaction ID,User ID,Amount,Status,Date,Type';
    const rows = transactions.map(t =>
      `${t.id || ''},${t.userId || ''},${t.amount?.toFixed(2) || ''},${t.paymentStatus || t.status || ''},${t.createdAt || t.paidAt ? formatDate(t.createdAt || t.paidAt) : ''},${t.paymentMethod || t.type || ''}`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'financial_registry.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [transactions]);

  const Th = ({ field, label, center = true }) => (
    <th onClick={() => handleSort(field)}
      className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${center ? 'text-center' : 'text-left'}`}>
      <span className={`flex items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
        {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">



        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Financial Audit</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Transactions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Monitor platform cash flow and payment settlement status</p>
          </div>

          <button onClick={exportCSV} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4 hover:border-lime-500/30 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-lime-50 dark:bg-lime-900/20 flex items-center justify-center text-lime-500">
              <FiDownload size={18} />
            </div>
            <div className="text-right">

              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Export Registry</p>
            </div>
          </button>
        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={FiDollarSign} label="Total Volume" value={`${stats.totalAmount.toLocaleString()} EGP`} color="lime" />
          <StatCard icon={FiCheckCircle} label="Settled" value={stats.completed} color="emerald" />
          <StatCard icon={FiClock} label="Pending" value={stats.pending} color="amber" />
          <StatCard icon={FiXCircle} label="Rejected" value={stats.failed} color="rose" />
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">

            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={16} />
              <input type="text" placeholder="Audit by specific User ..." value={userIdSearch}
                onChange={e => setUserIdSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchByUser()}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all" />
              {userIdSearch && (
                <button onClick={() => { setUserIdSearch(''); fetchAll(); setCurrentPage(1); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"><FiX size={16} title="Reset Filter" /></button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={fetchByUser} className="px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-500 dark:hover:bg-lime-500 dark:hover:text-white transition-all">Filter</button>
              <button onClick={() => { setUserIdSearch(''); fetchAll(); setCurrentPage(1); }} className="px-6 py-3.5 border-2 border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-lime-500/50 hover:text-lime-500 transition-all rounded-2xl">Reset</button>
            </div>

            <div className="flex items-center gap-3 px-4 border-l border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rows</span>
              <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-sm font-black text-gray-900 dark:text-white focus:outline-none cursor-pointer">
                {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Syncing ledger...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400"> ID</th>
                      {/* <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Beneficiary</th> */}
                      <Th field="amount" label="Value" />
                      <Th field="status" label="Status" />
                      <Th field="createdAt" label="Date" />
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={6} className="py-32 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                          <FiCreditCard size={32} className="text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold">No Financial Records Identified</p>
                      </td></tr>
                    ) : paginated.map(t => {
                      const meta = getStatusMeta(t.status);
                      return (
                        <tr key={t.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[120px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">{DOMPurify.sanitize(String(t.userId))}</code>
                              <button onClick={() => navigator.clipboard.writeText(t.id).then(() => showToast('ID Copied', 'success'))}
                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all"><FiCopy size={14} title="Copy Transaction ID" /></button>
                            </div>
                          </td>

                          <td className="px-8 py-6 text-center">
                            <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{t.amount !== undefined ? `${t.amount.toLocaleString()} EGP` : '—'}</p>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusMeta(t.paymentStatus || t.status).bg} ${getStatusMeta(t.paymentStatus || t.status).text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(t.paymentStatus || t.status).dot}`} />
                              {t.paymentStatus || t.status || 'UNSET'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatDate(t.paidAt || t.createdAt)}</p>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <p className="text-[10px] font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">{t.paymentMethod || 'SYSTEM'}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{t.paymentType || t.type || 'N/A'}</p>
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
    </div>
  );
};

export default TransactionsPage;