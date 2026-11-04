import React, {
  useEffect, useState, useCallback, useMemo, useRef, useId, memo, useSyncExternalStore,
} from 'react';
import { useQuery, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiX, FiBell, FiChevronDown, FiChevronRight, FiMapPin, FiGlobe, FiCheck, FiPlus,
} from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../common/api/api';
import useAuthStore from '../../common/store/Auth';
import queryClient from '../../common/utils/queryClient';
import { clearClientCookie, clearGoogleMark } from '../../common/utils/googleSession';
import {
  RiAccountBoxLine, RiAccountBoxFill,
  RiDeviceLine,
  RiLoginCircleLine, RiLoginCircleFill,
  RiUserAddLine, RiUserAddFill,
  RiShoppingCartLine,
  RiStore2Line, RiStore2Fill,
  RiSunFill, RiMoonFill,
  RiTruckLine, RiTruckFill,
  RiHome2Line, RiHome2Fill,
  RiHome4Line, RiHome4Fill,
  RiToolsLine, RiToolsFill,
  RiPriceTag3Line, RiPriceTag3Fill,
  RiLogoutBoxRLine,
  RiFileList3Line,
  RiApps2Line,
  RiSmartphoneLine, RiMacbookLine, RiTabletLine, RiTv2Line, RiHeadphoneLine,
  RiCamera3Line, RiGamepadLine, RiComputerLine, RiPrinterLine, RiKeyboardLine, RiPlug2Line,
} from 'react-icons/ri';
import logo from '../../common/images/tech-restore-logo.webp';
import enTranslations from '../../locales/en/translation.json';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';

const NAVBAR_TRANSLATIONS = { en: enTranslations.navbar, ar: arTranslations.navbar, fr: frTranslations.navbar };

const NAV_LOCAL = {
  en: {
    allCategories: 'All categories', categories: 'Categories', login: 'Login', signup: 'Sign up',
    repair: 'Repair', offers: 'Offers', browseCategories: 'Browse by category',
    deliverTo: 'Delivering to', chooseAddress: 'Choose delivery address', addAddress: 'Add a delivery address', manageAddresses: 'Manage addresses',
    noAddresses: 'No saved addresses yet', language: 'Language', orders: 'Orders', defaultTag: 'Default', addressLoading: 'Loading…', emptyNotifHint: 'New updates about your orders and repairs will show up here.',
    removeNotification: 'Remove notification', closeNotifications: 'Close notifications', primaryNav: 'Primary', mainNav: 'Main',
  },
  ar: {
    allCategories: 'كل الفئات', categories: 'الفئات', login: 'تسجيل الدخول', signup: 'إنشاء حساب',
    repair: 'إصلاح', offers: 'العروض', browseCategories: 'تصفح حسب الفئة',
    deliverTo: 'التوصيل إلى', chooseAddress: 'اختر عنوان التوصيل', addAddress: 'أضف عنوان توصيل', manageAddresses: 'إدارة العناوين',
    noAddresses: 'لا توجد عناوين محفوظة بعد', language: 'اللغة', orders: 'الطلبات', defaultTag: 'افتراضي', addressLoading: 'جارٍ التحميل…', emptyNotifHint: 'ستظهر هنا التحديثات الجديدة حول طلباتك وإصلاحاتك.',
    removeNotification: 'حذف الإشعار', closeNotifications: 'إغلاق الإشعارات', primaryNav: 'التنقل الرئيسي', mainNav: 'القائمة',
  },
  fr: {
    allCategories: 'Toutes les catégories', categories: 'Catégories', login: 'Connexion', signup: "S'inscrire",
    repair: 'Réparation', offers: 'Offres', browseCategories: 'Parcourir par catégorie',
    deliverTo: 'Livraison à', chooseAddress: "Choisir l'adresse de livraison", addAddress: 'Ajouter une adresse de livraison', manageAddresses: 'Gérer les adresses',
    noAddresses: 'Aucune adresse enregistrée', language: 'Langue', orders: 'Commandes', defaultTag: 'Par défaut', addressLoading: 'Chargement…', emptyNotifHint: 'Les nouveautés sur vos commandes et réparations apparaîtront ici.',
    removeNotification: 'Supprimer la notification', closeNotifications: 'Fermer les notifications', primaryNav: 'Navigation principale', mainNav: 'Menu',
  },
};

const LANGUAGES = [['en', 'English'], ['ar', 'العربية'], ['fr', 'Français']];
const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES);
const isSupportedLanguage = (lang) => typeof lang === 'string' && Object.prototype.hasOwnProperty.call(LANGUAGE_NAMES, lang);

const getNavbarTranslation = (language, key) =>
  NAVBAR_TRANSLATIONS[language]?.[key] ||
  NAV_LOCAL[language]?.[key] ||
  NAVBAR_TRANSLATIONS.en?.[key] ||
  NAV_LOCAL.en[key] ||
  key;

const categoryRoute = (id) => `/products/category/${encodeURIComponent(id)}`;
const CATEGORY_PATH = /^\/products\/category\/([^/]+)/;

const EMPTY = [];
const TOAST_STYLE = { fontFamily: 'inherit', fontSize: 14, borderRadius: 12 };
const ADDRESSES_STATE = { section: 'addresses' };

