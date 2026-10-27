import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiSend, FiCheckCircle, FiArrowLeft, FiAlertCircle, FiRefreshCw, FiArchive } from 'react-icons/fi';
import { RiVerifiedBadgeLine } from 'react-icons/ri';
import api from '../../common/api/api';
import { chatApi, parseCount } from '../../common/services/chatApi';
import clsx from 'clsx';
import { LazyMotion, domAnimation, m, AnimatePresence, MotionConfig } from 'framer-motion';
import { useChatSocket } from '../../common/hooks/useChatSocket';
import useAuthStore from '../../common/store/Auth';
import { parseAccessToken } from '../../common/utils/authSession';
import { useLangFont } from './ListingKit';

const MAX_MSG_LEN = 2000;
const OPTIMISTIC_TIMEOUT = 6000;
const POLL_MS = 5000;
const enc = encodeURIComponent;

const ERR = {
  login: 'chat.errors.login',
  loadChats: 'chat.errors.loadChats',
  loadMessages: 'chat.errors.loadMessages',
  send: 'chat.errors.send',
  close: 'chat.errors.close',
};

const cleanText = (v, max = MAX_MSG_LEN) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max) : '');
const initial = (name, fallback = 'S') => (typeof name === 'string' ? name.trim()[0]?.toUpperCase() : null) || fallback;

const timeFmts = new Map();
const getTimeFmt = (lang) => {
  const key = lang || 'en';
  let fmt = timeFmts.get(key);
  if (!fmt) {
    const isEn = key.startsWith('en');
    const opts = { hour: '2-digit', minute: '2-digit' };
    try {
      fmt = new Intl.DateTimeFormat(isEn ? 'en-US' : key, isEn ? { ...opts, hour12: true } : opts);
    } catch {
      fmt = new Intl.DateTimeFormat('en-US', { ...opts, hour12: true });
    }
    timeFmts.set(key, fmt);
  }
  return fmt;
};
const formatTime = (iso, lang) => {
  try {
    return getTimeFmt(lang).format(new Date(iso));
  } catch {
    return '';
  }
};
const makeClientMsgId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const scrollBehavior = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const NC_CSS = `
.nc{--nc-dx:1;--nc-bg:#f9fafb;--nc-card:#ffffff;--nc-ink:#022c22;--nc-muted:#4b5563;--nc-line:#022c22;--nc-shadow:#022c22;--nc-gray:#f3f4f6;--nc-accent:#34d399;--nc-btn:#34d399;--nc-on:#022c22;--nc-dot:rgba(2,44,34,.18);--nc-thumb:#022c22;color:var(--nc-ink)}
.nc[dir=rtl]{--nc-dx:-1}
.dark .nc,.nc.nc-dark{--nc-bg:#141414;--nc-card:#2a2a2a;--nc-ink:#ffffff;--nc-muted:#a3a3a3;--nc-line:#000;--nc-shadow:#000;--nc-gray:#1e1e1e;--nc-accent:#39ff88;--nc-btn:#39ff88;--nc-on:#04261a;--nc-dot:rgba(57,255,136,.14);--nc-thumb:#525252}
.nc-panel{background:var(--nc-bg);border:3px solid var(--nc-line);box-shadow:calc(var(--nc-dx)*8px) 8px 0 var(--nc-shadow)}
.nc-surface{background:var(--nc-card)}
.nc-gray{background:var(--nc-gray)}
.nc-line{border-color:var(--nc-line)}
.nc-muted{color:var(--nc-muted)}
.nc-bar{display:inline-block;width:48px;height:14px;background:var(--nc-accent);border:2px solid var(--nc-line)}
.nc-ul{text-decoration:underline;text-decoration-color:var(--nc-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nc-chip{display:inline-flex;align-items:center;justify-content:center;background:var(--nc-btn);color:var(--nc-on);border:2px solid var(--nc-line);font-weight:800;line-height:1.4}
.nc-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nc-card);color:var(--nc-ink);border:2px solid var(--nc-line);box-shadow:calc(var(--nc-dx)*3px) 3px 0 var(--nc-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.nc-btn:hover:not(:disabled){transform:translate(calc(var(--nc-dx)*1px),1px);box-shadow:calc(var(--nc-dx)*2px) 2px 0 var(--nc-shadow)}
.nc-btn:active:not(:disabled){transform:translate(calc(var(--nc-dx)*3px),3px);box-shadow:0 0 0 var(--nc-shadow)}
.nc-btn:disabled{opacity:.4;cursor:not-allowed}
.nc-btn:focus-visible,.nc-field:focus-within,.nc-row:focus-visible{outline:3px solid var(--nc-accent);outline-offset:3px}
.nc-btn-a{background:var(--nc-btn);color:var(--nc-on)}
.nc-btn-r{background:#dc2626;color:#fff}
.nc-field{background:var(--nc-card);color:var(--nc-ink);border:3px solid var(--nc-line);box-shadow:calc(var(--nc-dx)*3px) 3px 0 var(--nc-shadow)}
.nc-row{background:var(--nc-card);border:3px solid var(--nc-line);box-shadow:calc(var(--nc-dx)*4px) 4px 0 var(--nc-shadow);transition:transform .12s ease,box-shadow .12s ease}
.nc-row:hover{transform:translate(calc(var(--nc-dx)*2px),2px);box-shadow:calc(var(--nc-dx)*2px) 2px 0 var(--nc-shadow)}
.nc-row-on{background:var(--nc-btn);color:var(--nc-on)}
.nc-bubble{border:3px solid var(--nc-line);box-shadow:calc(var(--nc-dx)*4px) 4px 0 var(--nc-shadow)}
.nc-own{background:var(--nc-card);color:var(--nc-ink)}
.nc-shop{background:var(--nc-btn);color:var(--nc-on)}
.nc-fail{background:#fee2e2;color:#991b1b;border-color:#dc2626;box-shadow:calc(var(--nc-dx)*4px) 4px 0 #dc2626}
.dark .nc-fail,.nc-dark .nc-fail{background:#450a0a;color:#fecaca}
.nc-dots{background-color:var(--nc-gray);background-image:radial-gradient(circle,var(--nc-dot) 1px,transparent 1px);background-size:22px 22px}
.nc-scroll{scrollbar-width:thin;scrollbar-color:var(--nc-thumb) transparent}
.nc-scroll::-webkit-scrollbar{width:6px;height:6px}
.nc-scroll::-webkit-scrollbar-thumb{background:var(--nc-thumb)}
@media (prefers-reduced-motion:reduce){.nc-btn,.nc-row{transition:none}}
`;
let ncStylesInjected = false;
const injectNcStylesOnce = () => {
  if (ncStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-chat-styles', 'true');
  tag.textContent = NC_CSS;
  document.head.appendChild(tag);
  ncStylesInjected = true;
};
injectNcStylesOnce();

const EASE = [0.16, 1, 0.3, 1];
const BACKDROP_MOTION = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.2 } } };
const PANEL_MOTION = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: EASE } },
};
const PANEL_WILL_CHANGE = { willChange: 'transform, opacity' };

