import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiList, FiPlus, FiEdit3, FiTrash2, FiCopy,
  FiSearch, FiXCircle, FiChevronLeft, FiChevronRight,
  FiGrid, FiX, FiCheck, FiActivity, FiTag, FiChevronDown
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const ROWS_OPTIONS = [5, 10, 20, 50];

const sanitize = (str) => String(str ?? '').replace(/[<>"'`]/g, '');

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const copyToClipboard = (id) =>
  navigator.clipboard.writeText(id)
    .then(() => showToast('Category ID copied!', 'success'))
    .catch(() => showToast('Failed to copy', 'error'));

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

const CategoryModal = memo(({ editingCategory, value, onChange, onClose, onSubmit, loading }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
    <div className="w-full max-w-[320px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/80 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">
          {editingCategory ? 'Edit Category' : 'Add Category'}
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-all">
          <FiX size={16} title="Close" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        {editingCategory && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-transparent rounded-xl">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Registry ID</p>
                 <p className="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300 mt-0.5">{editingCategory.id.slice(0, 12)}...</p>
               </div>
               <button onClick={() => copyToClipboard(editingCategory.id)} className="p-1.5 bg-white dark:bg-gray-800 rounded-lg text-gray-400 hover:text-lime-500 shadow-sm transition-all">
                 <FiCopy size={12} title="Copy ID" />
               </button>
             </div>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Category Title</label>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="e.g. Smartphones"
            className="w-full px-3 py-2.5 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
          />
        </div>
      </div>
      <div className="px-4 pb-4 pt-1 flex gap-2">
        <button onClick={onClose}
          className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
          Cancel
        </button>
        <button onClick={onSubmit} disabled={loading || !value.trim()}
          className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-lime-500 dark:hover:bg-lime-500 dark:hover:text-white transition-all active:scale-[0.98] disabled:opacity-30">
          {loading ? '...' : editingCategory ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  </div>
));



const Categories = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { document.title = 'Admin - Categories'; }, []);

  const fetchCategories = useCallback(async () => {
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); }
      else showToast('Sync failed', 'error');
    } finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const saveCategory = useCallback(async () => {
    const name = categoryName.trim();
    if (!name) { showToast('Name is mandatory', 'warning'); return; }
    setSaving(true);
    try {
      if (editingCategory) {
        await api.put(`/api/admin/categories/${editingCategory.id}`, { name: sanitize(name) }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Category updated', 'success');
      } else {
        await api.post('/api/admin/categories', { name: sanitize(name) }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Category created', 'success');
      }
      setCategoryName('');
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories();
    } catch { showToast('Commit failed', 'error'); }
    finally { setSaving(false); }
  }, [categoryName, editingCategory, token, fetchCategories]);

  const deleteCategory = useCallback(async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Category?', text: 'This action will delete the category from registry.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Confirm Delete', confirmButtonColor: '#ef4444',
      background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/admin/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Category deleted', 'success'); fetchCategories();
    } catch { showToast('Deleted failed', 'error'); }
  }, [token, fetchCategories, darkMode]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const t = searchTerm.toLowerCase();
    return categories.filter(c => c.name?.toLowerCase().includes(t));
  }, [categories, searchTerm]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">

        
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Category Schema</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Categories</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Define and organize the platform catalog structure</p>
          </div>

          <button
            onClick={() => { setEditingCategory(null); setCategoryName(''); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-lime-500 text-white rounded-2xl shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
          >
            <FiPlus size={16} /> New Category
          </button>
        </div>

       
       
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard icon={FiGrid} label="Total Categories" value={categories.length} color="lime" />
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
               <FiActivity size={20} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Integrity</p>
               <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Schema Validated</p>
             </div>
          </div>
        </div>

        
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search category..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                  <FiXCircle size={16} title="Clear Search" />
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
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Syncing schema...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400"> ID</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Category </th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-32 text-center">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <FiList size={32} className="text-gray-200" />
                          </div>
                          <p className="text-gray-400 font-bold">No Records Found</p>
                        </td>
                      </tr>
                    ) : paginated.map(c => (
                      <tr key={c.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[150px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">
                              {c.id}
                            </code>
                            <button
                              onClick={() => copyToClipboard(c.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all"
                            >
                              <FiCopy size={14} title="Copy Identity ID" />
                            </button>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-lime-50 dark:bg-lime-900/20 text-lime-600 uppercase tracking-widest border border-lime-500/10">
                            <FiTag size={12} />
                            {sanitize(c.name) || 'Unnamed Entry'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setEditingCategory(c); setCategoryName(c.name || ''); setIsModalOpen(true); }}
                              className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 hover:scale-110 transition-all"
                            >
                              <FiEdit3 size={16} title="Edit Category" />
                            </button>
                            <button
                              onClick={() => deleteCategory(c.id)}
                              className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:scale-110 transition-all"
                            >
                              <FiTrash2 size={16} title="Delete Category" />
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
                    Showing {Math.min(paginated.length, rowsPerPage)} Entries of {filtered.length}
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

      {isModalOpen && (
        <CategoryModal
          editingCategory={editingCategory}
          value={categoryName}
          onChange={setCategoryName}
          onClose={() => setIsModalOpen(false)}
          onSubmit={saveCategory}
          loading={saving}
        />
      )}
    </div>
  );
};

export default Categories;