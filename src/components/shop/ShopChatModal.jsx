import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { FiX, FiSend, FiCheckCircle, FiArrowRight, FiAlertCircle, FiRefreshCw, FiArchive } from 'react-icons/fi';
import { RiVerifiedBadgeLine } from 'react-icons/ri';
import { chatApi, parseCount } from '../../common/services/chatApi';
import clsx from 'clsx';
import { useChatSocket, readStored } from '../../common/hooks/useChatSocket';
import { useAppLanguage } from '../../common/utils/useAppLanguage';
import { getFontStyle, ensureShopAssets } from '../../common/utils/shopFonts';
import shopAr from '../../common/ShopLocales/shopAr';
import shopEn from '../../common/ShopLocales/shopEn';

ensureShopAssets();

const MAX_MSG_LEN = 2000;
const OPTIMISTIC_TIMEOUT = 6000;
const POLL_MS = 5000;
const MAX_BACKOFF_STEPS = 4;
const MAX_RENDERED_MSGS = 150;
const MAX_SEEN_IDS = 2000;
const MAX_RECENT_SENT = 50;
const enc = encodeURIComponent;

const PG_CSS = `
.pg{--pg-bg:#f9fafb;--pg-card:#ffffff;--pg-ink:#04261a;--pg-muted:#4b6b5c;--pg-line:#04261a;--pg-shadow:#04261a;--pg-gray:#e8ebe9;--pg-dot:#04261a;--pg-grid:rgba(4,38,26,.14);--pg-accent:#10b981;--pg-btn:#059669;--pg-on:#ffffff;color:var(--pg-ink)}
.dark .pg{--pg-bg:#141414;--pg-card:#2a2a2a;--pg-ink:#ffffff;--pg-muted:#a3a3a3;--pg-line:#000000;--pg-shadow:#000000;--pg-gray:#1e1e1e;--pg-dot:#3f3f3f;--pg-grid:rgba(255,255,255,.1);--pg-accent:#39ff88;--pg-btn:#39ff88;--pg-on:#022c22}
.pg[dir="rtl"] *{letter-spacing:0!important}
.pg-card{background:var(--pg-card);border:2px solid var(--pg-line);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-gray{background:var(--pg-gray)}
.pg-surface{background:var(--pg-card)}
.pg-muted{color:var(--pg-muted)}
.pg-line{border-color:var(--pg-line)}
.pg-bar{display:inline-block;width:40px;height:12px;background:var(--pg-accent);border:2px solid var(--pg-line)}
.pg-ul{text-decoration:underline;text-decoration-color:var(--pg-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.pg-chip{display:inline-flex;align-items:center;gap:4px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);padding:1px 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.6}
.pg-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--pg-line);background:var(--pg-accent);color:#04261a}
.pg-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.pg-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--pg-shadow)}
.pg-btn:disabled{opacity:.45;cursor:not-allowed}
.pg-btn-a{background:var(--pg-btn);color:var(--pg-on)}
.pg-btn-red{background:#ef4444;color:#fff}
.pg-btn:focus-visible,.pg-row:focus-visible{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-field{background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow)}
.pg-field:focus,.pg-field:focus-within{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-field::placeholder{color:var(--pg-muted);opacity:.8}
.pg-row{display:block;width:100%;padding:10px;background:var(--pg-card);color:var(--pg-ink);border:2px dotted var(--pg-dot);cursor:pointer;transition:transform .15s ease,border-color .15s ease}
.pg-row:hover{border-style:solid;border-color:var(--pg-line);transform:translateY(-1px)}
.pg-row-on,.pg-row-on:hover{background:var(--pg-btn);color:var(--pg-on);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow);transform:none}
.pg-row-on .pg-muted{color:inherit;opacity:.85}
.pg-bubble{border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow)}
.pg-bubble-own{background:var(--pg-card);color:var(--pg-ink)}
.pg-bubble-in{background:var(--pg-btn);color:var(--pg-on)}
.pg-bubble-fail{background:#ef4444;color:#fff}
.pg-grid{background-image:radial-gradient(circle,var(--pg-grid) 1px,transparent 1px);background-size:24px 24px}
.pg-scroll{scrollbar-width:thin;scrollbar-color:var(--pg-accent) transparent}
.pg-scroll::-webkit-scrollbar{width:6px;height:6px}
.pg-scroll::-webkit-scrollbar-track{background:transparent}
.pg-scroll::-webkit-scrollbar-thumb{background:var(--pg-accent);border:1px solid var(--pg-line)}
.pg-spin{border:4px solid var(--pg-accent);border-top-color:transparent;border-radius:50%;animation:pgSpin .8s linear infinite}
.pg-pulse{animation:pgPulse 1.6s ease-in-out infinite}
@keyframes pgSpin{to{transform:rotate(360deg)}}
@keyframes pgPulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pgDrop{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
.pg-in{animation:pgIn .15s ease-out both}
.pg-drop{animation:pgDrop .18s ease-out both}
.pg-fade{animation:pgFade .18s ease-out both}
@media (prefers-reduced-motion:reduce){.pg-btn,.pg-row{transition:none}.pg-spin,.pg-pulse,.pg-in,.pg-drop,.pg-fade{animation:none}}
`;
const STYLE_EL = <style>{PG_CSS}</style>;

const tpl = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const cleanText = (v, max = MAX_MSG_LEN) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .slice(0, max)
    : '';

const initial = (name) =>
  (typeof name === 'string' ? name.trim()[0]?.toUpperCase() : null) || 'U';

