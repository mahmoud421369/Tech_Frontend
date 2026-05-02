import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBox, FiEdit3, FiTrash2, FiSearch, FiX, FiCopy,
  FiPackage, FiCheckCircle, FiXCircle, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiChevronUp, FiCheck, FiInfo,
  FiTag, FiDollarSign, FiImage, FiActivity, FiAlignLeft,
} from 'react-icons/fi';

import { AnimatePresence, motion } from 'framer-motion';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { debounce } from 'lodash';
import api from '../api';

const ROWS_OPTIONS = [5, 10, 20, 50];
const CONDITIONS = ['NEW', 'USED', 'REFURBISHED'];

const COND_META = {
  NEW: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  USED: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  REFURBISHED: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
};
const getCondMeta = (c) => COND_META[c] || COND_META.USED;

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const sanitize = (s) => DOMPurify.sanitize(String(s ?? ''));




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

const Dropdown = memo(({ label, value, options, onSelect, renderOption, renderSelected }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all">
        <span className="uppercase tracking-wider">{renderSelected ? renderSelected(value) : value || `Select ${label}`}</span>
        <FiChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute z-[110] mt-2 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden py-2">
            {options.map(opt => (
              <button key={opt.value ?? opt} type="button" onClick={() => { onSelect(opt); setOpen(false); }}
                className={`w-full flex items-center justify-between px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all
                  ${(opt.value ?? opt) === value ? 'bg-lime-500 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/50'}`}>
                {renderOption ? renderOption(opt) : opt}
                {(opt.value ?? opt) === value && <FiCheck size={12} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const DetailsModal = memo(({ product: p, onClose }) => {
  if (!p) return null;
  const cond = getCondMeta(p.condition);
  const fields = [
    { icon: FiDollarSign, label: 'Price', value: p.price ? `${Number(p.price).toLocaleString()} EGP` : '—', color: 'lime' },
    { icon: FiAlignLeft, label: 'Brief description', value: sanitize(p.description) },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/80 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
             <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Product Details</h3>
             <code className="text-[10px] font-black bg-lime-500 text-white px-2 py-0.5 rounded-lg">
               {String(p.id).slice(0, 8)}
             </code>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-all">
            <FiX size={18} title="Close" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
           {p.imageUrl && (
             <div className="w-full h-40 bg-gray-50 dark:bg-gray-900/40 rounded-none border border-gray-100 dark:border-gray-700 overflow-hidden flex items-center justify-center mb-2 group">
               <img src={p.imageUrl} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700" />
             </div>
           )}
           <div className="flex gap-2">
             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cond.bg} ${cond.text}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
               {p.condition || 'UNSET'}
             </span>
             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${(p.stock??0) > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
               {p.stock ?? 0} UNITS
             </span>
           </div>
           <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-transparent">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Product Name</p>
             <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{sanitize(p.name)}</p>
           </div>
           {fields.map(({ icon: Icon, label, value, color = 'gray' }) => (
             <div key={label} className="group p-4 bg-gray-50 dark:bg-gray-900/40 border border-transparent hover:border-lime-500/20 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-${color === 'lime' ? 'lime-500' : 'gray-400'} shadow-sm group-hover:rotate-6 transition-transform`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
                    <p className={`text-sm font-bold ${color === 'lime' ? 'text-lime-600' : 'text-gray-800 dark:text-gray-100'}`}>{String(value)}</p>
                  </div>
                </div>
             </div>
           ))}
        </div>
        <div className="px-6 pb-6 pt-2">
          <button onClick={onClose}
            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-[0.2em] hover:bg-lime-500 dark:hover:bg-lime-500 dark:hover:text-white transition-all active:scale-[0.98]">
            Close 
          </button>
        </div>
      </div>
    </div>
  );
});

const EditModal = memo(({ form, setForm, categories, onClose, onSubmit }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-none shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/80 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
         <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Edit Product Details</h3>
         <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-all">
           <FiX size={18} title="Close" />
         </button>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           {[
             { label: 'Product Name', field: 'name', type: 'text' },
             { label: 'Price (EGP)', field: 'price', type: 'number' },
             { label: 'Stock', field: 'stockQuantity', type: 'number' },
             { label: 'Image URL', field: 'imageUrl', type: 'url' },
           ].map(({ label, field, ...props }) => (
             <div key={field}>
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</label>
               <input {...props} value={form[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                 className="w-full px-4 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all" />
             </div>
           ))}
           <Dropdown label="Category" value={form.categoryName} options={categories.map(c => c.name)}
             onSelect={v => setForm(f => ({ ...f, categoryName: v }))} renderSelected={v => v || 'Select Category'} />
           <Dropdown label="Condition" value={form.condition} options={CONDITIONS}
             onSelect={v => setForm(f => ({ ...f, condition: v }))} renderSelected={v => v || 'Select Condition'} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
          <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
            className="w-full px-4 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all resize-none" />
        </div>
      </div>
      <div className="p-8 pt-0 flex gap-4">
         <button onClick={onClose} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Cancel Operation</button>
         <button onClick={onSubmit} className="flex-1 py-4 bg-lime-500 text-white text-xs font-black uppercase tracking-widest hover:bg-lime-600 shadow-lg shadow-lime-500/20 transition-all">Update Registry</button>
      </div>
    </div>
  </div>
));

const ProductsPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [detailProduct, setDetailProduct] = useState(null);

  useEffect(() => { document.title = 'Admin - Products'; }, []);

  const debouncedSet = useMemo(() => debounce((v) => { setDebounced(v); setCurrentPage(1); }, 300), []);
  useEffect(() => () => debouncedSet.cancel(), [debouncedSet]);
  useEffect(() => { debouncedSet(search); }, [search, debouncedSet]);

  const fetchProducts = useCallback(async () => {
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } });
      setProducts(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); }
      else showToast('Sync failed', 'error');
      setProducts([]);
    } finally { setLoading(false); }
  }, [token, navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } });
      setCategories(Array.isArray(data) ? data : data?.content || []);
    } catch { }
  }, [token]);

  const fetchById = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/api/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDetailProduct(data);
    } catch {
      const found = products.find(p => p.id === id);
      if (found) setDetailProduct(found);
      else showToast('Sync failed', 'error');
    }
  }, [token, products]);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => (p.stock ?? 0) > 0).length,
    outOfStock: products.filter(p => (p.stock ?? 0) === 0).length,
  }), [products]);

  const handleSort = useCallback((field) => {
    setSortField(prev => { if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; } setSortDir('asc'); return field; });
    setCurrentPage(1);
  }, []);

  const processed = useMemo(() => {
    const t = debouncedSearch.toLowerCase();
    let list = products.filter(p => {
      const matchSearch = !t || (p.name||'').toLowerCase().includes(t) || (p.description||'').toLowerCase().includes(t);
      const matchStock = stockFilter === 'all' || (stockFilter === 'inStock' ? (p.stock??0) > 0 : (p.stock??0) === 0);
      return matchSearch && matchStock;
    });
    return [...list].sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'price' || sortField === 'stock') { av = Number(av||0); bv = Number(bv||0); }
      else { av = String(av||'').toLowerCase(); bv = String(bv||'').toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, debouncedSearch, stockFilter, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / rowsPerPage);
  const paginated = processed.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const openEdit = useCallback(async (p) => {
    await fetchCategories();
    setEditForm({
      id: p.id, name: p.name||'', description: p.description||'',
      price: p.price||'', imageUrl: p.imageUrl||'',
      categoryName: p.category?.name||'', stockQuantity: p.stock||'', condition: p.condition||'',
    });
    setEditModal(true);
  }, [fetchCategories]);

  const handleUpdate = useCallback(async () => {
    if (!editForm.name || !editForm.price || !editForm.categoryName || !editForm.stockQuantity) {
      showToast('Validation failed', 'error'); return;
    }
    try {
      await api.put(`/api/admin/products/${editForm.id}`, {
        name: editForm.name, description: editForm.description,
        price: parseFloat(editForm.price), imageUrl: editForm.imageUrl || null,
        categoryName: editForm.categoryName, stockQuantity: Number(editForm.stockQuantity),
        condition: editForm.condition,
      }, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Registry Updated', 'success');
      setEditModal(false); fetchProducts();
    } catch { showToast('Action failed', 'error'); }
  }, [editForm, token, fetchProducts]);

  const deleteProduct = useCallback(async (id) => {
    const { isConfirmed } = await Swal.fire({ title: 'Delete Product Registry?', text: 'This will remove the product from all catalogues.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Confirm Purge', confirmButtonColor: '#ef4444', background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000', });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Product Deleted', 'success'); fetchProducts();
    } catch { showToast('Action failed', 'error'); }
  }, [token, fetchProducts, darkMode]);

  const Th = ({ field, label, center = true }) => (
    <th onClick={() => handleSort(field)}
      className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${center ? 'text-center' : 'text-left'}`}>
      <span className={`flex items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
        {label}
         
      </span>
    </th>
  );

  const statCards = [
    { icon: FiPackage, label: 'Total Products', value: stats.total, color: 'lime' },
    { icon: FiCheckCircle, label: 'Live Stock', value: stats.inStock, color: 'emerald' },
    { icon: FiXCircle, label: 'Out of Stock', value: stats.outOfStock, color: 'rose' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

      
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Product Lifecycle</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Products</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage and audit global product listings and inventory levels</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
               <FiActivity size={18} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory State</p>
               <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Synchronized</p>
             </div>
          </div>
        </div>

       
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

      
      
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={16} />
              <input type="text" placeholder="Search by name or technical description..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all" />
              {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"><FiX size={16} title="Clear Registry Filter" /></button>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[{v:'all',l:'All'},{v:'inStock',l:'In Stock'},{v:'outOfStock',l:'out of stock'}].map(({v,l}) => (
                <button key={v} onClick={() => { setStockFilter(v); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                    ${stockFilter === v 
                      ? 'bg-lime-500 border-lime-500 text-white shadow-lg shadow-lime-500/20' 
                      : 'border-transparent bg-gray-50 dark:bg-gray-900/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {l}
                </button>
              ))}
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
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Scanning product network...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">ID</th>
                      <Th field="name" label="Product Name" center={false} />
                      <Th field="price" label="Price" />
                      <Th field="condition" label="Condition" />
                      <Th field="stock" label="Stock" />
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={6} className="py-32 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                          <FiBox size={32} className="text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold">No Product Records Identified</p>
                      </td></tr>
                    ) : paginated.map(p => {
                      const cm = getCondMeta(p.condition);
                      return (
                        <tr key={p.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[80px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">{p.id}</code>
                              <button onClick={() => navigator.clipboard.writeText(p.id).then(() => showToast('ID Copied', 'success'))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all"><FiCopy size={14} title="Copy Product ID" /></button>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                             <div className="space-y-0.5">
                               <p className="text-xs font-bold text-gray-900 dark:text-white tracking-tight max-w-[180px] truncate">{sanitize(p.name)}</p>
        
                             </div>
                          </td>
                          <td className="px-8 py-4 text-center font-mono font-bold text-xs text-lime-600">{p.price ? `${p.price} EGP` : '—'}</td>
                          <td className="px-8 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cm.bg} ${cm.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cm.dot}`} />
                              {p.condition || 'UNSET'}
                            </span>
                          </td>
                          <td className="px-4 py-2  text-center">
                            <span className={`font-mono  font-bold text-xs px-3 py-1 rounded-full ${(p.stock??0) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {p.stock ?? 0} Units
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                               <button onClick={() => fetchById(p.id)}
                                 className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-all border border-transparent hover:border-lime-500/20">
                                 <FiInfo size={16} title="View Product Dossier" />
                               </button>
                               <button onClick={() => openEdit(p)}
                                 className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 hover:scale-110 transition-all border border-transparent hover:border-amber-500/20">
                                 <FiEdit3 size={16} title="Modify Dossier" />
                               </button>
                               <button onClick={() => deleteProduct(p.id)}
                                 className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:scale-110 transition-all border border-transparent hover:border-red-500/20">
                                 <FiTrash2 size={16} title="Purge Registry" />
                               </button>
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
                    Showing {paginated.length} products of {processed.length}
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

      <AnimatePresence>
        {detailProduct && <DetailsModal product={detailProduct} onClose={() => setDetailProduct(null)} />}
        {editModal && <EditModal form={editForm} setForm={setEditForm} categories={categories} onClose={() => setEditModal(false)} onSubmit={handleUpdate} />}
      </AnimatePresence>
    </div>
  );
};

export default ProductsPage;