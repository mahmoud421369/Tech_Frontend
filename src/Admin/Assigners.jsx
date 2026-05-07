import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiSearch, FiX, FiCopy, FiCheckCircle, FiXCircle,
  FiUser, FiMail, FiPhone, FiCalendar, FiPackage, FiClock,
  FiInfo, FiUserCheck, FiUserX, FiTrash2, FiActivity,
  FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiCheck, FiRefreshCw
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';

const ROWS_OPTIONS = [5, 10, 20, 50];

const STATUS_META = {
  APPROVED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  PENDING: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  SUSPENDED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
};
const getStatusMeta = (s) => STATUS_META[s] || STATUS_META.PENDING;

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const sanitize = (s) => DOMPurify.sanitize(String(s ?? ''));

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

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

const StatusBadge = memo(({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status || 'PENDING'}
    </span>
  );
});

const SortIcon = memo(({ field, sortField, sortDir }) => {
  if (sortField !== field) return <FiChevronDown size={11} className="text-gray-400 dark:text-gray-500" />;
  return sortDir === 'asc'
    ? <FiChevronUp size={11} className="text-lime-600" />
    : <FiChevronDown size={11} className="text-lime-600" />;
});

const Th = memo(({ field, label, center = true, onSort, sortField, sortDir }) => (
  <th onClick={() => onSort(field)}
    className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${center ? 'text-center' : 'text-left'}`}>
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
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-lime-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-lime-500/20">
        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{value} Rows</span>
        <FiChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
          {options.map(n => (
            <button key={n} onClick={() => { onChange(n); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest transition ${value === n ? 'bg-lime-50 dark:bg-lime-900/30 text-lime-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {n} Rows {value === n && <FiCheck size={12} className="text-lime-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const AssignerModal = memo(({ assigner, onClose }) => {
  if (!assigner) return null;
  const fields = [
    { icon: FiUser, label: 'Personnel Name', value: sanitize(assigner.name || 'N/A') },
    { icon: FiMail, label: 'Contact Email', value: sanitize(assigner.email || 'N/A') },
    { icon: FiPhone, label: 'Contact Phone', value: sanitize(assigner.phone || 'N/A') },
    { icon: FiCalendar, label: 'Commissioned On', value: formatDate(assigner.createdAt) },
    { icon: FiPackage, label: 'Historical Load', value: `${assigner.totalAssignmentsHandled || 0} Jobs` },
    { icon: FiClock, label: 'Current Queue', value: `${assigner.pendingAssignments || 0} Active`, color: 'amber' },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
      <div className="w-full max-w-[280px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/80 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Personnel Dossier</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-all">
            <FiX size={16} title="Close" />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar-thin">
          {fields.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="group p-2.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-transparent hover:border-lime-500/10 transition-all">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <Icon size={12} className={`${color === 'amber' ? 'text-amber-500' : 'text-lime-500'} group-hover:scale-110 transition-transform`} />
                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-100 truncate">{String(value)}</p>
              </div>
            </div>
          ))}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-transparent flex items-center justify-between mt-2">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Authority</p>
            <StatusBadge status={assigner.status} />
          </div>
        </div>
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(assigner.id).then(() => showToast('ID Copied', 'success'))}
            className="flex-1 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            Copy ID
          </button>
          <button onClick={onClose}
            className="flex-[2] py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-lime-500 dark:hover:bg-lime-500 dark:hover:text-white transition-all active:scale-[0.98]">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
});

/* ── Main Component ──────────────────────────────────────────────────────── */

const Assigners = ({ darkMode }) => {
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem('authToken'));

  const [assigners, setAssigners] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => { document.title = 'Admin - Assigners'; }, []);

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchAssigners = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/assigners', { headers: { Authorization: `Bearer ${token}` } });
      setAssigners(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      if (err?.response?.status === 401) navigate('/login');
      else showToast('Sync failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchAssigners(); }, [fetchAssigners]);

  const stats = useMemo(() => ({
    total: assigners.length,
    approved: assigners.filter(a => a.status === 'APPROVED').length,
    pending: assigners.filter(a => a.status === 'PENDING').length,
    suspended: assigners.filter(a => a.status === 'SUSPENDED').length,
  }), [assigners]);

  const handleSort = useCallback((field) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return field;
    });
    setCurrentPage(1);
  }, []);

  const processed = useMemo(() => {
    const t = debouncedSearch.toLowerCase();
    const list = assigners.filter(a =>
      (statusFilter === 'all' || (a.status || '').toUpperCase() === statusFilter) &&
      (!t || (a.name || '').toLowerCase().includes(t) ||
        (a.email || '').toLowerCase().includes(t) ||
        (a.phone || '').toLowerCase().includes(t))
    );
    return [...list].sort((a, b) => {
      let av = String(a[sortField] || '').toLowerCase();
      let bv = String(b[sortField] || '').toLowerCase();
      if (['totalAssignmentsHandled', 'pendingAssignments'].includes(sortField)) {
        av = Number(a[sortField] || 0);
        bv = Number(b[sortField] || 0);
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [assigners, debouncedSearch, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / rowsPerPage);
  const paginated = useMemo(
    () => processed.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [processed, currentPage, rowsPerPage]
  );

  const fetchById = useCallback(async (id) => {
    const token = tokenRef.current;
    try {
      const { data } = await api.get(`/api/admin/assigners/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelected(data);
    } catch { showToast('Sync failed', 'error'); }
  }, []);

  const updateStatus = useCallback(async (id, action) => {
    const token = tokenRef.current;
    if (action === 'delete') {
      const { isConfirmed } = await Swal.fire({ title: 'Delete Assigner?', text: 'This will delete the delivery person from fleet registry.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Confirm Purge', confirmButtonColor: '#ef4444', background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000', });
      if (!isConfirmed) return;
    }
    try {
      if (action === 'delete') await api.delete(`/api/admin/assigners/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      else await api.put(`/api/admin/assigners/${id}/${action}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast(`Agents ${action}ed`, 'success');
      fetchAssigners();
    } catch { showToast(`Action failed`, 'error'); }
  }, [fetchAssigners, darkMode]);

  const statCards = useMemo(() => [
    { icon: FiUsers, label: 'Total Assigners', value: stats.total, color: 'lime' },
    { icon: FiUserCheck, label: 'Authorized', value: stats.approved, color: 'emerald' },
    { icon: FiClock, label: 'In Queue', value: stats.pending, color: 'amber' },
    { icon: FiUserX, label: 'Suspended', value: stats.suspended, color: 'rose' },
  ], [stats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Assigners Network</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Assigners</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Coordinate and authorize platform assignment personnel</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchAssigners} disabled={loading} title="Refresh"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-lime-500 hover:border-lime-500/30 transition-all disabled:opacity-40">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
                <FiActivity size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Network Status</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">System Live</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={16} />
              <input type="text" placeholder="Search personnel by identity or contact..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                  <FiX size={16} title="Clear Filter" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'APPROVED', 'PENDING', 'SUSPENDED'].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-lime-500 border-lime-500 text-white shadow-lg shadow-lime-500/20' : 'border-transparent bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 px-4 border-l border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">View</span>
              <RowsDropdown value={rowsPerPage} options={ROWS_OPTIONS} onChange={n => { setRowsPerPage(n); setCurrentPage(1); }} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Syncing personnel registry...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto custom-scrollbar-thin">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">ID</th>
                      <Th field="name" label="Name" center={false} onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="status" label="Status" onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="totalAssignmentsHandled" label="Total Assigned" onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-32 text-center">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <FiUsers size={32} className="text-gray-200" />
                          </div>
                          <p className="text-gray-400 font-bold">No Personnel Records identified</p>
                        </td>
                      </tr>
                    ) : paginated.map(a => (
                      <tr key={a.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[120px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">{a.id}</code>
                            <button onClick={() => navigator.clipboard.writeText(a.id).then(() => showToast('ID Copied', 'success'))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all">
                              <FiCopy size={14} title="Copy Assigner ID" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{sanitize(a.name || 'Unnamed Personnel')}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{sanitize(a.email)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-2 text-center font-mono font-bold text-sm text-gray-700 dark:text-gray-200">{a.totalAssignmentsHandled || 0} Assignments</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {/* Info — always */}
                            <button onClick={() => fetchById(a.id)}
                              className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-all border border-transparent hover:border-lime-500/20">
                              <FiInfo size={16} title="View Personnel Dossier" />
                            </button>
                            {/* Approve — only when not APPROVED */}
                            {a.status !== 'APPROVED' && (
                              <button onClick={() => updateStatus(a.id, 'approve')}
                                className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 hover:scale-110 transition-all border border-transparent hover:border-emerald-500/20">
                                <FiUserCheck size={16} title="Authorize Assigner" />
                              </button>
                            )}
                            {/* Suspend — only when not SUSPENDED */}
                            {a.status !== 'SUSPENDED' && (
                              <button onClick={() => updateStatus(a.id, 'suspend')}
                                className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 hover:scale-110 transition-all border border-transparent hover:border-amber-500/20">
                                <FiUserX size={16} title="Suspend Authority" />
                              </button>
                            )}
                            {/* Delete — always (mirrors Deliveries) */}
                            <button onClick={() => updateStatus(a.id, 'delete')}
                              className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:scale-110 transition-all border border-transparent hover:border-red-500/20">
                              <FiTrash2 size={16} title="Purge Registry" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${currentPage === p ? 'bg-lime-500 border-lime-500 text-white shadow-lg shadow-lime-500/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:border-lime-500/50'}`}>
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

      {selected && <AssignerModal assigner={selected} onClose={() => setSelected(null)} />}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default Assigners;