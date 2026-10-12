import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiX, FiBell } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import {
  RiAccountBoxLine, RiDeviceLine, RiLoginBoxLine, RiRegisteredLine, RiShoppingCartLine,
  RiStore2Line, RiSunLine, RiMoonLine, RiTruckLine, RiHome2Line, RiLogoutBoxRLine, RiHome4Line,
} from 'react-icons/ri';
import logo from '../images/tech-restore-logo.webp'; // cropped version of the uploaded logo (168×238)
import { Defs3D, Device3DStyles, DeviceScene, Btn3D, Chip3D } from './Device3D';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';

const queryClient = new QueryClient();

const NAVBAR_TRANSLATIONS = { en: enTranslations.navbar, ar: arTranslations.navbar, fr: frTranslations.navbar };
const getNavbarTranslation = (language, key) => NAVBAR_TRANSLATIONS[language]?.[key] || NAVBAR_TRANSLATIONS.en?.[key] || key;

// Fonts are still loaded here (as before); everything else is Tailwind.
const NAV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap');
  html, body { overflow-x: hidden; max-width: 100vw; }
  .Toastify__toast { font-family: 'Poppins', sans-serif; }
  @keyframes navPop { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
  .nav-pop { animation: navPop 0.14s cubic-bezier(.2,.8,.2,1) both; }
  .nav-scroll::-webkit-scrollbar { width: 4px; }
  .nav-scroll::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { .nav-pop { animation: none !important; } }
`;
let cssInjected = false;
const useNavCss = () => {
  useEffect(() => {
    if (cssInjected || typeof document === 'undefined') return;
    const tag = document.createElement('style');
    tag.setAttribute('data-navbar-styles', 'true');
    tag.textContent = NAV_CSS;
    document.head.appendChild(tag);
    cssInjected = true;
  }, []);
};

const readStorage = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };

const formatTime = (ts) => {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ───────────── Logo: big, on a white tile in dark mode (the artwork has black outlines/text) ───────────── */
const Logo = memo(({ darkMode, heightClass }) => (
  <span className={`inline-flex items-center rounded-2xl transition-all duration-200 ${darkMode ? 'bg-white px-2 py-1 shadow-[0_3px_0_0_#022c22]' : ''}`}>
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

/* ───────────── Notifications ───────────── */
const NotificationList = memo(({ notifications, loading, onDelete, darkMode, t }) => {
  if (loading) {
    return (
      <div className="space-y-3 p-5">
        {[1, 2, 3].map((i) => <div key={i} className={`h-14 animate-pulse rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-emerald-50'}`} />)}
      </div>
    );
  }
  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <DeviceScene compact className="h-20 w-28" />
        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('allCaughtUp')}</p>
      </div>
    );
  }
  return notifications.map((n) => (
    <div key={n.id} className={`group flex items-start gap-3 border-b px-5 py-3.5 transition-colors ${
      darkMode ? `border-gray-800 hover:bg-emerald-500/5 ${!n.read ? 'bg-emerald-500/5' : ''}` : `border-emerald-50 hover:bg-emerald-50/60 ${!n.read ? 'bg-emerald-50/70' : ''}`
    }`}>
      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${!n.read ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{n.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.message}</p>
        <p className={`mt-1.5 text-[11px] font-medium ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>{formatTime(n.timestamp)}</p>
      </div>
      <button type="button" onClick={() => onDelete(n.id)} aria-label="Remove notification"
        className={`flex-shrink-0 rounded-lg p-1.5 opacity-100 transition-colors md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${darkMode ? 'text-gray-500 hover:bg-rose-500/20 hover:text-rose-400' : 'text-gray-300 hover:bg-rose-50 hover:text-rose-500'}`}>
        <FiX size={13} />
      </button>
    </div>
  ));
});

const NotifHeader = ({ unread, onClose, darkMode, t }) => (
  <div className={`flex items-center justify-between border-b px-5 py-3.5 ${darkMode ? 'border-gray-800' : 'border-emerald-100'}`}>
    <div className="flex items-center gap-3">
      <Chip3D className="h-9 w-9"><FiBell className="h-4 w-4" /></Chip3D>
      <div>
        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('notifications')}</p>
        {unread > 0 && <p className="text-xs font-medium text-emerald-500">{unread} {t('unread')}</p>}
      </div>
    </div>
    <button type="button" onClick={onClose} aria-label="Close notifications"
      className={`rounded-lg p-1.5 transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-emerald-100 hover:text-gray-700'}`}>
      <FiX size={16} />
    </button>
  </div>
);

const Badge = ({ count }) => (
  <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_2px_0_0_#9f1239]">
    {count > 9 ? '9+' : count}
  </span>
);

/* ───────────── Navbar ───────────── */
const NavbarContent = ({ onCartClick, darkMode, toggleDarkMode }) => {
  useNavCss();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const language = useAppLanguage();
  const isRtl = languageDirection(language) === 'rtl';
  const t = useCallback((key) => getNavbarTranslation(language, key), [language]);

  const notifRef = useRef(null);
  const progressRef = useRef(null);
  const lastScrollY = useRef(0);

  const [token, setToken] = useState(() => readStorage('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrollTier, setScrollTier] = useState('top');
  const [hideOnScroll, setHideOnScroll] = useState(false);

  /* scroll: tier + hide-on-scroll + progress bar (progress bypasses React: one style write per frame) */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
      const tier = y > 120 ? 'deep' : y > 12 ? 'scrolled' : 'top';
      setScrollTier((cur) => (cur === tier ? cur : tier));
      const last = lastScrollY.current;
      if (y > last && y > 160) setHideOnScroll(true);
      else if (y < last) setHideOnScroll(false);
      lastScrollY.current = y;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [location.pathname]);

  // outside click / Escape closes the notification panel
  useEffect(() => {
    if (!showNotifications) return undefined;
    const onDown = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    const onKey = (e) => e.key === 'Escape' && setShowNotifications(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [showNotifications]);

  const isTokenExpired = useCallback((tk) => {
    if (!tk) return true;
    try { const d = jwtDecode(tk); return !d?.exp || d.exp < Date.now() / 1000; } catch { return true; }
  }, []);

  const handleLogout = useCallback(async () => {
    const refreshToken = readStorage('refreshToken');
    try { if (token && refreshToken) await api.post('/api/auth/logout', { refreshToken }); } catch { /* ignore */ }
    try { window.localStorage.clear(); } catch { /* ignore */ }
    setToken(null);
    setIsAuthenticated(false);
    toast.success(t('loggedOut'));
    navigate('/login', { replace: true });
  }, [token, navigate, t]);

  useEffect(() => {
    const cur = readStorage('authToken');
    if (!cur || isTokenExpired(cur)) {
      try { window.localStorage.removeItem('authToken'); window.localStorage.removeItem('refreshToken'); } catch { /* ignore */ }
      setIsAuthenticated(false);
      if (!['/login', '/signup'].includes(location.pathname)) navigate('/login');
    } else {
      setToken(cur);
      setIsAuthenticated(true);
    }
    setShowNotifications(false);
  }, [location.pathname, navigate, isTokenExpired]);

  const { data: notifications = [], isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications', token],
    queryFn: async () => {
      const res = await api.get('/api/notifications/users', { headers: { Authorization: `Bearer ${token}` } });
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: isAuthenticated && !!token,
    refetchInterval: 30000,
    staleTime: 15000,
  });
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/api/notifications/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      qc.setQueryData(['notifications', token], (old) => (old ? old.filter((n) => n.id !== id) : []));
      toast.success(t('notificationRemoved'));
    } catch { toast.error(t('failedToDelete')); }
  }, [token, qc, t]);

  const toggleNotifications = useCallback(() => setShowNotifications((v) => !v), []);
  const closeNotifications = useCallback(() => setShowNotifications(false), []);

  const navItems = useMemo(() => (isAuthenticated
    ? [
        { name: t('home'), path: '/', icon: <RiHome4Line size={17} /> },
        { name: t('devices'), path: '/devices', icon: <RiDeviceLine size={17} /> },
        { name: t('shops'), path: '/shops', icon: <RiStore2Line size={16} /> },
        { name: t('track'), path: '/track', icon: <RiTruckLine size={17} /> },
        { name: t('account'), path: '/account', icon: <RiAccountBoxLine size={16} /> },
      ]
    : [
        { name: t('home'), path: '/', icon: <RiHome2Line size={17} /> },
        { name: t('login'), path: '/login', icon: <RiLoginBoxLine size={16} /> },
        { name: t('signup'), path: '/signup', icon: <RiRegisteredLine size={16} /> },
      ]), [isAuthenticated, t]);

  const scrolled = scrollTier !== 'top';
  const deep = scrollTier === 'deep';

  const glass = darkMode
    ? `border-emerald-900/70 ${scrolled ? 'bg-[#04120b]/85 shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'bg-[#04120b]/60'}`
    : `border-emerald-100 ${scrolled ? 'bg-white/85 shadow-[0_10px_34px_rgba(5,150,105,0.12)]' : 'bg-white/60'}`;

  const desktopShellStyle = {
    marginInline: scrolled ? 16 : 0,
    marginTop: scrolled ? 10 : 0,
    borderRadius: scrolled ? 28 : 0,
    paddingInline: 28,
    paddingBlock: deep ? 6 : 10,
    transform: hideOnScroll ? 'translateY(-160%)' : 'translateY(0)',
  };
  const mobileShellStyle = {
    marginInline: scrolled ? 10 : 0,
    marginTop: scrolled ? 8 : 0,
    borderRadius: scrolled ? 24 : 0,
  };

  const shell = 'fixed inset-x-0 top-0 z-50 border backdrop-blur-xl transition-[background-color,box-shadow,margin,padding,border-radius,transform] duration-200';
  const font = language === 'ar' ? 'font-cairo' : 'font-poppins';
  const iconCls = darkMode ? 'text-emerald-400' : 'text-emerald-600';

  const notifPanel = (extra) => (
    <div className={`nav-pop overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl ${darkMode ? 'border-emerald-900/70 bg-gray-900/95' : 'border-emerald-100 bg-white/95'} ${extra}`}>
      <NotifHeader unread={unreadCount} onClose={closeNotifications} darkMode={darkMode} t={t} />
      <div className="nav-scroll max-h-[340px] overflow-y-auto">
        <NotificationList notifications={notifications} loading={loadingNotifs} onDelete={deleteNotification} darkMode={darkMode} t={t} />
      </div>
    </div>
  );

  return (
    <>
      <Defs3D />
      <Device3DStyles />
      <ToastContainer position="top-right" theme={darkMode ? 'dark' : 'light'} toastStyle={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Poppins', sans-serif", fontSize: 14 }} />

      {/* scroll progress indicator (always visible, above both bars) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
        <div
          ref={progressRef}
          className="h-full w-full bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.7)] will-change-transform"
          style={{ transform: 'scaleX(0)', transformOrigin: isRtl ? 'right' : 'left' }}
        />
      </div>

      {/* ───── desktop ───── */}
      <nav dir={languageDirection(language)} aria-label="Main" className={`${font} ${shell} ${glass} hidden items-center justify-between md:flex`} style={desktopShellStyle}>
        <Link to="/" aria-label="Tech & Restore – home" className="flex-shrink-0 transition-transform  duration-150 hover:scale-[1.03]">
          <Logo darkMode={darkMode} heightClass={deep ? 'h-14' : 'h-14'} />
        </Link>

        <div className={`flex items-center gap-1 rounded-2xl border p-1.5 ${darkMode ? 'border-emerald-900/70 bg-gray-900/60' : 'border-emerald-100 bg-emerald-50/70'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-[13.5px] font-bold transition-all duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  isActive
                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white ring-1 ring-inset ring-white/30 shadow-[0_3px_0_0_#047857]'
                    : darkMode ? 'text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-300' : 'text-emerald-900/80 hover:bg-white hover:text-emerald-700'
                }`}
            >
              {item.icon}<span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2.5">
          {isAuthenticated && (
            <>
              <div className="relative" ref={notifRef}>
                <Btn3D tone="soft" darkMode={darkMode} onClick={toggleNotifications} aria-label={t('notifications')} aria-expanded={showNotifications} className="relative h-10 w-10">
                  <FiBell size={19} className={iconCls} />
                  {unreadCount > 0 && <Badge count={unreadCount} />}
                </Btn3D>
                {showNotifications && notifPanel('absolute end-0 mt-3 w-[380px]')}
              </div>
              <Btn3D tone="soft" darkMode={darkMode} onClick={onCartClick} aria-label={t('cart')} className="h-10 w-10">
                <RiShoppingCartLine size={19} className={iconCls} />
              </Btn3D>
            </>
          )}
          <Btn3D tone="soft" darkMode={darkMode} onClick={toggleDarkMode} aria-label={t('toggleTheme')} className="h-10 w-10">
            {darkMode ? <RiMoonLine size={19} className="text-emerald-400" /> : <RiSunLine size={19} className="text-amber-500" />}
          </Btn3D>
          {isAuthenticated && (
            <Btn3D onClick={handleLogout} className="px-4 py-2.5 text-[13px]">
              <RiLogoutBoxRLine size={16} /><span>{t('logout')}</span>
            </Btn3D>
          )}
        </div>
      </nav>

      {/* ───── mobile top ───── */}
      <nav dir={languageDirection(language)} aria-label="Main" className={`${font} ${shell} ${glass} md:hidden`} style={mobileShellStyle}>
        <div className="flex items-center justify-between px-4 py-2">
          <Link to="/" aria-label="Tech & Restore – home" className="flex-shrink-0">
            <Logo darkMode={darkMode} heightClass={deep ? 'h-10' : 'h-14'} />
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <Btn3D tone="soft" darkMode={darkMode} onClick={toggleNotifications} aria-label={t('notifications')} aria-expanded={showNotifications} className="relative h-9 w-9">
                  <FiBell size={17} className={iconCls} />
                  {unreadCount > 0 && <Badge count={unreadCount} />}
                </Btn3D>
                <Btn3D tone="soft" darkMode={darkMode} onClick={onCartClick} aria-label={t('cart')} className="h-9 w-9">
                  <RiShoppingCartLine size={17} className={iconCls} />
                </Btn3D>
              </>
            )}
            <Btn3D tone="soft" darkMode={darkMode} onClick={toggleDarkMode} aria-label={t('toggleTheme')} className="h-9 w-9">
              {darkMode ? <RiMoonLine size={17} className="text-emerald-400" /> : <RiSunLine size={17} className="text-amber-500" />}
            </Btn3D>
          </div>
        </div>
        {showNotifications && notifPanel('mx-3 mb-3')}
      </nav>

      {/* ───── mobile bottom tabs ───── */}
      <div dir={languageDirection(language)} className={`${font} fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl md:hidden ${darkMode ? 'border-emerald-900/70 bg-[#04120b]/90' : 'border-emerald-100 bg-white/90'}`}>
        <div className="flex items-center justify-around px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1.5">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} className="flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-1 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
              {({ isActive }) => (
                <>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-100 ${
                    isActive ? 'bg-gradient-to-br from-emerald-300 to-emerald-600 text-white shadow-[0_3px_0_0_#047857]' : darkMode ? 'text-emerald-200/60' : 'text-gray-500'
                  }`}>{item.icon}</span>
                  <span className={`text-[10px] font-semibold ${isActive ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

export default function Navbar(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <NavbarContent {...props} />
    </QueryClientProvider>
  );
}