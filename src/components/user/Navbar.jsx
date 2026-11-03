import React, {
  useEffect, useState, useCallback, useMemo, useRef, useId, useDeferredValue, memo, useSyncExternalStore,
} from 'react';
import { useQuery, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiX, FiBell, FiSearch, FiChevronDown, FiChevronRight, FiMapPin, FiGlobe, FiCheck, FiPlus,
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
import { money } from './Device3D';
import { clean, safeImageUrl } from './ListingKit';
import enTranslations from '../../locales/en/translation.json';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';

const NAVBAR_TRANSLATIONS = { en: enTranslations.navbar, ar: arTranslations.navbar, fr: frTranslations.navbar };

const NAV_LOCAL = {
  en: {
    searchPlaceholder: 'Search devices, brands and shops', search: 'Search', allCategories: 'All categories', categories: 'Categories', login: 'Login', signup: 'Sign up',
    searchProducts: 'Products', searchShops: 'Shops', searchAll: 'See all results for “{{q}}”', searchNone: 'No matches found', searchLoading: 'Searching…',
    repair: 'Repair', offers: 'Offers', browseCategories: 'Browse by category',
    deliverTo: 'Delivering to', chooseAddress: 'Choose delivery address', addAddress: 'Add a delivery address', manageAddresses: 'Manage addresses',
    noAddresses: 'No saved addresses yet', language: 'Language', orders: 'Orders', defaultTag: 'Default', addressLoading: 'Loading…', emptyNotifHint: 'New updates about your orders and repairs will show up here.',
    removeNotification: 'Remove notification', closeNotifications: 'Close notifications', primaryNav: 'Primary', mainNav: 'Main',
  },
  ar: {
    searchPlaceholder: 'ابحث عن الأجهزة والماركات والمتاجر', search: 'بحث', allCategories: 'كل الفئات', categories: 'الفئات', login: 'تسجيل الدخول', signup: 'إنشاء حساب',
    searchProducts: 'المنتجات', searchShops: 'المتاجر', searchAll: 'عرض كل النتائج لـ «{{q}}»', searchNone: 'لا توجد نتائج مطابقة', searchLoading: 'جارٍ البحث…',
    repair: 'إصلاح', offers: 'العروض', browseCategories: 'تصفح حسب الفئة',
    deliverTo: 'التوصيل إلى', chooseAddress: 'اختر عنوان التوصيل', addAddress: 'أضف عنوان توصيل', manageAddresses: 'إدارة العناوين',
    noAddresses: 'لا توجد عناوين محفوظة بعد', language: 'اللغة', orders: 'الطلبات', defaultTag: 'افتراضي', addressLoading: 'جارٍ التحميل…', emptyNotifHint: 'ستظهر هنا التحديثات الجديدة حول طلباتك وإصلاحاتك.',
    removeNotification: 'حذف الإشعار', closeNotifications: 'إغلاق الإشعارات', primaryNav: 'التنقل الرئيسي', mainNav: 'القائمة',
  },
  fr: {
    searchPlaceholder: 'Rechercher appareils, marques et boutiques', search: 'Rechercher', allCategories: 'Toutes les catégories', categories: 'Catégories', login: 'Connexion', signup: "S'inscrire",
    searchProducts: 'Produits', searchShops: 'Boutiques', searchAll: 'Voir tous les résultats pour « {{q}} »', searchNone: 'Aucun résultat', searchLoading: 'Recherche…',
    repair: 'Réparation', offers: 'Offres', browseCategories: 'Parcourir par catégorie',
    deliverTo: 'Livraison à', chooseAddress: "Choisir l'adresse de livraison", addAddress: 'Ajouter une adresse de livraison', manageAddresses: 'Gérer les adresses',
    noAddresses: 'Aucune adresse enregistrée', language: 'Langue', orders: 'Commandes', defaultTag: 'Par défaut', addressLoading: 'Chargement…', emptyNotifHint: 'Les nouveautés sur vos commandes et réparations apparaîtront ici.',
    removeNotification: 'Supprimer la notification', closeNotifications: 'Fermer les notifications', primaryNav: 'Navigation principale', mainNav: 'Menu',
  },
};

const LANGUAGES = [['en', 'English'], ['ar', 'العربية'], ['fr', 'Français']];
const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES);

