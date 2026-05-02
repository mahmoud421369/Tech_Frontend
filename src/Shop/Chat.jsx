import React, { useEffect, useState, memo } from 'react';
import ShopChatModal from '../components/ShopChatModal';
import { FiMessageSquare, FiBell, FiClock, FiZap, FiChevronLeft, FiArrowRight } from 'react-icons/fi';



const FeatureCard = memo(({ icon: Icon, label, color, description }) => (
  <div className="relative group bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="flex flex-col h-full relative z-10 text-right">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-4 group-hover:rotate-6 transition-transform`}>
        <Icon size={22} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-black text-gray-900 dark:text-white mt-1 uppercase tracking-widest">{description}</p>
    </div>
  </div>
));




const Chat = () => {
  const [openChat, setOpenChat] = useState(false);

  useEffect(() => { document.title = 'إدارة المحادثات'; }, []);

  const featureCards = [
    { icon: FiZap, label: 'محادثة فورية', color: 'orange', description: 'تواصل مباشر وسريع' },
    { icon: FiBell, label: 'إشعارات ذكية', color: 'blue', description: 'تنبيهات الرسائل الجديدة' },
    { icon: FiClock, label: 'سجل كامل', color: 'purple', description: 'أرشيف المحادثات السابقة' },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

       
       
        <div className="flex flex-col md:flex-row md:items-end justify-between mt-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">مركز الاتصال</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-lime-500">المحادثات</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">عزز علاقتك بعملائك من خلال نظام دردشة فوري ومتطور</p>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {featureCards.map(f => <FeatureCard key={f.label} {...f} />)}
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden relative group">
         
         
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-500/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-1000" />
           
           <div className="relative z-10 px-8 py-24 flex flex-col items-center text-center space-y-8">
              <div className="w-24 h-24 rounded-[2rem] bg-lime-500 flex items-center justify-center text-white shadow-2xl shadow-lime-500/40 relative group-hover:scale-110 transition-transform duration-500">
                 <FiMessageSquare size={44} />
                 <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-4 border-white dark:border-gray-800 rounded-full animate-pulse" />
              </div>

              <div className="space-y-4 max-w-xl">
                 <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">ابدأ المحادثة مع عملائك الآن</h2>
                 <p className="text-sm font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
                    افتح نافذة الدردشة المتكاملة للرد على استفسارات العملاء، متابعة الطلبات، وتقديم الدعم الفني المباشر
                 </p>
              </div>

              <button
                onClick={() => setOpenChat(true)}
                className="group flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-black uppercase tracking-widest hover:bg-lime-500 dark:hover:bg-lime-500 hover:text-white transition-all shadow-2xl shadow-gray-900/20 active:scale-95"
              >
                فتح منصة المحادثات
                <FiChevronLeft className="group-hover:-translate-x-2 transition-transform duration-300" size={20} />
              </button>

              <div className="flex items-center gap-6 pt-8">
                 <div className="flex flex-col items-center">
                    <p className="text-xl font-black text-gray-900 dark:text-white">١٠٠٪</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">معدل الاستجابة</p>
                 </div>
                 <div className="w-[1px] h-8 bg-gray-100 dark:bg-gray-700" />
                 <div className="flex flex-col items-center">
                    <p className="text-xl font-black text-gray-900 dark:text-white">فوري</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">وقت المزامنة</p>
                 </div>
              </div>
           </div>
        </div>

        
        
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-lime-500 dark:to-emerald-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700" />
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6 text-right">
                 <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <FiZap size={30} className="text-lime-400 dark:text-white" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight">نصيحة تجارية</h3>
                    <p className="text-sm font-bold text-gray-300 leading-relaxed">الرد على العملاء في أقل من ٥ دقائق يزيد من احتمالية إتمام الطلبات بنسبة ٤٠٪</p>
                 </div>
              </div>
           </div>
        </div>

      </div>

      <ShopChatModal open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
};

export default Chat;