const SHADOW = 'fill-black/5 dark:fill-white/5';
const BODY = 'fill-gray-100 stroke-gray-300 dark:fill-[#1e1e1e] dark:stroke-neutral-600';
const BODY_NOFILL = 'fill-none stroke-gray-400 dark:stroke-neutral-500';
const BAR = 'fill-gray-300 dark:fill-neutral-600';
const ACCENT_STROKE = 'fill-none stroke-emerald-500 dark:stroke-[#39ff88]';
const ACCENT_FILL = 'fill-emerald-500 dark:fill-[#39ff88]';
const ACCENT_SOFT = 'fill-emerald-500/15 dark:fill-[#39ff88]/15';
const SVG_CLS = 'w-32 h-24 sm:w-36 sm:h-28 mx-auto';

const NoChatsIllustration = memo(() => (
  <svg viewBox="0 0 140 110" className={SVG_CLS} aria-hidden="true">
    <ellipse cx="70" cy="96" rx="42" ry="6" className={SHADOW} />
    <rect x="24" y="28" width="60" height="46" rx="10" strokeWidth="2" className={BODY} />
    <path d="M34 62 L34 76 L48 62 Z" strokeWidth="2" className={BODY} />
    <rect x="34" y="38" width="40" height="4" rx="2" className={BAR} />
    <rect x="34" y="48" width="28" height="4" rx="2" className={BAR} />
    <rect x="70" y="16" width="46" height="36" rx="10" strokeWidth="2.4" className={ACCENT_STROKE} />
    <path d="M84 52 L84 62 L96 52 Z" strokeWidth="2.4" className={ACCENT_STROKE} />
    <circle cx="86" cy="32" r="2.4" className={ACCENT_FILL} />
    <circle cx="94" cy="32" r="2.4" className={ACCENT_FILL} />
    <circle cx="102" cy="32" r="2.4" className={ACCENT_FILL} />
    <circle cx="120" cy="14" r="2.2" className="fill-amber-400" />
  </svg>
));

const FreshStartIllustration = memo(() => (
  <svg viewBox="0 0 140 110" className={SVG_CLS} aria-hidden="true">
    <ellipse cx="70" cy="96" rx="40" ry="6" className={SHADOW} />
    <path
      d="M32 24 H108 C114 24 118 28 118 34 V62 C118 68 114 72 108 72 H58 L38 88 V72 H32 C26 72 22 68 22 62 V34 C22 28 26 24 32 24 Z"
      strokeWidth="2.2"
      className={BODY}
    />
    <path d="M62 46 H98" strokeWidth="3" strokeLinecap="round" className={BODY_NOFILL} />
    <path d="M62 56 H86" strokeWidth="3" strokeLinecap="round" className={BODY_NOFILL} />
    <g transform="translate(38,36)">
      <circle r="14" className={ACCENT_SOFT} />
      <path d="M-6 0 H6 M0 -6 V6" strokeWidth="3" strokeLinecap="round" className="fill-none stroke-emerald-600 dark:stroke-[#39ff88]" />
    </g>
    <path d="M108 16 L112 10 L116 16 L111 16 Z" className="fill-amber-400" />
    <circle cx="20" cy="86" r="2.2" className="fill-amber-400" />
  </svg>
));

