import React, {
  useEffect, useState, useCallback, useMemo, useRef, memo, useSyncExternalStore,
} from 'react';
import { useQuery, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiX, FiBell } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../common/api/api';
import useAuthStore from '../../common/store/Auth';
import queryClient from '../../common/utils/queryClient';
import { clearClientCookie, clearGoogleMark } from '../../common/utils/googleSession';
import {
  RiAccountBoxLine, RiAccountBoxFill,
  RiDeviceLine, RiDeviceFill,
  RiLoginCircleLine, RiLoginCircleFill,
  RiUserAddLine, RiUserAddFill,
  RiShoppingCartLine,
  RiStore2Line, RiStore2Fill,
  RiSunFill, RiMoonFill,
  RiTruckLine, RiTruckFill,
  RiHome2Line, RiHome2Fill,
  RiHome4Line, RiHome4Fill,
  RiLogoutBoxRLine,
} from 'react-icons/ri';
import logo from '../../common/images/tech-restore-logo.webp';
import { Defs3D, Device3DStyles, DeviceScene } from './Device3D';
import enTranslations from '../../locales/en/translation.json';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';

const NAVBAR_TRANSLATIONS = { en: enTranslations.navbar, ar: arTranslations.navbar, fr: frTranslations.navbar };
const getNavbarTranslation = (language, key) => NAVBAR_TRANSLATIONS[language]?.[key] || NAVBAR_TRANSLATIONS.en?.[key] || key;

const NB_FONT_STYLE = { fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" };
const TOAST_STYLE_AR = { fontFamily: "'Cairo', sans-serif", fontSize: 14, borderRadius: 16 };
const TOAST_STYLE_LTR = { fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, borderRadius: 16 };

const ensureNbFont = () => {
  if (typeof document === 'undefined' || document.getElementById('nb-font')) return;
  [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
    const l = document.createElement('link');
    l.rel = 'preconnect'; l.href = href; if (cors) l.crossOrigin = '';
    document.head.appendChild(l);
  });
  const link = document.createElement('link');
  link.id = 'nb-font';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Cairo:wght@400;600;700;800&display=swap';
  document.head.appendChild(link);
};

