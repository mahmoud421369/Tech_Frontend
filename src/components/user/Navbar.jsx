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

const TOAST_STYLE = { fontFamily: 'inherit', fontSize: 14, borderRadius: 16 };

const NAV_CSS = `
html,body{overflow-x:hidden;max-width:100vw}
.nv-root{display:contents}
.nv{--dx:1;--ink:#022c22;--sh:#022c22;--acc:#34d399;--tx:#022c22;--mu:#4b5563;--sf:#ffffff;--sf2:#f3f4f6;color:var(--tx)}
.nv[dir=rtl]{--dx:-1}
.nv-dark{--ink:#000000;--sh:#000000;--acc:#39ff88;--tx:#ffffff;--mu:#a3a3a3;--sf:#2a2a2a;--sf2:#1e1e1e}
.nv-bar{background:var(--sf);border:3px solid var(--ink);border-radius:20px;box-shadow:calc(var(--dx)*5px) 5px 0 0 var(--sh);transition:transform .18s cubic-bezier(.2,.8,.2,1),margin .15s ease,padding .15s ease}
.nv-desk{margin:12px 16px 0;padding:8px 20px}
.nv-mob{margin:10px 12px 0}
.nv-root[data-tier=scrolled] .nv-desk{margin:8px 20px 0}
.nv-root[data-tier=deep] .nv-desk{margin:8px 20px 0;padding-block:4px}
.nv-root[data-tier=scrolled] .nv-mob,.nv-root[data-tier=deep] .nv-mob{margin:6px 12px 0}
.nv-root[data-tier=deep] .nv-logo-m{height:2.5rem}
.nv-root[data-hide=true] .nv-bar{transform:translate3d(0,-190%,0)}
.nv-card{background:var(--sf);color:var(--tx);border:3px solid var(--ink);border-radius:16px;box-shadow:calc(var(--dx)*6px) 6px 0 0 var(--sh)}
.nv-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:none;background:var(--sf);color:var(--tx);border:2px solid var(--ink);border-radius:12px;font-weight:800;cursor:pointer;box-shadow:calc(var(--dx)*3px) 3px 0 0 var(--sh);transition:transform .1s ease,box-shadow .1s ease}
.nv-btn:active{transform:translate3d(calc(var(--dx)*3px),3px,0);box-shadow:none}
.nv-btn-on{background:var(--acc);color:#022c22}
.nv-btn-danger{background:#ef4444;color:#ffffff}
.nv-btn:focus-visible,.nv-link:focus-visible,.nv-tab:focus-visible,.nv-tog:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.nv-link{display:flex;align-items:center;gap:8px;white-space:nowrap;padding:8px 14px;font-size:13.5px;font-weight:800;color:var(--tx);border:2px solid transparent;border-radius:12px;transition:background-color .12s ease,transform .12s ease}
.nv-link:not(.nv-active):hover{background:var(--sf2);transform:translate3d(0,-1px,0)}
.nv-active,.nv-active:hover{background:var(--acc);color:#022c22;border-color:var(--ink);box-shadow:calc(var(--dx)*2px) 2px 0 0 var(--sh)}
.nv-dock{background:var(--sf);border:3px solid var(--ink);border-radius:20px;box-shadow:calc(var(--dx)*5px) 5px 0 0 var(--sh)}
.nv-ico{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:2px solid transparent;border-radius:12px;color:var(--tx);transition:transform .18s cubic-bezier(.2,.8,.2,1),background-color .12s ease}
.nv-ico-on{background:var(--acc);color:#022c22;border-color:var(--ink);transform:translate3d(0,-6px,0);box-shadow:calc(var(--dx)*3px) 3px 0 0 var(--sh)}
.nv-lbl-t{transition:transform .18s cubic-bezier(.2,.8,.2,1)}
.nv-lbl{transform:translate3d(0,-4px,0)}
.nv-tog{position:relative;flex:none;display:inline-flex;align-items:center;padding:0;overflow:hidden;border-radius:9999px;border:2px solid var(--ink);cursor:pointer;background:linear-gradient(180deg,#7dd3fc 0%,#bae6fd 100%);box-shadow:calc(var(--dx)*3px) 3px 0 0 var(--sh);transition:transform .1s ease,background .3s ease,box-shadow .1s ease}
.nv-tog:active{transform:translate3d(calc(var(--dx)*3px),3px,0);box-shadow:none}
.nv-tog[aria-checked=true]{background:linear-gradient(180deg,#0f172a 0%,#312e81 100%)}
.nv-tog::before,.nv-tog::after{content:"";position:absolute;inset:0;pointer-events:none;transition:opacity .3s ease}
.nv-tog::before{background:radial-gradient(circle at 72% 72%,#fff 0 7px,transparent 8px),radial-gradient(circle at 84% 58%,#fff 0 5px,transparent 6px),radial-gradient(circle at 62% 78%,#fff 0 5px,transparent 6px);opacity:.95}
.nv-tog::after{background:radial-gradient(circle at 70% 30%,#fff 0 1.3px,transparent 2.2px),radial-gradient(circle at 52% 66%,#fff 0 1px,transparent 2px),radial-gradient(circle at 38% 28%,#fff 0 1px,transparent 2px),radial-gradient(circle at 84% 68%,#fff 0 1.2px,transparent 2px);opacity:0}
.nv-tog[aria-checked=true]::before{opacity:0}
.nv-tog[aria-checked=true]::after{opacity:1}
.nv-tog-thumb{position:absolute;top:50%;inset-inline-start:var(--off);width:var(--sz);height:var(--sz);margin-top:calc(var(--sz) / -2);display:flex;align-items:center;justify-content:center;z-index:1;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.nv-tog[aria-checked=true] .nv-tog-thumb{transform:translateX(var(--tx))}
[dir=rtl] .nv-tog[aria-checked=true] .nv-tog-thumb{transform:translateX(calc(var(--tx) * -1))}
.nv-sun{color:#fbbf24;filter:drop-shadow(0 0 6px rgba(251,191,36,.9))}
.nv-moon{color:#e2e8f0;filter:drop-shadow(0 0 5px rgba(226,232,240,.7));transform:rotate(-20deg)}
@keyframes navPop{from{opacity:0;transform:translate3d(0,-6px,0) scale(.98)}to{opacity:1;transform:none}}
.nav-pop{animation:navPop .12s cubic-bezier(.2,.8,.2,1) both;transform-origin:top}
.nav-scroll{scrollbar-width:thin;scrollbar-color:var(--acc) var(--sf2)}
.Toastify__toast{border:3px solid #022c22;border-radius:16px!important;box-shadow:4px 4px 0 #022c22}
.Toastify__toast--dark{background:#2a2a2a;border-color:#000;box-shadow:4px 4px 0 #000}
@media (prefers-reduced-motion:reduce){.nav-pop{animation:none!important}.nv-bar,.nv-btn,.nv-link,.nv-tog,.nv-tog-thumb,.nv-tog::before,.nv-tog::after,.nv-ico,.nv-lbl-t{transition:none}}
`;