const SelectChatIllustration = memo(() => (
  <svg viewBox="0 0 140 110" className={clsx(SVG_CLS, 'rtl:-scale-x-100')} aria-hidden="true">
    <ellipse cx="70" cy="96" rx="40" ry="6" className={SHADOW} />
    <rect x="18" y="22" width="38" height="62" rx="10" strokeWidth="2" className={BODY} />
    <rect x="26" y="32" width="22" height="6" rx="3" className="fill-emerald-500/50 dark:fill-[#39ff88]/50" />
    <rect x="26" y="44" width="22" height="10" rx="4" className="fill-gray-200 dark:fill-neutral-700" />
    <rect x="26" y="58" width="22" height="10" rx="4" className="fill-gray-200 dark:fill-neutral-700" />
    <path d="M62 52 H96" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 7" className={ACCENT_STROKE} />
    <path d="M90 44 L100 52 L90 60" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={ACCENT_STROKE} />
    <rect x="100" y="30" width="30" height="44" rx="9" strokeWidth="2" className={BODY_NOFILL} />
    <circle cx="115" cy="52" r="7" className={ACCENT_SOFT} />
  </svg>
));

const ILLUSTRATIONS = {
  'fresh-start': FreshStartIllustration,
  'select-chat': SelectChatIllustration,
  'no-chats': NoChatsIllustration,
};

const EmptyHero = memo(({ variant, title, sub }) => {
  const Illustration = ILLUSTRATIONS[variant] || NoChatsIllustration;
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-5 p-8 text-center sm:p-12">
      <div className="nc-gray nc-line border-[3px] border-dotted p-4"><Illustration /></div>
      <div className="space-y-3">
        <h3 className="text-xl font-extrabold uppercase tracking-tight rtl:tracking-normal sm:text-2xl"><span className="nc-ul">{title}</span></h3>
        <p className="nc-muted mx-auto max-w-[260px] text-xs font-bold leading-relaxed">{sub}</p>
      </div>
    </div>
  );
});

