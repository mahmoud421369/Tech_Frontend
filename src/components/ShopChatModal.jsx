import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  FiX, FiSend, FiCheckCircle, FiArrowRight
} from 'react-icons/fi';
import { RiVerifiedBadgeLine, RiChatSmile2Line, RiHistoryLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/Auth';




const WS_URL = import.meta.env?.VITE_WS_URL || 'https://api.tech-restore.tech/ws';
const MAX_MSG_LEN = 2000;
const RECONNECT_DELAY = 5000;


const EMPTY_SHOP = {
  id: '', email: '', name: '', description: '', password: '',
  verified: false, phone: '', rating: 0,
  createdAt: '', updatedAt: '', shopType: '', activate: false,
};



const initial = (name) =>
  (typeof name === 'string' ? name.trim()[0]?.toUpperCase() : null) || 'U';

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
};

const sanitize = (str) =>
  typeof str === 'string'
    ? DOMPurify.sanitize(str, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'], ALLOWED_ATTR: [] })
    : '';


    

const SessionItem = memo(({ session, isActive, onClick }) => (
  <motion.div
    whileHover={{ x: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={clsx(
      'group relative p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 border mb-2 select-none overflow-hidden text-right',
      isActive
        ? 'bg-white dark:bg-gray-800 border-emerald-500 shadow-xl shadow-emerald-500/10'
        : 'bg-gray-50/50 dark:bg-gray-900/30 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
    )}
  >
    {isActive && (
       <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />
    )}
    <div className="flex items-center gap-4">
      <div className={clsx(
        'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform duration-500 group-hover:rotate-6 shadow-sm',
        isActive
          ? 'bg-emerald-500 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
      )}>
        {initial(session.userName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-center gap-2">
          <h4 className={clsx('font-black text-xs truncate tracking-tighter uppercase', isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400')}>
            {session.userName}
          </h4>
          {session.unreadCount > 0 && (
            <span className="shrink-0 min-w-[20px] h-5 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5 animate-bounce">
              {session.unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
              {session.lastMessage?.message ? sanitize(session.lastMessage.message).replace(/<[^>]*>/g, '') : 'جاهز للمساعدة'}
            </p>
            {session.lastMessage?.createdAt && (
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  {formatTime(session.lastMessage.createdAt)}
               </span>
            )}
        </div>
      </div>
    </div>
  </motion.div>
));




const MessageBubble = memo(({ msg, isOwn }) => {
  const safeContent = useMemo(() => sanitize(msg.content || ''), [msg.content]);
  const shopId = localStorage.getItem('id') ;

    
  const [loading, setLoading]                 = useState(true);
  const [shop, setShop]                       = useState(EMPTY_SHOP);


   const fetchAllData = useCallback(async () => {
  
      setLoading(true);
      try {
        const [shopRes] = await Promise.allSettled([
          api.get(`/api/shops/${shopId}`),
         
        ]);
  
        if (shopRes.status === 'fulfilled') {
          const d = shopRes.value.data || {};
          setShop({ ...d, password: '' });
        
        }
      } catch {  }
      finally { setLoading(false); }
    }, [ shopId]);
  
    useEffect(() => { fetchAllData(); }, [fetchAllData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={clsx(
        'flex items-end gap-3 w-full mb-4 font-cairo',
        isOwn ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      <div className={clsx(
        'w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm transition-transform',
        isOwn
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 translate-y-1'
          : 'bg-emerald-500 text-white -translate-y-1',
      )}>
        { initial(msg.senderName) }
      </div>

      <div className={clsx(
        'relative px-5 py-4 rounded-[1.75rem] text-sm leading-relaxed shadow-sm max-w-[80%] group text-right',
        isOwn
          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-br-none'
          : 'bg-emerald-500 text-white rounded-bl-none',
        msg._optimistic && 'opacity-60'
      )}>
        <div
          dir="auto"
          className="text-xs font-bold leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
        <div className={clsx(
          'flex items-center gap-1.5 mt-2 text-[9px] font-black uppercase tracking-widest',
          isOwn ? 'justify-start text-gray-400' : 'justify-end text-white/80',
        )}>
          <span>{formatTime(msg.createdAt)}</span>
          {isOwn && <FiCheckCircle size={10} className={msg.read ? 'text-emerald-500' : 'text-gray-300'} />}
        </div>
      </div>
    </motion.div>
  );
});




const EmptyHero = memo(({ icon: Icon, title, sub }) => (
  <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
    <div className="relative">
       <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
       <div className="relative w-24 h-24 rounded-[2rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-emerald-500 shadow-2xl">
          <Icon size={40} className="animate-pulse" />
       </div>
    </div>
    <div className="space-y-2">
       <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{title}</h3>
       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-[240px] leading-relaxed">{sub}</p>
    </div>
  </div>
));




const ShopChatModal = memo(({ open, onClose }) => {
  const shopProfile = useMemo(() => ({
    email: localStorage.getItem('userEmail') || 'shop@example.com',
    id: localStorage.getItem('id') || null,
  }), []);

  const shopId = localStorage.getItem('id') || user?.id || user?.shopId;


  const [stompClient, setStompClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState(null);
  const { accessToken, user } = useAuthStore();
  const [loading, setLoading]                 = useState(true);
  const [shop, setShop]                       = useState(EMPTY_SHOP);


  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const clientRef = useRef(null);
  const recentSentMessagesRef = useRef(new Set());
  const seenMsgIdsRef = useRef(new Set());

  const showToast = (text, icon) =>
    Swal.fire({ text, icon, toast: true, position: 'top-start', showConfirmButton: false, timer: 3000 });


  
  const fetchTotalUnreadCount = useCallback(async () => {
    if (!shopProfile.id) return;
    try {
      const { data } = await api.get(`/api/chats/${shopProfile.id}/unread-count`);
      setTotalUnreadCount(Number(data.unreadCount ?? data) || 0);
    } catch { }
  }, [shopProfile.id]);


   const fetchAllData = useCallback(async () => {
      if (!accessToken || !shopId) return;
      setLoading(true);
      try {
        const [shopRes] = await Promise.allSettled([
          api.get(`/api/shops/${shopId}`),
         
        ]);
  
        if (shopRes.status === 'fulfilled') {
          const d = shopRes.value.data || {};
          setShop({ ...d, password: '' });
        
        }
      } catch { showToast('فشل تحميل بيانات المتجر', 'error'); }
      finally { setLoading(false); }
    }, [accessToken, shopId]);
  
    useEffect(() => { fetchAllData(); }, [fetchAllData]);

  

  const fetchSessions = useCallback(async () => {
    if (!shopProfile.id) return;
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/api/chats/shop/sessions');
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setSessions(data.map(s => ({
        ...s,
        userName: sanitize(s.userName || s.userEmail || `مستخدم #${String(s.userId).slice(0, 5)}`).replace(/<[^>]*>/g, ''),
        unreadCount: s.unreadCount || 0
      })));
      fetchTotalUnreadCount();
    } catch { setError('فشل تحميل المحادثات'); }
    finally { setIsLoadingSessions(false); }
  }, [fetchTotalUnreadCount, shopProfile.id]);

  const fetchMessages = useCallback(async () => {
    if (!activeSession || !shopProfile.id) return;
    setIsLoadingMessages(true);
    seenMsgIdsRef.current = new Set();
    try {
      const { data } = await api.get(`/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/paginated`);
      const msgs = (data.content || []).map(msg => ({
        id: msg.id,
        content: msg.message || '',
        senderType: msg.sentBy === 'SHOP' ? 'SHOP' : 'USER',
        senderName: msg.sentBy === 'SHOP' ? (msg.shopName || shopProfile.email) : (activeSession.userName || 'مستخدم'),
        createdAt: msg.createdAt,
        read: msg.read || false,
      })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      msgs.forEach(m => seenMsgIdsRef.current.add(m.id));
      
      setMessages(msgs);
      console.log(messages)
      await api.put(`/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/mark-read`);
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, unreadCount: 0 } : s));
      fetchTotalUnreadCount();
    } catch { setError('فشل تحميل الرسائل'); }
    finally { setIsLoadingMessages(false); }
  }, [activeSession, shopProfile.id, shopProfile.email, fetchTotalUnreadCount]);

 
  

  useEffect(() => {
    if (!open) { clientRef.current?.deactivate(); setIsConnected(false); return; }
    fetchSessions();

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      reconnectDelay: RECONNECT_DELAY,
      onConnect: () => { setIsConnected(true); setError(null); },
      onDisconnect: () => setIsConnected(false),
      onStompError: () => { setIsConnected(false); setError('انقطع الاتصال بالخادم'); },
    });

    client.activate();
    clientRef.current = client;
    setStompClient(client);
    return () => client.deactivate();
  }, [open, fetchSessions]);

  useEffect(() => {
    if (activeSession) { setMessages([]); fetchMessages(); }
  }, [activeSession?.id, fetchMessages]);

  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return;

    const handleFrame = (frame) => {
      try {
        const body = JSON.parse(frame.body);
        if (body.type !== 'CHAT' || body.action !== 'SEND' || body.status !== 'SUCCESS') return;
        const p = body.payload || {};
        if (p.id && seenMsgIdsRef.current.has(p.id)) return;

        const rawContent = p.message || p.content || '';
        const isOwn = recentSentMessagesRef.current.has(rawContent);
        if (isOwn) recentSentMessagesRef.current.delete(rawContent);

        const newMsg = {
          id: p.id || `ws-${Date.now()}`,
          content: rawContent,
          senderType: isOwn ? 'SHOP' : 'USER',
          senderName: isOwn ? shopProfile.email : (activeSession.userName || 'مستخدم'),
          createdAt: p.createdAt || new Date().toISOString(),
          read: isOwn,
        };

        if (p.id) seenMsgIdsRef.current.add(p.id);

        setMessages(prev => {
          if (newMsg.senderType === 'SHOP') {
            const optIdx = prev.findIndex(m => m._optimistic && m.content === newMsg.content);
            if (optIdx !== -1) {
              const next = [...prev];
              next[optIdx] = newMsg;
              return next;
            }
          }
          return prev.some(m => m.id === newMsg.id && !m._optimistic) ? prev : [...prev, newMsg];
        });

        setSessions(prev => prev.map(s => s.userId === activeSession.userId ? {
          ...s,
          lastMessage: { message: newMsg.content, sentBy: newMsg.senderType, createdAt: newMsg.createdAt },
          unreadCount: newMsg.senderType === 'USER' ? s.unreadCount + 1 : 0
        } : s));
        fetchTotalUnreadCount();
      } catch { }
    };

    const subConv = stompClient.subscribe(`/topic/chat/${activeSession.userId}/${activeSession.shopId}`, handleFrame);
    const subShop = stompClient.subscribe(`/topic/shop/${activeSession.shopId}/chats`, handleFrame);
    return () => { subConv.unsubscribe(); subShop.unsubscribe(); };
  }, [stompClient, isConnected, activeSession, shopProfile.email, fetchTotalUnreadCount]);

  
  

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !activeSession || !isConnected || !stompClient) return;

    const clean = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
    if (!clean) return;

    const optimisticId = `opt-${Date.now()}`;
    const optimistic = { id: optimisticId, content: clean, senderType: 'SHOP', senderName: shopProfile.email, createdAt: new Date().toISOString(), read: false, _optimistic: true };

    recentSentMessagesRef.current.add(clean);
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    inputRef.current?.focus();

    setSessions(prev => prev.map(s => s.userId === activeSession.userId ? { ...s, lastMessage: { message: clean, sentBy: 'SHOP', createdAt: new Date().toISOString() }, unreadCount: 0 } : s));

    try {
      stompClient.publish({
        destination: `/app/chat/user/${activeSession.userId}/shop/${activeSession.shopId}`,
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ payload: clean, senderId: shopProfile.id, senderType: 'SHOP', sentBy: 'SHOP', recipientId: activeSession.userId }),
      });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setInput(clean);
      setError('فشل إرسال الرسالة');
    }
  }, [input, activeSession, stompClient, isConnected, shopProfile.id, shopProfile.email]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!open || !shopProfile.id) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 font-cairo text-right" dir="rtl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-6xl h-full sm:h-[85vh] bg-white dark:bg-gray-900 sm:rounded-md shadow-2xl overflow-hidden flex border border-gray-100 dark:border-gray-800"
      >
        
        
        <aside className={clsx(
          "w-full sm:w-96 flex flex-col border-l border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 transition-all duration-500 shrink-0",
          !isSidebarOpen && "hidden sm:flex"
        )}>
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex items-center gap-2">
               <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">مركز المحادثات</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">المراسلات</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">تواصل مع عملائك في الوقت الفعلي</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar-thin">
            {isLoadingSessions ? (
               <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : sessions.length === 0 ? (
               <EmptyHero icon={RiChatSmile2Line} title="لا توجد محادثات" sub="لم يقم أي عميل بمراسلتك حتى الآن" />
            ) : (
               sessions.map(s => <SessionItem key={s.id} session={s} isActive={activeSession?.id === s.id} onClick={() => { setActiveSession(s); setIsSidebarOpen(false); }} />)
            )}
          </div>

          <div className="p-8 border-t border-gray-100 dark:border-gray-800">
             <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-3">
                   <div className={clsx("w-3 h-3 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-red-500")} />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isConnected ? "متصل بالخادم" : "غير متصل"}</span>
                </div>
                <RiVerifiedBadgeLine className="text-emerald-500" size={20} />
             </div>
          </div>
        </aside>

      
      
        <main className={clsx("flex-1 flex flex-col bg-white dark:bg-gray-900 relative", isSidebarOpen && "hidden sm:flex")}>
           <AnimatePresence>
              {error && (
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute top-0 inset-x-0 z-50 bg-red-500 text-white p-4 text-center text-xs font-black uppercase tracking-widest">
                   {error}
                </motion.div>
              )}
           </AnimatePresence>

           {activeSession ? (
             <>
              
              
               <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setIsSidebarOpen(true)} className="sm:hidden p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500"><FiArrowRight size={20} /></button>
                     <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/20">
                        {initial(activeSession.userName)}
                     </div>
                     <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{activeSession.userName}</h3>
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">نشط الآن</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={onClose} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all"><FiX size={20} /></button>
                  </div>
               </div>

               
               
               <div className="flex-1 overflow-y-auto px-8 py-10 space-y-2 custom-scrollbar-thin bg-[radial-gradient(circle_at_center,_#f1f5f9_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_#1e293b_1px,_transparent_1px)] bg-[size:32px_32px]">
                  {isLoadingMessages ? (
                     <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : messages.length === 0 ? (
                     <EmptyHero icon={RiHistoryLine} title="بداية جديدة" sub={`ابدأ المحادثة مع ${activeSession.userName} الآن`} />
                  ) : (
                     messages.map(m => <MessageBubble key={m.id} msg={m} isOwn={m.senderType === 'SHOP'} />)
                  )}
                  <div ref={messagesEndRef} />
               </div>

              
              
               <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="relative group">
                     <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        placeholder="اكتب رسالتك هنا..."
                        className="w-full pl-24 pr-6 py-5 cursor-pointer rounded-[2rem] bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all resize-none shadow-sm"
                        rows={1}
                     />
                     <button
                        onClick={sendMessage}
                        disabled={!isConnected || !input.trim()}
                        className={clsx(
                           "absolute left-4 top-1/2 -translate-y-1/2 p-4 text-center rounded-2xl transition-all duration-300",
                           input.trim() ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 active:scale-95" : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                        )}
                     >
                        <FiSend size={18} />
                     </button>
                  </div>
               </div>
             </>
           ) : (
             <EmptyHero icon={RiChatSmile2Line} title="اختر محادثة" sub="يرجى اختيار عميل من القائمة الجانبية لبدء المراسلة" />
           )}
        </main>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
});

ShopChatModal.displayName = 'ShopChatModal';
export default memo(ShopChatModal);