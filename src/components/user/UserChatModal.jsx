import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiX, FiSend, FiArrowLeft, FiAlertCircle, FiRefreshCw, FiArchive,
  FiPaperclip, FiCamera, FiMic, FiMapPin, FiUser, FiStar, FiCornerUpLeft,
  FiTrash2, FiMoreVertical, FiDownload, FiFile, FiImage, FiPhone, FiSearch, FiFolder, FiClock, FiPlay, FiPause,
} from 'react-icons/fi';
import { IoCheckmarkDone } from 'react-icons/io5';
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
const MAX_BACKOFF_STEPS = 4;
const MAX_RENDERED_MSGS = 150;
const MAX_SEEN_IDS = 2000;
const MAX_RECENT_SENT = 50;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_VOICE_SECONDS = 300;
const MAX_TIME_CACHE = 600;
const SWIPE_TRIGGER = 48;
const SWIPE_MAX = 72;
const SWIPE_IGNORE = 'audio,video,button,a,input,textarea,select,[data-noswipe]';
const WAVE_BARS = 36;
const SPEEDS = [1, 1.5, 2];
const MOBILE_QUERY = '(max-width: 639px), (pointer: coarse)';
const DISPLAY_TZ = 'Africa/Cairo';
const enc = encodeURIComponent;

const K = {
  btn: 'nc-btn',
  btnA: 'nc-btn nc-btn-a',
  btnRed: 'nc-btn nc-btn-r',
  field: 'nc-field',
  card: 'nc-row',
  line: 'nc-line',
  gray: 'nc-gray',
  surface: 'nc-surface',
  scroll: 'nc-scroll',
};

const ERR = {
  login: 'chat.errors.login',
  loadChats: 'chat.errors.loadChats',
  loadMessages: 'chat.errors.loadMessages',
  send: 'chat.errors.send',
  close: 'chat.errors.close',
};

const NEW_EN = {
  reply: 'Reply', replyingTo: 'Replying to', sideShop: 'Shop', sideUser: 'You', cancel: 'Cancel', you: 'You',
  delMe: 'Delete for me', statusSending: 'Sending', statusSent: 'Delivered', statusRead: 'Read', play: 'Play', pause: 'Pause', seek: 'Seek',
  deleted: 'This message was deleted', attach: 'Attach', file: 'Document',
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
  },
};

const NEW_AR = {
  reply: 'رد', replyingTo: 'الرد على', sideShop: 'المتجر', sideUser: 'أنت', cancel: 'إلغاء', you: 'أنت',
  delMe: 'حذف عندي', statusSending: 'جارٍ الإرسال', statusSent: 'تم التسليم', statusRead: 'تمت القراءة', play: 'تشغيل', pause: 'إيقاف مؤقت', seek: 'تقديم',
  deleted: 'تم حذف هذه الرسالة', attach: 'إرفاق', file: 'مستند',
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
  },
};

const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const cleanText = (v, max = MAX_MSG_LEN) => (typeof v === 'string' ? v.replace(CTRL_RE, '').slice(0, max) : '');
const initial = (name, fallback = 'S') => (typeof name === 'string' ? name.trim()[0]?.toUpperCase() : null) || fallback;
const trimSet = (set, max) => {
  while (set.size > max) set.delete(set.values().next().value);
};

const TZ_SUFFIX_RE = /(Z|[+-]\d{2}:?\d{2})$/i;
const NAIVE_DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

const parseDate = (v) => {
  if (v instanceof Date) return v;
  if (Array.isArray(v) && v.length >= 3) {
    const [y, mo, d, h = 0, mi = 0, s = 0, ns = 0] = v.map(Number);
    return new Date(Date.UTC(y, mo - 1, d, h, mi, s, Math.floor(ns / 1e6)));
  }
  if (typeof v === 'string') {
    const s = v.trim().replace(/(\.\d{3})\d+/, '$1');
    if (NAIVE_DATETIME_RE.test(s) && !TZ_SUFFIX_RE.test(s)) return new Date(`${s.replace(' ', 'T')}Z`);
    return new Date(s);
  }
  return new Date(v);
};

