import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  FiX, FiSend, FiCheckCircle, FiArrowRight, FiArrowLeft, FiMessageSquare, FiInfo
} from 'react-icons/fi';
import { RiVerifiedBadgeLine, RiChatSmile2Line, RiHistoryLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const WS_URL = import.meta.env?.VITE_WS_URL || 'http://localhost:8080/ws';
const RECONNECT_DELAY = 5000;

const initial = (name) =>
  (typeof name === 'string' ? name.trim()[0]?.toUpperCase() : null) || 'S';

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
};

const sanitize = (str) =>
  typeof str === 'string'
    ? DOMPurify.sanitize(str, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'], ALLOWED_ATTR: [] })
    : '';

const SessionItem = memo(({ session, isActive, onClick }) => (
  <motion.div
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={clsx(
      'group relative p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 border mb-2 select-none overflow-hidden text-left',
      isActive
        ? 'bg-white dark:bg-gray-800 border-lime-500 shadow-xl shadow-lime-500/10'
        : 'bg-gray-50/50 dark:bg-gray-900/30 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
    )}
  >
    {isActive && (
      <div className="absolute top-0 left-0 w-1 h-full bg-lime-500" />
    )}
    <div className="flex items-center gap-4">
      <div className={clsx(
        'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform duration-500 group-hover:-rotate-6 shadow-sm',
        isActive
          ? 'bg-lime-500 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
      )}>
        {initial(session.shopName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-center gap-2">
          <h4 className={clsx('font-black text-xs truncate tracking-tighter uppercase', isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400')}>
            {session.shopName}
          </h4>
          {session.unreadCount > 0 && (
            <span className="shrink-0 min-w-[20px] h-5 bg-lime-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5 animate-bounce">
              {session.unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
            {session.lastMessage?.message ? sanitize(session.lastMessage.message).replace(/<[^>]*>/g, '') : 'Ready to help'}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={clsx(
        'flex items-end gap-3 w-full mb-4 font-inter',
        isOwn ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div className={clsx(
        'w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm transition-transform',
        isOwn
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 translate-y-1'
          : 'bg-lime-500 text-white -translate-y-1',
      )}>
        {initial(msg.senderName)}
      </div>

      <div className={clsx(
        'relative px-5 py-4 rounded-[1.75rem] text-sm leading-relaxed shadow-sm max-w-[80%] group text-left',
        isOwn
          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-br-none'
          : 'bg-lime-500 text-white rounded-bl-none',
        msg._optimistic && 'opacity-60'
      )}>
        <div
          dir="auto"
          className="text-xs font-bold leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
        <div className={clsx(
          'flex items-center gap-1.5 mt-2 text-[9px] font-black uppercase tracking-widest',
          isOwn ? 'justify-end text-gray-400' : 'justify-start text-white/80',
        )}>
          {isOwn && <FiCheckCircle size={10} className={msg.read ? 'text-lime-500' : 'text-gray-300'} />}
          <span>{formatTime(msg.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
});

const EmptyHero = memo(({ icon: Icon, title, sub }) => (
  <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
    <div className="relative">
      <div className="absolute inset-0 bg-lime-500/20 blur-3xl rounded-full" />
      <div className="relative w-24 h-24 rounded-[2rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-lime-500 shadow-2xl">
        <Icon size={40} className="animate-pulse" />
      </div>
    </div>
    <div className="space-y-2">
      <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{title}</h3>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-[240px] leading-relaxed mx-auto">{sub}</p>
    </div>
  </div>
));

const UserChatModal = memo(({ shopId: initialShopId, shopName: initialShopName, open, onClose }) => {
  const userProfile = useMemo(() => ({
    email: localStorage.getItem('email') || 'user@example.com',
    id: localStorage.getItem('userId') || null,
  }), []);

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

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const clientRef = useRef(null);
  const recentSentMessagesRef = useRef(new Set());
  const seenMsgIdsRef = useRef(new Set());

  const showToast = (text, icon) =>
    Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });



  const fetchTotalUnreadCount = useCallback(async () => {
    if (!userProfile.id) return;
    try {
      const { data } = await api.get(`/api/chats/${encodeURIComponent(userProfile.id)}/unread-count`);
      setTotalUnreadCount(Number(data.unreadCount ?? data) || 0);
    } catch { }
  }, [userProfile.id]);


  const fetchSessions = useCallback(async () => {
    if (!userProfile.id) return;
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/api/chats/my/sessions');
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setSessions(data.map(s => ({
        id: s.id,
        shopId: String(s.shopId),
        shopName: sanitize(s.shopName || s.shopEmail || `Shop #${String(s.shopId).slice(0, 5)}`).replace(/<[^>]*>/g, ''),
        userId: s.userId,
        createdAt: s.createdAt,
        lastMessage: s.lastMessage || null,
        unreadCount: s.unreadCount || 0,
      })));
      fetchTotalUnreadCount();
    } catch { setError('Failed to load chats'); }
    finally { setIsLoadingSessions(false); }
  }, [fetchTotalUnreadCount, userProfile.id]);



  const fetchMessages = useCallback(async () => {
    if (!activeSession || !userProfile.id) return;
    setIsLoadingMessages(true);
    seenMsgIdsRef.current = new Set();
    try {
      const { data } = await api.get(`/api/chats/${encodeURIComponent(userProfile.id)}/shop/${encodeURIComponent(activeSession.shopId)}/paginated`);
      const msgs = (data.content || []).map(msg => ({
        id: msg.id,
        content: msg.message || '',
        senderType: msg.sentBy === 'SHOP' ? 'SHOP' : 'USER',
        senderName: msg.sentBy === 'SHOP' ? (msg.shopName || activeSession.shopName || 'Shop') : (msg.userName || userProfile.email),
        createdAt: msg.createdAt,
        read: msg.read || false,
      })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      msgs.forEach(m => seenMsgIdsRef.current.add(m.id));
      setMessages(msgs);
      await api.put(`/api/chats/${encodeURIComponent(userProfile.id)}/shop/${encodeURIComponent(activeSession.shopId)}/mark-read`);
      setSessions(prev => prev.map(s => s.shopId === activeSession.shopId ? { ...s, unreadCount: 0 } : s));
      fetchTotalUnreadCount();
    } catch { setError('Failed to load messages'); }
    finally { setIsLoadingMessages(false); }
  }, [activeSession, userProfile.id, userProfile.email, fetchTotalUnreadCount]);




  useEffect(() => {
    if (!open) { clientRef.current?.deactivate(); setIsConnected(false); return; }
    fetchSessions();

    if (initialShopId) {
      setSessions((prev) => {
        if (prev.some((s) => s.shopId === String(initialShopId))) return prev;
        return [{
          id: null, shopId: String(initialShopId),
          shopName: sanitize(initialShopName || 'Shop').replace(/<[^>]*>/g, ''),
          userId: userProfile.id, createdAt: new Date().toISOString(),
          lastMessage: null, unreadCount: 0,
        }, ...prev];
      });
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${authToken}` },
      reconnectDelay: RECONNECT_DELAY,
      onConnect: () => { setIsConnected(true); setError(null); },
      onDisconnect: () => setIsConnected(false),
      onStompError: () => { setIsConnected(false); setError('Connection lost'); },
    });

    client.activate();
    clientRef.current = client;
    setStompClient(client);
    return () => client.deactivate();
  }, [open, fetchSessions, initialShopId, initialShopName, userProfile.id]);

  useEffect(() => {
    if (initialShopId && sessions.length > 0 && !activeSession) {
      const target = sessions.find((s) => s.shopId === String(initialShopId));
      if (target) { setActiveSession(target); setIsSidebarOpen(false); }
    }
  }, [sessions, initialShopId, activeSession]);

  useEffect(() => {
    if (activeSession) { setMessages([]); fetchMessages(); }
  }, [activeSession?.shopId, fetchMessages]);

  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession || !userProfile.id) return;

    const handleFrame = (frame) => {
      try {
        const body = JSON.parse(frame.body);
        if (body.type !== 'CHAT' || body.action !== 'SEND' || body.status !== 'SUCCESS') return;
        const p = body.payload || {};

        const serverId = p.id;
        if (serverId && seenMsgIdsRef.current.has(serverId)) return;

        const rawContent = p.message || p.content || '';
        const isOwn = recentSentMessagesRef.current.has(rawContent);
        if (isOwn) recentSentMessagesRef.current.delete(rawContent);

        const newMsg = {
          id: serverId || `ws-${Date.now()}`,
          content: rawContent,
          senderType: isOwn ? 'USER' : 'SHOP',
          senderName: isOwn ? userProfile.email : (p.shopName || activeSession.shopName || 'Shop'),
          createdAt: p.createdAt || new Date().toISOString(),
          read: isOwn,
        };

        if (serverId) seenMsgIdsRef.current.add(serverId);

        setMessages(prev => {
          if (newMsg.senderType === 'USER') {
            const optIdx = prev.findIndex(m => m._optimistic && m.content === newMsg.content);
            if (optIdx !== -1) {
              const next = [...prev];
              next[optIdx] = newMsg;
              return next;
            }
          }
          return prev.some(m => m.id === newMsg.id && !m._optimistic) ? prev : [...prev, newMsg];
        });

        const shopIdFromMsg = String(p.senderId || body.shopId || p.shopId || activeSession.shopId || '');
        setSessions(prev => prev.map(s => s.shopId === shopIdFromMsg ? {
          ...s,
          lastMessage: { message: newMsg.content, sentBy: newMsg.senderType, createdAt: newMsg.createdAt },
          unreadCount: (newMsg.senderType === 'SHOP' && activeSession.shopId !== shopIdFromMsg) ? s.unreadCount + 1 : 0
        } : s));
        fetchTotalUnreadCount();
      } catch { }
    };

    const subUser = stompClient.subscribe(`/topic/user/${userProfile.id}/chats`, handleFrame);
    const subConv = stompClient.subscribe(`/topic/chat/${activeSession.userId ?? userProfile.id}/${activeSession.shopId}`, handleFrame);
    return () => { subUser.unsubscribe(); subConv.unsubscribe(); };
  }, [stompClient, isConnected, activeSession, userProfile.id, userProfile.email, fetchTotalUnreadCount]);




  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !activeSession || !isConnected || !stompClient) return;

    const clean = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
    if (!clean) return;

    const optimisticId = `opt-${Date.now()}`;
    const optimistic = { id: optimisticId, content: clean, senderType: 'USER', senderName: userProfile.email, createdAt: new Date().toISOString(), read: false, _optimistic: true };

    recentSentMessagesRef.current.add(clean);
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    inputRef.current?.focus();

    setSessions(prev => prev.map(s => s.shopId === activeSession.shopId ? { ...s, lastMessage: { message: clean, sentBy: 'USER', createdAt: new Date().toISOString() }, unreadCount: 0 } : s));

    try {
      stompClient.publish({
        destination: `/app/chat/user/${encodeURIComponent(userProfile.id)}/shop/${encodeURIComponent(activeSession.shopId)}`,
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ payload: clean, senderId: userProfile.id, senderType: 'USER', sentBy: 'USER', recipientId: activeSession.shopId }),
      });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setInput(clean);
      setError('Failed to send message');
    }
  }, [input, activeSession, stompClient, isConnected, userProfile.id, userProfile.email]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!open || !userProfile.id) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 font-inter text-left" dir="ltr">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-6xl h-full sm:h-[85vh] bg-white dark:bg-gray-900 sm:rounded-[3rem] shadow-2xl overflow-hidden flex border border-gray-100 dark:border-gray-800"
      >


        <aside className={clsx(
          "w-full sm:w-96 flex flex-col border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 transition-all duration-500 shrink-0",
          !isSidebarOpen && "hidden sm:flex"
        )}>
          <div className="p-8 border-b border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1.5 rounded-full bg-lime-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Support Hub</span>
              </div>
              <button onClick={onClose} className="sm:hidden p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500"><FiX size={16} /></button>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-2">Messages</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chat with your merchants</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar-thin">
            {isLoadingSessions ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : sessions.length === 0 ? (
              <EmptyHero icon={RiChatSmile2Line} title="No Chats Found" sub="You haven't contacted any shops yet" />
            ) : (
              sessions.map(s => <SessionItem key={s.id} session={s} isActive={activeSession?.shopId === s.shopId} onClick={() => { setActiveSession(s); setIsSidebarOpen(false); }} />)
            )}
          </div>

          <div className="p-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-50 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={clsx("w-3 h-3 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-red-500")} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isConnected ? "Server Connected" : "Disconnected"}</span>
              </div>
              <RiVerifiedBadgeLine className="text-lime-500" size={20} />
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
                  <button onClick={() => setIsSidebarOpen(true)} className="sm:hidden p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500"><FiArrowLeft size={20} /></button>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-lime-500/20">
                    {initial(activeSession.shopName)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{activeSession.shopName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all hidden sm:block"><FiX size={20} /></button>
                </div>
              </div>



              <div className="flex-1 overflow-y-auto px-8 py-10 space-y-2 custom-scrollbar-thin bg-[radial-gradient(circle_at_center,_#f1f5f9_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_#1e293b_1px,_transparent_1px)] bg-[size:32px_32px]">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <EmptyHero icon={RiHistoryLine} title="Fresh Start" sub={`Start chatting with ${activeSession.shopName} now`} />
                ) : (
                  messages.map(m => <MessageBubble key={m.id} msg={m} isOwn={m.senderType === 'USER'} />)
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
                    placeholder="Type your message here..."
                    className="w-full pl-6 pr-24 py-5 rounded-[2rem] bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-lime-500 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 placeholder:text-center placeholder:mb-6 focus:outline-none transition-all resize-none shadow-sm"
                    rows={1}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !input.trim()}
                    className={clsx(
                      "absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all duration-300",
                      input.trim() ? "bg-lime-500 text-white shadow-xl shadow-lime-500/20 active:scale-95" : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <EmptyHero icon={RiChatSmile2Line} title="Select a chat" sub="Please select a shop from the sidebar to start messaging" />
          )}
        </main>
      </motion.div>

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
});

UserChatModal.displayName = 'UserChatModal';
export default UserChatModal;