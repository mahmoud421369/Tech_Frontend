import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClipboard, FiUser, FiPackage, FiTool, FiUserCheck,
  FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown,
  FiSearch, FiX, FiActivity, FiMapPin, FiClock, FiRefreshCw, FiCheck
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const ROWS_OPTIONS = [5, 10, 20, 50];

const TYPE_META = {
  ORDER:  { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600',   dot: 'bg-blue-500'   },
  REPAIR: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', dot: 'bg-purple-500' },
};
const getTypeMeta = (t) => TYPE_META[t] || TYPE_META.ORDER;

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatAddress = (addr) => {
  if (!addr) return '—';
  const parts = [addr.building, addr.street, addr.city, addr.state].filter(Boolean).join(', ');
  return addr.notes ? `${parts} (${addr.notes})` : parts || '—';
};

const StatCard = memo(({ icon: Icon, label, value, color }) => (
  <div className="bg-white/10  dark:bg-slate-900/40 backdrop-blur-md text-white  border  rounded-2xl p-5 dark:border-gray-700 shadow-xl  hover:shadow-xl hover:shadow-emerald-400/5 transition-all duration-500 group relative overflow-hidden">
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
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-emerald-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{value} Rows</span>
        <FiChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {options.map(n => (
            <button
              key={n}
              onClick={() => { onChange(n); setOpen(false); }}
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

const AdminAssignmentLogs = ({ darkMode }) => {
  const navigate   = useNavigate();
  const tokenRef   = useRef(localStorage.getItem('authToken'));

  const [logs,            setLogs]            = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter,      setTypeFilter]      = useState('all');
  const [currentPage,     setCurrentPage]     = useState(1);
  const [rowsPerPage,     setRowsPerPage]     = useState(10);
  const [sortField,       setSortField]       = useState('createdAt');
  const [sortDir,         setSortDir]         = useState('desc');

  useEffect(() => { document.title = 'Admin - Assignment Logs'; }, []);

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res  = await api.get('/api/admin/assignment-logs', { headers: { Authorization: `Bearer ${token}` } });
      const data = Array.isArray(res.data.content) ? res.data.content : Array.isArray(res.data) ? res.data : [];
      setLogs(data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      else showToast('Sync failed', 'error');
      setLogs([]);
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const stats = useMemo(() => ({
    total:           logs.length,
    orderLogs:       logs.filter(l => l.assignmentType === 'ORDER').length,
    repairLogs:      logs.filter(l => l.assignmentType === 'REPAIR').length,
    uniqueAssigners: new Set(logs.map(l => l.assignerId)).size,
  }), [logs]);

  const handleSort = useCallback((field) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc'); return field;
    });
    setCurrentPage(1);
  }, []);

  const processed = useMemo(() => {
    const t = debouncedSearch.toLowerCase();
    const list = logs.filter(l =>
      (typeFilter === 'all' || l.assignmentType === typeFilter) &&
      (!t ||
        (l.assignerName || '').toLowerCase().includes(t) ||
        (l.shopName     || '').toLowerCase().includes(t) ||
        (l.userName     || '').toLowerCase().includes(t))
    );
    return [...list].sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        av = new Date(av || 0).getTime(); bv = new Date(bv || 0).getTime();
      } else { av = String(av || '').toLowerCase(); bv = String(bv || '').toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [logs, debouncedSearch, typeFilter, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / rowsPerPage);
  const paginated  = useMemo(
    () => processed.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [processed, currentPage, rowsPerPage]
  );

  const statCards = useMemo(() => [
    { icon: FiClipboard, label: 'Total Assignments',  value: stats.total,           color: 'lime'    },
    { icon: FiPackage,   label: 'Order Assignments',  value: stats.orderLogs,       color: 'blue'    },
    { icon: FiTool,      label: 'Repair Assignments', value: stats.repairLogs,      color: 'purple'  },
    { icon: FiUserCheck, label: 'Active Assigners',   value: stats.uniqueAssigners, color: 'emerald' },
  ], [stats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Assignments</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Assignment Logs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Full historical audit of assignment activities across the platform network</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchLogs} disabled={loading} title="Refresh"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all disabled:opacity-40">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
                <FiActivity size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Log Integrity</p>
                
              </div>
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
              <input type="text" placeholder="Search by assigner name, or shop ..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                  <FiX size={16} title="Clear" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'ORDER', 'REPAIR'].map(t => (
                <button key={t} onClick={() => { setTypeFilter(t); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${typeFilter === t ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-transparent bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 px-4 border-l border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rows</span>
              <RowsDropdown value={rowsPerPage} options={ROWS_OPTIONS} onChange={n => { setRowsPerPage(n); setCurrentPage(1); }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Accessing historical archives...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full rounded-sm border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar-thin">
                <table className="w-full table-auto border-collapse text-center text-sm text-gray-500  min-w-[900px]">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <Th field="assignerName"   label="Assigner Name" center={true} onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="assignmentType" label="Type"                         onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="shopName"       label="Shop"         center={true}  onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="userName"       label="User"         center={true}  onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <th className={`text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Destination</th>
                      <Th field="createdAt"  label="Date"        onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="updatedAt"  label="Last Update" onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={7} className="py-32 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                          <FiClipboard size={32} className="text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold">No Log Entries Identified</p>
                      </td></tr>
                    ) : paginated.map(log => {
                      const meta = getTypeMeta(log.assignmentType);
                      return (
                        <tr key={log.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                                <FiUser size={12} />
                              </div>
                              <p className="text-[10px] font-medium text-gray-900 dark:text-white tracking-tight">{log.assignerName || '—'}</p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${meta.bg} ${meta.text}`}>
                              
                              {log.assignmentType || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3"><p className="text-[10px] font-medium text-gray-700 dark:text-emerald-300">{log.shopName || '—'}</p></td>
                          <td className="p-3"><p className="text-[10px] font-medium text-indigo-700 dark:text-gray-300">{log.userName || '—'}</p></td>
                          <td className="p-3">
                            <div className="flex items-center font-medium  gap-2 text-[10px] text-gray-500 dark:text-gray-400 max-w-[200px] flex-wrap" title={formatAddress(log.userAddress)}>
                              
                              {formatAddress(log.userAddress)}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center ">
                             
                              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{formatDate(log.createdAt)}</span>
                            </div>
                          </td>
                            <td className="p-3 text-center">
                            <div className="flex flex-col items-center">
                            
                              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{formatDate(log.updatedAt)}</span>
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
                    Showing {paginated.length} dossiers of {processed.length}
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

export default AdminAssignmentLogs;