const ADDRESS_STALE = 60 * 1000;
const NOTIF_POLL = 60 * 1000;
const NOTIF_MAX = 100;
const LOGOUT_TIMEOUT = 5000;
const DELIVER_KEY = 'deliveryAddressId';
const ID_PATTERN = /^[\w.-]{1,64}$/;

const toNavAddress = (a) => ({
  id: String(a.id),
  street: String(a.street ?? '').trim().slice(0, 80),
  building: String(a.building ?? '').trim().slice(0, 40),
  city: String(a.city ?? '').trim().slice(0, 60),
  state: String(a.state ?? '').trim().slice(0, 60),
  isDefault: !!a.isDefault,
});

const toNavNotification = (n) => ({
  id: n.id,
  title: String(n.title ?? '').slice(0, 120),
  message: String(n.message ?? '').slice(0, 300),
  read: !!n.read,
  timestamp: n.timestamp,
});

const readPickedAddress = () => {
  try {
    const v = window.localStorage.getItem(DELIVER_KEY);
    return v && ID_PATTERN.test(v) ? v : null;
  } catch { return null; }
};

const NAV_CSS = `
.nv-root{display:contents}
.nv{--bd:#e5e7eb;--sf:#ffffff;--sf2:#f3f4f6;--tx:#052e1e;--mu:rgba(5,46,30,.68);--acc:#059669;--ln:#000000;--shd:#000000;--dx:1;color:var(--tx)}
.nv[dir=rtl]{--dx:-1}
.nv-dark{--bd:rgba(255,255,255,.16);--sf:#1c1c1e;--sf2:#2a2a2e;--tx:#ffffff;--mu:rgba(255,255,255,.66);--acc:#39ff88;--ln:rgba(255,255,255,.16);--shd:#0b4a35}
.nv-poppins{font-family:'Poppins',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
.nv-head{transition:transform .2s cubic-bezier(.2,.8,.2,1);will-change:transform}
.nv-root[data-hide=true] .nv-head{transform:translate3d(0,-100%,0)}
.nav-scroll{scrollbar-width:thin;scrollbar-color:var(--acc) transparent;overscroll-behavior:contain}
.nv-hide{scrollbar-width:none}
.nv-hide::-webkit-scrollbar{display:none}
@keyframes navPop{from{opacity:0;transform:translate3d(0,-6px,0) scale(.98)}to{opacity:1;transform:none}}
@keyframes navBadge{0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
.nav-pop{animation:navPop .12s cubic-bezier(.2,.8,.2,1) both;transform-origin:top}
.nav-badge{animation:navBadge .22s cubic-bezier(.2,.8,.2,1) both}
@media (prefers-reduced-motion:reduce){.nav-pop,.nav-badge{animation:none!important}.nv-head{transition:none}}
`;

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap';

const injectNavAssets = () => {
  if (typeof document === 'undefined') return;
  const head = document.head;

  if (!document.getElementById('navbar-styles')) {
    const tag = document.createElement('style');
    tag.id = 'navbar-styles';
    tag.textContent = NAV_CSS;
    head.appendChild(tag);
  }

  if (document.getElementById('navbar-font')) return;

  const add = (rel, href, props) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    Object.assign(link, props);
    head.appendChild(link);
    return link;
  };

  add('preconnect', 'https://fonts.googleapis.com');
  add('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
  add('preload', FONT_HREF, { as: 'style', crossOrigin: 'anonymous' });
  const sheet = add('stylesheet', FONT_HREF, {
    id: 'navbar-font',
    media: 'print',
    crossOrigin: 'anonymous',
    referrerPolicy: 'no-referrer',
  });
  sheet.onload = () => { sheet.media = 'all'; };
};
injectNavAssets();

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const ICON_BTN = `relative inline-flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-lg text-[color:var(--tx)] transition-colors duration-150 hover:bg-[color:var(--sf2)] ${FOCUS}`;
const BAR_BG = 'bg-[#39ff88]';
const BAR_BTN = 'relative inline-flex h-10 min-w-10 flex-none cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-transparent px-2.5 text-sm font-bold text-emerald-950 transition-colors duration-150 hover:border-black hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60';
const BAR_BTN_ON = '!border-black bg-white';
const ROW_LINK = 'inline-flex h-9 flex-none items-center gap-2 whitespace-nowrap rounded-lg border-2 px-3 text-sm font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--acc)]';
const POPUP = 'nav-pop absolute z-50 overflow-hidden rounded-2xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--shd)]';
const POPUP_LABEL = 'border-b-2 border-[color:var(--ln)] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[color:var(--mu)] rtl:tracking-normal';

const clearAccountCache = () => {
  try { Object.keys(window.sessionStorage).filter((k) => k.startsWith('acct:')).forEach((k) => window.sessionStorage.removeItem(k)); } catch { }
};

const LEGACY_AUTH_KEYS = ['authToken', 'refreshToken', 'id', DELIVER_KEY];
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

const useDismiss = (open, close, ref, returnRef) => {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      close();
      returnRef?.current?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, ref, returnRef]);
};

