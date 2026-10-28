import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiX, FiSend, FiArrowRight, FiAlertCircle, FiRefreshCw, FiArchive,
  FiPaperclip, FiCamera, FiMic, FiMapPin, FiUser, FiStar, FiCornerUpLeft,
  FiTrash2, FiMoreVertical, FiDownload, FiFile, FiImage, FiPhone, FiSearch, FiFolder,
  FiClock, FiPlay, FiPause,
} from 'react-icons/fi';
import { IoCheckmarkDone } from 'react-icons/io5';
import { RiVerifiedBadgeLine } from 'react-icons/ri';
import api from '../../common/api/api';
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
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_VOICE_SECONDS = 300;
const MAX_TIME_CACHE = 600;
const UNREAD_EVENT = 'shopChatUnread';
const SWIPE_TRIGGER = 48;
const SWIPE_MAX = 72;
const SWIPE_IGNORE = 'audio,video,button,a,input,textarea,select,[data-noswipe]';
const MOBILE_QUERY = '(max-width: 639px), (pointer: coarse)';
const WAVE_BARS = 36;
const SPEEDS = [1, 1.5, 2];
const enc = encodeURIComponent;

const EG_TZ = 'Africa/Cairo';
const DAY_MS = 86400000;
const NAIVE_IS_UTC = true;
const NAIVE_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const FRAC_RE = /(\.\d{3})\d+/;

const toDate = (v) => {
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  if (Array.isArray(v) && v.length >= 3) {
    return new Date(Date.UTC(v[0], v[1] - 1, v[2], v[3] || 0, v[4] || 0, v[5] || 0, Math.floor((v[6] || 0) / 1e6)));
  }
  if (typeof v !== 'string') return new Date(NaN);
  const s = v.trim().replace(FRAC_RE, '$1');
  if (NAIVE_IS_UTC && NAIVE_RE.test(s)) return new Date(`${s.replace(' ', 'T')}Z`);
  return new Date(s);
};

const toIso = (v) => {
  const d = toDate(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

const DAY_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: EG_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const DAY_CACHE = new Map();
const dayKey = (v) => {
  if (typeof v === 'string') {
    const hit = DAY_CACHE.get(v);
    if (hit !== undefined) return hit;
    const d = toDate(v);
    const key = Number.isNaN(d.getTime()) ? '' : DAY_FMT.format(d);
    if (DAY_CACHE.size > 2000) DAY_CACHE.clear();
    DAY_CACHE.set(v, key);
    return key;
  }
  const d = toDate(v);
  return Number.isNaN(d.getTime()) ? '' : DAY_FMT.format(d);
};

const K = {
  btn: 'pg-btn',
  btnA: 'pg-btn pg-btn-a',
  btnRed: 'pg-btn pg-btn-red',
  field: 'pg-field',
  card: 'pg-card',
  line: 'pg-line',
  gray: 'pg-gray',
  surface: 'pg-surface',
  scroll: 'pg-scroll',
};

const NEW_EN = {
  reply: 'Reply', replyingTo: 'Replying to', sideShop: 'Shop', sideUser: 'Customer', cancel: 'Cancel', you: 'You',
  del: 'Delete', delMe: 'Delete for me', statusSending: 'Sending', statusSent: 'Delivered', statusRead: 'Read',
  play: 'Play', pause: 'Pause', seek: 'Seek',
  deleted: 'This message was deleted', edited: 'edited', attach: 'Attach', file: 'Document',
  gallery: 'Photo / video', camera: 'Camera', location: 'Location', contact: 'Contact', name: 'Name',
  phone: 'Phone', send: 'Send', record: 'Recording voice note', stopSend: 'Send voice note', discard: 'Discard',
  mic: 'Record voice note', locating: 'Getting location…', openMap: 'Open in map', download: 'Download', call: 'Call',
  more: 'Message options', star: 'Add to favourites', unstar: 'Remove from favourites', favOnly: 'Favourites',
  media: 'Media, links and docs', close: 'Close', search: 'Search…', empty: 'Nothing shared yet.',
  loadMore: 'Load more', mediaFail: 'Could not load this file.', showOlder: 'Show older messages',
  tabs: { MEDIA: 'Media', DOCS: 'Docs', AUDIO: 'Audio', LINKS: 'Links', LOCATION: 'Places', CONTACT: 'Contacts' },
  types: {
    IMAGE: 'Photo', VIDEO: 'Video', AUDIO: 'Audio', VOICE: 'Voice message',
    DOCUMENT: 'Document', LOCATION: 'Location', CONTACT: 'Contact',
  },
  errors: {
    fileTooBig: 'File is too large (max 25 MB).', fileBad: 'This file type is not allowed.',
    micDenied: 'Microphone access was denied.', micUnsupported: 'Voice notes are not supported in this browser.',
    locFail: 'Could not get your location.', action: 'Action failed. Please try again.',
    sendFail: 'Message could not be sent.',
  },
};

const NEW_AR = {
  reply: 'رد', replyingTo: 'الرد على', sideShop: 'المتجر', sideUser: 'العميل', cancel: 'إلغاء', you: 'أنت',
  del: 'حذف', delMe: 'حذف عندي', statusSending: 'جارٍ الإرسال', statusSent: 'تم التسليم', statusRead: 'تمت القراءة',
  play: 'تشغيل', pause: 'إيقاف مؤقت', seek: 'تقديم',
  deleted: 'تم حذف هذه الرسالة', edited: 'معدّلة', attach: 'إرفاق', file: 'مستند',
  gallery: 'صورة / فيديو', camera: 'الكاميرا', location: 'الموقع', contact: 'جهة اتصال', name: 'الاسم',
  phone: 'الهاتف', send: 'إرسال', record: 'جارٍ تسجيل رسالة صوتية', stopSend: 'إرسال الرسالة الصوتية', discard: 'تجاهل',
  mic: 'تسجيل رسالة صوتية', locating: 'جارٍ تحديد الموقع…', openMap: 'فتح في الخريطة', download: 'تنزيل', call: 'اتصال',
  more: 'خيارات الرسالة', star: 'إضافة إلى المفضلة', unstar: 'إزالة من المفضلة', favOnly: 'المفضلة',
  media: 'الوسائط والروابط والمستندات', close: 'إغلاق', search: 'بحث…', empty: 'لا يوجد شيء مشارك بعد.',
  loadMore: 'عرض المزيد', mediaFail: 'تعذر تحميل هذا الملف.', showOlder: 'عرض الرسائل الأقدم',
  tabs: { MEDIA: 'وسائط', DOCS: 'مستندات', AUDIO: 'صوت', LINKS: 'روابط', LOCATION: 'أماكن', CONTACT: 'جهات' },
  types: {
    IMAGE: 'صورة', VIDEO: 'فيديو', AUDIO: 'صوت', VOICE: 'رسالة صوتية',
    DOCUMENT: 'مستند', LOCATION: 'موقع', CONTACT: 'جهة اتصال',
  },
  errors: {
    fileTooBig: 'الملف كبير جدًا (الحد الأقصى 25 ميجابايت).', fileBad: 'نوع الملف غير مسموح به.',
    micDenied: 'تم رفض الوصول إلى الميكروفون.', micUnsupported: 'الرسائل الصوتية غير مدعومة في هذا المتصفح.',
    locFail: 'تعذر الحصول على موقعك.', action: 'فشلت العملية. حاول مرة أخرى.',
    sendFail: 'تعذر إرسال الرسالة.',
  },
};

const PG_CSS = `
.pg{--pg-bg:#f9fafb;--pg-card:#ffffff;--pg-ink:#04261a;--pg-muted:#4b6b5c;--pg-line:#04261a;--pg-shadow:#04261a;--pg-gray:#e8ebe9;--pg-dot:#04261a;--pg-grid:rgba(4,38,26,.14);--pg-accent:#10b981;--pg-btn:#059669;--pg-on:#ffffff;color:var(--pg-ink)}
.dark .pg{--pg-bg:#141414;--pg-card:#2a2a2a;--pg-ink:#ffffff;--pg-muted:#a3a3a3;--pg-line:#000000;--pg-shadow:#000000;--pg-gray:#1e1e1e;--pg-dot:#3f3f3f;--pg-grid:rgba(255,255,255,.1);--pg-accent:#39ff88;--pg-btn:#39ff88;--pg-on:#022c22}
.pg[dir="rtl"] *{letter-spacing:0!important}
.pg-bg{background:var(--pg-bg)}
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
.pg-in{animation:pgIn .15s ease-out both}
.pg-drop{animation:pgDrop .18s ease-out both}
@media (prefers-reduced-motion:reduce){.pg-btn,.pg-row{transition:none}.pg-spin,.pg-pulse,.pg-in,.pg-drop{animation:none}}
`;
const STYLE_EL = <style>{PG_CSS}</style>;

const tpl = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const cleanText = (v, max = MAX_MSG_LEN) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
        .slice(0, max)
    : '';

const initial = (name) =>
  (typeof name === 'string' ? name.trim()[0]?.toUpperCase() : null) || 'U';

const FMT_CACHE = {};
const getFmt = (locale) =>
  (FMT_CACHE[locale] ||= {
    locale,
    num: new Intl.NumberFormat(locale),
    time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: EG_TZ }),
    date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: EG_TZ }),
  });

