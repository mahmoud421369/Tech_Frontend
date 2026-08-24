import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiList, FiPlus, FiEdit3, FiTrash2, FiCopy,
  FiSearch, FiXCircle, FiChevronLeft, FiChevronRight,
  FiGrid, FiX, FiCheck, FiActivity, FiTag, FiChevronDown, FiRefreshCw
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
  <div className="bg-white/10  dark:bg-slate-900/40 backdrop-blur-md text-white  border  rounded-2xl p-6 dark:border-gray-700 shadow-xl  hover:shadow-xl hover:shadow-emerald-400/5 transition-all duration-500 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="relative flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-gray-50 dark:bg-${color}-900/20 flex items-center justify-center text-gray-500 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}>
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

const CategoryModal = memo(({ editingCategory, value, onChange, onClose, onSubmit, loading }) => (
  <div className="fixed inset-0    flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
    <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-md shadow-xl  border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/80 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 tracking-wide uppercase">
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
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Category ID</p>
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
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="e.g. Smartphones"
            className="w-full px-3 py-2.5 rounded-xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all"
            autoFocus onKeyDown={e => e.key === 'Enter' && onSubmit()} />
        </div>
      </div>
      <div className="px-4 pb-4 pt-1 flex gap-2">
        <button onClick={onClose}
          className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
          Cancel
        </button>
        <button onClick={onSubmit} disabled={loading || !value.trim()}
          className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 dark:hover:bg-emerald-500 dark:hover:text-white transition-all active:scale-[0.98] disabled:opacity-30">
          {loading ? '...' : editingCategory ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  </div>
));




const CategorySkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm flex items-center gap-4 h-28">
          <div className="w-12 h-12 rounded-2xl bg-gray-150 dark:bg-gray-700" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-5 w-32 bg-gray-300 dark:bg-gray-650 rounded-md" />
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 h-20" />

    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-4 last:border-0">
            <div className="h-4 w-32 bg-gray-250 dark:bg-gray-700 rounded-md" />
            <div className="h-6 w-24 bg-gray-150 dark:bg-gray-700 rounded-full" />
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-gray-150 dark:bg-gray-700 rounded-xl" />
              <div className="w-10 h-10 bg-gray-150 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Categories = ({ darkMode }) => {
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem('authToken'));

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { document.title = 'Admin - Categories'; }, []);

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/categories?page=0&size=200', { headers: { Authorization: `Bearer ${token}` } });
      setCategories(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      if (err?.response?.status === 401) navigate('/login');
      else showToast('Sync failed', 'error');
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const saveCategory = useCallback(async () => {
    const token = tokenRef.current;
    const name = categoryName.trim();
    if (!name) { showToast('Name is mandatory', 'warning'); return; }
    setSaving(true);
    try {
      if (editingCategory) {
        await api.put(`/api/admin/categories/${editingCategory.id}`, { name: sanitize(name) }, { headers: { Authorization: `Bearer ${token}` } });
        showToast('Category updated', 'success');
      } else {
        await api.post('/api/admin/categories', { name: sanitize(name) }, { headers: { Authorization: `Bearer ${token}` } });
        showToast('Category created', 'success');
      }
      setCategoryName('');
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories();
    } catch { showToast('Commit failed', 'error'); }
    finally { setSaving(false); }
  }, [categoryName, editingCategory, fetchCategories]);

  const deleteCategory = useCallback(async (id) => {
    const token = tokenRef.current;
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
  }, [fetchCategories, darkMode]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return categories;
    const t = debouncedSearch.toLowerCase();
    return categories.filter(c => c.name?.toLowerCase().includes(t));
  }, [categories, debouncedSearch]);

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
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Category Schema</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Categories</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Define and organize the platform catalog structure</p>
          </div>

          <div className="flex gap-2">
            <button onClick={fetchCategories} disabled={loading} title="Refresh"
              className="w-11 h-11 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-lime-500 hover:border-lime-500/30 transition-all disabled:opacity-40">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => { setEditingCategory(null); setCategoryName(''); setIsModalOpen(true); }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-green-500  text-green-500 hover:bg-green-500 hover:text-white  rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest">
              <FiPlus size={16} /> New Category
            </button>
          </div>
        </div>

       
       

        {loading && categories.length === 0 ? (
          <CategorySkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard icon={FiGrid} label="Total Categories" value={categories.length} color="lime" />
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md p-6 shadow-sm flex items-center gap-4">
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
                  <input type="text" placeholder="Search category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all" />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                      <FiXCircle size={16} title="Clear Search" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 px-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">View</span>
                   <RowsDropdown value={rowsPerPage} options={ROWS_OPTIONS} onChange={n => { setRowsPerPage(n); setCurrentPage(1); }} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
              <div className="overflow-x-auto w-full rounded-sm border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar-thin">
                <table className="w-full table-auto border-collapse text-center text-sm text-gray-500  min-w-[900px]">
                  <thead className="bg-gray-100 dark:bg-gray-900">
                    <tr>
                      <th className={` text-slate-500 font-semibold text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}> ID</th>
                      <th className={` text-slate-500 font-semibold text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Category </th>
                      <th className={` text-slate-500 font-semibold text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
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
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-3">
                            <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[150px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">
                              {c.id}
                            </code>
                            <button onClick={() => copyToClipboard(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all">
                              <FiCopy size={14} title="Copy Identity ID" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 uppercase tracking-widest  dark:text-white border border-indigo-500/10">
                          
                            {sanitize(c.name) || 'Unnamed Entry'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => { setEditingCategory(c); setCategoryName(c.name || ''); setIsModalOpen(true); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-transparent dark:bg-amber-800/50 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
                              <FiEdit3 size={16} title="Edit Category" />
                            </button>
                            <button onClick={() => deleteCategory(c.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-white bg-transparent hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1">
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
                <div className="bg-gray-100 flex flex-col sm:flex-row items-center justify-between border-t border-gray-50 dark:border-gray-800  dark:bg-gray-900 p-4 gap-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Showing {Math.min(paginated.length, rowsPerPage)} Entries of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                      <FiChevronLeft size={16} title="Previous Page" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = i + 1;
                        return (
                          <button key={p} onClick={() => setCurrentPage(p)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${currentPage === p ? 'bg-green-600 border-green-500 hover:bg-green-700 text-white shadow-lg shadow-green-500/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 hover:text-green-700 hover:border-green-500/50'}`}>
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

export default Categories;