const getNavbarTranslation = (language, key) =>
  NAVBAR_TRANSLATIONS[language]?.[key] ||
  NAV_LOCAL[language]?.[key] ||
  NAVBAR_TRANSLATIONS.en?.[key] ||
  NAV_LOCAL.en[key] ||
  key;

const searchRoute = (q) => `/devices?search=${encodeURIComponent(q)}`;
const categoryRoute = (id) => `/products/category/${encodeURIComponent(id)}`;
const productRoute = (id) => `/device/${encodeURIComponent(id)}`;
const shopRoute = (id) => `/shops/${encodeURIComponent(id)}`;
const CATEGORY_PATH = /^\/products\/category\/([^/]+)/;

const EMPTY = [];
const EMPTY_MATCH = Object.freeze({ products: EMPTY, shops: EMPTY });
const TOAST_STYLE = { fontFamily: 'inherit', fontSize: 14, borderRadius: 12 };
const ADDRESSES_STATE = { section: 'addresses' };

const SEARCH_MIN = 2;
const SEARCH_MAX = 100;
const SEARCH_PRODUCTS = 5;
const SEARCH_SHOPS = 3;
const SHOPS_FETCH_SIZE = 100;
const SEARCH_STALE = 5 * 60 * 1000;
const ADDRESS_STALE = 60 * 1000;
const NOTIF_POLL = 60 * 1000;
const DELIVER_KEY = 'deliveryAddressId';

const fold = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, '')
    .toLowerCase();

const toSearchProduct = (p) => {
  const price = Math.max(0, Number(p.price) || 0);
  const apiFinal = Number(p.finalPrice);
  const name = clean(String(p.name ?? ''), 120);
  const category = p.categoryName || (typeof p.category === 'string' ? p.category : '');
  return {
    id: String(p.id),
    name,
    image: safeImageUrl(p.imageUrl || p.image) || '',
    price: apiFinal > 0 && apiFinal < price ? apiFinal : price,
    _n: fold(name),
    _k: fold(`${name} ${p.brand || ''} ${category} ${p.description || ''}`),
  };
};

const toSearchShop = (s) => {
  const name = clean(String(s.name ?? ''), 120);
  const address = [s.shopAddress?.street, s.shopAddress?.city].filter((x) => typeof x === 'string' && x.trim()).join(', ');
  return {
    id: String(s.id),
    name,
    address,
    _n: fold(name),
    _k: fold(`${name} ${address} ${s.description || ''}`),
  };
};

const toNavAddress = (a) => ({
  id: String(a.id),
  street: String(a.street ?? '').trim().slice(0, 80),
  building: String(a.building ?? '').trim().slice(0, 40),
  city: String(a.city ?? '').trim().slice(0, 60),
  state: String(a.state ?? '').trim().slice(0, 60),
  isDefault: !!a.isDefault,
});

const readPickedAddress = () => {
  try { return window.localStorage.getItem(DELIVER_KEY); } catch { return null; }
};

const useSearchData = (enabled) => {
  const productsQ = useQuery({
    queryKey: ['navSearch', 'products'],
    enabled,
    staleTime: SEARCH_STALE,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/products', { signal });
      const raw = res.data?.content || res.data || [];
      return (Array.isArray(raw) ? raw : []).filter((p) => p && !p.deleted && p.id != null).map(toSearchProduct);
    },
  });
  const shopsQ = useQuery({
    queryKey: ['navSearch', 'shops'],
    enabled,
    staleTime: SEARCH_STALE,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/shops/all', { params: { page: 0, size: SHOPS_FETCH_SIZE }, signal });
      const raw = res.data?.content || (Array.isArray(res.data) ? res.data : []);
      return raw.filter((s) => s && s.id != null).map(toSearchShop);
    },
  });
  return {
    products: productsQ.data || EMPTY,
    shops: shopsQ.data || EMPTY,
    loading: enabled && (productsQ.isLoading || shopsQ.isLoading),
  };
};

