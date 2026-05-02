import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiBox, FiEdit3, FiInbox, FiTrash2, FiChevronRight, FiChevronLeft,
  FiSearch, FiChevronDown, FiImage, FiX, FiPackage, FiTool,
  FiCheck, FiCopy, FiArrowDown, FiCheckCircle, FiPlus, FiActivity, FiExternalLink, FiMoreHorizontal, FiTag
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';




const CONDITIONS = ['NEW', 'USED', 'REFURBISHED'];
const CONDITION_LABELS = { NEW: 'جديد', USED: 'مستعمل', REFURBISHED: 'مجدّد' };
const CONDITION_STYLE = {
  NEW:         { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  USED:        { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600',   dot: 'bg-amber-500' },
  REFURBISHED: { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600',    dot: 'bg-blue-500' },
};
const ROWS_OPTIONS = [10, 25, 50];

const getCondStyle = (c) => CONDITION_STYLE[c] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };




const StatCard = memo(({ icon: Icon, label, value, color, description }) => (
  <div className="relative group bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="flex flex-col h-full relative z-10 text-right">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-4 group-hover:rotate-6 transition-transform`}>
        <Icon size={22} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-[9px] font-bold text-gray-400 mt-2">{description}</p>
    </div>
  </div>
));




const ProductForm = memo(({ data, onChange, categories }) => {
  const condOptions = CONDITIONS.map(c => ({ value: c, label: CONDITION_LABELS[c] }));
  const catOptions = categories.map(c => ({ value: c.id, label: c.name, raw: c }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
       <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">اسم المنتج</label>
          <input type="text" value={data.name} onChange={e => onChange('name', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">السعر (ج.م)</label>
          <input type="number" value={data.price} onChange={e => onChange('price', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
       </div>
       <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">وصف المنتج</label>
          <textarea value={data.description} onChange={e => onChange('description', e.target.value)} rows="3" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all resize-none" />
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">حالة المنتج</label>
          <select value={data.condition} onChange={e => onChange('condition', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all cursor-pointer">
             {condOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">فئة المنتج</label>
          <select value={data.category?.id} onChange={e => {
             const cat = categories.find(c => c.id === e.target.value);
             onChange('category', cat);
          }} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all cursor-pointer">
             <option value="">اختر الفئة</option>
             {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الكمية</label>
          <input type="number" value={data.stockQuantity} onChange={e => onChange('stockQuantity', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">رابط الصورة</label>
          <input type="text" value={data.imageUrl} onChange={e => onChange('imageUrl', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
       </div>
    </div>
  );
});




const Products = () => {
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedImage, setSelectedImage] = useState(null);

  const emptyProduct = { name: '', description: '', price: '', imageUrl: '', category: { id: '', name: '' }, stockQuantity: '', condition: 'NEW' };
  const [newProduct, setNewProduct]     = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockTarget, setStockTarget]   = useState(null);   
  const [newStockValue, setNewStockValue] = useState('');

  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  useEffect(() => { document.title = 'إدارة المنتجات'; }, []);

  const showToast = (text, icon) =>
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shops/products', { params: { query: searchTerm } });
      setProducts(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch { }
    finally { setLoading(false); }
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch { }
  }, []);

  useEffect(() => {
    fetchProducts(); fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const stats = useMemo(() => ({
    total:        products.length,
    inStock:      products.filter(p => (p.stock ?? 0) > 0).length,
    newCond:      products.filter(p => p.condition === 'NEW').length,
    usedOrRefurb: products.filter(p => p.condition !== 'NEW').length,
  }), [products]);

  const paginated = useMemo(() => products.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [products, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(products.length / rowsPerPage);

  const addProduct = async () => {
    if (!newProduct.category?.id) { showToast('يرجى اختيار فئة', 'error'); return; }
    try {
      await api.post('/api/shops/products', {
        ...newProduct, price: Number(newProduct.price) || 0,
        stockQuantity: Number(newProduct.stockQuantity) || 0,
        category: { id: newProduct.category.id },
      });
      showToast('تم إضافة المنتج بنجاح', 'success');
      setShowAddModal(false); setNewProduct(emptyProduct); fetchProducts();
    } catch { showToast('فشل في الإضافة', 'error'); }
  };

  const updateProduct = async () => {
    if (!editingProduct.category?.id) { showToast('يرجى اختيار فئة', 'error'); return; }
    try {
      await api.put(`/api/shops/products/${editingProduct.id}`, {
        ...editingProduct, price: Number(editingProduct.price) || 0,
        stockQuantity: Number(editingProduct.stockQuantity) || 0,
        category: { id: editingProduct.category.id },
      });
      showToast('تم تعديل المنتج بنجاح', 'success');
      setShowEditModal(false); fetchProducts();
    } catch { showToast('خطأ في تعديل المنتج', 'error'); }
  };

  const updateStock = async () => {
    if (newStockValue === '' || newStockValue < 0) return;
    try {
      await api.patch(`/api/shops/products/${stockTarget.id}/stock`, { newStock: parseInt(newStockValue) });
      showToast('تم تحديث المخزون', 'success');
      setShowStockModal(false); fetchProducts();
    } catch { showToast('خطأ في تحديث المخزون', 'error'); }
  };

  const deleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف', text: 'هل تريد حذف المنتج نهائياً؟', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/api/shops/products/${id}`);
      showToast('تم حذف المنتج', 'success');
      fetchProducts();
    } catch { showToast('خطأ في حذف المنتج', 'error'); }
  };

  const statCards = [
    { icon: FiPackage, label: 'إجمالي المنتجات', value: stats.total.toLocaleString('ar-EG'), color: "lime", description: "جميع المنتجات المسجلة" },
    { icon: FiCheckCircle, label: 'متوفر حالياً', value: stats.inStock.toLocaleString('ar-EG'), color: "emerald", description: "منتجات متاحة للبيع" },
    { icon: FiTag, label: 'حالة جديدة', value: stats.newCond.toLocaleString('ar-EG'), color: "blue", description: "منتجات بحالة المصنع" },
    { icon: FiActivity, label: 'مستعمل / مجدد', value: stats.usedOrRefurb.toLocaleString('ar-EG'), color: "orange", description: "منتجات مجددة أو مستعملة" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

       
        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">كتالوج المنتجات</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-lime-500">المنتجات</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">تحكم في منتجات متجرك، حدث الأسعار، وراقب توفر المخزون</p>
          </div>

          <button 
            title="إضافة منتج جديد"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest hover:bg-lime-500 dark:hover:bg-lime-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <FiPlus size={16} /> إضافة منتج جديد
          </button>
        </div>

     
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ابحث بالاسم، الفئة أو المواصفات..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all"
              />
            </div>
            <select
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-lime-500/10 cursor-pointer transition-all"
            >
              {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n} صفوف لكل صفحة</option>)}
            </select>
          </div>
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المنتج</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الحالة</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">السعر</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المخزون</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                   [...Array(rowsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-gray-800">
                        <FiPackage size={40} />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد منتجات</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">كتالوج المنتجات فارغ حالياً</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(p => {
                    const cs = getCondStyle(p.condition);
                    return (
                      <tr key={p.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300 overflow-hidden border border-gray-100 dark:border-gray-700">
                               {p.imageUrl ? (
                                  <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                               ) : (
                                  <FiImage size={20} />
                               )}
                            </div>
                            <div>
                               <p className="text-xs font-black text-gray-900 dark:text-white">{p.name}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.categoryName || "غير مصنف"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                           <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
                              {CONDITION_LABELS[p.condition] || p.condition}
                           </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center font-mono font-black text-xs text-lime-600">
                           {Number(p.price).toFixed(2)} EGP
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                           <p className={`text-sm font-black ${(p.stock ?? 0) > 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{p.stock ?? 0}</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">وحدة متوفرة</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-left">
                           <div className="flex items-center justify-start gap-2">
                             <button title="تعديل المنتج" onClick={() => { setEditingProduct({ ...p, stockQuantity: p.stock, category: { id: p.categoryId, name: p.categoryName || '' } }); setShowEditModal(true); }} className="flex items-center text-xs gap-2 font-cairo font-bold p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-amber-500 transition-all active:scale-95">
                                <FiEdit3 size={16} /> 
                             </button>
                            
                             <button title="حذف المنتج" onClick={() => deleteProduct(p.id)} className="flex items-center text-xs gap-2 font-cairo font-bold p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all active:scale-95">
                                <FiTrash2 size={16} />
                             </button>
                              <button title='نسخ اسم المنتج' onClick={() => { navigator.clipboard.writeText(p.name); showToast('تم نسخ اسم المنتج', 'success'); }} className="rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 flex items-center text-xs gap-2 font-cairo font-bold w-full  p-3 text-[10px]  hover:text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/10  transition-all">
                                      <FiCopy size={14} />  
                                   </button>
                           
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

         
         
          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                 عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, products.length)}</span> من <span className="text-gray-900 dark:text-white">{products.length}</span> منتج
               </p>
               <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all">
                     <FiChevronRight size={20} />
                  </button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all">
                     <FiChevronLeft size={20} />
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      
      
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} />
             <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] custom-scrollbar-thin">
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-lime-500/10 text-lime-600 flex items-center justify-center">
                         <FiBox size={20} />
                      </div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white">{showAddModal ? "إضافة منتج جديد" : "تعديل بيانات المنتج"}</h3>
                   </div>
                   <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                      <FiX size={18} />
                   </button>
                </div>

                <div className="p-8">
                   <ProductForm data={showAddModal ? newProduct : editingProduct} categories={categories} onChange={showAddModal ? (f,v) => setNewProduct(prev=>({...prev, [f]:v})) : (f,v) => setEditingProduct(prev=>({...prev, [f]:v}))} />
                </div>

                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-4">
                   <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-all">إلغاء</button>
                   <button onClick={showAddModal ? addProduct : updateProduct} className="flex-1 py-4 bg-lime-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/20">{showAddModal ? "إضافة المنتج" : "حفظ التعديلات"}</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      
      {showStockModal && stockTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowStockModal(false)} />
           <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-50 dark:border-gray-700">
                 <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تعديل المخزون</h3>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">تحديث الكمية المتوفرة</p>
              </div>
              <div className="p-8 space-y-6 text-right">
                 <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الكمية الحالية</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{stockTarget.current} وحدة</span>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الكمية الجديدة</label>
                    <input type="number" value={newStockValue} onChange={e => setNewStockValue(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-lg font-black text-gray-900 dark:text-white focus:outline-none transition-all text-center" />
                 </div>
              </div>
              <div className="px-8 pb-8 flex gap-3">
                 <button onClick={() => setShowStockModal(false)} className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
                 <button onClick={updateStock} className="flex-1 py-4 bg-lime-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/20">تحديث</button>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default Products;