import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiEye, FiCheckCircle, FiXCircle, FiTrash2,
  FiChevronLeft, FiChevronRight, FiCopy, FiSearch,
  FiX, FiHash, FiMail, FiPhone, FiBriefcase,
  FiChevronUp, FiChevronDown, FiUser, FiCheck, FiActivity, FiShield, FiClock, FiRefreshCw
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import { RiCheckLine } from 'react-icons/ri';

const ROWS_OPTIONS = [5, 10, 20, 50];
const ROLES = ['USER', 'ADMIN', 'SHOP_OWNER'];

const sanitize = (str) => DOMPurify.sanitize(String(str ?? ''));

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const getValue = (obj, key) => {
  if (key === 'name') return `${obj.firstName || ''} ${obj.lastName || ''}`.toLowerCase();
  if (key === 'activate') return obj.activate ? 1 : 0;
  return String(obj[key] || '').toLowerCase();
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
  return sortDir === 'asc'
    ? <FiChevronUp size={11} className="text-lime-600" />
    : <FiChevronDown size={11} className="text-lime-600" />;
});

const Th = memo(({ field, label, center = true, onSort, sortField, sortDir }) => (
  <th
    onClick={() => onSort(field)}
    className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${center ? 'text-center' : 'text-right'}`}
  >
    <span className={`flex items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </span>
  </th>
));