const AUTH_ITEMS = [
  { key: 'home', path: '/', Icon: RiHome4Line, ActiveIcon: RiHome4Fill, size: 18 },
  { key: 'shops', path: '/shops', Icon: RiStore2Line, ActiveIcon: RiStore2Fill, size: 18 },
  { key: 'repair', path: '/repair', Icon: RiToolsLine, ActiveIcon: RiToolsFill, size: 18 },
  { key: 'offers', path: '/offers', Icon: RiPriceTag3Line, ActiveIcon: RiPriceTag3Fill, size: 18 },
  { key: 'track', path: '/track', Icon: RiTruckLine, ActiveIcon: RiTruckFill, size: 18 },
  { key: 'account', path: '/account', Icon: RiAccountBoxLine, ActiveIcon: RiAccountBoxFill, size: 18 },
];
const GUEST_ITEMS = [
  { key: 'home', path: '/', Icon: RiHome2Line, ActiveIcon: RiHome2Fill, size: 18 },
  { key: 'login', path: '/login', Icon: RiLoginCircleLine, ActiveIcon: RiLoginCircleFill, size: 18 },
  { key: 'signup', path: '/signup', Icon: RiUserAddLine, ActiveIcon: RiUserAddFill, size: 18 },
];

const notifKeyFor = (userId) => ['notifications', userId ?? 'anon'];

const Logo = memo(({ heightClass }) => (
  <img
    src={logo}
    alt="Tech & Restore"
    width={168}
    height={238}
    decoding="async"
    fetchPriority="high"
    draggable={false}
    referrerPolicy="no-referrer"
    className={`w-auto select-none object-contain ${heightClass}`}
  />
));

const LOGO_LINK = 'flex-shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

const CATEGORY_ICONS = [
  [/tablet|ipad|تابلت|tablette/i, RiTabletLine],
  [/laptop|notebook|macbook|لاب|محمول|portable/i, RiMacbookLine],
  [/phone|mobile|smart|هاتف|موبايل|جوال|mobil/i, RiSmartphoneLine],
  [/\btv\b|screen|monitor|display|تلفزيون|شاشة|écran|télévis/i, RiTv2Line],
  [/head|audio|speaker|sound|earb|سماع|صوت|casque|écouteur/i, RiHeadphoneLine],
  [/camera|photo|كاميرا|caméra/i, RiCamera3Line],
  [/game|gaming|console|play|ألعاب|jeu/i, RiGamepadLine],
  [/computer|\bpc\b|desktop|كمبيوتر|ordinateur/i, RiComputerLine],
  [/print|طابعة|imprim/i, RiPrinterLine],
  [/keyboard|mouse|accessor|اكسسوار|إكسسوار|ملحقات|accessoire/i, RiKeyboardLine],
  [/charger|power|battery|cable|شاحن|بطارية|chargeur|batterie/i, RiPlug2Line],
];
const iconCache = new Map();
const iconForCategory = (name) => {
  let icon = iconCache.get(name);
  if (!icon) {
    icon = RiDeviceLine;
    for (const [re, I] of CATEGORY_ICONS) {
      if (re.test(name)) { icon = I; break; }
    }
    iconCache.set(name, icon);
  }
  return icon;
};
const CategoryIcon = memo(({ name, size = 16 }) => {
  const Icon = iconForCategory(name);
  return <Icon aria-hidden="true" size={size} className="flex-none" />;
});

