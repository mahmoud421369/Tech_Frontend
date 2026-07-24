import React, { useEffect, useState, memo, lazy, Suspense } from 'react';
import { FiMessageSquare, FiBell, FiClock, FiZap, FiChevronLeft } from 'react-icons/fi';

const ShopChatModal = lazy(() => import('../components/ShopChatModal'));

const InstantChatIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(249,115,22,0.10)" />
    <path d="M16 22 C16 17.5 21 14 28 14 C35 14 40 17.5 40 22 C40 26.5 35 30 28 30 C26.3 30 24.7 29.8 23.3 29.3 L17 32 L18.7 26.8 C17 25.5 16 23.9 16 22 Z"
      fill="none" stroke="#f97316" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M42 34 L47 24 L44 24 L49 14 L45 24 L48 24 Z" fill="#fbbf24" />
  </svg>
));

const SmartNotificationIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(59,130,246,0.10)" />
    <path d="M32 16 C26 16 22 20 22 26 V34 L18 40 H46 L42 34 V26 C42 20 38 16 32 16 Z" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M27 44 C27 47 29.5 48.5 32 48.5 C34.5 48.5 37 47 37 44" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="42" cy="18" r="4" fill="#ef4444" />
  </svg>
));

const HistoryArchiveIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(168,85,247,0.10)" />
    <rect x="16" y="20" width="32" height="24" rx="4" fill="none" stroke="#a855f7" strokeWidth="2.4" />
    <path d="M16 28 H48" stroke="#a855f7" strokeWidth="2.2" />
    <circle cx="23" cy="24" r="1.6" fill="#a855f7" />
    <circle cx="29" cy="24" r="1.6" fill="#a855f7" />
    <path d="M22 34 H36" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 39 H32" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
  </svg>
));

const MainChatIllustration = memo(() => (
  <svg viewBox="0 0 220 160" className="w-52 h-40 sm:w-64 sm:h-48">
    <circle cx="180" cy="30" r="42" fill="rgba(16,185,129,0.10)" />
    <circle cx="26" cy="130" r="28" fill="rgba(16,185,129,0.08)" />
    <g transform="translate(48,28)">
      <path d="M0 20 C0 9 14 0 32 0 C50 0 64 9 64 20 C64 31 50 40 32 40 C28.4 40 25 39.6 21.9 38.8 L6 48 L10 34.4 C4 30.8 0 26 0 20 Z"
        fill="#ffffff" stroke="#e5e7eb" strokeWidth="2.4" className="dark:fill-gray-800 dark:stroke-gray-700" />
      <circle cx="18" cy="20" r="3" fill="#10b981" />
      <circle cx="32" cy="20" r="3" fill="#10b981" />
      <circle cx="46" cy="20" r="3" fill="#10b981" />
    </g>
    <g transform="translate(120,66)">
      <path d="M0 16 C0 7.2 11 0 25 0 C39 0 50 7.2 50 16 C50 24.8 39 32 25 32 C22.3 32 19.6 31.7 17.2 31.1 L5 38 L8 27.4 C3 24.6 0 20.6 0 16 Z"
        fill="#10b981" />
      <circle cx="14" cy="16" r="2.6" fill="white" />
      <circle cx="25" cy="16" r="2.6" fill="white" />
      <circle cx="36" cy="16" r="2.6" fill="white" />
    </g>
    <path d="M18 20 L22 12 L19 12 L24 3 L20 12 L23 12 Z" fill="#fbbf24" />
    <circle cx="196" cy="112" r="3" fill="#34d399" />
    <circle cx="206" cy="100" r="2" fill="#6ee7b7" />
  </svg>
));

const TipIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(255,255,255,0.10)" />
    <path d="M32 14 C24.8 14 19 19.8 19 27 C19 32.5 22.3 37.2 27 39.2 V44 H37 V39.2 C41.7 37.2 45 32.5 45 27 C45 19.8 39.2 14 32 14 Z"
      fill="none" stroke="#fbbf24" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M27 48 H37 M28.5 52 H35.5" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M32 20 V27 L37 30" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const FeatureCard = memo(({ Illustration, label, color, description }) => (
  <div className="relative group bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="flex flex-col h-full relative z-10 text-right">
      <div className="w-14 h-14 mb-4 group-hover:rotate-6 transition-transform">
        <Illustration />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-black text-gray-900 dark:text-white mt-1 uppercase tracking-widest">{description}</p>
    </div>
  </div>
));

const FEATURE_CARDS = [
  { Illustration: InstantChatIllustration, label: 'محادثة فورية', color: 'orange', description: 'تواصل مباشر وسريع' },
  { Illustration: SmartNotificationIllustration, label: 'إشعارات ذكية', color: 'blue', description: 'تنبيهات الرسائل الجديدة' },
  { Illustration: HistoryArchiveIllustration, label: 'سجل كامل', color: 'purple', description: 'أرشيف المحادثات السابقة' },
];

const Chat = () => {
  const [openChat, setOpenChat] = useState(false);

  useEffect(() => { document.title = 'إدارة المحادثات'; }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mt-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">مركز الاتصال</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-emerald-500">المحادثات</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">عزز علاقتك بعملائك من خلال نظام دردشة فوري ومتطور</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {FEATURE_CARDS.map(f => <FeatureCard key={f.label} {...f} />)}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-1000" />
           
           <div className="relative z-10 px-8 py-16 sm:py-20 flex flex-col items-center text-center space-y-6">
              <MainChatIllustration />

              <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 relative group-hover:scale-110 transition-transform duration-500">
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
                className="group flex items-center gap-3 px-10 py-5 rounded-[2rem] bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-2xl shadow-gray-900/20 active:scale-95"
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

        <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-emerald-500 dark:to-teal-600 rounded-md p-10 text-white relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700" />
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6 text-right">
                 <div className="w-16 h-16 flex-shrink-0 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <div className="w-10 h-10"><TipIllustration /></div>
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight">نصيحة تجارية</h3>
                    <p className="text-sm font-bold text-gray-300 leading-relaxed">الرد على العملاء في أقل من ٥ دقائق يزيد من احتمالية إتمام الطلبات بنسبة ٤٠٪</p>
                 </div>
              </div>
           </div>
        </div>

      </div>

      <Suspense fallback={null}>
        <ShopChatModal open={openChat} onClose={() => setOpenChat(false)} />
      </Suspense>
    </div>
  );
};

export default memo(Chat);