const RoleDropdown = memo(({ userId, currentRole, pendingRole, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const displayed = pendingRole || currentRole;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-lime-400 dark:hover:border-lime-500 transition focus:outline-none focus:ring-2 focus:ring-lime-500"
      >
        {displayed}
        <FiChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => { onSelect(userId, role); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-medium transition
                ${displayed === role
                  ? 'bg-lime-50 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {role}
              {displayed === role && <FiCheck size={11} className="text-lime-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

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
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-lime-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-lime-500/20"
      >
        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{value} Rows</span>
        <FiChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {options.map(n => (
            <button
              key={n}
              onClick={() => { onChange(n); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest transition
                ${value === n
                  ? 'bg-lime-50 dark:bg-lime-900/30 text-lime-600'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {n} Rows
              {value === n && <FiCheck size={12} className="text-lime-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const UserModal = memo(({ user, onClose }) => {
  if (!user) return null;
  const rows = [
    { icon: FiHash, label: 'ID', value: user.id },
    { icon: FiUser, label: 'Name', value: sanitize(`${user.firstName || ''} ${user.lastName || ''}`.trim()) || 'N/A' },
    { icon: FiMail, label: 'Email', value: sanitize(user.email || 'N/A') },
    { icon: FiPhone, label: 'Phone', value: user.phone || 'N/A' },
    { icon: FiBriefcase, label: 'Role', value: user.role || 'N/A' },
  ];

  return (
    <div className="fixed inset-0 z-[100]   flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
      <div className="w-full max-w-[350px]  bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/80 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">User Profile</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-all">
            <FiX size={18} title="Close" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="group p-3.5 bg-gray-50 dark:bg-gray-900/40 border border-transparent hover:border-lime-500/20 rounded-2xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-lime-500 shadow-sm group-hover:rotate-6 transition-transform">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="p-3.5 bg-gray-50 dark:bg-gray-900/40 border border-transparent rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center ${user.activate ? "text-emerald-500" : "text-red-500"}`}>
                {user.activate ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</p>
                <p className={`text-xs font-black uppercase tracking-widest ${user.activate ? 'text-emerald-600' : 'text-red-600'}`}>
                  {user.activate ? 'Active' : 'Suspended'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0">
          <button onClick={onClose}
            className="w-full py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});




const UsersSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm flex items-center justify-between h-28">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-250 dark:bg-gray-700 rounded-full" />
            <div className="h-8 w-16 bg-gray-300 dark:bg-gray-650 rounded-xl" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gray-150 dark:bg-gray-700" />
        </div>
      ))}
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 h-20" />

    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-4 last:border-0">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded-md" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-36 bg-gray-350 dark:bg-gray-600 rounded-md" />
              <div className="h-3 w-40 bg-gray-250 dark:bg-gray-700 rounded-md" />
            </div>
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-6 w-16 bg-gray-150 dark:bg-gray-700 rounded-full" />
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-gray-150 dark:bg-gray-700 rounded-xl" />
              <div className="w-10 h-10 bg-gray-150 dark:bg-gray-700 rounded-xl" />
              <div className="w-10 h-10 bg-gray-150 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const UsersPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem('authToken'));

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roleUpdates, setRoleUpdates] = useState({});
  const [savingRole, setSavingRole] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => { document.title = 'Admin - Users'; }, []);

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/users?page=0&size=200', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); }
      else showToast('Failed to sync users', 'error');
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.activate).length,
    inactive: users.filter(u => !u.activate).length,
  }), [users]);

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
    const filtered = t
      ? users.filter(u =>
        (u.firstName || '').toLowerCase().includes(t) ||
        (u.lastName || '').toLowerCase().includes(t) ||
        (u.email || '').toLowerCase().includes(t))
      : users;

    return [...filtered].sort((a, b) => {
      const av = getValue(a, sortField), bv = getValue(b, sortField);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, debouncedSearch, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / rowsPerPage);
  const paginated = useMemo(() => processed.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [processed, currentPage, rowsPerPage]);

  const activateUser = useCallback(async (id) => {
    const token = tokenRef.current;
    try {
      await api.put(`/api/admin/users/${id}/activate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('User authorized', 'success'); fetchUsers();
    } catch { showToast('Auth failed', 'error'); }
  }, [fetchUsers]);

  const deactivateUser = useCallback(async (id) => {
    const token = tokenRef.current;
    try {
      await api.put(`/api/admin/users/${id}/deactivate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('User suspended', 'warning'); fetchUsers();
    } catch { showToast('Action failed', 'error'); }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id) => {
    const token = tokenRef.current;
    const { isConfirmed } = await Swal.fire({
      title: 'Purge User?', text: 'This will permanently remove the account.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Confirm Purge', confirmButtonColor: '#ef4444',
      background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('User purged', 'success'); fetchUsers();
    } catch { showToast('Purge failed', 'error'); }
  }, [fetchUsers, darkMode]);

  const viewUser = useCallback(async (id) => {
    const token = tokenRef.current;
    try {
      const { data } = await api.get(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedUser(data);
    } catch { showToast('Sync error', 'error'); }
  }, []);

  const saveRole = useCallback(async (id, role) => {
    const token = tokenRef.current;
    setSavingRole(id);
    try {
      await api.put(`/api/admin/users/${id}`, { role }, { headers: { Authorization: `Bearer ${token}` } });
      showToast(`Role updated`, 'success');
      setRoleUpdates(prev => { const n = { ...prev }; delete n[id]; return n; });
      fetchUsers();
    } catch { showToast('Update failed', 'error'); }
    finally { setSavingRole(null); }
  }, [fetchUsers]);

  const statCards = useMemo(() => [
    { icon: FiUsers, label: 'Total Users', value: stats.total, color: 'lime' },
    { icon: RiCheckLine, label: 'Authorized', value: stats.active, color: 'emerald' },
    { icon: FiShield, label: 'Suspended', value: stats.inactive, color: 'rose' },
  ], [stats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Access Control</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Users Console</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage platform authority and account lifecycle</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchUsers} disabled={loading} title="Refresh"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-lime-500 hover:border-lime-500/30 transition-all disabled:opacity-40">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
                <FiActivity size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sync Status</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Real-time Active</p>
              </div>
            </div>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <UsersSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {statCards.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="relative flex-1 group">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                      <FiX size={16} title="Clear Search" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 px-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">View</span>
                  <RowsDropdown
                    value={rowsPerPage}
                    options={ROWS_OPTIONS}
                    onChange={n => { setRowsPerPage(n); setCurrentPage(1); }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar-thin">
                <table className="w-full  min-w-[900px]">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <Th field="id" label="ID" center={true} onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="name" label="Name" center={false} onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="role" label="Authority" onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="activate" label="Status" onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-32 text-center">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <FiUsers size={32} className="text-gray-200" />
                          </div>
                          <p className="text-gray-400 font-bold">No Records Found</p>
                        </td>
                      </tr>
                    ) : paginated.map(user => (
                      <tr key={user.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[120px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">
                              {user.id}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(user.id).then(() => showToast('ID Copied', 'success'))}
                              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all"
                            >
                              <FiCopy size={14} title="Copy Identity ID" />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{sanitize(`${user.firstName || ''} ${user.lastName || ''}`.trim()) || 'Unnamed Entity'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{sanitize(user.email)}</p>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <RoleDropdown
                              userId={user.id}
                              currentRole={user.role}
                              pendingRole={roleUpdates[user.id]}
                              onSelect={(id, role) => setRoleUpdates(prev => ({ ...prev, [id]: role }))}
                            />
                            {roleUpdates[user.id] && roleUpdates[user.id] !== user.role && (
                              <button
                                onClick={() => saveRole(user.id, roleUpdates[user.id])}
                                disabled={savingRole === user.id}
                                className="w-9 h-9 flex items-center justify-center bg-lime-500 text-white rounded-xl shadow-lg shadow-lime-500/20 hover:scale-110 active:scale-95 transition-all"
                              >
                                {savingRole === user.id ? <FiClock className="animate-spin" /> : <FiCheck title="Apply Role Change" />}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                            ${user.activate
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.activate ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {user.activate ? 'Active' : 'Suspended'}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => viewUser(user.id)}
                              title='Profile Details'
                              className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-all border border-transparent hover:border-lime-500/20"
                            >
                              <FiEye size={16} title="View Profile Details" />
                            </button>
                            {user.activate ? (
                              <button
                                onClick={() => deactivateUser(user.id)}
                                className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 hover:scale-110 transition-all border border-transparent hover:border-amber-500/20"
                              >
                                <FiXCircle size={16} title="Deactivate Account" />
                              </button>
                            ) : (
                              <button
                                onClick={() => activateUser(user.id)}
                                className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 hover:scale-110 transition-all border border-transparent hover:border-emerald-500/20"
                              >
                                <FiCheckCircle size={16} title="Activate Account" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:scale-110 transition-all border border-transparent hover:border-red-500/20"
                            >
                              <FiTrash2 size={16} title="Purge Record" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 px-8 py-6 gap-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Showing {Math.min(paginated.length, rowsPerPage)} users of {processed.length}
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
                              ${currentPage === p
                                ? 'bg-lime-500 border-lime-500 text-white shadow-lg shadow-lime-500/20'
                                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:border-lime-500/50'}`}>
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
            </div>
          </>
        )}
        <style dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
          .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
          .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; }
          .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
        `}} />
        {selectedUser && <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
      </div>
    </div>
  );
};

export default UsersPage;