const ThemeToggle = memo(({ darkMode, onToggle, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={darkMode}
    aria-label={label}
    title={label}
    onClick={onToggle}
    className={BAR_BTN}
  >
    {darkMode ? <RiMoonFill aria-hidden="true" size={19} /> : <RiSunFill aria-hidden="true" size={19} />}
  </button>
));

const LogoutButton = memo(({ onLogout, label, busy }) => (
  <button
    type="button"
    onClick={onLogout}
    disabled={busy}
    aria-label={label}
    aria-busy={busy}
    title={label}
    className={BAR_BTN}
  >
    <RiLogoutBoxRLine aria-hidden="true" size={19} />
  </button>
));

const LangMenu = memo(({ language, onChange, label }) => {
  const location = useLocation();
  const wrapRef = useRef(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const pick = useCallback((lang) => { setOpen(false); onChange(lang); }, [onChange]);

  useDismiss(open, close, wrapRef);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div ref={wrapRef} className="relative flex-none">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        title={label}
        className={`${BAR_BTN} ${open ? BAR_BTN_ON : ''}`}
      >
        <FiGlobe aria-hidden="true" size={18} />
        <span className="hidden lg:inline">{LANGUAGE_NAMES[language] || language}</span>
        <FiChevronDown aria-hidden="true" size={14} className={`hidden transition-transform duration-150 motion-reduce:transition-none lg:inline ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={label} className={`${POPUP} end-0 top-full mt-3 min-w-[10rem] p-1`}>
          {LANGUAGES.map(([value, name]) => {
            const selected = value === language;
            return (
              <li key={value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(value)}
                  className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-start text-sm transition-colors duration-150 hover:bg-[color:var(--sf2)] ${FOCUS} ${selected ? 'bg-[color:var(--sf2)] font-extrabold text-[color:var(--acc)]' : 'font-semibold'}`}
                >
                  <span>{name}</span>
                  {selected && <FiCheck aria-hidden="true" size={15} strokeWidth={3} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

const AddressOption = memo(({ address, active, onPick, defaultLabel }) => {
  const pick = useCallback(() => onPick(address.id), [onPick, address.id]);
  const title = [address.street, address.building].filter(Boolean).join(', ') || address.city || '—';
  const sub = [address.city, address.state].filter(Boolean).join(', ');
  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={pick}
        className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors duration-150 hover:bg-[color:var(--sf2)] ${FOCUS} ${active ? 'bg-[color:var(--sf2)]' : ''}`}
      >
        <span className={`grid h-8 w-8 flex-none place-items-center rounded-full border-2 border-black ${active ? 'bg-[#39ff88] text-emerald-950' : 'bg-[color:var(--sf2)] text-[color:var(--acc)]'}`}>
          {active ? <FiCheck aria-hidden="true" size={15} strokeWidth={3} /> : <FiMapPin aria-hidden="true" size={15} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm ${active ? 'font-extrabold' : 'font-bold'}`}>{title}</span>
          {sub && <span className="block truncate text-xs font-medium text-[color:var(--mu)]">{sub}</span>}
        </span>
        {address.isDefault && (
          <span className="flex-none rounded-full bg-[#39ff88] px-2 py-0.5 text-[10px] font-extrabold text-emerald-950 ring-2 ring-black">{defaultLabel}</span>
        )}
      </button>
    </li>
  );
});

const DeliverMenu = memo(({ addresses, selected, loading, onSelect, onManage, t, mobile }) => {
  const location = useLocation();
  const wrapRef = useRef(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const pick = useCallback((id) => { setOpen(false); onSelect(id); }, [onSelect]);
  const manage = useCallback(() => { setOpen(false); onManage(); }, [onManage]);

  useDismiss(open, close, wrapRef);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const headline = loading
    ? t('addressLoading')
    : selected
      ? (selected.city || selected.state || selected.street || '—')
      : t('addAddress');
  const detail = selected && !loading ? [selected.street, selected.building].filter(Boolean).join(', ') : '';
  const hasAddresses = addresses.length > 0;

  return (
    <div ref={wrapRef} className={mobile ? 'min-w-0' : 'relative min-w-0 flex-none'}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open && hasAddresses ? listId : undefined}
        aria-label={`${t('deliverTo')}: ${headline}`}
        className={mobile
          ? 'inline-flex h-9 w-full cursor-pointer items-center gap-1.5 rounded-lg text-start text-xs font-semibold text-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black'
          : `${BAR_BTN} max-w-[15rem] !justify-start text-start ${open ? BAR_BTN_ON : ''}`}
      >
        <FiMapPin aria-hidden="true" size={mobile ? 15 : 20} className="flex-none" />
        {mobile ? (
          <span className="min-w-0 flex-1 truncate">
            <span className="text-emerald-950/70">{t('deliverTo')} </span>
            <span className="font-extrabold">{headline}</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[11px] font-semibold text-emerald-950/70">{t('deliverTo')}</span>
            <span className="block truncate text-sm font-extrabold">{headline}{detail && selected?.city ? ` • ${selected.street || detail}` : ''}</span>
          </span>
        )}
        <FiChevronDown aria-hidden="true" size={14} className={`flex-none transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`${POPUP} top-full mt-3 ${mobile ? 'inset-x-0' : 'start-0 w-80'}`}>
          <p className={POPUP_LABEL}>{t('chooseAddress')}</p>
          {hasAddresses ? (
            <ul id={listId} role="listbox" aria-label={t('chooseAddress')} className="nav-scroll max-h-72 overflow-y-auto p-1">
              {addresses.map((a) => (
                <AddressOption key={a.id} address={a} active={selected?.id === a.id} onPick={pick} defaultLabel={t('defaultTag')} />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-5 text-sm font-semibold text-[color:var(--mu)]">{loading ? t('addressLoading') : t('noAddresses')}</p>
          )}
          <button
            type="button"
            onClick={manage}
            className={`flex min-h-12 w-full cursor-pointer items-center gap-2 border-t-2 border-[color:var(--ln)] px-4 text-sm font-extrabold text-[color:var(--acc)] transition-colors duration-150 hover:bg-[color:var(--sf2)] ${FOCUS}`}
          >
            {hasAddresses ? <FiChevronRight aria-hidden="true" size={15} className="rtl:rotate-180" /> : <FiPlus aria-hidden="true" size={15} />}
            {hasAddresses ? t('manageAddresses') : t('addAddress')}
          </button>
        </div>
      )}
    </div>
  );
});

const CartLink = memo(({ count, label, active }) => (
  <Link
    to="/cart"
    aria-label={count > 0 ? `${label} (${count})` : label}
    aria-current={active ? 'page' : undefined}
    title={label}
    className={`${BAR_BTN} ${active ? BAR_BTN_ON : ''}`}
  >
    <RiShoppingCartLine aria-hidden="true" size={20} />
    <span className="hidden xl:inline">{label}</span>
    {count > 0 && (
      <span
        key={count}
        aria-hidden="true"
        dir="ltr"
        className="nav-badge absolute -end-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-black bg-black px-1 text-[10px] font-extrabold leading-none tabular-nums text-[#39ff88]"
      >
        {count > 99 ? '99+' : count}
      </span>
    )}
  </Link>
));

const NotificationItem = memo(({ n, onDelete, removeLabel }) => (
  <div className={`flex items-start gap-3 border-b border-[color:var(--bd)] px-4 py-3 last:border-b-0 ${!n.read ? 'bg-[color:var(--sf2)] [border-inline-start:4px_solid_var(--acc)]' : ''}`}>
    <div className="min-w-0 flex-1">
      <p className={`truncate text-sm ${!n.read ? 'font-extrabold' : 'font-semibold'}`}>{n.title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--mu)]">{n.message}</p>
      <p className="mt-1.5 text-[11px] font-semibold text-[color:var(--mu)]">{formatTime(n.timestamp)}</p>
    </div>
    <button type="button" onClick={() => onDelete(n.id)} aria-label={removeLabel} className={`${ICON_BTN} !h-8 !w-8`}>
      <FiX aria-hidden="true" size={14} />
    </button>
  </div>
));

const SKELETON_ROWS = [1, 2, 3];
const SKELETON_TABS = [1, 2, 3, 4, 5, 6];
const SKELETON_GRID = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const NotificationList = memo(({ notifications, loading, onDelete, t }) => {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {SKELETON_ROWS.map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-[color:var(--sf2)] motion-reduce:animate-none" />)}
      </div>
    );
  }
  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-black bg-[#39ff88] text-emerald-950">
          <FiBell aria-hidden="true" size={24} />
        </span>
        <p className="text-sm font-extrabold">{t('allCaughtUp')}</p>
        <p className="max-w-[16rem] text-xs font-medium text-[color:var(--mu)]">{t('emptyNotifHint')}</p>
      </div>
    );
  }
  const removeLabel = t('removeNotification');
  return notifications.map((n) => <NotificationItem key={n.id} n={n} onDelete={onDelete} removeLabel={removeLabel} />);
});

const NotifHeader = memo(({ unread, onClose, t }) => (
  <div className="flex items-center justify-between border-b-2 border-[color:var(--ln)] px-4 py-3">
    <div>
      <p className="text-sm font-extrabold">{t('notifications')}</p>
      {unread > 0 && <p className="text-xs font-semibold text-[color:var(--mu)]"><span dir="ltr" className="tabular-nums">{unread}</span> {t('unread')}</p>}
    </div>
    <button type="button" onClick={onClose} aria-label={t('closeNotifications')} className={`${ICON_BTN} !h-8 !w-8`}>
      <FiX aria-hidden="true" size={16} />
    </button>
  </div>
));

const NotifPanel = memo(({ className, unread, notifications, loading, onClose, onDelete, t }) => (
  <div className={`nav-pop z-50 overflow-hidden rounded-2xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--shd)] ${className}`}>
    <NotifHeader unread={unread} onClose={onClose} t={t} />
    <div className="nav-scroll max-h-[340px] overflow-y-auto">
      <NotificationList notifications={notifications} loading={loading} onDelete={onDelete} t={t} />
    </div>
  </div>
));

const BarLinks = memo(({ items }) => (
  <>
    {items.map(({ key, path, Icon, ActiveIcon, size, name }) => (
      <NavLink
        key={key}
        to={path}
        end={path === '/'}
        className={({ isActive }) => `${ROW_LINK} ${isActive ? 'border-[color:var(--ln)] bg-[#39ff88] text-emerald-950 [box-shadow:calc(var(--dx)*2px)_2px_0_0_var(--shd)]' : 'border-transparent text-[color:var(--tx)] hover:border-[color:var(--ln)] hover:bg-[color:var(--sf2)]'}`}
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
  </>
));

const CAT_TAB = 'inline-flex h-8 flex-none items-center gap-2 whitespace-nowrap rounded-lg border-2 px-3.5 text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black';

const CategoryLinks = memo(({ categories, loading, activeId }) => {
  if (loading) {
    return SKELETON_TABS.map((i) => (
      <span key={i} className="h-8 w-24 flex-none animate-pulse rounded-lg bg-black/15 motion-reduce:animate-none" />
    ));
  }
  return categories.map((cat) => {
    const active = activeId === cat.id;
    return (
      <Link
        key={cat.id}
        to={categoryRoute(cat.id)}
        aria-current={active ? 'page' : undefined}
        className={`${CAT_TAB} ${active ? 'border-black bg-black font-bold text-[#39ff88]' : 'border-transparent font-semibold text-emerald-950 hover:border-black hover:bg-white/50'}`}
      >
        <CategoryIcon name={cat.name} size={16} />
        <span>{cat.name}</span>
      </Link>
    );
  });
});

const CategoryMenu = memo(({ categories, loading, activeId, t }) => {
  const location = useLocation();
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  useDismiss(open, close, wrapRef, btnRef);

  const onEnter = useCallback(() => {
    if (window.matchMedia?.('(hover: hover)').matches) setOpen(true);
  }, []);
  const onLeave = useCallback(() => {
    if (window.matchMedia?.('(hover: hover)').matches) setOpen(false);
  }, []);

  return (
    <div ref={wrapRef} className="relative flex flex-none items-center" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={`inline-flex h-9 flex-none cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-lg border-2 px-3 text-sm font-extrabold transition-colors duration-150 hover:border-[color:var(--ln)] hover:bg-[color:var(--sf2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--acc)] ${open ? 'border-[color:var(--ln)] bg-[#39ff88] text-emerald-950' : 'border-transparent text-[color:var(--tx)]'}`}
      >
        <RiApps2Line aria-hidden="true" size={20} className={open ? '' : 'text-[color:var(--acc)]'} />
        <span>{t('allCategories')}</span>
        <FiChevronDown aria-hidden="true" size={16} className={`transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id={panelId} className={`${POPUP} start-0 top-full w-[min(44rem,calc(100vw-3rem))]`}>
          <p className={POPUP_LABEL}>{t('browseCategories')}</p>
          <nav aria-label={t('categories')} className="nav-scroll max-h-[min(70vh,26rem)] overflow-y-auto p-2">
            {loading ? (
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
                {SKELETON_GRID.map((i) => (
                  <span key={i} className="h-10 animate-pulse rounded-lg bg-[color:var(--sf2)] motion-reduce:animate-none" />
                ))}
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-1 lg:grid-cols-3">
                {categories.map((c) => {
                  const active = activeId === c.id;
                  return (
                    <li key={c.id}>
                      <Link
                        to={categoryRoute(c.id)}
                        onClick={close}
                        aria-current={active ? 'page' : undefined}
                        className={`group flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-sm transition-colors duration-150 hover:bg-[color:var(--sf2)] ${FOCUS} ${active ? 'bg-[color:var(--sf2)] font-extrabold text-[color:var(--acc)]' : 'font-semibold'}`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="text-[color:var(--acc)]"><CategoryIcon name={c.name} size={17} /></span>
                          <span className="min-w-0 truncate">{c.name}</span>
                        </span>
                        <FiChevronRight aria-hidden="true" size={14} className="flex-none opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60 rtl:rotate-180" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>
        </div>
      )}
    </div>
  );
});

const MobileTabs = memo(({ items, dir, tone, font, label }) => (
  <nav
    dir={dir}
    aria-label={label}
    className={`${tone} ${font} fixed inset-x-0 bottom-0 z-50 border-t-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] pb-[env(safe-area-inset-bottom)]`}
  >
    <div className="flex items-stretch justify-around px-0.5">
      {items.map(({ key, path, Icon, ActiveIcon, size, name }) => (
        <NavLink key={key} to={path} end={path === '/'} className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 ${FOCUS}`}>
          {({ isActive }) => {
            const Glyph = isActive ? ActiveIcon : Icon;
            return (
              <>
                <span className={`grid h-7 w-12 place-items-center rounded-full border-2 transition-colors duration-150 ${isActive ? 'border-[color:var(--ln)] bg-[#39ff88] text-emerald-950' : 'border-transparent text-[color:var(--mu)]'}`}>
                  <Glyph size={size + 2} aria-hidden="true" />
                </span>
                <span className={`max-w-full truncate px-0.5 text-[10px] leading-none ${isActive ? 'font-extrabold text-[color:var(--tx)]' : 'font-semibold text-[color:var(--mu)]'}`}>{name}</span>
              </>
            );
          }}
        </NavLink>
      ))}
    </div>
  </nav>
));

const NavbarContent = ({ cartCount = 0, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const language = useAppLanguage();
  const isDesktop = useIsDesktop();
  const dir = languageDirection(language);
  const t = useCallback((key) => getNavbarTranslation(language, key), [language]);

  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAuthenticated = !!token;
  const notifKey = useMemo(() => notifKeyFor(userId), [userId]);
  const count = Math.max(0, Math.trunc(Number(cartCount)) || 0);

  const rootRef = useRef(null);
  const notifRef = useRef(null);
  const lastScrollY = useRef(0);
  const overlayOpenRef = useRef(false);
  const prevPathRef = useRef(location.pathname);
  const loggingOutRef = useRef(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [pickedId, setPickedId] = useState(readPickedAddress);
  const [loggingOut, setLoggingOut] = useState(false);
  overlayOpenRef.current = showNotifications;

  const closeNotifications = useCallback(() => setShowNotifications(false), []);
  useDismiss(showNotifications, closeNotifications, notifRef);

  useEffect(() => {
    let raf = 0;
    if (rootRef.current) rootRef.current.dataset.hide = 'false';
    lastScrollY.current = window.scrollY;
    const update = () => {
      raf = 0;
      const root = rootRef.current;
      if (!root) return;
      const y = window.scrollY;
      const last = lastScrollY.current;
      if (Math.abs(y - last) < 6) return;
      let hide = root.dataset.hide === 'true';
      if (overlayOpenRef.current) hide = false;
      else if (y > last && y > 160) hide = true;
      else if (y < last) hide = false;
      const next = hide ? 'true' : 'false';
      if (root.dataset.hide !== next) root.dataset.hide = next;
      lastScrollY.current = y;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [location.pathname]);

  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (prevPathRef.current === '/account' && location.pathname !== '/account') {
      qc.invalidateQueries({ queryKey: ['navAddresses'] });
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, qc]);

  const handleLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoggingOut(true);
    let refreshToken = null;
    try { refreshToken = window.localStorage.getItem('refreshToken'); } catch { }
    try {
      if (token) await api.post('/api/auth/logout', refreshToken ? { refreshToken } : {}, { timeout: LOGOUT_TIMEOUT });
    } catch { }
    clearAuth();
    clearLegacyAuth();
    clearAccountCache();
    clearClientCookie();
    clearGoogleMark();
    qc.clear();
    setPickedId(null);
    setShowNotifications(false);
    toast.success(t('loggedOut'));
    navigate('/login', { replace: true });
    loggingOutRef.current = false;
    setLoggingOut(false);
  }, [token, clearAuth, navigate, t, qc]);

  const changeLanguage = useCallback((lang) => {
    if (!isSupportedLanguage(lang) || lang === language) return;
    try { window.localStorage.setItem('appLanguage', lang); } catch { }
    document.documentElement.lang = lang;
    document.documentElement.dir = languageDirection(lang);
    window.dispatchEvent(new Event('appLanguageChanged'));
  }, [language]);

  const { data: notifications = EMPTY, isLoading: loadingNotifs } = useQuery({
    queryKey: notifKey,
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/notifications/users', { signal });
      const list = res.data?.content || res.data || [];
      return (Array.isArray(list) ? list : [])
        .filter((n) => n && n.id != null)
        .slice(0, NOTIF_MAX)
        .map(toNavNotification);
    },
    enabled: isAuthenticated,
    refetchInterval: NOTIF_POLL,
    refetchIntervalInBackground: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: (c, err) => err?.response?.status !== 401 && c < 2,
  });
  const unreadCount = useMemo(() => notifications.reduce((c, n) => (n.read ? c : c + 1), 0), [notifications]);

  const { data: addresses = EMPTY, isLoading: loadingAddresses } = useQuery({
    queryKey: ['navAddresses', userId ?? 'anon'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/addresses', { signal });
      const raw = res.data?.content ?? res.data ?? [];
      return (Array.isArray(raw) ? raw : []).filter((a) => a && a.id != null).map(toNavAddress);
    },
    enabled: isAuthenticated,
    staleTime: ADDRESS_STALE,
    refetchOnWindowFocus: false,
    retry: (c, err) => err?.response?.status !== 401 && c < 1,
  });

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === pickedId) || addresses.find((a) => a.isDefault) || addresses[0] || null,
    [addresses, pickedId],
  );

  const selectAddress = useCallback((id) => {
    if (!ID_PATTERN.test(String(id))) return;
    setPickedId(id);
    try { window.localStorage.setItem(DELIVER_KEY, id); } catch { }
  }, []);
  const manageAddresses = useCallback(() => navigate('/account', { state: ADDRESSES_STATE }), [navigate]);

  const { data: categories = EMPTY, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/categories', { signal });
      const raw = res.data?.content || res.data?.data || res.data || [];
      const out = [];
      for (const c of Array.isArray(raw) ? raw : []) {
        if (!c || c.deleted || c.active === false) continue;
        const id = c.id ?? c._id;
        const name = String(c.name ?? c.categoryName ?? c.title ?? '').trim().slice(0, 40);
        if (id != null && name) out.push({ id: String(id), name });
      }
      return out;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (c, err) => err?.response?.status !== 401 && c < 1,
  });

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/api/notifications/users/${encodeURIComponent(id)}`);
      qc.setQueryData(notifKey, (old) => (old ? old.filter((n) => n.id !== id) : []));
      toast.success(t('notificationRemoved'));
    } catch { toast.error(t('failedToDelete')); }
  }, [qc, t, notifKey]);

  const toggleNotifications = useCallback(() => setShowNotifications((v) => !v), []);

  const navItems = useMemo(
    () => (isAuthenticated ? AUTH_ITEMS : GUEST_ITEMS).map((i) => ({ ...i, name: t(i.key) })),
    [isAuthenticated, t],
  );
  const barItems = useMemo(() => navItems.filter((i) => i.key !== 'account'), [navItems]);
  const guestHome = navItems[0];
  const guestBarItems = useMemo(() => [guestHome], [guestHome]);

  const tone = `nv ${darkMode ? 'nv-dark' : ''}`;
  const font = language === 'ar' ? 'font-cairo' : 'nv-poppins';
  const hasUnread = unreadCount > 0;
  const bellLabel = hasUnread ? `${t('notifications')} (${unreadCount} ${t('unread')})` : t('notifications');
  const activeCat = useMemo(() => {
    const m = CATEGORY_PATH.exec(location.pathname);
    if (!m) return '';
    try { return decodeURIComponent(m[1]); } catch { return m[1]; }
  }, [location.pathname]);
  const hasCategoryBar = isAuthenticated && (loadingCats || categories.length > 0);
  const ordersActive = location.pathname === '/my-orders';

  const panelProps = useMemo(() => ({
    unread: unreadCount,
    notifications,
    loading: loadingNotifs,
    onClose: closeNotifications,
    onDelete: deleteNotification,
    t,
  }), [unreadCount, notifications, loadingNotifs, closeNotifications, deleteNotification, t]);

  const bell = (
    <button type="button" onClick={toggleNotifications} aria-label={bellLabel} aria-expanded={showNotifications} className={`${BAR_BTN} ${showNotifications ? BAR_BTN_ON : ''}`}>
      <FiBell aria-hidden="true" size={19} fill={hasUnread ? 'currentColor' : 'none'} />
      {hasUnread && <span aria-hidden="true" className="absolute end-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#39ff88]" />}
    </button>
  );
  const cart = <CartLink count={count} label={t('cart')} active={location.pathname === '/cart'} />;
  const langMenu = <LangMenu language={language} onChange={changeLanguage} label={t('language')} />;
  const logoutButton = <LogoutButton onLogout={handleLogout} label={t('logout')} busy={loggingOut} />;
  const deliverMenu = (mobile) => (
    <DeliverMenu
      addresses={addresses}
      selected={selectedAddress}
      loading={loadingAddresses}
      onSelect={selectAddress}
      onManage={manageAddresses}
      t={t}
      mobile={mobile}
    />
  );

  return (
    <div ref={rootRef} className="nv-root" data-hide="false">
      <ToastContainer position="top-right" theme={darkMode ? 'dark' : 'light'} toastStyle={TOAST_STYLE} limit={3} />

      {isDesktop ? (
        <header dir={dir} className={`${tone} ${font} nv-head fixed inset-x-0 top-0 z-50`}>
          <div className={`${BAR_BG} border-b-[3px] border-black text-emerald-950`}>
            <div className="mx-auto flex h-16 max-w-[88rem] items-center gap-3 px-6 xl:gap-4">
              <Link to="/" aria-label="Tech & Restore – home" className={LOGO_LINK}>
                <Logo heightClass="h-10" />
              </Link>

              {isAuthenticated ? (
                <>
                  {deliverMenu(false)}
                  <div className="ms-auto flex flex-shrink-0 items-center gap-0.5">
                    {langMenu}
                    <div className="relative" ref={notifRef}>
                      {bell}
                      {showNotifications && <NotifPanel className="absolute end-0 top-full mt-3 w-[380px]" {...panelProps} />}
                    </div>
                    <Link
                      to="/my-orders"
                      aria-label={t('orders')}
                      aria-current={ordersActive ? 'page' : undefined}
                      title={t('orders')}
                      className={`${BAR_BTN} ${ordersActive ? BAR_BTN_ON : ''}`}
                    >
                      <RiFileList3Line aria-hidden="true" size={20} />
                      <span className="hidden xl:inline">{t('orders')}</span>
                    </Link>
                    <Link to="/account" aria-label={t('account')} title={t('account')} className={BAR_BTN}>
                      <RiAccountBoxLine aria-hidden="true" size={20} />
                      <span className="hidden xl:inline">{t('account')}</span>
                    </Link>
                    {cart}
                    <span aria-hidden="true" className="mx-1.5 h-6 w-0.5 bg-black/30" />
                    <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} />
                    {logoutButton}
                  </div>
                </>
              ) : (
                <div className="ms-auto flex flex-shrink-0 items-center gap-1.5">
                  {langMenu}
                  <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} />
                  <Link to="/login" className="ms-2 inline-flex h-10 items-center rounded-xl border-[3px] border-black px-4 text-sm font-bold text-emerald-950 transition-colors duration-150 hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">{t('login')}</Link>
                  <Link to="/signup" className="inline-flex h-10 items-center rounded-xl border-[3px] border-black bg-black px-4 text-sm font-bold text-[#39ff88] transition-colors duration-150 hover:bg-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">{t('signup')}</Link>
                </div>
              )}
            </div>
          </div>

          <div className="border-b-[3px] border-[color:var(--ln)] bg-[color:var(--sf)]">
            {isAuthenticated ? (
              <div className="mx-auto flex h-12 max-w-[88rem] items-center gap-1 px-6">
                {hasCategoryBar && (
                  <>
                    <CategoryMenu categories={categories} loading={loadingCats} activeId={activeCat} t={t} />
                    <span aria-hidden="true" className="mx-2 h-5 w-0.5 flex-none bg-[color:var(--ln)] opacity-30" />
                  </>
                )}
                <nav aria-label={t('mainNav')} className="nv-hide flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 pe-1">
                  <BarLinks items={barItems} />
                </nav>
              </div>
            ) : (
              <nav aria-label={t('mainNav')} className="mx-auto flex h-12 max-w-[88rem] items-center px-6">
                <BarLinks items={guestBarItems} />
              </nav>
            )}
          </div>
        </header>
      ) : (
        <>
          <header dir={dir} className={`${tone} ${font} nv-head fixed inset-x-0 top-0 z-50 border-b-[3px] border-black`}>
            <div className={`relative ${BAR_BG} text-emerald-950`} ref={notifRef}>
              <div className="flex h-14 items-center justify-between gap-1 px-3">
                <Link to="/" aria-label="Tech & Restore – home" className={LOGO_LINK}>
                  <Logo heightClass="h-8" />
                </Link>
                <div className="flex items-center gap-0.5">
                  {isAuthenticated && (
                    <>
                      {bell}
                      {cart}
                    </>
                  )}
                  {langMenu}
                  <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} />
                  {isAuthenticated && logoutButton}
                </div>
              </div>
              {isAuthenticated && (
                <div className="relative border-t-2 border-black/20 px-3">
                  {deliverMenu(true)}
                </div>
              )}
              {showNotifications && <NotifPanel className="absolute inset-x-3 top-full mt-2" {...panelProps} />}
            </div>

            {hasCategoryBar && (
              <nav aria-label={t('categories')} className={`nv-hide flex items-center gap-1 overflow-x-auto border-t-2 border-black/20 ${BAR_BG} px-2 py-1.5 text-emerald-950`}>
                <CategoryLinks categories={categories} loading={loadingCats} activeId={activeCat} />
              </nav>
            )}
          </header>

          <MobileTabs items={navItems} dir={dir} tone={tone} font={font} label={t('primaryNav')} />
        </>
      )}
    </div>
  );
};

const NavbarMemo = memo(NavbarContent);

export default function Navbar({ cartCount, darkMode, toggleDarkMode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NavbarMemo cartCount={cartCount} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </QueryClientProvider>
  );
}