const FMT_CACHE = {};
const getFmt = (locale) =>
  (FMT_CACHE[locale] ||= {
    num: new Intl.NumberFormat(locale),
    time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: true }),
    date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
  });

const formatTime = (iso, f) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : f.time.format(d);
};

const formatDateLabel = (iso, f, t) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(date, today)) return t.today;
  if (same(date, yesterday)) return t.yesterday;
  return f.date.format(date);
};

const makeClientMsgId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const trimSet = (set, max) => {
  while (set.size > max) set.delete(set.values().next().value);
};

const sameSessions = (a, b) =>
  a.length === b.length &&
  a.every((s, i) => {
    const x = b[i];
    return (
      String(s.userId) === String(x.userId) &&
      s.userName === x.userName &&
      s.unreadCount === x.unreadCount &&
      s.lastMessage?.message === x.lastMessage?.message &&
      s.lastMessage?.createdAt === x.lastMessage?.createdAt
    );
  });

const ChatIllustration = memo(() => (
  <svg viewBox="0 0 160 140" className="w-full h-full" fill="none" aria-hidden="true">
    <rect x="24" y="32" width="100" height="70" style={{ fill: 'var(--pg-gray)', stroke: 'var(--pg-ink)' }} strokeWidth="3" />
    <rect x="38" y="48" width="56" height="8" style={{ fill: 'var(--pg-ink)' }} />
    <rect x="38" y="66" width="38" height="8" style={{ fill: 'var(--pg-ink)', opacity: 0.4 }} />
    <rect x="98" y="22" width="36" height="36" style={{ fill: 'var(--pg-accent)', stroke: 'var(--pg-ink)' }} strokeWidth="3" />
    <path d="M107 40l7 7 11-13" style={{ stroke: 'var(--pg-ink)' }} strokeWidth="4" strokeLinecap="square" />
  </svg>
));

const SelectChatIllustration = memo(() => (
  <svg viewBox="0 0 160 140" className="w-full h-full" fill="none" aria-hidden="true">
    <rect x="26" y="26" width="104" height="32" style={{ fill: 'var(--pg-card)', stroke: 'var(--pg-ink)' }} strokeWidth="3" />
    <rect x="26" y="68" width="104" height="32" style={{ fill: 'var(--pg-accent)', stroke: 'var(--pg-ink)' }} strokeWidth="3" />
    <rect x="38" y="36" width="12" height="12" style={{ fill: 'var(--pg-ink)', opacity: 0.4 }} />
    <rect x="58" y="38" width="56" height="8" style={{ fill: 'var(--pg-ink)', opacity: 0.4 }} />
    <rect x="38" y="78" width="12" height="12" style={{ fill: 'var(--pg-ink)' }} />
    <rect x="58" y="80" width="56" height="8" style={{ fill: 'var(--pg-ink)' }} />
    <path d="M108 112l12 10-12 10" style={{ stroke: 'var(--pg-ink)' }} strokeWidth="4" strokeLinecap="square" />
  </svg>
));

const NewChatIllustration = memo(() => (
  <svg viewBox="0 0 160 140" className="w-full h-full" fill="none" aria-hidden="true">
    <rect x="16" y="30" width="78" height="46" style={{ fill: 'var(--pg-card)', stroke: 'var(--pg-ink)' }} strokeWidth="3" />
    <path d="M30 76v18l16-18" style={{ fill: 'var(--pg-card)', stroke: 'var(--pg-ink)' }} strokeWidth="3" strokeLinejoin="miter" />
    <rect x="66" y="56" width="78" height="46" style={{ fill: 'var(--pg-accent)', stroke: 'var(--pg-ink)' }} strokeWidth="3" />
    <path d="M130 102v18l-16-18" style={{ fill: 'var(--pg-accent)', stroke: 'var(--pg-ink)' }} strokeWidth="3" strokeLinejoin="miter" />
  </svg>
));

const EmptyHero = memo(({ Illustration, title, sub }) => (
  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-5">
    <div className="w-36 h-36 sm:w-40 sm:h-40">
      <Illustration />
    </div>
    <div className="space-y-2">
      <h3 className="text-lg font-extrabold uppercase"><span className="pg-ul">{title}</span></h3>
      <p className="pg-muted text-xs font-semibold leading-relaxed max-w-[260px]">{sub}</p>
    </div>
  </div>
));

const Spinner = memo(({ label }) => (
  <div role="status" aria-label={label} className="flex justify-center py-20">
    <div className="pg-spin w-8 h-8" />
  </div>
));