const TIME_CACHE = new Map();
const formatTime = (iso, f) => {
  if (!iso) return '';
  const cacheable = typeof iso === 'string';
  const key = cacheable ? `${f.locale}|${iso}` : '';
  if (cacheable) {
    const hit = TIME_CACHE.get(key);
    if (hit !== undefined) return hit;
  }
  const d = toDate(iso);
  const out = Number.isNaN(d.getTime()) ? '' : f.time.format(d);
  if (cacheable) {
    if (TIME_CACHE.size >= MAX_TIME_CACHE) TIME_CACHE.delete(TIME_CACHE.keys().next().value);
    TIME_CACHE.set(key, out);
  }
  return out;
};

const formatDateLabel = (iso, f, t) => {
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return '';
  const key = dayKey(iso);
  const now = Date.now();
  if (key === dayKey(now)) return t.today;
  if (key === dayKey(now - DAY_MS)) return t.yesterday;
  return f.date.format(d);
};

const makeClientMsgId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const trimSet = (set, max) => {
  while (set.size > max) set.delete(set.values().next().value);
};

const byCreatedAt = (a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0);

const sameSessions = (a, b) =>
  a.length === b.length &&
  a.every((s, i) => {
    const x = b[i];
    return (
      String(s.userId) === String(x.userId) &&
      s.userName === x.userName &&
      s.unreadCount === x.unreadCount &&
      !!s.favourite === !!x.favourite &&
      s.lastMessage?.id === x.lastMessage?.id &&
      s.lastMessage?.message === x.lastMessage?.message &&
      s.lastMessage?.sentBy === x.lastMessage?.sentBy &&
      s.lastMessage?.deleted === x.lastMessage?.deleted &&
      s.lastMessage?.createdAt === x.lastMessage?.createdAt
    );
  });

const publishUnread = (n) => {
  try {
    window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: n }));
  } catch {}
};

const API = '/api/chats';
const pair = (u, s) => `${API}/${enc(u)}/shop/${enc(s)}`;
const rest = {
  send: (u, s, body) => api.post(`${pair(u, s)}/messages`, body),
  upload: (u, s, fd, onProgress) => api.post(`${pair(u, s)}/attachments`, fd, { timeout: 120000, onUploadProgress: onProgress }),
  remove: (u, s, id, scope) => api.delete(`${pair(u, s)}/messages/${enc(id)}`, { params: { scope } }),
  favourite: (u, s, value) => api.put(`${pair(u, s)}/favourite`, null, { params: { value } }),
  summary: (u, s, signal) => api.get(`${pair(u, s)}/media/summary`, { signal }),
  media: (u, s, params, signal) => api.get(`${pair(u, s)}/media`, { params, signal }),
  blob: (id, download, signal) =>
    api.get(`${API}/attachments/${enc(id)}`, { params: download ? { download: true } : undefined, responseType: 'blob', signal }),
};

const BLOCKED_EXT = /\.(exe|bat|cmd|com|scr|msi|msp|dll|jar|apk|js|jse|vbs|vbe|ps1|sh|hta|html?|xhtml|svg|lnk|php|py|pl|reg)$/i;
const BLOCKED_MIME = /^(text\/html|application\/xhtml|image\/svg|application\/(x-msdownload|x-sh|x-bat|javascript|x-javascript|java-archive|vnd\.android\.package-archive))/i;
const MEDIA_TYPES = new Set(['IMAGE', 'VIDEO', 'AUDIO', 'VOICE']);
const FILE_TYPES = new Set(['IMAGE', 'VIDEO', 'AUDIO', 'VOICE', 'DOCUMENT']);
const KNOWN_TYPES = new Set(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'VOICE', 'DOCUMENT', 'LOCATION', 'CONTACT']);
const BLOB_PREFIX = { IMAGE: 'image/', VIDEO: 'video/', AUDIO: 'audio/', VOICE: 'audio/' };
const URL_RE = /(https?:\/\/[^\s<>"']+)/gi;
const COUNT_KEY = { MEDIA: 'media', DOCS: 'documents', AUDIO: 'audio', LINKS: 'links', LOCATION: 'locations', CONTACT: 'contacts' };
const TAB_KEYS = Object.keys(COUNT_KEY);

const kindOf = (f) =>
  f.type.startsWith('image/') ? 'IMAGE' : f.type.startsWith('video/') ? 'VIDEO' : f.type.startsWith('audio/') ? 'AUDIO' : 'DOCUMENT';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const safeHttp = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:' ? x.href : null;
  } catch {
    return null;
  }
};

const mapsHref = (loc) => {
  const la = num(loc?.latitude);
  const lo = num(loc?.longitude);
  return la != null && lo != null && Math.abs(la) <= 90 && Math.abs(lo) <= 180
    ? `https://www.google.com/maps?q=${la},${lo}`
    : null;
};

const cleanPhone = (v) => (typeof v === 'string' ? v.replace(/[^\d+\-()\s]/g, '').slice(0, 24) : '');
const fmtBytes = (n) => (!n ? '' : n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const attInfo = (a) => ({
  name: cleanText(a?.fileName ?? a?.name ?? '', 120) || 'file',
  mime: a?.contentType ?? a?.mimeType ?? a?.mime ?? '',
  size: Number(a?.size ?? a?.sizeBytes ?? a?.fileSize) || 0,
  duration: Number(a?.durationSeconds ?? a?.duration) || 0,
});

const extraFields = (msg) => ({
  type: KNOWN_TYPES.has(msg.messageType) ? msg.messageType : 'TEXT',
  deleted: !!msg.deleted,
  edited: !!msg.edited,
  attachment: msg.attachment ? attInfo(msg.attachment) : null,
  location: msg.location
    ? {
        latitude: num(msg.location.latitude),
        longitude: num(msg.location.longitude),
        address: cleanText(msg.location.address || '', 160),
        label: cleanText(msg.location.label || '', 80),
      }
    : null,
  contact: msg.contact ? { name: cleanText(msg.contact.name || '', 80), phone: cleanPhone(msg.contact.phone) } : null,
  replyTo: msg.replyTo
    ? {
        id: msg.replyTo.id,
        sentBy: msg.replyTo.sentBy,
        type: msg.replyTo.messageType,
        snippet: msg.replyTo.deleted ? null : cleanText(msg.replyTo.snippet || '', 80),
      }
    : null,
  links: Array.isArray(msg.links) ? msg.links.map(safeHttp).filter(Boolean).slice(0, 20) : [],
});

const snippetOf = (m) =>
  m.deleted ? null : cleanText(m.content || m.attachment?.name || m.location?.label || m.location?.address || m.contact?.name || '', 80);

const previewOf = (m) => ({ id: m.id, sentBy: m.senderType, type: m.type, snippet: snippetOf(m) });

const previewText = (lm, N, fallback) => {
  if (!lm) return fallback;
  const base = lm.deleted ? N.deleted : cleanText(lm.message || '', 80) || N.types[lm.messageType] || fallback;
  return lm.sentBy === 'SHOP' ? `${N.you}: ${base}` : base;
};

const DELETED_PATCH = { deleted: true, content: '', attachment: null, location: null, contact: null, links: [] };

const safeFileName = (name) =>
  String(name || 'file').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').replace(/^\.+/, '').slice(0, 120) || 'file';

const saveBlob = async (id, name) => {
  const { data } = await rest.blob(id, true);
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFileName(name);
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

let sharedIO = null;
const ioCallbacks = new Map();
const watchVisible = (el, cb) => {
  if (typeof IntersectionObserver === 'undefined') {
    cb();
    return () => {};
  }
  if (!sharedIO) {
    sharedIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const fn = ioCallbacks.get(e.target);
          ioCallbacks.delete(e.target);
          sharedIO.unobserve(e.target);
          fn?.();
        });
      },
      { rootMargin: '200px' }
    );
  }
  ioCallbacks.set(el, cb);
  sharedIO.observe(el);
  return () => {
    ioCallbacks.delete(el);
    sharedIO?.unobserve(el);
  };
};

const useInView = (ref, enabled) => {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!enabled || seen) return undefined;
    const el = ref.current;
    if (!el) {
      setSeen(true);
      return undefined;
    }
    return watchVisible(el, () => setSeen(true));
  }, [ref, enabled, seen]);
  return seen;
};

const useBlobUrl = (id, enabled, kind) => {
  const [state, setState] = useState({ url: null, error: false });
  useEffect(() => {
    if (!enabled || id == null) return undefined;
    const ctrl = new AbortController();
    let objectUrl = null;
    setState({ url: null, error: false });
    rest
      .blob(id, false, ctrl.signal)
      .then(({ data }) => {
        if (ctrl.signal.aborted) return;
        const prefix = BLOB_PREFIX[kind];
        const type = String(data?.type || '').toLowerCase();
        const webmAudio = (kind === 'AUDIO' || kind === 'VOICE') && type === 'video/webm';
        if (!prefix || !type || (!type.startsWith(prefix) && !webmAudio) || type.includes('svg')) {
          setState({ url: null, error: true });
          return;
        }
        objectUrl = URL.createObjectURL(data);
        setState({ url: objectUrl, error: false });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ url: null, error: true });
      });
    return () => {
      ctrl.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, enabled, kind]);
  return state;
};

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(MOBILE_QUERY);
    if (!mq) return undefined;
    const onChange = (e) => setMobile(e.matches);
    setMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return mobile;
};

