import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  FiX, FiSend, FiCheckCircle, FiArrowRight, FiAlertCircle, FiRefreshCw,
} from 'react-icons/fi';
import { RiVerifiedBadgeLine } from 'react-icons/ri';
import api from '../api';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const WS_URL = import.meta.env?.VITE_WS_URL || 'https://api.tech-restore.tech/ws';
const MAX_MSG_LEN = 2000;
const RECONNECT_DELAY = 5000;
const OPTIMISTIC_TIMEOUT = 6000;

if (typeof window !== 'undefined' && window.location.protocol === 'https:' && WS_URL.startsWith('http:')) {
  // A plain http(s) websocket endpoint served from an https page will be
  // blocked as mixed content — surfacing this early beats a silent hang.
  console.warn('[ShopChatModal] WS_URL is not https — the browser will likely block this connection.');
}

const initial = (name) => (typeof name === 'string' ? name.trim()[0]?.toUpperCase() : null) || 'U';

const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
};

const formatDateLabel = (iso) => {
  try {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a, b) => a.toDateString() === b.toDateString();
    if (sameDay(date, today)) return 'اليوم';
    if (sameDay(date, yesterday)) return 'أمس';
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
};

// ALLOWED_URI_REGEXP blocks any URI-bearing attribute even though
// ALLOWED_ATTR is already empty — defense in depth in case the allow-list
// above it is ever loosened later.
const sanitize = (str) =>
  typeof str === 'string'
    ? DOMPurify.sanitize(str, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'], ALLOWED_ATTR: [], ALLOWED_URI_REGEXP: /^$/ })
    : '';

const safeString = (val, max = MAX_MSG_LEN * 2) => (typeof val === 'string' ? val.slice(0, max) : '');

const makeClientMsgId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const SCROLLBAR_STYLES = `
  .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
  .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
  .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
`;

/* ---------- Illustrations ---------- */
/* Lightweight static SVGs (no loops, no filters) for the three empty/idle
   states — swapped in for the previous plain icon-in-a-circle look. */

function ChatIllustration() {
  return (
    <svg viewBox="0 0 160 140" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="chatIllA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="118" rx="54" ry="9" fill="#111827" opacity="0.06" />
      <rect x="26" y="34" width="108" height="70" rx="16" fill="url(#chatIllA)" opacity="0.14" />
      <rect x="40" y="48" width="80" height="42" rx="12" fill="#FFFFFF" />
      <rect x="52" y="60" width="46" height="6" rx="3" fill="#D1FAE5" />
      <rect x="52" y="72" width="30" height="6" rx="3" fill="#D1FAE5" />
      <circle cx="118" cy="40" r="16" fill="url(#chatIllA)" />
      <path d="M111 40l5 5 9-9" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function SelectChatIllustration() {
  return (
    <svg viewBox="0 0 160 140" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="chatIllB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="118" rx="54" ry="9" fill="#111827" opacity="0.06" />
      <rect x="30" y="30" width="100" height="30" rx="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
      <rect x="30" y="66" width="100" height="30" rx="10" fill="url(#chatIllB)" />
      <circle cx="46" cy="45" r="8" fill="#E5E7EB" />
      <rect x="60" y="41" width="50" height="7" rx="3.5" fill="#E5E7EB" />
      <circle cx="46" cy="81" r="8" fill="#FFFFFF" opacity="0.9" />
      <rect x="60" y="77" width="50" height="7" rx="3.5" fill="#FFFFFF" opacity="0.85" />
      <path d="M112 108 L124 120 L112 132" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NewChatIllustration() {
  return (
    <svg viewBox="0 0 160 140" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="chatIllC" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="118" rx="50" ry="9" fill="#111827" opacity="0.06" />
      <path d="M24 40h56a10 10 0 0110 10v18a10 10 0 01-10 10H50l-14 14V78H24a10 10 0 01-10-10V50a10 10 0 0110-10z" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
      <path d="M80 56h56a10 10 0 0110 10v18a10 10 0 01-10 10h-6v14l-14-14H80a10 10 0 01-10-10V66a10 10 0 0110-10z" fill="url(#chatIllC)" />
    </svg>
  );
}

const EmptyHero = memo(({ Illustration, title, sub }) => (
  <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-5">
    <div className="w-36 h-36 sm:w-40 sm:h-40">
      <Illustration />
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-[260px]">{sub}</p>
    </div>
  </div>
));

const SessionItem = memo(({ session, isActive, onClick }) => (
  <motion.div
    whileHover={{ x: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={clsx(
      'group relative p-4 rounded-[1.5rem] cursor-pointer transition-colors duration-200 border mb-2 select-none overflow-hidden text-right',
      isActive
        ? 'bg-white dark:bg-gray-800 border-emerald-500 shadow-lg shadow-emerald-500/10'
        : 'bg-gray-50/50 dark:bg-gray-900/30 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
    )}
  >
    {isActive && <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />}
    <div className="flex items-center gap-4">
      <div
        className={clsx(
          'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm',
          isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        )}
      >
        {initial(session.userName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-center gap-2">
          <h4 className={clsx('font-black text-xs truncate tracking-tighter uppercase', isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400')}>
            {session.userName}
          </h4>
          {session.unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="shrink-0 min-w-[20px] h-5 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5"
            >
              {session.unreadCount}
            </motion.span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
            {session.lastMessage?.message ? sanitize(session.lastMessage.message).replace(/<[^>]*>/g, '') : 'جاهز للمساعدة'}
          </p>
          {session.lastMessage?.createdAt && <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{formatTime(session.lastMessage.createdAt)}</span>}
        </div>
      </div>
    </div>
  </motion.div>
));

const MessageBubble = memo(({ msg, isOwn, onRetry }) => {
  const safeContent = useMemo(() => sanitize(msg.content || ''), [msg.content]);
  const failed = !!msg._failed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={clsx('flex items-end gap-3 w-full mb-3 font-cairo', isOwn ? 'flex-row' : 'flex-row-reverse')}
    >
      <div
        className={clsx(
          'w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm',
          isOwn ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-emerald-500 text-white'
        )}
      >
        {initial(msg.senderName)}
      </div>

      <div className="flex flex-col max-w-[80%]" style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        <div
          className={clsx(
            'relative px-5 py-3.5 rounded-[1.75rem] text-sm leading-relaxed shadow-sm text-right',
            failed
              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-br-none'
              : isOwn
              ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-br-none'
              : 'bg-emerald-500 text-white rounded-bl-none',
            msg._optimistic && !failed && 'opacity-70'
          )}
        >
          <div dir="auto" className="text-sm font-medium leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: safeContent }} />
          <div
            className={clsx(
              'flex items-center gap-1.5 mt-1.5 text-[9px] font-black uppercase tracking-widest',
              isOwn ? 'justify-start' : 'justify-end',
              failed ? 'text-red-400' : isOwn ? 'text-gray-400' : 'text-white/80'
            )}
          >
            <span>{formatTime(msg.createdAt)}</span>
            {isOwn && !failed && <FiCheckCircle size={10} className={msg.read ? 'text-emerald-500' : 'text-gray-300'} />}
            {failed && <FiAlertCircle size={10} />}
          </div>
        </div>

        {/* A failed send stays visible with its own retry action, instead
            of silently vanishing or quietly being marked as delivered. */}
        {failed && (
          <button onClick={() => onRetry?.(msg)} className="mt-1.5 flex items-center gap-1 text-[10px] font-black text-red-500 hover:text-red-600 transition-colors">
            <FiRefreshCw size={10} /> فشل الإرسال، اضغط لإعادة المحاولة
          </button>
        )}
      </div>
    </motion.div>
  );
});

const ShopChatModal = memo(({ open, onClose }) => {
  const shopProfile = useMemo(
    () => ({
      email: localStorage.getItem('userEmail') || 'shop@example.com',
      id: localStorage.getItem('id') || null,
    }),
    []
  );

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
  const pendingSendsRef = useRef(new Map());
  const activeSessionRef = useRef(null);
  const sessionsRef = useRef([]);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(
    () => () => {
      pendingSendsRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
      pendingSendsRef.current.clear();
    },
    []
  );

  const fetchTotalUnreadCount = useCallback(async () => {
    if (!shopProfile.id) return;
    try {
      const { data } = await api.get(`/api/chats/${encodeURIComponent(shopProfile.id)}/unread-count`);
      setTotalUnreadCount(Number(data.unreadCount ?? data) || 0);
    } catch {
      /* non-critical — the badge just stays stale until the next successful poll */
    }
  }, [shopProfile.id]);

  const fetchSessions = useCallback(async () => {
    if (!shopProfile.id) return;
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/api/chats/shop/sessions');
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setSessions(
        data.map((s) => ({
          ...s,
          userName: sanitize(s.userName || s.userEmail || `مستخدم #${String(s.userId).slice(0, 5)}`).replace(/<[^>]*>/g, ''),
          unreadCount: s.unreadCount || 0,
        }))
      );
      fetchTotalUnreadCount();
    } catch (err) {
      if (err?.response?.status !== 404) setError('فشل تحميل المحادثات');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [fetchTotalUnreadCount, shopProfile.id]);

  const fetchMessages = useCallback(async () => {
    const current = activeSessionRef.current;
    if (!current || !shopProfile.id) return;
    setIsLoadingMessages(true);
    seenMsgIdsRef.current = new Set();
    try {
      const { data } = await api.get(`/api/chats/${encodeURIComponent(current.userId)}/shop/${encodeURIComponent(current.shopId)}/paginated`);
      const msgs = (data.content || [])
        .map((msg) => ({
          id: msg.id,
          content: safeString(msg.message),
          senderType: msg.sentBy === 'SHOP' ? 'SHOP' : 'USER',
          senderName: msg.sentBy === 'SHOP' ? msg.shopName || shopProfile.email : current.userName || 'مستخدم',
          createdAt: msg.createdAt,
          read: msg.read || false,
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      msgs.forEach((m) => seenMsgIdsRef.current.add(m.id));
      setMessages(msgs);
      setError(null);

      if (msgs.length > 0) {
        api.put(`/api/chats/${encodeURIComponent(current.userId)}/shop/${encodeURIComponent(current.shopId)}/mark-read`).catch(() => {});
      }
      setSessions((prev) => prev.map((s) => (s.id === current.id ? { ...s, unreadCount: 0 } : s)));
      fetchTotalUnreadCount();
    } catch (err) {
      if (err?.response?.status === 404) {
        setMessages([]);
        setError(null);
      } else {
        setError('فشل تحميل الرسائل');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, [shopProfile.id, shopProfile.email, fetchTotalUnreadCount]);

  // Connect once per time the modal is open.
  useEffect(() => {
    if (!open) {
      clientRef.current?.deactivate();
      setIsConnected(false);
      return undefined;
    }

    const authToken = localStorage.getItem('authToken');
    if (!shopProfile.id || !authToken) {
      setError('يرجى تسجيل الدخول');
      return undefined;
    }

    fetchSessions();

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${authToken}` },
      reconnectDelay: RECONNECT_DELAY,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        setError(null);
        // Reconnecting can mean we missed events — resync from the server.
        fetchSessions();
        if (activeSessionRef.current) fetchMessages();
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: () => {
        setIsConnected(false);
        setError('انقطع الاتصال بالخادم');
      },
      onWebSocketError: () => setIsConnected(false),
    });

    client.activate();
    clientRef.current = client;
    setStompClient(client);
    return () => client.deactivate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shopProfile.id]);

  // "Permissions policy violation: unload is not allowed in this document"
  // comes from inside sockjs-client itself — its transport fallback still
  // registers a legacy `window.addEventListener('unload', ...)` to detect
  // dropped connections, and modern Chrome flags any `unload` listener now
  // that the event is being phased out. We can't remove sockjs-client's own
  // listener from here, but we *can* stop relying on it: closing the socket
  // ourselves on the modern `pagehide` event means the connection is already
  // gone by the time that legacy listener would ever need to fire. If this
  // warning matters for a CSP/report-only audit, the real fix is upgrading
  // sockjs-client (newer releases drop the unload listener) or connecting
  // with a plain native WebSocket where SockJS's HTTP fallbacks aren't needed.
  useEffect(() => {
    if (!open) return undefined;
    const closeOnLeave = () => clientRef.current?.deactivate();
    window.addEventListener('pagehide', closeOnLeave);
    return () => window.removeEventListener('pagehide', closeOnLeave);
  }, [open]);

  // A second tab, a backgrounded tab that got throttled, or a laptop that
  // just woke up can all leave the socket silently stale — resync whenever
  // this tab becomes visible/focused again rather than trusting the socket alone.
  useEffect(() => {
    if (!open) return undefined;
    const resync = () => {
      if (document.visibilityState === 'visible') {
        fetchSessions();
        if (activeSessionRef.current) fetchMessages();
      }
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('focus', resync);
    };
  }, [open, fetchSessions, fetchMessages]);

  useEffect(() => {
    if (activeSession) {
      setMessages([]);
      fetchMessages();
    }
  }, [activeSession?.id, fetchMessages]);

  // Single realtime handler shared by the shop-wide feed and the
  // conversation-specific topic. It figures out which conversation a frame
  // actually belongs to from the payload itself — never from whatever
  // happens to be open — which is what makes it safe to also run against
  // the shop-wide subscription while a *different* chat is on screen.
  const handleFrame = useCallback(
    (frame) => {
      try {
        const body = JSON.parse(frame.body);
        if (body?.type !== 'CHAT' || body?.action !== 'SEND' || body?.status !== 'SUCCESS') return;
        const p = body.payload || {};
        const serverId = p.id;
        if (serverId && seenMsgIdsRef.current.has(serverId)) return;
        if (serverId) seenMsgIdsRef.current.add(serverId);

        const rawContent = safeString(p.message ?? p.content);
        const serverSentBy = p.sentBy || p.senderType || null;
        const senderIsShop = serverSentBy ? serverSentBy === 'SHOP' : recentSentMessagesRef.current.has(rawContent);
        if (!serverSentBy && senderIsShop) recentSentMessagesRef.current.delete(rawContent);

        const otherUserId = senderIsShop ? p.recipientId : p.senderId;
        const current = activeSessionRef.current;
        const isActiveConversation = !!current && String(current.userId) === String(otherUserId);

        if (isActiveConversation) {
          const newMsg = {
            id: serverId || `ws-${Date.now()}`,
            content: rawContent,
            senderType: senderIsShop ? 'SHOP' : 'USER',
            senderName: senderIsShop ? shopProfile.email : current.userName || 'مستخدم',
            createdAt: p.createdAt || new Date().toISOString(),
            read: senderIsShop,
          };
          const pending = p.clientMsgId ? pendingSendsRef.current.get(p.clientMsgId) : null;

          setMessages((prev) => {
            if (pending) return prev.map((m) => (m.id === pending.optimisticId ? { ...newMsg, _optimistic: false } : m));
            if (senderIsShop) {
              const optIdx = prev.findIndex((m) => m._optimistic && m.content === newMsg.content);
              if (optIdx !== -1) {
                const next = [...prev];
                next[optIdx] = { ...newMsg, _optimistic: false };
                return next;
              }
            }
            return prev.some((m) => m.id === newMsg.id && !m._optimistic) ? prev : [...prev, newMsg];
          });

          if (pending) {
            clearTimeout(pending.timeoutId);
            pendingSendsRef.current.delete(p.clientMsgId);
          }
        }

        // Sidebar bookkeeping runs for every conversation, active or not —
        // this is what keeps the list accurate whether the event came from
        // the socket in *this* tab or was originally sent from another one.
        const knownSession = sessionsRef.current.some((s) => String(s.userId) === String(otherUserId));
        if (!knownSession) {
          fetchSessions();
        } else {
          setSessions((prev) =>
            prev.map((s) =>
              String(s.userId) === String(otherUserId)
                ? {
                    ...s,
                    lastMessage: { message: rawContent, sentBy: senderIsShop ? 'SHOP' : 'USER', createdAt: p.createdAt || new Date().toISOString() },
                    unreadCount: !senderIsShop && !isActiveConversation ? (s.unreadCount || 0) + 1 : 0,
                  }
                : s
            )
          );
        }
        if (!senderIsShop) fetchTotalUnreadCount();
      } catch {
        /* malformed frame — ignore rather than crash the socket handler */
      }
    },
    [shopProfile.email, fetchSessions, fetchTotalUnreadCount]
  );

  // Shop-wide feed: subscribed once per connection, independent of which
  // conversation (if any) is open, so the sidebar stays live across every
  // session — and across every other tab talking to the same account.
  useEffect(() => {
    if (!stompClient || !isConnected || !shopProfile.id) return undefined;
    const sub = stompClient.subscribe(`/topic/shop/${encodeURIComponent(shopProfile.id)}/chats`, handleFrame);
    return () => sub.unsubscribe();
  }, [stompClient, isConnected, shopProfile.id, handleFrame]);

  // Conversation-specific topic: kept as a redundant, lower-latency path for
  // whichever chat is currently open. Duplicate deliveries of the same
  // event are harmless — `handleFrame` dedupes by server message id.
  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return undefined;
    const sub = stompClient.subscribe(`/topic/chat/${encodeURIComponent(activeSession.userId)}/${encodeURIComponent(activeSession.shopId)}`, handleFrame);
    return () => sub.unsubscribe();
  }, [stompClient, isConnected, activeSession, handleFrame]);

  const dispatchMessage = useCallback(
    (rawContent) => {
      const trimmed = String(rawContent || '').trim().slice(0, MAX_MSG_LEN);
      const current = activeSessionRef.current;
      if (!trimmed || !current || !stompClient) return;
      const clean = DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      if (!clean) return;
      if (!isConnected) {
        setError('غير متصل بالخادم، حاول مرة أخرى');
        return;
      }

      const clientMsgId = makeClientMsgId();
      const optimisticId = `opt-${clientMsgId}`;
      const optimistic = {
        id: optimisticId,
        content: clean,
        senderType: 'SHOP',
        senderName: shopProfile.email,
        createdAt: new Date().toISOString(),
        read: false,
        _optimistic: true,
      };

      recentSentMessagesRef.current.add(clean);
      setMessages((prev) => [...prev, optimistic]);
      setSessions((prev) =>
        prev.map((s) => (s.userId === current.userId ? { ...s, lastMessage: { message: clean, sentBy: 'SHOP', createdAt: optimistic.createdAt }, unreadCount: 0 } : s))
      );

      const timeoutId = setTimeout(() => {
        pendingSendsRef.current.delete(clientMsgId);
        // No server ack within the window — mark this clearly as failed
        // instead of quietly treating silence as a successful delivery.
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, _optimistic: false, _failed: true } : m)));
      }, OPTIMISTIC_TIMEOUT);
      pendingSendsRef.current.set(clientMsgId, { optimisticId, timeoutId });

      try {
        stompClient.publish({
          destination: `/app/chat/user/${encodeURIComponent(current.userId)}/shop/${encodeURIComponent(current.shopId)}`,
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          body: JSON.stringify({ payload: clean, senderId: shopProfile.id, senderType: 'SHOP', sentBy: 'SHOP', recipientId: current.userId, clientMsgId }),
        });
      } catch {
        clearTimeout(timeoutId);
        pendingSendsRef.current.delete(clientMsgId);
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, _optimistic: false, _failed: true } : m)));
        setError('فشل إرسال الرسالة');
      }
    },
    [stompClient, isConnected, shopProfile.id, shopProfile.email]
  );

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    dispatchMessage(input);
    setInput('');
    inputRef.current?.focus();
  }, [input, dispatchMessage]);

  const handleRetry = useCallback(
    (failedMsg) => {
      setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
      dispatchMessage(failedMsg.content);
    },
    [dispatchMessage]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Group consecutive messages by calendar day so long threads stay easy to
  // scan, instead of one unbroken column of bubbles.
  const messageGroups = useMemo(() => {
    const groups = [];
    let lastDateKey = null;
    messages.forEach((m) => {
      const dateKey = new Date(m.createdAt).toDateString();
      if (dateKey !== lastDateKey) {
        groups.push({ type: 'separator', key: `sep-${dateKey}`, label: formatDateLabel(m.createdAt) });
        lastDateKey = dateKey;
      }
      groups.push({ type: 'message', key: m.id, msg: m });
    });
    return groups;
  }, [messages]);

  if (!open || !shopProfile.id) return null;

  const nearLimit = input.length > MAX_MSG_LEN * 0.9;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 font-cairo text-right" dir="rtl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gray-900/70" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-6xl h-full sm:h-[85vh] bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl overflow-hidden flex border border-gray-100 dark:border-gray-800"
      >
        <aside
          className={clsx(
            'w-full sm:w-96 flex flex-col border-l border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0',
            !isSidebarOpen && 'hidden sm:flex'
          )}
        >
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
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <EmptyHero Illustration={ChatIllustration} title="لا توجد محادثات" sub="لم يقم أي عميل بمراسلتك حتى الآن" />
            ) : (
              sessions.map((s) => (
                <SessionItem
                  key={s.id ?? s.userId}
                  session={s}
                  isActive={activeSession?.id === s.id}
                  onClick={() => {
                    setActiveSession(s);
                    setIsSidebarOpen(false);
                  }}
                />
              ))
            )}
          </div>

          <div className="p-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-50 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={clsx('w-3 h-3 rounded-full', isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isConnected ? 'متصل بالخادم' : 'غير متصل'}</span>
              </div>
              {isConnected ? (
                <RiVerifiedBadgeLine className="text-emerald-500" size={20} />
              ) : (
                <button onClick={() => clientRef.current?.activate()} className="flex items-center gap-1 text-[10px] font-black text-red-500 hover:text-red-600 transition-colors">
                  <FiRefreshCw size={12} /> إعادة الاتصال
                </button>
              )}
            </div>
          </div>
        </aside>

        <main className={clsx('flex-1 flex flex-col bg-white dark:bg-gray-900 relative', isSidebarOpen && 'hidden sm:flex')}>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute top-0 inset-x-0 z-50 bg-red-500 text-white p-4 text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <FiAlertCircle size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {activeSession ? (
            <>
              <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/95 dark:bg-gray-900/95 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="sm:hidden p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500 transition-colors">
                    <FiArrowRight size={20} />
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/20">
                    {initial(activeSession.userName)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{activeSession.userName}</h3>
                    <div className="flex items-center gap-2">
                      <span className={clsx('w-2 h-2 rounded-full', isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300')} />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{isConnected ? 'نشط الآن' : 'غير متصل'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors">
                  <FiX size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-10 space-y-1 custom-scrollbar-thin bg-[radial-gradient(circle_at_center,_#f1f5f9_1px,_transparent_1px)] dark:bg-[radial-gradient(circle_at_center,_#1e293b_1px,_transparent_1px)] bg-[size:32px_32px]">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyHero Illustration={NewChatIllustration} title="بداية جديدة" sub={`ابدأ المحادثة مع ${activeSession.userName} الآن`} />
                ) : (
                  messageGroups.map((item) =>
                    item.type === 'separator' ? (
                      <div key={item.key} className="flex items-center justify-center my-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">{item.label}</span>
                      </div>
                    ) : (
                      <MessageBubble key={item.key} msg={item.msg} isOwn={item.msg.senderType === 'SHOP'} onRetry={handleRetry} />
                    )
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="relative group">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX_MSG_LEN))}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="اكتب رسالتك هنا..."
                    maxLength={MAX_MSG_LEN}
                    className="w-full pl-24 pr-6 py-5 rounded-[2rem] bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-colors resize-none shadow-sm"
                    rows={1}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !input.trim()}
                    className={clsx(
                      'absolute left-4 top-1/2 -translate-y-1/2 p-4 text-center rounded-2xl transition-colors duration-150',
                      input.trim() && isConnected ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <FiSend size={18} />
                  </button>
                </div>
                {nearLimit && (
                  <p className="mt-1.5 text-[10px] font-bold text-gray-400 text-left">
                    {input.length} / {MAX_MSG_LEN}
                  </p>
                )}
              </div>
            </>
          ) : (
            <EmptyHero Illustration={SelectChatIllustration} title="اختر محادثة" sub="يرجى اختيار عميل من القائمة الجانبية لبدء المراسلة" />
          )}
        </main>
      </motion.div>

      <style>{SCROLLBAR_STYLES}</style>
    </div>
  );
});

ShopChatModal.displayName = 'ShopChatModal';
export default memo(ShopChatModal);