const SessionItem = memo(({ session, isActive, onSelect, name, lang, readyLabel }) => (
  <div
    onClick={() => onSelect(session)}
    role="button"
    tabIndex={0}
    aria-current={isActive ? 'true' : undefined}
    onKeyDown={(e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
        e.preventDefault();
        onSelect(session);
      }
    }}
    className={clsx('nc-row mb-4 cursor-pointer select-none p-3 text-start', isActive && 'nc-row-on')}
  >
    <div className="flex items-center gap-3">
      <div className={clsx('nc-chip h-11 w-11 shrink-0 text-sm', isActive && '!bg-[color:var(--nc-card)] !text-[color:var(--nc-ink)]')}>
        {initial(name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate text-xs font-extrabold uppercase">{name}</h4>
          {session.unreadCount > 0 && (
            <span className={clsx('nc-chip h-5 min-w-[20px] shrink-0 px-1.5 text-[10px]', isActive && '!bg-[color:var(--nc-card)] !text-[color:var(--nc-ink)]')}>
              {session.unreadCount}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className={clsx('max-w-[130px] truncate text-[11px] font-semibold', isActive ? 'opacity-90' : 'nc-muted')} dir="auto">
            {session.lastMessage?.message ? cleanText(session.lastMessage.message, 80) : readyLabel}
          </p>
          {session.lastMessage?.createdAt && (
            <span className={clsx('shrink-0 text-[10px] font-bold', isActive ? 'opacity-90' : 'nc-muted')}>{formatTime(session.lastMessage.createdAt, lang)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
));

const MessageBubble = memo(({ msg, isOwn, onRetry, lang, retryLabel, fbInitial }) => {
  const failed = !!msg._failed;
  return (
    <m.div
      initial={msg._fresh ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={clsx('mb-5 flex w-full items-end gap-3', isOwn ? 'flex-row-reverse' : 'flex-row')}
    >
      <div aria-hidden="true" className={clsx('nc-chip h-8 w-8 shrink-0 text-[11px]', isOwn && '!bg-[color:var(--nc-ink)] !text-[color:var(--nc-card)]')}>
        {initial(msg.senderName, fbInitial)}
      </div>

      <div className={clsx('flex max-w-[80%] flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div className={clsx('nc-bubble relative px-4 py-3 text-start', failed ? 'nc-fail' : isOwn ? 'nc-own' : 'nc-shop', msg._optimistic && !failed && 'opacity-70')}>
          <div dir="auto" className="whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed">{msg.content}</div>
          <div className={clsx('mt-2 flex items-center gap-1.5 text-[10px] font-bold', isOwn ? 'justify-end' : 'justify-start', !failed && (isOwn ? 'nc-muted' : 'opacity-90'))}>
            {isOwn && !failed && <FiCheckCircle size={11} className={msg.read ? 'text-emerald-500 dark:text-[#39ff88]' : 'opacity-50'} />}
            {failed && <FiAlertCircle size={11} />}
            <span>{formatTime(msg.createdAt, lang)}</span>
          </div>
        </div>
        {failed && (
          <button type="button" onClick={() => onRetry?.(msg)} className="mt-2 flex items-center gap-1 text-[11px] font-extrabold uppercase text-red-600 underline underline-offset-4 dark:text-red-400">
            <FiRefreshCw size={11} /> {retryLabel}
          </button>
        )}
      </div>
    </m.div>
  );
});

const UserChatModal = memo(({ shopId: initialShopId, shopName: initialShopName, open, onClose, onUnreadChange, darkMode }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'en';
  const dir = i18n.dir(lang);
  const font = useLangFont(lang);
  const isAr = lang.startsWith('ar');

  const accessToken = useAuthStore((s) => s.accessToken);
  const storeUserId = useAuthStore((s) => s.userId);
  const storeEmail = useAuthStore((s) => s.email);
  const tokenClaims = useMemo(() => parseAccessToken(accessToken, { checkExpiry: false }), [accessToken]);
  const [profileIdentity, setProfileIdentity] = useState(null);
  const knownId = storeUserId ?? tokenClaims?.id ?? null;
  const resolvedId = knownId ?? profileIdentity?.id ?? null;
  const resolvedEmail = storeEmail || tokenClaims?.email || profileIdentity?.email || null;

  useEffect(() => {
    if (!open || !accessToken || knownId != null) return undefined;
    const ctrl = new AbortController();
    api.get('/api/users/profile', { signal: ctrl.signal })
      .then(({ data }) => {
        if (data?.id != null) setProfileIdentity({ id: String(data.id), email: data.email || null });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [open, accessToken, knownId]);

  const userProfile = useMemo(
    () => ({ email: resolvedEmail || 'user@example.com', id: accessToken && resolvedId != null ? String(resolvedId) : null }),
    [resolvedEmail, resolvedId, accessToken]
  );

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const prevLenRef = useRef(0);
  const inputRef = useRef(null);
  const recentSentRef = useRef(new Set());
  const seenMsgIdsRef = useRef(new Set());
  const pendingSendsRef = useRef(new Map());
  const hasConnectedRef = useRef(false);
  const autoSelectedRef = useRef(null);
  const unreadTimerRef = useRef(null);
  const pollBusyRef = useRef(false);
  const activeSessionRef = useRef(null);
  const sessionsRef = useRef([]);
  const initialShopRef = useRef({ id: null, name: '' });
  const onUnreadChangeRef = useRef(onUnreadChange);
  activeSessionRef.current = activeSession;
  sessionsRef.current = sessions;
  onUnreadChangeRef.current = onUnreadChange;
  initialShopRef.current = { id: initialShopId ? String(initialShopId) : null, name: cleanText(initialShopName || '', 80) };

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!confirmClose) return undefined;
    const timer = setTimeout(() => setConfirmClose(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmClose]);

  useEffect(() => () => {
    pendingSendsRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
    pendingSendsRef.current.clear();
    recentSentRef.current.clear();
    seenMsgIdsRef.current.clear();
    clearTimeout(unreadTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const shopLabel = useCallback(
    (s) => s.shopName || t('chat.shopNumber', { id: String(s.shopId).slice(0, 5), interpolation: { escapeValue: false } }),
    [t]
  );

  const refreshUnread = useCallback(() => {
    if (!userProfile.id) return;
    clearTimeout(unreadTimerRef.current);
    unreadTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await chatApi.unreadCount(userProfile.id);
        const n = parseCount(data);
        setTotalUnread(n);
        onUnreadChangeRef.current?.(n);
      } catch {
      }
    }, 300);
  }, [userProfile.id]);

  const toUiMessage = useCallback(
    (msg, session) => ({
      id: msg.id,
      content: cleanText(msg.message ?? msg.content, MAX_MSG_LEN * 2),
      senderType: msg.sentBy === 'SHOP' ? 'SHOP' : 'USER',
      senderName: msg.sentBy === 'SHOP' ? msg.shopName || session.shopName || '' : msg.userName || userProfile.email,
      createdAt: msg.createdAt || new Date().toISOString(),
      read: !!msg.read,
    }),
    [userProfile.email]
  );

  const fetchSessions = useCallback(async (silent = false) => {
    if (!userProfile.id) return;
    if (!silent) setIsLoadingSessions(true);
    const build = (raw) => {
      const list = raw.map((s) => ({
        id: s.id,
        shopId: String(s.shopId),
        shopName: cleanText(s.shopName || s.shopEmail || '', 80),
        userId: s.userId,
        createdAt: s.createdAt,
        lastMessage: s.lastMessage || null,
        unreadCount: s.unreadCount || 0,
      }));
      const want = initialShopRef.current;
      if (want.id && !list.some((s) => s.shopId === want.id)) {
        list.unshift({ id: null, shopId: want.id, shopName: want.name, userId: userProfile.id, createdAt: new Date().toISOString(), lastMessage: null, unreadCount: 0 });
      }
      return list;
    };
    try {
      const res = await chatApi.mySessions();
      setSessions(build(Array.isArray(res.data) ? res.data : res.data?.content || []));
      refreshUnread();
    } catch (err) {
      if (err?.response?.status === 404) {
        setSessions(build([]));
      } else {
        setSessions((prev) => (prev.length ? prev : build([])));
        if (!silent) setError(ERR.loadChats);
      }
    } finally {
      if (!silent) setIsLoadingSessions(false);
    }
  }, [userProfile.id, refreshUnread]);

  const fetchMessages = useCallback(async (session, silent = false) => {
    if (!session || !userProfile.id) return;
    if (!silent) setIsLoadingMessages(true);
    const stale = () => activeSessionRef.current?.shopId !== session.shopId;
    try {
      const { data } = await chatApi.messages(userProfile.id, session.shopId);
      if (stale()) return;
      const raw = Array.isArray(data) ? data : data?.content || [];
      const msgs = raw.map((x) => toUiMessage(x, session)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      seenMsgIdsRef.current = new Set(msgs.map((x) => x.id));
      setMessages((prev) => {
        const next = [...msgs, ...prev.filter((x) => x._optimistic || x._failed)];
        if (silent && prev.length === next.length && prev.every((x, i) => x.id === next[i].id && x.read === next[i].read)) return prev;
        return next;
      });
      if (!silent) setError(null);
      if (msgs.some((x) => x.senderType === 'SHOP' && !x.read)) {
        chatApi.markRead(userProfile.id, session.shopId).then(refreshUnread).catch(() => {});
        setSessions((prev) => prev.map((s) => (s.shopId === session.shopId ? { ...s, unreadCount: 0 } : s)));
      }
    } catch (err) {
      if (stale()) return;
      if (err?.response?.status === 404 || session.id == null) {
        setMessages((prev) => prev.filter((x) => x._optimistic || x._failed));
        if (!silent) setError(null);
      } else if (!silent) {
        setError(ERR.loadMessages);
      }
    } finally {
      if (!silent && !stale()) setIsLoadingMessages(false);
    }
  }, [userProfile.id, toUiMessage, refreshUnread]);

  const handleConnect = useCallback(() => {
    setError(null);
    if (hasConnectedRef.current) {
      fetchSessions(true);
      if (activeSessionRef.current) fetchMessages(activeSessionRef.current, true);
    }
    hasConnectedRef.current = true;
  }, [fetchSessions, fetchMessages]);

  const { client, status, reason, isConnected, reconnect, authHeader } = useChatSocket({
    enabled: open && !!userProfile.id,
    onConnect: handleConnect,
  });

  useEffect(() => {
    if (!open) {
      hasConnectedRef.current = false;
      autoSelectedRef.current = null;
      recentSentRef.current.clear();
      seenMsgIdsRef.current.clear();
      setActiveSession(null);
      setMessages([]);
      setIsSidebarOpen(true);
      return;
    }
    if (!userProfile.id) {
      setError(ERR.login);
      return;
    }
    fetchSessions();
  }, [open, userProfile.id, fetchSessions]);

  useEffect(() => {
    if (!open || !initialShopId || !userProfile.id) return;
    const wanted = String(initialShopId);
    if (autoSelectedRef.current === wanted) return;
    autoSelectedRef.current = wanted;
    const target =
      sessionsRef.current.find((x) => x.shopId === wanted) || {
        id: null,
        shopId: wanted,
        shopName: cleanText(initialShopName || '', 80),
        userId: userProfile.id,
        createdAt: new Date().toISOString(),
        lastMessage: null,
        unreadCount: 0,
      };
    setSessions((prev) => (prev.some((x) => x.shopId === wanted) ? prev : [target, ...prev]));
    setActiveSession(target);
    setIsSidebarOpen(false);
  }, [open, initialShopId, initialShopName, userProfile.id]);

  useEffect(() => {
    if (!activeSession) return;
    setMessages([]);
    setConfirmClose(false);
    fetchMessages(activeSession);
  }, [activeSession?.shopId, fetchMessages]);

  useEffect(() => {
    if (!open) return undefined;
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      fetchSessions(true);
      if (activeSessionRef.current) fetchMessages(activeSessionRef.current, true);
    };
    document.addEventListener('visibilitychange', resync);
    return () => document.removeEventListener('visibilitychange', resync);
  }, [open, fetchSessions, fetchMessages]);

  const pollingNeeded = open && !!userProfile.id && !isConnected && status !== 'auth-error' && status !== 'account-changed';
  useEffect(() => {
    if (!pollingNeeded) return undefined;
    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible' || pollBusyRef.current) return;
      pollBusyRef.current = true;
      try {
        await Promise.all([
          fetchSessions(true),
          activeSessionRef.current ? fetchMessages(activeSessionRef.current, true) : null,
        ]);
      } finally {
        pollBusyRef.current = false;
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [pollingNeeded, fetchSessions, fetchMessages]);

  const makeHandler = useCallback((fallbackShopId) => (frame) => {
    let body;
    try {
      body = JSON.parse(frame.body);
    } catch {
      return;
    }
    if (body?.type !== 'CHAT' || body?.action !== 'SEND' || body?.status !== 'SUCCESS') return;
    const p = body.payload || {};
    if (p.userId != null && String(p.userId) !== String(userProfile.id)) return;

    const serverId = p.id;
    if (serverId != null && seenMsgIdsRef.current.has(serverId)) return;

    const content = cleanText(p.message ?? p.content, MAX_MSG_LEN * 2);
    const sentBy = p.sentBy || p.senderType || null;
    let senderIsUser;
    if (sentBy) {
      senderIsUser = sentBy === 'USER';
      if (senderIsUser) recentSentRef.current.delete(content);
    } else {
      senderIsUser = recentSentRef.current.has(content);
      if (senderIsUser) recentSentRef.current.delete(content);
    }

    const rawShopId = (senderIsUser ? (p.shopId ?? p.recipientId) : (p.shopId ?? p.senderId)) ?? body.shopId ?? fallbackShopId;
    const shopId = rawShopId == null ? '' : String(rawShopId);
    if (!shopId) {
      fetchSessions(true);
      return;
    }
    if (serverId != null) seenMsgIdsRef.current.add(serverId);

    const session = activeSessionRef.current;
    const isActive = session?.shopId === shopId;
    const createdAt = p.createdAt || new Date().toISOString();

    if (isActive) {
      const newMsg = {
        id: serverId ?? `ws-${makeClientMsgId()}`,
        content,
        senderType: senderIsUser ? 'USER' : 'SHOP',
        senderName: senderIsUser ? userProfile.email : p.shopName || session.shopName || '',
        createdAt,
        read: senderIsUser,
        _fresh: true,
      };
      const pending = p.clientMsgId ? pendingSendsRef.current.get(p.clientMsgId) : null;
      setMessages((prev) => {
        let idx = pending ? prev.findIndex((x) => x.id === pending.optimisticId) : -1;
        if (idx === -1 && senderIsUser) idx = prev.findIndex((x) => (x._optimistic || x._failed) && x.content === content);
        if (idx !== -1) {
          const next = prev.slice();
          next[idx] = { ...newMsg, _fresh: false, _key: prev[idx]._key ?? prev[idx].id };
          return next;
        }
        return prev.some((x) => x.id === newMsg.id) ? prev : [...prev, newMsg];
      });
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingSendsRef.current.delete(p.clientMsgId);
      }
      if (!senderIsUser) chatApi.markRead(userProfile.id, shopId).then(refreshUnread).catch(() => {});
    } else if (!senderIsUser) {
      refreshUnread();
    }

    if (!sessionsRef.current.some((s) => s.shopId === shopId)) {
      fetchSessions(true);
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.shopId === shopId
            ? {
                ...s,
                lastMessage: { message: content, sentBy: senderIsUser ? 'USER' : 'SHOP', createdAt },
                unreadCount: senderIsUser || isActive ? 0 : (s.unreadCount || 0) + 1,
              }
            : s
        )
      );
    }
  }, [userProfile.id, userProfile.email, fetchSessions, refreshUnread]);

  useEffect(() => {
    if (!client || !isConnected || !userProfile.id) return undefined;
    const sub = client.subscribe(`/topic/user/${enc(userProfile.id)}/chats`, makeHandler(null));
    return () => { try { sub.unsubscribe(); } catch { } };
  }, [client, isConnected, userProfile.id, makeHandler]);

  const activeShopId = activeSession?.shopId;
  const activeUserId = activeSession?.userId ?? userProfile.id;
  useEffect(() => {
    if (!client || !isConnected || !activeShopId || !activeUserId) return undefined;
    const sub = client.subscribe(`/topic/chat/${enc(activeUserId)}/${enc(activeShopId)}`, makeHandler(activeShopId));
    return () => { try { sub.unsubscribe(); } catch { } };
  }, [client, isConnected, activeShopId, activeUserId, makeHandler]);

  const dispatchMessage = useCallback((raw) => {
    const text = cleanText(String(raw || '').trim());
    const session = activeSessionRef.current;
    if (!text || !session) return false;

    if (status === 'auth-error' || status === 'account-changed') {
      setError(`chat.sendBlocked.${status}`);
      return false;
    }

    const clientMsgId = makeClientMsgId();
    const optimisticId = `opt-${clientMsgId}`;
    const createdAt = new Date().toISOString();
    const markFailed = () =>
      setMessages((prev) => prev.map((x) => (x.id === optimisticId ? { ...x, _optimistic: false, _failed: true, _fresh: false } : x)));

    setMessages((prev) => [...prev, { id: optimisticId, content: text, senderType: 'USER', senderName: userProfile.email, createdAt, read: false, _optimistic: true, _fresh: true }]);
    setSessions((prev) =>
      prev.map((s) => (s.shopId === session.shopId ? { ...s, lastMessage: { message: text, sentBy: 'USER', createdAt }, unreadCount: 0 } : s))
    );

    if (isConnected && client) {
      recentSentRef.current.add(text);
      const timeoutId = setTimeout(() => {
        pendingSendsRef.current.delete(clientMsgId);
        recentSentRef.current.delete(text);
        markFailed();
      }, OPTIMISTIC_TIMEOUT);
      pendingSendsRef.current.set(clientMsgId, { optimisticId, timeoutId });

      try {
        client.publish({
          destination: `/app/chat/user/${enc(userProfile.id)}/shop/${enc(session.shopId)}`,
          headers: { Authorization: authHeader() },
          body: JSON.stringify({
            payload: text, senderId: userProfile.id, senderType: 'USER', sentBy: 'USER',
            recipientId: session.shopId, clientMsgId,
          }),
        });
      } catch {
        clearTimeout(timeoutId);
        pendingSendsRef.current.delete(clientMsgId);
        recentSentRef.current.delete(text);
        markFailed();
        setError(ERR.send);
      }
      return true;
    }

    chatApi
      .sendMessage(userProfile.id, session.shopId, { message: text, sentBy: 'USER', clientMsgId })
      .then(({ data }) => {
        const saved = data && typeof data === 'object' && data.id != null ? toUiMessage({ sentBy: 'USER', ...data }, session) : null;
        if (saved) seenMsgIdsRef.current.add(saved.id);
        setMessages((prev) =>
          prev.map((x) => (x.id === optimisticId ? (saved ? { ...saved, read: false, _key: optimisticId } : { ...x, _optimistic: false, _fresh: false }) : x))
        );
      })
      .catch(() => {
        markFailed();
        setError(ERR.send);
      });
    return true;
  }, [client, isConnected, status, authHeader, toUiMessage, userProfile.id, userProfile.email]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    if (dispatchMessage(input)) {
      setInput('');
      inputRef.current?.focus();
    }
  }, [input, dispatchMessage]);

  const handleRetry = useCallback((failedMsg) => {
    setMessages((prev) => prev.filter((x) => x.id !== failedMsg.id));
    dispatchMessage(failedMsg.content);
  }, [dispatchMessage]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  }, [sendMessage]);

  const handleInputChange = useCallback((e) => setInput(e.target.value.slice(0, MAX_MSG_LEN)), []);

  const handleSelectSession = useCallback((s) => {
    setActiveSession(s);
    setIsSidebarOpen(false);
  }, []);

  const handleStatusAction = useCallback(() => {
    if (status === 'auth-error' || status === 'account-changed') window.location.reload();
    else reconnect();
  }, [status, reconnect]);

  const handleCloseClick = useCallback(async () => {
    if (!confirmClose) {
      setConfirmClose(true);
      return;
    }
    setConfirmClose(false);
    const session = activeSessionRef.current;
    if (!session) return;
    try {
      if (session.id != null) await chatApi.close(userProfile.id, session.shopId);
      setSessions((prev) => prev.filter((x) => x.shopId !== session.shopId));
      setActiveSession(null);
      setMessages([]);
      setIsSidebarOpen(true);
      refreshUnread();
    } catch {
      setError(ERR.close);
    }
  }, [confirmClose, userProfile.id, refreshUnread]);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

  useEffect(() => {
    const grew = messages.length - prevLenRef.current;
    prevLenRef.current = messages.length;
    messagesEndRef.current?.scrollIntoView({ behavior: grew === 1 ? scrollBehavior() : 'auto', block: 'end' });
  }, [messages]);

  if (!open || !userProfile.id) return null;

  const isConnecting = status === 'connecting' || status === 'idle';
  const isAuthFatal = status === 'auth-error' || status === 'account-changed';
  const activeName = activeSession ? shopLabel(activeSession) : '';
  const readyLabel = t('chat.readyToHelp');
  const retryLabel = t('chat.retry');
  const fbInitial = initial(t('chat.shopFallback'));
  const dotCls = isConnected ? 'bg-[color:var(--nc-accent)]' : isConnecting ? 'bg-amber-400' : 'bg-red-500';

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <div
          className={clsx('nc fixed inset-0 z-[1000] flex items-center justify-center p-0 text-start sm:p-6', darkMode && 'nc-dark', isAr ? font.className : 'font-jakarta')}
          style={isAr ? font.style : undefined}
          dir={dir} role="dialog" aria-modal="true" aria-label={t('chat.dialogLabel')}
        >
          <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

          <m.div
            {...PANEL_MOTION} style={PANEL_WILL_CHANGE}
            className="nc-panel relative flex h-full w-full max-w-6xl transform-gpu overflow-hidden sm:h-[85vh]"
          >
            <aside className={clsx(
              'nc-surface nc-line flex w-full shrink-0 flex-col border-e-[3px] sm:w-96',
              !isSidebarOpen && 'hidden sm:flex'
            )}>
              <div className="nc-line space-y-3 border-b-[3px] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-3 text-xs font-extrabold uppercase tracking-wide rtl:tracking-normal"><span className="nc-bar" aria-hidden="true" />{t('chat.supportHub')}</p>
                  <button type="button" onClick={onClose} aria-label={t('chat.closeMessages')} className="nc-btn h-9 w-9 sm:hidden"><FiX size={16} /></button>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-extrabold uppercase leading-tight tracking-tight rtl:tracking-normal"><span className="nc-ul">{t('chat.title')}</span></h2>
                  {totalUnread > 0 && <span className="nc-chip h-6 min-w-[24px] px-1.5 text-[11px]">{totalUnread}</span>}
                </div>
                <p className="nc-muted text-xs font-bold">{t('chat.subtitle')}</p>
              </div>

              <div className="nc-scroll flex-1 overflow-y-auto overscroll-contain p-4 pe-5 sm:p-5 sm:pe-6">
                {isLoadingSessions && sessions.length === 0 ? (
                  <div className="flex justify-center py-20"><div className="h-9 w-9 animate-spin rounded-full border-4 border-[color:var(--nc-accent)] border-t-transparent motion-reduce:animate-none" role="status" aria-label={t('chat.loadingChats')} /></div>
                ) : sessions.length === 0 ? (
                  <EmptyHero variant="no-chats" title={t('chat.noChatsTitle')} sub={t('chat.noChatsSub')} />
                ) : (
                  sessions.map((s) => (
                    <SessionItem
                      key={s.shopId}
                      session={s}
                      name={shopLabel(s)}
                      lang={lang}
                      readyLabel={readyLabel}
                      isActive={activeSession?.shopId === s.shopId}
                      onSelect={handleSelectSession}
                    />
                  ))
                )}
              </div>

              <div className="nc-line border-t-[3px] p-4 pe-5 sm:p-5 sm:pe-6">
                <div className="nc-field flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={clsx('h-3 w-3 shrink-0 border-2 nc-line', dotCls, (isConnected || isConnecting) && 'animate-pulse motion-reduce:animate-none')} />
                    <div className="min-w-0">
                      <span className="text-[11px] font-extrabold uppercase" role="status">{t(`chat.status.${status}`, { defaultValue: status })}</span>
                      {!isConnected && reason && <p title={reason} className="mt-0.5 max-w-[200px] truncate text-[10px] font-bold text-red-600 dark:text-red-400" dir="auto">{reason}</p>}
                    </div>
                  </div>
                  {isConnected ? (
                    <RiVerifiedBadgeLine className="shrink-0 text-emerald-500 dark:text-[#39ff88]" size={20} />
                  ) : !isConnecting ? (
                    <button type="button" onClick={handleStatusAction} className="nc-btn nc-btn-a h-8 shrink-0 px-2.5 text-[11px] uppercase">
                      <FiRefreshCw size={12} /> {isAuthFatal ? t('chat.reload') : t('chat.reconnect')}
                    </button>
                  ) : null}
                </div>
              </div>
            </aside>

            <main className={clsx('relative flex min-w-0 flex-1 flex-col', isSidebarOpen && 'hidden sm:flex')}>
              <AnimatePresence>
                {error && (
                  <m.div role="alert" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                    className="nc-line absolute inset-x-0 top-0 z-50 border-b-[3px] bg-red-600 p-3 text-center text-xs font-extrabold uppercase text-white">
                    {t(error)}
                  </m.div>
                )}
              </AnimatePresence>

              {activeSession ? (
                <>
                  <div className="nc-surface nc-line sticky top-0 z-40 flex items-center justify-between gap-2 border-b-[3px] px-3 py-4 sm:gap-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                      <button type="button" onClick={openSidebar} aria-label={t('chat.backToChats')} className="nc-btn h-10 w-10 shrink-0 sm:hidden"><FiArrowLeft size={18} className="rtl:rotate-180" /></button>
                      <div className="nc-chip h-10 w-10 shrink-0 text-sm sm:h-12 sm:w-12 sm:text-base">{initial(activeName)}</div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold uppercase sm:text-base"><span className="nc-ul">{activeName}</span></h3>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={clsx('h-2.5 w-2.5 border-2 nc-line', isConnected ? 'bg-[color:var(--nc-accent)]' : 'bg-gray-400')} />
                          <span className="nc-muted text-[10px] font-extrabold uppercase">{isConnected ? t('chat.connected') : t('chat.offline')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pe-1">
                      {activeSession.id != null && (
                        <button
                          type="button"
                          onClick={handleCloseClick}
                          title={t('chat.closeChatTitle')}
                          aria-label={confirmClose ? t('chat.confirmClose') : t('chat.closeChat')}
                          className={clsx('nc-btn h-10 px-3 text-[11px] uppercase', confirmClose && 'nc-btn-r')}
                        >
                          <FiArchive size={14} />
                          <span className={clsx(!confirmClose && 'hidden sm:inline')}>{confirmClose ? t('chat.confirmClose') : t('chat.closeChat')}</span>
                        </button>
                      )}
                      <button type="button" onClick={onClose} aria-label={t('chat.closeMessages')} className="nc-btn h-10 w-10 shrink-0"><FiX size={18} /></button>
                    </div>
                  </div>

                  <div role="log" aria-live="polite" aria-label={t('chat.conversation')} className="nc-dots nc-scroll flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-8">
                    {isLoadingMessages && messages.length === 0 ? (
                      <div className="flex justify-center py-20"><div className="h-9 w-9 animate-spin rounded-full border-4 border-[color:var(--nc-accent)] border-t-transparent motion-reduce:animate-none" role="status" aria-label={t('chat.loadingMessages')} /></div>
                    ) : messages.length === 0 ? (
                      <EmptyHero
                        variant="fresh-start"
                        title={t('chat.freshStartTitle')}
                        sub={t('chat.freshStartSub', { name: activeName, interpolation: { escapeValue: false } })}
                      />
                    ) : (
                      messages.map((x) => (
                        <MessageBubble
                          key={x._key ?? x.id}
                          msg={x}
                          isOwn={x.senderType === 'USER'}
                          onRetry={handleRetry}
                          lang={lang}
                          retryLabel={retryLabel}
                          fbInitial={fbInitial}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="nc-surface nc-line border-t-[3px] p-4 pe-5 sm:p-5 sm:pe-6">
                    <div className="nc-field relative">
                      <textarea
                        ref={inputRef}
                        dir="auto"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder={t('chat.typeMessage')}
                        aria-label={t('chat.typeMessageAria')}
                        maxLength={MAX_MSG_LEN}
                        className="block max-h-40 w-full resize-none bg-transparent py-4 ps-4 pe-16 text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
                        rows={1}
                      />
                      <button
                        type="button"
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        aria-label={t('chat.sendMessage')}
                        className="nc-btn nc-btn-a absolute end-2 top-1/2 h-10 w-10 -translate-y-1/2"
                      >
                        <FiSend size={17} className="rtl:-scale-x-100" />
                      </button>
                    </div>
                    {!isConnected && !isAuthFatal && (
                      <p className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">{t('chat.liveUnavailable')}</p>
                    )}
                    {input.length > MAX_MSG_LEN * 0.9 && (
                      <p className="nc-muted mt-1.5 text-end text-[11px] font-bold" dir="ltr">{input.length} / {MAX_MSG_LEN}</p>
                    )}
                  </div>
                </>
              ) : (
                <EmptyHero variant="select-chat" title={t('chat.selectChatTitle')} sub={t('chat.selectChatSub')} />
              )}
            </main>
          </m.div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
});

UserChatModal.displayName = 'UserChatModal';
export default memo(UserChatModal);