const useSwipeReply = (enabled, onTrigger) => {
  const rowRef = useRef(null);
  const iconRef = useRef(null);
  const st = useRef({ x: 0, y: 0, active: false, axis: null, fired: false });
  const cbRef = useRef(onTrigger);
  cbRef.current = onTrigger;

  const reset = useCallback((animate) => {
    const row = rowRef.current;
    const icon = iconRef.current;
    if (row) {
      row.style.transition = animate ? 'transform .18s ease' : 'none';
      row.style.transform = '';
    }
    if (icon) {
      icon.style.opacity = '0';
      icon.style.transform = 'scale(.6)';
    }
  }, []);

  const onTouchStart = useCallback((e) => {
    if (!enabled || e.touches.length !== 1 || e.target.closest?.(SWIPE_IGNORE)) {
      st.current.active = false;
      return;
    }
    const t = e.touches[0];
    st.current = { x: t.clientX, y: t.clientY, active: true, axis: null, fired: false };
    if (rowRef.current) rowRef.current.style.transition = 'none';
  }, [enabled]);

  const onTouchMove = useCallback((e) => {
    const s = st.current;
    if (!s.active) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (s.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (s.axis === 'y') {
      s.active = false;
      return;
    }
    const c = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx));
    const row = rowRef.current;
    const icon = iconRef.current;
    if (row) row.style.transform = `translate3d(${c}px,0,0)`;
    if (icon) {
      const p = Math.min(1, Math.abs(c) / SWIPE_TRIGGER);
      icon.style.left = c > 0 ? '8px' : 'auto';
      icon.style.right = c < 0 ? '8px' : 'auto';
      icon.style.opacity = String(p);
      icon.style.transform = `scale(${0.6 + 0.4 * p})`;
    }
    if (!s.fired && Math.abs(c) >= SWIPE_TRIGGER) {
      s.fired = true;
      try {
        navigator.vibrate?.(10);
      } catch {}
    } else if (s.fired && Math.abs(c) < SWIPE_TRIGGER) {
      s.fired = false;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    const s = st.current;
    const fire = s.active && s.axis === 'x' && s.fired;
    s.active = false;
    reset(true);
    if (fire) cbRef.current?.();
  }, [reset]);

  const onTouchCancel = useCallback(() => {
    st.current.active = false;
    reset(true);
  }, [reset]);

  return {
    rowRef,
    iconRef,
    handlers: enabled ? { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel } : undefined,
  };
};

const useRecorder = ({ onFinish, onError }) => {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const secsRef = useRef(0);
  const stopRef = useRef(null);
  const onFinishRef = useRef(onFinish);
  const onErrorRef = useRef(onError);
  onFinishRef.current = onFinish;
  onErrorRef.current = onError;

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    recRef.current = null;
    setRecording(false);
  }, []);

  const stop = useCallback(
    (keep = true) => {
      const r = recRef.current;
      if (!r) return;
      const seconds = secsRef.current;
      r.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: r.mimeType || 'audio/webm' });
        chunksRef.current = [];
        cleanup();
        if (keep && blob.size) onFinishRef.current?.(blob, seconds);
      };
      try {
        r.stop();
      } catch {
        cleanup();
      }
    },
    [cleanup]
  );
  stopRef.current = stop;

  const start = useCallback(async () => {
    if (recRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onErrorRef.current?.('unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported?.(m)) || '';
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      r.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      r.start();
      recRef.current = r;
      secsRef.current = 0;
      setSecs(0);
      setRecording(true);
      const t0 = Date.now();
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        if (s === secsRef.current) return;
        secsRef.current = s;
        setSecs(s);
        if (s >= MAX_VOICE_SECONDS) stopRef.current?.(true);
      }, 500);
    } catch {
      cleanup();
      onErrorRef.current?.('denied');
    }
  }, [cleanup]);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      const r = recRef.current;
      if (r) {
        r.onstop = null;
        try {
          r.stop();
        } catch {}
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    },
    []
  );

  return { recording, secs, start, stop };
};

const Linkified = memo(({ text }) =>
  String(text)
    .split(URL_RE)
    .map((p, i) => {
      if (i % 2 === 0) return p;
      const href = safeHttp(p);
      return href ? (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer nofollow ugc" referrerPolicy="no-referrer" className="underline underline-offset-2 break-all">
          {p}
        </a>
      ) : (
        p
      );
    })
);

let activeVoice = null;

const waveHeights = (seed) => {
  let h = 2166136261;
  const str = String(seed);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let x = (h >>> 0) || 1;
  const out = [];
  for (let i = 0; i < WAVE_BARS; i += 1) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    out.push(0.2 + (x % 1000) / 1250);
  }
  return out;
};

const VoicePlayer = memo(({ url, seed, duration, N }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(duration || 0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const bars = useMemo(() => waveHeights(seed), [seed]);
  const dur = total || duration || 0;
  const ratio = dur > 0 ? Math.min(1, time / dur) : 0;

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = SPEEDS[speedIdx];
  }, [speedIdx, url]);

  useEffect(() => () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    if (activeVoice === a) activeVoice = null;
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      if (activeVoice && activeVoice !== a) activeVoice.pause();
      activeVoice = a;
      a.play().catch(() => setPlaying(false));
    } else {
      a.pause();
    }
  };

  const seekTo = (value) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    const next = Math.max(0, Math.min(dur, value));
    a.currentTime = next;
    setTime(next);
  };

  const onSeekClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    seekTo(((e.clientX - r.left) / r.width) * dur);
  };

  const onSeekKey = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekTo(time + 5);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekTo(time - 5);
    }
  };

  const onMeta = (e) => {
    const d = e.currentTarget.duration;
    if (!duration && Number.isFinite(d) && d > 0) setTotal(d);
  };

  const onEnded = (e) => {
    const a = e.currentTarget;
    if (!total && !duration && a.currentTime > 0) setTotal(a.currentTime);
    a.currentTime = 0;
    setPlaying(false);
    setTime(0);
    if (activeVoice === a) activeVoice = null;
  };

  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length);
  const shown = playing || time > 0 ? time : dur;

  return (
    <div className="flex w-64 max-w-full items-center gap-3 sm:w-72" dir="ltr">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={onMeta}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      />
      <button type="button" onClick={toggle} aria-label={playing ? N.pause : N.play} className={`${K.btnA} h-10 w-10 shrink-0 rounded-full`}>
        {playing ? <FiPause size={16} aria-hidden="true" /> : <FiPlay size={16} className="translate-x-px" aria-hidden="true" />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          data-noswipe
          role="slider"
          tabIndex={0}
          aria-label={N.seek}
          aria-valuemin={0}
          aria-valuemax={Math.round(dur)}
          aria-valuenow={Math.round(time)}
          onClick={onSeekClick}
          onKeyDown={onSeekKey}
          className="flex h-8 cursor-pointer items-center gap-[2px]"
        >
          {bars.map((h, i) => (
            <span
              key={i}
              style={{ height: `${Math.round(h * 100)}%` }}
              className={clsx('min-w-[2px] flex-1 rounded-full', (i + 0.5) / WAVE_BARS <= ratio ? 'bg-[color:var(--pg-accent)]' : 'bg-current opacity-30')}
            />
          ))}
        </div>
        <span className="mt-0.5 block text-[10px] font-bold tabular-nums opacity-80">{fmtDur(shown)}</span>
      </div>
      {playing ? (
        <button type="button" onClick={cycleSpeed} className={`${K.btn} h-7 min-w-[42px] shrink-0 rounded-full px-2 text-[10px]`}>
          {SPEEDS[speedIdx]}x
        </button>
      ) : (
        <FiMic size={16} className="shrink-0 opacity-60" aria-hidden="true" />
      )}
    </div>
  );
});

const Skeleton = () => <div className="h-40 w-56 max-w-full animate-pulse bg-black/10 dark:bg-white/10 motion-reduce:animate-none" />;

const Attachment = memo(({ msg, N }) => {
  const a = msg.attachment;
  const boxRef = useRef(null);
  const pending = !!msg._optimistic || String(msg.id).startsWith('opt-');
  const isMedia = MEDIA_TYPES.has(msg.type);
  const seen = useInView(boxRef, isMedia && !pending);
  const { url, error } = useBlobUrl(msg.id, isMedia && seen && !pending, msg.type);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveBlob(msg.id, a.name);
    } catch {
    } finally {
      setBusy(false);
    }
  };

  let body;
  if (pending) {
    body = (
      <div className="flex items-center gap-2 text-xs font-bold">
        {msg.type === 'VOICE' ? <FiMic size={16} aria-hidden="true" /> : <FiFile size={16} aria-hidden="true" />}
        <span className="truncate" dir="auto">{a.name}</span>
        <span className="tabular-nums" dir="ltr">{msg._progress ?? 0}%</span>
      </div>
    );
  } else if (msg.type === 'DOCUMENT') {
    body = (
      <div className="flex items-center gap-3">
        <FiFile size={20} className="shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" dir="auto">{a.name}</p>
          <p className="text-[11px] opacity-80" dir="ltr">{fmtBytes(a.size)}</p>
        </div>
        <button type="button" onClick={save} disabled={busy} aria-label={N.download} className={`${K.btn} h-8 w-8 shrink-0`}>
          <FiDownload size={14} aria-hidden="true" />
        </button>
      </div>
    );
  } else if (error) {
    body = <p className="text-xs font-bold">{N.mediaFail}</p>;
  } else if (!url) {
    body = msg.type === 'VOICE'
      ? <div className="h-10 w-64 max-w-full animate-pulse rounded-full bg-black/10 dark:bg-white/10 motion-reduce:animate-none" />
      : <Skeleton />;
  } else if (msg.type === 'IMAGE') {
    body = (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt={a.name} decoding="async" loading="lazy" referrerPolicy="no-referrer" className="max-h-64 max-w-full object-cover" />
      </a>
    );
  } else if (msg.type === 'VIDEO') {
    body = <video src={url} controls preload="metadata" playsInline className="max-h-64 max-w-full" />;
  } else if (msg.type === 'VOICE') {
    body = <VoicePlayer url={url} seed={msg.id} duration={a.duration} N={N} />;
  } else {
    body = (
      <div className="flex flex-col gap-1">
        <audio src={url} controls preload="metadata" className="w-56 max-w-full" />
        {a.duration > 0 && <span className="text-[10px] font-bold opacity-80" dir="ltr">{fmtDur(a.duration)}</span>}
      </div>
    );
  }

  return <div ref={boxRef} className={clsx('max-w-full', msg.type === 'VOICE' ? 'mb-1' : 'mb-2')}>{body}</div>;
});