const NAV_CSS = `
  html, body { overflow-x: hidden; max-width: 100vw; }
  .nv-root{display:contents}
  .nv{
    --nv-bg:#ffffff;--nv-card:#ffffff;--nv-ink:#0f2a1f;--nv-muted:#6b7f75;--nv-line:#e4e9e6;
    --nv-gray:#ecfaf3;--nv-accent:#10b981;--nv-btn:#059669;--nv-on:#ffffff;--nv-lbl:#059669;
    --nv-soft:#f3f5f4;--nv-soft-line:#e4e9e6;
    --nv-shadow:0 10px 30px -8px rgba(15,42,31,.18),0 2px 6px rgba(15,42,31,.06);
    --nv-glow:0 8px 18px -4px rgba(5,150,105,.55);
    background:var(--nv-bg);color:var(--nv-ink)
  }
  .nv-dark{
    --nv-bg:#1a1a1a;--nv-card:#262626;--nv-ink:#ffffff;--nv-muted:#a3a3a3;--nv-line:#333333;
    --nv-gray:#2f2f2f;--nv-accent:#39ff88;--nv-btn:#2cff7a;--nv-on:#021a0c;--nv-lbl:#39ff88;
    --nv-soft:#262626;--nv-soft-line:#333333;
    --nv-shadow:0 10px 30px -8px rgba(0,0,0,.7),0 2px 6px rgba(0,0,0,.4);
    --nv-glow:0 6px 20px -2px rgba(57,255,136,.55)
  }
  .nv-bar{border:1px solid var(--nv-line);box-shadow:var(--nv-shadow);border-radius:24px;
    transition:margin .2s ease,padding .2s ease,transform .2s ease}
  .nv-desk{margin:12px 16px 0;padding:10px 24px}
  .nv-mob{margin:10px 12px 0}
  .nv-root[data-tier=scrolled] .nv-desk{margin:8px 20px 0}
  .nv-root[data-tier=deep] .nv-desk{margin:8px 20px 0;padding-block:6px}
  .nv-root[data-tier=scrolled] .nv-mob,.nv-root[data-tier=deep] .nv-mob{margin:6px 12px 0}
  .nv-root[data-tier=deep] .nv-logo-m{height:2.5rem}
  .nv-root[data-hide=true] .nv-bar{transform:translateY(-170%)}
  .nv-gray{background:var(--nv-gray)}
  .nv-soft{background:var(--nv-soft)}
  .nv-soft-line{border-color:var(--nv-soft-line)}
  .nv-line{border-color:var(--nv-line)}
  .nv-muted{color:var(--nv-muted)}
  .nv-card{background:var(--nv-card);color:var(--nv-ink);border:1px solid var(--nv-line);box-shadow:var(--nv-shadow);border-radius:22px}
  .nv-num{display:inline-flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;border-radius:9999px;background:var(--nv-btn);color:var(--nv-on)}
  .nv-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nv-soft);color:var(--nv-ink);border:1px solid var(--nv-line);border-radius:9999px;font-weight:700;cursor:pointer;transition:transform .12s ease,background-color .12s ease,box-shadow .12s ease}
  .nv-btn:hover{background:var(--nv-gray);transform:translateY(-1px)}
  .nv-btn:active{transform:scale(.94)}
  .nv-btn-danger{background:#dc2626;color:#fff;border-color:#dc2626}
  .nv-btn-danger:hover{background:#b91c1c}
  .nv-btn:focus-visible,.nv-link:focus-visible,.nv-tab:focus-visible,.nv-tog:focus-visible{outline:3px solid var(--nv-accent);outline-offset:2px}
  .nv-link{color:var(--nv-ink);border-radius:9999px}
  .nv-link:not(.nv-active):hover{background:var(--nv-card)}
  .nv-active,.nv-active:hover{background:var(--nv-btn);color:var(--nv-on);box-shadow:var(--nv-glow)}
  .nv-active svg,.nv-active span{color:var(--nv-on)}

  .nv-dock{border:1px solid var(--nv-line);box-shadow:var(--nv-shadow);border-radius:28px;background:var(--nv-card);position:relative}
  .nv-dock::after{content:"";position:absolute;bottom:5px;left:50%;width:84px;height:4px;margin-left:-42px;border-radius:9999px;background:var(--nv-soft-line);pointer-events:none}
  .nv-ico{color:var(--nv-ink);transition:transform .25s cubic-bezier(.2,.8,.2,1),background-color .2s ease,box-shadow .2s ease}
  .nv-ico-on{background:var(--nv-btn);color:var(--nv-on);transform:translateY(-10px);box-shadow:0 0 0 4px var(--nv-card),var(--nv-glow)}
  .nv-ico-on svg{color:var(--nv-on)}
  .nv-lbl{color:var(--nv-lbl);transform:translateY(-8px)}
  .nv-lbl-t{transition:transform .25s cubic-bezier(.2,.8,.2,1),color .2s ease}

  .nv-tog{position:relative;flex:none;display:inline-flex;align-items:center;padding:0;overflow:hidden;border-radius:9999px;
    border:1px solid var(--nv-line);cursor:pointer;
    background:linear-gradient(180deg,#7dd3fc 0%,#bae6fd 100%);
    transition:transform .12s ease,background .35s ease}
  .nv-tog:hover{transform:translateY(-1px)}
  .nv-tog:active{transform:scale(.95)}
  .nv-tog[aria-checked=true]{background:linear-gradient(180deg,#0f172a 0%,#312e81 100%)}
  .nv-tog::before,.nv-tog::after{content:"";position:absolute;inset:0;pointer-events:none;transition:opacity .35s ease}
  .nv-tog::before{
    background:
      radial-gradient(circle at 72% 72%,#fff 0 7px,transparent 8px),
      radial-gradient(circle at 84% 58%,#fff 0 5px,transparent 6px),
      radial-gradient(circle at 62% 78%,#fff 0 5px,transparent 6px);
    opacity:.95}
  .nv-tog::after{
    background:
      radial-gradient(circle at 70% 30%,#fff 0 1.3px,transparent 2.2px),
      radial-gradient(circle at 52% 66%,#fff 0 1px,transparent 2px),
      radial-gradient(circle at 38% 28%,#fff 0 1px,transparent 2px),
      radial-gradient(circle at 84% 68%,#fff 0 1.2px,transparent 2px);
    opacity:0}
  .nv-tog[aria-checked=true]::before{opacity:0}
  .nv-tog[aria-checked=true]::after{opacity:1}
  .nv-tog-thumb{position:absolute;top:50%;inset-inline-start:var(--off);width:var(--sz);height:var(--sz);margin-top:calc(var(--sz) / -2);
    display:flex;align-items:center;justify-content:center;z-index:1;
    transition:transform .35s cubic-bezier(.2,.8,.2,1)}
  .nv-tog[aria-checked=true] .nv-tog-thumb{transform:translateX(var(--tx))}
  [dir=rtl] .nv-tog[aria-checked=true] .nv-tog-thumb{transform:translateX(calc(var(--tx) * -1))}
  .nv-tog-ico{transition:transform .5s cubic-bezier(.2,.8,.2,1)}
  .nv-sun{color:#fbbf24;filter:drop-shadow(0 0 6px rgba(251,191,36,.9))}
  .nv-moon{color:#e2e8f0;filter:drop-shadow(0 0 5px rgba(226,232,240,.7));transform:rotate(-20deg)}

  @keyframes navPop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
  .nav-pop { animation: navPop 0.14s cubic-bezier(.2,.8,.2,1) both; }
  .nav-scroll::-webkit-scrollbar { width: 6px; }
  .nav-scroll::-webkit-scrollbar-thumb { background: var(--nv-soft-line); border-radius: 9999px; }
  .nv-dark .nav-scroll::-webkit-scrollbar-thumb { background: #4a4a4a; }
  .Toastify__toast { font-family: 'Space Grotesk', 'Cairo', sans-serif; border-radius: 16px !important; box-shadow: 0 10px 30px -8px rgba(15,42,31,.25); }
  .Toastify__toast--dark { background: #262626; }
  @media (prefers-reduced-motion: reduce) {
    .nav-pop { animation: none !important; }
    .nv-bar,.nv-btn,.nv-tog,.nv-tog-thumb,.nv-tog-ico,.nv-tog::before,.nv-tog::after,.nv-ico,.nv-lbl-t { transition: none; }
  }
`;