const SessionItem = memo(({ session, isActive, onSelect, t, f }) => {
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(session);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect(session)}
      onKeyDown={handleKey}
      className={clsx(
        'pg-row mb-2.5 select-none text-start [content-visibility:auto] [contain-intrinsic-size:auto_72px]',
        isActive && 'pg-row-on'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="pg-tile w-11 h-11 text-sm font-extrabold">{initial(session.userName)}</span>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-center gap-2">
            <h4 className="font-extrabold text-xs truncate uppercase">{session.userName}</h4>

            {session.unreadCount > 0 && (
              <span
                aria-label={tpl(t.unreadAria, { n: f.num.format(session.unreadCount) })}
                className="pg-line shrink-0 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-extrabold border-2 flex items-center justify-center px-1 tabular-nums"
              >
                {f.num.format(session.unreadCount)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="pg-muted text-[11px] font-semibold truncate max-w-[130px]">
              {session.lastMessage?.message ? cleanText(session.lastMessage.message, 80) : t.readyToHelp}
            </p>

            {session.lastMessage?.createdAt && (
              <span className="pg-muted text-[9px] font-bold uppercase shrink-0">
                {formatTime(session.lastMessage.createdAt, f)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const MessageBubble = memo(({ msg, isOwn, onRetry, t, f }) => {
  const failed = !!msg._failed;

  return (
    <div
      className={clsx(
        'flex items-end gap-3 w-full mb-4',
        isOwn ? 'flex-row-reverse rtl:flex-row' : 'flex-row rtl:flex-row-reverse',
        msg._optimistic && 'pg-in'
      )}
    >
      <span className={clsx('pg-tile w-8 h-8 text-[11px] font-extrabold', isOwn && '!bg-[var(--pg-ink)] !text-[var(--pg-card)]')}>
        {initial(msg.senderName)}
      </span>

      <div className={clsx('flex flex-col max-w-[80%]', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={clsx(
            'pg-bubble px-4 py-3 text-sm leading-relaxed text-start',
            failed ? 'pg-bubble-fail' : isOwn ? 'pg-bubble-own' : 'pg-bubble-in',
            msg._optimistic && !failed && 'opacity-70'
          )}
        >
          <div dir="auto" className="text-sm font-semibold leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </div>

          <div
            className={clsx(
              'flex items-center gap-1.5 mt-1.5 text-[9px] font-bold uppercase',
              isOwn ? 'justify-start' : 'justify-end',
              isOwn && !failed ? 'pg-muted' : 'opacity-80'
            )}
          >
            <span>{formatTime(msg.createdAt, f)}</span>
            {isOwn && !failed && (
              <FiCheckCircle size={11} className={msg.read ? 'text-[var(--pg-accent)]' : 'opacity-40'} aria-hidden="true" />
            )}
            {failed && <FiAlertCircle size={11} aria-hidden="true" />}
          </div>
        </div>

        {failed && (
          <button
            type="button"
            onClick={() => onRetry?.(msg)}
            className="pg-btn mt-2 h-7 px-2.5 text-[10px] uppercase"
          >
            <FiRefreshCw size={11} aria-hidden="true" /> {t.retryFailed}
          </button>
        )}
      </div>
    </div>
  );
});

const ShopChatModal = memo(
  ({
    open,
    onClose,
    onUnreadChange,
    initialUserId,
    initialUserName,
  }) => {
    const language = useAppLanguage();
    const isAr = language === 'ar';
    const L = isAr ? shopAr : shopEn;
    const t = L.chatModal;
    const f = getFmt(L.locale);
    const fontStyle = useMemo(() => getFontStyle(language), [language]);

    const shopProfile = useMemo(
      () => ({
        email: readStored('userEmail') || 'shop@example.com',
        id: readStored('id'),
      }),
      [open]
    );

    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [msgLimit, setMsgLimit] = useState(MAX_RENDERED_MSGS);
    const [input, setInput] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [totalUnread, setTotalUnread] = useState(0);
    const [confirmClose, setConfirmClose] = useState(false);
    const [error, setError] = useState(null);

    const dialogRef = useRef(null);
    const scrollerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const stickRef = useRef(true);
    const prevLenRef = useRef(0);
    const recentSentRef = useRef(new Set());
    const seenMsgIdsRef = useRef(new Set());
    const pendingSendsRef = useRef(new Map());
    const hasConnectedRef = useRef(false);
    const unreadTimerRef = useRef(null);
    const autoSelectedRef = useRef(null);
    const mountedRef = useRef(true);
    const closingRef = useRef(false);

    const sessionsSeq = useRef(0);
    const sessionsFlight = useRef(false);
    const sessionsQueued = useRef(false);
    const msgsSeq = useRef(0);
    const msgsFlight = useRef(null);
    const msgsQueued = useRef(false);
    const fetchSessionsRef = useRef(null);
    const fetchMessagesRef = useRef(null);

    const activeSessionRef = useRef(null);
    const sessionsRef = useRef([]);
    const onUnreadChangeRef = useRef(onUnreadChange);
    const onCloseRef = useRef(onClose);
    const tRef = useRef(t);

    activeSessionRef.current = activeSession;
    sessionsRef.current = sessions;
    onUnreadChangeRef.current = onUnreadChange;
    onCloseRef.current = onClose;
    tRef.current = t;

    useEffect(() => {
      mountedRef.current = true;
      return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
      if (!error) return undefined;
      const id = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(id);
    }, [error]);

    useEffect(() => {
      if (!confirmClose) return undefined;
      const id = setTimeout(() => setConfirmClose(false), 4000);
      return () => clearTimeout(id);
    }, [confirmClose]);

    useEffect(
      () => () => {
        pendingSendsRef.current.forEach(({ timeoutId }) => clearTimeout(timeoutId));
        pendingSendsRef.current.clear();
        clearTimeout(unreadTimerRef.current);
      },
      []
    );

    useEffect(() => {
      if (!open) return undefined;
      const prevFocus = document.activeElement;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus({ preventScroll: true });

      const onKey = (e) => {
        if (e.key === 'Escape') onCloseRef.current?.();
      };
      document.addEventListener('keydown', onKey);

      return () => {
        document.body.style.overflow = prevOverflow;
        document.removeEventListener('keydown', onKey);
        if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
      };
    }, [open]);

    const refreshUnread = useCallback(() => {
      if (!shopProfile.id) return;

      clearTimeout(unreadTimerRef.current);
      unreadTimerRef.current = setTimeout(async () => {
        try {
          const { data } = await chatApi.unreadCount(shopProfile.id);
          const n = parseCount(data);
          if (!mountedRef.current) return;
          setTotalUnread(n);
          onUnreadChangeRef.current?.(n);
        } catch {}
      }, 300);
    }, [shopProfile.id]);

    const toUiMessage = useCallback(
      (msg, session) => ({
        id: msg.id,
        content: cleanText(msg.message ?? msg.content, MAX_MSG_LEN * 2),
        senderType: msg.sentBy === 'SHOP' ? 'SHOP' : 'USER',
        senderName:
          msg.sentBy === 'SHOP'
            ? msg.shopName || shopProfile.email
            : session?.userName || tRef.current.unknownUser,
        createdAt: msg.createdAt || new Date().toISOString(),
        read: !!msg.read,
      }),
      [shopProfile.email]
    );

    const fetchSessions = useCallback(
      async (silent = false) => {
        if (!shopProfile.id) return true;
        if (silent && sessionsFlight.current) {
          sessionsQueued.current = true;
          return true;
        }

        const seq = ++sessionsSeq.current;
        sessionsFlight.current = true;
        if (!silent) setIsLoadingSessions(true);
        let ok = true;

        try {
          const res = await chatApi.shopSessions();
          const data = Array.isArray(res.data) ? res.data : res.data?.content || [];

          if (!mountedRef.current || seq !== sessionsSeq.current) return true;

          if (
            process.env.NODE_ENV !== 'production' &&
            data[0] &&
            String(data[0].shopId) !== String(shopProfile.id)
          ) {
            console.warn('[ShopChatModal] stored "id" differs from session.shopId:', shopProfile.id, data[0].shopId);
          }

          const next = data.map((s) => ({
            ...s,
            userName: cleanText(
              s.userName || s.userEmail || tpl(tRef.current.userFallback, { id: String(s.userId).slice(0, 5) }),
              80
            ),
            unreadCount: s.unreadCount || 0,
          }));

          setSessions((prev) => (sameSessions(prev, next) ? prev : next));
          refreshUnread();
        } catch (err) {
          if (err?.response?.status !== 404) {
            ok = false;
            if (!silent && mountedRef.current && seq === sessionsSeq.current) setError(tRef.current.errors.loadSessions);
          }
        } finally {
          if (!silent && mountedRef.current) setIsLoadingSessions(false);
          if (seq === sessionsSeq.current) {
            sessionsFlight.current = false;
            if (sessionsQueued.current && mountedRef.current) {
              sessionsQueued.current = false;
              fetchSessionsRef.current?.(true);
            }
          }
        }
        return ok;
      },
      [shopProfile.id, refreshUnread]
    );
    fetchSessionsRef.current = fetchSessions;

    const fetchMessages = useCallback(
      async (session, silent = false) => {
        if (!session || !shopProfile.id) return true;

        const key = String(session.userId);
        if (silent && msgsFlight.current === key) {
          msgsQueued.current = true;
          return true;
        }

        const seq = ++msgsSeq.current;
        msgsFlight.current = key;
        if (!silent) setIsLoadingMessages(true);

        const stale = () =>
          !mountedRef.current ||
          seq !== msgsSeq.current ||
          String(activeSessionRef.current?.userId) !== key;

        let ok = true;

        try {
          const { data } = await chatApi.messages(session.userId, session.shopId);
          if (stale()) return true;

          const raw = Array.isArray(data) ? data : data?.content || [];
          const msgs = raw
            .map((x) => toUiMessage(x, session))
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          seenMsgIdsRef.current = new Set(msgs.map((x) => x.id));

          setMessages((prev) => {
            const next = [...msgs, ...prev.filter((x) => x._optimistic || x._failed)];

            if (
              silent &&
              prev.length === next.length &&
              prev.every((x, i) => x.id === next[i].id && x.read === next[i].read)
            ) {
              return prev;
            }

            return next;
          });

          if (!silent) setError(null);

          if (msgs.some((x) => x.senderType === 'USER' && !x.read)) {
            chatApi
              .markRead(session.userId, session.shopId)
              .then(refreshUnread)
              .catch(() => {});

            setSessions((prev) =>
              prev.some((s) => String(s.userId) === key && s.unreadCount)
                ? prev.map((s) => (String(s.userId) === key ? { ...s, unreadCount: 0 } : s))
                : prev
            );
          }
        } catch (err) {
          if (stale()) return true;

          if (err?.response?.status === 404) {
            setMessages((prev) => prev.filter((x) => x._optimistic || x._failed));
            if (!silent) setError(null);
          } else {
            ok = false;
            if (!silent) setError(tRef.current.errors.loadMessages);
          }
        } finally {
          if (seq === msgsSeq.current) {
            msgsFlight.current = null;
            if (!silent && mountedRef.current) setIsLoadingMessages(false);
            if (msgsQueued.current && mountedRef.current && activeSessionRef.current) {
              msgsQueued.current = false;
              fetchMessagesRef.current?.(activeSessionRef.current, true);
            }
          }
        }
        return ok;
      },
      [shopProfile.id, toUiMessage, refreshUnread]
    );
    fetchMessagesRef.current = fetchMessages;

    const handleConnect = useCallback(() => {
      setError(null);

      if (hasConnectedRef.current) {
        fetchSessions(true);
        if (activeSessionRef.current) {
          fetchMessages(activeSessionRef.current, true);
        }
      }

      hasConnectedRef.current = true;
    }, [fetchSessions, fetchMessages]);

    const { client, status, reason, isConnected, reconnect, authHeader } =
      useChatSocket({
        enabled: open && !!shopProfile.id,
        onConnect: handleConnect,
      });

    useEffect(() => {
      if (!open) {
        hasConnectedRef.current = false;
        autoSelectedRef.current = null;
        setActiveSession(null);
        setMessages([]);
        setIsSidebarOpen(true);
        return;
      }

      if (!shopProfile.id) {
        setError(tRef.current.errors.loginRequired);
        return;
      }

      fetchSessions();
    }, [open, shopProfile.id, fetchSessions]);

    useEffect(() => {
      if (!open || !initialUserId || !shopProfile.id) return;

      const wanted = String(initialUserId);
      if (autoSelectedRef.current === wanted) return;
      autoSelectedRef.current = wanted;

      const target =
        sessionsRef.current.find((s) => String(s.userId) === wanted) || {
          userId: wanted,
          shopId: shopProfile.id,
          userName: cleanText(initialUserName || tRef.current.unknownUser, 80),
          unreadCount: 0,
          lastMessage: null,
        };

      setSessions((prev) => (prev.some((s) => String(s.userId) === wanted) ? prev : [target, ...prev]));

      setActiveSession(target);
      setIsSidebarOpen(false);
    }, [open, initialUserId, initialUserName, shopProfile.id]);

    useEffect(() => {
      if (!open) return undefined;

      const resync = () => {
        if (document.visibilityState !== 'visible') return;
        fetchSessionsRef.current?.(true);
        if (activeSessionRef.current) {
          fetchMessagesRef.current?.(activeSessionRef.current, true);
        }
      };

      document.addEventListener('visibilitychange', resync);
      return () => document.removeEventListener('visibilitychange', resync);
    }, [open]);

    const pollingNeeded =
      open &&
      !!shopProfile.id &&
      !isConnected &&
      status !== 'auth-error' &&
      status !== 'account-changed';

    useEffect(() => {
      if (!pollingNeeded) return undefined;

      let timer;
      let stopped = false;
      let fails = 0;

      const run = async () => {
        if (document.visibilityState === 'visible') {
          const results = await Promise.all([
            fetchSessionsRef.current?.(true),
            activeSessionRef.current
              ? fetchMessagesRef.current?.(activeSessionRef.current, true)
              : true,
          ]);
          fails = results.every((r) => r !== false) ? 0 : Math.min(fails + 1, MAX_BACKOFF_STEPS);
        }
        if (!stopped) timer = setTimeout(run, POLL_MS * 2 ** fails);
      };

      timer = setTimeout(run, POLL_MS);
      return () => {
        stopped = true;
        clearTimeout(timer);
      };
    }, [pollingNeeded]);

    useEffect(() => {
      if (!activeSession) return;

      setMessages([]);
      setMsgLimit(MAX_RENDERED_MSGS);
      setConfirmClose(false);
      stickRef.current = true;
      prevLenRef.current = 0;
      fetchMessages(activeSession);
    }, [activeSession?.userId, fetchMessages]);

    const makeHandler = useCallback(
      (fallbackUserId) => (frame) => {
        let body;

        try {
          body = JSON.parse(frame.body);
        } catch {
          return;
        }

        if (body?.type !== 'CHAT' || body?.action !== 'SEND' || body?.status !== 'SUCCESS') {
          return;
        }

        const p = body.payload || {};
        const serverId = p.id;

        if (serverId != null && seenMsgIdsRef.current.has(serverId)) return;

        const content = cleanText(p.message ?? p.content, MAX_MSG_LEN * 2);
        const sentBy = p.sentBy || p.senderType || null;

        let senderIsShop;
        if (sentBy) {
          senderIsShop = sentBy === 'SHOP';
        } else {
          senderIsShop = recentSentRef.current.has(content);
          if (senderIsShop) recentSentRef.current.delete(content);
        }

        const rawUserId =
          p.userId ??
          (senderIsShop ? p.recipientId : p.senderId) ??
          body.userId ??
          fallbackUserId;

        const otherUserId = rawUserId == null ? '' : String(rawUserId);

        if (!otherUserId) {
          fetchSessions(true);
          return;
        }

        if (serverId != null) {
          seenMsgIdsRef.current.add(serverId);
          trimSet(seenMsgIdsRef.current, MAX_SEEN_IDS);
        }

        const current = activeSessionRef.current;
        const isActive = !!current && String(current.userId) === otherUserId;
        const createdAt = p.createdAt || new Date().toISOString();

        if (isActive) {
          const newMsg = {
            id: serverId ?? `ws-${makeClientMsgId()}`,
            content,
            senderType: senderIsShop ? 'SHOP' : 'USER',
            senderName: senderIsShop ? shopProfile.email : current.userName || tRef.current.unknownUser,
            createdAt,
            read: senderIsShop,
          };

          const pending = p.clientMsgId ? pendingSendsRef.current.get(p.clientMsgId) : null;

          setMessages((prev) => {
            let idx = pending ? prev.findIndex((x) => x.id === pending.optimisticId) : -1;

            if (idx === -1 && senderIsShop) {
              idx = prev.findIndex((x) => (x._optimistic || x._failed) && x.content === content);
            }

            if (idx !== -1) {
              const next = prev.slice();
              next[idx] = newMsg;
              return next;
            }

            return prev.some((x) => x.id === newMsg.id) ? prev : [...prev, newMsg];
          });

          if (pending) {
            clearTimeout(pending.timeoutId);
            pendingSendsRef.current.delete(p.clientMsgId);
          }

          if (!senderIsShop) {
            chatApi
              .markRead(current.userId, current.shopId)
              .then(refreshUnread)
              .catch(() => {});
          }
        } else if (!senderIsShop) {
          refreshUnread();
        }

        if (!sessionsRef.current.some((s) => String(s.userId) === otherUserId)) {
          fetchSessions(true);
        } else {
          setSessions((prev) =>
            prev.map((s) =>
              String(s.userId) === otherUserId
                ? {
                    ...s,
                    lastMessage: { message: content, sentBy: senderIsShop ? 'SHOP' : 'USER', createdAt },
                    unreadCount: senderIsShop || isActive ? 0 : (s.unreadCount || 0) + 1,
                  }
                : s
            )
          );
        }
      },
      [shopProfile.email, fetchSessions, refreshUnread]
    );

    useEffect(() => {
      if (!client || !isConnected || !shopProfile.id) return undefined;

      const sub = client.subscribe(`/topic/shop/${enc(shopProfile.id)}/chats`, makeHandler(null));

      return () => {
        try { sub.unsubscribe(); } catch {}
      };
    }, [client, isConnected, shopProfile.id, makeHandler]);

    const activeUserId = activeSession?.userId;
    const activeShopId = activeSession?.shopId;

    useEffect(() => {
      if (!client || !isConnected || activeUserId == null || activeShopId == null) {
        return undefined;
      }

      const sub = client.subscribe(
        `/topic/chat/${enc(activeUserId)}/${enc(activeShopId)}`,
        makeHandler(String(activeUserId))
      );

      return () => {
        try { sub.unsubscribe(); } catch {}
      };
    }, [client, isConnected, activeUserId, activeShopId, makeHandler]);

    const dispatchMessage = useCallback(
      (raw) => {
        const text = cleanText(String(raw || '').trim());
        const current = activeSessionRef.current;

        if (!text || !current) return false;

        if (status === 'auth-error' || status === 'account-changed') {
          setError(tRef.current.sendBlocked[status]);
          return false;
        }

        const clientMsgId = makeClientMsgId();
        const optimisticId = `opt-${clientMsgId}`;
        const createdAt = new Date().toISOString();

        const markFailed = () =>
          setMessages((prev) =>
            prev.map((x) => (x.id === optimisticId ? { ...x, _optimistic: false, _failed: true } : x))
          );

        setMessages((prev) => [
          ...prev,
          {
            id: optimisticId,
            content: text,
            senderType: 'SHOP',
            senderName: shopProfile.email,
            createdAt,
            read: false,
            _optimistic: true,
          },
        ]);

        setSessions((prev) =>
          prev.map((s) =>
            String(s.userId) === String(current.userId)
              ? { ...s, lastMessage: { message: text, sentBy: 'SHOP', createdAt }, unreadCount: 0 }
              : s
          )
        );

        if (isConnected && client) {
          recentSentRef.current.add(text);
          trimSet(recentSentRef.current, MAX_RECENT_SENT);

          const timeoutId = setTimeout(() => {
            pendingSendsRef.current.delete(clientMsgId);
            markFailed();
          }, OPTIMISTIC_TIMEOUT);

          pendingSendsRef.current.set(clientMsgId, { optimisticId, timeoutId });

          try {
            client.publish({
              destination: `/app/chat/user/${enc(current.userId)}/shop/${enc(current.shopId)}`,
              headers: { Authorization: authHeader() },
              body: JSON.stringify({
                payload: text,
                senderId: shopProfile.id,
                senderType: 'SHOP',
                sentBy: 'SHOP',
                recipientId: current.userId,
                clientMsgId,
              }),
            });
          } catch {
            clearTimeout(timeoutId);
            pendingSendsRef.current.delete(clientMsgId);
            markFailed();
            setError(tRef.current.errors.sendFail);
          }

          return true;
        }

        chatApi
          .sendMessage(current.userId, current.shopId, { message: text, sentBy: 'SHOP', clientMsgId })
          .then(({ data }) => {
            const saved =
              data && typeof data === 'object' && data.id != null
                ? toUiMessage({ sentBy: 'SHOP', ...data }, current)
                : null;

            if (saved) {
              seenMsgIdsRef.current.add(saved.id);
              trimSet(seenMsgIdsRef.current, MAX_SEEN_IDS);
            }

            setMessages((prev) =>
              prev.map((x) =>
                x.id === optimisticId
                  ? saved
                    ? { ...saved, read: false }
                    : { ...x, _optimistic: false }
                  : x
              )
            );
          })
          .catch(() => {
            markFailed();
            setError(tRef.current.errors.sendFail);
          });

        return true;
      },
      [client, isConnected, status, authHeader, toUiMessage, shopProfile.id, shopProfile.email]
    );

    const sendMessage = useCallback(() => {
      if (!input.trim()) return;

      if (dispatchMessage(input)) {
        setInput('');
        stickRef.current = true;
        inputRef.current?.focus();
      }
    }, [input, dispatchMessage]);

    const handleRetry = useCallback(
      (failedMsg) => {
        if (status === 'auth-error' || status === 'account-changed') {
          setError(tRef.current.sendBlocked[status]);
          return;
        }
        setMessages((prev) => prev.filter((x) => x.id !== failedMsg.id));
        dispatchMessage(failedMsg.content);
      },
      [dispatchMessage, status]
    );

    const handleKeyDown = useCallback(
      (e) => {
        if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;

        e.preventDefault();
        e.stopPropagation();
        sendMessage();
      },
      [sendMessage]
    );

    const handleInputChange = useCallback((e) => setInput(e.target.value.slice(0, MAX_MSG_LEN)), []);

    const handleSelectSession = useCallback((s) => {
      setActiveSession(s);
      setIsSidebarOpen(false);
    }, []);

    const handleStatusAction = useCallback(() => {
      if (status === 'auth-error' || status === 'account-changed') {
        window.location.reload();
      } else {
        reconnect();
      }
    }, [status, reconnect]);

    const handleCloseClick = useCallback(async () => {
      if (!confirmClose) {
        setConfirmClose(true);
        return;
      }
      if (closingRef.current) return;

      setConfirmClose(false);

      const session = activeSessionRef.current;
      if (!session) return;

      closingRef.current = true;
      try {
        await chatApi.close(session.userId, session.shopId);
        if (!mountedRef.current) return;

        setSessions((prev) => prev.filter((x) => String(x.userId) !== String(session.userId)));
        setActiveSession(null);
        setMessages([]);
        setIsSidebarOpen(true);
        refreshUnread();
      } catch {
        if (mountedRef.current) setError(tRef.current.errors.closeFail);
      } finally {
        closingRef.current = false;
      }
    }, [confirmClose, refreshUnread]);

    const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

    const handleScroll = useCallback(() => {
      const el = scrollerRef.current;
      if (!el) return;
      stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    }, []);

    useEffect(() => {
      const last = messages[messages.length - 1];
      const ownPending = !!last && last.senderType === 'SHOP' && !!last._optimistic;

      if (stickRef.current || ownPending) {
        const reduce =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const few = prevLenRef.current > 0 && messages.length - prevLenRef.current <= 3;
        messagesEndRef.current?.scrollIntoView({
          behavior: few && !reduce ? 'smooth' : 'auto',
          block: 'end',
        });
      }
      prevLenRef.current = messages.length;
    }, [messages]);

    useEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, [input, activeSession]);

    const hiddenCount = Math.max(0, messages.length - msgLimit);
    const showOlder = useCallback(() => setMsgLimit((n) => n + MAX_RENDERED_MSGS), []);

    const messageGroups = useMemo(() => {
      const visible = hiddenCount > 0 ? messages.slice(hiddenCount) : messages;
      const groups = [];
      let lastKey = null;

      visible.forEach((m) => {
        const key = new Date(m.createdAt).toDateString();

        if (key !== lastKey) {
          groups.push({
            type: 'separator',
            key: `sep-${key}`,
            label: formatDateLabel(m.createdAt, f, t),
          });
          lastKey = key;
        }

        groups.push({ type: 'message', key: m.id, msg: m });
      });

      return groups;
    }, [messages, hiddenCount, f, t]);

    if (!open || !shopProfile.id) return null;

    const isConnecting = status === 'connecting' || status === 'idle';
    const nearLimit = input.length > MAX_MSG_LEN * 0.9;
    const sessionExpired = status === 'auth-error' || status === 'account-changed';
    const canSend = !!input.trim();

    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        lang={language}
        style={fontStyle}
        className="pg fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 text-start"
      >
        {STYLE_EL}

        <div className="pg-fade absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t.dialogLabel}
          tabIndex={-1}
          className="pg-card pg-in relative w-full max-w-6xl h-full sm:h-[85vh] overflow-hidden flex focus:outline-none"
        >
          <aside
            className={clsx(
              'pg-gray pg-line w-full sm:w-96 flex flex-col border-e-2 shrink-0',
              !isSidebarOpen && 'hidden sm:flex'
            )}
          >
            <div className="pg-surface pg-line relative px-6 py-6 border-b-2 space-y-2.5">
              <button
                type="button"
                onClick={onClose}
                aria-label={t.closeWindow}
                className="pg-btn sm:hidden absolute top-4 end-4 h-9 w-9"
              >
                <FiX size={18} aria-hidden="true" />
              </button>

              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase">
                <span className="pg-bar" aria-hidden="true" />
                {t.centerLabel}
              </p>

              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight uppercase">
                  <span className="pg-ul">{t.heading}</span>
                </h2>

                {totalUnread > 0 && (
                  <span
                    aria-label={tpl(t.unreadAria, { n: f.num.format(totalUnread) })}
                    className="pg-line min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-[10px] font-extrabold border-2 flex items-center justify-center tabular-nums"
                  >
                    {f.num.format(totalUnread)}
                  </span>
                )}
              </div>

              <p className="pg-muted text-[11px] font-bold uppercase">{t.realtime}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pg-scroll">
              {isLoadingSessions && sessions.length === 0 ? (
                <Spinner label={t.loadingAria} />
              ) : sessions.length === 0 ? (
                <EmptyHero Illustration={ChatIllustration} title={t.noChats} sub={t.noChatsSub} />
              ) : (
                sessions.map((s) => (
                  <SessionItem
                    key={s.userId}
                    session={s}
                    isActive={String(activeSession?.userId) === String(s.userId)}
                    onSelect={handleSelectSession}
                    t={t}
                    f={f}
                  />
                ))
              )}
            </div>

            <div className="pg-surface pg-line p-4 border-t-2">
              <div className="pg-line flex items-center justify-between gap-2 px-3.5 py-3 border-2 border-dotted">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={clsx(
                      'pg-line w-3 h-3 shrink-0 border-2',
                      isConnected
                        ? 'bg-emerald-500 pg-pulse'
                        : isConnecting
                        ? 'bg-amber-400 pg-pulse'
                        : 'bg-red-500'
                    )}
                  />

                  <div className="min-w-0" role="status">
                    <span className="text-[10px] font-extrabold uppercase">
                      {t.status[status] || t.status.connecting}
                    </span>

                    {!isConnected && reason && (
                      <p
                        title={reason}
                        dir="auto"
                        className="mt-0.5 text-[10px] font-bold text-red-500 truncate max-w-[200px]"
                      >
                        {reason}
                      </p>
                    )}
                  </div>
                </div>

                {isConnected ? (
                  <RiVerifiedBadgeLine className="text-[var(--pg-accent)] shrink-0" size={20} aria-hidden="true" />
                ) : !isConnecting ? (
                  <button
                    type="button"
                    onClick={handleStatusAction}
                    className="pg-btn shrink-0 h-8 px-2.5 text-[10px] uppercase"
                  >
                    <FiRefreshCw size={12} aria-hidden="true" />
                    {sessionExpired ? t.reload : t.reconnect}
                  </button>
                ) : null}
              </div>
            </div>
          </aside>

          <main
            className={clsx(
              'pg-surface flex-1 min-w-0 flex flex-col relative',
              isSidebarOpen && 'hidden sm:flex'
            )}
          >
            {error && (
              <div
                role="alert"
                className="pg-drop pg-line absolute top-0 inset-x-0 z-50 bg-red-500 text-white px-4 py-3 text-center text-xs font-extrabold uppercase border-b-2 flex items-center justify-center gap-2"
              >
                <FiAlertCircle size={14} aria-hidden="true" /> {error}
              </div>
            )}

            {activeSession ? (
              <>
                <div className="pg-surface pg-line px-4 sm:px-6 py-4 border-b-2 flex items-center justify-between gap-3 sticky top-0 z-40">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={openSidebar}
                      aria-label={t.backToList}
                      className="pg-btn sm:hidden h-10 w-10 shrink-0"
                    >
                      <FiArrowRight size={18} className="ltr:rotate-180" aria-hidden="true" />
                    </button>

                    <span className="pg-tile w-11 h-11 text-sm font-extrabold">{initial(activeSession.userName)}</span>

                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold uppercase truncate">{activeSession.userName}</h3>

                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'pg-line w-2.5 h-2.5 border-2',
                            isConnected ? 'bg-emerald-500 pg-pulse' : 'bg-gray-400'
                          )}
                        />
                        <span className="pg-muted text-[10px] font-extrabold uppercase">
                          {isConnected ? t.activeNow : t.offline}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCloseClick}
                      title={t.closeChat}
                      className={clsx('pg-btn h-10 px-3 text-[10px] uppercase', confirmClose && 'pg-btn-red')}
                    >
                      <FiArchive size={14} aria-hidden="true" />
                      <span className="hidden sm:inline">{confirmClose ? t.confirmClose : t.closeChat}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      aria-label={t.closeWindow}
                      className="pg-btn h-10 w-10"
                    >
                      <FiX size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div
                  ref={scrollerRef}
                  onScroll={handleScroll}
                  className="pg-grid flex-1 overflow-y-auto px-4 sm:px-6 py-6 pg-scroll overscroll-contain"
                >
                  {isLoadingMessages && messages.length === 0 ? (
                    <Spinner label={t.loadingAria} />
                  ) : messages.length === 0 ? (
                    <EmptyHero
                      Illustration={NewChatIllustration}
                      title={t.newStart}
                      sub={tpl(t.newStartSub, { name: activeSession.userName })}
                    />
                  ) : (
                    <>
                      {hiddenCount > 0 && (
                        <div className="flex justify-center pb-4">
                          <button type="button" onClick={showOlder} className="pg-btn h-8 px-3 text-[11px] uppercase">
                            {tpl(t.showOlder, { n: f.num.format(hiddenCount) })}
                          </button>
                        </div>
                      )}

                      {messageGroups.map((item) =>
                        item.type === 'separator' ? (
                          <div key={item.key} className="flex items-center justify-center my-5">
                            <span className="pg-chip">{item.label}</span>
                          </div>
                        ) : (
                          <MessageBubble
                            key={item.key}
                            msg={item.msg}
                            isOwn={item.msg.senderType === 'SHOP'}
                            onRetry={handleRetry}
                            t={t}
                            f={f}
                          />
                        )
                      )}
                    </>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="pg-surface pg-line p-4 sm:p-5 border-t-2">
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={t.placeholder}
                      aria-label={t.messageLabel}
                      maxLength={MAX_MSG_LEN}
                      dir="auto"
                      rows={1}
                      className="pg-field min-w-0 flex-1 px-4 py-3 text-sm font-semibold resize-none overflow-y-auto pg-scroll"
                    />

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!canSend}
                      aria-label={t.send}
                      className="pg-btn pg-btn-a h-12 w-12 shrink-0"
                    >
                      <FiSend size={18} className="rtl:-scale-x-100" aria-hidden="true" />
                    </button>
                  </div>

                  {!isConnected && !sessionExpired && (
                    <p className="mt-2 text-[11px] font-bold text-amber-500">{t.fallbackNote}</p>
                  )}

                  {nearLimit && (
                    <p className="pg-muted mt-1.5 text-[10px] font-bold text-end tabular-nums" dir="ltr">
                      {input.length} / {MAX_MSG_LEN}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <EmptyHero Illustration={SelectChatIllustration} title={t.selectChat} sub={t.selectChatSub} />
            )}
          </main>
        </div>
      </div>
    );
  }
);

ShopChatModal.displayName = 'ShopChatModal';

export default memo(ShopChatModal);