const toIso = (v) => {
  if (v == null) return '';
  const d = parseDate(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

const timeFmts = new Map();
const timeCache = new Map();
const getTimeFmt = (lang) => {
  const key = lang || 'en';
  let fmt = timeFmts.get(key);
  if (!fmt) {
    const isEn = key.startsWith('en');
    const opts = { hour: '2-digit', minute: '2-digit', timeZone: DISPLAY_TZ };
    try {
      fmt = new Intl.DateTimeFormat(isEn ? 'en-US' : key, isEn ? { ...opts, hour12: true } : opts);
    } catch {
      try {
        fmt = new Intl.DateTimeFormat('en-US', { ...opts, hour12: true });
      } catch {
        fmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }
    timeFmts.set(key, fmt);
  }
  return fmt;
};
const formatTime = (iso, lang) => {
  if (!iso) return '';
  const cacheKey = `${lang}|${iso}`;
  const hit = timeCache.get(cacheKey);
  if (hit !== undefined) return hit;
  let out = '';
  try {
    out = getTimeFmt(lang).format(parseDate(iso));
  } catch {
    out = '';
  }
  if (timeCache.size >= MAX_TIME_CACHE) timeCache.delete(timeCache.keys().next().value);
  timeCache.set(cacheKey, out);
  return out;
};
const makeClientMsgId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const scrollBehavior = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const API = '/api/chats';
const pair = (u, s) => `${API}/${enc(u)}/shop/${enc(s)}`;
const rest = {
  send: (u, s, body) => api.post(`${pair(u, s)}/messages`, body),
  upload: (u, s, fd, onProgress) => api.post(`${pair(u, s)}/attachments`, fd, { timeout: 120000, onUploadProgress: onProgress }),
  remove: (u, s, id) => api.delete(`${pair(u, s)}/messages/${enc(id)}`, { params: { scope: 'ME' } }),
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
  return lm.sentBy === 'USER' ? `${N.you}: ${base}` : base;
};

const sameSessions = (a, b) =>
  a.length === b.length &&
  a.every((s, i) => {
    const x = b[i];
    return (
      s.id === x.id &&
      s.shopId === x.shopId &&
      s.shopName === x.shopName &&
      s.unreadCount === x.unreadCount &&
      !!s.favourite === !!x.favourite &&
      s.lastMessage?.id === x.lastMessage?.id &&
      s.lastMessage?.message === x.lastMessage?.message &&
      s.lastMessage?.messageType === x.lastMessage?.messageType &&
      s.lastMessage?.sentBy === x.lastMessage?.sentBy &&
      s.lastMessage?.deleted === x.lastMessage?.deleted &&
      s.lastMessage?.createdAt === x.lastMessage?.createdAt
    );
  });

const byCreatedAt = (a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0);

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
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((mt) => MediaRecorder.isTypeSupported?.(mt)) || '';
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
              className={clsx('min-w-[2px] flex-1 rounded-full', (i + 0.5) / WAVE_BARS <= ratio ? 'bg-[color:var(--nc-accent)]' : 'bg-current opacity-30')}
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
          <div role="menu" className="nc-panel absolute end-0 top-full z-20 mt-1 flex min-w-[160px] flex-col p-1">
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
        className={`${K.btn} h-12 w-12`}
      >
        <FiPaperclip size={18} aria-hidden="true" />
      </button>
      <input ref={docRef} type="file" hidden onChange={pick} />
      <input ref={galRef} type="file" accept="image/*,video/*" hidden onChange={pick} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="nc-panel absolute bottom-full start-0 z-20 mb-2 min-w-[200px] p-1">
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
    <div className="nc-panel mb-3 flex flex-wrap items-end gap-2 p-3">
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
  <div className="flex items-center gap-3" role="status">
    <button type="button" onClick={onCancel} aria-label={N.discard} className={`${K.btn} h-12 w-12 shrink-0`}>
      <FiTrash2 size={18} aria-hidden="true" />
    </button>
    <div className={`${K.field} flex h-12 min-w-0 flex-1 items-center gap-3 px-4`}>
      <span className="h-3 w-3 shrink-0 animate-pulse bg-red-500 motion-reduce:animate-none" aria-hidden="true" />
      <span className="text-sm font-extrabold tabular-nums" dir="ltr">{fmtDur(secs)}</span>
      <span className="truncate text-xs font-bold opacity-70">{N.record}</span>
    </div>
    <button type="button" onClick={onSend} aria-label={N.stopSend} className={`${K.btnA} h-12 w-12 shrink-0`}>
      <FiSend size={18} className="rtl:-scale-x-100" aria-hidden="true" />
    </button>
  </div>
));

const Composer = memo(
  ({
    N, inputRef, placeholder, ariaLabel, sendLabel, liveNote, attachDisabled, authFatal, locating, recording, secs,
    hasReply, isConnected, onSendText, onSendFile, onLocation, onContact, onCancelReply, onStartRec, onCancelRec, onSendRec,
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
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
      });
      return () => cancelAnimationFrame(id);
    }, [input, recording, inputRef]);

    return (
      <>
        {recording ? (
          <RecorderBar N={N} secs={secs} onCancel={onCancelRec} onSend={onSendRec} />
        ) : (
          <div className="flex items-end gap-3">
            <AttachMenu N={N} onFile={pickFile} onLocation={onLocation} onContact={onContact} disabled={attachDisabled} />
            <div className="nc-field min-w-0 flex-1">
              <textarea
                ref={inputRef}
                dir="auto"
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={locating ? N.locating : placeholder}
                aria-label={ariaLabel}
                maxLength={MAX_MSG_LEN}
                autoComplete="off"
                className="nc-scroll block max-h-40 w-full resize-none bg-transparent px-4 py-3.5 text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
                rows={1}
              />
            </div>
            {canSend ? (
              <button type="button" onClick={send} aria-label={sendLabel} className="nc-btn nc-btn-a h-12 w-12 shrink-0">
                <FiSend size={17} className="rtl:-scale-x-100" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={onStartRec} disabled={authFatal} aria-label={N.mic} className="nc-btn nc-btn-a h-12 w-12 shrink-0">
                <FiMic size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {!isConnected && !authFatal && (
          <p className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">{liveNote}</p>
        )}
        {nearLimit && (
          <p className="nc-muted mt-1.5 text-end text-[11px] font-bold tabular-nums" dir="ltr">{input.length} / {MAX_MSG_LEN}</p>
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
    <div role="dialog" aria-label={N.media} className={`${K.surface} absolute inset-0 z-30 flex flex-col`}>
      <div className={`${K.line} flex items-center justify-between gap-3 border-b-[3px] px-4 py-4 sm:px-6`}>
        <h3 className="text-base font-extrabold uppercase">{N.media}</h3>
        <button type="button" onClick={onClose} aria-label={N.close} className={`${K.btn} h-10 w-10`}>
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
        <div role="tablist" className={`${K.scroll} mt-4 flex gap-3 overflow-x-auto pb-3 pe-1`}>
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

      <div className={`${K.scroll} flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6`}>
        {items.length === 0 && !loading && <p className="py-10 text-center text-xs font-bold opacity-70">{N.empty}</p>}
        {items.map((m) => (
          <div key={m.id} className="nc-bubble nc-own p-3">
            <MessageContent msg={m} N={N} showLinks />
            <p className="mt-2 text-[10px] font-bold opacity-70">{fmt(m.createdAt)}</p>
          </div>
        ))}
        {loading && (
          <div role="status" className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--nc-accent)] border-t-transparent motion-reduce:animate-none" />
          </div>
        )}
        {!loading && !last && (
          <div className="flex justify-center">
            <button type="button" onClick={() => load(page + 1)} className={`${K.btn} h-9 px-4 text-[11px] uppercase`}>{N.loadMore}</button>
          </div>
        )}
      </div>
    </div>
  );
});

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
const BUBBLE_ANIMATE = { opacity: 1, y: 0 };
const BUBBLE_FRESH = { opacity: 0, y: 10 };
const BUBBLE_TRANSITION = { duration: 0.15 };
const ERROR_INITIAL = { y: -20, opacity: 0 };
const ERROR_ANIMATE = { y: 0, opacity: 1 };

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

const Spinner = memo(({ label }) => (
  <div className="flex justify-center py-20">
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-[color:var(--nc-accent)] border-t-transparent motion-reduce:animate-none" role="status" aria-label={label} />
  </div>
));

const SessionItem = memo(({ session, isActive, onSelect, name, lang, readyLabel, N }) => {
  const handleKey = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
      e.preventDefault();
      onSelect(session);
    }
  };
  return (
    <div
      onClick={() => onSelect(session)}
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'true' : undefined}
      onKeyDown={handleKey}
      className={clsx('nc-row mb-4 cursor-pointer select-none p-3 text-start [content-visibility:auto] [contain-intrinsic-size:auto_80px]', isActive && 'nc-row-on')}
    >
      <div className="flex items-center gap-3">
        <div className={clsx('nc-chip h-11 w-11 shrink-0 text-sm', isActive && '!bg-[color:var(--nc-card)] !text-[color:var(--nc-ink)]')}>
          {initial(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate text-xs font-extrabold uppercase" dir="auto">
              {session.favourite && <FiStar size={11} className="me-1 -mt-0.5 inline" fill="currentColor" aria-hidden="true" />}
              {name}
            </h4>
            {session.unreadCount > 0 && (
              <span className={clsx('nc-chip h-5 min-w-[20px] shrink-0 px-1.5 text-[10px]', isActive && '!bg-[color:var(--nc-card)] !text-[color:var(--nc-ink)]')}>
                {session.unreadCount}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className={clsx('min-w-0 flex-1 truncate text-[11px] font-semibold', isActive ? 'opacity-90' : 'nc-muted')} dir="auto">
              {previewText(session.lastMessage, N, readyLabel)}
            </p>
            {session.lastMessage?.createdAt && (
              <span className={clsx('shrink-0 text-[10px] font-bold', isActive ? 'opacity-90' : 'nc-muted')}>{formatTime(session.lastMessage.createdAt, lang)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const MessageBubble = memo(({ msg, isOwn, mobile, onRetry, onReply, onDelete, onJump, N, fmt, retryLabel, fbInitial }) => {
  const failed = !!msg._failed;
  const pending = !!msg._optimistic && !failed;
  const canReply = !msg.deleted && !msg._optimistic && !failed;
  const canDelete = !msg._optimistic;
  const swipeOn = mobile && canReply;
  const swipe = useSwipeReply(swipeOn, () => onReply(msg));
  const statusLabel = pending ? N.statusSending : msg.read ? N.statusRead : N.statusSent;
  const showStatus = isOwn && !failed && !msg.deleted;
  const bare = msg.type === 'VOICE' && !msg.deleted && !failed;

  return (
    <m.div
      data-mid={msg.id}
      initial={msg._fresh ? BUBBLE_FRESH : false}
      animate={BUBBLE_ANIMATE}
      transition={BUBBLE_TRANSITION}
      className="relative mb-5 w-full"
    >
      {swipeOn && (
        <span
          ref={swipe.iconRef}
          aria-hidden="true"
          style={{ top: 'calc(50% - 16px)', opacity: 0, transform: 'scale(.6)' }}
          className="nc-chip pointer-events-none absolute h-8 w-8 rounded-full"
        >
          <FiCornerUpLeft size={14} />
        </span>
      )}

      <div
        ref={swipe.rowRef}
        {...swipe.handlers}
        style={swipeOn ? { touchAction: 'pan-y' } : undefined}
        className={clsx('flex w-full items-end gap-2 will-change-transform sm:gap-3', isOwn ? 'flex-row-reverse' : 'flex-row')}
      >
        <div className="hidden shrink-0 sm:block">
          <div aria-hidden="true" className={clsx('nc-chip h-8 w-8 text-[11px]', isOwn && '!bg-[color:var(--nc-ink)] !text-[color:var(--nc-card)]')}>
            {initial(msg.senderName, fbInitial)}
          </div>
        </div>

        <div className={clsx('flex min-w-0 max-w-[94%] flex-col sm:max-w-[88%]', isOwn ? 'items-end' : 'items-start')}>
          <div className={clsx('relative max-w-full text-start', bare ? 'px-1 py-1' : clsx('nc-bubble px-4 py-3', failed ? 'nc-fail' : isOwn ? 'nc-own' : 'nc-shop'), pending && 'opacity-70')}>
            {msg.replyTo && !msg.deleted && <ReplyQuote reply={msg.replyTo} N={N} onJump={onJump} />}
            <MessageContent msg={msg} N={N} />
            <div className={clsx('mt-2 flex items-center gap-2 text-[10px] font-bold', isOwn ? 'justify-end' : 'justify-start', !failed && (isOwn || bare ? 'nc-muted' : 'opacity-90'))}>
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
              {failed && <FiAlertCircle size={11} aria-hidden="true" />}
              <span dir="ltr">{fmt(msg.createdAt)}</span>
              {showStatus && (
                <span role="img" aria-label={statusLabel} title={statusLabel} className="inline-flex">
                  {pending ? (
                    <FiClock size={12} className="opacity-60" aria-hidden="true" />
                  ) : (
                    <IoCheckmarkDone
                      size={17}
                      className={msg.read ? 'text-emerald-500 dark:text-[#39ff88]' : 'text-gray-400 dark:text-gray-400'}
                      aria-hidden="true"
                    />
                  )}
                </span>
              )}
            </div>
          </div>
          {failed && (
            <button type="button" onClick={() => onRetry?.(msg)} className="mt-2 flex items-center gap-1 text-[11px] font-extrabold uppercase text-red-600 underline underline-offset-4 dark:text-red-400">
              <FiRefreshCw size={11} aria-hidden="true" /> {retryLabel}
            </button>
          )}
        </div>

        {!mobile && canReply && <MessageMenu msg={msg} N={N} onReply={onReply} />}
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
  const N = isAr ? NEW_AR : NEW_EN;
  const fmt = useCallback((iso) => formatTime(iso, lang), [lang]);
  const mobile = useIsMobile();

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

  const messagesEndRef = useRef(null);
  const scrollerRef = useRef(null);
  const stickRef = useRef(true);
  const prevLenRef = useRef(0);
  const inputRef = useRef(null);
  const recentSentRef = useRef(new Set());
  const seenMsgIdsRef = useRef(new Set());
  const pendingSendsRef = useRef(new Map());
  const hasConnectedRef = useRef(false);
  const autoSelectedRef = useRef(null);
  const unreadTimerRef = useRef(null);
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
  const nRef = useRef(N);
  const initialShopRef = useRef({ id: null, name: '' });
  const onUnreadChangeRef = useRef(onUnreadChange);
  activeSessionRef.current = activeSession;
  sessionsRef.current = sessions;
  replyRef.current = replyTo;
  nRef.current = N;
  onUnreadChangeRef.current = onUnreadChange;
  initialShopRef.current = { id: initialShopId ? String(initialShopId) : null, name: cleanText(initialShopName || '', 80) };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
        if (!mountedRef.current) return;
        setTotalUnread(n);
        onUnreadChangeRef.current?.(n);
      } catch {}
    }, 300);
  }, [userProfile.id]);

  const toUiMessage = useCallback(
    (msg, session) => ({
      id: msg.id,
      content: cleanText(msg.message ?? msg.content, MAX_MSG_LEN * 2),
      senderType: msg.sentBy === 'SHOP' ? 'SHOP' : 'USER',
      senderName: msg.sentBy === 'SHOP' ? cleanText(msg.shopName || session?.shopName || '', 80) : cleanText(msg.userName || userProfile.email, 80),
      createdAt: toIso(msg.createdAt) || new Date().toISOString(),
      read: !!msg.read,
      ...extraFields(msg),
    }),
    [userProfile.email]
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

  const fetchSessions = useCallback(async (silent = false) => {
    if (!userProfile.id) return true;
    if (silent && sessionsFlight.current) {
      sessionsQueued.current = true;
      return true;
    }
    const seq = ++sessionsSeq.current;
    sessionsFlight.current = true;
    if (!silent) setIsLoadingSessions(true);
    let ok = true;

    const build = (raw) => {
      const list = raw.map((s) => ({
        id: s.id,
        shopId: String(s.shopId),
        shopName: cleanText(s.shopName || s.shopEmail || '', 80),
        userId: s.userId,
        createdAt: toIso(s.createdAt),
        lastMessage: s.lastMessage ? { ...s.lastMessage, createdAt: toIso(s.lastMessage.createdAt) } : null,
        unreadCount: Number(s.unreadCount) || 0,
        favourite: !!s.favourite,
      }));
      const want = initialShopRef.current;
      if (want.id && !list.some((s) => s.shopId === want.id)) {
        list.unshift({ id: null, shopId: want.id, shopName: want.name, userId: userProfile.id, createdAt: new Date().toISOString(), lastMessage: null, unreadCount: 0, favourite: false });
      }
      return list;
    };

    try {
      const res = await chatApi.mySessions();
      if (!mountedRef.current || seq !== sessionsSeq.current) return true;
      const next = build(Array.isArray(res.data) ? res.data : res.data?.content || []);
      setSessions((prev) => (sameSessions(prev, next) ? prev : next));
      refreshUnread();
    } catch (err) {
      if (!mountedRef.current || seq !== sessionsSeq.current) return true;
      if (err?.response?.status === 404) {
        const next = build([]);
        setSessions((prev) => (sameSessions(prev, next) ? prev : next));
      } else {
        ok = false;
        setSessions((prev) => (prev.length ? prev : build([])));
        if (!silent) setError(ERR.loadChats);
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
  }, [userProfile.id, refreshUnread]);
  fetchSessionsRef.current = fetchSessions;

  const fetchMessages = useCallback(async (session, silent = false) => {
    if (!session || !userProfile.id) return true;
    const key = String(session.shopId);
    if (silent && msgsFlight.current === key) {
      msgsQueued.current = true;
      return true;
    }
    const seq = ++msgsSeq.current;
    msgsFlight.current = key;
    if (!silent) setIsLoadingMessages(true);
    const stale = () =>
      !mountedRef.current || seq !== msgsSeq.current || String(activeSessionRef.current?.shopId) !== key;
    let ok = true;

    try {
      const { data } = await chatApi.messages(userProfile.id, session.shopId);
      if (stale()) return true;
      const raw = Array.isArray(data) ? data : data?.content || [];
      const msgs = raw.map((x) => toUiMessage(x, session)).sort(byCreatedAt);

      seenMsgIdsRef.current = new Set(msgs.map((x) => x.id));
      setMessages((prev) => {
        const next = [...msgs, ...prev.filter((x) => x._optimistic || x._failed)];
        if (
          silent &&
          prev.length === next.length &&
          prev.every((x, i) => x.id === next[i].id && x.read === next[i].read && x.deleted === next[i].deleted && x.content === next[i].content)
        ) {
          return prev;
        }
        const keys = new Map(prev.map((x) => [String(x.id), x._key]));
        return next.map((x) => (keys.get(String(x.id)) ? { ...x, _key: keys.get(String(x.id)) } : x));
      });
      if (!silent) setError(null);
      if (msgs.some((x) => x.senderType === 'SHOP' && !x.read)) {
        chatApi.markRead(userProfile.id, session.shopId).then(refreshUnread).catch(() => {});
        setSessions((prev) =>
          prev.some((s) => s.shopId === key && s.unreadCount)
            ? prev.map((s) => (s.shopId === key ? { ...s, unreadCount: 0 } : s))
            : prev
        );
      }
    } catch (err) {
      if (stale()) return true;
      if (err?.response?.status === 404 || session.id == null) {
        setMessages((prev) => prev.filter((x) => x._optimistic || x._failed));
        if (!silent) setError(null);
      } else {
        ok = false;
        if (!silent) setError(ERR.loadMessages);
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
  }, [userProfile.id, toUiMessage, refreshUnread]);
  fetchMessagesRef.current = fetchMessages;

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

  const isAuthFatal = status === 'auth-error' || status === 'account-changed';

  useEffect(() => {
    if (!open) {
      hasConnectedRef.current = false;
      autoSelectedRef.current = null;
      recentSentRef.current.clear();
      seenMsgIdsRef.current.clear();
      setActiveSession(null);
      setMessages([]);
      setIsSidebarOpen(true);
      setReplyTo(null);
      setMediaOpen(false);
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
        favourite: false,
      };
    setSessions((prev) => (prev.some((x) => x.shopId === wanted) ? prev : [target, ...prev]));
    setActiveSession(target);
    setIsSidebarOpen(false);
  }, [open, initialShopId, initialShopName, userProfile.id]);

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
  }, [activeSession?.shopId, fetchMessages]);

  useEffect(() => {
    if (!open) return undefined;
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      fetchSessionsRef.current?.(true);
      if (activeSessionRef.current) fetchMessagesRef.current?.(activeSessionRef.current, true);
    };
    document.addEventListener('visibilitychange', resync);
    return () => document.removeEventListener('visibilitychange', resync);
  }, [open]);

  const pollingNeeded = open && !!userProfile.id && !isConnected && !isAuthFatal;
  useEffect(() => {
    if (!pollingNeeded) return undefined;
    let timer;
    let stopped = false;
    let fails = 0;
    const run = async () => {
      if (document.visibilityState === 'visible') {
        const results = await Promise.all([
          fetchSessionsRef.current?.(true),
          activeSessionRef.current ? fetchMessagesRef.current?.(activeSessionRef.current, true) : true,
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

  const makeHandler = useCallback((fallbackShopId) => (frame) => {
    let body;
    try {
      body = JSON.parse(frame.body);
    } catch {
      return;
    }
    if (body?.type !== 'CHAT' || body?.status !== 'SUCCESS') return;
    const p = body.payload || {};
    if (p.userId != null && String(p.userId) !== String(userProfile.id)) return;

    const action = body.action;
    if (action === 'DELETE') {
      if (p.id != null) markDeleted(p.id);
      return;
    }
    if (action !== 'SEND') return;

    const serverId = p.id;
    if (serverId != null && typeof serverId !== 'string' && typeof serverId !== 'number') return;
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
    if (serverId != null) {
      seenMsgIdsRef.current.add(serverId);
      trimSet(seenMsgIdsRef.current, MAX_SEEN_IDS);
    }

    const session = activeSessionRef.current;
    const isActive = String(session?.shopId) === shopId;
    const createdAt = toIso(p.createdAt) || new Date().toISOString();
    const msgType = KNOWN_TYPES.has(p.messageType) ? p.messageType : 'TEXT';

    if (isActive) {
      const newMsg = {
        ...toUiMessage({ ...p, sentBy: senderIsUser ? 'USER' : 'SHOP', createdAt }, session),
        id: serverId ?? `ws-${makeClientMsgId()}`,
        _fresh: true,
      };
      const pending = p.clientMsgId ? pendingSendsRef.current.get(p.clientMsgId) : null;
      setMessages((prev) => {
        let idx = pending ? prev.findIndex((x) => x.id === pending.optimisticId) : -1;
        if (idx === -1 && senderIsUser && msgType === 'TEXT') {
          idx = prev.findIndex((x) => (x._optimistic || x._failed) && x.type === 'TEXT' && x.content === content);
        }
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
                lastMessage: { id: serverId, message: content, messageType: msgType, sentBy: senderIsUser ? 'USER' : 'SHOP', createdAt },
                unreadCount: senderIsUser || isActive ? 0 : (s.unreadCount || 0) + 1,
              }
            : s
        )
      );
    }
  }, [userProfile.id, fetchSessions, refreshUnread, toUiMessage, markDeleted]);

  useEffect(() => {
    if (!client || !isConnected || !userProfile.id) return undefined;
    const sub = client.subscribe(`/topic/user/${enc(userProfile.id)}/chats`, makeHandler(null));
    return () => { try { sub.unsubscribe(); } catch {} };
  }, [client, isConnected, userProfile.id, makeHandler]);

  const activeShopId = activeSession?.shopId;
  const activeUserId = activeSession?.userId ?? userProfile.id;
  useEffect(() => {
    if (!client || !isConnected || !activeShopId || !activeUserId) return undefined;
    const sub = client.subscribe(`/topic/chat/${enc(activeUserId)}/${enc(activeShopId)}`, makeHandler(activeShopId));
    return () => { try { sub.unsubscribe(); } catch {} };
  }, [client, isConnected, activeShopId, activeUserId, makeHandler]);

  const reconcile = useCallback((optimisticId, saved) => {
    if (saved) {
      seenMsgIdsRef.current.add(saved.id);
      trimSet(seenMsgIdsRef.current, MAX_SEEN_IDS);
    }
    setMessages((prev) => {
      if (!saved) return prev.map((x) => (x.id === optimisticId ? { ...x, _optimistic: false, _fresh: false } : x));
      if (prev.some((x) => x.id === saved.id)) return prev.filter((x) => x.id !== optimisticId);
      return prev.map((x) => (x.id === optimisticId ? { ...saved, read: false, _key: x._key ?? optimisticId } : x));
    });
  }, []);

  const dispatchMessage = useCallback((draft) => {
    const session = activeSessionRef.current;
    const type = draft.type || 'TEXT';
    const text = cleanText(String(draft.message || '').trim());
    if (!session || (type === 'TEXT' && !text)) return false;

    if (isAuthFatal) {
      setError(`chat.sendBlocked.${status}`);
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
      setMessages((prev) => prev.map((x) => (x.id === optimisticId ? { ...x, _optimistic: false, _failed: true, _fresh: false, _draft: saved } : x)));

    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId, _key: optimisticId, content: text, senderType: 'USER', senderName: userProfile.email, createdAt,
        read: false, _optimistic: true, _fresh: true, type, deleted: false, attachment: null,
        location: draft.location ? { address: '', label: '', ...draft.location } : null,
        contact: draft.contact || null, replyTo: replyPrev, links: [],
      },
    ]);
    setSessions((prev) =>
      prev.map((s) => (s.shopId === String(session.shopId) ? { ...s, lastMessage: { message: text, messageType: type, sentBy: 'USER', createdAt }, unreadCount: 0 } : s))
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
          destination: `/app/chat/user/${enc(userProfile.id)}/shop/${enc(session.shopId)}`,
          headers: { Authorization: authHeader() },
          body: JSON.stringify({
            payload, senderId: userProfile.id, senderType: 'USER', sentBy: 'USER',
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

    rest
      .send(userProfile.id, session.shopId, payload)
      .then(({ data }) =>
        reconcile(optimisticId, data && typeof data === 'object' && data.id != null ? toUiMessage({ sentBy: 'USER', ...data }, session) : null)
      )
      .catch(() => {
        markFailed();
        setError(ERR.send);
      });
    return true;
  }, [client, isConnected, status, isAuthFatal, authHeader, toUiMessage, reconcile, userProfile.id, userProfile.email]);

  const sendFile = useCallback((file, opts = {}) => {
    const session = activeSessionRef.current;
    if (!file || !session) return;

    if (isAuthFatal) {
      setError(`chat.sendBlocked.${status}`);
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
        id: optimisticId, _key: optimisticId, content: caption, senderType: 'USER', senderName: userProfile.email,
        createdAt: new Date().toISOString(), read: false, _optimistic: true, _fresh: true, _progress: 0,
        type: opts.voice ? 'VOICE' : kindOf(file), deleted: false,
        attachment: { name: cleanText(file.name, 120), mime: file.type, size: file.size, duration: opts.seconds || 0 },
        location: null, contact: null, replyTo: replyPrev, links: [],
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
      .upload(userProfile.id, session.shopId, fd, (e) => {
        if (!e.total) return;
        const pct = Math.min(99, Math.round((e.loaded * 100) / e.total));
        setMessages((prev) => prev.map((x) => (x.id === optimisticId && pct - (x._progress || 0) >= 5 ? { ...x, _progress: pct } : x)));
      })
      .then(({ data }) =>
        reconcile(optimisticId, data && typeof data === 'object' && data.id != null ? toUiMessage({ sentBy: 'USER', ...data }, session) : null)
      )
      .catch(() => {
        setMessages((prev) =>
          prev.map((x) =>
            x.id === optimisticId
              ? { ...x, _optimistic: false, _failed: true, _fresh: false, _file: file, _opts: { ...opts, replyTo: replyPrev } }
              : x
          )
        );
        setError(ERR.send);
      });
  }, [isAuthFatal, status, reconcile, toUiMessage, userProfile.id, userProfile.email]);

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

  const submitContact = useCallback((contact) => {
    setContactOpen(false);
    dispatchMessage({ type: 'CONTACT', contact });
    stickRef.current = true;
  }, [dispatchMessage]);

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
      await rest.remove(userProfile.id, s.shopId, msg.id);
      setMessages((prev) => prev.filter((x) => x.id !== msg.id));
    } catch {
      setError(nRef.current.errors.action);
    }
  }, [userProfile.id]);

  const toggleFavourite = useCallback(() => {
    const s = activeSessionRef.current;
    if (!s || s.id == null) return;
    const cur = sessionsRef.current.find((x) => x.shopId === String(s.shopId));
    const next = !cur?.favourite;
    const apply = (v) => setSessions((prev) => prev.map((x) => (x.shopId === String(s.shopId) ? { ...x, favourite: v } : x)));
    apply(next);
    rest.favourite(userProfile.id, s.shopId, next).catch(() => {
      apply(!next);
      setError(nRef.current.errors.action);
    });
  }, [userProfile.id]);

  const handleRetry = useCallback((failedMsg) => {
    if (isAuthFatal) {
      setError(`chat.sendBlocked.${status}`);
      return;
    }
    setMessages((prev) => prev.filter((x) => x.id !== failedMsg.id));
    if (failedMsg._file) sendFile(failedMsg._file, failedMsg._opts);
    else dispatchMessage(failedMsg._draft || { message: failedMsg.content });
  }, [dispatchMessage, sendFile, isAuthFatal, status]);

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
    if (closingRef.current) return;
    setConfirmClose(false);
    const session = activeSessionRef.current;
    if (!session) return;
    closingRef.current = true;
    try {
      if (session.id != null) await chatApi.close(userProfile.id, session.shopId);
      if (!mountedRef.current) return;
      setSessions((prev) => prev.filter((x) => x.shopId !== String(session.shopId)));
      setActiveSession(null);
      setMessages([]);
      setIsSidebarOpen(true);
      refreshUnread();
    } catch {
      if (mountedRef.current) setError(ERR.close);
    } finally {
      closingRef.current = false;
    }
  }, [confirmClose, userProfile.id, refreshUnread]);

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
    const ownPending = !!last && last.senderType === 'USER' && !!last._optimistic;
    if (stickRef.current || ownPending) {
      const grew = messages.length - prevLenRef.current;
      messagesEndRef.current?.scrollIntoView({ behavior: grew >= 1 && grew <= 3 && prevLenRef.current > 0 ? scrollBehavior() : 'auto', block: 'end' });
    }
    prevLenRef.current = messages.length;
  }, [messages]);

  const hiddenCount = Math.max(0, messages.length - msgLimit);
  const visibleMessages = useMemo(
    () => (hiddenCount > 0 ? messages.slice(hiddenCount) : messages),
    [messages, hiddenCount]
  );
  const showOlder = useCallback(() => setMsgLimit((n) => n + MAX_RENDERED_MSGS), []);

  const visibleSessions = useMemo(() => {
    const list = favOnly ? sessions.filter((s) => s.favourite) : sessions;
    return [...list].sort((a, b) => (b.favourite ? 1 : 0) - (a.favourite ? 1 : 0));
  }, [sessions, favOnly]);

  const mapMediaItem = useCallback((x) => toUiMessage(x, activeSessionRef.current), [toUiMessage]);

  if (!open || !userProfile.id) return null;

  const isConnecting = status === 'connecting' || status === 'idle';
  const activeName = activeSession ? shopLabel(activeSession) : '';
  const readyLabel = t('chat.readyToHelp');
  const retryLabel = t('chat.retry');
  const fbInitial = initial(t('chat.shopFallback'));
  const dotCls = isConnected ? 'bg-[color:var(--nc-accent)]' : isConnecting ? 'bg-amber-400' : 'bg-red-500';
  const hasSessionRow = activeSession?.id != null;
  const isFav = !!sessions.find((s) => s.shopId === String(activeSession?.shopId))?.favourite;
  const errText = error ? (error.startsWith('chat.') ? t(error) : error) : '';

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
              'nc-surface nc-line flex min-h-0 w-full shrink-0 flex-col border-e-[3px] sm:w-96',
              !isSidebarOpen && 'hidden sm:flex'
            )}>
              <div className="nc-line space-y-3 border-b-[3px] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-3 text-xs font-extrabold uppercase tracking-wide rtl:tracking-normal"><span className="nc-bar" aria-hidden="true" />{t('chat.supportHub')}</p>
                  <button type="button" onClick={onClose} aria-label={t('chat.closeMessages')} className="nc-btn h-9 w-9 sm:hidden"><FiX size={16} aria-hidden="true" /></button>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-extrabold uppercase leading-tight tracking-tight rtl:tracking-normal"><span className="nc-ul">{t('chat.title')}</span></h2>
                  {totalUnread > 0 && <span className="nc-chip h-6 min-w-[24px] px-1.5 text-[11px]">{totalUnread}</span>}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="nc-muted text-xs font-bold">{t('chat.subtitle')}</p>
                  <button
                    type="button"
                    onClick={toggleFavOnly}
                    aria-pressed={favOnly}
                    className={clsx('nc-btn h-8 shrink-0 px-2.5 text-[11px] uppercase', favOnly && 'nc-btn-a')}
                  >
                    <FiStar size={12} fill={favOnly ? 'currentColor' : 'none'} aria-hidden="true" /> {N.favOnly}
                  </button>
                </div>
              </div>

              <div className="nc-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pe-5 sm:p-5 sm:pe-6">
                {isLoadingSessions && sessions.length === 0 ? (
                  <Spinner label={t('chat.loadingChats')} />
                ) : visibleSessions.length === 0 ? (
                  <EmptyHero variant="no-chats" title={t('chat.noChatsTitle')} sub={t('chat.noChatsSub')} />
                ) : (
                  visibleSessions.map((s) => (
                    <SessionItem
                      key={s.shopId}
                      session={s}
                      name={shopLabel(s)}
                      lang={lang}
                      readyLabel={readyLabel}
                      N={N}
                      isActive={String(activeSession?.shopId) === s.shopId}
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
                    <RiVerifiedBadgeLine className="shrink-0 text-emerald-500 dark:text-[#39ff88]" size={20} aria-hidden="true" />
                  ) : !isConnecting ? (
                    <button type="button" onClick={handleStatusAction} className="nc-btn nc-btn-a h-8 shrink-0 px-2.5 text-[11px] uppercase">
                      <FiRefreshCw size={12} aria-hidden="true" /> {isAuthFatal ? t('chat.reload') : t('chat.reconnect')}
                    </button>
                  ) : null}
                </div>
              </div>
            </aside>

            <main className={clsx('relative flex min-h-0 min-w-0 flex-1 flex-col', isSidebarOpen && 'hidden sm:flex')}>
              <AnimatePresence>
                {error && (
                  <m.div role="alert" initial={ERROR_INITIAL} animate={ERROR_ANIMATE} exit={ERROR_INITIAL}
                    className="nc-line absolute inset-x-0 top-0 z-50 border-b-[3px] bg-red-600 p-3 text-center text-xs font-extrabold uppercase text-white">
                    {errText}
                  </m.div>
                )}
              </AnimatePresence>

              {activeSession ? (
                <>
                  <div className="nc-surface nc-line sticky top-0 z-40 flex items-center justify-between gap-2 border-b-[3px] px-3 py-4 sm:gap-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                      <button type="button" onClick={openSidebar} aria-label={t('chat.backToChats')} className="nc-btn h-10 w-10 shrink-0 sm:hidden"><FiArrowLeft size={18} className="rtl:rotate-180" aria-hidden="true" /></button>
                      <div className="nc-chip h-10 w-10 shrink-0 text-sm sm:h-12 sm:w-12 sm:text-base">{initial(activeName)}</div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold uppercase sm:text-base" dir="auto"><span className="nc-ul">{activeName}</span></h3>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={clsx('h-2.5 w-2.5 border-2 nc-line', isConnected ? 'bg-[color:var(--nc-accent)]' : 'bg-gray-400')} />
                          <span className="nc-muted text-[10px] font-extrabold uppercase">{isConnected ? t('chat.connected') : t('chat.offline')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pe-1">
                      {hasSessionRow && (
                        <>
                          <button
                            type="button"
                            onClick={toggleFavourite}
                            aria-pressed={isFav}
                            aria-label={isFav ? N.unstar : N.star}
                            title={isFav ? N.unstar : N.star}
                            className="nc-btn h-10 w-10"
                          >
                            <FiStar size={16} fill={isFav ? 'currentColor' : 'none'} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={openMedia}
                            aria-label={N.media}
                            title={N.media}
                            className="nc-btn h-10 w-10"
                          >
                            <FiFolder size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseClick}
                            title={t('chat.closeChatTitle')}
                            aria-label={confirmClose ? t('chat.confirmClose') : t('chat.closeChat')}
                            className={clsx('nc-btn h-10 px-3 text-[11px] uppercase', confirmClose && 'nc-btn-r')}
                          >
                            <FiArchive size={14} aria-hidden="true" />
                            <span className={clsx(!confirmClose && 'hidden sm:inline')}>{confirmClose ? t('chat.confirmClose') : t('chat.closeChat')}</span>
                          </button>
                        </>
                      )}
                      <button type="button" onClick={onClose} aria-label={t('chat.closeMessages')} className="nc-btn h-10 w-10 shrink-0"><FiX size={18} aria-hidden="true" /></button>
                    </div>
                  </div>

                  <div
                    ref={scrollerRef}
                    onScroll={handleScroll}
                    role="log"
                    aria-live="polite"
                    aria-label={t('chat.conversation')}
                    className="nc-dots nc-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-6 sm:px-6 sm:py-8"
                  >
                    {isLoadingMessages && messages.length === 0 ? (
                      <Spinner label={t('chat.loadingMessages')} />
                    ) : messages.length === 0 ? (
                      <EmptyHero
                        variant="fresh-start"
                        title={t('chat.freshStartTitle')}
                        sub={t('chat.freshStartSub', { name: activeName, interpolation: { escapeValue: false } })}
                      />
                    ) : (
                      <>
                        {hiddenCount > 0 && (
                          <div className="flex justify-center pb-4">
                            <button type="button" onClick={showOlder} className="nc-btn h-8 px-3 text-[11px] uppercase">{N.showOlder}</button>
                          </div>
                        )}
                        {visibleMessages.map((x) => (
                          <MessageBubble
                            key={x._key ?? x.id}
                            msg={x}
                            isOwn={x.senderType === 'USER'}
                            mobile={mobile}
                            onRetry={handleRetry}
                            onReply={handleReply}
                            onDelete={handleDelete}
                            onJump={jumpTo}
                            N={N}
                            fmt={fmt}
                            retryLabel={retryLabel}
                            fbInitial={fbInitial}
                          />
                        ))}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="nc-surface nc-line shrink-0 border-t-[3px] p-4 pe-5 sm:p-5 sm:pe-6">
                    <ComposeBanner N={N} reply={replyTo} onCancel={cancelReply} />
                    {contactOpen && <ContactForm N={N} onSubmit={submitContact} onCancel={closeContact} />}

                    <Composer
                      key={String(activeSession.shopId)}
                      N={N}
                      inputRef={inputRef}
                      placeholder={t('chat.typeMessage')}
                      ariaLabel={t('chat.typeMessageAria')}
                      sendLabel={t('chat.sendMessage')}
                      liveNote={t('chat.liveUnavailable')}
                      attachDisabled={locating || isAuthFatal}
                      authFatal={isAuthFatal}
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
                      userId={userProfile.id}
                      shopId={activeSession.shopId}
                      onClose={closeMedia}
                      N={N}
                      fmt={fmt}
                      mapItem={mapMediaItem}
                    />
                  )}
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

export default function UserChatModalRoot(props) {
  return <UserChatModal {...props} />;
}