let cssInjected = false;
const useNavCss = () => {
  useEffect(() => {
    ensureNbFont();
    if (cssInjected || typeof document === 'undefined') return;
    const tag = document.createElement('style');
    tag.setAttribute('data-navbar-styles', 'true');
    tag.textContent = NAV_CSS;
    document.head.appendChild(tag);
    cssInjected = true;
  }, []);
};

const clearAccountCache = () => {
  try { Object.keys(window.sessionStorage).filter((k) => k.startsWith('acct:')).forEach((k) => window.sessionStorage.removeItem(k)); } catch { }
};

const LEGACY_AUTH_KEYS = ['authToken', 'refreshToken', 'id'];
const clearLegacyAuth = () => {
  try { LEGACY_AUTH_KEYS.forEach((k) => window.localStorage.removeItem(k)); } catch { }
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DESKTOP_MQ = '(min-width: 768px)';
let mql = null;
const getMql = () => (mql ||= window.matchMedia(DESKTOP_MQ));
const subscribeMq = (cb) => {
  const m = getMql();
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const getMq = () => getMql().matches;
const getMqServer = () => true;
const useIsDesktop = () => useSyncExternalStore(subscribeMq, getMq, getMqServer);

const AUTH_ITEMS = [
  { key: 'home', path: '/', Icon: RiHome4Line, ActiveIcon: RiHome4Fill, size: 17 },
  { key: 'devices', path: '/devices', Icon: RiDeviceLine, ActiveIcon: RiDeviceFill, size: 17 },
  { key: 'shops', path: '/shops', Icon: RiStore2Line, ActiveIcon: RiStore2Fill, size: 17 },
  { key: 'track', path: '/track', Icon: RiTruckLine, ActiveIcon: RiTruckFill, size: 17 },
  { key: 'account', path: '/account', Icon: RiAccountBoxLine, ActiveIcon: RiAccountBoxFill, size: 17 },
];
const GUEST_ITEMS = [
  { key: 'home', path: '/', Icon: RiHome2Line, ActiveIcon: RiHome2Fill, size: 17 },
  { key: 'login', path: '/login', Icon: RiLoginCircleLine, ActiveIcon: RiLoginCircleFill, size: 17 },
  { key: 'signup', path: '/signup', Icon: RiUserAddLine, ActiveIcon: RiUserAddFill, size: 17 },
];

const notifKeyFor = (userId) => ['notifications', userId ?? 'anon'];

const Logo = memo(({ darkMode, heightClass }) => (
  <span className={`inline-flex items-center transition-all duration-200 ${darkMode ? 'px-2 py-1' : ''}`}>
    <img
      src={logo}
      alt="Tech & Restore"
      width={168}
      height={238}
      decoding="async"
      className={`w-auto select-none object-contain transition-[height] duration-200 ${heightClass}`}
    />
  </span>
));

const TOGGLE_SIZES = {
  md: { track: 'h-10 w-[84px]', icon: 26, vars: { '--sz': '28px', '--off': '4px', '--tx': '44px' } },
  sm: { track: 'h-8 w-[66px]', icon: 20, vars: { '--sz': '22px', '--off': '3px', '--tx': '34px' } },
};

const ThemeToggle = memo(({ darkMode, onToggle, label, size = 'md' }) => {
  const s = TOGGLE_SIZES[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={`nv-tog ${s.track}`}
      style={s.vars}
    >
      <span className="nv-tog-thumb" aria-hidden="true">
        {darkMode
          ? <RiMoonFill size={s.icon} className="nv-tog-ico nv-moon" />
          : <RiSunFill size={s.icon} className="nv-tog-ico nv-sun" />}
      </span>
    </button>
  );
});

const NotificationItem = memo(({ n, onDelete }) => (
  <div className={`nv-line group flex items-start gap-3 border-b px-5 py-3.5 last:border-b-0 ${!n.read ? 'nv-gray' : ''}`}>
    <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${!n.read ? 'bg-[color:var(--nv-btn)]' : 'bg-transparent'}`} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-extrabold">{n.title}</p>
      <p className="nv-muted mt-0.5 line-clamp-2 text-xs">{n.message}</p>
      <p className="nv-muted mt-1.5 text-[11px] font-bold">{formatTime(n.timestamp)}</p>
    </div>
    <button type="button" onClick={() => onDelete(n.id)} aria-label="Remove notification" className="nv-btn h-7 w-7 flex-shrink-0">
      <FiX size={13} />
    </button>
  </div>
));

const SKELETON_ROWS = [1, 2, 3];

const NotificationList = memo(({ notifications, loading, onDelete, t }) => {
  if (loading) {
    return (
      <div className="space-y-3 p-5">
        {SKELETON_ROWS.map((i) => <div key={i} className="nv-gray h-14 animate-pulse rounded-2xl motion-reduce:animate-none" />)}
      </div>
    );
  }
  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <DeviceScene compact className="h-20 w-28" />
        <p className="text-sm font-extrabold uppercase">{t('allCaughtUp')}</p>
      </div>
    );
  }
  return notifications.map((n) => <NotificationItem key={n.id} n={n} onDelete={onDelete} />);
});

const NotifHeader = memo(({ unread, onClose, t }) => (
  <div className="nv-line flex items-center justify-between border-b px-5 py-3.5">
    <div className="flex items-center gap-3">
      <span className="nv-num"><FiBell className="h-4 w-4" /></span>
      <div>
        <p className="text-sm font-extrabold uppercase">{t('notifications')}</p>
        {unread > 0 && <p className="text-xs font-bold"><span className="inline-block h-2 w-2 rounded-full bg-[color:var(--nv-btn)] align-middle" /> {unread} {t('unread')}</p>}
      </div>
    </div>
    <button type="button" onClick={onClose} aria-label="Close notifications" className="nv-btn h-8 w-8">
      <FiX size={16} />
    </button>
  </div>
));

const NotifPanel = memo(({ className, unread, notifications, loading, onClose, onDelete, t }) => (
  <div className={`nav-pop nv-card overflow-hidden ${className}`}>
    <NotifHeader unread={unread} onClose={onClose} t={t} />
    <div className="nav-scroll max-h-[340px] overflow-y-auto">
      <NotificationList notifications={notifications} loading={loading} onDelete={onDelete} t={t} />
    </div>
  </div>
));

const Badge = memo(({ count }) => (
  <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-[color:var(--nv-bg)]">
    {count > 9 ? '9+' : count}
  </span>
));

const DesktopLinks = memo(({ items }) => (
  <div className="nv-soft nv-soft-line flex items-center gap-1 rounded-full border p-1">
    {items.map(({ key, path, Icon, ActiveIcon, size, name }) => (
      <NavLink
        key={key}
        to={path}
        end={path === '/'}
        className={({ isActive }) =>
          `nv-link flex items-center gap-2 whitespace-nowrap px-4 py-2 text-[13.5px] font-bold transition-colors duration-150 ${isActive ? 'nv-active' : ''}`}
      >
        {({ isActive }) => {
          const Glyph = isActive ? ActiveIcon : Icon;
          return (
            <>
              <Glyph size={size} aria-hidden="true" />
              <span>{name}</span>
            </>
          );
        }}
      </NavLink>
    ))}
  </div>
));

const MobileTabs = memo(({ items, dir, fontStyle, tone, font }) => (
  <div
    dir={dir}
    style={fontStyle}
    className={`${tone} ${font} pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]`}
  >
    <div className="nv-dock pointer-events-auto flex items-end justify-around px-2 pb-4 pt-3">
      {items.map(({ key, path, Icon, ActiveIcon, size, name }) => (
        <NavLink key={key} to={path} end={path === '/'} className="nv-tab flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-0.5">
          {({ isActive }) => {
            const Glyph = isActive ? ActiveIcon : Icon;
            return (
              <>
                <span className={`nv-ico flex h-11 w-11 items-center justify-center rounded-full ${isActive ? 'nv-ico-on' : ''}`}>
                  <Glyph size={size + 5} aria-hidden="true" />
                </span>
                <span className={`nv-lbl-t max-w-full truncate text-[11px] leading-none ${isActive ? 'nv-lbl font-bold' : 'nv-muted font-semibold'}`}>{name}</span>
              </>
            );
          }}
        </NavLink>
      ))}
    </div>
  </div>
));

const NavbarContent = ({ onCartClick, darkMode, toggleDarkMode }) => {
  useNavCss();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const language = useAppLanguage();
  const isDesktop = useIsDesktop();
  const dir = languageDirection(language);
  const isRtl = dir === 'rtl';
  const t = useCallback((key) => getNavbarTranslation(language, key), [language]);

  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAuthenticated = !!token;
  const notifKey = useMemo(() => notifKeyFor(userId), [userId]);

  const rootRef = useRef(null);
  const notifRef = useRef(null);
  const progressRef = useRef(null);
  const lastScrollY = useRef(0);
  const notifOpenRef = useRef(false);

  const [showNotifications, setShowNotifications] = useState(false);
  notifOpenRef.current = showNotifications;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const root = rootRef.current;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
      if (root) {
        const tier = y > 120 ? 'deep' : y > 12 ? 'scrolled' : 'top';
        if (root.dataset.tier !== tier) root.dataset.tier = tier;
        const last = lastScrollY.current;
        let hide = root.dataset.hide === 'true';
        if (notifOpenRef.current) hide = false;
        else if (y > last && y > 160) hide = true;
        else if (y < last) hide = false;
        const next = hide ? 'true' : 'false';
        if (root.dataset.hide !== next) root.dataset.hide = next;
      }
      lastScrollY.current = y;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!showNotifications) return undefined;
    const onDown = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    const onKey = (e) => e.key === 'Escape' && setShowNotifications(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [showNotifications]);

  useEffect(() => { setShowNotifications(false); }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    let refreshToken = null;
    try { refreshToken = window.localStorage.getItem('refreshToken'); } catch { }
    try {
      if (token) await api.post('/api/auth/logout', refreshToken ? { refreshToken } : {});
    } catch { }
    clearAuth();
    clearLegacyAuth();
    clearAccountCache();
    clearClientCookie();
    clearGoogleMark();
    qc.clear();
    toast.success(t('loggedOut'));
    navigate('/login', { replace: true });
  }, [token, clearAuth, navigate, t, qc]);

  const { data: notifications = [], isLoading: loadingNotifs } = useQuery({
    queryKey: notifKey,
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/notifications/users', { signal });
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    retry: (count, err) => err?.response?.status !== 401 && count < 2,
  });
  const unreadCount = useMemo(() => notifications.reduce((c, n) => (n.read ? c : c + 1), 0), [notifications]);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/api/notifications/users/${id}`);
      qc.setQueryData(notifKey, (old) => (old ? old.filter((n) => n.id !== id) : []));
      toast.success(t('notificationRemoved'));
    } catch { toast.error(t('failedToDelete')); }
  }, [qc, t, notifKey]);

  const toggleNotifications = useCallback(() => setShowNotifications((v) => !v), []);
  const closeNotifications = useCallback(() => setShowNotifications(false), []);

  const navItems = useMemo(
    () => (isAuthenticated ? AUTH_ITEMS : GUEST_ITEMS).map((i) => ({ ...i, name: t(i.key) })),
    [isAuthenticated, t],
  );

  const tone = `nv ${darkMode ? 'nv-dark' : ''}`;
  const isAr = language === 'ar';
  const fontStyle = isAr ? undefined : NB_FONT_STYLE;
  const font = isAr ? 'font-cairo' : '';
  const shell = 'nv-bar fixed inset-x-0 top-0 z-50';

  const panelProps = useMemo(() => ({
    unread: unreadCount,
    notifications,
    loading: loadingNotifs,
    onClose: closeNotifications,
    onDelete: deleteNotification,
    t,
  }), [unreadCount, notifications, loadingNotifs, closeNotifications, deleteNotification, t]);

  const progressStyle = useMemo(() => ({
    transform: 'scaleX(0)',
    transformOrigin: isRtl ? 'right' : 'left',
    backgroundColor: darkMode ? '#39ff88' : '#10b981',
    boxShadow: darkMode ? '0 0 12px 2px rgba(57,255,136,.7)' : undefined,
  }), [isRtl, darkMode]);

  return (
    <div ref={rootRef} className="nv-root" data-tier="top" data-hide="false">
      <Defs3D />
      <Device3DStyles />
      <ToastContainer
        position="top-right"
        theme={darkMode ? 'dark' : 'light'}
        toastStyle={isAr ? TOAST_STYLE_AR : TOAST_STYLE_LTR}
      />

      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
        <div ref={progressRef} className="h-full w-full rounded-full will-change-transform" style={progressStyle} />
      </div>

      {isDesktop ? (
        <nav
          dir={dir}
          aria-label="Main"
          className={`${tone} ${font} ${shell} nv-desk flex items-center justify-between`}
          style={fontStyle}
        >
          <Link to="/" aria-label="Tech & Restore – home" className="flex-shrink-0 transition-transform duration-150 hover:scale-[1.03]">
            <Logo darkMode={darkMode} heightClass="h-14" />
          </Link>

          <DesktopLinks items={navItems} />

          <div className="flex flex-shrink-0 items-center gap-3">
            {isAuthenticated && (
              <>
                <div className="relative" ref={notifRef}>
                  <button type="button" onClick={toggleNotifications} aria-label={t('notifications')} aria-expanded={showNotifications} className="nv-btn relative h-10 w-10">
                    <FiBell size={19} />
                    {unreadCount > 0 && <Badge count={unreadCount} />}
                  </button>
                  {showNotifications && <NotifPanel className="absolute end-0 mt-4 w-[380px]" {...panelProps} />}
                </div>
                <button type="button" onClick={onCartClick} aria-label={t('cart')} className="nv-btn h-10 w-10">
                  <RiShoppingCartLine size={19} />
                </button>
              </>
            )}
            <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} />
            {isAuthenticated && (
              <button type="button" onClick={handleLogout} className="nv-btn nv-btn-danger h-10 px-4 text-[13px]">
                <RiLogoutBoxRLine size={16} /><span>{t('logout')}</span>
              </button>
            )}
          </div>
        </nav>
      ) : (
        <>
          <nav
            ref={notifRef}
            dir={dir}
            aria-label="Main"
            className={`${tone} ${font} ${shell} nv-mob`}
            style={fontStyle}
          >
            <div className="flex items-center justify-between px-4 py-2">
              <Link to="/" aria-label="Tech & Restore – home" className="flex-shrink-0">
                <Logo darkMode={darkMode} heightClass="nv-logo-m h-14" />
              </Link>
              <div className="flex items-center gap-2.5">
                {isAuthenticated && (
                  <>
                    <button type="button" onClick={toggleNotifications} aria-label={t('notifications')} aria-expanded={showNotifications} className="nv-btn relative h-9 w-9">
                      <FiBell size={17} />
                      {unreadCount > 0 && <Badge count={unreadCount} />}
                    </button>
                    <button type="button" onClick={onCartClick} aria-label={t('cart')} className="nv-btn h-9 w-9">
                      <RiShoppingCartLine size={17} />
                    </button>
                    <button type="button" onClick={handleLogout} aria-label={t('logout')} title={t('logout')} className="nv-btn nv-btn-danger h-9 w-9">
                      <RiLogoutBoxRLine size={17} />
                    </button>
                  </>
                )}
                <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} size="sm" />
              </div>
            </div>
            {showNotifications && <NotifPanel className="mx-3 mb-4" {...panelProps} />}
          </nav>

          <MobileTabs items={navItems} dir={dir} fontStyle={fontStyle} tone={tone} font={font} />
        </>
      )}
    </div>
  );
};

export default function Navbar(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <NavbarContent {...props} />
    </QueryClientProvider>
  );
}