const LocationCard = memo(({ loc, N }) => {
  const href = mapsHref(loc);
  const coords = href ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}` : '';
  return (
    <div className="mb-1 flex items-start gap-2 text-sm font-bold">
      <FiMapPin className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
      <div className="min-w-0">
        <p className="break-words" dir="auto">{loc.label || loc.address || coords}</p>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-2">
            {N.openMap}
          </a>
        )}
      </div>
    </div>
  );
});

const ContactCard = memo(({ contact, N }) => {
  const tel = contact.phone.replace(/[^\d+]/g, '');
  return (
    <div className="mb-1 flex items-center gap-3 text-sm font-bold">
      <FiUser className="shrink-0" size={18} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate" dir="auto">{contact.name}</p>
        <p className="text-xs opacity-80" dir="ltr">{contact.phone}</p>
      </div>
      {tel && (
        <a href={`tel:${tel}`} aria-label={N.call} className={`${K.btn} h-8 w-8 shrink-0`}>
          <FiPhone size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  );
});

const MessageContent = memo(({ msg, N, showLinks = false }) => {
  if (msg.deleted) return <p className="text-sm font-semibold italic opacity-70">{N.deleted}</p>;
  return (
    <>
      {FILE_TYPES.has(msg.type) && msg.attachment && <Attachment msg={msg} N={N} />}
      {msg.type === 'LOCATION' && msg.location && <LocationCard loc={msg.location} N={N} />}
      {msg.type === 'CONTACT' && msg.contact && <ContactCard contact={msg.contact} N={N} />}
      {msg.content && (
        <div dir="auto" className="whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed">
          <Linkified text={msg.content} />
        </div>
      )}
      {showLinks &&
        msg.links.map((l) => (
          <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow ugc" referrerPolicy="no-referrer" className="mt-1 block truncate text-xs font-bold underline underline-offset-2">
            {l}
          </a>
        ))}
    </>
  );
});

const ReplyQuote = memo(({ reply, N, onJump }) => (
  <button
    type="button"
    onClick={() => reply.id && onJump?.(reply.id)}
    className="mb-2 block w-full border-s-4 border-current bg-black/10 px-2 py-1 text-start text-xs"
  >
    <span className="block text-[10px] font-extrabold uppercase">{reply.sentBy === 'SHOP' ? N.sideShop : N.sideUser}</span>
    <span className="block truncate opacity-90" dir="auto">
      {reply.snippet === null ? N.deleted : reply.snippet || N.types[reply.type] || ''}
    </span>
  </button>
));

const MenuItem = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs font-bold uppercase hover:bg-black/10 dark:hover:bg-white/10"
  >
    <Icon size={14} aria-hidden="true" /> {label}
  </button>
);

const MessageMenu = memo(({ msg, N, onReply }) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="relative shrink-0 self-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={N.more}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${K.btn} h-7 w-7 opacity-60 hover:opacity-100 focus:opacity-100`}
      >
        <FiMoreVertical size={14} aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} aria-hidden="true" />
          <div role="menu" className={`${K.card} absolute end-0 top-full z-20 mt-1 flex min-w-[160px] flex-col p-1`}>
            <MenuItem icon={FiCornerUpLeft} label={N.reply} onClick={() => { close(); onReply(msg); }} />
          </div>
        </>
      )}
    </div>
  );
});

