import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import Swal from 'sweetalert2';
import {
  FiEdit3, FiMapPin, FiTrash2, FiCheckSquare, FiX,
  FiMail, FiPhone, FiStar, FiCalendar, FiTag, FiCheckCircle,
  FiShield, FiLock, FiPlus, FiCheck, FiCamera, FiLayout, FiActivity, FiGlobe, FiPackage, FiInfo, FiHash
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import api from '../api';
import useAuthStore from '../store/Auth';


const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-start', showConfirmButton: false, timer: 3000 });

const EMPTY_SHOP = {
  id: '', email: '', name: '', description: '', password: '',
  verified: false, phone: '', rating: 0,
  createdAt: '', updatedAt: '', shopType: '', activate: false,
};
const EMPTY_ADDR = { state: '', city: '', street: '', building: '', isDefault: false };




const ShopProfile = () => {
  const { accessToken, user } = useAuthStore();
  const shopId = localStorage.getItem('id') || user?.id || user?.shopId;
  const logoInputRef = useRef(null);

  const [shop, setShop]                       = useState(EMPTY_SHOP);
  const [addresses, setAddresses]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [addrSaving, setAddrSaving]           = useState(false);

  const [showAddForm, setShowAddForm]         = useState(false);
  const [newAddress, setNewAddress]           = useState(EMPTY_ADDR);
  const [editingAddrId, setEditingAddrId]     = useState(null);
  const [editingAddr, setEditingAddr]         = useState(EMPTY_ADDR);

  useEffect(() => { document.title = 'الملف المهني للمتجر'; }, []);

  const fetchAllData = useCallback(async () => {
    if (!accessToken || !shopId) return;
    setLoading(true);
    try {
      const [shopRes, addrRes] = await Promise.allSettled([
        api.get(`/api/shops/${shopId}`),
        api.get('/api/shops/address'),
      ]);

      if (shopRes.status === 'fulfilled') {
        const d = shopRes.value.data || {};
        setShop({ ...d, password: '' });
        if (addrRes.status === 'fulfilled') {
          setAddresses(addrRes.value.data?.content || addrRes.value.data || []);
        }
      }
    } catch { showToast('فشل تحميل بيانات المتجر', 'error'); }
    finally { setLoading(false); }
  }, [accessToken, shopId]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const updateShop = useCallback(async () => {
    if (!shop.name.trim()) { showToast('اسم المتجر مطلوب', 'warning'); return; }
    setSaving(true);
    try {
      const payload = { name: shop.name, description: shop.description };
      if (shop.password?.trim()) payload.password = shop.password.trim();
      await api.put(`/api/shops/${shopId}`, payload);
      showToast('تم تحديث البيانات بنجاح', 'success');
      setShop(p => ({ ...p, password: '' }));
      fetchAllData();
    } catch { showToast('فشل التحديث', 'error'); }
    finally { setSaving(false); }
  }, [shop.name, shop.description, shop.password, shopId, fetchAllData]);

  const handleLogoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/api/shops/${shopId}/logo`, fd);
      showToast('تم تحديث الشعار بنجاح', 'success');
      fetchAllData();
    } catch { showToast('فشل تحميل الشعار', 'error'); }
  }, [shopId, fetchAllData]);

  const addAddress = async () => {
    setAddrSaving(true);
    try {
      await api.post('/api/shops/address', newAddress);
      showToast('تمت إضافة العنوان بنجاح', 'success');
      setNewAddress(EMPTY_ADDR); setShowAddForm(false); fetchAllData();
    } catch { showToast('فشل إضافة العنوان', 'error'); }
    finally { setAddrSaving(false); }
  };

  const deleteAddress = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'حذف العنوان؟', text: 'سيتم إزالة هذا العنوان نهائياً من سجلاتك',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/shops/address/${id}`);
      showToast('تم حذف العنوان', 'success');
      fetchAllData();
    } catch { showToast('فشل حذف العنوان', 'error'); }
  };

  const updateAddress = async () => {
    setAddrSaving(true);
    try {
      await api.put(`/api/shops/address/${editingAddrId}`, editingAddr);
      showToast('تم تحديث العنوان بنجاح', 'success');
      setEditingAddrId(null); setEditingAddr(EMPTY_ADDR); fetchAllData();
    } catch { showToast('فشل تحديث العنوان', 'error'); }
    finally { setAddrSaving(false); }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

       
       
        <div className="relative h-64 lg:h-80 w-full rounded-none overflow-hidden shadow-2xl group">
           <div className="absolute inset-0 bg-gradient-to-br from-lime-600 via-lime-500 to-emerald-600 opacity-90 group-hover:scale-105 transition-transform duration-1000" />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
           <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-right">
                  <div className="relative group/avatar cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                    <div className="w-32 h-32 lg:w-40 h-40 rounded-none p-2 relative">
                       <div className="w-full h-full rounded-[2rem] bg-gray-100 flex items-center justify-center text-lime-600 overflow-hidden relative">
                          {shop.logo ? <img src={shop.logo} alt="Logo" className="w-full h-full object-cover" /> : shop.name ? <span className="text-5xl font-black">{shop.name[0]}</span> : <FaStore size={48} />}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                             <FiCamera className="text-white" size={32} />
                          </div>
                       </div>
                    </div>
                    <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </div>
                 <div className="text-white space-y-2 mb-2">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                       <h1 className="text-3xl lg:text-5xl font-black tracking-tighter">{shop.name || "متجر جديد"}</h1>
                       {shop.verified && <FiCheckCircle className="text-lime-200 fill-lime-500" size={24} />}
                    </div>
                    <p className="text-lime-100/80 text-sm lg:text-base font-bold flex items-center justify-center md:justify-start gap-2">
                       <FiTag size={16} /> {shop.shopType || "مركز صيانة معتمد"}
                    </p>
                 </div>
              </div>
              <div className="flex gap-3 mb-2">
                 <div className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-center min-w-[100px]">
                    <p className="text-[10px] font-black text-lime-200 uppercase tracking-widest">التقييم</p>
                    <p className="text-xl font-black text-white">{shop.rating ? Number(shop.rating).toFixed(1) : "5.0"}</p>
                 </div>
                 <div className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-center min-w-[100px]">
                    <p className="text-[10px] font-black text-lime-200 uppercase tracking-widest">الحالة</p>
                    <p className="text-xl font-black text-white">{shop.activate ? "نشط" : "معلق"}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
           <div className="lg:col-span-1 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 p-8 shadow-xl shadow-gray-200/20 dark:shadow-none space-y-6">
                 <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <FiInfo className="text-lime-500" /> نظرة عامة
                 </h3>
                 <div className="space-y-4">
                    {[
                       { icon: FiMail, label: "البريد الإلكتروني", value: shop.email },
                       { icon: FiPhone, label: "رقم التواصل", value: shop.phone || "لم يتم التحديد" },
                       { icon: FiGlobe, label: "تاريخ الانضمام", value: new Date(shop.createdAt).toLocaleDateString('ar-EG') },
                       { icon: FiShield, label: "رقم السجل", value: `SH-${shop.id?.slice(0, 8)}` },
                    ].map(item => (
                       <div key={item.label} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-sm">
                             <item.icon size={14} className="text-lime-500" /> {item.value}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

          
           <div className="lg:col-span-2 space-y-8">
             
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 shadow-xl shadow-gray-200/20 dark:shadow-none">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                       <FiEdit3 className="text-lime-500" /> بيانات المتجر
                    </h3>
                    <button title="حفظ البيانات" onClick={updateShop} disabled={saving} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black rounded-2xl hover:bg-lime-500 dark:hover:bg-lime-500 hover:text-white transition-all disabled:opacity-50">
                       {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">اسم الكيان التجاري</label>
                       <input type="text" value={shop.name} onChange={e => setShop({...shop, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">تغيير كلمة المرور</label>
                       <input type="password" value={shop.password} onChange={e => setShop({...shop, password: e.target.value})} placeholder="اتركها فارغة للأمان" className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">وصف النشاط التجاري</label>
                       <textarea value={shop.description} onChange={e => setShop({...shop, description: e.target.value})} rows="4" className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all resize-none" placeholder="اكتب هنا خدمات متجرك ومميزاته..." />
                    </div>
                 </div>
              </div>

             
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 shadow-xl shadow-gray-200/20 dark:shadow-none">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                       <FiMapPin className="text-lime-500" /> عناوين الفروع
                    </h3>
                    <button title="إضافة عنوان جديد" onClick={() => setShowAddForm(true)} className="w-10 h-10 bg-lime-500 text-white rounded-2xl flex items-center justify-center hover:bg-lime-600 transition-all active:scale-90 shadow-lg shadow-lime-500/20">
                       <FiPlus size={20} />
                    </button>
                 </div>

                 {showAddForm && (
                    <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-lime-500/20 space-y-6 animate-in slide-in-from-top-4 duration-300">
                       <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="المحافظة" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border-none text-sm font-bold" />
                          <input type="text" placeholder="المدينة" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border-none text-sm font-bold" />
                          <input type="text" placeholder="الشارع" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="px-5 py-3 rounded-xl bg-white dark:bg-gray-800 border-none text-sm font-bold md:col-span-2" />
                       </div>
                       <div className="flex gap-3">
                          <button onClick={addAddress} disabled={addrSaving} className="flex-1 py-3 bg-lime-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/10">إضافة العنوان</button>
                          <button onClick={() => setShowAddForm(false)} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl text-xs font-black transition-all">إلغاء</button>
                       </div>
                    </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                       <div className="md:col-span-2 py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                          <FiMapPin size={32} className="text-gray-300 mx-auto mb-3" />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">لم تقم بإضافة أي عناوين حتى الآن</p>
                       </div>
                    ) : addresses.map(addr => (
                       editingAddrId === addr.id ? (
                          <div key={addr.id} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-lime-500/50 space-y-4 shadow-lg animate-in fade-in duration-300">
                             <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="المحافظة" value={editingAddr.state} onChange={e => setEditingAddr({...editingAddr, state: e.target.value})} className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-none text-xs font-bold" />
                                <input type="text" placeholder="المدينة" value={editingAddr.city} onChange={e => setEditingAddr({...editingAddr, city: e.target.value})} className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-none text-xs font-bold" />
                                <input type="text" placeholder="الشارع" value={editingAddr.street} onChange={e => setEditingAddr({...editingAddr, street: e.target.value})} className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-none text-xs font-bold md:col-span-2" />
                             </div>
                             <div className="flex gap-2">
                                <button onClick={updateAddress} disabled={addrSaving} className="flex-1 py-2.5 bg-lime-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/10">حفظ التعديلات</button>
                                <button onClick={() => setEditingAddrId(null)} className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl text-[10px] font-black transition-all">إلغاء</button>
                             </div>
                          </div>
                       ) : (
                       <div key={addr.id} className="group p-5 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-gray-700 hover:border-lime-500/50 transition-all">
                          <div className="flex items-start justify-between">
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                   <p className="text-sm font-black text-gray-900 dark:text-white">{addr.state}، {addr.city}</p>
                                   {addr.isDefault && <span className="px-2 py-0.5 bg-lime-500 text-white text-[8px] font-black uppercase rounded-full">أساسي</span>}
                                </div>
                                <p className="text-xs font-bold text-gray-400">{addr.street}</p>
                             </div>
                             <div className="flex flex-col gap-1 md:flex-row md:gap-2">
                               <button title="تعديل العنوان" onClick={() => { setEditingAddrId(addr.id); setEditingAddr(addr); }} className="p-2 text-gray-400 hover:text-lime-500 transition-colors">
                                  <FiEdit3 size={16} />
                               </button>
                               <button title="حذف العنوان" onClick={() => deleteAddress(addr.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                  <FiTrash2 size={16} />
                               </button>
                             </div>
                          </div>
                       </div>
                       )
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

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

export default memo(ShopProfile);