const injectNavCss = () => {
  if (typeof document === 'undefined' || document.getElementById('navbar-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'navbar-styles';
  tag.textContent = NAV_CSS;
  document.head.appendChild(tag);
};
injectNavCss();

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';

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
  <span className={`inline-flex items-center ${darkMode ? 'px-2 py-1' : ''}`}>
    <img
      src={logo}
      alt="Tech & Restore"
      width={168}
      height={238}
      decoding="async"
      className={`w-auto select-none object-contain transition-[height] duration-150 motion-reduce:transition-none ${heightClass}`}
    />
  </span>
));

const TOGGLE_SIZES = {
  md: { track: 'h-10 w-[84px]', icon: 26, vars: { '--sz': '26px', '--off': '4px', '--tx': '44px' } },
  sm: { track: 'h-9 w-[66px]', icon: 20, vars: { '--sz': '20px', '--off': '4px', '--tx': '30px' } },
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
          ? <RiMoonFill size={s.icon} className="nv-moon" />
          : <RiSunFill size={s.icon} className="nv-sun" />}
      </span>
    </button>
  );
});

const NotificationItem = memo(({ n, onDelete }) => (
  <div className={`flex items-start gap-3 border-b-2 border-dotted border-[color:var(--ink)] px-4 py-3.5 last:border-b-0 ${!n.read ? 'bg-[color:var(--sf2)] [border-inline-start:5px_solid_var(--acc)]' : ''}`}>
    <div className="min-w-0 flex-1">
      <p className={`truncate text-sm ${!n.read ? 'font-extrabold' : 'font-bold'}`}>{n.title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs font-medium text-[color:var(--mu)]">{n.message}</p>
      <p className="mt-1.5 text-[11px] font-bold text-[color:var(--mu)]">{formatTime(n.timestamp)}</p>
    </div>
    <button type="button" onClick={() => onDelete(n.id)} aria-label="Remove notification" className={`nv-btn h-8 w-8 ${FOCUS}`}>
      <FiX aria-hidden="true" size={14} />
    </button>
  </div>
));

const SKELETON_ROWS = [1, 2, 3];

const NotificationList = memo(({ notifications, loading, onDelete, t }) => {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {SKELETON_ROWS.map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[color:var(--sf2)] motion-reduce:animate-none" />)}
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
  <div className="flex items-center justify-between border-b-[3px] border-[color:var(--ink)] px-4 py-3">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950"><FiBell aria-hidden="true" className="h-4 w-4" /></span>
      <div>
        <p className="text-sm font-extrabold uppercase">{t('notifications')}</p>
        {unread > 0 && <p className="text-xs font-bold text-[color:var(--mu)]"><span dir="ltr" className="tabular-nums">{unread}</span> {t('unread')}</p>}
      </div>
    </div>
    <button type="button" onClick={onClose} aria-label="Close notifications" className={`nv-btn h-9 w-9 ${FOCUS}`}>
      <FiX aria-hidden="true" size={16} />
    </button>
  </div>
));

const NotifPanel = memo(({ className, unread, notifications, loading, onClose, onDelete, t }) => (
  <div className={`nav-pop nv-card overflow-hidden ${className}`}>
    <NotifHeader unread={unread} onClose={onClose} t={t} />
    <div className="nav-scroll max-h-[340px] overflow-y-auto overscroll-contain">
      <NotificationList notifications={notifications} loading={loading} onDelete={onDelete} t={t} />
    </div>
  </div>
));

const DesktopLinks = memo(({ items }) => (
  <div className="flex items-center gap-1.5">
    {items.map(({ key, path, Icon, ActiveIcon, size, name }) => (
      <NavLink
        key={key}
        to={path}
        end={path === '/'}
        className={({ isActive }) => `nv-link ${isActive ? 'nv-active' : ''}`}
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

const MobileTabs = memo(({ items, dir, tone, font }) => (
  <div
    dir={dir}
    className={`${tone} ${font} pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]`}
  >
    <div className="nv-dock pointer-events-auto flex items-end justify-around px-2 pb-2.5 pt-3">
      {items.map(({ key, path, Icon, ActiveIcon, size, name }) => (
        <NavLink key={key} to={path} end={path === '/'} className="nv-tab flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-0.5">
          {({ isActive }) => {
            const Glyph = isActive ? ActiveIcon : Icon;
            return (
              <>
                <span className={`nv-ico ${isActive ? 'nv-ico-on' : ''}`}>
                  <Glyph size={size + 5} aria-hidden="true" />
                </span>
                <span className={`nv-lbl-t max-w-full truncate text-[11px] leading-none ${isActive ? 'nv-lbl font-extrabold' : 'font-semibold text-[color:var(--mu)]'}`}>{name}</span>
              </>
            );
          }}
        </NavLink>
      ))}
    </div>
  </div>
));

const NavbarContent = ({ onCartClick, darkMode, toggleDarkMode }) => {
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
  const font = isAr ? 'font-cairo' : 'font-jakarta';
  const shell = 'nv-bar fixed inset-x-0 top-0 z-50';
  const hasUnread = unreadCount > 0;
  const bellLabel = hasUnread ? `${t('notifications')} (${unreadCount} ${t('unread')})` : t('notifications');

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
  }), [isRtl, darkMode]);

  return (
    <div ref={rootRef} className="nv-root" data-tier="top" data-hide="false">
      <Defs3D />
      <Device3DStyles />
      <ToastContainer
        position="top-right"
        theme={darkMode ? 'dark' : 'light'}
        toastStyle={TOAST_STYLE}
      />

      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
        <div ref={progressRef} className="h-full w-full will-change-transform" style={progressStyle} />
      </div>

      {isDesktop ? (
        <nav
          dir={dir}
          aria-label="Main"
          className={`${tone} ${font} ${shell} nv-desk flex items-center justify-between`}
        >
          <Link to="/" aria-label="Tech & Restore – home" className={`flex-shrink-0 rounded-lg transition-transform duration-150 hover:scale-[1.03] motion-reduce:transition-none ${FOCUS}`}>
            <Logo darkMode={darkMode} heightClass="h-14" />
          </Link>

          <DesktopLinks items={navItems} />

          <div className="flex flex-shrink-0 items-center gap-3">
            {isAuthenticated && (
              <>
                <div className="relative" ref={notifRef}>
                  <button type="button" onClick={toggleNotifications} aria-label={bellLabel} aria-expanded={showNotifications} className={`nv-btn h-10 w-10 ${showNotifications || hasUnread ? 'nv-btn-on' : ''}`}>
                    <FiBell aria-hidden="true" size={19} fill={hasUnread ? 'currentColor' : 'none'} />
                  </button>
                  {showNotifications && <NotifPanel className="absolute end-0 mt-4 w-[380px]" {...panelProps} />}
                </div>
                <button type="button" onClick={onCartClick} aria-label={t('cart')} className="nv-btn h-10 w-10">
                  <RiShoppingCartLine aria-hidden="true" size={19} />
                </button>
              </>
            )}
            <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} />
            {isAuthenticated && (
              <button type="button" onClick={handleLogout} className="nv-btn nv-btn-danger h-10 px-4 text-[13px] uppercase">
                <RiLogoutBoxRLine aria-hidden="true" size={16} /><span>{t('logout')}</span>
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
          >
            <div className="flex items-center justify-between px-3 py-1.5">
              <Link to="/" aria-label="Tech & Restore – home" className={`flex-shrink-0 rounded-lg ${FOCUS}`}>
                <Logo darkMode={darkMode} heightClass="nv-logo-m h-14" />
              </Link>
              <div className="flex items-center gap-2.5">
                {isAuthenticated && (
                  <>
                    <button type="button" onClick={toggleNotifications} aria-label={bellLabel} aria-expanded={showNotifications} className={`nv-btn h-9 w-9 ${showNotifications || hasUnread ? 'nv-btn-on' : ''}`}>
                      <FiBell aria-hidden="true" size={17} fill={hasUnread ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={onCartClick} aria-label={t('cart')} className="nv-btn h-9 w-9">
                      <RiShoppingCartLine aria-hidden="true" size={17} />
                    </button>
                    <button type="button" onClick={handleLogout} aria-label={t('logout')} title={t('logout')} className="nv-btn nv-btn-danger h-9 w-9">
                      <RiLogoutBoxRLine aria-hidden="true" size={17} />
                    </button>
                  </>
                )}
                <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} size="sm" />
              </div>
            </div>
            {showNotifications && <NotifPanel className="mx-3 mb-4" {...panelProps} />}
          </nav>

          <MobileTabs items={navItems} dir={dir} tone={tone} font={font} />
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