import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  FiSearch, FiPlus, FiInfo, FiEdit3, FiTrash2, FiX,
  FiCalendar, FiTag, FiPercent, FiDollarSign,
  FiChevronRight, FiChevronLeft, FiCheckCircle,
  FiPlusSquare, FiCheck, FiActivity, FiExternalLink, FiMoreHorizontal, FiHash, FiCopy
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ar } from 'date-fns/locale';
import api from '../api';
import debounce from 'lodash/debounce';




const ROWS_OPTIONS = [5, 10, 25, 50];

const STATUS_TRANSLATIONS = { ACTIVE: 'نشط', SCHEDULED: 'قادم', EXPIRED: 'منتهي' };

const STATUS_STYLE = {
  ACTIVE:    { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  SCHEDULED: { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600',   dot: 'bg-amber-500'   },
  EXPIRED:   { bg: 'bg-red-50 dark:bg-red-900/20',     text: 'text-red-600',     dot: 'bg-red-500'     },
};

const getStatusStyle = (s) => STATUS_STYLE[s] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const EMPTY_FORM = {
  name: '', description: '', discountValue: '',
  discountType: 'PERCENTAGE', status: 'ACTIVE',
  startDate: null, endDate: null,
};




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




const StatusBadge = memo(({ status }) => {
  const cs = getStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text}`}>
       <span className={`w-1.5 h-1.5 rounded-full ${cs.dot} animate-pulse`} />
       {STATUS_TRANSLATIONS[status] || status}
    </span>
  );
});




const ShopOffers = () => {
  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showAddEdit, setShowAddEdit]     = useState(false);
  const [editingOffer, setEditingOffer]   = useState(null);
  const [formData, setFormData]           = useState(EMPTY_FORM);
  const [detailsOffer, setDetailsOffer]   = useState(null);

  useEffect(() => { document.title = 'إدارة العروض'; }, []);

  const showToast = useCallback((text, icon) =>
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    }), []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shop/offers');
      setOffers(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch { showToast('فشل في تحميل العروض', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const stats = useMemo(() => ({
    total:      offers.length,
    active:     offers.filter(o => o.status === 'ACTIVE').length,
    percentage: offers.filter(o => o.discountType === 'PERCENTAGE').length,
    fixed:      offers.filter(o => o.discountType === 'FIXED_AMOUNT').length,
  }), [offers]);

  const filteredOffers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return offers;
    return offers.filter(o => 
      o.name?.toLowerCase().includes(term) ||
      o.description?.toLowerCase().includes(term)
    );
  }, [offers, searchTerm]);

  const paginated = useMemo(() => filteredOffers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredOffers, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(filteredOffers.length / rowsPerPage);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.discountValue || !formData.startDate || !formData.endDate) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
    try {
      if (editingOffer) {
        await api.put(`/api/shop/offers/${editingOffer.id}`, formData);
        showToast('تم تعديل العرض بنجاح', 'success');
      } else {
        await api.post('/api/shop/offers', formData);
        showToast('تم إضافة العرض بنجاح', 'success');
      }
      setShowAddEdit(false);
      fetchOffers();
    } catch { showToast('حدث خطأ أثناء الحفظ', 'error'); }
  };

  const deleteOffer = useCallback(async (offerId) => {
    const { isConfirmed } = await Swal.fire({
      title: 'تأكيد الحذف', text: 'هل أنت متأكد من حذف هذا العرض نهائياً؟', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/shop/offers/${offerId}`);
      showToast('تم حذف العرض بنجاح', 'success');
      fetchOffers();
    } catch { showToast('فشل حذف العرض', 'error'); }
  }, [fetchOffers, showToast]);

  const toggleOfferStatus = useCallback(async (offer) => {
    const nextStatus = offer.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
    try {
      await api.put(`/api/shop/offers/${offer.id}`, { ...offer, status: nextStatus });
      showToast(`تم ${nextStatus === 'ACTIVE' ? 'تفعيل' : 'إيقاف'} العرض`, 'success');
      fetchOffers();
    } catch { showToast('فشل تغيير الحالة', 'error'); }
  }, [fetchOffers, showToast]);

  const statCards = useMemo(() => [
    { icon: FiTag, label: 'إجمالي العروض', value: stats.total.toLocaleString('ar-EG'), color: "lime", description: "جميع الحملات الترويجية" },
    { icon: FiCheckCircle, label: 'العروض النشطة', value: stats.active.toLocaleString('ar-EG'), color: "emerald", description: "متاحة للعملاء الآن" },
    { icon: FiPercent, label: 'خصم مئوي', value: stats.percentage.toLocaleString('ar-EG'), color: "blue", description: "عروض بنسبة مئوية" },
    { icon: FiDollarSign, label: 'خصم ثابت', value: stats.fixed.toLocaleString('ar-EG'), color: "orange", description: "خصم مبالغ محددة" },
  ], [stats]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

      
      
        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">الحملات التسويقية</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-lime-500">العروض</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">جذب المزيد من العملاء من خلال إنشاء خصومات وعروض حصرية لمتجرك</p>
          </div>

          <button 
            onClick={() => { setEditingOffer(null); setFormData(EMPTY_FORM); setShowAddEdit(true); }}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest hover:bg-lime-500 dark:hover:bg-lime-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <FiPlus size={16} /> إنشاء عرض جديد
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
                placeholder="ابحث باسم العرض أو الكود..."
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
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">العرض</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الخصم</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الصلاحية</th>
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
                        <FiTag size={40} />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد عروض حالياً</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">ابدأ بإطلاق أولى حملاتك الترويجية الآن</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(o => {
                    const cs = getStatusStyle(o.status);
                    return (
                      <tr key={o.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                               <FiTag size={18} />
                            </div>
                            <div>
                               <p className="text-xs font-black text-gray-900 dark:text-white">{o.name}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{o.description?.slice(0, 30)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center font-mono font-black text-xs text-lime-600">
                           {o.discountValue}{o.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                           <p className="text-[10px] font-black text-gray-900 dark:text-white">{new Date(o.startDate).toLocaleDateString('ar-EG')}</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">إلى {new Date(o.endDate).toLocaleDateString('ar-EG')}</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                           <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cs.dot} animate-pulse`} />
                              {STATUS_TRANSLATIONS[o.status] || o.status}
                           </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-left">
                           <div className="flex items-center justify-start gap-2">
                             <button title="تفاصيل العرض" onClick={() => { setDetailsOffer(o); }} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 transition-all active:scale-95">
                                <FiInfo size={16} />
                             </button>
                              <button title={o.status === 'ACTIVE' ? "إيقاف العرض" : "تفعيل العرض"} onClick={() => toggleOfferStatus(o)} className={`p-3 rounded-2xl transition-all active:scale-95 ${o.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500'}`}>
                                 <FiCheckCircle size={16} />
                              </button>
                              <button title="تعديل العرض" onClick={() => { setEditingOffer(o); setFormData({...o, startDate: new Date(o.startDate), endDate: new Date(o.endDate)}); setShowAddEdit(true); }} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-amber-500 transition-all active:scale-95">
                                 <FiEdit3 size={16} />
                              </button>
                               <button title="حذف العرض" onClick={() => deleteOffer(o.id)} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all active:scale-95">
                                  <FiTrash2 size={16} />
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
                 عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filteredOffers.length)}</span> من <span className="text-gray-900 dark:text-white">{filteredOffers.length}</span> عرض
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

     
     
      {showAddEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowAddEdit(false)} />
           <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar-thin">
              <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-lime-500/10 text-lime-600 flex items-center justify-center">
                       <FiPlusSquare size={20} />
                    </div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">{editingOffer ? "تعديل بيانات العرض" : "إنشاء حملة ترويجية جديدة"}</h3>
                 </div>
                 <button onClick={() => setShowAddEdit(false)} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                    <FiX size={18} />
                 </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">اسم العرض</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">قيمة الخصم</label>
                    <input type="number" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">نوع الخصم</label>
                    <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all cursor-pointer">
                       {/* <option value="PERCENTAGE">نسبة مئوية (%)</option> */}
                       <option value="FIXED_AMOUNT">مبلغ ثابت (ج.م)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">تاريخ البداية</label>
                    <DatePicker selected={formData.startDate} onChange={date => setFormData({...formData, startDate: date})} showTimeSelect dateFormat="dd/MM/yyyy HH:mm" locale={ar} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">تاريخ النهاية</label>
                    <DatePicker selected={formData.endDate} onChange={date => setFormData({...formData, endDate: date})} showTimeSelect dateFormat="dd/MM/yyyy HH:mm" locale={ar} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
                 </div>
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">وصف العرض</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all resize-none" />
                 </div>
              </div>

              <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-4">
                 <button onClick={() => setShowAddEdit(false)} className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-all">إلغاء</button>
                 <button onClick={handleSubmit} className="flex-1 py-4 bg-lime-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/20">{editingOffer ? "حفظ التعديلات" : "اضافة العرض"}</button>
              </div>
           </div>
        </div>
      )}

      
      
      {detailsOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setDetailsOffer(null)} />
           <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-lime-500/10 text-lime-600 flex items-center justify-center">
                       <FiInfo size={20} />
                    </div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">تفاصيل العرض</h3>
                 </div>
                 <button onClick={() => setDetailsOffer(null)} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                    <FiX size={18} />
                 </button>
              </div>
              <div className="p-8 space-y-6 text-right">
                 <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">اسم العرض</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{detailsOffer.name}</p>
                    <p className="text-sm font-bold text-gray-500 mt-2 leading-relaxed">{detailsOffer.description || "لا يوجد وصف لهذا العرض"}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-lime-500/5 dark:bg-lime-500/10 rounded-2xl border border-lime-500/10 text-center">
                       <p className="text-[10px] font-black text-lime-600 uppercase tracking-widest">قيمة الخصم</p>
                       <p className="text-xl font-black text-lime-600">{detailsOffer.discountValue}{detailsOffer.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-center">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الحالة</p>
                       <StatusBadge status={detailsOffer.status} />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">يبدأ من</span>
                       <span className="text-xs font-bold text-gray-900 dark:text-white">{new Date(detailsOffer.startDate).toLocaleString('ar-EG')}</span>
                    </div>
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ينتهي في</span>
                       <span className="text-xs font-bold text-red-500">{new Date(detailsOffer.endDate).toLocaleString('ar-EG')}</span>
                    </div>
                 </div>
              </div>
              <div className="px-8 py-6 border-t border-gray-50 dark:border-gray-700">
                 <button onClick={() => setDetailsOffer(null)} className="w-full py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إغلاق</button>
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
        .react-datepicker-wrapper { width: 100%; }
      `}} />
    </div>
  );
};

export default memo(ShopOffers);