import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  FiSearch, FiDownload, FiUpload, FiPackage, FiAlertTriangle,
  FiDollarSign, FiBox, FiTrendingDown, FiChevronLeft, FiChevronRight,
  FiPlus, FiRefreshCw, FiExternalLink, FiCopy, FiInfo, FiX, FiCheckCircle, FiMoreHorizontal, FiActivity, FiTag, FiHash, FiShield,
  FiInbox
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';




const ROWS_OPTIONS = [10, 25, 50];
const API_BASE = '/api/shop/inventory';




const sanitize = (str) => String(str ?? '').replace(/[<>"'`]/g, '');
const formatPrice = (p) => `EGP ${Number(p || 0)}`;




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




const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({ lowStock: 0, outOfStock: 0, totalValue: 0, totalItems: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [stockTarget, setStockTarget]   = useState(null);   
  const [newStockValue, setNewStockValue] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const abortCtrl = useRef(new AbortController());
  const fileInputRef = useRef(null);


  useEffect(() => { document.title = 'إدارة المستودع'; }, []);


  const showToast = (text, icon) =>
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    });

  const fetchInventory = useCallback(async (query = '') => {
    abortCtrl.current.abort();
    abortCtrl.current = new AbortController();
    setLoading(true);
    try {
      const [invRes, lowRes, outRes, valRes, itemsRes] = await Promise.allSettled([
        api.get(`${API_BASE}/search`, { params: { query }, signal: abortCtrl.current.signal }),
        api.get(`${API_BASE}/low-stock`, { signal: abortCtrl.current.signal }),
        api.get(`${API_BASE}/out-of-stock`, { signal: abortCtrl.current.signal }),
        api.get(`${API_BASE}/total-value`, { signal: abortCtrl.current.signal }),
        api.get(`${API_BASE}/total-items`, { signal: abortCtrl.current.signal }),
      ]);

      if (invRes.status === 'fulfilled') {
        const raw = invRes.value.data;
        setInventory(Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : []);
      }

      setStats({
        lowStock: lowRes.status === 'fulfilled' ? (lowRes.value.data?.content?.length ?? 0) : 0,
        outOfStock: outRes.status === 'fulfilled' ? (outRes.value.data?.content?.length ?? 0) : 0,
        totalValue: valRes.status === 'fulfilled' ? (Number(valRes.value.data) ?? 0) : 0,
        totalItems: itemsRes.status === 'fulfilled' ? (Number(itemsRes.value.data) ?? 0) : 0,
      });
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('فشل تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory(searchTerm);
    return () => abortCtrl.current.abort();
  }, [fetchInventory, searchTerm]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get(`${API_BASE}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      showToast('تم تصدير البيانات بنجاح', 'success');
    } catch { showToast('فشل التصدير', 'error'); }
    finally { setExporting(false); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post('/api/shops/products/import', fd);
      showToast('تم الاستيراد بنجاح', 'success');
      fetchInventory(searchTerm);
    } catch { showToast('فشل الاستيراد', 'error'); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

   const updateStock = async () => {
    if (newStockValue === '' || newStockValue < 0) return;
    try {
      await api.patch(`/api/shops/products/${stockTarget.id}/stock`, { newStock: parseInt(newStockValue) });
      showToast('تم تحديث المخزون', 'success');
      setShowStockModal(false); fetchInventory();
    } catch { showToast('خطأ في تحديث المخزون', 'error'); }
  };

  const paginated = useMemo(() => inventory.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [inventory, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(inventory.length / rowsPerPage);

  const handleCopySKU = (sku) => {
    navigator.clipboard.writeText(sku);
    showToast('تم نسخ رمز المنتج', 'success');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

       
       
        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">المخزون المركزي</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-lime-500">المستودع</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">تحكم كامل في تدفق المنتجات والكميات المتاحة والأسعار التنافسية</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-lime-500 transition-all shadow-xl shadow-gray-900/10 active:scale-95">
              <FiUpload className="inline-block ml-2" size={16} /> استيراد CSV
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={handleImport} />
            <button onClick={exportCSV} className="px-8 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:border-lime-500 transition-all shadow-sm active:scale-95">
              <FiDownload className="inline-block ml-2" size={16} /> تصدير
            </button>
          </div>
        </div>

     
     
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={FiBox} label="إجمالي العناصر" value={stats.totalItems.toLocaleString('ar-EG')} color="lime" description="إجمالي الأصناف بالمخزن" />
          <StatCard icon={FiAlertTriangle} label="مخزون منخفض" value={stats.lowStock.toLocaleString('ar-EG')} color="orange" description="تنبيهات إعادة الطلب" />
          <StatCard icon={FiTrendingDown} label="نفد المخزون" value={stats.outOfStock.toLocaleString('ar-EG')} color="red" description="أصناف غير متوفرة" />
          <StatCard icon={FiActivity} label="قيمة المستودع" value={formatPrice(stats.totalValue)} color="indigo" description="القيمة السوقية الإجمالية" />
        </div>

        
        

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input type="text" placeholder="ابحث باسم المنتج..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
            </div>
            <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))} className="px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer">
              {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n} عناصر</option>)}
            </select>
          </div>
        </div>

       
       

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المنتج</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">السعر</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الكمية</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الحالة</th>
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
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد بيانات</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">لم يتم العثور على أي منتجات في المستودع</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(item => {
                    const isLow = item.stock <= (item.threshold || 5);
                    return (
                      <tr key={item.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                              <FiBox size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 dark:text-white">{sanitize(item.name)}</p>
                      
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center font-mono font-black text-xs text-lime-600">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <p className="text-sm font-black text-gray-900 dark:text-white">{item.stock || 0}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">وحدة</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isLow ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                            {isLow ? "مخزون منخفض" : "متوفر"}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-left">
                          <div className="flex items-center justify-start gap-2">
                            <button onClick={() => setDetailsItem(item)} className="flex items-center text-xs gap-2 font-cairo font-bold p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 transition-all active:scale-95">
                              <FiInfo size={16} title="عرض التفاصيل" />  
                            </button>
                            <button title="تحديث المخزون" onClick={() => { setStockTarget({ id: item.id, current: item.stock }); setNewStockValue(item.stock ?? 0); setShowStockModal(true); }} className="flex items-center text-xs gap-2 font-cairo font-bold p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-indigo-500 transition-all active:scale-95">
                                                            <FiInbox size={16} /> 
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
                عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, inventory.length)}</span> من <span className="text-gray-900 dark:text-white">{inventory.length}</span> عنصر
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

      
      

      {detailsItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setDetailsItem(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-lime-500/10 text-lime-600 flex items-center justify-center">
                  <FiInfo size={16} />
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">تفاصيل الجرد</h3>
              </div>
              <button onClick={() => setDetailsItem(null)} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                <FiX size={16} />
              </button>
            </div>
            <div className="p-6 space-y-6 text-right">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300">
                  <FiPackage size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">{sanitize(detailsItem.name)}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{detailsItem.category || "بدون تصنيف"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-none border border-transparent hover:border-lime-500/20 transition-all space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">سعر الوحدة</p>
                  <p className="text-base font-black text-lime-600">{formatPrice(detailsItem.price)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-none border border-transparent hover:border-lime-500/20 transition-all space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">الكمية</p>
                  <p className="text-base font-black text-gray-900 dark:text-white">{detailsItem.stock || 0} <span className="text-[10px]">وحدة</span></p>
                </div>
               
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-none border border-transparent hover:border-lime-500/20 transition-all space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">الحد الأدنى</p>
                  <p className="text-base font-black text-red-400">{detailsItem.threshold || 5} <span className="text-[10px]">وحدة</span></p>
                </div>
              </div>

              <div className="p-5 bg-lime-500/5 dark:bg-lime-900/10 rounded-none border border-lime-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-lime-500 text-white flex items-center justify-center">
                    <FiShield size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-lime-600 uppercase tracking-widest leading-none">الحالة</p>
                    <p className="text-[10px] font-black text-gray-900 dark:text-white">{detailsItem.stock > 0 ? "متوفر بالمستودع" : "نفد المخزون"}</p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${detailsItem.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <button onClick={() => setDetailsItem(null)} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-lime-500 dark:hover:bg-lime-500 dark:hover:text-white transition-all shadow-sm">إغلاق</button>
            </div>
          </div>
        </div>
      )}


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


      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default Inventory;