const rankMatches = (items, term, limit) => {
  const tokens = term.split(/\s+/).filter(Boolean);
  if (!tokens.length) return EMPTY;
  const scored = [];
  for (const it of items) {
    if (!tokens.every((tk) => it._k.includes(tk))) continue;
    scored.push([it._n.startsWith(term) ? 0 : it._n.includes(term) ? 1 : 2, it]);
  }
  scored.sort((a, b) => a[0] - b[0]);
  return scored.slice(0, limit).map((x) => x[1]);
};

const NAV_CSS = `
.nv-root{display:contents}
.nv{--bd:#e5e7eb;--sf:#ffffff;--sf2:#f3f4f6;--tx:#111827;--mu:#4b5563;--acc:#059669;color:var(--tx)}
.nv-dark{--bd:#333333;--sf:#1e1e1e;--sf2:#2a2a2a;--tx:#ffffff;--mu:#a3a3a3;--acc:#34d399}
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

const injectNavCss = () => {
  if (typeof document === 'undefined' || document.getElementById('navbar-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'navbar-styles';
  tag.textContent = NAV_CSS;
  document.head.appendChild(tag);
};
injectNavCss();

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const ICON_BTN = `relative inline-flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-lg text-[color:var(--tx)] transition-colors duration-150 hover:bg-[color:var(--sf2)] ${FOCUS}`;
const BAR_BG = 'bg-emerald-600';
const BAR_BTN = 'relative inline-flex h-10 min-w-10 flex-none cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white';
const ROW_LINK = 'inline-flex h-9 flex-none items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--acc)]';
const POPUP = 'nav-pop absolute z-50 overflow-hidden rounded-2xl border border-[color:var(--bd)] bg-[color:var(--sf)] text-[color:var(--tx)] shadow-2xl shadow-black/15';
const POPUP_LABEL = 'border-b border-[color:var(--bd)] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[color:var(--mu)] rtl:tracking-normal';

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

const useDismiss = (open, close, ref) => {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close, ref]);
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
    className={`w-auto select-none object-contain ${heightClass}`}
  />
));

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
        className={BAR_BTN}
      >
        <FiGlobe aria-hidden="true" size={18} />
        <span className="hidden lg:inline">{LANGUAGE_NAMES[language] || language}</span>
        <FiChevronDown aria-hidden="true" size={14} className={`hidden transition-transform duration-150 motion-reduce:transition-none lg:inline ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={label} className={`${POPUP} end-0 top-full mt-2 min-w-[10rem] p-1`}>
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
        <span className={`grid h-8 w-8 flex-none place-items-center rounded-full ${active ? 'bg-emerald-600 text-white' : 'bg-[color:var(--sf2)] text-[color:var(--acc)]'}`}>
          {active ? <FiCheck aria-hidden="true" size={15} strokeWidth={3} /> : <FiMapPin aria-hidden="true" size={15} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm ${active ? 'font-extrabold' : 'font-bold'}`}>{title}</span>
          {sub && <span className="block truncate text-xs font-medium text-[color:var(--mu)]">{sub}</span>}
        </span>
        {address.isDefault && (
          <span className="flex-none rounded-full bg-[color:var(--sf2)] px-2 py-0.5 text-[10px] font-extrabold text-[color:var(--acc)] ring-1 ring-[color:var(--bd)]">{defaultLabel}</span>
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
          ? 'inline-flex h-9 w-full cursor-pointer items-center gap-1.5 rounded-lg text-start text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white'
          : `${BAR_BTN} max-w-[15rem] !justify-start text-start`}
      >
        <FiMapPin aria-hidden="true" size={mobile ? 15 : 20} className="flex-none" />
        {mobile ? (
          <span className="min-w-0 flex-1 truncate">
            <span className="text-white/80">{t('deliverTo')} </span>
            <span className="font-extrabold">{headline}</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[11px] font-semibold text-white/80">{t('deliverTo')}</span>
            <span className="block truncate text-sm font-extrabold">{headline}{detail && selected?.city ? ` • ${selected.street || detail}` : ''}</span>
          </span>
        )}
        <FiChevronDown aria-hidden="true" size={14} className={`flex-none transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`${POPUP} top-full mt-2 ${mobile ? 'inset-x-0' : 'start-0 w-80'}`}>
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
            className={`flex min-h-12 w-full cursor-pointer items-center gap-2 border-t border-[color:var(--bd)] px-4 text-sm font-extrabold text-[color:var(--acc)] transition-colors duration-150 hover:bg-[color:var(--sf2)] ${FOCUS}`}
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
    className={`${BAR_BTN} ${active ? 'bg-white/20' : ''}`}
  >
    <RiShoppingCartLine aria-hidden="true" size={20} />
    <span className="hidden xl:inline">{label}</span>
    {count > 0 && (
      <span
        key={count}
        aria-hidden="true"
        dir="ltr"
        className="nav-badge absolute -end-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-extrabold leading-none tabular-nums text-white ring-2 ring-emerald-600"
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
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--sf2)] text-[color:var(--acc)]">
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
  <div className="flex items-center justify-between border-b border-[color:var(--bd)] px-4 py-3">
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
  <div className={`nav-pop z-50 overflow-hidden rounded-2xl border border-[color:var(--bd)] bg-[color:var(--sf)] text-[color:var(--tx)] shadow-2xl shadow-black/15 ${className}`}>
    <NotifHeader unread={unread} onClose={onClose} t={t} />
    <div className="nav-scroll max-h-[340px] overflow-y-auto">
      <NotificationList notifications={notifications} loading={loading} onDelete={onDelete} t={t} />
    </div>
  </div>
));

