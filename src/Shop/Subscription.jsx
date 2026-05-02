import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  FaCalendar, FaCreditCard, FaMoneyBillWave, FaHeadset, FaCogs,
} from 'react-icons/fa';
import { FiChevronDown, FiX, FiCheck, FiRefreshCw, FiZap, FiActivity, FiArrowLeft, FiClock, FiShield, FiMoreHorizontal } from 'react-icons/fi';
import { RiCalendar2Line, RiStore2Line, RiVerifiedBadgeLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';




const PRICE_PER_MONTH  = { COMMISSION: 1000, RATIO: 800 };
const TYPE_LABELS      = { COMMISSION: 'خطة العمولة الذكية', RATIO: 'الخطة الثابتة الاحترافية' };
const CURRENCY         = 'EGP';




const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-start', showConfirmButton: false, timer: 3000 });




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




const Subscriptions = () => {
  const [currentSub, setCurrentSub] = useState(null);
  const [allSubs, setAllSubs]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [duration, setDuration]     = useState(1);
  const [type, setType]             = useState('COMMISSION');

  useEffect(() => { document.title = 'إدارة الاشتراكات الاحترافية'; }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [currentRes, allRes] = await Promise.allSettled([
        api.get('/api/subscriptions'),
        api.get('/api/subscriptions/all'),
      ]);
      if (currentRes.status === 'fulfilled') setCurrentSub(currentRes.value.data?.[0] || currentRes.value.data);
      if (allRes.status === 'fulfilled') setAllSubs(Array.isArray(allRes.value.data) ? allRes.value.data : allRes.value.data?.content || []);
    } catch { showToast('فشل تحميل بيانات الاشتراكات', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubscribe = async (method) => {
    setSubmitting(true);
    try {
      const payload = { months: duration, type: type.toUpperCase() };
      const endpoint = method === 'card' ? '/api/subscriptions/card' : '/api/subscriptions/cash';
      const res = await api.post(endpoint, payload);
      
      if (method === 'card' && res.data.paymentURL) {
        window.location.href = res.data.paymentURL;
      } else {
        showToast(method === 'card' ? 'تم تفعيل الاشتراك بنجاح' : 'تم إرسال طلب الدفع النقدي', 'success');
        fetchData();
      }
    } catch { showToast('فشل إتمام العملية', 'error'); }
    finally { setSubmitting(false); }
  };

  const isActive = (date) => date && new Date(date) > new Date();

  const statCards = [
    { icon: FiShield, label: 'حالة الحساب', value: isActive(currentSub?.endDate) ? "نشط" : "منتهي", color: "emerald", description: "بناءً على اشتراكك الحالي" },
    { icon: FiClock, label: 'تاريخ الانتهاء', value: currentSub?.endDate ? new Date(currentSub.endDate).toLocaleDateString('ar-EG') : "—", color: "orange", description: "موعد تجديد الاشتراك" },
    { icon: FiZap, label: 'الخطة الحالية', value: currentSub?.type ? (TYPE_LABELS[currentSub.type] || currentSub.type) : "لا يوجد", color: "blue", description: "نوع الاشتراك المفعل" },
    { icon: FiActivity, label: 'العمليات', value: allSubs.length.toLocaleString('ar-EG'), color: "indigo", description: "إجمالي سجل المدفوعات" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

      
      

        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">نظام العضويات</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">باقات <span className="text-lime-500">الاشتراك</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">اختر الباقة المناسبة لحجم أعمالك واستمتع بمميزات تقنية غير محدودة</p>
          </div>
        </div>

       
       

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 p-8 shadow-xl shadow-gray-200/20 dark:shadow-none space-y-8">
                 <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">اختر خطتك</h3>
                    <div className="space-y-3">
                       {['COMMISSION', 'RATIO'].map(t => (
                          <button key={t} onClick={() => setType(t)} className={`w-full p-5 rounded-none border-2 transition-all text-right group ${type === t ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/10' : 'border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-lime-200'}`}>
                             <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-black uppercase tracking-widest ${type === t ? 'text-lime-600' : 'text-gray-400'}`}>{t === 'COMMISSION' ? "الأكثر شيوعاً" : "للمحترفين"}</p>
                                {type === t && <div className="w-5 h-5 rounded-full bg-lime-500 flex items-center justify-center text-white"><FiCheck size={12} /></div>}
                             </div>
                             <p className={`text-sm font-black ${type === t ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{TYPE_LABELS[t]}</p>
                             <p className="text-xl font-black text-lime-600 mt-2">{PRICE_PER_MONTH[t]} {CURRENCY} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">/ شهر</span></p>
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">مدة الاشتراك</h3>
                    <div className="grid grid-cols-2 gap-3">
                       {[1, 3, 6, 12].map(m => (
                          <button title="اختر المدة" key={m} onClick={() => setDuration(m)} className={`py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${duration === m ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-xl' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-400 hover:bg-gray-100'}`}>
                             {m === 1 ? "شهر واحد" : m === 12 ? "سنة كاملة" : `${m} أشهر`}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4 text-center">
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الإجمالي المطلوب</span>
                       <span className="text-2xl font-black text-gray-900 dark:text-white">{(PRICE_PER_MONTH[type] * duration).toLocaleString('ar-EG')} {CURRENCY}</span>
                    </div>
                    <div className="flex gap-3">
                       <button title="الدفع بالبطاقة" onClick={() => handleSubscribe('card')} disabled={submitting} className="flex-1 py-4 bg-lime-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/20 active:scale-95">الدفع بالبطاقة</button>
                       <button title="الدفع نقداً" onClick={() => handleSubscribe('cash')} disabled={submitting} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95">دفع نقدي</button>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">بضغطك على زر الاشتراك أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بالمنصة</p>
                 </div>
              </div>
           </div>

           
           
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
                 <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-900/30">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">سجل المدفوعات والاشتراكات</h3>
                    {/* <FiMoreHorizontal size={20} className="text-gray-400" /> */}
                 </div>
                 <div className="overflow-x-auto custom-scrollbar-thin">
                    <table className="w-full text-right border-collapse">
                       <thead>
                          <tr className="border-b border-gray-50 dark:border-gray-800">
                             <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">النوع</th>
                             <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المبلغ</th>
                             <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الصلاحية</th>
                             <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-left">الحالة</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {loading ? (
                             [...Array(3)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                   {[...Array(4)].map((_, j) => <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>)}
                                </tr>
                             ))
                          ) : allSubs.length === 0 ? (
                             <tr>
                                <td colSpan={4} className="px-8 py-20 text-center">
                                   <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-200">
                                      <FiZap size={32} />
                                   </div>
                                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest">لا يوجد سجل مدفوعات حالياً</p>
                                </td>
                             </tr>
                          ) : allSubs.map(sub => {
                             const active = isActive(sub.endDate);
                             return (
                                <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                   <td className="px-8 py-6 whitespace-nowrap">
                                      <p className="text-xs font-black text-gray-900 dark:text-white">{TYPE_LABELS[sub.type] || sub.type}</p>
                                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">#{sub.id?.slice(0, 8)}</p>
                                   </td>
                                   <td className="px-8 py-6 whitespace-nowrap text-center font-mono font-black text-xs text-lime-600">
                                      {Number(sub.totalAmount)} {CURRENCY}
                                   </td>
                                   <td className="px-8 py-6 whitespace-nowrap text-center">
                                      <p className="text-[10px] font-black text-gray-900 dark:text-white">{new Date(sub.startDate).toLocaleDateString('ar-EG')}</p>
                                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">إلى {new Date(sub.endDate).toLocaleDateString('ar-EG')}</p>
                                   </td>
                                   <td className="px-8 py-6 whitespace-nowrap text-left">
                                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                                         <span className={`w-1 h-1 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                         {active ? "نشط" : "منتهي"}
                                      </span>
                                   </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
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

export default Subscriptions;