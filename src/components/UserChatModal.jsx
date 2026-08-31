import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  FiX, FiSend, FiCheckCircle, FiArrowLeft
} from 'react-icons/fi';
import { RiVerifiedBadgeLine } from 'react-icons/ri';
import api from '../api';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
// NOTE: `Swal` (sweetalert2) was imported but never used in this file — removing it
// alone drops ~25-30kb gzip from this chunk. Re-add only if/when you actually call it.

const WS_URL = import.meta.env?.VITE_WS_URL || 'https://api.tech-restore.tech/ws';
const MAX_MSG_LEN = 2000;
const RECONNECT_DELAY = 5000;
const OPTIMISTIC_TIMEOUT = 6000;

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

const makeClientMsgId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const NoChatsIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 140 110" className="w-32 h-24 sm:w-36 sm:h-28 mx-auto">
    <ellipse cx="70" cy="96" rx="42" ry="6" fill={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
    <rect x="24" y="28" width="60" height="46" rx="10" fill={darkMode ? '#1f2937' : '#f3f4f6'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <path d="M34 62 L34 76 L48 62 Z" fill={darkMode ? '#1f2937' : '#f3f4f6'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <rect x="34" y="38" width="40" height="4" rx="2" fill={darkMode ? '#4b5563' : '#d1d5db'} />
    <rect x="34" y="48" width="28" height="4" rx="2" fill={darkMode ? '#4b5563' : '#d1d5db'} />
    <rect x="70" y="16" width="46" height="36" rx="10" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.4" />
    <path d="M84 52 L84 62 L96 52 Z" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.4" />
    <circle cx="86" cy="32" r="2.4" fill={darkMode ? '#34d399' : '#10b981'} />
    <circle cx="94" cy="32" r="2.4" fill={darkMode ? '#34d399' : '#10b981'} />
    <circle cx="102" cy="32" r="2.4" fill={darkMode ? '#34d399' : '#10b981'} />
    <circle cx="120" cy="14" r="2.2" fill="#fbbf24" />
  </svg>
));

const FreshStartIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 140 110" className="w-32 h-24 sm:w-36 sm:h-28 mx-auto">
    <ellipse cx="70" cy="96" rx="40" ry="6" fill={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
    <path d="M32 24 H108 C114 24 118 28 118 34 V62 C118 68 114 72 108 72 H58 L38 88 V72 H32 C26 72 22 68 22 62 V34 C22 28 26 24 32 24 Z"
      fill={darkMode ? '#1f2937' : '#f3f4f6'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2.2" />
    <path d="M62 46 H98" stroke={darkMode ? '#4b5563' : '#d1d5db'} strokeWidth="3" strokeLinecap="round" />
    <path d="M62 56 H86" stroke={darkMode ? '#4b5563' : '#d1d5db'} strokeWidth="3" strokeLinecap="round" />
    <g transform="translate(38,36)">
      <circle r="14" fill={darkMode ? 'rgba(52,211,153,0.16)' : 'rgba(16,185,129,0.14)'} />
      <path d="M-6 0 H6 M0 -6 V6" stroke={darkMode ? '#34d399' : '#059669'} strokeWidth="3" strokeLinecap="round" />
    </g>
    <path d="M108 16 L112 10 L116 16 L111 16 Z" fill="#fbbf24" />
    <circle cx="20" cy="86" r="2.2" fill="#fbbf24" />
  </svg>
));

const SelectChatIllustration = memo(({ darkMode }) => (
  <svg viewBox="0 0 140 110" className="w-32 h-24 sm:w-36 sm:h-28 mx-auto">
    <ellipse cx="70" cy="96" rx="40" ry="6" fill={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
    <rect x="18" y="22" width="38" height="62" rx="10" fill={darkMode ? '#1f2937' : '#f3f4f6'} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="2" />
    <rect x="26" y="32" width="22" height="6" rx="3" fill={darkMode ? '#34d399' : '#10b981'} fillOpacity="0.5" />
    <rect x="26" y="44" width="22" height="10" rx="4" fill={darkMode ? '#374151' : '#e5e7eb'} />
    <rect x="26" y="58" width="22" height="10" rx="4" fill={darkMode ? '#374151' : '#e5e7eb'} />
    <path d="M62 52 H96" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 7" />
    <path d="M90 44 L100 52 L90 60" fill="none" stroke={darkMode ? '#34d399' : '#10b981'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="100" y="30" width="30" height="44" rx="9" fill="none" stroke={darkMode ? '#4b5563' : '#d1d5db'} strokeWidth="2" />
    <circle cx="115" cy="52" r="7" fill={darkMode ? 'rgba(52,211,153,0.18)' : 'rgba(16,185,129,0.14)'} />
  </svg>
));

const EmptyIllustration = memo(({ variant, darkMode }) => {
  if (variant === 'fresh-start') return <FreshStartIllustration darkMode={darkMode} />;
  if (variant === 'select-chat') return <SelectChatIllustration darkMode={darkMode} />;
  return <NoChatsIllustration darkMode={darkMode} />;
});

// Session rows no longer take an onClick — the parent list container owns a single
// delegated listener (see `handleSessionsClick` below). This keeps click handling
// O(1) listeners regardless of how many sessions are rendered, instead of one new
// closure allocated per row on every render.
const SessionItem = memo(({ session, isActive }) => (
  <m.div
    data-shop-id={session.shopId}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    className={clsx(
      'group relative p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 border mb-2 select-none overflow-hidden text-left',
      isActive
        ? 'bg-white dark:bg-gray-800 border-emerald-400 shadow-xl shadow-emerald-400/10'
        : 'bg-gray-50/50 dark:bg-gray-900/30 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
    )}
  >
    {isActive && (
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 pointer-events-none" />
    )}
    <div className="flex items-center gap-4 pointer-events-none">
      <div className={clsx(
        'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform duration-500 group-hover:-rotate-6 shadow-sm',
        isActive
          ? 'bg-emerald-400 text-white'
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
            <span className="shrink-0 min-w-[20px] h-5 bg-emerald-400 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5 animate-bounce">
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
  </m.div>
));

const MessageBubble = memo(({ msg, isOwn }) => {
  const safeContent = useMemo(() => sanitize(msg.content || ''), [msg.content]);

  return (
    <m.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        'flex items-end gap-3 w-full mb-4 font-inter',
        isOwn ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div className={clsx(
        'w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm transition-transform',
        isOwn
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 translate-y-1'
          : 'bg-emerald-400 text-white -translate-y-1',
      )}>
        {initial(msg.senderName)}
      </div>

      <div className={clsx(
        'relative px-5 py-4 rounded-[1.75rem] text-sm leading-relaxed shadow-sm max-w-[80%] group text-left',
        isOwn
          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-br-none'
          : 'bg-emerald-400 text-white rounded-bl-none',
        msg._optimistic && 'opacity-70'
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
          {isOwn && <FiCheckCircle size={10} className={msg.read ? 'text-emerald-400' : 'text-gray-300'} />}
          <span>{formatTime(msg.createdAt)}</span>
        </div>
      </div>
    </m.div>
  );
});

const EmptyHero = memo(({ variant, title, sub }) => (
  <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
    <div className="relative">
      <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full" />
      <div className="relative">
        <EmptyIllustration variant={variant} />
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
  const [isConnecting, setIsConnecting] = useState(true);
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
  const pendingSendsRef = useRef(new Map());

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => () => {
    pendingSendsRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
    pendingSendsRef.current.clear();
  }, []);

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
    } catch (err) {
      if (err?.response?.status !== 404) setError('Failed to load chats');
    }
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
      setError(null);

      if (msgs.length > 0) {
        api.put(`/api/chats/${encodeURIComponent(userProfile.id)}/shop/${encodeURIComponent(activeSession.shopId)}/mark-read`).catch(() => {});
      }
      setSessions(prev => prev.map(s => s.shopId === activeSession.shopId ? { ...s, unreadCount: 0 } : s));
      fetchTotalUnreadCount();
    } catch (err) {
      if (err?.response?.status === 404) {
        setMessages([]);
        setError(null);
      } else {
        setError('Failed to load messages');
      }
    }
    finally { setIsLoadingMessages(false); }
  }, [activeSession, userProfile.id, userProfile.email, fetchTotalUnreadCount]);

  useEffect(() => {
    if (!open) { clientRef.current?.deactivate(); setIsConnected(false); return; }

    const authToken = localStorage.getItem('authToken');
    if (!userProfile.id || !authToken) {
      setError('Please log in to chat');
      return;
    }

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

    setIsConnecting(true);
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${authToken}` },
      reconnectDelay: RECONNECT_DELAY,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => { setIsConnected(true); setIsConnecting(false); setError(null); },
      onDisconnect: () => setIsConnected(false),
      // Distinguish an auth rejection from a transient network hiccup so a flaky
      // reconnect can never masquerade as "you're logged out". Only a genuine
      // 401/403 from the broker should ever be treated as an auth problem, and
      // even then we surface it locally instead of forcing a redirect from here —
      // that decision belongs to your app's single source of truth for auth state.
      onStompError: (frame) => {
        setIsConnected(false);
        setIsConnecting(false);
        const isAuthError = frame?.headers?.message?.toLowerCase?.().includes('unauthor');
        setError(isAuthError ? 'Session expired — please refresh' : 'Connection lost, retrying…');
      },
      onWebSocketError: () => { setIsConnected(false); setIsConnecting(false); },
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
        const serverSentBy = p.sentBy || p.senderType || null;

        let isOwn;
        if (serverSentBy) {
          isOwn = serverSentBy === 'USER';
        } else {
          isOwn = recentSentMessagesRef.current.has(rawContent);
          if (isOwn) recentSentMessagesRef.current.delete(rawContent);
        }

        const newMsg = {
          id: serverId || `ws-${Date.now()}`,
          content: rawContent,
          senderType: isOwn ? 'USER' : 'SHOP',
          senderName: isOwn ? userProfile.email : (p.shopName || activeSession.shopName || 'Shop'),
          createdAt: p.createdAt || new Date().toISOString(),
          read: isOwn,
        };

        if (serverId) seenMsgIdsRef.current.add(serverId);

        const pending = p.clientMsgId ? pendingSendsRef.current.get(p.clientMsgId) : null;

        setMessages(prev => {
          if (pending) {
            return prev.map(m => m.id === pending.optimisticId ? { ...newMsg, _optimistic: false } : m);
          }
          if (isOwn) {
            const optIdx = prev.findIndex(m => m._optimistic && m.content === newMsg.content);
            if (optIdx !== -1) {
              const next = [...prev];
              next[optIdx] = { ...newMsg, _optimistic: false };
              return next;
            }
          }
          return prev.some(m => m.id === newMsg.id && !m._optimistic) ? prev : [...prev, newMsg];
        });

        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingSendsRef.current.delete(p.clientMsgId);
        }

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

  // FIX: previously this bailed out silently (return with no feedback) whenever
  // isConnected was still false — which is exactly the state you're in for the
  // first second or two after opening the modal, since the STOMP handshake hasn't
  // finished. That's the "press Enter and nothing happens" bug. Now it always
  // tells the user why nothing was sent instead of eating the keystroke.
  const sendMessage = useCallback(() => {
    const trimmed = input.trim().slice(0, MAX_MSG_LEN);
    if (!trimmed || !activeSession) return;

    if (!isConnected || !stompClient) {
      setError(isConnecting ? 'Still connecting… try again in a second' : 'Not connected — check your connection');
      return;
    }

    const clean = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
    if (!clean) return;

    const clientMsgId = makeClientMsgId();
    const optimisticId = `opt-${clientMsgId}`;
    const optimistic = {
      id: optimisticId, content: clean, senderType: 'USER', senderName: userProfile.email,
      createdAt: new Date().toISOString(), read: false, _optimistic: true,
    };

    recentSentMessagesRef.current.add(clean);
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    inputRef.current?.focus();

    setSessions(prev => prev.map(s => s.shopId === activeSession.shopId
      ? { ...s, lastMessage: { message: clean, sentBy: 'USER', createdAt: optimistic.createdAt }, unreadCount: 0 }
      : s));

    const timeoutId = setTimeout(() => {
      pendingSendsRef.current.delete(clientMsgId);
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, _optimistic: false } : m));
    }, OPTIMISTIC_TIMEOUT);
    pendingSendsRef.current.set(clientMsgId, { optimisticId, timeoutId });

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Missing auth token');
      }
      stompClient.publish({
        destination: `/app/chat/user/${encodeURIComponent(userProfile.id)}/shop/${encodeURIComponent(activeSession.shopId)}`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          payload: clean, senderId: userProfile.id, senderType: 'USER', sentBy: 'USER',
          recipientId: activeSession.shopId, clientMsgId,
        }),
      });
    } catch {
      clearTimeout(timeoutId);
      pendingSendsRef.current.delete(clientMsgId);
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setInput(clean);
      setError('Failed to send message');
    }
  }, [input, activeSession, stompClient, isConnected, isConnecting, userProfile.id, userProfile.email]);

  // stopPropagation is defensive: it guarantees Enter can never bubble up and be
  // reinterpreted by an ancestor listener (e.g. a login form still mounted behind
  // this modal) as a submit action.
  const handleInputKeyDown = useCallback((e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  }, [sendMessage]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value.slice(0, MAX_MSG_LEN));
  }, []);

  // Single delegated listener for the whole session list instead of one closure
  // per row — scales to large support inboxes without allocating N handlers.
  const handleSessionsClick = useCallback((e) => {
    const item = e.target.closest('[data-shop-id]');
    if (!item) return;
    const shopId = item.getAttribute('data-shop-id');
    const session = sessions.find(s => s.shopId === shopId);
    if (session) { setActiveSession(session); setIsSidebarOpen(false); }
  }, [sessions]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);

  if (!open || !userProfile.id) return null;

  return (
    <LazyMotion features={domAnimation}>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 font-inter text-left" dir="ltr">
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" onClick={onClose} />

        <m.div
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
                  <div className="w-8 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Support Hub</span>
                </div>
                <button onClick={onClose} className="sm:hidden p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500"><FiX size={16} /></button>
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-2">Messages</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chat with your merchants</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar-thin" onClick={handleSessionsClick}>
              {isLoadingSessions ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
              ) : sessions.length === 0 ? (
                <EmptyHero variant="no-chats" title="No Chats Found" sub="You haven't contacted any shops yet" />
              ) : (
                sessions.map(s => <SessionItem key={s.id ?? s.shopId} session={s} isActive={activeSession?.shopId === s.shopId} />)
              )}
            </div>

            <div className="p-8 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={clsx("w-3 h-3 rounded-full animate-pulse", isConnected ? "bg-emerald-500" : "bg-red-500")} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {isConnected ? "Server Connected" : isConnecting ? "Connecting…" : "Disconnected"}
                  </span>
                </div>
                <RiVerifiedBadgeLine className="text-emerald-400" size={20} />
              </div>
            </div>
          </aside>

          <main className={clsx("flex-1 flex flex-col bg-white dark:bg-gray-900 relative", isSidebarOpen && "hidden sm:flex")}>
            <AnimatePresence>
              {error && (
                <m.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute top-0 inset-x-0 z-50 bg-red-500 text-white p-4 text-center text-xs font-black uppercase tracking-widest">
                  {error}
                </m.div>
              )}
            </AnimatePresence>

            {activeSession ? (
              <>
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(true)} className="sm:hidden p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-400"><FiArrowLeft size={20} /></button>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-400/20">
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
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                  ) : messages.length === 0 ? (
                    <EmptyHero variant="fresh-start" title="Fresh Start" sub={`Start chatting with ${activeSession.shopName} now`} />
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
                      onChange={handleInputChange}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Type your message here..."
                      maxLength={MAX_MSG_LEN}
                      className="w-full pl-6 pr-24 py-5 rounded-[2rem] bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-400 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 placeholder:text-center placeholder:mb-6 focus:outline-none transition-all resize-none shadow-sm"
                      rows={1}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      className={clsx(
                        "absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all duration-300",
                        input.trim() ? "bg-emerald-400 text-white shadow-xl shadow-emerald-400/20 active:scale-95" : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <FiSend size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyHero variant="select-chat" title="Select a chat" sub="Please select a shop from the sidebar to start messaging" />
            )}
          </main>
        </m.div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
          .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
          .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #34d399; }
        `}} />
      </div>
    </LazyMotion>
  );
});

UserChatModal.displayName = 'UserChatModal';
export default memo(UserChatModal);