const AttachMenu = memo(({ N, onFile, onLocation, onContact, disabled }) => {
  const [open, setOpen] = useState(false);
  const docRef = useRef(null);
  const galRef = useRef(null);
  const camRef = useRef(null);

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    setOpen(false);
    if (f) onFile(f);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-label={N.attach}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${K.btn} h-11 w-11 sm:h-12 sm:w-12`}
      >
        <FiPaperclip size={18} aria-hidden="true" />
      </button>
      <input ref={docRef} type="file" hidden onChange={pick} />
      <input ref={galRef} type="file" accept="image/*,video/*" hidden onChange={pick} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className={`${K.card} absolute bottom-full start-0 z-20 mb-2 min-w-[200px] p-1`}>
            <MenuItem icon={FiFile} label={N.file} onClick={() => docRef.current?.click()} />
            <MenuItem icon={FiImage} label={N.gallery} onClick={() => galRef.current?.click()} />
            <MenuItem icon={FiCamera} label={N.camera} onClick={() => camRef.current?.click()} />
            <MenuItem icon={FiMapPin} label={N.location} onClick={() => { setOpen(false); onLocation(); }} />
            <MenuItem icon={FiUser} label={N.contact} onClick={() => { setOpen(false); onContact(); }} />
          </div>
        </>
      )}
    </div>
  );
});

const ContactForm = memo(({ N, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const ok = name.trim().length > 0 && /^\+?[\d\s\-()]{5,20}$/.test(phone.trim());
  return (
    <div className={`${K.card} mb-3 flex flex-wrap items-end gap-2 p-3`}>
      <input
        value={name}
        maxLength={80}
        dir="auto"
        onChange={(e) => setName(cleanText(e.target.value, 80))}
        placeholder={N.name}
        aria-label={N.name}
        className={`${K.field} min-w-0 flex-1 basis-32 px-3 py-2 text-sm font-semibold`}
      />
      <input
        value={phone}
        maxLength={20}
        inputMode="tel"
        dir="ltr"
        onChange={(e) => setPhone(cleanPhone(e.target.value))}
        placeholder={N.phone}
        aria-label={N.phone}
        className={`${K.field} min-w-0 flex-1 basis-32 px-3 py-2 text-sm font-semibold`}
      />
      <button type="button" disabled={!ok} onClick={() => onSubmit({ name: name.trim(), phone: phone.trim() })} className={`${K.btnA} h-10 px-3 text-xs uppercase`}>
        {N.send}
      </button>
      <button type="button" onClick={onCancel} className={`${K.btn} h-10 px-3 text-xs uppercase`}>{N.cancel}</button>
    </div>
  );
});

const ComposeBanner = memo(({ N, reply, onCancel }) => {
  if (!reply) return null;
  return (
    <div className={`${K.gray} ${K.line} mb-3 flex items-center gap-3 border-2 border-dotted px-3 py-2`}>
      <FiCornerUpLeft size={14} className="shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-xs">
        <p className="font-extrabold uppercase">
          {`${N.replyingTo} ${reply.senderType === 'SHOP' ? N.sideShop : N.sideUser}`}
        </p>
        <p dir="auto" className="truncate opacity-80">{snippetOf(reply) || N.types[reply.type] || ''}</p>
      </div>
      <button type="button" onClick={onCancel} aria-label={N.cancel} className={`${K.btn} h-7 w-7 shrink-0`}>
        <FiX size={14} aria-hidden="true" />
      </button>
    </div>
  );
});

const RecorderBar = memo(({ N, secs, onCancel, onSend }) => (
  <div className="flex items-center gap-2 sm:gap-3" role="status">
    <button type="button" onClick={onCancel} aria-label={N.discard} className={`${K.btn} h-11 w-11 shrink-0 sm:h-12 sm:w-12`}>
      <FiTrash2 size={18} aria-hidden="true" />
    </button>
    <div className={`${K.field} flex h-11 min-w-0 flex-1 items-center gap-3 px-3 sm:h-12 sm:px-4`}>
      <span className="h-3 w-3 shrink-0 animate-pulse bg-red-500 motion-reduce:animate-none" aria-hidden="true" />
      <span className="text-sm font-extrabold tabular-nums" dir="ltr">{fmtDur(secs)}</span>
      <span className="truncate text-xs font-bold opacity-70">{N.record}</span>
    </div>
    <button type="button" onClick={onSend} aria-label={N.stopSend} className={`${K.btnA} h-11 w-11 shrink-0 sm:h-12 sm:w-12`}>
      <FiSend size={18} className="rtl:-scale-x-100" aria-hidden="true" />
    </button>
  </div>
));

const Composer = memo(
  ({
    N, t, inputRef, attachDisabled, sessionExpired, locating, recording, secs, hasReply, isConnected,
    onSendText, onSendFile, onLocation, onContact, onCancelReply, onStartRec, onCancelRec, onSendRec,
  }) => {
    const [input, setInput] = useState('');
    const valRef = useRef('');
    valRef.current = input;

    const canSend = !!input.trim();
    const nearLimit = input.length > MAX_MSG_LEN * 0.9;

    const send = useCallback(() => {
      const text = valRef.current;
      if (!text.trim()) return;
      if (onSendText(text)) {
        setInput('');
        inputRef.current?.focus();
      }
    }, [onSendText, inputRef]);

    const pickFile = useCallback(
      (file) => {
        onSendFile(file, valRef.current);
        setInput('');
      },
      [onSendFile]
    );

    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === 'Escape' && hasReply) {
          e.stopPropagation();
          onCancelReply();
          return;
        }
        if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
        e.preventDefault();
        e.stopPropagation();
        send();
      },
      [hasReply, onCancelReply, send]
    );

    const handleChange = useCallback((e) => setInput(e.target.value.slice(0, MAX_MSG_LEN)), []);

    useEffect(() => {
      const el = inputRef.current;
      if (!el) return undefined;
      const id = requestAnimationFrame(() => {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
      });
      return () => cancelAnimationFrame(id);
    }, [input, recording, inputRef]);

    return (
      <>
        {recording ? (
          <RecorderBar N={N} secs={secs} onCancel={onCancelRec} onSend={onSendRec} />
        ) : (
          <div className="flex items-end gap-2 sm:gap-3">
            <AttachMenu N={N} onFile={pickFile} onLocation={onLocation} onContact={onContact} disabled={attachDisabled} />

            <textarea
              ref={inputRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={locating ? N.locating : t.placeholder}
              aria-label={t.messageLabel}
              maxLength={MAX_MSG_LEN}
              autoComplete="off"
              dir="auto"
              rows={1}
              className="pg-field min-w-0 flex-1 px-3 py-2.5 sm:px-4 sm:py-3 text-sm font-semibold resize-none overflow-y-auto pg-scroll"
            />

            {canSend ? (
              <button
                type="button"
                onClick={send}
                aria-label={t.send}
                className="pg-btn pg-btn-a h-11 w-11 sm:h-12 sm:w-12 shrink-0"
              >
                <FiSend size={18} className="rtl:-scale-x-100" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartRec}
                disabled={sessionExpired}
                aria-label={N.mic}
                className="pg-btn pg-btn-a h-11 w-11 sm:h-12 sm:w-12 shrink-0"
              >
                <FiMic size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {!isConnected && !sessionExpired && (
          <p className="mt-2 text-[11px] font-bold text-amber-500">{t.fallbackNote}</p>
        )}

        {nearLimit && (
          <p className="pg-muted mt-1.5 text-[10px] font-bold text-end tabular-nums" dir="ltr">
            {input.length} / {MAX_MSG_LEN}
          </p>
        )}
      </>
    );
  }
);

const MediaPanel = memo(({ userId, shopId, onClose, N, fmt, mapItem }) => {
  const [tab, setTab] = useState('MEDIA');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({});
  const ctrlRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setDq(q.trim().slice(0, 100)), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const c = new AbortController();
    rest.summary(userId, shopId, c.signal).then(({ data }) => setCounts(data || {})).catch(() => {});
    return () => c.abort();
  }, [userId, shopId]);

  const load = useCallback(
    (p) => {
      ctrlRef.current?.abort();
      const c = new AbortController();
      ctrlRef.current = c;
      setLoading(true);
      rest
        .media(userId, shopId, { category: tab, q: dq || undefined, page: p, size: 30 }, c.signal)
        .then(({ data }) => {
          if (c.signal.aborted) return;
          const rows = (Array.isArray(data?.content) ? data.content : []).map(mapItem);
          setItems((prev) => (p === 0 ? rows : [...prev, ...rows]));
          setPage(p);
          setLast(data?.last ?? rows.length < 30);
        })
        .catch(() => {
          if (!c.signal.aborted && p === 0) setItems([]);
        })
        .finally(() => {
          if (!c.signal.aborted) setLoading(false);
        });
    },
    [userId, shopId, tab, dq, mapItem]
  );

  useEffect(() => {
    load(0);
    return () => ctrlRef.current?.abort();
  }, [load]);

  return (
    <div role="dialog" aria-label={N.media} className={`${K.surface} absolute inset-0 z-30 flex min-h-0 flex-col`}>
      <div className={`${K.line} flex items-center justify-between gap-3 border-b-2 px-4 py-3 sm:px-6 sm:py-4`}>
        <h3 className="min-w-0 truncate text-sm font-extrabold uppercase sm:text-base">{N.media}</h3>
        <button type="button" onClick={onClose} aria-label={N.close} className={`${K.btn} h-10 w-10 shrink-0`}>
          <FiX size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="px-4 pt-4 sm:px-6">
        <div className={`${K.field} flex items-center gap-2 px-3`}>
          <FiSearch size={16} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(cleanText(e.target.value, 100))}
            placeholder={N.search}
            aria-label={N.search}
            dir="auto"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
          />
        </div>
        <div role="tablist" className={`${K.scroll} mt-3 flex gap-2 overflow-x-auto pb-2`}>
          {TAB_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`${tab === k ? K.btnA : K.btn} h-9 shrink-0 px-3 text-[11px] uppercase`}
            >
              {N.tabs[k]}
              <span className="tabular-nums" dir="ltr">{counts[COUNT_KEY[k]] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`${K.scroll} min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6`}>
        {items.length === 0 && !loading && <p className="py-10 text-center text-xs font-bold opacity-70">{N.empty}</p>}
        {items.map((m) => (
          <div key={m.id} className={`${K.card} p-3`}>
            <MessageContent msg={m} N={N} showLinks />
            <p className="mt-2 text-[10px] font-bold uppercase opacity-70">{fmt(m.createdAt)}</p>
          </div>
        ))}
        {loading && <div role="status" className="flex justify-center py-6"><div className="pg-spin h-7 w-7" /></div>}
        {!loading && !last && (
          <div className="flex justify-center">
            <button type="button" onClick={() => load(page + 1)} className={`${K.btn} h-9 px-4 text-[11px] uppercase`}>{N.loadMore}</button>
          </div>
        )}
      </div>
    </div>
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
  <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-5">
    <div className="w-28 h-28 sm:w-40 sm:h-40">
      <Illustration />
    </div>
    <div className="space-y-2">
      <h3 className="text-base sm:text-lg font-extrabold uppercase"><span className="pg-ul">{title}</span></h3>
      <p className="pg-muted text-xs font-semibold leading-relaxed max-w-[260px] mx-auto">{sub}</p>
    </div>
  </div>
));

const Spinner = memo(({ label }) => (
  <div role="status" aria-label={label} className="flex justify-center py-20">
    <div className="pg-spin w-8 h-8" />
  </div>
));

const SessionItem = memo(({ session, isActive, onSelect, t, N, f }) => {
  const handleKey = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
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
        <span className="pg-tile w-10 h-10 sm:w-11 sm:h-11 text-sm font-extrabold">{initial(session.userName)}</span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="min-w-0 flex-1 font-extrabold text-xs truncate uppercase" dir="auto">
              {session.favourite && <FiStar size={11} className="me-1 inline -mt-0.5" fill="currentColor" aria-hidden="true" />}
              {session.userName}
            </h4>
            {session.lastMessage?.createdAt && (
              <span className="pg-muted text-[9px] font-bold uppercase shrink-0">
                {formatTime(session.lastMessage.createdAt, f)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <p dir="auto" className="pg-muted min-w-0 flex-1 text-[11px] font-semibold truncate">
              {previewText(session.lastMessage, N, t.readyToHelp)}
            </p>

            {session.unreadCount > 0 && (
              <span
                aria-label={tpl(t.unreadAria, { n: f.num.format(session.unreadCount) })}
                className="pg-line shrink-0 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-extrabold border-2 flex items-center justify-center px-1 tabular-nums"
              >
                {f.num.format(session.unreadCount)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const MessageBubble = memo(({ msg, isOwn, mobile, onRetry, onReply, onDelete, onJump, N, t, fmt }) => {
  const failed = !!msg._failed;
  const pending = !!msg._optimistic && !failed;
  const canReply = !msg.deleted && !msg._optimistic && !failed;
  const canDelete = !msg._optimistic;
  const swipeOn = mobile && canReply;
  const swipe = useSwipeReply(swipeOn, () => onReply(msg));
  const bare = msg.type === 'VOICE' && !msg.deleted && !failed;
  const showStatus = isOwn && !failed && !msg.deleted;
  const statusLabel = pending ? N.statusSending : msg.read ? N.statusRead : N.statusSent;

  return (
    <div
      data-mid={msg.id}
      className={clsx('relative w-full mb-3 sm:mb-4', msg._optimistic && 'pg-in')}
    >
      {swipeOn && (
        <span
          ref={swipe.iconRef}
          aria-hidden="true"
          style={{ top: 'calc(50% - 16px)', opacity: 0, transform: 'scale(.6)' }}
          className="pg-tile pointer-events-none absolute h-8 w-8 rounded-full"
        >
          <FiCornerUpLeft size={14} />
        </span>
      )}

      <div
        ref={swipe.rowRef}
        {...swipe.handlers}
        style={swipeOn ? { touchAction: 'pan-y' } : undefined}
        className={clsx(
          'flex items-end gap-2 sm:gap-3 w-full will-change-transform',
          isOwn ? 'flex-row-reverse rtl:flex-row' : 'flex-row rtl:flex-row-reverse'
        )}
      >
        <div className="hidden shrink-0 sm:block">
          <span className={clsx('pg-tile w-8 h-8 text-[11px] font-extrabold', isOwn && '!bg-[var(--pg-ink)] !text-[var(--pg-card)]')}>
            {initial(msg.senderName)}
          </span>
        </div>

        <div className={clsx('flex min-w-0 flex-col max-w-[94%] sm:max-w-[88%]', isOwn ? 'items-end' : 'items-start')}>
          <div
            className={clsx(
              'relative max-w-full text-sm leading-relaxed text-start',
              bare
                ? 'px-1 py-1'
                : clsx('pg-bubble px-3 py-2.5 sm:px-4 sm:py-3', failed ? 'pg-bubble-fail' : isOwn ? 'pg-bubble-own' : 'pg-bubble-in'),
              pending && 'opacity-70'
            )}
          >
            {msg.replyTo && !msg.deleted && <ReplyQuote reply={msg.replyTo} N={N} onJump={onJump} />}
            <MessageContent msg={msg} N={N} />

            <div
              className={clsx(
                'flex items-center gap-2 mt-1.5 text-[9px] font-bold uppercase',
                isOwn ? 'justify-start' : 'justify-end',
                (isOwn || bare) && !failed ? 'pg-muted' : 'opacity-80'
              )}
            >
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(msg)}
                  aria-label={N.delMe}
                  title={N.delMe}
                  className="inline-flex h-6 w-6 items-center justify-center opacity-70 hover:opacity-100 focus-visible:opacity-100"
                >
                  <FiTrash2 size={13} aria-hidden="true" />
                </button>
              )}
              <span dir="ltr">{fmt(msg.createdAt)}</span>
              {msg.edited && !msg.deleted && <span>· {N.edited}</span>}
              {showStatus && (
                <span role="img" aria-label={statusLabel} title={statusLabel} className="inline-flex">
                  {pending ? (
                    <FiClock size={12} className="opacity-60" aria-hidden="true" />
                  ) : (
                    <IoCheckmarkDone
                      size={17}
                      className={msg.read ? 'text-[var(--pg-accent)]' : 'text-gray-400'}
                      aria-hidden="true"
                    />
                  )}
                </span>
              )}
              {failed && <FiAlertCircle size={11} aria-hidden="true" />}
            </div>
          </div>

          {failed && (
            <button type="button" onClick={() => onRetry?.(msg)} className="pg-btn mt-2 h-7 px-2.5 text-[10px] uppercase">
              <FiRefreshCw size={11} aria-hidden="true" /> {t.retryFailed}
            </button>
          )}
        </div>

        {!mobile && canReply && <MessageMenu msg={msg} N={N} onReply={onReply} />}
      </div>
    </div>
  );
});

const ShopChatModal = ({ onClose, onUnreadChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const language = useAppLanguage();
  const isAr = language === 'ar';
  const L = isAr ? shopAr : shopEn;
  const t = L.chatModal;
  const N = isAr ? NEW_AR : NEW_EN;
  const f = getFmt(L.locale);
  const fmt = useCallback((iso) => formatTime(iso, f), [f]);
  const fontStyle = useMemo(() => getFontStyle(language), [language]);
  const mobile = useIsMobile();

  useEffect(() => {
    const prev = document.title;
    document.title = 'Chats';
    return () => {
      document.title = prev;
    };
  }, []);

  const initialUserId = useMemo(
    () => cleanText(String(location.state?.userId ?? params.get('userId') ?? ''), 64).trim(),
    [location.state, params]
  );
  const initialUserName = useMemo(
    () => cleanText(String(location.state?.userName ?? params.get('userName') ?? ''), 80).trim(),
    [location.state, params]
  );

  const shopProfile = useMemo(
    () => ({
      email: readStored('userEmail') || 'shop@example.com',
      id: readStored('id'),
    }),
    []
  );

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLimit, setMsgLimit] = useState(MAX_RENDERED_MSGS);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [favOnly, setFavOnly] = useState(false);

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
  const replyRef = useRef(null);
  const tRef = useRef(t);
  const nRef = useRef(N);

  activeSessionRef.current = activeSession;
  sessionsRef.current = sessions;
  replyRef.current = replyTo;
  tRef.current = t;
  nRef.current = N;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    onUnreadChange?.(totalUnread);
  }, [totalUnread, onUnreadChange]);

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

  const refreshUnread = useCallback(() => {
    if (!shopProfile.id) return;

    clearTimeout(unreadTimerRef.current);
    unreadTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await chatApi.unreadCount(shopProfile.id);
        const n = parseCount(data);
        if (!mountedRef.current) return;
        setTotalUnread(n);
        publishUnread(n);
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
          ? cleanText(msg.shopName || shopProfile.email, 80)
          : cleanText(session?.userName || tRef.current.unknownUser, 80),
      createdAt: toIso(msg.createdAt) || new Date().toISOString(),
      read: !!msg.read,
      ...extraFields(msg),
    }),
    [shopProfile.email]
  );

  const applyDto = useCallback(
    (dto) => {
      if (!dto?.id) return;
      const ui = toUiMessage(dto, activeSessionRef.current);
      setMessages((prev) =>
        prev.map((x) => (String(x.id) === String(ui.id) ? { ...ui, _key: x._key ?? x.id } : x))
      );
      setSessions((prev) =>
        prev.map((s) =>
          s.lastMessage?.id != null && String(s.lastMessage.id) === String(dto.id)
            ? { ...s, lastMessage: { ...s.lastMessage, message: dto.message ?? s.lastMessage.message, deleted: !!dto.deleted } }
            : s
        )
      );
    },
    [toUiMessage]
  );

  const markDeleted = useCallback((id) => {
    setMessages((prev) => prev.map((x) => (String(x.id) === String(id) ? { ...x, ...DELETED_PATCH } : x)));
    setSessions((prev) =>
      prev.map((s) =>
        s.lastMessage?.id != null && String(s.lastMessage.id) === String(id)
          ? { ...s, lastMessage: { ...s.lastMessage, deleted: true } }
          : s
      )
    );
  }, []);

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

        const next = data.map((s) => ({
          ...s,
          userName: cleanText(
            s.userName || s.userEmail || tpl(tRef.current.userFallback, { id: String(s.userId).slice(0, 5) }),
            80
          ),
          unreadCount: Number(s.unreadCount) || 0,
          favourite: !!s.favourite,
          lastMessage: s.lastMessage
            ? { ...s.lastMessage, createdAt: toIso(s.lastMessage.createdAt) }
            : s.lastMessage,
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
        const msgs = raw.map((x) => toUiMessage(x, session)).sort(byCreatedAt);

        seenMsgIdsRef.current = new Set(msgs.map((x) => x.id));

        setMessages((prev) => {
          const next = [...msgs, ...prev.filter((x) => x._optimistic || x._failed)];

          if (
            silent &&
            prev.length === next.length &&
            prev.every(
              (x, i) =>
                x.id === next[i].id &&
                x.read === next[i].read &&
                x.deleted === next[i].deleted &&
                x.edited === next[i].edited &&
                x.content === next[i].content
            )
          ) {
            return prev;
          }

          const keys = new Map(prev.map((x) => [String(x.id), x._key]));
          return next.map((x) => (keys.get(String(x.id)) ? { ...x, _key: keys.get(String(x.id)) } : x));
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
      enabled: !!shopProfile.id,
      onConnect: handleConnect,
    });

  const blocked = status === 'auth-error' || status === 'account-changed';

  useEffect(() => {
    if (!shopProfile.id) {
      navigate('/login', { replace: true });
      return;
    }
    fetchSessions();
  }, [shopProfile.id, fetchSessions, navigate]);

  useEffect(() => {
    if (!initialUserId || !shopProfile.id) return;

    if (autoSelectedRef.current === initialUserId) return;
    autoSelectedRef.current = initialUserId;

    const target =
      sessionsRef.current.find((s) => String(s.userId) === initialUserId) || {
        userId: initialUserId,
        shopId: shopProfile.id,
        userName: cleanText(initialUserName || tRef.current.unknownUser, 80),
        unreadCount: 0,
        lastMessage: null,
      };

    setSessions((prev) => (prev.some((s) => String(s.userId) === initialUserId) ? prev : [target, ...prev]));

    setActiveSession(target);
    setIsSidebarOpen(false);
  }, [initialUserId, initialUserName, shopProfile.id]);

  useEffect(() => {
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      fetchSessionsRef.current?.(true);
      if (activeSessionRef.current) {
        fetchMessagesRef.current?.(activeSessionRef.current, true);
      }
    };

    document.addEventListener('visibilitychange', resync);
    return () => document.removeEventListener('visibilitychange', resync);
  }, []);

  const pollingNeeded = !!shopProfile.id && !isConnected && !blocked;

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
    setReplyTo(null);
    setContactOpen(false);
    setMediaOpen(false);
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

      if (body?.type !== 'CHAT' || body?.status !== 'SUCCESS') return;

      const action = body?.action;

      if (action === 'EDIT' || action === 'DELETE') {
        const dto = body.payload;
        if (!dto?.id) return;
        if (action === 'DELETE') markDeleted(dto.id);
        else applyDto(dto);
        return;
      }

      if (action !== 'SEND') return;

      const p = body.payload || {};
      const serverId = p.id;

      if (serverId != null && typeof serverId !== 'string' && typeof serverId !== 'number') return;
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
      const createdAt = toIso(p.createdAt) || new Date().toISOString();
      const msgType = KNOWN_TYPES.has(p.messageType) ? p.messageType : 'TEXT';

      if (isActive) {
        const newMsg = {
          ...toUiMessage({ ...p, sentBy: senderIsShop ? 'SHOP' : 'USER', createdAt }, current),
          id: serverId ?? `ws-${makeClientMsgId()}`,
        };

        const pending = p.clientMsgId ? pendingSendsRef.current.get(p.clientMsgId) : null;

        setMessages((prev) => {
          let idx = pending ? prev.findIndex((x) => x.id === pending.optimisticId) : -1;

          if (idx === -1 && senderIsShop && msgType === 'TEXT') {
            idx = prev.findIndex((x) => (x._optimistic || x._failed) && x.type === 'TEXT' && x.content === content);
          }

          if (idx !== -1) {
            const next = prev.slice();
            next[idx] = { ...newMsg, _key: prev[idx]._key ?? prev[idx].id };
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
                  lastMessage: { id: serverId, message: content, messageType: msgType, sentBy: senderIsShop ? 'SHOP' : 'USER', createdAt },
                  unreadCount: senderIsShop || isActive ? 0 : (s.unreadCount || 0) + 1,
                }
              : s
          )
        );
      }
    },
    [fetchSessions, refreshUnread, toUiMessage, applyDto, markDeleted]
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

  const reconcile = useCallback((optimisticId, saved) => {
    if (saved) {
      seenMsgIdsRef.current.add(saved.id);
      trimSet(seenMsgIdsRef.current, MAX_SEEN_IDS);
    }
    setMessages((prev) => {
      if (!saved) return prev.map((x) => (x.id === optimisticId ? { ...x, _optimistic: false } : x));
      if (prev.some((x) => x.id === saved.id)) return prev.filter((x) => x.id !== optimisticId);
      return prev.map((x) => (x.id === optimisticId ? { ...saved, read: false, _key: x._key ?? optimisticId } : x));
    });
  }, []);

  const dispatchMessage = useCallback(
    (draft) => {
      const current = activeSessionRef.current;
      const type = draft.type || 'TEXT';
      const text = cleanText(String(draft.message || '').trim());

      if (!current || (type === 'TEXT' && !text)) return false;

      if (blocked) {
        setError(tRef.current.sendBlocked[status]);
        return false;
      }

      const isRetry = 'replyTo' in draft;
      const replyPrev = isRetry ? draft.replyTo : replyRef.current ? previewOf(replyRef.current) : null;
      if (!isRetry) setReplyTo(null);

      const clientMsgId = makeClientMsgId();
      const optimisticId = `opt-${clientMsgId}`;
      const createdAt = new Date().toISOString();
      const saved = { message: text, type, location: draft.location, contact: draft.contact, replyTo: replyPrev };

      const markFailed = () =>
        setMessages((prev) =>
          prev.map((x) => (x.id === optimisticId ? { ...x, _optimistic: false, _failed: true, _draft: saved } : x))
        );

      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          _key: optimisticId,
          content: text,
          senderType: 'SHOP',
          senderName: shopProfile.email,
          createdAt,
          read: false,
          _optimistic: true,
          type,
          deleted: false,
          edited: false,
          attachment: null,
          location: draft.location ? { address: '', label: '', ...draft.location } : null,
          contact: draft.contact || null,
          replyTo: replyPrev,
          links: [],
        },
      ]);

      setSessions((prev) =>
        prev.map((s) =>
          String(s.userId) === String(current.userId)
            ? { ...s, lastMessage: { message: text, messageType: type, sentBy: 'SHOP', createdAt }, unreadCount: 0 }
            : s
        )
      );

      const payload = {
        message: text,
        clientMsgId,
        type,
        ...(draft.location ? { location: draft.location } : {}),
        ...(draft.contact ? { contact: draft.contact } : {}),
        ...(replyPrev?.id ? { replyToMessageId: replyPrev.id } : {}),
      };

      if (isConnected && client) {
        if (type === 'TEXT') {
          recentSentRef.current.add(text);
          trimSet(recentSentRef.current, MAX_RECENT_SENT);
        }

        const timeoutId = setTimeout(() => {
          pendingSendsRef.current.delete(clientMsgId);
          recentSentRef.current.delete(text);
          markFailed();
        }, OPTIMISTIC_TIMEOUT);

        pendingSendsRef.current.set(clientMsgId, { optimisticId, timeoutId });

        try {
          client.publish({
            destination: `/app/chat/user/${enc(current.userId)}/shop/${enc(current.shopId)}`,
            headers: { Authorization: authHeader() },
            body: JSON.stringify({
              payload,
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
          recentSentRef.current.delete(text);
          markFailed();
          setError(tRef.current.errors.sendFail);
        }

        return true;
      }

      rest
        .send(current.userId, current.shopId, payload)
        .then(({ data }) =>
          reconcile(optimisticId, data && typeof data === 'object' && data.id != null ? toUiMessage({ sentBy: 'SHOP', ...data }, current) : null)
        )
        .catch(() => {
          markFailed();
          setError(tRef.current.errors.sendFail);
        });

      return true;
    },
    [client, isConnected, status, blocked, authHeader, toUiMessage, reconcile, shopProfile.id, shopProfile.email]
  );

  const sendFile = useCallback(
    (file, opts = {}) => {
      const current = activeSessionRef.current;
      if (!file || !current) return;

      if (blocked) {
        setError(tRef.current.sendBlocked[status]);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(nRef.current.errors.fileTooBig);
        return;
      }
      if (BLOCKED_EXT.test(file.name) || BLOCKED_MIME.test(file.type || '')) {
        setError(nRef.current.errors.fileBad);
        return;
      }

      const isRetry = 'replyTo' in opts;
      const replyPrev = isRetry ? opts.replyTo : replyRef.current ? previewOf(replyRef.current) : null;
      if (!isRetry) setReplyTo(null);

      const clientMsgId = makeClientMsgId();
      const optimisticId = `opt-${clientMsgId}`;
      const caption = cleanText(opts.caption || '').trim();

      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          _key: optimisticId,
          content: caption,
          senderType: 'SHOP',
          senderName: shopProfile.email,
          createdAt: new Date().toISOString(),
          read: false,
          _optimistic: true,
          _progress: 0,
          type: opts.voice ? 'VOICE' : kindOf(file),
          deleted: false,
          edited: false,
          attachment: { name: cleanText(file.name, 120), mime: file.type, size: file.size, duration: opts.seconds || 0 },
          location: null,
          contact: null,
          replyTo: replyPrev,
          links: [],
        },
      ]);
      stickRef.current = true;

      const fd = new FormData();
      fd.append('file', file, safeFileName(file.name));
      if (caption) fd.append('caption', caption);
      if (replyPrev?.id) fd.append('replyToMessageId', String(replyPrev.id));
      if (opts.voice) {
        fd.append('voice', 'true');
        fd.append('durationSeconds', String(Math.max(1, Math.round(opts.seconds || 0))));
      }
      fd.append('clientMsgId', clientMsgId);

      rest
        .upload(current.userId, current.shopId, fd, (e) => {
          if (!e.total) return;
          const pct = Math.min(99, Math.round((e.loaded * 100) / e.total));
          setMessages((prev) =>
            prev.map((x) => (x.id === optimisticId && pct - (x._progress || 0) >= 5 ? { ...x, _progress: pct } : x))
          );
        })
        .then(({ data }) =>
          reconcile(optimisticId, data && typeof data === 'object' && data.id != null ? toUiMessage({ sentBy: 'SHOP', ...data }, current) : null)
        )
        .catch(() => {
          setMessages((prev) =>
            prev.map((x) =>
              x.id === optimisticId
                ? { ...x, _optimistic: false, _failed: true, _file: file, _opts: { ...opts, replyTo: replyPrev } }
                : x
            )
          );
          setError(nRef.current.errors.sendFail);
        });
    },
    [blocked, status, reconcile, toUiMessage, shopProfile.email]
  );

  const { recording, secs, start: startRecording, stop: stopRecording } = useRecorder({
    onFinish: (blob, seconds) => {
      const type = (blob.type || 'audio/webm').split(';')[0];
      const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
      sendFile(new File([blob], `voice-${Date.now()}.${ext}`, { type }), { voice: true, seconds: seconds || 1 });
    },
    onError: (kind) => setError(kind === 'denied' ? nRef.current.errors.micDenied : nRef.current.errors.micUnsupported),
  });

  const cancelRecording = useCallback(() => stopRecording(false), [stopRecording]);
  const sendRecording = useCallback(() => stopRecording(true), [stopRecording]);

  const handleSendText = useCallback(
    (text) => {
      const ok = dispatchMessage({ message: text });
      if (ok) stickRef.current = true;
      return ok;
    },
    [dispatchMessage]
  );

  const handleSendFile = useCallback((file, caption) => sendFile(file, { caption }), [sendFile]);

  const shareLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(nRef.current.errors.locFail);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mountedRef.current) return;
        setLocating(false);
        dispatchMessage({
          type: 'LOCATION',
          location: { latitude: Number(pos.coords.latitude.toFixed(6)), longitude: Number(pos.coords.longitude.toFixed(6)) },
        });
        stickRef.current = true;
      },
      () => {
        if (!mountedRef.current) return;
        setLocating(false);
        setError(nRef.current.errors.locFail);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [dispatchMessage]);

  const submitContact = useCallback(
    (contact) => {
      setContactOpen(false);
      dispatchMessage({ type: 'CONTACT', contact });
      stickRef.current = true;
    },
    [dispatchMessage]
  );

  const cancelReply = useCallback(() => setReplyTo(null), []);

  const handleReply = useCallback((msg) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  }, []);

  const handleDelete = useCallback(async (msg) => {
    const s = activeSessionRef.current;
    if (!s) return;
    if (msg._failed || String(msg.id).startsWith('opt-')) {
      setMessages((prev) => prev.filter((x) => x.id !== msg.id));
      return;
    }
    try {
      await rest.remove(s.userId, s.shopId, msg.id, 'ME');
      setMessages((prev) => prev.filter((x) => x.id !== msg.id));
    } catch {
      setError(nRef.current.errors.action);
    }
  }, []);

  const toggleFavourite = useCallback(() => {
    const s = activeSessionRef.current;
    if (!s || s.id == null) return;
    const cur = sessionsRef.current.find((x) => String(x.userId) === String(s.userId));
    const next = !cur?.favourite;
    const apply = (v) =>
      setSessions((prev) => prev.map((x) => (String(x.userId) === String(s.userId) ? { ...x, favourite: v } : x)));
    apply(next);
    rest.favourite(s.userId, s.shopId, next).catch(() => {
      apply(!next);
      setError(nRef.current.errors.action);
    });
  }, []);

  const handleRetry = useCallback(
    (failedMsg) => {
      if (blocked) {
        setError(tRef.current.sendBlocked[status]);
        return;
      }
      setMessages((prev) => prev.filter((x) => x.id !== failedMsg.id));
      if (failedMsg._file) sendFile(failedMsg._file, failedMsg._opts);
      else dispatchMessage(failedMsg._draft || { message: failedMsg.content });
    },
    [dispatchMessage, sendFile, blocked, status]
  );

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
  const toggleFavOnly = useCallback(() => setFavOnly((v) => !v), []);
  const openMedia = useCallback(() => setMediaOpen(true), []);
  const closeMedia = useCallback(() => setMediaOpen(false), []);
  const openContact = useCallback(() => setContactOpen(true), []);
  const closeContact = useCallback(() => setContactOpen(false), []);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  const jumpTo = useCallback((id) => {
    const el = scrollerRef.current?.querySelector(`[data-mid="${CSS.escape(String(id))}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
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

  const hiddenCount = Math.max(0, messages.length - msgLimit);
  const showOlder = useCallback(() => setMsgLimit((n) => n + MAX_RENDERED_MSGS), []);

  const messageGroups = useMemo(() => {
    const visible = hiddenCount > 0 ? messages.slice(hiddenCount) : messages;
    const groups = [];
    let lastKey = null;

    visible.forEach((m) => {
      const key = dayKey(m.createdAt);

      if (key !== lastKey) {
        groups.push({
          type: 'separator',
          key: `sep-${key}`,
          label: formatDateLabel(m.createdAt, f, t),
        });
        lastKey = key;
      }

      groups.push({ type: 'message', key: m._key ?? m.id, msg: m });
    });

    return groups;
  }, [messages, hiddenCount, f, t]);

  const visibleSessions = useMemo(() => {
    const list = favOnly ? sessions.filter((s) => s.favourite) : sessions;
    return [...list].sort((a, b) => (b.favourite ? 1 : 0) - (a.favourite ? 1 : 0));
  }, [sessions, favOnly]);

  const mapMediaItem = useCallback((x) => toUiMessage(x, activeSessionRef.current), [toUiMessage]);

  if (!shopProfile.id) return null;

  const isConnecting = status === 'connecting' || status === 'idle';
  const sessionExpired = blocked;
  const hasSessionRow = activeSession?.id != null;
  const isFav = !!sessions.find((s) => String(s.userId) === String(activeSession?.userId))?.favourite;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      lang={language}
      style={fontStyle}
      className="pg pg-bg fixed inset-x-0 top-16 bottom-0 z-30 p-0 sm:p-3 lg:start-64 lg:p-4 text-start"
    >
      {STYLE_EL}

      <section aria-label={t.dialogLabel} className="pg-card relative flex h-full w-full min-h-0 overflow-hidden">
        <aside
          className={clsx(
            'pg-gray pg-line w-full md:w-72 lg:w-80 xl:w-96 min-h-0 flex flex-col md:border-e-2 shrink-0',
            !isSidebarOpen && 'hidden md:flex'
          )}
        >
          <div className="pg-surface pg-line px-4 py-4 sm:px-6 sm:py-6 border-b-2 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-[11px] font-extrabold uppercase">
                <span className="pg-bar shrink-0" aria-hidden="true" />
                <span className="truncate">{t.centerLabel}</span>
              </p>
              {onClose && (
                <button type="button" onClick={onClose} aria-label={N.close} title={N.close} className="pg-btn h-8 w-8 shrink-0">
                  <FiX size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <h2 className="min-w-0 truncate text-xl sm:text-2xl font-extrabold tracking-tight uppercase">
                <span className="pg-ul">{t.heading}</span>
              </h2>

              {totalUnread > 0 && (
                <span
                  aria-label={tpl(t.unreadAria, { n: f.num.format(totalUnread) })}
                  className="pg-line min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-[10px] font-extrabold border-2 flex items-center justify-center tabular-nums shrink-0"
                >
                  {f.num.format(totalUnread)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="pg-muted min-w-0 truncate text-[11px] font-bold uppercase">{t.realtime}</p>
              <button
                type="button"
                onClick={toggleFavOnly}
                aria-pressed={favOnly}
                className={clsx('pg-btn h-8 px-2.5 text-[10px] uppercase shrink-0', favOnly && 'pg-btn-a')}
              >
                <FiStar size={12} fill={favOnly ? 'currentColor' : 'none'} aria-hidden="true" /> {N.favOnly}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 pg-scroll">
            {isLoadingSessions && sessions.length === 0 ? (
              <Spinner label={t.loadingAria} />
            ) : visibleSessions.length === 0 ? (
              <EmptyHero Illustration={ChatIllustration} title={t.noChats} sub={t.noChatsSub} />
            ) : (
              visibleSessions.map((s) => (
                <SessionItem
                  key={s.userId}
                  session={s}
                  isActive={String(activeSession?.userId) === String(s.userId)}
                  onSelect={handleSelectSession}
                  t={t}
                  N={N}
                  f={f}
                />
              ))
            )}
          </div>

          <div className="pg-surface pg-line p-3 sm:p-4 border-t-2">
            <div className="pg-line flex items-center justify-between gap-2 px-3 py-2.5 sm:px-3.5 sm:py-3 border-2 border-dotted">
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
                      className="mt-0.5 text-[10px] font-bold text-red-500 truncate max-w-[160px] sm:max-w-[200px]"
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
            'pg-surface flex-1 min-w-0 min-h-0 flex flex-col relative',
            isSidebarOpen && 'hidden md:flex'
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
              <div className="pg-surface pg-line px-3 sm:px-6 py-3 sm:py-4 border-b-2 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-40">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={openSidebar}
                    aria-label={t.backToList}
                    className="pg-btn md:hidden h-10 w-10 shrink-0"
                  >
                    <FiArrowRight size={18} className="ltr:rotate-180" aria-hidden="true" />
                  </button>

                  <span className="pg-tile w-10 h-10 sm:w-11 sm:h-11 text-sm font-extrabold">{initial(activeSession.userName)}</span>

                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-extrabold uppercase truncate" dir="auto">{activeSession.userName}</h3>

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

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {hasSessionRow && (
                    <>
                      <button
                        type="button"
                        onClick={toggleFavourite}
                        aria-pressed={isFav}
                        aria-label={isFav ? N.unstar : N.star}
                        title={isFav ? N.unstar : N.star}
                        className="pg-btn h-10 w-10"
                      >
                        <FiStar size={16} fill={isFav ? 'currentColor' : 'none'} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={openMedia}
                        aria-label={N.media}
                        title={N.media}
                        className="pg-btn h-10 w-10"
                      >
                        <FiFolder size={16} aria-hidden="true" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleCloseClick}
                    title={t.closeChat}
                    aria-label={confirmClose ? t.confirmClose : t.closeChat}
                    className={clsx('pg-btn h-10 min-w-10 px-2.5 sm:px-3 text-[10px] uppercase', confirmClose && 'pg-btn-red')}
                  >
                    <FiArchive size={14} aria-hidden="true" />
                    <span className="hidden sm:inline">{confirmClose ? t.confirmClose : t.closeChat}</span>
                  </button>
                </div>
              </div>

              <div
                ref={scrollerRef}
                onScroll={handleScroll}
                className="pg-grid min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-6 py-4 sm:py-6 pg-scroll overscroll-contain"
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
                        <div key={item.key} className="flex items-center justify-center my-4 sm:my-5">
                          <span className="pg-chip">{item.label}</span>
                        </div>
                      ) : (
                        <MessageBubble
                          key={item.key}
                          msg={item.msg}
                          isOwn={item.msg.senderType === 'SHOP'}
                          mobile={mobile}
                          onRetry={handleRetry}
                          onReply={handleReply}
                          onDelete={handleDelete}
                          onJump={jumpTo}
                          N={N}
                          t={t}
                          fmt={fmt}
                        />
                      )
                    )}
                  </>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="pg-surface pg-line shrink-0 border-t-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <ComposeBanner N={N} reply={replyTo} onCancel={cancelReply} />
                {contactOpen && (
                  <ContactForm N={N} onSubmit={submitContact} onCancel={closeContact} />
                )}

                <Composer
                  key={String(activeSession.userId)}
                  N={N}
                  t={t}
                  inputRef={inputRef}
                  attachDisabled={locating || sessionExpired}
                  sessionExpired={sessionExpired}
                  locating={locating}
                  recording={recording}
                  secs={secs}
                  hasReply={!!replyTo}
                  isConnected={isConnected}
                  onSendText={handleSendText}
                  onSendFile={handleSendFile}
                  onLocation={shareLocation}
                  onContact={openContact}
                  onCancelReply={cancelReply}
                  onStartRec={startRecording}
                  onCancelRec={cancelRecording}
                  onSendRec={sendRecording}
                />
              </div>

              {mediaOpen && hasSessionRow && (
                <MediaPanel
                  userId={activeSession.userId}
                  shopId={activeSession.shopId}
                  onClose={closeMedia}
                  N={N}
                  fmt={fmt}
                  mapItem={mapMediaItem}
                />
              )}
            </>
          ) : (
            <EmptyHero Illustration={SelectChatIllustration} title={t.selectChat} sub={t.selectChatSub} />
          )}
        </main>
      </section>
    </div>
  );
};

const MemoShopChatModal = memo(ShopChatModal);

export default function ShopChatModalRoot(props) {
  return <MemoShopChatModal {...props} />;
}