const SearchThumb = memo(({ option }) => {
  if (option.kind === 'product') {
    return (
      <span className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-lg border border-[color:var(--bd)] bg-white">
        {option.item.image ? (
          <img
            src={option.item.image}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <RiDeviceLine aria-hidden="true" size={18} className="text-gray-400" />
        )}
      </span>
    );
  }
  return (
    <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-[color:var(--sf2)] text-[color:var(--acc)]">
      {option.kind === 'shop' ? <RiStore2Line aria-hidden="true" size={19} /> : <FiSearch aria-hidden="true" size={17} />}
    </span>
  );
});

const SearchRow = memo(({ id, index, option, active, label, onPick, onHover }) => {
  const pick = useCallback(() => onPick(option), [onPick, option]);
  const hover = useCallback(() => onHover(index), [onHover, index]);
  const isAll = option.kind === 'all';
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={pick}
      onMouseEnter={hover}
      className={`flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 ${active ? 'bg-[color:var(--sf2)]' : ''} ${isAll ? 'border-t border-[color:var(--bd)]' : ''}`}
    >
      <SearchThumb option={option} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${isAll ? 'font-extrabold text-[color:var(--acc)]' : 'font-bold'}`}>
          {isAll ? label : option.item.name}
        </span>
        {option.kind === 'product' && option.item.price > 0 && (
          <span dir="ltr" className="block truncate text-xs font-semibold tabular-nums text-[color:var(--mu)]">{money(option.item.price)}</span>
        )}
        {option.kind === 'shop' && option.item.address && (
          <span className="block truncate text-xs font-medium text-[color:var(--mu)]">{option.item.address}</span>
        )}
      </span>
    </li>
  );
});

const SearchBox = memo(({ value, setValue, placeholder, label, t, className = '', autoFocus = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const wrapRef = useRef(null);
  const listId = useId();
  const [warm, setWarm] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const deferred = useDeferredValue(value);
  const term = useMemo(() => fold(deferred).trim(), [deferred]);
  const hasTerm = term.length >= SEARCH_MIN;
  const { products, shops, loading } = useSearchData(warm);

  const matches = useMemo(
    () => (hasTerm ? { products: rankMatches(products, term, SEARCH_PRODUCTS), shops: rankMatches(shops, term, SEARCH_SHOPS) } : EMPTY_MATCH),
    [hasTerm, products, shops, term],
  );
  const found = matches.products.length + matches.shops.length;

  const options = useMemo(() => {
    if (!hasTerm) return EMPTY;
    const out = [];
    for (const p of matches.products) out.push({ key: `p${p.id}`, kind: 'product', item: p, to: productRoute(p.id) });
    for (const s of matches.shops) out.push({ key: `s${s.id}`, kind: 'shop', item: s, to: shopRoute(s.id) });
    out.push({ key: 'all', kind: 'all', to: searchRoute(value.trim()) });
    return out;
  }, [hasTerm, matches, value]);

  useEffect(() => { setActive(-1); }, [term]);
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useDismiss(open, useCallback(() => setOpen(false), []), wrapRef);

  const onFocus = useCallback(() => { setWarm(true); setOpen(true); }, []);
  const onChange = useCallback((e) => { setValue(e.target.value.slice(0, SEARCH_MAX)); setOpen(true); }, [setValue]);
  const onPick = useCallback((option) => { setOpen(false); navigate(option.to); }, [navigate]);
  const onHover = useCallback((i) => setActive(i), []);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (open) { setOpen(false); e.stopPropagation(); }
      return;
    }
    if (!options.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    }
  }, [open, options.length]);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    const chosen = open && active >= 0 ? options[active] : null;
    setOpen(false);
    navigate(chosen ? chosen.to : searchRoute(q));
  }, [value, open, active, options, navigate]);

  const showList = open && hasTerm;
  const allLabel = t('searchAll').split('{{q}}').join(value.trim());
  let lastKind = null;

  return (
    <form ref={wrapRef} role="search" onSubmit={onSubmit} className={`relative ${className}`}>
      <input
        type="search"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={label}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={SEARCH_MAX}
        enterKeyHint="search"
        className={`h-11 w-full rounded-xl border border-transparent bg-[color:var(--sf)] ps-4 pe-14 text-sm font-medium text-[color:var(--tx)] shadow-sm placeholder:text-[color:var(--mu)] ${FOCUS}`}
      />
      <button
        type="submit"
        aria-label={label}
        className={`absolute end-1 top-1 inline-flex h-9 w-10 items-center justify-center rounded-lg bg-[color:var(--acc)] text-white transition-opacity duration-150 hover:opacity-90 ${FOCUS}`}
      >
        <FiSearch aria-hidden="true" size={17} />
      </button>

      {showList && (
        <div className={`${POPUP} inset-x-0 top-full mt-2`}>
          <ul id={listId} role="listbox" aria-label={label} className="nav-scroll max-h-[380px] overflow-y-auto py-1">
            {found === 0 && (
              <li role="presentation" className="px-4 py-3 text-sm font-semibold text-[color:var(--mu)]">
                {loading ? t('searchLoading') : t('searchNone')}
              </li>
            )}
            {options.map((o, i) => {
              const header = o.kind !== 'all' && o.kind !== lastKind ? (
                <li role="presentation" className="px-4 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-wide text-[color:var(--mu)] rtl:tracking-normal">
                  {t(o.kind === 'product' ? 'searchProducts' : 'searchShops')}
                </li>
              ) : null;
              lastKind = o.kind;
              return (
                <React.Fragment key={o.key}>
                  {header}
                  <SearchRow id={`${listId}-${i}`} index={i} option={o} active={i === active} label={allLabel} onPick={onPick} onHover={onHover} />
                </React.Fragment>
              );
            })}
          </ul>
        </div>
      )}
    </form>
  );
});

const BarLinks = memo(({ items }) => (
  <>
    {items.map(({ key, path, Icon, ActiveIcon, size, name }) => (
      <NavLink
        key={key}
        to={path}
        end={path === '/'}
        className={({ isActive }) => `${ROW_LINK} ${isActive ? 'bg-[color:var(--sf2)] text-[color:var(--acc)]' : 'text-[color:var(--tx)] hover:bg-[color:var(--sf2)] hover:text-[color:var(--acc)]'}`}
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

const CAT_TAB = 'inline-flex h-8 flex-none items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white';

const CategoryLinks = memo(({ categories, loading, activeId }) => {
  if (loading) {
    return SKELETON_ROWS.concat(SKELETON_ROWS).map((i, idx) => (
      <span key={idx} className="h-8 w-24 flex-none animate-pulse rounded-lg bg-white/25 motion-reduce:animate-none" />
    ));
  }
  return categories.map((cat) => {
    const active = activeId === cat.id;
    return (
      <Link
        key={cat.id}
        to={categoryRoute(cat.id)}
        aria-current={active ? 'page' : undefined}
        className={`${CAT_TAB} ${active ? 'bg-white font-bold text-emerald-700' : 'font-semibold text-white/90 hover:bg-white/15 hover:text-white'}`}
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

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);
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
        className={`inline-flex h-9 flex-none cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-lg px-3 text-sm font-extrabold transition-colors duration-150 hover:bg-[color:var(--sf2)] hover:text-[color:var(--acc)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--acc)] ${open ? 'bg-[color:var(--sf2)] text-[color:var(--acc)]' : 'text-[color:var(--tx)]'}`}
      >
        <RiApps2Line aria-hidden="true" size={20} className="text-[color:var(--acc)]" />
        <span>{t('allCategories')}</span>
        <FiChevronDown aria-hidden="true" size={16} className={`transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id={panelId} className={`${POPUP} start-0 top-full w-[min(44rem,calc(100vw-3rem))]`}>
          <p className={POPUP_LABEL}>{t('browseCategories')}</p>
          <nav aria-label={t('categories')} className="nav-scroll max-h-[min(70vh,26rem)] overflow-y-auto p-2">
            {loading ? (
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
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
    className={`${tone} ${font} fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--bd)] bg-[color:var(--sf)] pb-[env(safe-area-inset-bottom)]`}
  >
    <div className="flex items-stretch justify-around px-0.5">
      {items.map(({ key, path, Icon, ActiveIcon, size, name }) => (
        <NavLink key={key} to={path} end={path === '/'} className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 ${FOCUS}`}>
          {({ isActive }) => {
            const Glyph = isActive ? ActiveIcon : Icon;
            return (
              <>
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 ${isActive ? 'bg-[color:var(--sf2)] text-[color:var(--acc)]' : 'text-[color:var(--mu)]'}`}>
                  <Glyph size={size + 2} aria-hidden="true" />
                </span>
                <span className={`max-w-full truncate px-0.5 text-[10px] leading-none ${isActive ? 'font-extrabold text-[color:var(--acc)]' : 'font-semibold text-[color:var(--mu)]'}`}>{name}</span>
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

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pickedId, setPickedId] = useState(readPickedAddress);
  overlayOpenRef.current = showNotifications || searchOpen;

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
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (prevPathRef.current === '/account' && location.pathname !== '/account') {
      qc.invalidateQueries({ queryKey: ['navAddresses'] });
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, qc]);

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
    setQuery('');
    setPickedId(null);
    toast.success(t('loggedOut'));
    navigate('/login', { replace: true });
  }, [token, clearAuth, navigate, t, qc]);

  const changeLanguage = useCallback((lang) => {
    if (!lang || lang === language) return;
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
      return Array.isArray(list) ? list : [];
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
  const toggleSearch = useCallback(() => setSearchOpen((v) => !v), []);

  const navItems = useMemo(
    () => (isAuthenticated ? AUTH_ITEMS : GUEST_ITEMS).map((i) => ({ ...i, name: t(i.key) })),
    [isAuthenticated, t],
  );
  const barItems = useMemo(() => navItems.filter((i) => i.key !== 'account'), [navItems]);
  const guestHome = navItems[0];
  const guestBarItems = useMemo(() => [guestHome], [guestHome]);

  const tone = `nv ${darkMode ? 'nv-dark' : ''}`;
  const font = language === 'ar' ? 'font-cairo' : 'font-jakarta';
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
    <button type="button" onClick={toggleNotifications} aria-label={bellLabel} aria-expanded={showNotifications} className={BAR_BTN}>
      <FiBell aria-hidden="true" size={19} fill={hasUnread ? 'currentColor' : 'none'} />
      {hasUnread && <span aria-hidden="true" className="absolute end-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-emerald-600" />}
    </button>
  );
  const cart = <CartLink count={count} label={t('cart')} active={location.pathname === '/cart'} />;
  const langMenu = <LangMenu language={language} onChange={changeLanguage} label={t('language')} />;
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
      <ToastContainer position="top-right" theme={darkMode ? 'dark' : 'light'} toastStyle={TOAST_STYLE} />

      {isDesktop ? (
        <header dir={dir} className={`${tone} ${font} nv-head fixed inset-x-0 top-0 z-50 shadow-md shadow-black/10`}>
          <div className={`${BAR_BG} text-white`}>
            <div className="mx-auto flex h-16 max-w-[88rem] items-center gap-3 px-6 xl:gap-4">
              <Link to="/" aria-label="Tech & Restore – home" className="flex-shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <Logo heightClass="h-10" />
              </Link>

              {isAuthenticated ? (
                <>
                  {deliverMenu(false)}
                  <SearchBox
                    value={query}
                    setValue={setQuery}
                    placeholder={t('searchPlaceholder')}
                    label={t('search')}
                    t={t}
                    className="min-w-0 max-w-3xl flex-1"
                  />
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
                      className={`${BAR_BTN} ${ordersActive ? 'bg-white/20' : ''}`}
                    >
                      <RiFileList3Line aria-hidden="true" size={20} />
                      <span className="hidden xl:inline">{t('orders')}</span>
                    </Link>
                    <Link to="/account" aria-label={t('account')} title={t('account')} className={BAR_BTN}>
                      <RiAccountBoxLine aria-hidden="true" size={20} />
                      <span className="hidden xl:inline">{t('account')}</span>
                    </Link>
                    {cart}
                    <span aria-hidden="true" className="mx-1.5 h-6 w-px bg-white/30" />
                    <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} />
                    <button type="button" onClick={handleLogout} aria-label={t('logout')} title={t('logout')} className={BAR_BTN}>
                      <RiLogoutBoxRLine aria-hidden="true" size={19} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="ms-auto flex flex-shrink-0 items-center gap-1.5">
                  {langMenu}
                  <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} />
                  <Link to="/login" className="ms-2 inline-flex h-10 items-center rounded-xl border border-white/60 px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{t('login')}</Link>
                  <Link to="/signup" className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-bold text-emerald-700 transition-colors duration-150 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{t('signup')}</Link>
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-[color:var(--bd)] bg-[color:var(--sf)]">
            {isAuthenticated ? (
              <div className="mx-auto flex h-12 max-w-[88rem] items-center gap-1 px-6">
                {hasCategoryBar && (
                  <>
                    <CategoryMenu categories={categories} loading={loadingCats} activeId={activeCat} t={t} />
                    <span aria-hidden="true" className="mx-2 h-5 w-px flex-none bg-[color:var(--bd)]" />
                  </>
                )}
                <nav aria-label={t('mainNav')} className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto nv-hide">
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
          <header dir={dir} className={`${tone} ${font} nv-head fixed inset-x-0 top-0 z-50 shadow-md shadow-black/10`}>
            <div className={`relative ${BAR_BG} text-white`} ref={notifRef}>
              <div className="flex h-14 items-center justify-between gap-2 px-3">
                <Link to="/" aria-label="Tech & Restore – home" className="flex-shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <Logo heightClass="h-8" />
                </Link>
                <div className="flex items-center gap-0.5">
                  {isAuthenticated && (
                    <>
                      <button type="button" onClick={toggleSearch} aria-label={t('search')} aria-expanded={searchOpen} className={BAR_BTN}>
                        <FiSearch aria-hidden="true" size={19} />
                      </button>
                      {bell}
                      {cart}
                    </>
                  )}
                  {langMenu}
                  <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} label={t('toggleTheme')} />
                </div>
              </div>
              {isAuthenticated && (
                <div className="relative border-t border-white/15 px-3">
                  {deliverMenu(true)}
                </div>
              )}
              {searchOpen && isAuthenticated && (
                <div className="border-t border-white/15 p-3">
                  <SearchBox
                    value={query}
                    setValue={setQuery}
                    placeholder={t('searchPlaceholder')}
                    label={t('search')}
                    t={t}
                    autoFocus
                  />
                </div>
              )}
              {showNotifications && <NotifPanel className="absolute inset-x-3 top-full mt-2" {...panelProps} />}
            </div>

            {hasCategoryBar && (
              <nav aria-label={t('categories')} className={`nv-hide flex items-center gap-1 overflow-x-auto border-t border-white/15 ${BAR_BG} px-2 py-1.5 text-white`}>
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